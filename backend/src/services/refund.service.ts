import { Prisma } from '@prisma/client';
import { customerRepository } from '../repositories/customer.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { refundRepository } from '../repositories/refund.repository.js';
import { policyEngine } from '../policy/policy.engine.js';
import { prisma } from '../database/client.js';
import { CreateRefundInput } from '../schemas/refund.schema.js';

export class ServiceError extends Error {
  public status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}

export class RefundService {
  async processRefundRequest(input: CreateRefundInput) {
    const { customerId, orderId, customerReason } = input;

    // 1. Retrieve Customer
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new ServiceError(`Customer with ID '${customerId}' not found.`, 404);
    }

    // 2. Retrieve Order
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ServiceError(`Order with ID '${orderId}' not found.`, 404);
    }

    // 3. Validate Ownership/Relationship
    if (order.customerId !== customer.id) {
      throw new ServiceError(
        `Order '${orderId}' does not belong to customer '${customerId}'.`,
        400
      );
    }

    // 4. Run Deterministic Policy Engine
    const policyResult = policyEngine.evaluate(
      { id: customer.id, name: customer.name, email: customer.email },
      {
        id: order.id,
        customerId: order.customerId,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        items: order.items,
      },
      customerReason
    );

    // 5. Determine Decision and Reason
    const decision = policyResult.recommendedDecision;
    let decisionReason = '';

    if (decision === 'APPROVED') {
      decisionReason = `Order is within the ${policyResult.rules.find((r) => r.rule === 'REFUND_WINDOW')?.details?.limitDays || 30}-day refund period and items qualify for approval.`;
    } else if (decision === 'DENIED') {
      decisionReason = policyResult.hardDenialReason || 'Refund request does not meet policy guidelines.';
    } else {
      decisionReason =
        policyResult.rules.find((r) => !r.passed && r.severity === 'REQUIRES_ESCALATION')?.message ||
        'Request requires manual support team review due to high order value or policy flag.';
    }

    // 6. Store Refund Request and Audit Log inside Transaction
    const result = await prisma.$transaction(async (tx) => {
      const refundRequest = await tx.refundRequest.create({
        data: {
          customerId: customer.id,
          orderId: order.id,
          customerReason,
          status: decision,
          decision,
          decisionReason,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          refundRequestId: refundRequest.id,
          customerId: customer.id,
          orderId: order.id,
          originalRequest: customerReason,
          policyChecks: policyResult.rules as any,
          aiAnalysis: Prisma.JsonNull,
          finalDecision: decision,
          auditNotes: decisionReason,
          aiFailed: false,
        },
      });

      return {
        ...refundRequest,
        auditLog,
        customer,
        order,
        policyResult,
      };
    });

    // 7. Return Clean Customer-Facing API Response (Hiding raw internal prompts/logs)
    return {
      id: result.id,
      customerId: result.customerId,
      orderId: result.orderId,
      status: result.status,
      decision: result.decision,
      reason: result.decisionReason,
      createdAt: result.createdAt,
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        email: result.customer.email,
      },
      order: {
        id: result.order.id,
        totalAmount: result.order.totalAmount,
        currency: result.order.currency,
        status: result.order.status,
      },
      policySummary: {
        eligible: policyResult.eligible,
        requiresHumanReview: policyResult.requiresHumanReview,
        checksPassed: policyResult.rules.filter((r) => r.passed).length,
        totalChecks: policyResult.rules.length,
      },
    };
  }

  async getAllRefunds() {
    return refundRepository.findAll();
  }

  async getRefundById(id: string) {
    const refund = await refundRepository.findById(id);
    if (!refund) {
      throw new ServiceError(`Refund request with ID '${id}' not found.`, 404);
    }
    return refund;
  }
}

export const refundService = new RefundService();
