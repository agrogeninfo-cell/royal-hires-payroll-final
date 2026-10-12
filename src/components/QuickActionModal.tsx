import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from './NavigationTabs';
import {
  CalendarCheck,
  Users,
  Clock,
  FileText,
  Receipt,
  ShieldCheck,
  PlayCircle,
  DollarSign,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: TabType) => void;
  onOpenBackupHub: () => void;
  onOpenTests: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onOpenBackupHub,
  onOpenTests,
}) => {
  const { currentUser, attendance, theme, downloadForeverBackup } = useApp();

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSupervisor = currentUser.role === 'supervisor';

  const pendingOtCount = attendance.filter(
    (a) => a.totalOtHours > 0 && a.submissionStatus === 'submitted'
  ).length;

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-slideUp border ${
          isDark
            ? 'bg-[#0E1720] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl btn-cyan-glow flex items-center justify-center text-slate-950 font-bold">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-base text-inherit">Quick Operations</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                1-Tap shortcuts for everyday manpower operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Action Buttons List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => handleAction(() => setActiveTab('attendance'))}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/8 text-white'
                : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-[#00E5C9] flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Mark Attendance</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Record helper shifts
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </button>

          {!isSupervisor && (
            <button
              onClick={() => handleAction(() => setActiveTab('employees'))}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/8 text-white'
                : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Register Helper</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Fixed Helper role
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </button>
          )}

          {!isSupervisor && (
            <button
              onClick={() => handleAction(() => setActiveTab('overtime'))}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/8 text-white'
                  : 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold block">Approve OT</span>
                    {pendingOtCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500 text-slate-950 rounded-full">
                        {pendingOtCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Mandatory Admin authorization
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </button>
          )}

          {!isSupervisor && (
            <button
              onClick={() => handleAction(() => setActiveTab('payroll'))}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/8 text-white'
                  : 'bg-slate-50 hover:bg-teal-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Payroll &amp; Wages</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Wages, OT &amp; deductions
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </button>
          )}

          <button
            onClick={() => handleAction(onOpenBackupHub)}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
              isDark
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-[#00E5C9]/30 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#00E5C9]/20 text-[#00E5C9] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Backup Forever (.json)</span>
                <span className={`text-[10px] ${isDark ? 'text-[#00E5C9]' : 'text-emerald-700'}`}>
                  Instant 1-tap download
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => handleAction(onOpenTests)}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
              isDark
                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Run 20 System Tests</span>
                <span className={`text-[10px] ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  Rule &amp; rate verification
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => handleAction(() => setActiveTab('profile'))}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group sm:col-span-2 ${
              isDark
                ? 'bg-blue-950/30 hover:bg-blue-950/50 border-blue-500/30 text-white'
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <span className="text-sm font-bold">MD</span>
              </div>
              <div>
                <span className="text-xs font-bold block">Managing Director &amp; Developer</span>
                <span className={`text-[10px] ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Thusith Dissanayake — Royal Hires (Pvt) Ltd
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>
    </div>
  );
};
