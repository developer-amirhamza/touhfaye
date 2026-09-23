"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const webhookControllers_1 = require("./controllers/webhookControllers");
dotenv_1.default.config();
const PORT = Number(process.env.PORT) || 5000; // ✅ fixed: now always a number
app_1.default.get("/", (req, res) => {
    res.send("<center><h1> Welcome to  Testing </h1></center>");
});
// Webhook route (raw body)
app_1.default.post('/api/webhook/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
        await (0, webhookControllers_1.handleStripeWebhook)(req.body, sig);
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook Error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
app_1.default.use(express_1.default.json());
// ✅ Listen on 0.0.0.0 – required for Docker/Coolify
app_1.default.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
async function main() {
    console.log("Database connected successfully!");
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
