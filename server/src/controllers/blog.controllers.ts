import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { string } from "zod";

const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};



export const createBlog = async (req: Request, res: Response) => {
    try {
        const { title, content, excerpt, featuredImage, category, tags, isPublished } = req.body;
        if (!title || !content) return errorHandler(res, 400, 'Title and content required');

        let slug = generateSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma.blog.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter++}`
        }

        const blog = await prisma.blog.create({
            data: {
                title,
                content,
                excerpt,
                featuredImage,
                category,
                tags: tags || [],
                slug: finalSlug,
                isPublished: isPublished || false,
                publishedAt: isPublished ? new Date() : null,
            }
        })

        return errorHandler(res, 200, "The blog has been created successfully!", false, blog);

    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!")
    }
}


export const updateBlog = async (req: Request, res: Response) => {
    try {
        const { id,title, content, excerpt, featuredImage, category, tags, isPublished } = req.body;
        const existing = await prisma.blog.findUnique({ where: { id: id as string } })
        if (!existing) return errorHandler(res, 400, 'The blog is not found');

        let updatedData: any = {};
        if (title) {
            updatedData.title = title;
            updatedData.slug = generateSlug(title);
            let finalSlug = updatedData.slug;
            let counter = 1;
            while (await prisma.blog.findFirst({ where: { slug: finalSlug, NOT: { id: id as string } } })) {
                finalSlug = `${updatedData.slug}-${counter++}`;
            }
            updatedData.slug = finalSlug;
        }
        if (content !== undefined) updatedData.content = content;
        if (excerpt !== undefined) updatedData.excerpt = excerpt;
        if (category !== undefined) updatedData.category = category;
        if (tags !== undefined) updatedData.tags = tags;
        if (featuredImage !== undefined) updatedData.featuredImage = featuredImage;
        if (isPublished !== undefined) {
            updatedData.isPublished = isPublished;
            updatedData.publishedAt = isPublished ? new Date() : null;
        }

        const updatedBlog = await prisma.blog.update({ where: { id: id as string }, data: updatedData });
        return errorHandler(res, 200, "The blog updated successfully!", false, updatedBlog);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error")
    }
}

// DELETE blog (admin only)
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        await prisma.blog.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Blog deleted' });
    } catch (error: any) {
        errorHandler(res, 500, error.message);
    }
};


export const getAllBlogs = async (req: Request, res: Response) => {
    try {
        const { page = "1", limit = "10", category, tag } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);
        let where: any = { isPublished: true };
        if (category) where.category = category as string;
        if (tag) where.tags = { has: tag as string }

        const [blogs, totalCount] = await Promise.all([
            prisma.blog.findMany({
                where,
                skip,
                take,
                orderBy: { publishedAt: 'desc' }
            }),
            prisma.blog.count({ where }),
        ]);

        res.json({
            success: true,
            data: blogs,
            pagination: {
                page: parseInt(page as string),
                limit: take,
                totalPages: Math.ceil(totalCount / take),
                totalCount,
            },
        });

    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!",)
    }
}


export const getBlogBySlug = async (req:Request,res:Response)=>{
    try {
        const {slug} = req.body;
        console.log(req.params,"params")
        const blog = await prisma.blog.findUnique({where:{slug:slug as string}});

        if (!blog) return errorHandler(res, 404, 'Blog not found');

    // Increment views
    await prisma.blog.update({ where: { id: blog.id }, data: { views: blog.views + 1 } });

    return errorHandler(res,200,"The blog found", false, blog);
    } catch (error:any) {
        errorHandler(res,500,error.message || "Internal server error!")
    }
};

export const getBlogById = async (req:Request,res:Response)=>{
    try {
        const {id} = req.body;
        const blog = await prisma.blog.findUnique({where:{id:id as string}});

        if (!blog) return errorHandler(res, 404, 'Blog not found');

    // Increment views
    await prisma.blog.update({ where: { id: blog.id }, data: { views: blog.views + 1 } });

    return errorHandler(res,200,"The blog found", false, blog);
    } catch (error:any) {
        errorHandler(res,500,error.message || "Internal server error!")
    }
};