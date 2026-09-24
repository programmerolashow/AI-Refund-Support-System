import { Request, Response } from 'express';

export async function getHealth(req: Request, res: Response): Promise<void> {
  res.json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
