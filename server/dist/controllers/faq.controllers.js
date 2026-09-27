"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFaq = exports.updateFaq = exports.createFaq = exports.getAllFaqs = exports.getFaqs = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const SURFACES = ['FAQ_PAGE', 'BLOG_POST', 'BLOG_LIST', 'PRODUCT_PAGE', 'PRODUCT_LIST', 'PORTAL'];
// Only the field that matches a surface is ever persisted — keeps stored
// rows from carrying a stale blogId/productId/category left over from a
// surface the admin switched away from.
const targetFieldsFor = (surface, blogId, productId, category) => ({
    blogId: surface === 'BLOG_POST' ? (blogId || null) : null,
    productId: surface === 'PRODUCT_PAGE' ? (productId || null) : null,
    category: surface === 'FAQ_PAGE' ? (category || null) : null,
});
// Public: FAQs for a given surface — the standalone "Long FAQ" page
// (default), a specific article's embedded FAQ section (BLOG_POST +
// blogId), a specific product's embedded FAQ section (PRODUCT_PAGE +
// productId), or a page-level surface with no target (BLOG_LIST,
// PRODUCT_LIST, PORTAL).
const getFaqs = async (req, res) => {
    try {
        const { surface, blogId, productId, category } = req.query;
        const where = { isActive: true, surface: surface ? String(surface) : 'FAQ_PAGE' };
        if (blogId)
            where.blogId = String(blogId);
        if (productId)
            where.productId = String(productId);
        if (category)
            where.category = String(category);
        const faqs = await prisma_1.prisma.faq.findMany({
            where,
            orderBy: { order: 'asc' },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, 'FAQs retrieved', false, faqs);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.getFaqs = getFaqs;
const getAllFaqs = async (_req, res) => {
    try {
        const faqs = await prisma_1.prisma.faq.findMany({
            orderBy: [{ surface: 'asc' }, { order: 'asc' }],
        });
        return (0, errorHandler_1.errorHandler)(res, 200, 'All FAQs retrieved', false, faqs);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.getAllFaqs = getAllFaqs;
const createFaq = async (req, res) => {
    try {
        const { question, answer, surface, blogId, productId, category, order, isActive } = req.body;
        if (!question || !answer)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Question and answer are required');
        const chosenSurface = surface && SURFACES.includes(surface) ? surface : 'FAQ_PAGE';
        if (chosenSurface === 'BLOG_POST' && !blogId)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Choose a blog post for this surface');
        if (chosenSurface === 'PRODUCT_PAGE' && !productId)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Choose a product for this surface');
        const faq = await prisma_1.prisma.faq.create({
            data: {
                question,
                answer,
                surface: chosenSurface,
                ...targetFieldsFor(chosenSurface, blogId, productId, category),
                order: order ?? 0,
                isActive: isActive ?? true,
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 201, 'FAQ created', false, faq);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.createFaq = createFaq;
const updateFaq = async (req, res) => {
    try {
        const { id, question, answer, surface, blogId, productId, category, order, isActive } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, 'FAQ ID is required');
        const existing = await prisma_1.prisma.faq.findUnique({ where: { id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, 'FAQ not found');
        const data = {};
        if (question !== undefined)
            data.question = question;
        if (answer !== undefined)
            data.answer = answer;
        if (order !== undefined)
            data.order = order;
        if (isActive !== undefined)
            data.isActive = isActive;
        if (surface !== undefined) {
            const chosenSurface = SURFACES.includes(surface) ? surface : existing.surface;
            if (chosenSurface === 'BLOG_POST' && !(blogId ?? existing.blogId)) {
                return (0, errorHandler_1.errorHandler)(res, 400, 'Choose a blog post for this surface');
            }
            if (chosenSurface === 'PRODUCT_PAGE' && !(productId ?? existing.productId)) {
                return (0, errorHandler_1.errorHandler)(res, 400, 'Choose a product for this surface');
            }
            data.surface = chosenSurface;
            Object.assign(data, targetFieldsFor(chosenSurface, blogId ?? existing.blogId ?? undefined, productId ?? existing.productId ?? undefined, category ?? existing.category ?? undefined));
        }
        const updated = await prisma_1.prisma.faq.update({ where: { id }, data });
        return (0, errorHandler_1.errorHandler)(res, 200, 'FAQ updated', false, updated);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.updateFaq = updateFaq;
const deleteFaq = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, 'FAQ ID is required');
        const existing = await prisma_1.prisma.faq.findUnique({ where: { id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, 'FAQ not found');
        await prisma_1.prisma.faq.delete({ where: { id } });
        return (0, errorHandler_1.errorHandler)(res, 200, 'FAQ deleted', false, null);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.deleteFaq = deleteFaq;
