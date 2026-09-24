import React, { useState } from 'react';
import { Header } from '../components/Header';

interface MainLayoutProps {
  children: (activeTab: 'customer' | 'admin') => React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children(activeTab)}
      </main>
      <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Worknoon Full Stack Technical Assessment — AI Customer Support Refund System
      </footer>
    </div>
  );
};
