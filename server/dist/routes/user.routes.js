"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controllers_1 = require("../controllers/user.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Auth
router.post("/signup", user_controllers_1.SignUp);
router.post("/signin", user_controllers_1.SignIn);
router.get("/signout", auth_1.auth, user_controllers_1.SignOut);
router.post("/verify-email", user_controllers_1.verifyEmail);
router.post("/refresh-token", user_controllers_1.refreshToken);
router.post("/forgot-password", user_controllers_1.forgotPassword);
router.post("/reset-password", user_controllers_1.resetPassword);
// Logged-in user
router.get("/get-user-details", auth_1.auth, user_controllers_1.GetUserDetails);
router.put("/update-user", auth_1.auth, user_controllers_1.updateUserDetails);
router.put("/change-password", auth_1.auth, user_controllers_1.changePassword);
// Admin only
router.get("/all-users", auth_1.auth, admin_1.admin, user_controllers_1.getAllUsers);
router.put("/update-user-by-admin", auth_1.auth, admin_1.admin, user_controllers_1.updateUserByAdmin);
router.delete("/delete-user", auth_1.auth, admin_1.admin, user_controllers_1.deleteUser);
exports.default = router;
