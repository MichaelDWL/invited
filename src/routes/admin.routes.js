import { Router } from 'express';
import { login, logout, session } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/session', requireAdmin, session);

export default router;
