export type DecisionStatus = 'APPROVED' | 'DENIED' | 'ESCALATED' | 'PENDING';

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime?: number;
}

export interface RefundSubmissionRequest {
  customerId: string;
  orderId: string;
  customerReason: string;
}

export interface RefundResponse {
  id: string;
  customerId: string;
  orderId: string;
  status: DecisionStatus;
  decision: DecisionStatus;
  reason: string;
  explanation: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    totalAmount: number;
    currency: string;
    status: string;
  };
  policySummary?: {
    eligible: boolean;
    requiresHumanReview: boolean;
    checksPassed: number;
    totalChecks: number;
  };
  aiSummary?: {
    intent: string;
    risk: string;
    confidence: number;
    aiFailed: boolean;
  };
}
