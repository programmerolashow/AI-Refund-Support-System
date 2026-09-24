import { Router } from 'express';
import {
  createRefund,
  getRefunds,
  getRefundById,
} from '../controllers/refund.controller.js';

const router = Router();

router.post('/refunds', createRefund);
router.get('/refunds', getRefunds);
router.get('/refunds/:id', getRefundById);

export default router;
