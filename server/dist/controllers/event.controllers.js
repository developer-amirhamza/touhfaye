"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventById = exports.getEventBySlug = exports.getAdminAllEvents = exports.getAllEvents = exports.deleteEvent = exports.updateEvent = exports.createEvent = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};
const createEvent = async (req, res) => {
    try {
        const { title, excerpt, description, category, location, eventDate, coverImage, designImages, galleryImages, feedback, isPublished, } = req.body;
        if (!title || !description)
            return (0, errorHandler_1.errorHandler)(res, 400, 'Title and description required');
        let slug = generateSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma_1.prisma.event.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter++}`;
        }
        const event = await prisma_1.prisma.event.create({
            data: {
                title,
                description,
                excerpt,
                category,
                location,
                eventDate: eventDate ? new Date(eventDate) : null,
                coverImage,
                designImages: designImages || [],
                galleryImages: galleryImages || [],
                feedback: feedback || undefined,
                slug: finalSlug,
                isPublished: isPublished || false,
                publishedAt: isPublished ? new Date() : null,
            }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The event has been created successfully!", false, event);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const { id, title, excerpt, description, category, location, eventDate, coverImage, designImages, galleryImages, feedback, isPublished, } = req.body;
        const existing = await prisma_1.prisma.event.findUnique({ where: { id: id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 400, 'The event is not found');
        let updatedData = {};
        if (title) {
            updatedData.title = title;
            updatedData.slug = generateSlug(title);
            let finalSlug = updatedData.slug;
            let counter = 1;
            while (await prisma_1.prisma.event.findFirst({ where: { slug: finalSlug, NOT: { id: id } } })) {
                finalSlug = `${updatedData.slug}-${counter++}`;
            }
            updatedData.slug = finalSlug;
        }
        if (excerpt !== undefined)
            updatedData.excerpt = excerpt;
        if (description !== undefined)
            updatedData.description = description;
        if (category !== undefined)
            updatedData.category = category;
        if (location !== undefined)
            updatedData.location = location;
        if (eventDate !== undefined)
            updatedData.eventDate = eventDate ? new Date(eventDate) : null;
        if (coverImage !== undefined)
            updatedData.coverImage = coverImage;
        if (designImages !== undefined)
            updatedData.designImages = designImages;
        if (galleryImages !== undefined)
            updatedData.galleryImages = galleryImages;
        if (feedback !== undefined)
            updatedData.feedback = feedback;
        if (isPublished !== undefined) {
            updatedData.isPublished = isPublished;
            updatedData.publishedAt = isPublished ? new Date() : null;
        }
        const updatedEvent = await prisma_1.prisma.event.update({ where: { id: id }, data: updatedData });
        return (0, errorHandler_1.errorHandler)(res, 200, "The event updated successfully!", false, updatedEvent);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.body;
        await prisma_1.prisma.event.delete({ where: { id: id } });
        res.json({ success: true, message: 'Event deleted' });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.deleteEvent = deleteEvent;
// Public: published events only.
const getAllEvents = async (req, res) => {
    try {
        const { page = "1", limit = "10", category } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        let where = { isPublished: true };
        if (category)
            where.category = category;
        const [events, totalCount] = await Promise.all([
            prisma_1.prisma.event.findMany({
                where,
                skip,
                take,
                orderBy: { publishedAt: 'desc' },
            }),
            prisma_1.prisma.event.count({ where }),
        ]);
        res.json({
            success: true,
            data: events,
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
exports.getAllEvents = getAllEvents;
// Admin only: every event regardless of publish state.
const getAdminAllEvents = async (req, res) => {
    try {
        const { page = "1", limit = "100" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [events, totalCount] = await Promise.all([
            prisma_1.prisma.event.findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.event.count(),
        ]);
        res.json({
            success: true,
            data: events,
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
exports.getAdminAllEvents = getAdminAllEvents;
const getEventBySlug = async (req, res) => {
    try {
        const { slug } = req.body;
        const event = await prisma_1.prisma.event.findUnique({ where: { slug: slug } });
        if (!event)
            return (0, errorHandler_1.errorHandler)(res, 404, 'Event not found');
        await prisma_1.prisma.event.update({ where: { id: event.id }, data: { views: event.views + 1 } });
        return (0, errorHandler_1.errorHandler)(res, 200, "The event found", false, event);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getEventBySlug = getEventBySlug;
// Admin only: used by the edit page, so it must not be blocked by
// isPublished and must not inflate the public view counter.
const getEventById = async (req, res) => {
    try {
        const { id } = req.body;
        const event = await prisma_1.prisma.event.findUnique({ where: { id: id } });
        if (!event)
            return (0, errorHandler_1.errorHandler)(res, 404, 'Event not found');
        return (0, errorHandler_1.errorHandler)(res, 200, "The event found", false, event);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.getEventById = getEventById;
