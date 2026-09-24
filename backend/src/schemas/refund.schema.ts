import { z } from 'zod';

export const createRefundSchema = z.object({
  customerId: z
    .string({ required_error: 'Customer ID is required' })
    .min(1, 'Customer ID cannot be empty')
    .max(100, 'Customer ID is too long')
    .trim(),
  orderId: z
    .string({ required_error: 'Order ID is required' })
    .min(1, 'Order ID cannot be empty')
    .max(100, 'Order ID is too long')
    .trim(),
  customerReason: z
    .string({ required_error: 'Customer reason is required' })
    .min(5, 'Reason must be at least 5 characters long')
    .max(1000, 'Customer reason exceeds maximum allowed length of 1000 characters')
    .trim(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
