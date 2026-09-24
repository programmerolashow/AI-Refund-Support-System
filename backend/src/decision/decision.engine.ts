import { PolicyEvaluationResult } from '../policy/policy.types.js';
import { AIServiceResponse } from '../ai/ai.schema.js';

export interface DecisionOutput {
  finalDecision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  reason: string;
  customerExplanation: string;
  auditNotes: string;
  escalationFlags: string[];
}

export class DecisionEngine {
  /**
   * Combines deterministic policy results and AI analysis signals to reach a final decision.
   * Enforces explicit hierarchy: Policy Hard Blocks > Escalation Triggers > Consensus Approval.
   */
  public evaluateDecision(
    policyResult: PolicyEvaluationResult,
    aiResponse: AIServiceResponse
  ): DecisionOutput {
    const escalationFlags: string[] = [];
    const aiAnalysis = aiResponse.analysis;

    // LEVEL 1: HARD POLICY DENIAL (Authoritative Top Priority)
    // If the hard policy engine flags the request as ineligible, no LLM can approve it.
    if (!policyResult.eligible) {
      const hardReason =
        policyResult.hardDenialReason || 'Refund request does not meet authoritative policy guidelines.';
      return {
        finalDecision: 'DENIED',
        reason: hardReason,
        customerExplanation: aiAnalysis.customerResponse || `Refund denied: ${hardReason}`,
        auditNotes: `Hard Policy Denial enforced: ${hardReason}`,
        escalationFlags: [],
      };
    }

    // LEVEL 2: MANDATORY ESCALATION TRIGGERS
    // Collect all escalation reasons from policy checks and AI risk signals

    // Policy Escalations
    if (policyResult.requiresHumanReview) {
      const highValueRule = policyResult.rules.find((r) => r.rule === 'HIGH_VALUE_THRESHOLD' && !r.passed);
      const conflictRule = policyResult.rules.find((r) => r.rule === 'SUSPICIOUS_CONFLICT' && !r.passed);

      if (highValueRule) escalationFlags.push(highValueRule.message);
      if (conflictRule) escalationFlags.push(conflictRule.message);
      if (!highValueRule && !conflictRule) escalationFlags.push('Policy flagged request for human review.');
    }

    // AI Escalations & Risk Signals
    if (aiAnalysis.needsEscalation) {
      escalationFlags.push('AI flagged request for human escalation.');
    }
    if (aiAnalysis.risk === 'high') {
      escalationFlags.push('AI assessed risk as HIGH.');
    }
    if (aiAnalysis.isAmbiguous) {
      escalationFlags.push('AI identified ambiguous request intent or details.');
    }
    if (aiAnalysis.suspiciousFlags && aiAnalysis.suspiciousFlags.length > 0) {
      escalationFlags.push(`AI suspicious flags: ${aiAnalysis.suspiciousFlags.join(', ')}`);
    }

    // If any escalation flag is present, route to ESCALATED
    if (escalationFlags.length > 0) {
      const primaryReason = escalationFlags[0];
      const fullAuditNotes = `Escalated for human review due to: ${escalationFlags.join('; ')}`;
      const customerExplanation =
        'Your refund request has been received and routed to our customer support team for manual review.';

      return {
        finalDecision: 'ESCALATED',
        reason: primaryReason,
        customerExplanation,
        auditNotes: fullAuditNotes,
        escalationFlags,
      };
    }

    // LEVEL 3: CONSENSUS APPROVAL
    // Request passes all hard policy checks and AI confirms low risk with clear intent
    const approvalReason = 'Order is within refund window, meets policy guidelines, and verified by AI evaluation.';

    return {
      finalDecision: 'APPROVED',
      reason: approvalReason,
      customerExplanation:
        aiAnalysis.customerResponse || 'Your refund request has been approved and processed.',
      auditNotes: `Approved automatically. Policy rules passed. AI confidence: ${aiAnalysis.confidence}.`,
      escalationFlags: [],
    };
  }
}

export const decisionEngine = new DecisionEngine();
