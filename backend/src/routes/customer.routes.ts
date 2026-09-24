import { Router } from 'express';
import { getCustomerById } from '../controllers/customer.controller.js';

const router = Router();

router.get('/customers/:id', getCustomerById);

export default router;
