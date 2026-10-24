import React from 'react';
import { Store, User, Wifi, Lock, Clock, History, LayoutDashboard } from 'lucide-react';

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
      className="h-16 border-b shrink-0 select-none flex items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--at-accent)',
        borderColor: 'var(--at-accent-light)',
        color: 'var(--at-text-on-accent)',
      }}
    >
      {/* Left: Terminal & Store Context */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          {/* Store icon badge – Primary amber bg, dark text on it */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--at-primary)', color: 'var(--at-text-on-primary)' }}
          >
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-sm font-bold tracking-tight"
                style={{ color: 'var(--at-neutral)' }}
              >
                {storeName}
              </h1>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-mono font-medium border"
                style={{
                  backgroundColor: 'var(--at-accent-muted)',
                  color: 'var(--at-primary)',
                  borderColor: 'var(--at-accent-light)',
                }}
              >
                {terminalCode}
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--at-neutral-muted)' }}>
              Enterprise Point-of-Sale System
            </p>
          </div>
        </div>
      </div>

      {/* Right: Cashier, Network status, Clock, Lock action */}
      <div className="flex items-center gap-4 text-xs">
        {/* Clock */}
        <div
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono"
          style={{
            backgroundColor: 'var(--at-accent-muted)',
            borderColor: 'var(--at-accent-light)',
            color: 'var(--at-neutral)',
          }}
        >
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--at-primary)' }} />
          <span>{currentTime}</span>
        </div>

        {/* Manager Dashboard Button */}
        {onToggleAiDashboard && (
          <button
            id="btn-toggle-ai-dashboard"
            type="button"
            onClick={onToggleAiDashboard}
            title="Open Manager Dashboard (/dashboard)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95"
            style={
              activeView === 'ai'
                ? {
                    backgroundColor: 'var(--at-secondary)',
                    color: 'var(--at-text-on-secondary)',
                    borderColor: 'var(--at-secondary)',
                  }
                : {
                    backgroundColor: 'var(--at-accent-muted)',
                    color: 'var(--at-primary-muted)',
                    borderColor: 'var(--at-accent-light)',
                  }
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Manager Dashboard</span>
            {pendingRecommendationsCount > 0 && (
              <span
                className="text-[10px] px-1.5 rounded-full font-mono font-bold"
                style={{ backgroundColor: 'var(--at-secondary)', color: 'var(--at-text-on-secondary)' }}
              >
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95"
            style={{
              backgroundColor: 'var(--at-accent-muted)',
              color: 'var(--at-neutral)',
              borderColor: 'var(--at-accent-light)',
            }}
          >
            <History className="w-3.5 h-3.5" style={{ color: 'var(--at-primary)' }} />
            <span>History</span>
          </button>
        )}

        {/* Cashier Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
          style={{
            backgroundColor: 'var(--at-accent-muted)',
            borderColor: 'var(--at-accent-light)',
            color: 'var(--at-neutral)',
          }}
        >
          <User className="w-3.5 h-3.5" style={{ color: 'var(--at-primary)' }} />
          <div>
            <span className="font-semibold">{cashierName}</span>
            <span className="text-[10px] ml-1" style={{ color: 'var(--at-neutral-muted)' }}>
              ({cashierRole})
            </span>
          </div>
        </div>

        {/* Sync Status */}
        <div
          id="network-sync-status"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium"
          style={{
            backgroundColor: 'var(--at-accent-muted)',
            borderColor: 'var(--at-accent-light)',
            color: isOnline ? '#6ee7b7' : 'var(--at-neutral-muted)',
          }}
        >
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>{isOnline ? 'Online / Synced' : 'Offline Mode'}</span>
        </div>

        {/* Lock Terminal */}
        {onLockTerminal && (
          <button
            id="btn-lock-terminal"
            onClick={onLockTerminal}
            title="Lock Cashier Terminal"
            className="p-2 rounded-lg border transition"
            style={{
              backgroundColor: 'var(--at-accent-muted)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-neutral)',
            }}
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
