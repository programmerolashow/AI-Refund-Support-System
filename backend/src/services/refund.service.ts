import { Prisma } from '@prisma/client';
import { customerRepository } from '../repositories/customer.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { refundRepository } from '../repositories/refund.repository.js';
import { policyEngine } from '../policy/policy.engine.js';
import { aiService } from '../ai/ai.service.js';
import { decisionEngine } from '../decision/decision.engine.js';
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

    // 5. Run AI Analysis Layer
    const aiResponse = await aiService.evaluateRequest(
      { id: customer.id, name: customer.name, email: customer.email },
      {
        id: order.id,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        items: order.items,
      },
      policyResult,
      customerReason
    );

    // 6. Run Decision Engine (Fuses Policy + AI Signals)
    const decisionOutput = decisionEngine.evaluateDecision(policyResult, aiResponse);

    // 7. Store Refund Request and Audit Log in DB Transaction
    const result = await prisma.$transaction(async (tx) => {
      const refundRequest = await tx.refundRequest.create({
        data: {
          customerId: customer.id,
          orderId: order.id,
          customerReason,
          status: decisionOutput.finalDecision,
          decision: decisionOutput.finalDecision,
          decisionReason: decisionOutput.reason,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          refundRequestId: refundRequest.id,
          customerId: customer.id,
          orderId: order.id,
          originalRequest: customerReason,
          policyChecks: policyResult.rules as any,
          aiAnalysis: {
            ...aiResponse.analysis,
            aiFailed: aiResponse.aiFailed,
            failureReason: aiResponse.failureReason,
          } as any,
          finalDecision: decisionOutput.finalDecision,
          auditNotes: decisionOutput.auditNotes,
          aiFailed: aiResponse.aiFailed,
        },
      });

      return {
        ...refundRequest,
        auditLog,
        customer,
        order,
        policyResult,
        aiResponse,
        decisionOutput,
      };
    });

    // 8. Return Clean Response
    return {
      id: result.id,
      customerId: result.customerId,
      orderId: result.orderId,
      status: result.status,
      decision: result.decision,
      reason: result.decisionOutput.reason,
      explanation: result.decisionOutput.customerExplanation,
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
      aiSummary: {
        intent: aiResponse.analysis.intent,
        risk: aiResponse.analysis.risk,
        confidence: aiResponse.analysis.confidence,
        aiFailed: aiResponse.aiFailed,
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
