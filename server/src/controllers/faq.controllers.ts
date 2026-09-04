import { Request, Response } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { prisma } from '../lib/prisma';

const SURFACES = ['FAQ_PAGE', 'BLOG_POST', 'BLOG_LIST', 'PRODUCT_PAGE', 'PRODUCT_LIST', 'PORTAL'];

// Only the field that matches a surface is ever persisted — keeps stored
// rows from carrying a stale blogId/productId/category left over from a
// surface the admin switched away from.
const targetFieldsFor = (surface: string, blogId?: string, productId?: string, category?: string) => ({
  blogId: surface === 'BLOG_POST' ? (blogId || null) : null,
  productId: surface === 'PRODUCT_PAGE' ? (productId || null) : null,
  category: surface === 'FAQ_PAGE' ? (category || null) : null,
});

// Public: FAQs for a given surface — the standalone "Long FAQ" page
// (default), a specific article's embedded FAQ section (BLOG_POST +
// blogId), a specific product's embedded FAQ section (PRODUCT_PAGE +
// productId), or a page-level surface with no target (BLOG_LIST,
// PRODUCT_LIST, PORTAL).
export const getFaqs = async (req: Request, res: Response) => {
  try {
    const { surface, blogId, productId, category } = req.query;
    const where: any = { isActive: true, surface: surface ? String(surface) : 'FAQ_PAGE' };
    if (blogId) where.blogId = String(blogId);
    if (productId) where.productId = String(productId);
    if (category) where.category = String(category);
    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return errorHandler(res, 200, 'FAQs retrieved', false, faqs);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const getAllFaqs = async (_req: Request, res: Response) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: [{ surface: 'asc' }, { order: 'asc' }],
    });
    return errorHandler(res, 200, 'All FAQs retrieved', false, faqs);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer, surface, blogId, productId, category, order, isActive } = req.body;
    if (!question || !answer) return errorHandler(res, 400, 'Question and answer are required');
    const chosenSurface = surface && SURFACES.includes(surface) ? surface : 'FAQ_PAGE';
    if (chosenSurface === 'BLOG_POST' && !blogId) return errorHandler(res, 400, 'Choose a blog post for this surface');
    if (chosenSurface === 'PRODUCT_PAGE' && !productId) return errorHandler(res, 400, 'Choose a product for this surface');

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        surface: chosenSurface,
        ...targetFieldsFor(chosenSurface, blogId, productId, category),
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });
    return errorHandler(res, 201, 'FAQ created', false, faq);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id, question, answer, surface, blogId, productId, category, order, isActive } = req.body;
    if (!id) return errorHandler(res, 400, 'FAQ ID is required');
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'FAQ not found');

    const data: any = {};
    if (question !== undefined) data.question = question;
    if (answer !== undefined) data.answer = answer;
    if (order !== undefined) data.order = order;
    if (isActive !== undefined) data.isActive = isActive;

    if (surface !== undefined) {
      const chosenSurface = SURFACES.includes(surface) ? surface : existing.surface;
      if (chosenSurface === 'BLOG_POST' && !(blogId ?? existing.blogId)) {
        return errorHandler(res, 400, 'Choose a blog post for this surface');
      }
      if (chosenSurface === 'PRODUCT_PAGE' && !(productId ?? existing.productId)) {
        return errorHandler(res, 400, 'Choose a product for this surface');
      }
      data.surface = chosenSurface;
      Object.assign(data, targetFieldsFor(
        chosenSurface,
        blogId ?? existing.blogId ?? undefined,
        productId ?? existing.productId ?? undefined,
        category ?? existing.category ?? undefined,
      ));
    }

    const updated = await prisma.faq.update({ where: { id }, data });
    return errorHandler(res, 200, 'FAQ updated', false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'FAQ ID is required');
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'FAQ not found');
    await prisma.faq.delete({ where: { id } });
    return errorHandler(res, 200, 'FAQ deleted', false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};
