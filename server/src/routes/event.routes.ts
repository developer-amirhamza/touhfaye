import { Router } from 'express';
import {
    createEvent, deleteEvent, getAdminAllEvents, getAllEvents,
    getEventById, getEventBySlug, updateEvent,
} from '../controllers/event.controllers';
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public
router.get('/all', getAllEvents);
router.post('/by-slug', getEventBySlug);

// Admin only
router.get('/admin/all', auth, admin, getAdminAllEvents);
router.post('/by-id', auth, admin, getEventById);
router.post('/create', auth, admin, createEvent);
router.put('/update', auth, admin, updateEvent);
router.delete('/delete', auth, admin, deleteEvent);

export default router;
