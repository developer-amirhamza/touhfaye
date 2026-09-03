import { Router } from "express";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";
import {
    createTrainingSession,
    deleteTrainingSession,
    getAllTrainingSessions,
    getAllTrainingSessionsAdmin,
    getTrainingSessionRegistrations,
    registerForTrainingSession,
    updateTrainingSession,
} from "../controllers/trainingSession.controllers";

const router = Router();

// Public
router.get("/all", getAllTrainingSessions);
router.post("/register", registerForTrainingSession);

// Admin only
router.get("/admin/all", auth, admin, getAllTrainingSessionsAdmin);
router.post("/create", auth, admin, createTrainingSession);
router.put("/update", auth, admin, updateTrainingSession);
router.delete("/delete", auth, admin, deleteTrainingSession);
router.post("/registrations", auth, admin, getTrainingSessionRegistrations);

export default router;
