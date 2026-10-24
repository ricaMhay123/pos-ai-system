import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Lock,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
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
      setErrorMessage('Invalid username or password. Please check your credentials and try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username.trim(), password.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans relative">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white">POS AI</span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Enterprise Point-of-Sale &amp; AI Inventory Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>RBAC Active</span>
        </div>
      </header>

      {/* Main — centered login card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5">

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Sign In to Your Workspace
            </h2>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-200 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl"
            style={{ boxShadow: '0 0 60px -12px rgba(99,102,241,0.20)' }}
          >
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
                    placeholder="Enter username"
                    required
                    autoFocus
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

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  RBAC Protected &bull; Multi-Store Architecture
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 shrink-0">
        <p>POS AI &bull; Philippine Retail FMCG Architecture &bull; 12% VAT Localization</p>
      </footer>
    </div>
  );
};
