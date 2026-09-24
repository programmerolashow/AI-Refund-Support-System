import { describe, it, expect } from 'vitest';
import { DecisionEngine } from './decision.engine';
import { PolicyEvaluationResult } from '../policy/policy.types';
import { AIServiceResponse } from '../ai/ai.schema';

describe('DecisionEngine Hierarchy & Combination Tests', () => {
  const engine = new DecisionEngine();

  const basePolicyPass: PolicyEvaluationResult = {
    eligible: true,
    requiresHumanReview: false,
    escalationRequired: false,
    recommendedDecision: 'APPROVED',
    rules: [{ rule: 'REFUND_WINDOW', passed: true, severity: 'INFO', message: 'Within window' }],
    evaluatedAt: new Date().toISOString(),
  };

  const basePolicyHardBlock: PolicyEvaluationResult = {
    eligible: false,
    requiresHumanReview: false,
    escalationRequired: true,
    recommendedDecision: 'DENIED',
    hardDenialReason: 'Order contains final-sale items and cannot be refunded.',
    rules: [{ rule: 'FINAL_SALE', passed: false, severity: 'HARD_BLOCK', message: 'Final sale item' }],
    evaluatedAt: new Date().toISOString(),
  };

  const baseAIPass: AIServiceResponse = {
    analysis: {
      intent: 'refund_request',
      confidence: 0.95,
      risk: 'low',
      needsEscalation: false,
      isAmbiguous: false,
      suspiciousFlags: [],
      extractedDetails: {},
      reasoning: 'Clear request, item damaged',
      customerResponse: 'Approved based on return policy.',
    },
    aiFailed: false,
  };

  it('Level 1: Hard Policy Denial MUST NOT be overridden by LLM approval', () => {
    // LLM outputs low risk and customer response, but policy hard blocks final sale
    const result = engine.evaluateDecision(basePolicyHardBlock, baseAIPass);

    expect(result.finalDecision).toBe('DENIED');
    expect(result.reason).toContain('final-sale items');
    expect(result.auditNotes).toContain('Hard Policy Denial enforced');
  });

  it('Level 2: Policy High-Value Threshold (>$500) triggers ESCALATED even if AI says low risk', () => {
    const highValuePolicy: PolicyEvaluationResult = {
      ...basePolicyPass,
      requiresHumanReview: true,
      escalationRequired: true,
      recommendedDecision: 'ESCALATED',
      rules: [
        {
          rule: 'HIGH_VALUE_THRESHOLD',
          passed: false,
          severity: 'REQUIRES_ESCALATION',
          message: 'Total refund amount ($850.00) exceeds $500 threshold.',
        },
      ],
    };

    const result = engine.evaluateDecision(highValuePolicy, baseAIPass);

    expect(result.finalDecision).toBe('ESCALATED');
    expect(result.escalationFlags.length).toBeGreaterThan(0);
    expect(result.reason).toContain('exceeds $500 threshold');
  });

  it('Level 2: AI High Risk signal forces ESCALATED decision', () => {
    const highRiskAI: AIServiceResponse = {
      analysis: {
        ...baseAIPass.analysis,
        risk: 'high',
        needsEscalation: true,
      },
      aiFailed: false,
    };

    const result = engine.evaluateDecision(basePolicyPass, highRiskAI);

    expect(result.finalDecision).toBe('ESCALATED');
    expect(result.escalationFlags).toContain('AI assessed risk as HIGH.');
  });

  it('Level 2: AI Suspicious Flags force ESCALATED decision', () => {
    const suspiciousAI: AIServiceResponse = {
      analysis: {
        ...baseAIPass.analysis,
        suspiciousFlags: ['Inconsistent tracking statement', 'Multiple accounts detected'],
      },
      aiFailed: false,
    };

    const result = engine.evaluateDecision(basePolicyPass, suspiciousAI);

    expect(result.finalDecision).toBe('ESCALATED');
    expect(result.auditNotes).toContain('Inconsistent tracking statement');
  });

  it('Level 3: Policy Pass + AI Low Risk yields APPROVED decision', () => {
    const result = engine.evaluateDecision(basePolicyPass, baseAIPass);

    expect(result.finalDecision).toBe('APPROVED');
    expect(result.customerExplanation).toBe('Approved based on return policy.');
    expect(result.escalationFlags).toHaveLength(0);
  });
});
