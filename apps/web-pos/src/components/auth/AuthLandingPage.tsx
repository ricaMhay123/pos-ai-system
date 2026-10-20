import React, { useState } from 'react';
import {
  ShieldCheck,
  Store,
  User,
  ShoppingBag,
  Sparkles,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export interface AuthUser {
  id: string;
  username: string;
  role: 'cashier' | 'store_manager' | 'admin';
  name: string;
  storeName: string;
  terminalCode: string;
}

interface AuthLandingPageProps {
  onLogin: (user: AuthUser) => void;
}

export const AuthLandingPage: React.FC<AuthLandingPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  const executeLogin = async (u: string, p: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Short simulated authentication delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Authenticate credentials against default test accounts or gateway
    if (u === 'manager' && p === 'manager123') {
      onLogin({
        id: '20000000-0000-0000-0000-000000000010',
        username: 'manager',
        role: 'store_manager',
        name: 'Maria Santos (Manager)',
        storeName: 'Flagship BGC Terminal - Taguig',
        terminalCode: 'POS-BGC-01',
      });
    } else if (u === 'cashier' && p === 'cashier123') {
      onLogin({
        id: '20000000-0000-0000-0000-000000000011',
        username: 'cashier',
        role: 'cashier',
        name: 'Juan Dela Cruz (Cashier)',
        storeName: 'Flagship BGC Terminal - Taguig',
        terminalCode: 'POS-BGC-01',
      });
    } else {
      setErrorMessage(
        'Invalid username or password. Please use the default test credentials displayed below.',
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username.trim(), password.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">POS AI</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Philippine Standard (PHP / ₱)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Enterprise Point-of-Sale & AI Inventory Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a
            href="/index.php"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <span>index.php Auth</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <div className="flex items-center gap-2 font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>RBAC Active</span>
          </div>
        </div>
      </header>

      {/* Main Auth View */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Phase A: Auth Landing Page & Dual-Role Access</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Choose your role profile or use the visible test credentials to enter either the Store
              Manager Dashboard or Cashier POS Checkout.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-200 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      id="input-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. manager or cashier"
                      required
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      id="input-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    RBAC Protected • Multi-Store Architecture
                  </span>
                </div>
              </form>
            </div>

            {/* Quick-Fill & Test Credentials Display Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Role Profiles & Quick-Fill Demo Accounts
                </span>
                <span className="text-[11px] text-indigo-400 font-medium">Click to fill</span>
              </div>

              {/* Manager Card */}
              <div
                id="card-role-manager"
                onClick={() => handleQuickFill('manager', 'manager123')}
                className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/80 rounded-2xl p-5 transition duration-200 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                          Store Manager Account
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Redirects to Dashboard
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Full administrative permissions: approve AI stock orders, inspect LightGBM demand
                        forecasts, view financial KPIs, and review low-stock warnings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visible Test Credentials Strip */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[11px]">Username:</span>
                      <span className="font-mono text-indigo-300 font-semibold ml-1">manager</span>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[11px]">Password:</span>
                      <span className="font-mono text-indigo-300 font-semibold ml-1">
                        manager123
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeLogin('manager', 'manager123');
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 shadow-sm shadow-indigo-600/40"
                  >
                    <span>Instant Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Cashier Card */}
              <div
                id="card-role-cashier"
                onClick={() => handleQuickFill('cashier', 'cashier123')}
                className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/80 rounded-2xl p-5 transition duration-200 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                          Cashier Account
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Strictly POS Checkout
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        POS operator access: barcode scanning, cart calculation, RA 9994 Senior/PWD 20%
                        discounts, Philippine cash & GCash/Maya tender. Restricted from manager dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visible Test Credentials Strip */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[11px]">Username:</span>
                      <span className="font-mono text-emerald-300 font-semibold ml-1">cashier</span>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[11px]">Password:</span>
                      <span className="font-mono text-emerald-300 font-semibold ml-1">
                        cashier123
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeLogin('cashier', 'cashier123');
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-sm shadow-emerald-600/40"
                  >
                    <span>Instant Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* RBAC Security Policy Notice */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    RBAC Policy: Cashier accounts cannot view inventory approvals or manager dashboards.
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">RBAC Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <p>
          POS AI • Philippine Retail FMCG Architecture • 12% Standard VAT Localization • Multi-Tenant
          Store Engine
        </p>
      </footer>
    </div>
  );
};
