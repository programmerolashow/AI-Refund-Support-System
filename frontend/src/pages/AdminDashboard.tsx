import React, { useState, useEffect } from 'react';
import { fetchRefunds } from '../services/api';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Shield,
  Bot,
  FileText,
  User,
  ShoppingBag,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'DENIED' | 'ESCALATED'>('ALL');
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRefunds();
      setRefunds(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch refund audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filteredRefunds = refunds.filter((r) => {
    const matchesFilter = statusFilter === 'ALL' || r.decision === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      r.id.toLowerCase().includes(query) ||
      r.customerId.toLowerCase().includes(query) ||
      r.orderId.toLowerCase().includes(query) ||
      r.customer?.name?.toLowerCase().includes(query) ||
      r.customer?.email?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  // Summary Metrics
  const totalCount = refunds.length;
  const approvedCount = refunds.filter((r) => r.decision === 'APPROVED').length;
  const deniedCount = refunds.filter((r) => r.decision === 'DENIED').length;
  const escalatedCount = refunds.filter((r) => r.decision === 'ESCALATED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-white">Support Admin Dashboard</h2>
          <p className="text-slate-400 text-sm">
            Monitor real-time refund evaluations, inspect policy audit checks, and analyze AI signals.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Requests</span>
            <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
            #
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-medium">Approved Requests</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-400 font-medium">Denied Requests</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{deniedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 font-medium">Escalated Requests</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{escalatedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, order ID, or request ID..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="APPROVED">APPROVED Only</option>
            <option value="DENIED">DENIED Only</option>
            <option value="ESCALATED">ESCALATED Only</option>
          </select>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
            <p className="text-sm">Loading audit records from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            <XCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No refund requests match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <th className="p-4">Request / Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Order Details</th>
                  <th className="p-4">Decision</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-slate-200 font-semibold">{refund.id.slice(0, 8)}...</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(refund.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{refund.customer?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-400">{refund.customer?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-slate-200">{refund.orderId}</div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        ${refund.order?.totalAmount?.toFixed(2)} {refund.order?.currency || 'USD'}
                      </div>
                    </td>
                    <td className="p-4">
                      {refund.decision === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle className="w-3 h-3" /> APPROVED
                        </span>
                      )}
                      {refund.decision === 'DENIED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                          <XCircle className="w-3 h-3" /> DENIED
                        </span>
                      )}
                      {refund.decision === 'ESCALATED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                          <AlertTriangle className="w-3 h-3" /> ESCALATED
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Audit Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Inspection Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center z-10">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">Refund Request Inspection</h3>
                  <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                    ID: {selectedRefund.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Submitted: {new Date(selectedRefund.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRefund(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Customer & Order Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Info Card */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm border-b border-slate-800 pb-2">
                    <User className="w-4 h-4 text-indigo-400" /> Customer Details
                  </div>
                  <div>
                    <span className="text-slate-400">Name:</span>{' '}
                    <span className="text-white font-medium">{selectedRefund.customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>{' '}
                    <span className="text-slate-200">{selectedRefund.customer?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Customer ID:</span>{' '}
                    <span className="font-mono text-slate-300">{selectedRefund.customerId}</span>
                  </div>
                </div>

                {/* Order Info Card */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm border-b border-slate-800 pb-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" /> Order Details
                  </div>
                  <div>
                    <span className="text-slate-400">Order ID:</span>{' '}
                    <span className="font-mono text-white font-medium">{selectedRefund.orderId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Amount:</span>{' '}
                    <span className="text-emerald-400 font-bold">
                      ${selectedRefund.order?.totalAmount?.toFixed(2)} {selectedRefund.order?.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>{' '}
                    <span className="text-slate-200">{selectedRefund.order?.status}</span>
                  </div>
                </div>
              </div>

              {/* Original Customer Message */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                  <FileText className="w-4 h-4 text-amber-400" /> Original Customer Request (Untrusted Input)
                </div>
                <p className="bg-slate-900 border border-slate-800 p-3 rounded text-slate-200 font-mono text-xs leading-relaxed">
                  "{selectedRefund.customerReason}"
                </p>
              </div>

              {/* Deterministic Policy Checks */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                  <Shield className="w-4 h-4 text-indigo-400" /> Deterministic Policy Rule Evaluations
                </div>

                {selectedRefund.auditLog?.policyChecks ? (
                  <div className="space-y-2">
                    {Array.isArray(selectedRefund.auditLog.policyChecks) &&
                      selectedRefund.auditLog.policyChecks.map((rule: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between bg-slate-900 border border-slate-800 p-2.5 rounded text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-200">{rule.rule}:</span>{' '}
                            <span className="text-slate-400">{rule.message}</span>
                          </div>
                          {rule.passed ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                              PASS
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                rule.severity === 'HARD_BLOCK'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {rule.severity}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No policy checks recorded.</p>
                )}
              </div>

              {/* AI Analysis Signals */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                  <Bot className="w-4 h-4 text-purple-400" /> AI Controlled Decision-Support Analysis
                </div>

                {selectedRefund.auditLog?.aiAnalysis ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3 rounded">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Intent:</span>
                      <span className="text-white font-medium">{selectedRefund.auditLog.aiAnalysis.intent}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Confidence:</span>
                      <span className="text-white font-medium">
                        {((selectedRefund.auditLog.aiAnalysis.confidence || 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Risk Level:</span>
                      <span
                        className={`font-bold ${
                          selectedRefund.auditLog.aiAnalysis.risk === 'high'
                            ? 'text-rose-400'
                            : selectedRefund.auditLog.aiAnalysis.risk === 'medium'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {selectedRefund.auditLog.aiAnalysis.risk?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No AI analysis data available.</p>
                )}
              </div>

              {/* Customer Explanation vs Internal Audit Notes (Clearly Distinguished) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Facing Explanation */}
                <div className="bg-indigo-950/30 border border-indigo-800/80 p-4 rounded-lg space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                    Public Customer Explanation (Sent to Customer)
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    "{selectedRefund.decisionReason}"
                  </p>
                </div>

                {/* Internal Support Audit Notes */}
                <div className="bg-amber-950/30 border border-amber-800/80 p-4 rounded-lg space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                    Internal Support Audit Notes (Private Admin View Only)
                  </span>
                  <p className="text-slate-200 text-xs font-mono leading-relaxed">
                    {selectedRefund.auditLog?.auditNotes || selectedRefund.decisionReason}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
              <button
                onClick={() => setSelectedRefund(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
