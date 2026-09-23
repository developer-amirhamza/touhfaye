"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controllers_1 = require("../controllers/order.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Guests (identified by cart cookie + email) and signed-in users can both
// place an order. The controller requires an email when there's no userId.
router.post("/place-order", auth_1.optionalAuth, order_controllers_1.placeOrder);
router.get("/my-orders", auth_1.auth, order_controllers_1.getMyOrders);
router.get("/lookup", order_controllers_1.getOrdersByOrderNumber);
// Admin only
router.get("/admin/get-all-orders", auth_1.auth, admin_1.admin, order_controllers_1.getAllOrdersByAdmin);
router.put("/admin/update-order", auth_1.auth, admin_1.admin, order_controllers_1.updateOrderByAdmin);
router.get("/admin/invoice/:orderId", auth_1.auth, admin_1.admin, order_controllers_1.downloadInvoiceByAdmin);
exports.default = router;
