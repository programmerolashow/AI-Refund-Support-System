import { Request, Response, NextFunction } from 'express';
import { createRefundSchema } from '../schemas/refund.schema.js';
import { refundService, ServiceError } from '../services/refund.service.js';

export async function createRefund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = createRefundSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          message: 'Validation Error',
          status: 400,
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    const response = await refundService.processRefundRequest(parseResult.data);
    res.status(201).json(response);
  } catch (err: any) {
    if (err instanceof ServiceError) {
      res.status(err.status).json({
        error: {
          message: err.message,
          status: err.status,
        },
      });
      return;
    }
    next(err);
  }
}

export async function getRefunds(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refunds = await refundService.getAllRefunds();
    res.json(refunds);
  } catch (err) {
    next(err);
  }
}

export async function getRefundById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const refund = await refundService.getRefundById(id);
    res.json(refund);
  } catch (err: any) {
    if (err instanceof ServiceError) {
      res.status(err.status).json({
        error: {
          message: err.message,
          status: err.status,
        },
      });
      return;
    }
    next(err);
  }
}
