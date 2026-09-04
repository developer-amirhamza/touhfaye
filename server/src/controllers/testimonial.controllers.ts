import { Request, Response } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { prisma } from '../lib/prisma';

export const getTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return errorHandler(res, 200, 'Testimonials retrieved', false, testimonials);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const getAllTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return errorHandler(res, 200, 'All testimonials retrieved', false, testimonials);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { name, role, location, quote, rating } = req.body;
    if (!name || !quote) return errorHandler(res, 400, 'Name and quote are required');
    if (rating !== undefined && (rating < 1 || rating > 5)) return errorHandler(res, 400, 'Rating must be between 1 and 5');
    const testimonial = await prisma.testimonial.create({
      data: { name, role: role || null, location: location || null, quote, rating: rating ?? 5 },
    });
    return errorHandler(res, 201, 'Testimonial created', false, testimonial);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id, name, role, location, quote, rating, isActive } = req.body;
    if (!id) return errorHandler(res, 400, 'Testimonial ID is required');
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Testimonial not found');
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (location !== undefined) data.location = location;
    if (quote !== undefined) data.quote = quote;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return errorHandler(res, 400, 'Rating must be between 1 and 5');
      data.rating = rating;
    }
    if (isActive !== undefined) data.isActive = isActive;
    const updated = await prisma.testimonial.update({ where: { id }, data });
    return errorHandler(res, 200, 'Testimonial updated', false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'Testimonial ID is required');
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Testimonial not found');
    await prisma.testimonial.delete({ where: { id } });
    return errorHandler(res, 200, 'Testimonial deleted', false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};