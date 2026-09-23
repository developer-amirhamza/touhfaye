"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.uploadImage = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const cloudinary_1 = require("../config/cloudinary");
const uploadImage = async (req, res) => {
    try {
        const file = req.file;
        const uploadedImage = await (0, cloudinary_1.uploadImageCloudinary)(file);
        return (0, errorHandler_1.errorHandler)(res, 200, "The Image uploaded successfully!", false, uploadedImage);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.uploadImage = uploadImage;
const uploadFile = async (req, res) => {
    try {
        const file = req.file;
        if (!file)
            return (0, errorHandler_1.errorHandler)(res, 400, "No file was uploaded", true);
        const uploadedFile = await (0, cloudinary_1.uploadFileCloudinary)(file);
        return (0, errorHandler_1.errorHandler)(res, 200, "The file uploaded successfully!", false, uploadedFile);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.uploadFile = uploadFile;
