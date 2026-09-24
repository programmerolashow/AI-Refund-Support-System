import { Router } from 'express';
import { getOrderById } from '../controllers/order.controller.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/orders/:id', requireAdminAuth, getOrderById);

export default router;
