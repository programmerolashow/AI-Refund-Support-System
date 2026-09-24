import { HealthCheckResponse, RefundSubmissionRequest, RefundResponse } from '../types';

const ADMIN_KEY = 'admin-secret-key-123';

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function submitRefundRequest(payload: RefundSubmissionRequest): Promise<RefundResponse> {
  const res = await fetch('/api/refunds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.error?.message || 'Failed to submit refund request.';
    const details = data.error?.details ? data.error.details.map((d: any) => d.message).join(' ') : '';
    throw new Error(`${errorMsg} ${details}`.trim());
  }

  return data;
}

export async function fetchRefunds(): Promise<any[]> {
  const res = await fetch('/api/refunds', {
    headers: {
      'Authorization': `Bearer ${ADMIN_KEY}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized admin access. Invalid or missing Admin API Key.');
    }
    throw new Error('Failed to fetch refund requests.');
  }
  return res.json();
}

export async function fetchRefundById(id: string): Promise<any> {
  const res = await fetch(`/api/refunds/${id}`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch refund details.');
  }
  return res.json();
}
