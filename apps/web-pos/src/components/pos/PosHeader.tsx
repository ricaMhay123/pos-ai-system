import React from 'react';
import { Store, User, Wifi, Lock, ShieldCheck, Clock, History } from 'lucide-react';

interface PosHeaderProps {
  storeName?: string;
  terminalCode?: string;
  cashierName?: string;
  cashierRole?: string;
  isOnline?: boolean;
  onLockTerminal?: () => void;
  onToggleAiDashboard?: () => void;
  onToggleTransactionHistory?: () => void;
  activeView?: 'pos' | 'ai';
  pendingRecommendationsCount?: number;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  storeName = 'Flagship Manhattan Terminal',
  terminalCode = 'POS-TERM-01',
  cashierName = 'David Miller',
  cashierRole = 'Cashier (EMP-CSH-003)',
  isOnline = true,
  onLockTerminal,
  onToggleAiDashboard,
  onToggleTransactionHistory,
  activeView = 'pos',
  pendingRecommendationsCount = 0,
}) => {
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="pos-header"
      className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none"
    >
      {/* Left: Terminal & Store Context */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">{storeName}</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 font-mono font-medium">
                {terminalCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise Point-of-Sale System</p>
          </div>
        </div>
      </div>

      {/* Right: Cashier, Network status, Clock, Lock action */}
      <div className="flex items-center gap-4 text-xs">
        {/* Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentTime}</span>
        </div>

        {/* AI Dashboard Button */}
        {onToggleAiDashboard && (
          <button
            id="btn-toggle-ai-dashboard"
            type="button"
            onClick={onToggleAiDashboard}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              activeView === 'ai'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-amber-300 hover:text-amber-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>AI Replenishment</span>
            {pendingRecommendationsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold">
                {pendingRecommendationsCount}
              </span>
            )}
          </button>
        )}

        {/* Transaction History Button */}
        {onToggleTransactionHistory && (
          <button
            id="btn-toggle-transaction-history"
            type="button"
            onClick={onToggleTransactionHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition bg-slate-800/80 text-violet-300 hover:text-violet-200 border-slate-700 hover:bg-slate-800"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        )}

        {/* Cashier Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
          <User className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <span className="font-semibold">{cashierName}</span>
            <span className="text-[10px] text-slate-400 ml-1">({cashierRole})</span>
          </div>
        </div>

        {/* Sync Status */}
        <div
          id="network-sync-status"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-emerald-400 font-medium"
        >
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>{isOnline ? 'Online / Synced' : 'Offline Mode'}</span>
        </div>

        {/* Lock Terminal Action */}
        {onLockTerminal && (
          <button
            id="btn-lock-terminal"
            onClick={onLockTerminal}
            title="Lock Cashier Terminal"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
