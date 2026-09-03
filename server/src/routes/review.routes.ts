import { Router } from "express";
import { addReview, deleteReview, getAllReviews, getProductReviews, updateReview } from "../controllers/review.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();


router.get("/all-reviews", auth, admin, getAllReviews);
router.post("/add-review", auth, addReview);
router.post("/get-reviews", getProductReviews);
router.put("/update-review", auth, updateReview);
router.delete("/delete-review", auth, deleteReview);

export default router