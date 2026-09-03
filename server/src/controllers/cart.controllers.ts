import crypto from "crypto";
import { errorHandler } from "../utils/errorHandler";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getViewerRole, resolveUnitPrice } from "../services/pricing";

interface AuthRequest extends Request {
    userId?: string
}

// Attaches a role-resolved `displayPrice` to each cart line (at that line's
// own quantity, so wholesale volume tiers are reflected), so every client
// that renders the cart shows the same price the buyer will actually be
// charged — instead of each page recomputing its own discount math from the
// raw product row.
const hydrateCart = async (cart: any, userId?: string | null) => {
    if (!cart) return cart;
    const role = await getViewerRole(userId);
    const items = await Promise.all(
        cart.items.map(async (item: any) => ({
            ...item,
            displayPrice: await resolveUnitPrice({
                productId: item.productId,
                role,
                quantity: item.quantity,
                userId,
            }),
        }))
    );
    return { ...cart, items };
};

export const getCartToken = async (req: Request, res: Response) => {
    try {
        let token = req.cookies.cartToken;
        if (!token) {
            token = crypto.randomUUID();
            res.cookie("cartToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            })
        };
        return token
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!",)
    }
};



// Helper: find or create cart for the current user/token
export const getOrCreateCart = async (token: string, userId?: string) => {
    let cart = await prisma.cart.findFirst({
        where: userId ? { userId } : { token },
        include: { items: { include: { product: true } } },
    });
    if (!cart) {
        cart = await prisma.cart.create({
            data: userId ? { userId } : { token },
            include: { items: { include: { product: true } } }
        });
    }
    return cart;
};

export const addToCart = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, quantity = "1", subscriptionIntervalDays } = req.body;
        if (!productId) return errorHandler(res, 404, "Product id is required!");
        const product = await prisma.product.findFirst({
            where: { id: productId, isActive: true }
        });

        if (!product) return errorHandler(res, 404, "The product not found!");

        const token = await getCartToken(req, res)
        const userId = req.userId as string | undefined;

        let cart: any = await getOrCreateCart(token, userId);

        // null/undefined = one-time purchase; any other value clears any
        // previous "Subscribe & Save" choice for this line.
        const intervalDays =
            subscriptionIntervalDays === undefined ? undefined : (Number(subscriptionIntervalDays) || null);

        const existingItem = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: parseInt(quantity), subscriptionIntervalDays: intervalDays }   // parse quantity
            });
        } else {
            await prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity, subscriptionIntervalDays: intervalDays ?? null },
            });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        })

        return errorHandler(res, 200, "The cart added successfully", false, await hydrateCart(updatedCart, userId));
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!")
    }
};



// get cart
export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const token = await getCartToken(req, res);
        const userId = req.userId as string | undefined;
        const cart = await getOrCreateCart(token, userId)
        return errorHandler(res, 200, "The cart got successfully", false, await hydrateCart(cart, userId))
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!")
    }
};


export const updateCartItem = async (req: AuthRequest, res: Response) => {
    try {
        const { quantity, itemId, subscriptionIntervalDays } = req.body;
        if (!itemId) return errorHandler(res, 400, "itemId is required");
        if (quantity < 1) return errorHandler(res, 400, "The cart quantity must be at least 1");

        // Verify ownership BEFORE mutating anything — an item belonging to
        // another user's/guest's cart must never be updated.
        const existing = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });
        if (!existing) return errorHandler(res, 404, "The cart item not found!");

        const token = await getCartToken(req, res);
        const userId = req.userId;
        const owns = userId ? existing.cart.userId === userId : existing.cart.token === token;
        if (!owns) return errorHandler(res, 403, "Unauthorized");

        const data: any = { quantity };
        if (subscriptionIntervalDays !== undefined) {
            data.subscriptionIntervalDays = Number(subscriptionIntervalDays) || null;
        }
        const item = await prisma.cartItem.update({
            where: { id: itemId },
            data,
            include: { cart: true }
        });

        const updatedItem = await prisma.cart.findUnique({
            where: { id: item.cartId },
            include: { items: { include: { product: true } } }
        })

        return errorHandler(res, 200, "The cart item updated successfully!", false, await hydrateCart(updatedItem, userId));
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "internal server error!")
    }
};


export const deleteCartItem = async (req: AuthRequest, res: Response) => {
    try {
        const { itemId } = req.body;
        if (!itemId) return errorHandler(res, 400, "itemId is required");

        const item = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true }
        })
        if (!item) return errorHandler(res, 404, "The cart item not found!");

        const token = await getCartToken(req, res);
        const userId = req.userId;
        const owns = userId ? item.cart.userId === userId : item.cart.token === token;
        if (!owns) return errorHandler(res, 403, "Unauthorized");

        const cartId = item.cartId;
        await prisma.cartItem.delete({ where: { id: itemId } });
        const updatedCartItem = await prisma.cart.findUnique({
            where: { id: cartId },
            include: { items: { include: { product: true } } }
        })
        return errorHandler(res, 200, "The Cart Item has been deleted successfully!", false, await hydrateCart(updatedCartItem, userId));
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "internal server error!")
    }
};



// POST /api/cart/merge - When user logs in, merge guest cart into user's cart
export const mergeCartAfterLogin = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return errorHandler(res, 401, "Unauthorized");
        const token = req.cookies.cartToken;
        if (!token) return errorHandler(res, 200, "No guest cart to merge", false, null);

        // The guest cart is identified by its token cookie, not by user id.
        const guestCart = await prisma.cart.findFirst({
            where: { token },
            include: { items: true },
        });
        if (!guestCart) return errorHandler(res, 200, "No guest cart to merge", false, null);

        let userCart = await prisma.cart.findUnique({ where: { userId } });
        if (!userCart) {
            userCart = await prisma.cart.create({ data: { userId } });
        }

        for (const guestItem of guestCart.items) {
            const existingUserItem = await prisma.cartItem.findUnique({
                where: { cartId_productId: { cartId: userCart.id, productId: guestItem.productId } }
            });

            if (existingUserItem) {
                // Combine quantities
                await prisma.cartItem.update({
                    where: { id: existingUserItem.id },
                    data: { quantity: existingUserItem.quantity + guestItem.quantity }
                })
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productId: guestItem.productId,
                        quantity: guestItem.quantity,
                    }
                })
            }
        }

        // Guest cart's items reference it via a required relation, so delete
        // the items first, then the now-empty guest cart.
        await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
        await prisma.cart.delete({ where: { id: guestCart.id } });

        // Clear the cart token cookie
        res.clearCookie("cartToken")

        const mergedCart = await prisma.cart.findUnique({
            where: { id: userCart.id },
            include: { items: { include: { product: true } } }
        });

        return errorHandler(res, 200, "Guest Cart merged successfully!", false, await hydrateCart(mergedCart, userId));
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error")
    }
};
