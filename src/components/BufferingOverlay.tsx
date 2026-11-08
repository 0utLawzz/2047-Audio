import React from 'react';
import { Loader2, RefreshCw, Cpu } from 'lucide-react';

interface BufferingOverlayProps {
  isBuffering: boolean;
  message?: string;
}

export const BufferingOverlay: React.FC<BufferingOverlayProps> = ({
  isBuffering,
  message = 'Syncing DSP Engine Buffer... Please wait',
}) => {
  if (!isBuffering) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
      <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 shadow-2xl flex items-center gap-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-yellow-400/15 text-amber-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
            Audio Buffer Rebuilding
          </span>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 block truncate">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
