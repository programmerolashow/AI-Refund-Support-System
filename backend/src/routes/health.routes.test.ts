import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/health', () => {
  it('should return 200 OK and health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'backend');
    expect(res.body).toHaveProperty('timestamp');
  });
});
