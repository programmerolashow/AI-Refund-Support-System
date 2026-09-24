import {
  PolicyConfig,
  PolicyEvaluationResult,
  PolicyRuleResult,
} from './policy.types.js';
import { defaultPolicyConfig } from './policy.config.js';

export interface CustomerContext {
  id: string;
  name: string;
  email: string;
}

export interface OrderItemContext {
  productName: string;
  quantity: number;
  price: number;
  finalSale: boolean;
  condition?: string | null;
  category: string;
}

export interface OrderContext {
  id: string;
  customerId: string;
  orderDate: Date | string;
  totalAmount: number;
  currency: string;
  status: string;
  items: OrderItemContext[];
}

export class PolicyEngine {
  private config: PolicyConfig;

  constructor(config: PolicyConfig = defaultPolicyConfig) {
    this.config = config;
  }

  public evaluate(
    customer: CustomerContext | null,
    order: OrderContext | null,
    customerReason: string
  ): PolicyEvaluationResult {
    const rules: PolicyRuleResult[] = [];

    // Rule 1: Missing Customer or Order Information
    if (!customer || !order) {
      rules.push({
        rule: 'MISSING_DATA',
        passed: false,
        severity: 'HARD_BLOCK',
        message: 'Missing or unverifiable customer or order details in database.',
      });

      return {
        eligible: false,
        requiresHumanReview: false,
        escalationRequired: true,
        recommendedDecision: 'DENIED',
        hardDenialReason: 'Customer or order information could not be verified.',
        rules,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // Rule 1b: Data verification check passed
    rules.push({
      rule: 'MISSING_DATA',
      passed: true,
      severity: 'INFO',
      message: `Verified customer ${customer.name} (${customer.id}) and order ${order.id}.`,
    });

    // Rule 2: Order Status Check
    const isCancelled = order.status.toUpperCase() === 'CANCELLED';
    if (isCancelled) {
      rules.push({
        rule: 'ORDER_STATUS',
        passed: false,
        severity: 'HARD_BLOCK',
        message: `Order ${order.id} has status ${order.status} and is ineligible for standard refund.`,
      });
    } else {
      rules.push({
        rule: 'ORDER_STATUS',
        passed: true,
        severity: 'INFO',
        message: `Order status is ${order.status}.`,
      });
    }

    // Rule 3: Final-Sale Items Check
    const finalSaleItems = order.items.filter((item) => item.finalSale);
    if (finalSaleItems.length > 0) {
      rules.push({
        rule: 'FINAL_SALE',
        passed: false,
        severity: 'HARD_BLOCK',
        message: `Order contains final-sale item(s): ${finalSaleItems.map((i) => i.productName).join(', ')}. Final sale items cannot be refunded.`,
        details: { finalSaleItems: finalSaleItems.map((i) => i.productName) },
      });
    } else {
      rules.push({
        rule: 'FINAL_SALE',
        passed: true,
        severity: 'INFO',
        message: 'No final-sale items present in order.',
      });
    }

    // Rule 4: Refund Window Check (30 days)
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > this.config.refundWindowDays) {
      rules.push({
        rule: 'REFUND_WINDOW',
        passed: false,
        severity: 'HARD_BLOCK',
        message: `Order placed ${diffDays} days ago, exceeding the ${this.config.refundWindowDays}-day refund window.`,
        details: { orderAgeDays: diffDays, limitDays: this.config.refundWindowDays },
      });
    } else {
      rules.push({
        rule: 'REFUND_WINDOW',
        passed: true,
        severity: 'INFO',
        message: `Order date is within the ${this.config.refundWindowDays}-day window (${diffDays} days old).`,
      });
    }

    // Rule 5: High-Value Refund Check (>$500)
    if (order.totalAmount > this.config.highValueThreshold) {
      rules.push({
        rule: 'HIGH_VALUE_THRESHOLD',
        passed: false,
        severity: 'REQUIRES_ESCALATION',
        message: `Total refund amount ($${order.totalAmount.toFixed(2)}) exceeds the $${this.config.highValueThreshold} threshold and requires human support review.`,
        details: { amount: order.totalAmount, threshold: this.config.highValueThreshold },
      });
    } else {
      rules.push({
        rule: 'HIGH_VALUE_THRESHOLD',
        passed: true,
        severity: 'INFO',
        message: `Order total ($${order.totalAmount.toFixed(2)}) is below the $${this.config.highValueThreshold} review threshold.`,
      });
    }

    // Rule 6: Item Condition Check (Damaged / Incorrect Item)
    const damagedItems = order.items.filter((i) => i.condition === 'DAMAGED');
    const incorrectItems = order.items.filter((i) => i.condition === 'INCORRECT_ITEM');
    if (damagedItems.length > 0 || incorrectItems.length > 0) {
      rules.push({
        rule: 'CONDITION_CHECK',
        passed: true,
        severity: 'INFO',
        message: `Order items flagged with special conditions: ${[
          damagedItems.length ? `${damagedItems.length} damaged` : '',
          incorrectItems.length ? `${incorrectItems.length} incorrect` : '',
        ].filter(Boolean).join(', ')}.`,
      });
    } else {
      rules.push({
        rule: 'CONDITION_CHECK',
        passed: true,
        severity: 'INFO',
        message: 'Items in standard condition.',
      });
    }

    // Rule 7: Suspicious / Conflicting Requests Check
    const lowerReason = customerReason.toLowerCase();
    const claimsNotReceivedWhenDelivered =
      order.status === 'DELIVERED' && (lowerReason.includes('never received') || lowerReason.includes('didn\'t receive'));

    if (claimsNotReceivedWhenDelivered) {
      rules.push({
        rule: 'SUSPICIOUS_CONFLICT',
        passed: false,
        severity: 'REQUIRES_ESCALATION',
        message: 'Conflict detected: Customer claims order was not received, but delivery status is DELIVERED.',
      });
    } else {
      rules.push({
        rule: 'SUSPICIOUS_CONFLICT',
        passed: true,
        severity: 'INFO',
        message: 'No immediate statement conflicts detected.',
      });
    }

    // Determine final policy aggregation
    const hardBlocks = rules.filter((r) => !r.passed && r.severity === 'HARD_BLOCK');
    const escalations = rules.filter((r) => !r.passed && r.severity === 'REQUIRES_ESCALATION');

    const eligible = hardBlocks.length === 0;
    const requiresHumanReview = escalations.length > 0;
    const escalationRequired = requiresHumanReview;

    let recommendedDecision: 'APPROVED' | 'DENIED' | 'ESCALATED' = 'APPROVED';
    let hardDenialReason: string | undefined = undefined;

    if (!eligible) {
      recommendedDecision = 'DENIED';
      hardDenialReason = hardBlocks.map((b) => b.message).join(' ');
    } else if (requiresHumanReview) {
      recommendedDecision = 'ESCALATED';
    }

    return {
      eligible,
      requiresHumanReview,
      escalationRequired,
      recommendedDecision,
      hardDenialReason,
      rules,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const policyEngine = new PolicyEngine();
