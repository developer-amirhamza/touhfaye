import { Router } from 'express';
import {
  getPortalResources,
  getAllPortalResourcesAdmin,
  createPortalResource,
  updatePortalResource,
  deletePortalResource,
  getAccountManagerContact,
  updateAccountManagerContact,
} from '../controllers/portalResource.controllers';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { requireRole, ROLES, TRADE_FAMILY } from '../middlewares/role';

const router = Router();
const trade = requireRole(...TRADE_FAMILY, ROLES.ADMIN);

// Portal (Retailer/Distributor + admin).
router.get('/', auth, trade, getPortalResources);
router.get('/account-manager', auth, trade, getAccountManagerContact);

// Admin.
router.get('/all', auth, admin, getAllPortalResourcesAdmin);
router.post('/create', auth, admin, createPortalResource);
router.put('/update', auth, admin, updatePortalResource);
router.delete('/delete', auth, admin, deletePortalResource);
router.put('/account-manager', auth, admin, updateAccountManagerContact);

export default router;
