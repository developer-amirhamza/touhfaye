"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubcategory = exports.updateSubcategory = exports.createSubcategory = exports.getSubcategoryBySlug = exports.getSubcategoriesByCategory = void 0;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../utils/errorHandler");
const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};
// GET subcategories by category (public)
const getSubcategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const subcategories = await prisma_1.prisma.subcategory.findMany({
            where: { categoryId: categoryId },
            include: { products: { where: { isActive: true } } },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Subcategories fetched", false, subcategories);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.getSubcategoriesByCategory = getSubcategoriesByCategory;
// GET single subcategory by slug (public, includes products)
const getSubcategoryBySlug = async (req, res) => {
    try {
        const { slug, categoryId } = req.body;
        const subcategory = await prisma_1.prisma.subcategory.findFirst({
            where: { slug: slug, categoryId: categoryId },
            include: { products: { where: { isActive: true } }, category: true },
        });
        if (!subcategory)
            return (0, errorHandler_1.errorHandler)(res, 404, "Subcategory not found");
        return (0, errorHandler_1.errorHandler)(res, 200, "Subcategory fetched", false, subcategory);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.getSubcategoryBySlug = getSubcategoryBySlug;
// CREATE subcategory (admin only)
const createSubcategory = async (req, res) => {
    try {
        const { title, categoryId } = req.body;
        if (!title || !categoryId)
            return (0, errorHandler_1.errorHandler)(res, 400, "Title and categoryId required");
        const category = await prisma_1.prisma.category.findUnique({ where: { id: categoryId } });
        if (!category)
            return (0, errorHandler_1.errorHandler)(res, 404, "Category not found");
        const slug = generateSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma_1.prisma.subcategory.findFirst({ where: { slug: finalSlug, categoryId } })) {
            finalSlug = `${slug}-${counter++}`;
        }
        const subcategory = await prisma_1.prisma.subcategory.create({
            data: { title, slug: finalSlug, categoryId },
        });
        return (0, errorHandler_1.errorHandler)(res, 201, "Subcategory created", false, subcategory);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.createSubcategory = createSubcategory;
// UPDATE subcategory (admin)
const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.body;
        const { title } = req.body;
        const existing = await prisma_1.prisma.subcategory.findUnique({ where: { id: id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, "Subcategory not found");
        const updateData = {};
        if (title) {
            updateData.title = title;
            updateData.slug = generateSlug(title);
            // ensure uniqueness within same category
            const conflict = await prisma_1.prisma.subcategory.findFirst({
                where: { title, categoryId: existing.categoryId, NOT: { id: id } },
            });
            if (conflict)
                return (0, errorHandler_1.errorHandler)(res, 409, "Subcategory title already exists in this category");
        }
        const updated = await prisma_1.prisma.subcategory.update({ where: { id: id }, data: updateData });
        return (0, errorHandler_1.errorHandler)(res, 200, "Subcategory updated", false, updated);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.updateSubcategory = updateSubcategory;
// DELETE subcategory (admin)
const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.body;
        const subcategory = await prisma_1.prisma.subcategory.findUnique({ where: { id: id } });
        if (!subcategory)
            return (0, errorHandler_1.errorHandler)(res, 404, "Subcategory not found");
        // Check if any product uses this subcategory
        const productCount = await prisma_1.prisma.product.count({ where: { subcategoryId: id } });
        if (productCount > 0) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Cannot delete subcategory that has products. Reassign or delete products first.");
        }
        await prisma_1.prisma.subcategory.delete({ where: { id: id } });
        return (0, errorHandler_1.errorHandler)(res, 200, "Subcategory deleted", false, null);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.deleteSubcategory = deleteSubcategory;
