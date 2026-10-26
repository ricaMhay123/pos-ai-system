import React, { useRef, useEffect, useCallback } from 'react';
import { Search, Scan, X } from 'lucide-react';

// ─── Sample catalog barcodes / SKUs used by the Scan button demo ──────────────
const DEMO_SCAN_POOL: string[] = [
  '480000000001', // RIC-SIN-001 – Sinandomeng Special Rice 5kg
  '480000000003', // BRD-GAR-003 – Gardenia Classic White Bread 600g
  '480000000004', // CAN-TUN-004 – Century Tuna Flakes in Oil 180g
  '480000000005', // CAN-CRN-005 – Purefoods Corned Beef 210g
  '480000000008', // INS-LKM-008 – Lucky Me! Pancit Canton Extra Hot 80g
  '480000000011', // BEV-NES-011 – Nescafe 3-in-1 Original 28g Sachet
  '480000000012', // BEV-KOP-012 – Kopiko Blanca Coffee 30g Sachet
  '480000000013', // BEV-COK-013 – Coca-Cola Original 1.5L
  '480000000017', // SNK-PIA-017 – Piattos Cheese 85g
  '480000000019', // PC-SAF-019 – Safeguard Pure White Soap 130g
  '480000000020', // HH-SRF-020 – Surf Powder Detergent Rose Fresh 1kg
  'RIC-SIN-001',
  'CAN-CRN-005',
  'INS-LKM-008',
  'BEV-COK-013',
  'SNK-PIA-017',
  'HH-SRF-020',
];

// ─── Web Audio API beep ───────────────────────────────────────────────────────
function playScanBeep(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.12);
    oscillator.onended = () => ctx.close();
  } catch {
    // silently ignore if AudioContext unavailable
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

  // F2 focuses the scanner input
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

  const fireScan = useCallback(
    (barcode: string) => {
      setIsScanningActive(true);
      playScanBeep();
      setTimeout(() => setIsScanningActive(false), 350);
      onBarcodeScan(barcode);
    },
    [onBarcodeScan],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      fireScan(value.trim());
    }
  };

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
        className="relative flex-1 flex items-center rounded-xl border transition-all duration-200"
        style={
          isScanningActive
            ? {
                backgroundColor: 'var(--at-neutral)',
                borderColor: 'var(--at-primary)',
                boxShadow: '0 0 0 3px rgba(235,160,0,0.20)',
              }
            : {
                backgroundColor: 'var(--at-neutral)',
                borderColor: 'var(--at-neutral-muted)',
              }
        }
      >
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none">
          {isScanningActive ? (
            <Scan
              className="w-5 h-5 animate-pulse"
              style={{ color: 'var(--at-primary)' }}
            />
          ) : (
            <Search className="w-5 h-5" style={{ color: 'var(--at-accent-light)' }} />
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
          className="w-full py-3 bg-transparent text-sm font-medium focus:outline-none"
          style={{
            color: 'var(--at-accent)',
          }}
        />

        {value && (
          <button
            id="btn-clear-search"
            type="button"
            onClick={handleClear}
            className="p-1.5 mr-2 rounded-lg transition"
            style={{ color: 'var(--at-accent-light)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Keyboard hint badges */}
        <div
          className="hidden sm:flex items-center gap-1.5 pr-3 text-[11px] font-mono select-none"
          style={{ color: 'var(--at-neutral-muted)' }}
        >
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] border"
            style={{
              backgroundColor: 'var(--at-neutral-dark)',
              borderColor: 'var(--at-neutral-muted)',
              color: 'var(--at-accent)',
            }}
          >
            F2
          </kbd>
          <span>focus</span>
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] border ml-1"
            style={{
              backgroundColor: 'var(--at-neutral-dark)',
              borderColor: 'var(--at-neutral-muted)',
              color: 'var(--at-accent)',
            }}
          >
            Enter
          </kbd>
          <span>scan</span>
        </div>
      </div>

      {/* ── Scan Button ─────────────────────────────────────────────────────── */}
      <button
        id="btn-scan-camera-trigger"
        type="button"
        onClick={handleScanButtonClick}
        title="Simulate barcode scan (uses typed value or picks a random catalog item)"
        className="flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold shadow-sm transition active:scale-95"
        style={
          isScanningActive
            ? {
                backgroundColor: 'var(--at-primary)',
                /* Primary bg → CRITICAL: Accent (dark) text for contrast */
                color: 'var(--at-text-on-primary)',
                borderColor: 'var(--at-primary-muted)',
              }
            : {
                backgroundColor: 'var(--at-accent)',
                color: 'var(--at-neutral)',
                borderColor: 'var(--at-accent-light)',
              }
        }
      >
        <Scan
          className={`w-4 h-4 transition-colors ${isScanningActive ? 'animate-pulse' : ''}`}
          style={{ color: isScanningActive ? 'var(--at-text-on-primary)' : 'var(--at-primary)' }}
        />
        <span>Scan</span>
      </button>
    </div>
  );
};
