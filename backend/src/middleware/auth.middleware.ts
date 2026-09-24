import { Request, Response, NextFunction } from 'express';

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const adminApiKey = process.env.ADMIN_API_KEY || 'admin-secret-key-123';
  const authHeader = req.headers['authorization'] || req.headers['x-admin-api-key'];

  if (!authHeader) {
    res.status(401).json({
      error: {
        message: 'Unauthorized: Missing Admin API Key or Authorization header.',
        status: 401,
      },
    });
    return;
  }

  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader;

  if (token !== adminApiKey) {
    res.status(403).json({
      error: {
        message: 'Forbidden: Invalid Admin API Key.',
        status: 403,
      },
    });
    return;
  }

  next();
}
