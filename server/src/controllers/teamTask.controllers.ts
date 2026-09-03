import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { errorHandler } from "../utils/errorHandler";

interface AuthRequest extends Request {
    userId?: string;
}

const TYPES = ["TASK", "REQUIREMENT", "NOTE"];
const STATUSES = ["OPEN", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH"];

const requesterName = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
    });
    if (!user) return "Unknown";
    return  `${user.firstName} ${user.lastName ?? ""}`.trim();
};

// List all team tasks/notes, newest first.
export const listTeamTasks = async (_req: AuthRequest, res: Response) => {
    try {
        const tasks = await prisma.teamTask.findMany({ orderBy: { createdAt: "desc" } });
        return res.status(200).json({ success: true, error: false, data: tasks });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Create a task / requirement / note. The writer is the logged-in admin.
export const createTeamTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return errorHandler(res, 401, "Authentication required", true);
        const { type, title, description, priority } = req.body;
        if (!title?.trim()) return errorHandler(res, 400, "Title is required", true);
        if (type && !TYPES.includes(type)) return errorHandler(res, 400, "Invalid type", true);
        if (priority && !PRIORITIES.includes(priority)) return errorHandler(res, 400, "Invalid priority", true);

        const task = await prisma.teamTask.create({
            data: {
                type: type ?? "TASK",
                title: title.trim(),
                description: description?.trim() || null,
                priority: priority ?? "NORMAL",
                createdById: userId,
                createdByName: await requesterName(userId),
            },
        });
        return res.status(200).json({ success: true, error: false, message: "Created", data: task });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Accept a task — records the acceptor and moves it to IN_PROGRESS.
// First come, first served: an already-accepted task can't be re-accepted.
export const acceptTeamTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return errorHandler(res, 401, "Authentication required", true);
        const { id } = req.body;
        if (!id) return errorHandler(res, 400, "id is required", true);

        const name = await requesterName(userId);
        // Conditional update so two admins clicking Accept at once can't both win.
        const updated = await prisma.teamTask.updateMany({
            where: { id, acceptedById: null },
            data: {
                acceptedById: userId,
                acceptedByName: name,
                acceptedAt: new Date(),
                status: "IN_PROGRESS",
            },
        });
        if (updated.count === 0) {
            return errorHandler(res, 409, "This task has already been accepted", true);
        }
        const task = await prisma.teamTask.findUnique({ where: { id } });
        return res.status(200).json({ success: true, error: false, message: "Task accepted", data: task });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Update content / status / priority.
export const updateTeamTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return errorHandler(res, 401, "Authentication required", true);
        const { id, title, description, status, priority, type } = req.body;
        if (!id) return errorHandler(res, 400, "id is required", true);

        const existing = await prisma.teamTask.findUnique({ where: { id } });
        if (!existing) return errorHandler(res, 404, "Task not found", true);

        if (status && !STATUSES.includes(status)) return errorHandler(res, 400, "Invalid status", true);
        if (priority && !PRIORITIES.includes(priority)) return errorHandler(res, 400, "Invalid priority", true);
        if (type && !TYPES.includes(type)) return errorHandler(res, 400, "Invalid type", true);

        const data: any = {};
        if (title?.trim()) data.title = title.trim();
        if (description !== undefined) data.description = description?.trim() || null;
        if (priority) data.priority = priority;
        if (type) data.type = type;
        if (status) {
            data.status = status;
            data.completedAt = status === "DONE" ? new Date() : null;
        }

        const task = await prisma.teamTask.update({ where: { id }, data });
        return res.status(200).json({ success: true, error: false, message: "Updated", data: task });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Delete — only the writer can delete their own item (or an OWNER).
export const deleteTeamTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return errorHandler(res, 401, "Authentication required", true);
        const { id } = req.body;
        if (!id) return errorHandler(res, 400, "id is required", true);

        const existing = await prisma.teamTask.findUnique({ where: { id } });
        if (!existing) return errorHandler(res, 404, "Task not found", true);

        const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (existing.createdById !== userId && me?.role !== "OWNER") {
            return errorHandler(res, 403, "Only the writer (or the owner) can delete this", true);
        }

        await prisma.teamTask.delete({ where: { id } });
        return res.status(200).json({ success: true, error: false, message: "Deleted" });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};
