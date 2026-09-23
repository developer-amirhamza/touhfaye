import { Request, Response } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { prisma } from '../lib/prisma';

const CATEGORIES = ['CERTIFICATION', 'POS_ASSET'];
const AUDIENCES = ['RETAILER', 'DISTRIBUTOR', 'ALL'];

interface AuthRequest extends Request {
  userRole?: string;
}

// Portal: resources visible to the caller's own role (or ALL), optionally
// filtered to one category (?category=CERTIFICATION|POS_ASSET).
export const getPortalResources = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const audience = req.userRole;
    const where: any = { isActive: true };
    if (category) where.category = String(category);
    if (audience) where.OR = [{ audience }, { audience: 'ALL' }];

    const resources = await prisma.portalResource.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return errorHandler(res, 200, 'Resources retrieved', false, resources);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const getAllPortalResourcesAdmin = async (_req: Request, res: Response) => {
  try {
    const resources = await prisma.portalResource.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
    return errorHandler(res, 200, 'Resources retrieved', false, resources);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const createPortalResource = async (req: Request, res: Response) => {
  try {
    const { title, description, fileUrl, category, audience, order, isActive } = req.body;
    if (!title || !fileUrl) return errorHandler(res, 400, 'Title and file URL are required');
    if (!CATEGORIES.includes(category)) return errorHandler(res, 400, 'Category must be CERTIFICATION or POS_ASSET');

    const resource = await prisma.portalResource.create({
      data: {
        title,
        description: description || null,
        fileUrl,
        category,
        audience: AUDIENCES.includes(audience) ? audience : 'ALL',
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });
    return errorHandler(res, 201, 'Resource created', false, resource);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updatePortalResource = async (req: Request, res: Response) => {
  try {
    const { id, title, description, fileUrl, category, audience, order, isActive } = req.body;
    if (!id) return errorHandler(res, 400, 'Resource ID is required');
    const existing = await prisma.portalResource.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Resource not found');

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (fileUrl !== undefined) data.fileUrl = fileUrl;
    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) return errorHandler(res, 400, 'Category must be CERTIFICATION or POS_ASSET');
      data.category = category;
    }
    if (audience !== undefined) data.audience = AUDIENCES.includes(audience) ? audience : 'ALL';
    if (order !== undefined) data.order = order;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.portalResource.update({ where: { id }, data });
    return errorHandler(res, 200, 'Resource updated', false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const deletePortalResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'Resource ID is required');
    const existing = await prisma.portalResource.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'Resource not found');
    await prisma.portalResource.delete({ where: { id } });
    return errorHandler(res, 200, 'Resource deleted', false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

// ── Account manager contact ────────────────────────────────────────────────
// A single site-wide contact card shown on the Retailer portal. Stored in
// the generic Setting table (key/value) rather than a dedicated model,
// since it's one small editable record, not a list.
const ACCOUNT_MANAGER_KEY = 'accountManagerContact';
const ACCOUNT_MANAGER_DEFAULT = { name: '', email: '', phone: '', hours: '' };

export const getAccountManagerContact = async (_req: Request, res: Response) => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: ACCOUNT_MANAGER_KEY } });
    return errorHandler(res, 200, 'Contact retrieved', false, { ...ACCOUNT_MANAGER_DEFAULT, ...(row?.value as object) });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updateAccountManagerContact = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, hours } = req.body;
    const value = { name: name || '', email: email || '', phone: phone || '', hours: hours || '' };
    const row = await prisma.setting.upsert({
      where: { key: ACCOUNT_MANAGER_KEY },
      update: { value },
      create: { key: ACCOUNT_MANAGER_KEY, value },
    });
    return errorHandler(res, 200, 'Contact updated', false, row.value);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};
