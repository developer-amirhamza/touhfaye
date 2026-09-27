"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileCloudinary = exports.uploadImageCloudinary = void 0;
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
});
const uploadImageCloudinary = async (image) => {
    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer());
    const uploadImage = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "healhushop" }, (error, uploadResult) => {
            if (uploadResult) {
                return resolve(uploadResult);
            }
            else {
                return reject(error);
            }
        }).end(buffer);
    });
    return uploadImage;
};
exports.uploadImageCloudinary = uploadImageCloudinary;
// General-purpose file upload (certifications, POS assets, etc.) — unlike
// uploadImageCloudinary above, this isn't limited to image formats.
// resource_type "auto" lets Cloudinary accept PDFs and other documents
// alongside images, rather than rejecting anything that isn't an image.
const uploadFileCloudinary = async (file) => {
    const buffer = file?.buffer || Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "healhushop/resources", resource_type: "auto" }, (error, uploadResult) => {
            if (uploadResult) {
                return resolve(uploadResult);
            }
            else {
                return reject(error);
            }
        }).end(buffer);
    });
    return uploadResult;
};
exports.uploadFileCloudinary = uploadFileCloudinary;
