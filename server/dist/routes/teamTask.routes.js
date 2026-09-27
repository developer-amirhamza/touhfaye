"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const teamTask_controllers_1 = require("../controllers/teamTask.controllers");
const router = (0, express_1.Router)();
// Internal admin-team board — admins (and the owner) only.
router.get("/", auth_1.auth, admin_1.admin, teamTask_controllers_1.listTeamTasks);
router.post("/", auth_1.auth, admin_1.admin, teamTask_controllers_1.createTeamTask);
router.post("/accept", auth_1.auth, admin_1.admin, teamTask_controllers_1.acceptTeamTask);
router.put("/", auth_1.auth, admin_1.admin, teamTask_controllers_1.updateTeamTask);
router.delete("/", auth_1.auth, admin_1.admin, teamTask_controllers_1.deleteTeamTask);
exports.default = router;
