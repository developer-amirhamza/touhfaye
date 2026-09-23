import { Router } from "express";
import {
  listSubscriptions,
  upsertSubscription,
  oneClickReorder,
} from "../controllers/subscription.controllers";
import { auth } from "../middlewares/auth";

const router = Router();

// Any logged-in consumer can manage their subscriptions and reorder.
router.get("/", auth, listSubscriptions);
router.put("/", auth, upsertSubscription);
router.post("/reorder", auth, oneClickReorder);

export default router;