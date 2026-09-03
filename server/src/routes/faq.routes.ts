import { Router } from 'express';
import {
  getFaqs,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faq.controllers';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';

const router = Router();

router.get('/', getFaqs);
router.get('/all', auth, admin, getAllFaqs);
router.post('/create', auth, admin, createFaq);
router.put('/update', auth, admin, updateFaq);
router.delete('/delete', auth, admin, deleteFaq);

export default router;
