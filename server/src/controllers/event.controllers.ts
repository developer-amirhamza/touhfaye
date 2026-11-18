import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";

const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const {
            title, excerpt, description, category, location, eventDate,
            coverImage, designImages, galleryImages, feedback, isPublished,
        } = req.body;
        if (!title || !description) return errorHandler(res, 400, 'Title and description required');

        let slug = generateSlug(title);
        let finalSlug = slug;
        let counter = 1;
        while (await prisma.event.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter++}`;
        }

        const event = await prisma.event.create({
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

        return errorHandler(res, 200, "The event has been created successfully!", false, event);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const {
            id, title, excerpt, description, category, location, eventDate,
            coverImage, designImages, galleryImages, feedback, isPublished,
        } = req.body;
        const existing = await prisma.event.findUnique({ where: { id: id as string } });
        if (!existing) return errorHandler(res, 400, 'The event is not found');

        let updatedData: any = {};
        if (title) {
            updatedData.title = title;
            updatedData.slug = generateSlug(title);
            let finalSlug = updatedData.slug;
            let counter = 1;
            while (await prisma.event.findFirst({ where: { slug: finalSlug, NOT: { id: id as string } } })) {
                finalSlug = `${updatedData.slug}-${counter++}`;
            }
            updatedData.slug = finalSlug;
        }
        if (excerpt !== undefined) updatedData.excerpt = excerpt;
        if (description !== undefined) updatedData.description = description;
        if (category !== undefined) updatedData.category = category;
        if (location !== undefined) updatedData.location = location;
        if (eventDate !== undefined) updatedData.eventDate = eventDate ? new Date(eventDate) : null;
        if (coverImage !== undefined) updatedData.coverImage = coverImage;
        if (designImages !== undefined) updatedData.designImages = designImages;
        if (galleryImages !== undefined) updatedData.galleryImages = galleryImages;
        if (feedback !== undefined) updatedData.feedback = feedback;
        if (isPublished !== undefined) {
            updatedData.isPublished = isPublished;
            updatedData.publishedAt = isPublished ? new Date() : null;
        }

        const updatedEvent = await prisma.event.update({ where: { id: id as string }, data: updatedData });
        return errorHandler(res, 200, "The event updated successfully!", false, updatedEvent);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error");
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        await prisma.event.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Event deleted' });
    } catch (error: any) {
        errorHandler(res, 500, error.message);
    }
};

// Public: published events only.
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const { page = "1", limit = "10", category } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);
        let where: any = { isPublished: true };
        if (category) where.category = category as string;

        const [events, totalCount] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take,
                orderBy: { publishedAt: 'desc' },
            }),
            prisma.event.count({ where }),
        ]);

        res.json({
            success: true,
            data: events,
            pagination: {
                page: parseInt(page as string),
                limit: take,
                totalPages: Math.ceil(totalCount / take),
                totalCount,
            },
        });
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

// Admin only: every event regardless of publish state.
export const getAdminAllEvents = async (req: Request, res: Response) => {
    try {
        const { page = "1", limit = "100" } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [events, totalCount] = await Promise.all([
            prisma.event.findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.event.count(),
        ]);

        res.json({
            success: true,
            data: events,
            pagination: {
                page: parseInt(page as string),
                limit: take,
                totalPages: Math.ceil(totalCount / take),
                totalCount,
            },
        });
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const getEventBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.body;
        const event = await prisma.event.findUnique({ where: { slug: slug as string } });
        if (!event) return errorHandler(res, 404, 'Event not found');

        await prisma.event.update({ where: { id: event.id }, data: { views: event.views + 1 } });

        return errorHandler(res, 200, "The event found", false, event);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

// Admin only: used by the edit page, so it must not be blocked by
// isPublished and must not inflate the public view counter.
export const getEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        const event = await prisma.event.findUnique({ where: { id: id as string } });
        if (!event) return errorHandler(res, 404, 'Event not found');

        return errorHandler(res, 200, "The event found", false, event);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};
