import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { customerRepository } from '../repositories/customer.repository';
import { orderRepository } from '../repositories/order.repository';
import { prisma } from '../database/client';

vi.mock('../repositories/customer.repository', () => ({
  customerRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../repositories/order.repository', () => ({
  orderRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../repositories/refund.repository', () => ({
  refundRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../database/client', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe('Refund API Routes (/api/refunds)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCustomer = {
    id: 'cust-101',
    name: 'Alice Johnson',
    email: 'alice@example.com',
  };

  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const mockOrder = {
    id: 'ORD-1001',
    customerId: 'cust-101',
    orderDate: daysAgo(5),
    totalAmount: 89.99,
    currency: 'USD',
    status: 'DELIVERED',
    items: [
      {
        productName: 'Wireless Mouse',
        quantity: 1,
        price: 89.99,
        finalSale: false,
        condition: 'NEW',
        category: 'Electronics',
      },
    ],
  };

  it('POST /api/refunds - Should reject missing fields with 400 Validation Error', async () => {
    const res = await request(app).post('/api/refunds').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation Error');
  });

  it('POST /api/refunds - Should reject excessively long customer reason with 400', async () => {
    const res = await request(app).post('/api/refunds').send({
      customerId: 'cust-101',
      orderId: 'ORD-1001',
      customerReason: 'A'.repeat(1001),
    });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].message).toContain('1000 characters');
  });

  it('POST /api/refunds - Should return 404 if customer is not found', async () => {
    vi.mocked(customerRepository.findById).mockResolvedValue(null);

    const res = await request(app).post('/api/refunds').send({
      customerId: 'cust-nonexistent',
      orderId: 'ORD-1001',
      customerReason: 'Order arrived damaged',
    });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('Customer with ID');
  });

  it('POST /api/refunds - Should return 404 if order is not found', async () => {
    vi.mocked(customerRepository.findById).mockResolvedValue(mockCustomer as any);
    vi.mocked(orderRepository.findById).mockResolvedValue(null);

    const res = await request(app).post('/api/refunds').send({
      customerId: 'cust-101',
      orderId: 'ORD-9999',
      customerReason: 'Order arrived damaged',
    });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('Order with ID');
  });

  it('POST /api/refunds - Should return 400 if order does not belong to customer', async () => {
    vi.mocked(customerRepository.findById).mockResolvedValue(mockCustomer as any);
    vi.mocked(orderRepository.findById).mockResolvedValue({
      ...mockOrder,
      customerId: 'cust-OTHER',
    } as any);

    const res = await request(app).post('/api/refunds').send({
      customerId: 'cust-101',
      orderId: 'ORD-1001',
      customerReason: 'Order arrived damaged',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('does not belong to customer');
  });

  it('POST /api/refunds - Should process valid request and return APPROVED decision', async () => {
    vi.mocked(customerRepository.findById).mockResolvedValue(mockCustomer as any);
    vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      return cb({
        refundRequest: {
          create: vi.fn().mockResolvedValue({
            id: 'refund-123',
            customerId: 'cust-101',
            orderId: 'ORD-1001',
            customerReason: 'Mouse stopped working',
            status: 'APPROVED',
            decision: 'APPROVED',
            decisionReason: 'Approved based on policy',
            createdAt: new Date(),
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-123' }),
        },
      });
    });

    const res = await request(app).post('/api/refunds').send({
      customerId: 'cust-101',
      orderId: 'ORD-1001',
      customerReason: 'Mouse stopped working',
    });

    expect(res.status).toBe(201);
    expect(res.body.decision).toBe('APPROVED');
    expect(res.body.customer.id).toBe('cust-101');
    expect(res.body.order.id).toBe('ORD-1001');
  });
});
