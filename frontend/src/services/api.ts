import { HealthCheckResponse } from '../types';

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}
