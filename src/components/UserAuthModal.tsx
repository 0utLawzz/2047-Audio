import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  History, 
  Clock, 
  ShieldCheck, 
  Trash2, 
  Music2, 
  Upload, 
  Scissors, 
  Layers, 
  Download, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile, UserHistoryItem, MAX_RECOMMENDED_DURATION_SEC } from '../types/user';
import { loadUserProfile, saveUserProfile, loadUserHistory, clearUserHistory } from '../utils/historyStore';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onSelectHistoryTrack?: (historyItem: UserHistoryItem) => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [tier, setTier] = useState(currentUser.tier);
  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setTier(currentUser.tier);
      setHistoryItems(loadUserHistory());
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || 'Studio Producer',
      email: email.trim() || 'producer@2047audio.studio',
      tier,
      isGuest: false,
    };
    saveUserProfile(updated);
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear your 1-week audio project history?')) {
      clearUserHistory();
      setHistoryItems([]);
    }
  };

  const getActionIcon = (type: UserHistoryItem['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-3.5 h-3.5 text-blue-500" />;
      case 'slice':
        return <Scissors className="w-3.5 h-3.5 text-amber-500" />;
      case 'stem_separation':
        return <Layers className="w-3.5 h-3.5 text-cyan-500" />;
      case 'export':
        return <Download className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Music2 className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const formatTimestamp = (ms: number) => {
    const diffHours = Math.floor((Date.now() - ms) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const days = Math.floor(diffHours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-neutral-800 flex items-center justify-center">
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                Producer Account & History
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                1-Week Project Log · Safety Limit Advisor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-neutral-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'text-amber-600 dark:text-yellow-400 border-b-2 border-amber-500 dark:border-yellow-400'
                : 'text-slate-500 dark:text-neutral-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'text-amber-600 dark:text-yellow-400 border-b-2 border-amber-500 dark:border-yellow-400'
                : 'text-slate-500 dark:text-neutral-400'
            }`}
          >
            <History className="w-4 h-4" />
            <span>1-Week Activity Log ({historyItems.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80">
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-amber-500/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-700 dark:text-yellow-400 border border-amber-400/30">
                      {currentUser.tier}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 block truncate">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-medium">
                  Producer Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Producer / Artist Name"
                  className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-medium">
                  Email Address / Account Sync
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="producer@example.com"
                  className="w-full bg-slate-50 dark:bg-[#08080c] border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-medium">
                  Studio Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTier('Free Studio')}
                    className={`p-2.5 rounded-lg border text-xs text-left cursor-pointer transition-all ${
                      tier === 'Free Studio'
                        ? 'bg-amber-400/10 border-amber-500 text-amber-700 dark:text-yellow-400 font-bold'
                        : 'bg-slate-50 dark:bg-[#09090e] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                    }`}
                  >
                    Free Studio
                    <span className="text-[10px] block opacity-75 font-normal">Max 10 min · Local Cache</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTier('Pro Producer')}
                    className={`p-2.5 rounded-lg border text-xs text-left cursor-pointer transition-all ${
                      tier === 'Pro Producer'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-400 font-bold'
                        : 'bg-slate-50 dark:bg-[#09090e] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                    }`}
                  >
                    Pro Producer
                    <span className="text-[10px] block opacity-75 font-normal">Unlimited Stems · 24-bit Lossless</span>
                  </button>
                </div>
              </div>

              {/* Safety Limitations Box */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0" />
                  <span>Audio Engine Recommendations & Limits</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Recommended maximum track duration: <strong>10 minutes</strong> ({MAX_RECOMMENDED_DURATION_SEC}s) to prevent mobile browser memory exhaustion. 1-week history is automatically cached and purged after 7 days.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {savedSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 dark:bg-yellow-400 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Save Profile
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Showing actions from the last 7 days
                </span>
                {historyItems.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {historyItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-neutral-500 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recorded activity in the past 7 days.</p>
                  <p className="text-[11px] opacity-75 mt-0.5">Upload a track, create slices, or export to log events.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090e] border border-slate-200 dark:border-neutral-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-neutral-800 shrink-0 mt-0.5">
                          {getActionIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-neutral-200 block truncate">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400 block truncate">
                            {item.detail} · {item.bpm} BPM
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 shrink-0">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
