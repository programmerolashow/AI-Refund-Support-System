export type DecisionStatus = 'APPROVED' | 'DENIED' | 'ESCALATED' | 'PENDING';

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime?: number;
}
