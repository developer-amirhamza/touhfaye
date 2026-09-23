"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const stripe_1 = __importDefault(require("stripe"));
const cart_controllers_1 = require("./cart.controllers");
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../utils/errorHandler");
const pricing_1 = require("../services/pricing");
dotenv_1.default.config();
// Initialize Stripe with your secret key
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia', // Use the latest stable API version
});
const createCheckoutSession = async (req, res) => {
    try {
        const { firstName, lastName, successUrl, cancelUrl, email, phone, shippingAddress, orderNote } = req.body;
        const token = await (0, cart_controllers_1.getCartToken)(req, res);
        const userId = req.userId;
        // A guest must supply an email so we can send their order confirmation.
        if (!userId && !email) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Email is required to check out as a guest.");
        }
        // Log cart retrieval
        const cart = await (0, cart_controllers_1.getOrCreateCart)(token, userId);
        if (!cart || cart.items.length === 0) {
            return (0, errorHandler_1.errorHandler)(res, 400, 'Your cart is empty.');
        }
        // Resolve each line's role-based price once (a guest, or a signed-in
        // user with no role-specific price, gets the main retail-minus-
        // discount price — see resolveUnitPrice), then layer any Subscribe &
        // Save interval discount on top of that.
        const role = await (0, pricing_1.getViewerRole)(userId);
        const resolvedItems = await Promise.all(cart.items.map(async (item) => {
            const basePrice = await (0, pricing_1.resolveUnitPrice)({
                productId: item.product.id,
                role,
                quantity: item.quantity,
                userId,
            });
            const pct = (0, pricing_1.subscriptionDiscountPctForInterval)(item.subscriptionIntervalDays);
            const unitPrice = pct > 0 ? +(basePrice - (basePrice * pct) / 100).toFixed(2) : basePrice;
            return { item, basePrice, unitPrice };
        }));
        const lineItems = resolvedItems.map(({ item, unitPrice }) => {
            // Get the first image and validate it's a proper URL
            const imageUrl = item.product.images?.[0];
            const isValidImageUrl = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
            return {
                price_data: {
                    currency: 'bdt',
                    product_data: {
                        name: item.subscriptionIntervalDays
                            ? `${item.product.title} (Subscribe & Save)`
                            : item.product.title,
                        ...(isValidImageUrl && { images: [imageUrl] }),
                    },
                    unit_amount: Math.round(unitPrice * 100),
                },
                quantity: item.quantity,
            };
        });
        // Subtotal at each buyer's own resolved price, the Subscribe & Save
        // discount taken off it, and the resulting net subtotal charged.
        const retailSubtotal = resolvedItems.reduce((acc, { item, basePrice }) => acc + basePrice * item.quantity, 0);
        const discount = +resolvedItems
            .reduce((acc, { item, basePrice, unitPrice }) => acc + (basePrice - unitPrice) * item.quantity, 0)
            .toFixed(2);
        const subtotal = +(retailSubtotal - discount).toFixed(2);
        // Create pending order
        const order = await prisma_1.prisma.order.create({
            data: {
                orderNumber: `ORD-${Date.now()}`,
                userId: userId || undefined,
                email: email || 'pending@example.com',
                phone: phone || '',
                firstName: firstName ?? null,
                lastName: lastName ?? null,
                shippingAddress: shippingAddress || '',
                orderNote: orderNote ?? null,
                subtotal: subtotal,
                discount: discount,
                total: subtotal,
                paymentMethod: 'STRIPE',
                paymentStatus: 'Pending',
                orderStatus: 'Pending',
                items: {
                    create: resolvedItems.map(({ item, unitPrice }) => ({
                        productId: item.product.id,
                        productName: item.product.title,
                        productImage: item.product.images[0] || null,
                        price: unitPrice,
                        quantity: item.quantity,
                        total: +(unitPrice * item.quantity).toFixed(2),
                    })),
                },
            },
        });
        console.log('Order created:', order.id);
        // Any items the shopper subscribed to become a recurring Subscription
        // (grouped by interval, since a subscription has a single cadence).
        // Placed right away so the very order just paid for kicks off the
        // recurring cycle — no dependency on the Stripe webhook firing.
        if (userId) {
            const subscribed = cart.items.filter((i) => i.subscriptionIntervalDays);
            const byInterval = new Map();
            for (const item of subscribed) {
                const days = item.subscriptionIntervalDays;
                byInterval.set(days, [...(byInterval.get(days) ?? []), item]);
            }
            for (const [intervalDays, items] of byInterval) {
                const nextRunAt = new Date();
                nextRunAt.setDate(nextRunAt.getDate() + intervalDays);
                await prisma_1.prisma.subscription.create({
                    data: {
                        userId,
                        intervalDays,
                        nextRunAt,
                        shippingAddress: shippingAddress || '',
                        phone: phone || '',
                        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
                    },
                }).catch((e) => console.error('Failed to create subscription from checkout:', e));
            }
        }
        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl || `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.CLIENT_URL}/cart`,
            metadata: {
                orderId: order.id,
            },
        });
        // Update order with stripe session id
        await prisma_1.prisma.order.update({
            where: { id: order.id },
            data: { stripeSessionId: session.id },
        });
        await prisma_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        console.log('Stripe session created:', session.url);
        res.json({ success: true, url: session.url });
    }
    catch (error) {
        console.error('Full error:', error);
        (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Failed to create checkout session.');
    }
};
exports.createCheckoutSession = createCheckoutSession;
