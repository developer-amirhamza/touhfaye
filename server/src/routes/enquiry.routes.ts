import { Router } from "express";
import {
  submitFundingEnquiry,
  submitEnquiry,
  submitMeetingRequest,
  listEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiry.controllers";
import { auth, optionalAuth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public/optional-auth submissions. `auth` populates userId when a token is
// present; funding enquiries are typically raised by a logged-in coordinator.
router.post("/funding", auth, submitFundingEnquiry);
router.post("/", submitEnquiry);
// B2B "book a meeting" — works for guests and signed-in users alike.
router.post("/meeting", optionalAuth, submitMeetingRequest);

// Admin inbox
router.get("/", auth, admin, listEnquiries);
router.put("/status", auth, admin, updateEnquiryStatus);

export default router;