import { prisma } from '../database/client.js';

export class RefundRepository {
  async create(data: {
    customerId: string;
    orderId: string;
    customerReason: string;
    status: string;
    decision: string;
    decisionReason: string;
  }) {
    return prisma.refundRequest.create({
      data,
      include: {
        customer: true,
        order: { include: { items: true } },
        auditLog: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.refundRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: true } },
        auditLog: true,
      },
    });
  }

  async findAll() {
    return prisma.refundRequest.findMany({
      include: {
        customer: true,
        order: { include: { items: true } },
        auditLog: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const refundRepository = new RefundRepository();
