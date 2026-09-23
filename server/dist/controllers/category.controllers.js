"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = exports.getCategoryBySlug = exports.deleteCategory = exports.updateCategory = exports.createCategory = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
// Helper: generate slug from title
const generatedSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};
const createCategory = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return (0, errorHandler_1.errorHandler)(res, 404, "The category title is required!");
        }
        const existing = await prisma_1.prisma.category.findFirst({
            where: { title: { equals: title, mode: "insensitive" } }
        });
        if (existing) {
            return (0, errorHandler_1.errorHandler)(res, 409, "This category already exists!");
        }
        const slug = generatedSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma_1.prisma.category.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }
        const category = await prisma_1.prisma.category.create({ data: { title, slug: finalSlug } });
        return (0, errorHandler_1.errorHandler)(res, 200, "The category has been created successfully!", false, category);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { id, title } = req.body;
        if (!id || !title)
            return (0, errorHandler_1.errorHandler)(res, 404, "The category title is required!");
        const existing = await prisma_1.prisma.category.findUnique({ where: { id: id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, "The category not found");
        const updateData = {};
        if (title) {
            const titleConflict = await prisma_1.prisma.category.findFirst({
                where: { title: { equals: title, mode: "insensitive" }, NOT: { id } }
            });
            if (titleConflict) {
                return (0, errorHandler_1.errorHandler)(res, 409, "Category with this title already exists");
            }
            updateData.title = title;
            updateData.slug = generatedSlug(title);
        }
        const updatedCategory = await prisma_1.prisma.category.update({
            where: { id },
            data: updateData,
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The category updated successfully!", false, updatedCategory);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const existing = await prisma_1.prisma.category.findUnique({ where: { id: id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, "The category not found");
        const productCount = await prisma_1.prisma.product.count({ where: { categoryId: id } });
        if (productCount > 0) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Cannot delete category that has products. Reassign or delete products first.");
        }
        await await prisma_1.prisma.category.delete({ where: { id } });
        return (0, errorHandler_1.errorHandler)(res, 200, "The category deleted successfully!", false);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.deleteCategory = deleteCategory;
const getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.body;
        const category = await prisma_1.prisma.category.findFirst({ where: { slug }, include: { products: true } });
        if (!category)
            return (0, errorHandler_1.errorHandler)(res, 404, "The category not found");
        return (0, errorHandler_1.errorHandler)(res, 200, "The category gotten successfully!", false, category);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getCategoryBySlug = getCategoryBySlug;
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({ orderBy: { "title": "asc" }, include: { products: true } });
        if (!categories)
            return (0, errorHandler_1.errorHandler)(res, 404, "The category not found");
        return (0, errorHandler_1.errorHandler)(res, 200, "The category gotten successfully!", false, categories);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getAllCategories = getAllCategories;
