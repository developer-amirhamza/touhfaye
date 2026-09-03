import { Router } from "express";
import {
  applyForAccount,
  getMyApplication,
  listApplications,
  approveApplication,
  rejectApplication,
} from "../controllers/accountApplication.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Logged-in user
router.post("/apply", auth, applyForAccount);
router.get("/me", auth, getMyApplication);

// Admin only
router.get("/", auth, admin, listApplications);
router.put("/approve", auth, admin, approveApplication);
router.put("/reject", auth, admin, rejectApplication);

export default router;