"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.updateTestimonial = exports.createTestimonial = exports.getAllTestimonials = exports.getTestimonials = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const getTestimonials = async (_req, res) => {
    try {
        const testimonials = await prisma_1.prisma.testimonial.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, 'Testimonials retrieved', false, testimonials);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.getTestimonials = getTestimonials;
const getAllTestimonials = async (_req, res) => {
    try {
        const testimonials = await prisma_1.prisma.testimonial.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, 'All testimonials retrieved', false, testimonials);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.getAllTestimonials = getAllTestimonials;
const createTestimonial = async (req, res) => {
    try {
        const { name, role, location, quote, rating } = req.body;
        if (!name || !quote)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Name and quote are required');
        if (rating !== undefined && (rating < 1 || rating > 5))
            return (0, errorHandler_1.errorHandler)(res, 400, 'Rating must be between 1 and 5');
        const testimonial = await prisma_1.prisma.testimonial.create({
            data: { name, role: role || null, location: location || null, quote, rating: rating ?? 5 },
        });
        return (0, errorHandler_1.errorHandler)(res, 201, 'Testimonial created', false, testimonial);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.createTestimonial = createTestimonial;
const updateTestimonial = async (req, res) => {
    try {
        const { id, name, role, location, quote, rating, isActive } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Testimonial ID is required');
        const existing = await prisma_1.prisma.testimonial.findUnique({ where: { id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, 'Testimonial not found');
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (role !== undefined)
            data.role = role;
        if (location !== undefined)
            data.location = location;
        if (quote !== undefined)
            data.quote = quote;
        if (rating !== undefined) {
            if (rating < 1 || rating > 5)
                return (0, errorHandler_1.errorHandler)(res, 400, 'Rating must be between 1 and 5');
            data.rating = rating;
        }
        if (isActive !== undefined)
            data.isActive = isActive;
        const updated = await prisma_1.prisma.testimonial.update({ where: { id }, data });
        return (0, errorHandler_1.errorHandler)(res, 200, 'Testimonial updated', false, updated);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.updateTestimonial = updateTestimonial;
const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Testimonial ID is required');
        const existing = await prisma_1.prisma.testimonial.findUnique({ where: { id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, 'Testimonial not found');
        await prisma_1.prisma.testimonial.delete({ where: { id } });
        return (0, errorHandler_1.errorHandler)(res, 200, 'Testimonial deleted', false, null);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || 'Internal server error');
    }
};
exports.deleteTestimonial = deleteTestimonial;
