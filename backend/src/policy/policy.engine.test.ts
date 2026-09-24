import { describe, it, expect } from 'vitest';
import { PolicyEngine, CustomerContext, OrderContext } from './policy.engine';

describe('PolicyEngine Deterministic Rules Evaluation', () => {
  const engine = new PolicyEngine();

  const mockCustomer: CustomerContext = {
    id: 'cust-101',
    name: 'Alice Johnson',
    email: 'alice@example.com',
  };

  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  it('Rule 1: Should DENY request when customer or order is missing', () => {
    const result = engine.evaluate(null, null, 'I want a refund');
    expect(result.eligible).toBe(false);
    expect(result.recommendedDecision).toBe('DENIED');
    expect(result.rules.some((r) => r.rule === 'MISSING_DATA' && !r.passed)).toBe(true);
  });

  it('Rule 2: Should DENY request when order status is CANCELLED', () => {
    const cancelledOrder: OrderContext = {
      id: 'ORD-CANCELLED',
      customerId: 'cust-101',
      orderDate: daysAgo(5),
      totalAmount: 50,
      currency: 'USD',
      status: 'CANCELLED',
      items: [{ productName: 'Item A', quantity: 1, price: 50, finalSale: false, category: 'General' }],
    };

    const result = engine.evaluate(mockCustomer, cancelledOrder, 'I want a refund');
    expect(result.eligible).toBe(false);
    expect(result.recommendedDecision).toBe('DENIED');
    expect(result.rules.some((r) => r.rule === 'ORDER_STATUS' && !r.passed)).toBe(true);
  });

  it('Rule 3: Should DENY request when order contains final-sale items', () => {
    const finalSaleOrder: OrderContext = {
      id: 'ORD-FS',
      customerId: 'cust-101',
      orderDate: daysAgo(5),
      totalAmount: 65,
      currency: 'USD',
      status: 'DELIVERED',
      items: [
        { productName: 'Clearance Jacket', quantity: 1, price: 65, finalSale: true, category: 'Apparel' },
      ],
    };

    const result = engine.evaluate(mockCustomer, finalSaleOrder, 'Request refund for jacket');
    expect(result.eligible).toBe(false);
    expect(result.recommendedDecision).toBe('DENIED');
    expect(result.rules.some((r) => r.rule === 'FINAL_SALE' && !r.passed)).toBe(true);
  });

  it('Rule 4: Should DENY request when order is older than 30 days window', () => {
    const expiredOrder: OrderContext = {
      id: 'ORD-EXP',
      customerId: 'cust-101',
      orderDate: daysAgo(40),
      totalAmount: 80,
      currency: 'USD',
      status: 'DELIVERED',
      items: [{ productName: 'Headphones', quantity: 1, price: 80, finalSale: false, category: 'Audio' }],
    };

    const result = engine.evaluate(mockCustomer, expiredOrder, 'Return headphones');
    expect(result.eligible).toBe(false);
    expect(result.recommendedDecision).toBe('DENIED');
    expect(result.rules.some((r) => r.rule === 'REFUND_WINDOW' && !r.passed)).toBe(true);
  });

  it('Rule 5: Should ESCALATE request when total amount exceeds $500', () => {
    const highValueOrder: OrderContext = {
      id: 'ORD-HV',
      customerId: 'cust-101',
      orderDate: daysAgo(10),
      totalAmount: 850,
      currency: 'USD',
      status: 'DELIVERED',
      items: [{ productName: '4K Monitor', quantity: 1, price: 850, finalSale: false, category: 'Electronics' }],
    };

    const result = engine.evaluate(mockCustomer, highValueOrder, 'Monitor has dead pixels');
    expect(result.eligible).toBe(true);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.recommendedDecision).toBe('ESCALATED');
    expect(result.rules.some((r) => r.rule === 'HIGH_VALUE_THRESHOLD' && !r.passed)).toBe(true);
  });

  it('Rule 6a: Should APPROVE valid damaged item request within window and under threshold', () => {
    const validDamagedOrder: OrderContext = {
      id: 'ORD-DAMAGED',
      customerId: 'cust-101',
      orderDate: daysAgo(7),
      totalAmount: 150,
      currency: 'USD',
      status: 'DELIVERED',
      items: [
        { productName: 'Coffee Maker', quantity: 1, price: 150, finalSale: false, condition: 'DAMAGED', category: 'Home' },
      ],
    };

    const result = engine.evaluate(mockCustomer, validDamagedOrder, 'Order arrived damaged');
    expect(result.eligible).toBe(true);
    expect(result.requiresHumanReview).toBe(false);
    expect(result.recommendedDecision).toBe('APPROVED');
  });

  it('Rule 6b: Should APPROVE valid incorrect item request within window', () => {
    const incorrectItemOrder: OrderContext = {
      id: 'ORD-INCORRECT',
      customerId: 'cust-101',
      orderDate: daysAgo(12),
      totalAmount: 95,
      currency: 'USD',
      status: 'DELIVERED',
      items: [
        { productName: 'Shoes Size 10', quantity: 1, price: 95, finalSale: false, condition: 'INCORRECT_ITEM', category: 'Footwear' },
      ],
    };

    const result = engine.evaluate(mockCustomer, incorrectItemOrder, 'Received wrong size item');
    expect(result.eligible).toBe(true);
    expect(result.recommendedDecision).toBe('APPROVED');
    expect(result.rules.some((r) => r.rule === 'CONDITION_CHECK' && r.passed)).toBe(true);
  });

  it('Rule 7: Should ESCALATE request when conflicting claims are detected', () => {
    const conflictOrder: OrderContext = {
      id: 'ORD-CONF',
      customerId: 'cust-101',
      orderDate: daysAgo(5),
      totalAmount: 100,
      currency: 'USD',
      status: 'DELIVERED',
      items: [{ productName: 'Shoes', quantity: 1, price: 100, finalSale: false, category: 'Footwear' }],
    };

    const result = engine.evaluate(mockCustomer, conflictOrder, 'I never received my item!');
    expect(result.eligible).toBe(true);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.recommendedDecision).toBe('ESCALATED');
    expect(result.rules.some((r) => r.rule === 'SUSPICIOUS_CONFLICT' && !r.passed)).toBe(true);
  });

  it('Edge Case: Order total exactly $500 should be APPROVED, $500.01 should ESCALATE', () => {
    const exactOrder: OrderContext = {
      id: 'ORD-500',
      customerId: 'cust-101',
      orderDate: daysAgo(10),
      totalAmount: 500,
      currency: 'USD',
      status: 'DELIVERED',
      items: [{ productName: 'Desk', quantity: 1, price: 500, finalSale: false, category: 'Furniture' }],
    };

    const overOrder: OrderContext = {
      ...exactOrder,
      totalAmount: 500.01,
    };

    const exactResult = engine.evaluate(mockCustomer, exactOrder, 'Defective desk leg');
    expect(exactResult.recommendedDecision).toBe('APPROVED');

    const overResult = engine.evaluate(mockCustomer, overOrder, 'Defective desk leg');
    expect(overResult.recommendedDecision).toBe('ESCALATED');
  });
});
