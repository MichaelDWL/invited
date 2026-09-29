import { Router } from 'express';
import { getEvent, updateEvent } from '../controllers/event.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getEvent);
router.put('/', requireAdmin, updateEvent);

export default router;
