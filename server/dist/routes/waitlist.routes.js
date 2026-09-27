"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const waitlist_controllers_1 = require("../controllers/waitlist.controllers");
const router = (0, express_1.Router)();
// Public — anyone can join the waitlist from the marketing popup.
router.post("/", waitlist_controllers_1.joinWaitlist);
// Admin only — view all leads (client-side Excel export reads this).
router.get("/", auth_1.auth, admin_1.admin, waitlist_controllers_1.listWaitlist);
exports.default = router;
