import { Router } from 'express';
import { getCustomerById } from '../controllers/customer.controller.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/customers/:id', requireAdminAuth, getCustomerById);

export default router;
