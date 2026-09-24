import React from 'react';
import { MainLayout } from './layouts/MainLayout';
import { CustomerPortal } from './pages/CustomerPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { useHealth } from './hooks/useHealth';

export default function App() {
  const { health, loading, error } = useHealth();

  return (
    <MainLayout>
      {(activeTab) => (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs">
            <span className="text-slate-400">Backend Status:</span>
            {loading ? (
              <span className="text-amber-400 animate-pulse">Checking connectivity...</span>
            ) : error ? (
              <span className="text-rose-400">Offline ({error})</span>
            ) : (
              <span className="text-emerald-400 font-medium">
                ● Online ({health?.service} v1.0 - {health?.status})
              </span>
            )}
          </div>

          {activeTab === 'customer' ? <CustomerPortal /> : <AdminDashboard />}
        </div>
      )}
    </MainLayout>
  );
}
