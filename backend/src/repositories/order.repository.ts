import { prisma } from '../database/client.js';

export class OrderRepository {
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async findByCustomerId(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { orderDate: 'desc' },
    });
  }
}

export const orderRepository = new OrderRepository();
