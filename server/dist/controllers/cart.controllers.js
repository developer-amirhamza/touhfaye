"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCartAfterLogin = exports.deleteCartItem = exports.updateCartItem = exports.getCart = exports.addToCart = exports.getOrCreateCart = exports.getCartToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const pricing_1 = require("../services/pricing");
// Attaches a role-resolved `displayPrice` to each cart line (at that line's
// own quantity, so wholesale volume tiers are reflected), so every client
// that renders the cart shows the same price the buyer will actually be
// charged — instead of each page recomputing its own discount math from the
// raw product row.
const hydrateCart = async (cart, userId) => {
    if (!cart)
        return cart;
    const role = await (0, pricing_1.getViewerRole)(userId);
    const items = await Promise.all(cart.items.map(async (item) => ({
        ...item,
        displayPrice: await (0, pricing_1.resolveUnitPrice)({
            productId: item.productId,
            role,
            quantity: item.quantity,
            userId,
        }),
    })));
    return { ...cart, items };
};
const getCartToken = async (req, res) => {
    try {
        let token = req.cookies.cartToken;
        if (!token) {
            token = crypto_1.default.randomUUID();
            res.cookie("cartToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
        }
        ;
        return token;
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getCartToken = getCartToken;
// Helper: find or create cart for the current user/token
const getOrCreateCart = async (token, userId) => {
    let cart = await prisma_1.prisma.cart.findFirst({
        where: userId ? { userId } : { token },
        include: { items: { include: { product: true } } },
    });
    if (!cart) {
        cart = await prisma_1.prisma.cart.create({
            data: userId ? { userId } : { token },
            include: { items: { include: { product: true } } }
        });
    }
    return cart;
};
exports.getOrCreateCart = getOrCreateCart;
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = "1", subscriptionIntervalDays } = req.body;
        if (!productId)
            return (0, errorHandler_1.errorHandler)(res, 404, "Product id is required!");
        const product = await prisma_1.prisma.product.findFirst({
            where: { id: productId, isActive: true }
        });
        if (!product)
            return (0, errorHandler_1.errorHandler)(res, 404, "The product not found!");
        const token = await (0, exports.getCartToken)(req, res);
        const userId = req.userId;
        let cart = await (0, exports.getOrCreateCart)(token, userId);
        // null/undefined = one-time purchase; any other value clears any
        // previous "Subscribe & Save" choice for this line.
        const intervalDays = subscriptionIntervalDays === undefined ? undefined : (Number(subscriptionIntervalDays) || null);
        const existingItem = await prisma_1.prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (existingItem) {
            await prisma_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: parseInt(quantity), subscriptionIntervalDays: intervalDays } // parse quantity
            });
        }
        else {
            await prisma_1.prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity, subscriptionIntervalDays: intervalDays ?? null },
            });
        }
        const updatedCart = await prisma_1.prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The cart added successfully", false, await hydrateCart(updatedCart, userId));
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.addToCart = addToCart;
// get cart
const getCart = async (req, res) => {
    try {
        const token = await (0, exports.getCartToken)(req, res);
        const userId = req.userId;
        const cart = await (0, exports.getOrCreateCart)(token, userId);
        return (0, errorHandler_1.errorHandler)(res, 200, "The cart got successfully", false, await hydrateCart(cart, userId));
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getCart = getCart;
const updateCartItem = async (req, res) => {
    try {
        const { quantity, itemId, subscriptionIntervalDays } = req.body;
        if (!itemId)
            return (0, errorHandler_1.errorHandler)(res, 400, "itemId is required");
        if (quantity < 1)
            return (0, errorHandler_1.errorHandler)(res, 400, "The cart quantity must be at least 1");
        // Verify ownership BEFORE mutating anything — an item belonging to
        // another user's/guest's cart must never be updated.
        const existing = await prisma_1.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, "The cart item not found!");
        const token = await (0, exports.getCartToken)(req, res);
        const userId = req.userId;
        const owns = userId ? existing.cart.userId === userId : existing.cart.token === token;
        if (!owns)
            return (0, errorHandler_1.errorHandler)(res, 403, "Unauthorized");
        const data = { quantity };
        if (subscriptionIntervalDays !== undefined) {
            data.subscriptionIntervalDays = Number(subscriptionIntervalDays) || null;
        }
        const item = await prisma_1.prisma.cartItem.update({
            where: { id: itemId },
            data,
            include: { cart: true }
        });
        const updatedItem = await prisma_1.prisma.cart.findUnique({
            where: { id: item.cartId },
            include: { items: { include: { product: true } } }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The cart item updated successfully!", false, await hydrateCart(updatedItem, userId));
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "internal server error!");
    }
};
exports.updateCartItem = updateCartItem;
const deleteCartItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        if (!itemId)
            return (0, errorHandler_1.errorHandler)(res, 400, "itemId is required");
        const item = await prisma_1.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true }
        });
        if (!item)
            return (0, errorHandler_1.errorHandler)(res, 404, "The cart item not found!");
        const token = await (0, exports.getCartToken)(req, res);
        const userId = req.userId;
        const owns = userId ? item.cart.userId === userId : item.cart.token === token;
        if (!owns)
            return (0, errorHandler_1.errorHandler)(res, 403, "Unauthorized");
        const cartId = item.cartId;
        await prisma_1.prisma.cartItem.delete({ where: { id: itemId } });
        const updatedCartItem = await prisma_1.prisma.cart.findUnique({
            where: { id: cartId },
            include: { items: { include: { product: true } } }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The Cart Item has been deleted successfully!", false, await hydrateCart(updatedCartItem, userId));
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "internal server error!");
    }
};
exports.deleteCartItem = deleteCartItem;
// POST /api/cart/merge - When user logs in, merge guest cart into user's cart
const mergeCartAfterLogin = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return (0, errorHandler_1.errorHandler)(res, 401, "Unauthorized");
        const token = req.cookies.cartToken;
        if (!token)
            return (0, errorHandler_1.errorHandler)(res, 200, "No guest cart to merge", false, null);
        // The guest cart is identified by its token cookie, not by user id.
        const guestCart = await prisma_1.prisma.cart.findFirst({
            where: { token },
            include: { items: true },
        });
        if (!guestCart)
            return (0, errorHandler_1.errorHandler)(res, 200, "No guest cart to merge", false, null);
        let userCart = await prisma_1.prisma.cart.findUnique({ where: { userId } });
        if (!userCart) {
            userCart = await prisma_1.prisma.cart.create({ data: { userId } });
        }
        for (const guestItem of guestCart.items) {
            const existingUserItem = await prisma_1.prisma.cartItem.findUnique({
                where: { cartId_productId: { cartId: userCart.id, productId: guestItem.productId } }
            });
            if (existingUserItem) {
                // Combine quantities
                await prisma_1.prisma.cartItem.update({
                    where: { id: existingUserItem.id },
                    data: { quantity: existingUserItem.quantity + guestItem.quantity }
                });
            }
            else {
                await prisma_1.prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productId: guestItem.productId,
                        quantity: guestItem.quantity,
                    }
                });
            }
        }
        // Guest cart's items reference it via a required relation, so delete
        // the items first, then the now-empty guest cart.
        await prisma_1.prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
        await prisma_1.prisma.cart.delete({ where: { id: guestCart.id } });
        // Clear the cart token cookie
        res.clearCookie("cartToken");
        const mergedCart = await prisma_1.prisma.cart.findUnique({
            where: { id: userCart.id },
            include: { items: { include: { product: true } } }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Guest Cart merged successfully!", false, await hydrateCart(mergedCart, userId));
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.mergeCartAfterLogin = mergeCartAfterLogin;
