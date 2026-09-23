"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadInvoiceByAdmin = exports.updateOrderByAdmin = exports.getAllOrdersByAdmin = exports.getOrdersByOrderNumber = exports.getMyOrders = exports.placeOrder = void 0;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../utils/errorHandler");
const cart_controllers_1 = require("./cart.controllers");
const sendEmail_1 = require("../config/sendEmail");
const generateInvoicePdf_1 = require("../utils/generateInvoicePdf");
const orderConfirmationTemplate_1 = require("../utils/orderConfirmationTemplate");
const pricing_1 = require("../services/pricing");
const generateOrderNumber = async () => {
    const date = new Date();
    const prefix = `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
    let orderNumber = `${prefix}-001`;
    let counter = 1;
    while (await prisma_1.prisma.order.findUnique({ where: { orderNumber } })) {
        orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
        counter++;
    }
    return orderNumber;
};
// Delivery pricing: free over the threshold, otherwise a flat fee that
// depends on whether the address is inside Dhaka.
const FREE_DELIVERY_THRESHOLD = 1500;
const DELIVERY_COST_DHAKA = 60;
const DELIVERY_COST_OUTSIDE = 120;
const placeOrder = async (req, res) => {
    try {
        const { firstName, lastName, phone, orderNote, shippingAddress, paymentMethod = "COD", fundingDetails, deliveryArea } = req.body;
        const token = await (0, cart_controllers_1.getCartToken)(req, res);
        const userId = req.userId;
        const cart = await (0, cart_controllers_1.getOrCreateCart)(token, userId);
        if (!cart || cart.items.length === 0) {
            return (0, errorHandler_1.errorHandler)(res, 404, "The cart is empty!");
        }
        let email = req.body.email;
        if (userId) {
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return (0, errorHandler_1.errorHandler)(res, 404, "The user not found!");
            }
            email = user?.email;
        }
        else {
            if (!email) {
                return (0, errorHandler_1.errorHandler)(res, 404, "The email field is required!");
            }
        }
        if (!phone || !shippingAddress) {
            return (0, errorHandler_1.errorHandler)(res, 404, "Phone and Shipping address are required!");
        }
        // Funding orders (NDIS / Home Care Package) are completed WITHOUT an
        // instant card payment — validate the required funding info up front so
        // the order carries everything the team needs to claim the funds.
        let paymentStatus;
        if (paymentMethod === "NDIS") {
            const f = fundingDetails || {};
            if (!f.participantName || !f.ndisNumber || !f.dob || !f.fundingType) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Please complete all NDIS participant details.");
            }
            if (!f.approved) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Please approve payment from the participant's NDIS funding.");
            }
            paymentStatus = "Awaiting NDIS funding";
        }
        else if (paymentMethod === "HCP") {
            const f = fundingDetails || {};
            if (!f.participantName || !f.hcpNumber || !f.providerEmail) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Please complete all Home Care Package details.");
            }
            if (!f.approved) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Please approve payment from the participant's HCP funding.");
            }
            paymentStatus = "Awaiting HCP funding";
        }
        // Validate stock BEFORE creating the order — reject the whole order if
        // any line exceeds available stock, or the product is no longer sellable.
        for (const item of cart.items) {
            const product = item.product;
            if (!product.isActive || product.deletedAt) {
                return (0, errorHandler_1.errorHandler)(res, 400, `"${product.title}" is no longer available. Please remove it from your cart.`);
            }
            if (product.stock < item.quantity) {
                return (0, errorHandler_1.errorHandler)(res, 400, `Only ${product.stock} left in stock for "${product.title}".`);
            }
        }
        // Resolve each line at the buyer's own role (a Trade/Retailer/
        // Distributor/NDIS coordinator/Consumer-specific price if one is set
        // for that product, else the main retail price minus its discount —
        // a guest checkout has no role at all, so it always gets the main
        // price). This also fixes a pre-existing gap where this path never
        // applied the product's own retail discount at all.
        const role = await (0, pricing_1.getViewerRole)(userId);
        let subtotal = 0;
        const orderItemsData = [];
        for (const item of cart.items) {
            const product = item.product;
            const unitPrice = await (0, pricing_1.resolveUnitPrice)({
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
            });
        }
        ;
        const shippingCost = subtotal >= FREE_DELIVERY_THRESHOLD
            ? 0
            : (deliveryArea === "OUTSIDE" ? DELIVERY_COST_OUTSIDE : DELIVERY_COST_DHAKA);
        const total = subtotal + shippingCost;
        const orderNumber = await generateOrderNumber();
        // Create the order and decrement stock atomically — if any product's
        // stock has changed since the check above (race with a concurrent
        // order), the decrement below would drive it negative; guard with a
        // conditional update inside the transaction.
        const order = await prisma_1.prisma.$transaction(async (tx) => {
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
                    email, // snapshot (user's email or guest's email)
                    subtotal,
                    shippingCost,
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
        await prisma_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        const orderWithNotes = order;
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
            (0, generateInvoicePdf_1.generateInvoicePdf)(invoiceData)
                .then((pdfBuffer) => (0, sendEmail_1.sendEmail)({
                sendTo: email,
                subject: `Order Confirmed – ${order.orderNumber}`,
                html: (0, orderConfirmationTemplate_1.orderConfirmationTemplate)(invoiceData),
                attachments: [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdfBuffer }],
            }))
                .catch((err) => console.error("Order email error:", err));
        }
        return (0, errorHandler_1.errorHandler)(res, 200, "Your order placed successfully!", false, order);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.placeOrder = placeOrder;
const getMyOrders = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return (0, errorHandler_1.errorHandler)(res, 401, "Unauthorized, Please login again");
        }
        const order = await prisma_1.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { items: true } });
        // An empty order history is a normal state, not an error.
        return (0, errorHandler_1.errorHandler)(res, 200, "Your order gotten successfully!", false, order);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getMyOrders = getMyOrders;
const getOrdersByOrderNumber = async (req, res) => {
    try {
        const { orderNumber, email } = req.query;
        if (!orderNumber || !email) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Order Number and email are required");
        }
        const order = await prisma_1.prisma.order.findFirst({
            where: { orderNumber: orderNumber, email: email },
            include: { items: true }
        });
        if (!order) {
            return (0, errorHandler_1.errorHandler)(res, 404, "The order not found!");
        }
        return (0, errorHandler_1.errorHandler)(res, 200, "The order found successfully!", false, order);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getOrdersByOrderNumber = getOrdersByOrderNumber;
const getAllOrdersByAdmin = async (req, res) => {
    try {
        const orders = await prisma_1.prisma.order.findMany({
            include: { items: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: "desc" }
        });
        // No orders yet is a normal state for a fresh store, not an error.
        return (0, errorHandler_1.errorHandler)(res, 200, "All Orders", false, orders);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getAllOrdersByAdmin = getAllOrdersByAdmin;
const updateOrderByAdmin = async (req, res) => {
    try {
        const { orderId } = req.query;
        if (!orderId)
            return (0, errorHandler_1.errorHandler)(res, 400, "orderId is required");
        const { orderStatus, paymentStatus, adminNote } = req.body;
        if (!orderStatus && !paymentStatus) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Provide at least one of orderStatus or paymentStatus");
        }
        const data = {};
        if (orderStatus)
            data.orderStatus = orderStatus;
        if (paymentStatus)
            data.paymentStatus = paymentStatus;
        if (adminNote)
            data.adminNote = adminNote;
        const updatedOrder = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data,
            include: { items: true }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The order updated successfully!", false, updatedOrder);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.updateOrderByAdmin = updateOrderByAdmin;
// Admin: download an order's invoice as a PDF file.
const downloadInvoiceByAdmin = async (req, res) => {
    try {
        const orderId = String(req.params.orderId ?? "");
        if (!orderId)
            return (0, errorHandler_1.errorHandler)(res, 400, "orderId is required");
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            return (0, errorHandler_1.errorHandler)(res, 404, "Order not found");
        const orderWithNotes = order;
        const pdf = await (0, generateInvoicePdf_1.generateInvoicePdf)({
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
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.downloadInvoiceByAdmin = downloadInvoiceByAdmin;
