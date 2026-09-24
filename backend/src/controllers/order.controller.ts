import { Request, Response, NextFunction } from 'express';
import { orderRepository } from '../repositories/order.repository.js';

export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderRepository.findById(id);
    if (!order) {
      res.status(404).json({
        error: {
          message: `Order with ID '${id}' not found.`,
          status: 404,
        },
      });
      return;
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}
