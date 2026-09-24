import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CustomerPortal } from './pages/CustomerPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { useHealth } from './hooks/useHealth';
import { ShieldCheck, User, LayoutDashboard } from 'lucide-react';

const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
          W
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight text-white">
            Worknoon Refund System
          </h1>
          <p className="text-xs text-slate-400">
            Automated & Governed Customer Support Platform
          </p>
        </div>
      </div>

      <nav className="flex gap-2 mt-2 sm:mt-0">
        <Link
          to="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !isAdmin
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" /> Customer Portal
        </Link>
        <Link
          to="/admin"
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isAdmin
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Support Admin
        </Link>
      </nav>
    </header>
  );
};

export default function App() {
  const { health, loading, error } = useHealth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <NavigationHeader />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Global Backend Health Status Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Backend API Security Gateway:
            </span>
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

          <Routes>
            <Route path="/" element={<CustomerPortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Worknoon Technical Assessment — Controlled AI Support Refund System
        </footer>
      </div>
    </BrowserRouter>
  );
}
