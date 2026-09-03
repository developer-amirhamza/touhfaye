import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser"
import helmet from "helmet"
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import productRouter from "./routes/products.routes";
import cartRouter from "./routes/cart.routes";
import orderRouter from "./routes/order.routes";
import paymentRouter from "./routes/payment.route";
import categoryRouter from "./routes/category.route";
import reviewRouter from "./routes/review.routes";
import subcategoryRouter from "./routes/subcategory.routes";
import blogRouter from "./routes/blog.routes"
import testimonialRouter from "./routes/testimonial.routes"
import accountApplicationRouter from "./routes/accountApplication.routes"
import pricingRouter from "./routes/pricing.routes"
import quoteRouter from "./routes/quote.routes"
import enquiryRouter from "./routes/enquiry.routes"
import tradeRouter from "./routes/trade.routes"
import subscriptionRouter from "./routes/subscription.routes"
import phase3Router from "./routes/phase3.routes"
import healthRouter from "./routes/health.routes"
import teamTaskRouter from "./routes/teamTask.routes"
import waitlistRouter from "./routes/waitlist.routes"
import uploadImageRouter from "./routes/uploadImage.route"
import trainingSessionRouter from "./routes/trainingSession.routes"
import redditPostRouter from "./routes/redditPost.routes"
import faqRouter from "./routes/faq.routes"
import scBillingRouter from "./routes/scBilling.routes"
import portalResourceRouter from "./routes/portalResource.routes"

config();
const app = express();
app.use(cors({
    credentials:true,
    origin:process.env.CLIENT_URL,
}))

app.use(express.json());
app.use(express.urlencoded({
    extended:true,
}));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet({
    crossOriginEmbedderPolicy:false,
}));

app.use("/api/user", userRouter);
app.use("/api/products", productRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/cart",cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payment",paymentRouter);
app.use("/api/subcategories", subcategoryRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/account-applications", accountApplicationRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/quotes", quoteRouter);
app.use("/api/enquiries", enquiryRouter);
app.use("/api/trade", tradeRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/phase3", phase3Router);
app.use("/api/health", healthRouter);
app.use("/api/team-tasks", teamTaskRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/image", uploadImageRouter);
app.use("/api/training-sessions", trainingSessionRouter);
app.use("/api/reddit-posts", redditPostRouter);
app.use("/api/faqs", faqRouter);
app.use("/api/sc-billing", scBillingRouter);
app.use("/api/portal-resources", portalResourceRouter);




export default app;