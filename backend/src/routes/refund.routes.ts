import { Router } from 'express';
import {
  createRefund,
  getRefunds,
  getRefundById,
} from '../controllers/refund.controller.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public Customer Endpoint (Rate-limited & Zod Validated)
router.post('/refunds', createRefund);

// Protected Admin Endpoints (Requires Admin Authorization Header)
router.get('/refunds', requireAdminAuth, getRefunds);
router.get('/refunds/:id', requireAdminAuth, getRefundById);

export default router;
