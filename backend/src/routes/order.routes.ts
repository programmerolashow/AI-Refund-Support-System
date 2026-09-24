import { Router } from 'express';
import { getOrderById } from '../controllers/order.controller.js';

const router = Router();

router.get('/orders/:id', getOrderById);

export default router;
