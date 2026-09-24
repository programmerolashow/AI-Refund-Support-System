export type PolicyRuleName =
  | 'MISSING_DATA'
  | 'ORDER_STATUS'
  | 'FINAL_SALE'
  | 'REFUND_WINDOW'
  | 'HIGH_VALUE_THRESHOLD'
  | 'CONDITION_CHECK'
  | 'SUSPICIOUS_CONFLICT';

export type PolicySeverity = 'HARD_BLOCK' | 'REQUIRES_ESCALATION' | 'INFO';

export interface PolicyRuleResult {
  rule: PolicyRuleName;
  passed: boolean;
  severity: PolicySeverity;
  message: string;
  details?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  eligible: boolean;
  requiresHumanReview: boolean;
  escalationRequired: boolean;
  recommendedDecision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  hardDenialReason?: string;
  rules: PolicyRuleResult[];
  evaluatedAt: string;
}

export interface PolicyConfig {
  refundWindowDays: number;
  highValueThreshold: number;
}
