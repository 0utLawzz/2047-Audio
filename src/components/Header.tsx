import React, { useState } from 'react';
import { 
  Download, 
  Sun, 
  Moon, 
  Smartphone, 
  Monitor, 
  User, 
  Palette, 
  Columns, 
  Check, 
  Upload,
  Grid,
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { ThemeVibe, THEME_PRESETS } from '../types/theme';
import { UserProfile } from '../types/user';

export interface LastActionNotice {
  text: string;
  type: 'undo' | 'redo' | 'action';
  timestamp: number;
}

interface HeaderProps {
  onOpenExport: () => void;
  onOpenAuth: () => void;
  currentTheme: ThemeVibe;
  onChangeTheme: (theme: ThemeVibe) => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  activeLayout: '3col' | 'slicing' | 'beatpads' | 'load';
  onChangeLayout: (layout: '3col' | 'slicing' | 'beatpads' | 'load') => void;
  currentUser: UserProfile;
  lastActionNotice?: LastActionNotice | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenAuth,
  currentTheme,
  onChangeTheme,
  isMobilePreview,
  onToggleMobilePreview,
  activeLayout,
  onChangeLayout,
  currentUser,
  lastActionNotice,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-2.5 sm:gap-6 px-3.5 sm:px-6 py-2.5 sm:py-3 bg-white/95 dark:bg-[#0d0d14]/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-200 shrink-0 select-none z-30 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-cyan-500 dark:from-yellow-400 dark:to-cyan-400 p-[1px] shadow-sm shrink-0">
            <div className="w-full h-full bg-slate-900 dark:bg-[#0a0a0f] rounded-[7px] flex items-center justify-center">
              <span className="font-mono text-xs sm:text-sm font-black text-amber-400 dark:text-yellow-400">20</span>
              <span className="font-mono text-[10px] sm:text-xs font-black text-cyan-400">47</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors whitespace-nowrap">
              2047 AUDIO
            </span>
            <span className="hidden sm:inline text-[9px] text-slate-500 dark:text-neutral-400 tracking-wider uppercase font-semibold -mt-1 whitespace-nowrap">
              Web DAW & Beat Machine
            </span>
          </div>
        </a>
      </div>

      {/* Visual Indicator of Last Performed Action (Undo / Redo / History) */}
      {lastActionNotice && (
        <div 
          key={lastActionNotice.timestamp}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all animate-in fade-in zoom-in-95 duration-150 shrink-0 ${
            lastActionNotice.type === 'undo'
              ? 'bg-amber-400/15 border-amber-500/40 text-amber-700 dark:text-yellow-400 shadow-sm shadow-yellow-400/20'
              : lastActionNotice.type === 'redo'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-400 shadow-sm shadow-cyan-400/20'
              : 'bg-slate-100 dark:bg-neutral-850 border-slate-200 dark:border-neutral-750 text-slate-700 dark:text-neutral-300'
          }`}
          title={`Last performed action: ${lastActionNotice.text}`}
        >
          {lastActionNotice.type === 'undo' ? (
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-400 shrink-0" />
          ) : lastActionNotice.type === 'redo' ? (
            <RotateCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          ) : (
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          )}
          <span className="truncate max-w-[120px] sm:max-w-[190px]">
            {lastActionNotice.text}
          </span>
        </div>
      )}

      {/* Zone 2: Navigation Links / Studio View Modes (Desktop) */}
      <nav className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-900/80 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
        <button
          onClick={() => onChangeLayout('load')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeLayout === 'load'
              ? 'bg-white dark:bg-[#12121a] text-slate-900 dark:text-white shadow-xs font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-blue-500" />
          <span>1. Load Audio</span>
        </button>

        <button
          onClick={() => onChangeLayout('slicing')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeLayout === 'slicing'
              ? 'bg-white dark:bg-[#12121a] text-amber-600 dark:text-yellow-400 shadow-xs font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span>2. Slicing Studio (2-Col)</span>
        </button>

        <button
          onClick={() => onChangeLayout('3col')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeLayout === '3col'
              ? 'bg-white dark:bg-[#12121a] text-cyan-600 dark:text-cyan-400 shadow-xs font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5 text-cyan-500" />
          <span>3-Col Studio Overview</span>
        </button>

        <button
          onClick={() => onChangeLayout('beatpads')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeLayout === 'beatpads'
              ? 'bg-white dark:bg-[#12121a] text-amber-600 dark:text-yellow-400 shadow-xs font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5 text-purple-500" />
          <span>Beat Machine Pads</span>
        </button>
      </nav>

      {/* Zone 3: Theme Vibes, Profile & Master Export */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Vibe / Theme Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            title="Select Studio Theme Vibe"
            className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Palette className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
            <span className="hidden sm:inline">Theme Vibe</span>
          </button>

          {/* Theme Dropdown Menu */}
          {isThemeMenuOpen && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-2.5 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95"
            >
              <div className="px-2 py-1 font-bold text-slate-500 dark:text-neutral-400 text-[10px] uppercase tracking-wider">
                Select Visual Vibe
              </div>
              {THEME_PRESETS.map((preset) => {
                const isSelected = currentTheme === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onChangeTheme(preset.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-500 text-amber-800 dark:text-yellow-300 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-[#0a0a0f] border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0" 
                        style={{ backgroundColor: preset.previewAccent }}
                      />
                      <div>
                        <span className="block text-xs font-bold leading-tight">{preset.name}</span>
                        <span className="block text-[10px] text-slate-400 dark:text-neutral-500 font-normal">{preset.tagline}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Viewport Toggle (Desktop only) */}
        <button
          onClick={onToggleMobilePreview}
          title={isMobilePreview ? 'Switch to Full Desktop Canvas' : 'Preview Android Mobile Screen'}
          className="hidden md:flex min-h-[40px] p-2 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 transition-colors cursor-pointer items-center justify-center"
        >
          {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>

        {/* User Account / 1-Week History Trigger */}
        <button
          onClick={onOpenAuth}
          title="Producer Account & 1-Week History"
          className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-5 h-5 rounded-full object-cover border border-amber-500/50 shrink-0"
          />
          <span className="hidden sm:inline font-bold truncate max-w-[90px]">{currentUser.name}</span>
        </button>

        {/* Master Export Trigger */}
        <button
          onClick={onOpenExport}
          title="Export 24-bit WAV Master"
          className="min-h-[40px] px-3.5 sm:px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-yellow-400 dark:to-yellow-300 hover:from-amber-300 dark:hover:from-yellow-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Master Export</span>
          <span className="sm:hidden font-mono text-[11px]">Export</span>
        </button>
      </div>
    </header>
  );
};
