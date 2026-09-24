import React from 'react';

interface HeaderProps {
  activeTab: 'customer' | 'admin';
  setActiveTab: (tab: 'customer' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg">
          W
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">Worknoon Refund Support System</h1>
          <p className="text-xs text-slate-400">AI-Assisted Controlled Refund Evaluation Platform</p>
        </div>
      </div>
      <nav className="flex gap-2 mt-2 sm:mt-0">
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'customer'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Customer Portal
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'admin'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Support Dashboard
        </button>
      </nav>
    </header>
  );
};
