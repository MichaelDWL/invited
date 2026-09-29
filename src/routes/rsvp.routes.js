import { Router } from 'express';
import { createRsvp, deleteRsvp, listRsvps, updateRsvp } from '../controllers/rsvp.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { rsvpLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/', rsvpLimiter, createRsvp);
router.get('/', requireAdmin, listRsvps);
router.put('/:id', requireAdmin, updateRsvp);
router.delete('/:id', requireAdmin, deleteRsvp);

export default router;
