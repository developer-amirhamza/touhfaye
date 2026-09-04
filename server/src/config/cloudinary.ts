const cloudinary = require('cloudinary').v2;



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
})


export const uploadImageCloudinary = async (image:any)=>{
    const buffer = image?.buffer || Buffer.from( await image.arrayBuffer());

    const uploadImage = await new Promise((resolve,reject)=>{
        cloudinary.uploader.upload_stream(
            {folder: "healhushop"},(error:any,uploadResult:any)=>{
                if(uploadResult){
                    return resolve(uploadResult);
                }else{
                    return reject(error)
                }
            }
        ).end(buffer);
    });
    return uploadImage;
}

// General-purpose file upload (certifications, POS assets, etc.) — unlike
// uploadImageCloudinary above, this isn't limited to image formats.
// resource_type "auto" lets Cloudinary accept PDFs and other documents
// alongside images, rather than rejecting anything that isn't an image.
export const uploadFileCloudinary = async (file:any)=>{
    const buffer = file?.buffer || Buffer.from( await file.arrayBuffer());

    const uploadResult = await new Promise((resolve,reject)=>{
        cloudinary.uploader.upload_stream(
            {folder: "healhushop/resources", resource_type: "auto"},(error:any,uploadResult:any)=>{
                if(uploadResult){
                    return resolve(uploadResult);
                }else{
                    return reject(error)
                }
            }
        ).end(buffer);
    });
    return uploadResult;
}