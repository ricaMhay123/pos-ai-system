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
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (u === 'manager' && p === 'manager123') {
      onLogin({
        id: '20000000-0000-0000-0000-000000000010',
        username: 'manager',
        role: 'store_manager',
        name: 'Maria Santos (Manager)',
        storeName: '21/7teen Mart - POS Terminal - Store #01',
        terminalCode: 'POS-BGC-01',
      });
    } else if (u === 'cashier' && p === 'cashier123') {
      onLogin({
        id: '20000000-0000-0000-0000-000000000011',
        username: 'cashier',
        role: 'cashier',
        name: 'Juan Dela Cruz (Cashier)',
        storeName: '21/7teen Mart - POS Terminal - Store #01',
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
    <div
      className="min-h-screen flex flex-col selection:text-white font-sans relative"
      style={{
        backgroundColor: 'var(--at-neutral)',
        color: 'var(--at-text-on-neutral)',
        /* @ts-ignore */
        '--tw-selection-color': 'var(--at-accent)',
      }}
    >
      {/* Ambient warm glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-3xl pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(235,160,0,0.18) 0%, rgba(184,84,63,0.10) 50%, transparent 80%)',
        }}
      />

      {/* Header Bar – Accent dark bg */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between shrink-0 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--at-accent)',
          borderColor: 'var(--at-accent-light)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo badge – Primary amber bg, CRITICAL: dark Accent text */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--at-primary)', color: 'var(--at-text-on-primary)' }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--at-neutral)' }}>
              POS AI
            </span>
            <p className="text-[11px] leading-tight" style={{ color: 'var(--at-neutral-muted)' }}>
              Enterprise Point-of-Sale &amp; AI Inventory Intelligence
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 font-mono px-3 py-1.5 rounded-lg text-xs border"
          style={{
            backgroundColor: 'var(--at-accent-muted)',
            borderColor: 'var(--at-accent-light)',
            color: 'var(--at-neutral)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--at-primary)' }}
          />
          <span>RBAC Active</span>
        </div>
      </header>

      {/* Main – centered login card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5">

          {/* Title */}
          <div className="text-center">
            <h2
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--at-accent)' }}
            >
              Sign In to Your Workspace
            </h2>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="p-4 rounded-xl border text-sm flex items-start gap-3"
              style={{
                /* Secondary rust-red bg → Neutral text (WCAG safe) */
                backgroundColor: 'rgba(184,84,63,0.10)',
                borderColor: 'rgba(184,84,63,0.30)',
                color: 'var(--at-secondary)',
              }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--at-secondary)' }}>
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div
            className="rounded-2xl p-8 shadow-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--at-neutral-dark)',
              borderColor: 'var(--at-neutral-muted)',
              boxShadow: '0 0 60px -12px rgba(235,160,0,0.18)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username field */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--at-accent)' }}
                >
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center" style={{ color: 'var(--at-accent-light)' }}>
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
                    className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition focus:outline-none"
                    style={{
                      backgroundColor: 'var(--at-neutral)',
                      borderColor: 'var(--at-neutral-muted)',
                      color: 'var(--at-accent)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--at-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(235,160,0,0.18)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--at-neutral-muted)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--at-accent)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center" style={{ color: 'var(--at-accent-light)' }}>
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    id="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition focus:outline-none"
                    style={{
                      backgroundColor: 'var(--at-neutral)',
                      borderColor: 'var(--at-neutral-muted)',
                      color: 'var(--at-accent)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--at-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(235,160,0,0.18)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--at-neutral-muted)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Sign In Button – Secondary rust-red → Neutral text */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full font-semibold py-2.5 px-4 rounded-xl shadow-lg transition transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--at-secondary) 0%, #a34535 100%)',
                  color: 'var(--at-text-on-secondary)',
                  boxShadow: '0 4px 14px -2px rgba(184,84,63,0.35)',
                }}
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span
                  className="text-[11px] flex items-center justify-center gap-1.5"
                  style={{ color: 'var(--at-accent-light)' }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--at-primary)' }} />
                  RBAC Protected &bull; Multi-Store Architecture
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t px-6 py-4 text-center text-xs shrink-0"
        style={{
          borderColor: 'var(--at-neutral-muted)',
          color: 'var(--at-accent-light)',
          backgroundColor: 'var(--at-neutral-dark)',
        }}
      >
        <p>POS AI &bull; Philippine Retail FMCG Architecture &bull; 12% VAT Localization</p>
      </footer>
    </div>
  );
};
