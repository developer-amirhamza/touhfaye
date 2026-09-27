"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const category_route_1 = __importDefault(require("./routes/category.route"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const subcategory_routes_1 = __importDefault(require("./routes/subcategory.routes"));
const blog_routes_1 = __importDefault(require("./routes/blog.routes"));
const testimonial_routes_1 = __importDefault(require("./routes/testimonial.routes"));
const enquiry_routes_1 = __importDefault(require("./routes/enquiry.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const teamTask_routes_1 = __importDefault(require("./routes/teamTask.routes"));
const waitlist_routes_1 = __importDefault(require("./routes/waitlist.routes"));
const uploadImage_route_1 = __importDefault(require("./routes/uploadImage.route"));
const faq_routes_1 = __importDefault(require("./routes/faq.routes"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
}));
app.use("/api/user", user_routes_1.default);
app.use("/api/products", products_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/categories", category_route_1.default);
app.use("/api/cart", cart_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/payment", payment_route_1.default);
app.use("/api/subcategories", subcategory_routes_1.default);
app.use("/api/blogs", blog_routes_1.default);
app.use("/api/testimonials", testimonial_routes_1.default);
app.use("/api/enquiries", enquiry_routes_1.default);
app.use("/api/health", health_routes_1.default);
app.use("/api/team-tasks", teamTask_routes_1.default);
app.use("/api/waitlist", waitlist_routes_1.default);
app.use("/api/image", uploadImage_route_1.default);
app.use("/api/faqs", faq_routes_1.default);
exports.default = app;
