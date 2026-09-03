import { Router } from "express";
import { SignUp, SignIn, SignOut, GetUserDetails, getAllUsers, updateUserDetails, deleteUser, verifyEmail, refreshToken, updateUserByAdmin, forgotPassword, resetPassword, changePassword, } from "../controllers/user.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";


const router = Router();

// Auth
router.post("/signup", SignUp);
router.post("/signin", SignIn);
router.get("/signout", auth, SignOut);
router.post("/verify-email", verifyEmail);
router.post("/refresh-token", refreshToken)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Logged-in user
router.get("/get-user-details", auth, GetUserDetails);
router.put("/update-user", auth, updateUserDetails);
router.put("/change-password", auth, changePassword);

// Admin only
router.get("/all-users", auth, admin, getAllUsers);
router.put("/update-user-by-admin", auth, admin, updateUserByAdmin);
router.delete("/delete-user", auth, admin, deleteUser);

export default router;