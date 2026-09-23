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
import enquiryRouter from "./routes/enquiry.routes"
import healthRouter from "./routes/health.routes"
import teamTaskRouter from "./routes/teamTask.routes"
import waitlistRouter from "./routes/waitlist.routes"
import uploadImageRouter from "./routes/uploadImage.route"

import faqRouter from "./routes/faq.routes"


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

app.use("/api/enquiries", enquiryRouter);
<<<<<<< HEAD

=======
>>>>>>> origin/claude/first-pr-workflow-5de81d
app.use("/api/health", healthRouter);
app.use("/api/team-tasks", teamTaskRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/image", uploadImageRouter);
<<<<<<< HEAD

=======
>>>>>>> origin/claude/first-pr-workflow-5de81d
app.use("/api/faqs", faqRouter);




export default app;