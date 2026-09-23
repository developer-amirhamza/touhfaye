"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controllers_1 = require("../controllers/health.controllers");
const router = (0, express_1.Router)();
// Admin-only email diagnostics.
router.get("/email", health_controllers_1.getEmailStatus);
router.post("/email", health_controllers_1.sendTestEmail);
exports.default = router;
