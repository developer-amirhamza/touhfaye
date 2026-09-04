import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { errorHandler } from "../utils/errorHandler";
import { getCartToken, getOrCreateCart } from "./cart.controllers";
import { sendEmail } from "../config/sendEmail";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { orderConfirmationTemplate } from "../utils/orderConfirmationTemplate";
import { getViewerRole, resolveUnitPrice } from "../services/pricing";




interface AuthRequest extends Request {
    userId?: string;
}
const generateOrderNumber = async () => {
    const date = new Date();
    const prefix = `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`

    let orderNumber = `${prefix}-001`;
    let counter = 1;
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
        orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
        counter++;
    }
    return orderNumber;
}


export const placeOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { firstName, lastName, phone, orderNote, shippingAddress, paymentMethod = "COD", fundingDetails } = req.body;
        const token = await getCartToken(req, res);
        const userId = req.userId;

        const cart = await getOrCreateCart(token, userId);
        if (!cart || cart.items.length === 0) {
            return errorHandler(res, 404, "The cart is empty!");
        }
        let email = req.body.email;
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return errorHandler(res, 404, "The user not found!");
            }
            email = user?.email;
        } else {
            if (!email) {
                return errorHandler(res, 404, "The email field is required!");
            }
        }

        if (!phone || !shippingAddress) {
            return errorHandler(res, 404, "Phone and Shipping address are required!");
        }

        // Funding orders (NDIS / Home Care Package) are completed WITHOUT an
        // instant card payment — validate the required funding info up front so
        // the order carries everything the team needs to claim the funds.
        let paymentStatus: string | undefined;
        if (paymentMethod === "NDIS") {
            const f = fundingDetails || {};
            if (!f.participantName || !f.ndisNumber || !f.dob || !f.fundingType) {
                return errorHandler(res, 400, "Please complete all NDIS participant details.");
            }
            if (!f.approved) {
                return errorHandler(res, 400, "Please approve payment from the participant's NDIS funding.");
            }
            paymentStatus = "Awaiting NDIS funding";
        } else if (paymentMethod === "HCP") {
            const f = fundingDetails || {};
            if (!f.participantName || !f.hcpNumber || !f.providerEmail) {
                return errorHandler(res, 400, "Please complete all Home Care Package details.");
            }
            if (!f.approved) {
                return errorHandler(res, 400, "Please approve payment from the participant's HCP funding.");
            }
            paymentStatus = "Awaiting HCP funding";
        }

        // Validate stock BEFORE creating the order — reject the whole order if
        // any line exceeds available stock, or the product is no longer sellable.
        for (const item of cart.items) {
            const product = item.product;
            if (!product.isActive || product.deletedAt) {
                return errorHandler(res, 400, `"${product.title}" is no longer available. Please remove it from your cart.`);
            }
            if (product.stock < item.quantity) {
                return errorHandler(res, 400, `Only ${product.stock} left in stock for "${product.title}".`);
            }
        }

        // Resolve each line at the buyer's own role (a Trade/Retailer/
        // Distributor/NDIS coordinator/Consumer-specific price if one is set
        // for that product, else the main retail price minus its discount —
        // a guest checkout has no role at all, so it always gets the main
        // price). This also fixes a pre-existing gap where this path never
        // applied the product's own retail discount at all.
        const role = await getViewerRole(userId);
        let subtotal = 0;
        const orderItemsData: {
            productName: string;
            productId: string;
            productImage: string | null;
            price: number;
            quantity: number;
            total: number;
        }[] = [];
        for (const item of cart.items) {
            const product = item.product;
            const unitPrice = await resolveUnitPrice({
                productId: product.id,
                role,
                quantity: item.quantity,
                userId,
            });
            const itemsTotal = +(unitPrice * item.quantity).toFixed(2);
            subtotal += itemsTotal;
            orderItemsData.push({
                productName: product.title,
                productId: product.id,
                productImage: product.images[0] || null,
                price: unitPrice,
                quantity: item.quantity,
                total: itemsTotal,
            })
        };
        const total = subtotal;
        const orderNumber = await generateOrderNumber()

        // Create the order and decrement stock atomically — if any product's
        // stock has changed since the check above (race with a concurrent
        // order), the decrement below would drive it negative; guard with a
        // conditional update inside the transaction.
        const order = await prisma.$transaction(async (tx) => {
            for (const item of cart.items) {
                const updated = await tx.product.updateMany({
                    where: { id: item.product.id, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });
                if (updated.count === 0) {
                    throw new Error(`"${item.product.title}" just sold out. Please update your cart.`);
                }
            }
            return tx.order.create({
                data: {
                    orderNumber,
                    shippingAddress,
                    firstName,
                    lastName,
                    orderNote,
                    phone,
                    email,                           // snapshot (user's email or guest's email)
                    subtotal,
                    total,
                    paymentMethod,
                    // Funding orders are marked awaiting their funding source;
                    // other methods keep the schema default ("Pending").
                    ...(paymentStatus ? { paymentStatus } : {}),
                    ...(fundingDetails ? { fundingDetails } : {}),
                    userId: userId || null,
                    items: { create: orderItemsData },
                },
                include: { items: true },
            });
        });

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        const orderWithNotes = order as typeof order & {
            orderNote?: string | null;
            adminNote?: string | null;
        };

        // Send order confirmation email with PDF invoice (non-blocking)
        if (email) {
            const invoiceData = {
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                firstName: order.firstName || firstName,
                lastName: order.lastName || lastName,
                email,
                phone: order.phone,
                orderNote: orderWithNotes.orderNote || orderNote,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                items: order.items.map((i) => ({
                    productName: i.productName,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.total,
                    productImage: i.productImage,
                })),
                subtotal: order.subtotal,
                shippingCost: order.shippingCost,
                tax: order.tax,
                total: order.total,
            };

            generateInvoicePdf(invoiceData)
                .then((pdfBuffer) =>
                    sendEmail({
                        sendTo: email,
                        subject: `Order Confirmed – ${order.orderNumber}`,
                        html: orderConfirmationTemplate(invoiceData),
                        attachments: [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdfBuffer }],
                    })
                )
                .catch((err) => console.error("Order email error:", err));
        }

        return errorHandler(res, 200, "Your order placed successfully!", false, order);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return errorHandler(res, 401, "Unauthorized, Please login again");
        }
        const order = await prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { items: true } });
        // An empty order history is a normal state, not an error.
        return errorHandler(res, 200, "Your order gotten successfully!", false, order);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!");
    }
};


