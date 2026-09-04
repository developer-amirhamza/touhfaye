import { Router } from "express";
import { downloadInvoiceByAdmin, getAllOrdersByAdmin, getMyOrders, getOrdersByOrderNumber, placeOrder, updateOrderByAdmin } from "../controllers/order.controllers";
import { auth, optionalAuth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";


const router = Router();


// Guests (identified by cart cookie + email) and signed-in users can both
// place an order. The controller requires an email when there's no userId.
router.post("/place-order", optionalAuth, placeOrder);
router.get("/my-orders", auth, getMyOrders);
router.get("/lookup", getOrdersByOrderNumber);

// Admin only
router.get("/admin/get-all-orders", auth, admin, getAllOrdersByAdmin);
router.put("/admin/update-order", auth, admin, updateOrderByAdmin);
router.get("/admin/invoice/:orderId", auth, admin, downloadInvoiceByAdmin);

export default router;