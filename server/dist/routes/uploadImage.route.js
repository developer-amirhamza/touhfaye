"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const multer_1 = require("../middlewares/multer");
const uploadImage_controller_1 = require("../controllers/uploadImage-controller");
const router = express_1.default.Router();
router.post("/upload", auth_1.auth, multer_1.upload.single("image"), uploadImage_controller_1.uploadImage);
// Admin-only: unlike /upload above, this isn't restricted to image formats
// (used for certifications/POS assets, which are often PDFs), so it's
// locked to admins rather than any signed-in user.
router.post("/upload-file", auth_1.auth, admin_1.admin, multer_1.upload.single("file"), uploadImage_controller_1.uploadFile);
exports.default = router;
