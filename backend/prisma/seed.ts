import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed]: Starting database seed with synthetic data...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 15 Synthetic Customers
  const customersData = [
    { id: 'cust-101', name: 'Alice Johnson', email: 'alice.johnson@example.com', phone: '+1-555-0101' },
    { id: 'cust-102', name: 'Bob Smith', email: 'bob.smith@example.com', phone: '+1-555-0102' },
    { id: 'cust-103', name: 'Charlie Davis', email: 'charlie.davis@example.com', phone: '+1-555-0103' },
    { id: 'cust-104', name: 'Diana Prince', email: 'diana.prince@example.com', phone: '+1-555-0104' },
    { id: 'cust-105', name: 'Evan Wright', email: 'evan.wright@example.com', phone: '+1-555-0105' },
    { id: 'cust-106', name: 'Fiona Gallagher', email: 'fiona.g@example.com', phone: '+1-555-0106' },
    { id: 'cust-107', name: 'George Clark', email: 'george.clark@example.com', phone: '+1-555-0107' },
    { id: 'cust-108', name: 'Hannah Abbott', email: 'hannah.a@example.com', phone: '+1-555-0108' },
    { id: 'cust-109', name: 'Ian Malcolm', email: 'ian.m@example.com', phone: '+1-555-0109' },
    { id: 'cust-110', name: 'Julia Roberts', email: 'julia.r@example.com', phone: '+1-555-0110' },
    { id: 'cust-111', name: 'Kevin Bacon', email: 'kevin.b@example.com', phone: '+1-555-0111' },
    { id: 'cust-112', name: 'Laura Croft', email: 'laura.c@example.com', phone: '+1-555-0112' },
    { id: 'cust-113', name: 'Michael Scott', email: 'michael.s@example.com', phone: '+1-555-0113' },
    { id: 'cust-114', name: 'Nina Williams', email: 'nina.w@example.com', phone: '+1-555-0114' },
    { id: 'cust-115', name: 'Oscar Martinez', email: 'oscar.m@example.com', phone: '+1-555-0115' },
  ];

  for (const c of customersData) {
    await prisma.customer.create({ data: c });
  }

  // Realistic Orders for key scenarios
  const ordersData = [
    // Scenario 1: Valid Refund Case (ORD-1001) - 10 days old, standard item, total $89.99
    {
      id: 'ORD-1001',
      customerId: 'cust-101',
      orderDate: daysAgo(10),
      totalAmount: 89.99,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Ergonomic Wireless Mouse', quantity: 1, price: 49.99, finalSale: false, condition: 'NEW', category: 'Electronics' },
          { productName: 'Desk Mat Pad', quantity: 1, price: 40.00, finalSale: false, condition: 'NEW', category: 'Accessories' }
        ]
      }
    },
    // Scenario 2: Expired Order Case (ORD-1002) - 45 days old (> 30 days limit)
    {
      id: 'ORD-1002',
      customerId: 'cust-102',
      orderDate: daysAgo(45),
      totalAmount: 120.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Bluetooth Headphones', quantity: 1, price: 120.00, finalSale: false, condition: 'NEW', category: 'Audio' }
        ]
      }
    },
    // Scenario 3: Final Sale Non-Refundable Item Case (ORD-1003) - 5 days old, finalSale = true
    {
      id: 'ORD-1003',
      customerId: 'cust-103',
      orderDate: daysAgo(5),
      totalAmount: 65.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Clearance Leather Jacket', quantity: 1, price: 65.00, finalSale: true, condition: 'NEW', category: 'Apparel' }
        ]
      }
    },
    // Scenario 4: Damaged Item Case (ORD-1004) - 7 days old, item arrived damaged
    {
      id: 'ORD-1004',
      customerId: 'cust-104',
      orderDate: daysAgo(7),
      totalAmount: 150.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Ceramic Coffee Maker', quantity: 1, price: 150.00, finalSale: false, condition: 'DAMAGED', category: 'Home Appliances' }
        ]
      }
    },
    // Scenario 5: Incorrect Item Sent Case (ORD-1005) - 12 days old, wrong size/item
    {
      id: 'ORD-1005',
      customerId: 'cust-105',
      orderDate: daysAgo(12),
      totalAmount: 95.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Running Shoes Size 10', quantity: 1, price: 95.00, finalSale: false, condition: 'INCORRECT_ITEM', category: 'Footwear' }
        ]
      }
    },
    // Scenario 6: High Value Refund > $500 Case (ORD-1006) - 14 days old, total $850.00 -> Requires Human Escalation
    {
      id: 'ORD-1006',
      customerId: 'cust-106',
      orderDate: daysAgo(14),
      totalAmount: 850.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: '4K Ultra HD Monitor 32"', quantity: 1, price: 850.00, finalSale: false, condition: 'NEW', category: 'Electronics' }
        ]
      }
    },
    // Scenario 7: Suspicious / Conflicting Request Case (ORD-1007) - Order status is CANCELLED but customer requests refund
    {
      id: 'ORD-1007',
      customerId: 'cust-107',
      orderDate: daysAgo(3),
      totalAmount: 210.00,
      currency: 'USD',
      status: 'CANCELLED',
      items: {
        create: [
          { productName: 'Smart Home Hub', quantity: 1, price: 210.00, finalSale: false, condition: 'NEW', category: 'Smart Home' }
        ]
      }
    },
    // Additional realistic orders (ORD-1008 to ORD-1015)
    {
      id: 'ORD-1008',
      customerId: 'cust-108',
      orderDate: daysAgo(8),
      totalAmount: 45.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Stainless Steel Water Bottle', quantity: 1, price: 45.00, finalSale: false, condition: 'NEW', category: 'Fitness' }
        ]
      }
    },
    {
      id: 'ORD-1009',
      customerId: 'cust-109',
      orderDate: daysAgo(18),
      totalAmount: 320.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Mechanical Gaming Keyboard', quantity: 1, price: 160.00, finalSale: false, condition: 'NEW', category: 'Electronics' },
          { productName: 'Gaming Headset', quantity: 1, price: 160.00, finalSale: false, condition: 'NEW', category: 'Electronics' }
        ]
      }
    },
    {
      id: 'ORD-1010',
      customerId: 'cust-110',
      orderDate: daysAgo(2),
      totalAmount: 110.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Noise Cancelling Earbuds', quantity: 1, price: 110.00, finalSale: false, condition: 'NEW', category: 'Audio' }
        ]
      }
    },
    {
      id: 'ORD-1011',
      customerId: 'cust-111',
      orderDate: daysAgo(50),
      totalAmount: 75.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Yoga Mat', quantity: 1, price: 75.00, finalSale: false, condition: 'NEW', category: 'Fitness' }
        ]
      }
    },
    {
      id: 'ORD-1012',
      customerId: 'cust-112',
      orderDate: daysAgo(6),
      totalAmount: 420.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Outdoor Camping Tent', quantity: 1, price: 420.00, finalSale: false, condition: 'DAMAGED', category: 'Outdoors' }
        ]
      }
    },
    {
      id: 'ORD-1013',
      customerId: 'cust-113',
      orderDate: daysAgo(15),
      totalAmount: 25.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'World\'s Best Boss Mug', quantity: 1, price: 25.00, finalSale: true, condition: 'NEW', category: 'Novelty' }
        ]
      }
    },
    {
      id: 'ORD-1014',
      customerId: 'cust-114',
      orderDate: daysAgo(22),
      totalAmount: 299.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Standing Desk Converter', quantity: 1, price: 299.00, finalSale: false, condition: 'NEW', category: 'Office' }
        ]
      }
    },
    {
      id: 'ORD-1015',
      customerId: 'cust-115',
      orderDate: daysAgo(4),
      totalAmount: 180.00,
      currency: 'USD',
      status: 'DELIVERED',
      items: {
        create: [
          { productName: 'Leather Executive Chair', quantity: 1, price: 180.00, finalSale: false, condition: 'NEW', category: 'Office' }
        ]
      }
    }
  ];

  for (const o of ordersData) {
    await prisma.order.create({ data: o });
  }

  // Pre-seed some sample refund requests and audit logs for demonstration in admin dashboard
  const sampleRefund = await prisma.refundRequest.create({
    data: {
      customerId: 'cust-104',
      orderId: 'ORD-1004',
      customerReason: 'My order ORD-1004 arrived damaged. The ceramic coffee maker was cracked in transit.',
      status: 'APPROVED',
      decision: 'APPROVED',
      decisionReason: 'Order is within 30-day refund window and item arrived damaged.'
    }
  });

  await prisma.auditLog.create({
    data: {
      refundRequestId: sampleRefund.id,
      customerId: 'cust-104',
      orderId: 'ORD-1004',
      originalRequest: 'My order ORD-1004 arrived damaged. The ceramic coffee maker was cracked in transit.',
      policyChecks: [
        { rule: 'FINAL_SALE', passed: true, details: 'No final-sale items' },
        { rule: 'REFUND_WINDOW', passed: true, details: 'Order date is within 30 days' },
        { rule: 'HIGH_VALUE_THRESHOLD', passed: true, details: 'Total $150 <= $500 threshold' },
        { rule: 'VALID_ORDER_STATUS', passed: true, details: 'Order status DELIVERED' }
      ],
      aiAnalysis: {
        intent: 'refund_request',
        confidence: 0.98,
        risk: 'low',
        needsEscalation: false,
        reasoning: 'Customer provided clear report of damaged ceramic coffee maker.',
        customerResponse: 'Your refund request for ORD-1004 has been approved due to transit damage.'
      },
      finalDecision: 'APPROVED',
      auditNotes: 'Automated approval generated successfully.',
      aiFailed: false
    }
  });

  console.log('[Seed]: Database successfully seeded with 15 customers, 15 orders, items, and sample audit log!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
