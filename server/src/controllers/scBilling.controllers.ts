import { Request, Response } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { prisma } from '../lib/prisma';

const ENTRY_TYPES = ['support', 'travel'];

const PLAN_FIELDS = [
  'participant',
  'ndisNumber',
  'coordinator',
  'rate',
  'travelRate',
  'itemCode',
  'travelItemCode',
  'budget',
  'startDate',
  'endDate',
  'reportLeadDays',
  'color',
] as const;

// ------------------------------- plans ---------------------------------

export const getScPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.scPlan.findMany({ orderBy: { createdAt: 'asc' } });
    return errorHandler(res, 200, 'Plans retrieved', false, plans);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const createScPlan = async (req: Request, res: Response) => {
  try {
    const { participant, startDate, endDate } = req.body;
    if (!participant || !startDate || !endDate) {
      return errorHandler(res, 400, 'Participant, start date and end date are required');
    }

    const data: any = { participant, startDate, endDate };
    for (const key of PLAN_FIELDS) {
      if (key === 'participant' || key === 'startDate' || key === 'endDate') continue;
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    data.coordinator = data.coordinator ?? '';
    data.rate = data.rate ?? 0;
    data.itemCode = data.itemCode ?? '';

    const plan = await prisma.scPlan.create({ data });
    return errorHandler(res, 201, 'Plan created', false, plan);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updateScPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'Plan ID is required');
    const existing = await prisma.scPlan.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Plan not found');

    const data: any = {};
    for (const key of PLAN_FIELDS) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const updated = await prisma.scPlan.update({ where: { id }, data });
    return errorHandler(res, 200, 'Plan updated', false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const deleteScPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'Plan ID is required');
    const existing = await prisma.scPlan.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Plan not found');

    const entryCount = await prisma.scTimeEntry.count({ where: { planId: id } });
    if (entryCount > 0) {
      return errorHandler(res, 400, `Delete the ${entryCount} logged ${entryCount === 1 ? 'entry' : 'entries'} against this plan first`);
    }

    await prisma.scPlan.delete({ where: { id } });
    return errorHandler(res, 200, 'Plan deleted', false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

// ------------------------------- entries -------------------------------

export const getScEntries = async (req: Request, res: Response) => {
  try {
    const { planId } = req.query;
    const where: any = {};
    if (planId) where.planId = String(planId);
    const entries = await prisma.scTimeEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
    return errorHandler(res, 200, 'Entries retrieved', false, entries);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const createScEntry = async (req: Request, res: Response) => {
  try {
    const { planId, date, startTime, endTime, hours, type, activity, note, coordinator } = req.body;
    if (!planId || !date || !startTime || !endTime || !hours) {
      return errorHandler(res, 400, 'Plan, date, time range and hours are required');
    }
    const plan = await prisma.scPlan.findUnique({ where: { id: planId } });
    if (!plan) return errorHandler(res, 404, 'Plan not found');

    const chosenType = ENTRY_TYPES.includes(type) ? type : 'support';
    const entry = await prisma.scTimeEntry.create({
      data: {
        planId,
        date,
        startTime,
        endTime,
        hours,
        type: chosenType,
        activity: chosenType === 'travel' ? 'Travel' : (activity || 'Other'),
        note: note || null,
        coordinator: coordinator || plan.coordinator,
      },
    });
    return errorHandler(res, 201, 'Entry logged', false, entry);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updateScEntry = async (req: Request, res: Response) => {
  try {
    const { id, date, startTime, endTime, hours, type, activity, note, coordinator } = req.body;
    if (!id) return errorHandler(res, 400, 'Entry ID is required');
    const existing = await prisma.scTimeEntry.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Entry not found');

    const data: any = {};
    if (date !== undefined) data.date = date;
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (hours !== undefined) data.hours = hours;
    if (type !== undefined && ENTRY_TYPES.includes(type)) data.type = type;
    if (activity !== undefined) data.activity = activity;
    if (note !== undefined) data.note = note || null;
    if (coordinator !== undefined) data.coordinator = coordinator;

    const updated = await prisma.scTimeEntry.update({ where: { id }, data });
    return errorHandler(res, 200, 'Entry updated', false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const deleteScEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'Entry ID is required');
    const existing = await prisma.scTimeEntry.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Entry not found');
    await prisma.scTimeEntry.delete({ where: { id } });
    return errorHandler(res, 200, 'Entry deleted', false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};