export const getOrdersByOrderNumber = async (req: Request, res: Response) => {
    try {
        const { orderNumber, email } = req.query;
        if (!orderNumber || !email) {
            return errorHandler(res, 400, "Order Number and email are required");
        }

        const order = await prisma.order.findFirst({
            where: { orderNumber: orderNumber as string, email: email as string },
            include: { items: true }
        });
        if (!order) {
            return errorHandler(res, 404, "The order not found!");
        }
        return errorHandler(res, 200, "The order found successfully!", false, order);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!");
    }
};


export const getAllOrdersByAdmin = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: "desc" }
        });
        // No orders yet is a normal state for a fresh store, not an error.
        return errorHandler(res, 200, "All Orders", false, orders);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const updateOrderByAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.query;
        if (!orderId) return errorHandler(res, 400, "orderId is required");

        const { orderStatus, paymentStatus, adminNote } = req.body;
        if (!orderStatus && !paymentStatus) {
            return errorHandler(res, 400, "Provide at least one of orderStatus or paymentStatus");
        }

        const data: { orderStatus?: string; paymentStatus?: string; adminNote?: string; } = {};
        if (orderStatus) data.orderStatus = orderStatus;
        if (paymentStatus) data.paymentStatus = paymentStatus;
        if (adminNote) data.adminNote = adminNote;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId as string },
            data,
            include: { items: true }
        })
        return errorHandler(res, 200, "The order updated successfully!", false, updatedOrder);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!");
    }
};

// Admin: download an order's invoice as a PDF file.
export const downloadInvoiceByAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const orderId = String(req.params.orderId ?? "");
        if (!orderId) return errorHandler(res, 400, "orderId is required");

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) return errorHandler(res, 404, "Order not found");

        const orderWithNotes = order as typeof order & {
            orderNote?: string | null;
            adminNote?: string | null;
        };

        const pdf = await generateInvoicePdf({
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            firstName: order.firstName || "",
            lastName: order.lastName || "",
            email: order.email,
            phone: order.phone,
            orderNote: orderWithNotes.orderNote || "",
            adminNote: orderWithNotes.adminNote || "",
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            items: order.items.map((i) => ({
                productName: i.productName,
                quantity: i.quantity,
                price: i.price,
                total: i.total,
            })),
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            tax: order.tax,
            total: order.total,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.orderNumber}.pdf"`);
        return res.send(pdf);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!");
    }
};
