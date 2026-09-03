import express from 'express';
import app from "./app";
import dotenv from 'dotenv';
import { database } from "./config/database";
import { prisma } from "./lib/prisma";
import { handleStripeWebhook } from './controllers/webhookControllers';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;  // ✅ fixed: now always a number

app.get("/", (req, res) => {
    res.send("<center><h1> Welcome to  Testing </h1></center>");
});

// Webhook route (raw body)
app.post('/api/webhook/stripe',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const sig = req.headers['stripe-signature'] as string;
        try {
            await handleStripeWebhook(req.body, sig);
            res.json({ received: true });
        } catch (error: any) {
            console.error('Webhook Error:', error.message);
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }
);

app.use(express.json());

// ✅ Listen on 0.0.0.0 – required for Docker/Coolify
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});

async function main() {
    console.log("Database connected successfully!");
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});