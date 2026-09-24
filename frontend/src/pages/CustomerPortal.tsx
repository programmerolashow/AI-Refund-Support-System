import React, { useState } from 'react';
import { submitRefundRequest } from '../services/api';
import { RefundResponse } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [customerReason, setCustomerReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RefundResponse | null>(null);

  // Demo presets for easy testing during technical assessment
  const applyPreset = (cId: string, oId: string, reason: string) => {
    setCustomerId(cId);
    setOrderId(oId);
    setCustomerReason(reason);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim() || !orderId.trim() || !customerReason.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await submitRefundRequest({
        customerId: customerId.trim(),
        orderId: orderId.trim(),
        customerReason: customerReason.trim(),
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-white mb-1">Customer Refund Portal</h2>
        <p className="text-slate-400 text-sm">
          Submit an e-commerce refund request. Our automated policy engine evaluates your order against return terms instantly.
        </p>

        {/* Quick Demo Test Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Test Presets (Click to Auto-fill):
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                applyPreset(
                  'cust-104',
                  'ORD-1004',
                  'My order ORD-1004 arrived damaged. The ceramic coffee maker was cracked in transit.'
                )
              }
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-md font-medium transition-colors"
            >
              ✓ Valid Damaged Item
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset(
                  'cust-102',
                  'ORD-1002',
                  'I would like to return the Bluetooth Headphones purchased 45 days ago.'
                )
              }
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-md font-medium transition-colors"
            >
              ✗ Expired Order (&gt;30d)
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset(
                  'cust-103',
                  'ORD-1003',
                  'The Clearance Leather Jacket doesn\'t fit as expected. Requesting refund.'
                )
              }
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-md font-medium transition-colors"
            >
              ✗ Final Sale Item
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset(
                  'cust-106',
                  'ORD-1006',
                  'The 4K Ultra HD Monitor 32" arrived with dead pixels on the display.'
                )
              }
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-md font-medium transition-colors"
            >
              ⚠ High Value (&gt;$500)
            </button>
          </div>
        </div>
      </div>

      {/* Main Request Form or Result Card */}
      {!result ? (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
          {error && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-4 text-rose-300 text-sm flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Submission Error</span>
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerId" className="block text-xs font-medium text-slate-300 mb-1.5">
                Customer ID <span className="text-rose-400">*</span>
              </label>
              <input
                id="customerId"
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. cust-104"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="orderId" className="block text-xs font-medium text-slate-300 mb-1.5">
                Order ID <span className="text-rose-400">*</span>
              </label>
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ORD-1004"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="customerReason" className="block text-xs font-medium text-slate-300 mb-1.5">
              Reason for Refund Request <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="customerReason"
              rows={4}
              value={customerReason}
              onChange={(e) => setCustomerReason(e.target.value)}
              placeholder="Describe your issue with the order (e.g. item damaged in transit, wrong size sent)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors resize-y"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating Policy & Request...
              </>
            ) : (
              <>
                Submit Refund Request <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Result Display Card (Color Gradient-Free) */
        <div className="space-y-4">
          {result.decision === 'APPROVED' && (
            <div className="bg-slate-900 border border-emerald-800/80 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-full text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Refund Status
                  </span>
                  <h3 className="text-2xl font-bold text-white">APPROVED</h3>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Explanation:
                </h4>
                <p className="text-slate-200 text-sm bg-slate-950 border border-slate-800 rounded-lg p-4 leading-relaxed">
                  {result.explanation || result.reason}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Next Steps:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside bg-slate-950/50 border border-slate-800 rounded-lg p-3.5">
                  <li>Your refund of <span className="font-semibold text-emerald-400">${result.order.totalAmount.toFixed(2)} {result.order.currency}</span> has been authorized.</li>
                  <li>Funds will be credited back to your original payment method within 3 to 5 business days.</li>
                  <li>A confirmation receipt has been sent to <span className="text-slate-200">{result.customer.email}</span>.</li>
                </ul>
              </div>
            </div>
          )}

          {result.decision === 'DENIED' && (
            <div className="bg-slate-900 border border-rose-800/80 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-rose-950 border border-rose-800 rounded-full text-rose-400">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Refund Status
                  </span>
                  <h3 className="text-2xl font-bold text-white">DENIED</h3>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Explanation:
                </h4>
                <p className="text-slate-200 text-sm bg-slate-950 border border-slate-800 rounded-lg p-4 leading-relaxed">
                  {result.explanation || result.reason}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Next Steps:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside bg-slate-950/50 border border-slate-800 rounded-lg p-3.5">
                  <li>Review our store return terms regarding final sale items and the 30-day window.</li>
                  <li>If you believe special circumstances apply, you may contact our support team.</li>
                </ul>
              </div>
            </div>
          )}

          {result.decision === 'ESCALATED' && (
            <div className="bg-slate-900 border border-amber-800/80 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-amber-950 border border-amber-800 rounded-full text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Refund Status
                  </span>
                  <h3 className="text-2xl font-bold text-white">ROUTED FOR HUMAN REVIEW</h3>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Explanation:
                </h4>
                <p className="text-slate-200 text-sm bg-slate-950 border border-slate-800 rounded-lg p-4 leading-relaxed">
                  {result.explanation || result.reason}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Next Steps:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside bg-slate-950/50 border border-slate-800 rounded-lg p-3.5">
                  <li>A support ticket <span className="font-mono text-amber-400">#{result.id.slice(0, 8)}</span> has been opened automatically.</li>
                  <li>A customer support specialist will inspect your order details within 24 hours.</li>
                  <li>Updates will be communicated directly to <span className="text-slate-200">{result.customer.email}</span>.</li>
                </ul>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Submit Another Request
          </button>
        </div>
      )}
    </div>
  );
};
