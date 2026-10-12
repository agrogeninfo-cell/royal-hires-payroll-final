import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  QrCode,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'guide' | 'troubleshoot'>('qr');

  if (!isOpen) return null;

  // Ensure public shareable URL is used (replace ais-dev- with ais-pre- so phone won't get 403 error)
  const currentOrigin = window.location.origin;
  const publicAppUrl = currentOrigin.includes('ais-dev-')
    ? currentOrigin.replace('ais-dev-', 'ais-pre-')
    : currentOrigin;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(
    publicAppUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeInstall = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border transition-all max-h-[92vh] overflow-y-auto ${
          isDark
            ? 'bg-[#0E1720] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00E5C9] to-emerald-500 p-0.5 shadow-md shadow-[#00E5C9]/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Android Phone එකට Install කරගැනීම
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                1-Tap Direct Install & Mobile Setup Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full border transition cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-2 rounded-lg text-center transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-[#00E5C9] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-2 rounded-lg text-center transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-[#00E5C9] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>පියවර (Steps)</span>
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`py-2 px-2 rounded-lg text-center transition flex items-center justify-center space-x-1 cursor-pointer ${
              activeTab === 'troubleshoot'
                ? 'bg-[#00E5C9] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ගැටළු විසඳුම්</span>
          </button>
        </div>

        {/* Status Badge if 1-tap browser prompt is ready */}
        {isInstalled ? (
          <div className="mt-3 flex items-center space-x-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>මෙම App එක දැනටමත් මෙම Device එකේ Install කර ඇත!</span>
          </div>
        ) : isInstallable ? (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-[#00E5C9]/30 space-y-2">
            <div className="flex items-center space-x-2 text-[#00E5C9] text-xs font-bold">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Direct 1-Tap Install Ready!</span>
            </div>
            <button
              onClick={handleNativeInstall}
              className="w-full py-2.5 rounded-xl btn-cyan-glow font-bold text-xs text-slate-950 flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install LankaManpower App Now</span>
            </button>
          </div>
        ) : null}

        {/* TAB 1: QR CODE & PUBLIC LINK */}
        {activeTab === 'qr' && (
          <div className="mt-4 space-y-4">
            <div
              className={`p-4 rounded-2xl border text-center space-y-3 ${
                isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="text-xs font-semibold text-slate-200">
                ඔබගේ Android Phone එකේ <strong>Camera</strong> හෝ <strong>Google Lens</strong> මඟින් මෙම QR Code එක Scan කරන්න:
              </p>

              <div className="flex justify-center py-2">
                <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-[#00E5C9]">
                  <img
                    src={qrCodeUrl}
                    alt="Scan with Android phone camera"
                    className="w-40 h-40 object-contain block mx-auto"
                    loading="eager"
                  />
                  <p className="text-[10px] text-slate-700 font-bold mt-1 text-center">
                    LankaManpower ERP
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-400">
                  හෝ පහත Link එක Phone එකට යවා Chrome මඟින් විවෘත කරන්න:
                </p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[11px] font-mono text-[#00E5C9] truncate">
                    {publicAppUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer ${
                      copied
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-[#00E5C9]/20 border-[#00E5C9]/40 text-[#00E5C9] hover:bg-[#00E5C9]/30'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-slate-300 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5C9] shrink-0 mt-0.5" />
              <span>
                <strong>APK File එකක් Download කරගැනීම අවශ්‍ය නොවේ:</strong> Android Chrome මඟින් 1-Tap වලින් Install කරගත් විට එය සාමාන්‍ය APK එකක් මෙන්ම වෙනම App එකක් ලෙස Full-Screen ක්‍රියාත්මක වේ.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP GUIDE */}
        {activeTab === 'guide' && (
          <div className="mt-4 space-y-3">
            <div
              className={`p-4 rounded-2xl border space-y-3 text-xs leading-relaxed ${
                isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <h3 className="text-sm font-bold text-[#00E5C9] flex items-center space-x-2">
                <span>Android Phone එකෙහි Install කරන නිවැරදි පියවර:</span>
              </h3>

              <div className="space-y-3 text-slate-300">
                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-[#00E5C9] text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white block">Link එක Chrome Browser එකෙන් විවෘත කරන්න</strong>
                    <span className="text-[11px] text-slate-400">
                      WhatsApp හෝ වෙනත් app එකකින් ලැබුණේ නම්, උඩ දකුණු කෙළවරේ තිත් 3 ඔබා <strong>&quot;Open in Chrome&quot;</strong> තෝරන්න.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-[#00E5C9] text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white block">Chrome හි තිත් 3 (⋮) මෙනුව ඔබන්න</strong>
                    <span className="text-[11px] text-slate-400">
                      Chrome browser එකේ ඉහළ දකුණු කෙළවරේ ඇති තිත් 3 (Menu icon) ඔබන්න.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-[#00E5C9] text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white block">&quot;Install app&quot; හෝ &quot;Add to Home screen&quot; ඔබන්න</strong>
                    <span className="text-[11px] text-slate-400">
                      මෙනුවේ ඇති <strong>&quot;Install app&quot;</strong> (හෝ &quot;මුල් තිරයට එක් කරන්න&quot;) තෝරා <strong>Install</strong> ඔබන්න.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-emerald-400 block">ස්ථාපනය සම්පූර්ණයි!</strong>
                    <span className="text-[11px] text-slate-300">
                      ඔබගේ Phone එකේ Home screen එකට LankaManpower icon එක ලැබෙන අතර, එය tap කළ විට Browser address bar නොමැතිව වෙනම Native Android App එකක් ලෙස වැඩ කරයි!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TROUBLESHOOTING (Mehema enawa mokkda aula) */}
        {activeTab === 'troubleshoot' && (
          <div className="mt-4 space-y-3">
            <div
              className={`p-3.5 rounded-2xl border space-y-3 text-xs ${
                isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ඔබට මතුවිය හැකි ගැටළු සහ විසඳුම්:</span>
              </div>

              {/* Problem 1: 403 Forbidden or Sign In */}
              <div className="space-y-1 p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px]">
                <p className="font-bold text-amber-300">
                  1. &quot;403 Forbidden&quot; හෝ &quot;Sign in with Google&quot; එනවාද?
                </p>
                <p className="text-slate-300 leading-relaxed">
                  <strong>හේතුව:</strong> ඔබ විවෘත කර ඇත්තේ Private Development Link එකයි.
                  <br />
                  <strong>විසඳුම:</strong> Phone එක සඳහා පහත <strong>Shared Link</strong> එක භාවිත කරන්න:
                  <span className="block mt-1 font-mono text-[#00E5C9] select-all bg-black/50 p-1.5 rounded">
                    {publicAppUrl}
                  </span>
                </p>
              </div>

              {/* Problem 2: WhatsApp / In-app browser */}
              <div className="space-y-1 p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px]">
                <p className="font-bold text-amber-300">
                  2. &quot;Install app&quot; කියන එක මෙනුවේ පෙන්වන්නේ නැද්ද?
                </p>
                <p className="text-slate-300 leading-relaxed">
                  <strong>හේතුව:</strong> WhatsApp, Messenger හෝ Viber අභ්‍යන්තර browser එකෙන් link එක open වී ඇත.
                  <br />
                  <strong>විසඳුම:</strong> තිත් 3 ඔබා <strong>&quot;Open in Chrome&quot;</strong> (Chrome හි විවෘත කරන්න) ඔබන්න.
                </p>
              </div>

              {/* Problem 3: PWABuilder external site error */}
              <div className="space-y-1 p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px]">
                <p className="font-bold text-amber-300">
                  3. PWABuilder එකේ &quot;Failed to load site&quot; ආවාද?
                </p>
                <p className="text-slate-300 leading-relaxed">
                  <strong>විසඳුම:</strong> PWABuilder හෝ වෙනත් external site අවශ්‍ය නැත! Chrome browser එකේ තිත් 3 ඔබා කෙලින්ම <strong>&quot;Install app&quot;</strong> තේරීම පමණක් ප්‍රමාණවත්ය.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E5C9]" />
            <span>IndexedDB Offline Storage Active</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
