"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlogById = exports.getBlogBySlug = exports.getAllBlogs = exports.deleteBlog = exports.updateBlog = exports.createBlog = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};
const createBlog = async (req, res) => {
    try {
        const { title, content, excerpt, featuredImage, category, tags, isPublished } = req.body;
        if (!title || !content)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Title and content required');
        let slug = generateSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma_1.prisma.blog.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter++}`;
        }
        const blog = await prisma_1.prisma.blog.create({
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
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The blog has been created successfully!", false, blog);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.createBlog = createBlog;
const updateBlog = async (req, res) => {
    try {
        const { id, title, content, excerpt, featuredImage, category, tags, isPublished } = req.body;
        const existing = await prisma_1.prisma.blog.findUnique({ where: { id: id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 400, 'The blog is not found');
        let updatedData = {};
        if (title) {
            updatedData.title = title;
            updatedData.slug = generateSlug(title);
            let finalSlug = updatedData.slug;
            let counter = 1;
            while (await prisma_1.prisma.blog.findFirst({ where: { slug: finalSlug, NOT: { id: id } } })) {
                finalSlug = `${updatedData.slug}-${counter++}`;
            }
            updatedData.slug = finalSlug;
        }
        if (content !== undefined)
            updatedData.content = content;
        if (excerpt !== undefined)
            updatedData.excerpt = excerpt;
        if (category !== undefined)
            updatedData.category = category;
        if (tags !== undefined)
            updatedData.tags = tags;
        if (featuredImage !== undefined)
            updatedData.featuredImage = featuredImage;
        if (isPublished !== undefined) {
            updatedData.isPublished = isPublished;
            updatedData.publishedAt = isPublished ? new Date() : null;
        }
        const updatedBlog = await prisma_1.prisma.blog.update({ where: { id: id }, data: updatedData });
        return (0, errorHandler_1.errorHandler)(res, 200, "The blog updated successfully!", false, updatedBlog);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.updateBlog = updateBlog;
// DELETE blog (admin only)
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.body;
        await prisma_1.prisma.blog.delete({ where: { id: id } });
        res.json({ success: true, message: 'Blog deleted' });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.deleteBlog = deleteBlog;
const getAllBlogs = async (req, res) => {
    try {
        const { page = "1", limit = "10", category, tag } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        let where = { isPublished: true };
        if (category)
            where.category = category;
        if (tag)
            where.tags = { has: tag };
        const [blogs, totalCount] = await Promise.all([
            prisma_1.prisma.blog.findMany({
                where,
                skip,
                take,
                orderBy: { publishedAt: 'desc' }
            }),
            prisma_1.prisma.blog.count({ where }),
        ]);
        res.json({
            success: true,
            data: blogs,
            pagination: {
                page: parseInt(page),
                limit: take,
                totalPages: Math.ceil(totalCount / take),
                totalCount,
            },
        });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getAllBlogs = getAllBlogs;
const getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.body;
        console.log(req.params, "params");
        const blog = await prisma_1.prisma.blog.findUnique({ where: { slug: slug } });
        if (!blog)
            return (0, errorHandler_1.errorHandler)(res, 404, 'Blog not found');
        // Increment views
        await prisma_1.prisma.blog.update({ where: { id: blog.id }, data: { views: blog.views + 1 } });
        return (0, errorHandler_1.errorHandler)(res, 200, "The blog found", false, blog);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getBlogBySlug = getBlogBySlug;
const getBlogById = async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await prisma_1.prisma.blog.findUnique({ where: { id: id } });
        if (!blog)
            return (0, errorHandler_1.errorHandler)(res, 404, 'Blog not found');
        // Increment views
        await prisma_1.prisma.blog.update({ where: { id: blog.id }, data: { views: blog.views + 1 } });
        return (0, errorHandler_1.errorHandler)(res, 200, "The blog found", false, blog);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getBlogById = getBlogById;
