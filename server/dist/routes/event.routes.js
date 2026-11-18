"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controllers_1 = require("../controllers/event.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Public
router.get('/all', event_controllers_1.getAllEvents);
router.post('/by-slug', event_controllers_1.getEventBySlug);
// Admin only
router.get('/admin/all', auth_1.auth, admin_1.admin, event_controllers_1.getAdminAllEvents);
router.post('/by-id', auth_1.auth, admin_1.admin, event_controllers_1.getEventById);
router.post('/create', auth_1.auth, admin_1.admin, event_controllers_1.createEvent);
router.put('/update', auth_1.auth, admin_1.admin, event_controllers_1.updateEvent);
router.delete('/delete', auth_1.auth, admin_1.admin, event_controllers_1.deleteEvent);
exports.default = router;
