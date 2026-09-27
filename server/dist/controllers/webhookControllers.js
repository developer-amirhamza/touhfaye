"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = require("../lib/prisma");
// Initialize Stripe with your secret key
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
});
// This function will be called by your raw-body webhook endpoint
const handleStripeWebhook = async (rawBody, signature) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        // Verify the webhook signature to ensure it's from Stripe
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    catch (err) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        throw new Error(`Invalid signature`); // Will be caught and return 400
    }
    // Handle the event based on its type
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log(`Payment succeeded for session: ${session.id}`);
            await fulfillOrder(session);
            break;
        // Add other event types as needed (e.g., 'payment_intent.payment_failed')
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
// The logic to finalize an order after successful payment
async function fulfillOrder(session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
        console.error('Order ID missing in webhook metadata.');
        return;
    }
    // Update the order status in your database
    await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: {
            paymentStatus: 'Paid',
            orderStatus: 'Processing',
        },
    });
    // Optional: Clear the user's cart after a successful order
    // You can implement this based on your cart logic
    console.log(`Order ${orderId} has been successfully paid and is now processing.`);
}
