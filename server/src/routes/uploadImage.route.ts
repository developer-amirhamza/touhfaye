import express from "express";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";
import { upload } from "../middlewares/multer";
import { uploadImage, uploadFile } from "../controllers/uploadImage-controller";




const router = express.Router();

router.post("/upload", auth, upload.single("image"), uploadImage);
// Admin-only: unlike /upload above, this isn't restricted to image formats
// (used for certifications/POS assets, which are often PDFs), so it's
// locked to admins rather than any signed-in user.
router.post("/upload-file", auth, admin, upload.single("file"), uploadFile);

export default router;