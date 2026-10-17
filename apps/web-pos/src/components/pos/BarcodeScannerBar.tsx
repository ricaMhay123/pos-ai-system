import React, { useRef, useEffect } from 'react';
import { Search, Scan, X, Sparkles, Command } from 'lucide-react';

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
  placeholder = 'Scan barcode (e.g., 893500120110) or search SKU / product name...',
  autoFocus = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanningActive, setIsScanningActive] = React.useState(false);

  // Keyboard shortcut listener: F2 focuses scanner
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      // If it looks like a barcode (mostly digits or starts with 893)
      setIsScanningActive(true);
      setTimeout(() => setIsScanningActive(false), 300);
      onBarcodeScan(value.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center gap-2">
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

      <button
        id="btn-scan-camera-trigger"
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition active:scale-95"
      >
        <Scan className="w-4 h-4 text-indigo-400" />
        <span>Scan</span>
      </button>
    </div>
  );
};
