import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { uploadImageCloudinary, uploadFileCloudinary } from "../config/cloudinary";



export const uploadImage = async (req:any,res:Response)=>{
    try {
        const file:any = req.file;
        const uploadedImage = await uploadImageCloudinary(file);
        return errorHandler(res,200,"The Image uploaded successfully!",false,uploadedImage);
    } catch (error:any) {
        errorHandler(res,500,error.message || "Internal server error!",true);
    }
}

export const uploadFile = async (req:any,res:Response)=>{
    try {
        const file:any = req.file;
        if (!file) return errorHandler(res,400,"No file was uploaded",true);
        const uploadedFile = await uploadFileCloudinary(file);
        return errorHandler(res,200,"The file uploaded successfully!",false,uploadedFile);
    } catch (error:any) {
        errorHandler(res,500,error.message || "Internal server error!",true);
    }
}