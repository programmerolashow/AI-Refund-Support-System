import { prisma } from '../database/client.js';

export class CustomerRepository {
  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email },
    });
  }

  async findAll() {
    return prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const customerRepository = new CustomerRepository();
