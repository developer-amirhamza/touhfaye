import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { errorHandler } from "../utils/errorHandler";
import { sendEmail } from "../config/sendEmail";

// Shape a session for the public homepage carousel: spots left is derived
// from the live registration count, never stored, so it can't drift.
const toPublic = (session: any) => {
    const { registrations, _count, ...rest } = session;
    const spotsLeft = rest.capacity != null ? Math.max(0, rest.capacity - (_count?.registrations ?? 0)) : null;
    return { ...rest, spotsLeft };
};

// Public: upcoming/published training sessions, live sessions first (soonest
// first), on-demand sessions after.
export const getAllTrainingSessions = async (req: Request, res: Response) => {
    try {
        const sessions = await prisma.trainingSession.findMany({
            where: { isPublished: true },
            include: { _count: { select: { registrations: true } } },
            orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
        });
        return errorHandler(res, 200, "Training sessions fetched", false, sessions.map(toPublic));
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Admin: every session including drafts, with the raw registration count.
export const getAllTrainingSessionsAdmin = async (req: Request, res: Response) => {
    try {
        const sessions = await prisma.trainingSession.findMany({
            include: { _count: { select: { registrations: true } } },
            orderBy: { createdAt: "desc" },
        });
        return errorHandler(res, 200, "Training sessions fetched", false, sessions);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const createTrainingSession = async (req: Request, res: Response) => {
    try {
        const { tag, title, description, audience, durationMin, sessionType, startsAt, capacity, isPublished } = req.body;
        if (!tag || !title || !description || !audience || !durationMin) {
            return errorHandler(res, 400, "Please provide the required fields", true);
        }
        const session = await prisma.trainingSession.create({
            data: {
                tag,
                title,
                description,
                audience,
                durationMin: Number(durationMin),
                sessionType: sessionType || "LIVE",
                startsAt: startsAt ? new Date(startsAt) : null,
                capacity: capacity != null && capacity !== "" ? Number(capacity) : null,
                isPublished: isPublished ?? true,
            },
        });
        return errorHandler(res, 200, "Training session created", false, session);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const updateTrainingSession = async (req: Request, res: Response) => {
    try {
        const { id, tag, title, description, audience, durationMin, sessionType, startsAt, capacity, isPublished } = req.body;
        const existing = await prisma.trainingSession.findUnique({ where: { id } });
        if (!existing) return errorHandler(res, 404, "Training session not found");

        const session = await prisma.trainingSession.update({
            where: { id },
            data: {
                tag,
                title,
                description,
                audience,
                durationMin: durationMin !== undefined ? Number(durationMin) : undefined,
                sessionType,
                startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : undefined,
                capacity: capacity !== undefined ? (capacity != null && capacity !== "" ? Number(capacity) : null) : undefined,
                isPublished,
            },
        });
        return errorHandler(res, 200, "Training session updated", false, session);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const deleteTrainingSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        if (!id) return errorHandler(res, 400, "Training session id is required");
        await prisma.trainingSession.delete({ where: { id } });
        return errorHandler(res, 200, "Training session deleted", false);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Public: reserve a spot on a training session.
export const registerForTrainingSession = async (req: Request, res: Response) => {
    try {
        const { sessionId, name, email } = req.body;
        if (!sessionId || !name?.trim() || !email?.trim()) {
            return errorHandler(res, 400, "Please provide your name and email", true);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return errorHandler(res, 400, "Please enter a valid email address", true);
        }

        const session = await prisma.trainingSession.findUnique({
            where: { id: sessionId },
            include: { _count: { select: { registrations: true } } },
        });
        if (!session || !session.isPublished) return errorHandler(res, 404, "Training session not found");

        const cleanEmail = email.trim().toLowerCase();

        const already = await prisma.trainingRegistration.findUnique({
            where: { sessionId_email: { sessionId, email: cleanEmail } },
        });
        if (already) {
            return errorHandler(res, 200, "You're already registered for this session", false, { alreadyRegistered: true });
        }

        if (session.capacity != null && session._count.registrations >= session.capacity) {
            return errorHandler(res, 400, "Sorry, this session is full", true);
        }

        const registration = await prisma.trainingRegistration.create({
            data: { sessionId, name: name.trim(), email: cleanEmail },
        });

        const whenLabel = session.sessionType === "ON_DEMAND"
            ? "Watch any time — the recording link is below."
            : session.startsAt
            ? new Date(session.startsAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Sydney" })
            : "";

        sendEmail({
            sendTo: cleanEmail,
            subject: `You're in — ${session.title}`,
            html: `
                <h2>${session.title}</h2>
                <p>Hi ${registration.name.split(" ")[0]}, you're registered.</p>
                <p><b>${whenLabel}</b></p>
                <p>${session.durationMin} min · ${session.audience}</p>
                <p style="color:#888;font-size:13px">No cost, no sales pitch. We'll send the recording afterwards.</p>`,
        }).catch((e) => console.error("Training session confirmation email failed:", e.message));

        return errorHandler(res, 200, "You're registered! Check your email for confirmation.", false, { registrationId: registration.id });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Admin: registrants for a session (e.g. for exporting an attendee list).
export const getTrainingSessionRegistrations = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return errorHandler(res, 400, "sessionId is required");
        const registrations = await prisma.trainingRegistration.findMany({
            where: { sessionId },
            orderBy: { createdAt: "desc" },
        });
        return errorHandler(res, 200, "Registrations fetched", false, registrations);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};
