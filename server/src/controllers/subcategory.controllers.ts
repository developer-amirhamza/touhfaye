import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { errorHandler } from '../utils/errorHandler';

const generateSlug = (title: string): string => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

// GET subcategories by category (public)
export const getSubcategoriesByCategory = async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.body;
        const subcategories = await prisma.subcategory.findMany({
            where: { categoryId:categoryId as string  },
            include: { products: { where: { isActive: true } } },
        });
        return errorHandler(res, 200, "Subcategories fetched", false, subcategories);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};

// GET single subcategory by slug (public, includes products)
export const getSubcategoryBySlug = async (req: Request, res: Response) => {
    try {
        const { slug, categoryId } = req.body;
        const subcategory = await prisma.subcategory.findFirst({
            where: { slug:slug as string, categoryId:categoryId as string },
            include: { products: { where: { isActive: true } }, category: true },
        });
        if (!subcategory) return errorHandler(res, 404, "Subcategory not found");
        return errorHandler(res, 200, "Subcategory fetched", false, subcategory);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};

// CREATE subcategory (admin only)
export const createSubcategory = async (req: Request, res: Response) => {
    try {
        const { title, categoryId } = req.body;
        if (!title || !categoryId) return errorHandler(res, 400, "Title and categoryId required");

        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) return errorHandler(res, 404, "Category not found");

        const slug = generateSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma.subcategory.findFirst({ where: { slug: finalSlug, categoryId } })) {
            finalSlug = `${slug}-${counter++}`;
        }

        const subcategory = await prisma.subcategory.create({
            data: { title, slug: finalSlug, categoryId },
        });
        return errorHandler(res, 201, "Subcategory created", false, subcategory);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};

// UPDATE subcategory (admin)
export const updateSubcategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        const { title } = req.body;
        const existing = await prisma.subcategory.findUnique({ where: { id:id as string } });
        if (!existing) return errorHandler(res, 404, "Subcategory not found");

        const updateData: any = {};
        if (title) {
            updateData.title = title;
            updateData.slug = generateSlug(title);
            // ensure uniqueness within same category
            const conflict = await prisma.subcategory.findFirst({
                where: { title, categoryId: existing.categoryId, NOT: {  id:id as string } },
            });
            if (conflict) return errorHandler(res, 409, "Subcategory title already exists in this category");
        }
        const updated = await prisma.subcategory.update({ where: {  id:id as string }, data: updateData });
        return errorHandler(res, 200, "Subcategory updated", false, updated);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};

// DELETE subcategory (admin)
export const deleteSubcategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        const subcategory = await prisma.subcategory.findUnique({ where: {  id:id as string } });
        if (!subcategory) return errorHandler(res, 404, "Subcategory not found");

        // Check if any product uses this subcategory
        const productCount = await prisma.product.count({ where: { subcategoryId:id as string } });
        if (productCount > 0) {
            return errorHandler(res, 400, "Cannot delete subcategory that has products. Reassign or delete products first.");
        }
        await prisma.subcategory.delete({ where: {  id:id as string} });
        return errorHandler(res, 200, "Subcategory deleted", false, null);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};