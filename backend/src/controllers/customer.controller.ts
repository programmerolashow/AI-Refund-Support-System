import { Request, Response, NextFunction } from 'express';
import { customerRepository } from '../repositories/customer.repository.js';

export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const customer = await customerRepository.findById(id);
    if (!customer) {
      res.status(404).json({
        error: {
          message: `Customer with ID '${id}' not found.`,
          status: 404,
        },
      });
      return;
    }
    res.json(customer);
  } catch (err) {
    next(err);
  }
}
