import { describe, it, expect } from 'vitest';
import { CustomerRepository } from './customer.repository';
import { OrderRepository } from './order.repository';
import { RefundRepository } from './refund.repository';

describe('Repositories Initialization', () => {
  it('should instantiate repositories correctly', () => {
    const customerRepo = new CustomerRepository();
    const orderRepo = new OrderRepository();
    const refundRepo = new RefundRepository();

    expect(customerRepo).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(refundRepo).toBeDefined();
  });
});
