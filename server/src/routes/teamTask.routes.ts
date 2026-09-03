import { Router } from "express";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";
import {
    listTeamTasks,
    createTeamTask,
    acceptTeamTask,
    updateTeamTask,
    deleteTeamTask,
} from "../controllers/teamTask.controllers";

const router = Router();

// Internal admin-team board — admins (and the owner) only.
router.get("/", auth, admin, listTeamTasks);
router.post("/", auth, admin, createTeamTask);
router.post("/accept", auth, admin, acceptTeamTask);
router.put("/", auth, admin, updateTeamTask);
router.delete("/", auth, admin, deleteTeamTask);

export default router;
