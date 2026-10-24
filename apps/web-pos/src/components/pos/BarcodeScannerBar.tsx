import React, { useRef, useEffect, useCallback } from 'react';
import { Search, Scan, X } from 'lucide-react';

// ─── Sample catalog barcodes / SKUs used by the Scan button demo ──────────────
// These match the hard-coded INITIAL_PH_PRODUCTS in App.tsx so a demo scan
// will always resolve to a real product in the cart.
const DEMO_SCAN_POOL: string[] = [
  '480001660101', // RIC-SIN-001 – Sinandomeng Special Rice 5kg
  '480001660102', // RIC-JAS-002 – Dinorado Jasmine Rice 5kg
  '480001660204', // CAN-TUN-004 – Century Tuna Flakes in Oil 180g
  'RIC-SIN-001',  // SKU fallback
  'CAN-TUN-004',  // SKU fallback
];

// ─── Web Audio API beep (works without any audio file assets) ────────────────
function playScanBeep(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1800, ctx.currentTime);          // high-pitched beep
    oscillator.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.12);
    oscillator.onended = () => ctx.close();
  } catch {
    // Browsers that block AudioContext (no interaction yet) — silently skip
  }
}

interface BarcodeScannerBarProps {
  value: string;
  onChange: (val: string) => void;
  onBarcodeScan: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const BarcodeScannerBar: React.FC<BarcodeScannerBarProps> = ({
  value,
  onChange,
  onBarcodeScan,
  placeholder = 'Scan Philippine EAN-13 barcode or search SKU / product name...',
  autoFocus = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanningActive, setIsScanningActive] = React.useState(false);

  // ─── F2 focuses the scanner input ─────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Core scan dispatcher (reused by Enter key and Scan button) ───────────
  const fireScan = useCallback(
    (barcode: string) => {
      setIsScanningActive(true);
      playScanBeep();
      setTimeout(() => setIsScanningActive(false), 350);
      onBarcodeScan(barcode);
    },
    [onBarcodeScan],
  );

  // ─── Enter key on input → scan whatever is typed ─────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      fireScan(value.trim());
    }
  };

  // ─── "Scan" button click ──────────────────────────────────────────────────
  // Priority:
  //   1. If the input has text  → treat that as the scanned barcode
  //   2. Otherwise              → pick a random entry from the demo pool
  const handleScanButtonClick = () => {
    const typed = value.trim();
    if (typed) {
      fireScan(typed);
    } else {
      const sample = DEMO_SCAN_POOL[Math.floor(Math.random() * DEMO_SCAN_POOL.length)];
      fireScan(sample);
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Search / Barcode Input */}
      <div
        className={`relative flex-1 flex items-center rounded-xl bg-slate-900 border transition-all duration-200 ${
          isScanningActive
            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
            : 'border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
        }`}
      >
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
          {isScanningActive ? (
            <Scan className="w-5 h-5 text-emerald-400 animate-pulse" />
          ) : (
            <Search className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <input
          id="pos-barcode-search-input"
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full py-3 bg-transparent text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none"
        />

        {value && (
          <button
            id="btn-clear-search"
            type="button"
            onClick={handleClear}
            className="p-1.5 mr-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Keyboard hint badges */}
        <div className="hidden sm:flex items-center gap-1.5 pr-3 text-[11px] text-slate-500 font-mono select-none">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
            F2
          </kbd>
          <span>focus</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] ml-1">
            Enter
          </kbd>
          <span>scan</span>
        </div>
      </div>

      {/* ── Scan Button ────────────────────────────────────────────────────── */}
      {/* Clicking fires a real scan: uses typed input OR a random demo barcode */}
      <button
        id="btn-scan-camera-trigger"
        type="button"
        onClick={handleScanButtonClick}
        title="Simulate barcode scan (uses typed value or picks a random catalog item)"
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold shadow-sm transition active:scale-95 ${
          isScanningActive
            ? 'bg-emerald-700/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
        }`}
      >
        <Scan
          className={`w-4 h-4 transition-colors ${
            isScanningActive ? 'text-emerald-300 animate-pulse' : 'text-indigo-400'
          }`}
        />
        <span>Scan</span>
      </button>
    </div>
  );
};
