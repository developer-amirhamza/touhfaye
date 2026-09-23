"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enquiry_controllers_1 = require("../controllers/enquiry.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Public/optional-auth submissions. `auth` populates userId when a token is
// present; funding enquiries are typically raised by a logged-in coordinator.
router.post("/funding", auth_1.auth, enquiry_controllers_1.submitFundingEnquiry);
router.post("/", enquiry_controllers_1.submitEnquiry);
// B2B "book a meeting" — works for guests and signed-in users alike.
router.post("/meeting", auth_1.optionalAuth, enquiry_controllers_1.submitMeetingRequest);
// Admin inbox
router.get("/", auth_1.auth, admin_1.admin, enquiry_controllers_1.listEnquiries);
router.put("/status", auth_1.auth, admin_1.admin, enquiry_controllers_1.updateEnquiryStatus);
exports.default = router;
