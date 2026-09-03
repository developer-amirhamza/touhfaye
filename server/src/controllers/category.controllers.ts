import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";





// Helper: generate slug from title
const generatedSlug = (title:string) =>{
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g,"");
}


export const createCategory = async(req:Request,res:Response)=>{
    try {
        const {title}= req.body;
        if(!title){
            return errorHandler(res,404, "The category title is required!")
        }
        const existing = await prisma.category.findFirst({
            where:{title:{equals:title, mode:"insensitive"}}
        })
        if(existing){
            return errorHandler(res,409,"This category already exists!")
        }

        const slug = generatedSlug(title);
        let finalSlug = slug;
        let counter = 1;

        while(await prisma.category.findUnique({where:{slug:finalSlug}})){
            finalSlug = `${slug}-${counter}`;
            counter++;
        }
        const category = await prisma.category.create({data:{title,slug:finalSlug}});
        return errorHandler(res,200,"The category has been created successfully!",false,category);
    } catch (error:any) {
        errorHandler(res,500,error.message || "Internal server error!")
    }
};


export const updateCategory = async(req:Request,res:Response)=>{
    try {
        const {id, title} = req.body;
        if(!id || !title) return errorHandler(res,404, "The category title is required!")
        const existing = await prisma.category.findUnique({where:{id:id}})
        if(!existing) return errorHandler(res,404, "The category not found")

        const updateData:any = {};
        if(title){
            const titleConflict = await prisma.category.findFirst({
                where:{title:{equals:title, mode:"insensitive"},NOT:{id}}
            })
            if (titleConflict) {
                return errorHandler(res, 409, "Category with this title already exists");
            }
            updateData.title = title;
            updateData.slug = generatedSlug(title)
        }

        const updatedCategory = await prisma.category.update({
            where:{id},
            data:updateData,
        });

        return errorHandler(res,200, "The category updated successfully!",false,updatedCategory);
    } catch (error:any) {
        return errorHandler(res,500,error.message || "Internal server error!")
    }
}

export const deleteCategory = async(req:Request, res:Response)=>{
    try {
        const {id }= req.body;
        const existing = await prisma.category.findUnique({where:{id:id}})
        if(!existing) return errorHandler(res,404, "The category not found")

        const productCount = await prisma.product.count({where:{categoryId:id}});
        if(productCount > 0){
            return errorHandler(res, 400, "Cannot delete category that has products. Reassign or delete products first.");
        }
        await await prisma.category.delete({where:{id}});
        return errorHandler(res,200, "The category deleted successfully!",false);
    } catch (error:any) {
        return errorHandler(res,500,error.message || "Internal server error!")
    }
}

export const getCategoryBySlug = async(req:Request, res:Response)=>{
    try {
        const {slug} = req.body;
        const category = await prisma.category.findFirst({where:{slug}, include:{products:true}})
        if(!category) return errorHandler(res,404, "The category not found")
        return errorHandler(res,200, "The category gotten successfully!",false,category);
    } catch (error:any) {
        return errorHandler(res,500,error.message || "Internal server error!")
    }
}

export const getAllCategories = async(req:Request, res:Response)=>{
    try {
        const categories = await prisma.category.findMany({ orderBy:{"title":"asc"},include:{products:true}})
        if(!categories) return errorHandler(res,404, "The category not found")
        return errorHandler(res,200, "The category gotten successfully!",false,categories);
    } catch (error:any) {
        return errorHandler(res,500,error.message || "Internal server error!")
    }
}