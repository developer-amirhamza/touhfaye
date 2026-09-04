import { Router } from 'express';
import {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonial.controllers';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';

const router = Router();

router.get('/', getTestimonials);
router.get('/all', auth, admin, getAllTestimonials);
router.post('/create', auth, admin, createTestimonial);
router.put('/update', auth, admin, updateTestimonial);
router.delete('/delete', auth, admin, deleteTestimonial);

export default router;