import React, { useState, useEffect, useRef } from 'react';
import mdGraduationPhoto from '../assets/images/md-profile-graduation.jpg';
import mdExecutivePhoto from '../assets/images/md-profile-executive.jpg';
import mdFullLengthPhoto from '../assets/images/md-profile-full-length.jpg';
import { useApp } from '../context/AppContext';
import {
  Award,
  Building2,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Smartphone,
  Globe2,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  FileText,
  UserCheck,
  Factory,
  Clock,
  Coins,
  ArrowLeft,
  Camera,
  Upload,
  RotateCcw,
  Link as LinkIcon,
  HelpCircle,
  X,
  AlertCircle,
  ImageIcon,
  Palette,
  Workflow,
  Target,
  Shield,
  Zap,
  Terminal,
  Star,
  Quote,
  Share2,
  Lock,
  Flame,
  TrendingUp,
  Gem,
  Binary,
  Rocket,
  Compass,
} from 'lucide-react';
import {
  getProfilePhoto,
  saveCustomProfilePhoto,
  clearCustomProfilePhoto,
  hasCustomProfilePhoto,
  subscribeToPhotoUpdates,
} from '../utils/profilePhotoHelper';

interface ProfileViewProps {
  onBackToDashboard?: () => void;
}

type FrameTheme = 'emerald' | 'navy' | 'cyber' | 'gold';

export const ProfileView: React.FC<ProfileViewProps> = ({ onBackToDashboard }) => {
  const { currentUser, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAdmin = currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'profile' | 'architecture' | 'focus' | 'app'>('profile');
  const [frameTheme, setFrameTheme] = useState<FrameTheme>('emerald');
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<number>(0);

  // Photo management state
  const [currentPhoto, setCurrentPhoto] = useState<string>(getProfilePhoto());
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(hasCustomProfilePhoto());
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPhotoUpdates((photoUrl) => {
      setCurrentPhoto(photoUrl);
      setIsCustomPhoto(hasCustomProfilePhoto());
    });
    return unsubscribe;
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Image compressor & auto-scaler for local storage efficiency
  const processAndSaveImage = (file: File) => {
    if (!isAdmin) {
      showFeedback('MD Profile ඡායාරූපය සහ Settings වෙනස් කිරීමට අවසර ඇත්තේ Admin ට පමණි (Admin only permission)', 'error');
      return;
    }
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            saveCustomProfilePhoto(optimizedDataUrl);
            setCurrentPhoto(optimizedDataUrl);
            setIsCustomPhoto(true);
            showFeedback('ඔබගේ සැබෑ ඡායාරූපය සාර්ථකව ඇතුළත් විය! (Photo updated successfully!)');
            setIsPhotoModalOpen(false);
          }
        } catch (err) {
          console.error('Error processing image:', err);
          showFeedback('ඡායාරූපය සැකසීමේදී දෝෂයක් ඇති විය (Error processing image)', 'error');
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setIsProcessing(false);
        showFeedback('වලංගු ඡායාරූපයක් තෝරන්න (Please select a valid image file)', 'error');
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      showFeedback('ගොනුව කියවීමට නොහැකි විය (Failed to read file)', 'error');
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      showFeedback('MD Profile Settings වෙනස් කිරීමට අවසර ඇත්තේ Admin ට පමණි (Admin only)', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showFeedback('කරුණාකර Image file එකක් (JPG/PNG/WEBP) තෝරන්න', 'error');
        return;
      }
      processAndSaveImage(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedback('MD Profile Settings වෙනස් කිරීමට අවසර ඇත්තේ Admin ට පමණි (Admin only)', 'error');
      return;
    }
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          saveCustomProfilePhoto(optimizedDataUrl);
          setCurrentPhoto(optimizedDataUrl);
          setIsCustomPhoto(true);
        } else {
          saveCustomProfilePhoto(urlInput.trim());
          setCurrentPhoto(urlInput.trim());
          setIsCustomPhoto(true);
        }
        showFeedback('ඡායාරූපය සාර්ථකව සම්බන්ධ කරන ලදී! (Photo linked successfully!)');
        setUrlInput('');
        setIsPhotoModalOpen(false);
      } catch {
        saveCustomProfilePhoto(urlInput.trim());
        setCurrentPhoto(urlInput.trim());
        setIsCustomPhoto(true);
        showFeedback('ඡායාරූපය සාර්ථකව සම්බන්ධ කරන ලදී! (Photo linked successfully!)');
        setUrlInput('');
        setIsPhotoModalOpen(false);
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
      showFeedback('වලංගු Image URL එකක් ඇතුළත් කරන්න (Invalid image URL)', 'error');
    };
    img.src = urlInput.trim();
  };

  const handleResetPhoto = () => {
    if (!isAdmin) {
      showFeedback('MD Profile Settings වෙනස් කිරීමට අවසර ඇත්තේ Admin ට පමණි (Admin only)', 'error');
      return;
    }
    if (window.confirm('ඔබ ඇතුළත් කළ ඡායාරූපය ඉවත් කර මුල් ඡායාරූපයට මාරු කිරීමට අවශ්‍යද? (Reset to default image?)')) {
      clearCustomProfilePhoto();
      setCurrentPhoto(getProfilePhoto());
      setIsCustomPhoto(false);
      showFeedback('මුල් ඡායාරූපයට මාරු කරන ලදී (Reset to default)');
      setIsPhotoModalOpen(false);
    }
  };

  // Project configuration
  const appVersion = '1.0.0';
  const companyName = 'Royal Hires (Pvt) Ltd';
  const developerName = 'Thusith Dissanayake';
  const appName = 'Manpower Payroll Management System';

  // Interactive System Workflow Diagram steps designed by Thusith
  const workflowSteps = [
    {
      step: '01',
      title: 'Factory Operations & Helper Rostering',
      titleSi: 'කර්මාන්තශාලා මෙහෙයුම් හා සේවක වෙන්කිරීම',
      icon: Factory,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Workforce Deployment',
      summary: 'Dynamic multi-factory allocation with gender-aware headcount ratios and boarding hostel logistics.',
    },
    {
      step: '02',
      title: 'Two-Tier Shift & OT Verification',
      titleSi: 'ද්විත්ව අතිකාල (OT) සහ පැමිණීම තහවුරු කිරීම',
      icon: Clock,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Supervisor Audit',
      summary: 'Floor supervisor digital check-in followed by managerial threshold approval to stop ghost hours.',
    },
    {
      step: '03',
      title: 'Automated Gross & Advance Deduction',
      titleSi: 'ස්වයංක්‍රීය වැටුප් හා අත්තිකාරම් අඩුකිරීම්',
      icon: Coins,
      color: 'from-amber-500 to-orange-600',
      badge: 'Real-time Calculations',
      summary: 'Instant calculation of normal day rates, overtime multiples, meal allowances, and mid-month salary advances.',
    },
    {
      step: '04',
      title: 'Factory Invoicing & Billing Generation',
      titleSi: 'කර්මාන්තශාලා බිල්පත් හා ඉන්වොයිස් නිකුත් කිරීම',
      icon: FileText,
      color: 'from-purple-600 to-pink-600',
      badge: 'Billing & Ledger',
      summary: 'Immutable factory-specific billing rates (Male/Female/Uniform rates) with outstanding balances and receipt tracking.',
    },
    {
      step: '05',
      title: 'Offline-First Cloud Mirror & PWA/APK',
      titleSi: 'නොබැඳි (Offline) ක්‍රියාකාරීත්වය හා දත්ත ආරක්ෂාව',
      icon: ShieldCheck,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Data Resilience',
      summary: 'Local IndexedDB and browser-storage mirror for offline use on this device. This is not cloud sync; export backups regularly.',
    },
  ];

  const focusAreas = [
    {
      title: 'Manpower Operations Management',
      titleSi: 'මෑන්පවර් මෙහෙයුම් කළමනාකරණය',
      description: 'Streamlined coordination, shift rostering, and rapid helper mobilization for manufacturing facilities.',
      icon: Factory,
      stat: '500+ Helpers Supported',
      accent: 'border-blue-500/30 text-blue-400',
    },
    {
      title: 'Employee and Workforce Administration',
      titleSi: 'සේවක හා ශ්‍රම බලකා පරිපාලනය',
      description: 'Centralized helper registration, active/inactive lifecycle tracking, and boarding hostel linkages.',
      icon: UserCheck,
      stat: 'Hostel & Meal Tracking',
      accent: 'border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Attendance and Overtime Management',
      titleSi: 'පැමිණීම සහ අතිකාල (OT) කළමනාකරණය',
      description: 'Dual-tier supervisor recording and administrative OT threshold approvals with meal tracking.',
      icon: Clock,
      stat: 'Dual-Signoff Audited',
      accent: 'border-cyan-500/30 text-[#00E5C9]',
    },
    {
      title: 'Payroll Processing and Salary Reporting',
      titleSi: 'වැටුප් සැකසීම සහ වැටුප් වාර්තාකරණය',
      description: 'Automated gross calculations, meal/advance deductions, payslips, and factory billing reconciliation.',
      icon: Coins,
      stat: '100% Automated Math',
      accent: 'border-amber-500/30 text-amber-400',
    },
    {
      title: 'Factory-wise Workforce Allocation',
      titleSi: 'කර්මාන්තශාලා අනුව ශ්‍රම බලකා වෙන්කිරීම',
      description: 'Independent factory-specific billing rates (Gender-based & Standard) with immutable invoicing.',
      icon: Building2,
      stat: 'Custom Multi-Tier Rates',
      accent: 'border-indigo-500/30 text-indigo-400',
    },
    {
      title: 'Business Process Improvement',
      titleSi: 'ව්‍යාපාර ක්‍රියාවලි වැඩිදියුණු කිරීම',
      description: 'Replacing paper registers and prone-to-error spreadsheets with real-time auditability and safe data mirroring.',
      icon: Layers,
      stat: 'Paperless Automation',
      accent: 'border-purple-500/30 text-purple-400',
    },
    {
      title: 'Digital System Design and Application Development',
      titleSi: 'ඩිජිටල් පද්ධති නිර්මාණය සහ මෘදුකාංග සංවර්ධනය',
      description: 'High-performance offline-first Progressive Web Apps and Android mobile architectures crafted for field stability.',
      icon: Cpu,
      stat: 'PWA & Android Native APK',
      accent: 'border-rose-500/30 text-rose-400',
    },
  ];

  // Dynamic frame styles
  const frameStyles: Record<FrameTheme, { ring: string; glow: string; label: string }> = {
    emerald: {
      ring: 'from-[#00E5C9] via-emerald-500 to-[#0e4b5b]',
      glow: 'shadow-[#00E5C9]/25',
      label: 'Royal Emerald Glow',
    },
    navy: {
      ring: 'from-blue-500 via-indigo-600 to-slate-900',
      glow: 'shadow-blue-500/25',
      label: 'Executive Navy Titanium',
    },
    cyber: {
      ring: 'from-cyan-400 via-purple-500 to-pink-500',
      glow: 'shadow-purple-500/25',
      label: 'Cyber Architect',
    },
    gold: {
      ring: 'from-amber-400 via-yellow-500 to-amber-700',
      glow: 'shadow-amber-500/25',
      label: 'Leadership Prestige',
    },
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-16 max-w-4xl mx-auto w-full animate-fadeIn">
      {/* Hidden File Input for Native Camera/Gallery Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Status Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold transition-all border animate-slideDown ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-rose-600 text-white border-rose-400'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#111b24] border-white/10 text-[#00E5C9] hover:bg-[#162430]'
                : 'bg-white border-slate-200 text-emerald-800 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.common.back}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center space-x-2">
          {/* Quick Upload Button (Admin Only) */}
          {isAdmin ? (
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00E5C9]/15 border border-[#00E5C9]/35 text-[#00E5C9] hover:bg-[#00E5C9]/25 transition cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCustomPhoto ? 'ඡායාරූපය මාරු කරන්න' : '📸 මගේ Photo එක දමන්න'}</span>
            </button>
          ) : (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-[11px]">View Only Mode</span>
            </div>
          )}

          <span
            className={`hidden sm:inline-flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-full border ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Executive &amp; Systems Architect</span>
          </span>
        </div>
      </div>

      {/* 1. VISUAL HERO PROFILE CARD (CREATIVE EXECUTIVE DESIGN - ULTRA ATTRACTIVE) */}
      <div
        className={`rounded-3xl p-6 sm:p-9 relative overflow-hidden border transition-all duration-300 shadow-2xl ${
          isDark
            ? 'bg-gradient-to-br from-[#0b1723] via-[#07131b] to-[#041a1f] border-[#00E5C9]/20 text-white shadow-cyan-950/20'
            : 'bg-gradient-to-br from-[#f8fafc] via-white to-[#edfdf8] border-emerald-300/60 text-slate-900 shadow-emerald-900/10'
        }`}
      >
        {/* Creative Ambient Background Lights & Dynamic Glow Waves */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-[#00E5C9]/20 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-36 -mt-36 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* High-tech Isometric Vector Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #00E5C9 1.5px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Top Executive Watermark / Brand Crest */}
        <div className="absolute top-4 right-5 hidden md:flex items-center space-x-2 opacity-35 select-none pointer-events-none">
          <Gem className="w-5 h-5 text-[#00E5C9]" />
          <span className="font-mono text-xs tracking-widest font-black uppercase text-emerald-400">
            RH-EXECUTIVE-OS
          </span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-7 sm:gap-9 text-center md:text-left">
          {/* Fixed MD photo gallery: supplied photos, bundled with the app and not editable in the UI */}
          <div className="w-full md:w-[48%] shrink-0">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              {[
                { src: mdGraduationPhoto, title: 'Academic Profile', detail: 'Education & Achievement' },
                { src: mdExecutivePhoto, title: 'Executive Profile', detail: 'Managing Director' },
                { src: mdFullLengthPhoto, title: 'Founder Profile', detail: 'System Creator' },
              ].map((photo) => (
                <article key={photo.title} className={`min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl border shadow-lg ${isDark ? 'bg-slate-900/80 border-emerald-400/25' : 'bg-white border-emerald-200'}`}>
                  <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                    <img src={photo.src} alt={`Thusith Dissanayake — ${photo.title}`} className="h-full w-full object-cover object-top" loading="eager" draggable={false} />
                  </div>
                  <div className="p-2 sm:p-3 text-center">
                    <p className={`text-[10px] sm:text-xs font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{photo.title}</p>
                    <p className={`hidden sm:block text-[10px] mt-1 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{photo.detail}</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600"><Lock className="w-3 h-3" /> Fixed</div>
                  </div>
                </article>
              ))}
            </div>
            <p className={`mt-2.5 text-center text-[11px] sm:text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-emerald-500" />Official MD photos • Admin-locked</p>
          </div>

          {/* Profile Details, Designations & Creative Badges */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/35 text-emerald-300 shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Royal Hires (Pvt) Ltd</span>
                </div>

                <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-blue-500/15 to-indigo-500/10 border-blue-500/35 text-blue-300 shadow-xs">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Founder &amp; System Creator</span>
                </div>

                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border bg-purple-500/10 border-purple-500/25 text-purple-300">
                  <Binary className="w-3 h-3 text-purple-400" />
                  <span>v1.0 Production Architecture</span>
                </div>
              </div>

              {/* Prominent Name with Multi-Tone Metallic Shimmer */}
              <div className="relative">
                <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-sm ${isDark ? "bg-gradient-to-r from-white via-slate-100 to-[#00E5C9] bg-clip-text text-transparent" : "text-emerald-900"}`}>
                  {developerName}
                </h1>
                <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-400/80 mt-1">
                  Managing Director &bull; Systems Architect &bull; Tech Visionary
                </p>
              </div>

              {/* Dual Designation Badges with High Visual Contrast */}
              <div className="flex flex-col sm:flex-row items-center md:items-start gap-2.5 pt-1.5">
                <div
                  className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center space-x-2.5 shadow-md transition hover:scale-101 ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-950/80 to-indigo-950/70 border-blue-500/40 text-blue-100 shadow-blue-950/40'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-950'
                  }`}
                >
                  <Award className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Managing Director — Royal Hires (Pvt) Ltd</span>
                </div>

                <div
                  className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center space-x-2.5 shadow-md transition hover:scale-101 ${
                    isDark
                      ? 'bg-gradient-to-r from-emerald-950/80 to-[#042828]/70 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                      : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-[#00E5C9] shrink-0" />
                  <span>App Developer &amp; System Designer</span>
                </div>
              </div>
            </div>

            {/* Application Tag */}
            <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Developer and system designer of the{' '}
              <span className="font-extrabold text-emerald-400 dark:text-[#00E5C9] underline decoration-emerald-500/40 underline-offset-4">
                {appName}
              </span>
            </p>

            {/* Creative Luxury Glassy Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div
                className={`p-3.5 rounded-2xl border transition hover:translate-y-[-2px] ${
                  isDark
                    ? 'bg-gradient-to-b from-white/8 to-white/3 border-white/12 shadow-sm'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  <span>Company</span>
                </div>
                <div className="text-xs sm:text-sm font-black mt-1 truncate text-slate-900 dark:text-white">
                  Royal Hires
                </div>
                <div className="text-[10px] font-medium text-emerald-400/90 truncate">
                  Registered (Pvt) Ltd
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition hover:translate-y-[-2px] ${
                  isDark
                    ? 'bg-gradient-to-b from-white/8 to-white/3 border-white/12 shadow-sm'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Smartphone className="w-3 h-3 text-blue-400" />
                  <span>Platform</span>
                </div>
                <div className="text-xs sm:text-sm font-black mt-1 flex items-center space-x-1 text-slate-900 dark:text-white">
                  <span>Android &bull; PWA</span>
                </div>
                <div className="text-[10px] font-medium text-blue-400/90 truncate">
                  Mobile Responsive
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition hover:translate-y-[-2px] ${
                  isDark
                    ? 'bg-gradient-to-b from-white/8 to-white/3 border-white/12 shadow-sm'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Globe2 className="w-3 h-3 text-purple-400" />
                  <span>Languages</span>
                </div>
                <div className="text-xs sm:text-sm font-black mt-1 flex items-center space-x-1 text-slate-900 dark:text-white">
                  <span>සිංහල / English</span>
                </div>
                <div className="text-[10px] font-medium text-purple-400/90 truncate">
                  Bilingual Support
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition hover:translate-y-[-2px] ${
                  isDark
                    ? 'bg-gradient-to-b from-white/8 to-white/3 border-white/12 shadow-sm'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Cpu className="w-3 h-3 text-[#00E5C9]" />
                  <span>Architecture</span>
                </div>
                <div className="text-xs sm:text-sm font-black mt-1 flex items-center space-x-1 text-[#00E5C9]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Offline First</span>
                </div>
                <div className="text-[10px] font-medium text-emerald-400/90 truncate">
                  IndexedDB Engine
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK REAL-PHOTO UPLOAD GUIDE CALLOUT (ADMIN ONLY) */}
      {isAdmin && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isDark
              ? 'bg-blue-950/25 border-blue-500/25 text-blue-200'
              : 'bg-blue-50/70 border-blue-200 text-blue-950'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  ඔබගේ සැබෑ ඡායාරූපය (Real Photo) යොදන්නේ කෙසේද?
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Admin Control
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                ඉහත ඇති ඡායාරූපය මත හෝ <strong className="text-[#00E5C9] font-bold">"Upload Real Photo"</strong> බොත්තම ඔබා ඔබගේ phone gallery එකෙන් හෝ පරිගණකයෙන් ඔබගේ සැබෑ photo එක තෝරන්න. එය වහාම App එක පුරා ස්ථිරව සුරැකේ.
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-[#00E5C9] hover:bg-emerald-400 text-slate-950 transition cursor-pointer flex items-center space-x-1.5 shadow-md"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Real Photo</span>
          </button>
        </div>
      )}

      {/* CREATIVE VISUAL TABS NAVIGATION (HOLOGRAPHIC DOCK) */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-2xl border transition-all shadow-lg ${
          isDark
            ? 'bg-slate-950/70 border-white/10 backdrop-blur-xl shadow-black/40'
            : 'bg-white/80 border-slate-200 backdrop-blur-xl shadow-slate-200/50'
        }`}
      >
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-[#00E5C9] to-emerald-400 text-slate-950 shadow-md shadow-[#00E5C9]/30 scale-[1.02]'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span className="truncate">Professional Bio</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-gradient-to-r from-[#00E5C9] to-emerald-400 text-slate-950 shadow-md shadow-[#00E5C9]/30 scale-[1.02]'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Workflow className="w-4 h-4 shrink-0" />
          <span className="truncate">System Flowchart</span>
        </button>

        <button
          onClick={() => setActiveTab('focus')}
          className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'focus'
              ? 'bg-gradient-to-r from-[#00E5C9] to-emerald-400 text-slate-950 shadow-md shadow-[#00E5C9]/30 scale-[1.02]'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="truncate">Areas of Focus</span>
        </button>

        <button
          onClick={() => setActiveTab('app')}
          className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'app'
              ? 'bg-gradient-to-r from-[#00E5C9] to-emerald-400 text-slate-950 shadow-md shadow-[#00E5C9]/30 scale-[1.02]'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span className="truncate">About This App</span>
        </button>
      </div>

      {/* 2. TAB CONTENT: PROFESSIONAL BIOGRAPHY & LEADERSHIP VISION */}
      {activeTab === 'profile' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Executive Biography Card */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#0c1824] via-[#09131c] to-[#081820] border-white/10 text-white'
                : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00E5C9] to-emerald-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-[#00E5C9]/25">
                  <Briefcase className="w-6 h-6 fill-slate-950/20" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Executive &amp; Technical Biography</h2>
                  <p className="text-xs text-slate-400">Leadership &bull; Digital System Architecture &bull; Operational Integrity</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified MD &amp; Creator</span>
              </div>
            </div>

            {/* Quote Visual Strip */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#00E5C9]/10 to-transparent border-l-4 border-[#00E5C9] flex items-start space-x-3">
              <Quote className="w-5 h-5 text-[#00E5C9] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold italic text-slate-200 dark:text-slate-200 leading-relaxed">
                "Combining business leadership with practical software development to digitize and elevate workforce operations across Sri Lankan industries."
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Thusith Dissanayake is the Managing Director of Royal Hires (Pvt) Ltd and the developer and system designer of the Manpower Payroll Management System.
              </p>

              <p>
                Combining business leadership with practical software development, he focuses on creating digital solutions for manpower operations, employee administration, attendance management, payroll processing and business reporting.
              </p>

              <p>
                The Manpower Payroll Management System is designed to organize workforce records, support payroll calculations, manage factory-wise operations and improve the efficiency of manpower administration.
              </p>
            </div>

            {/* Strategic Pillars Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-950/30 shadow-sm'
                    : 'bg-blue-50/70 border-blue-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Business Leadership</span>
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Strategic governance, compliance with factory labor standards, client trust, and workforce welfare.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-950/30 shadow-sm'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#00E5C9] flex items-center justify-center mb-2.5">
                  <Terminal className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Software Architecture</span>
                  <Code2 className="w-3.5 h-3.5 text-[#00E5C9]" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  End-to-end design of payroll algorithms, ledger integrity, offline mirrors, and native mobile apps.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-950/30 shadow-sm'
                    : 'bg-purple-50/70 border-purple-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Workforce Operations</span>
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Fair helper compensation, rapid boarding hostel allocation, and transparent client factory billing.
                </p>
              </div>
            </div>
          </div>

          {/* Bilingual Sinhala Synopsis with Creative Banner */}
          <div
            className={`rounded-3xl p-6 sm:p-7 border relative overflow-hidden shadow-lg transition duration-300 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/40 via-[#062426]/60 to-[#0c1822] border-emerald-500/35 text-emerald-100 shadow-emerald-950/20'
                : 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border-emerald-200 text-emerald-950 shadow-emerald-600/5'
            }`}
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Globe2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-emerald-300">
                  නිල සිංහල මාධ්‍ය හැඳින්වීම (Official Sinhala Synopsis)
                </h3>
                <p className="text-[10px] text-emerald-400/80 font-semibold">Managing Director &bull; Developer &bull; System Designer</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-95 font-medium pl-1 text-slate-100 dark:text-slate-200">
              තුසිත් දිසානායක මහතා Royal Hires (Pvt) Ltd ආයතනයේ කළමනාකාර අධ්‍යක්ෂවරයා වන අතර, Manpower Payroll Management System මෘදුකාංගයේ සංවර්ධකයා හා පද්ධති නිර්මාණකරු (System Designer) ද වේ. ව්‍යාපාර නායකත්වය සහ ප්‍රායෝගික මෘදුකාංග සංවර්ධනය ඒකාබද්ධ කරමින්, කර්මාන්තශාලා ශ්‍රම බලකා මෙහෙයුම්, පැමිණීම, වැටුප් ගණනය හා ආයතනික බිල්පත් කටයුතු වඩාත් කාර්යක්ෂම හා ඩිජිටල්කරණය කිරීම ඔහුගේ මූලික ඉලක්කයයි.
            </p>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: CREATIVE SYSTEM FLOWCHART (SYSTEM DESIGNED BY THUSITH) */}
      {activeTab === 'architecture' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className={`rounded-3xl p-6 sm:p-7 border ${
              isDark ? 'bg-[#0E1720] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00E5C9]/10 text-[#00E5C9] flex items-center justify-center">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold">System Architecture &amp; Operational Flow</h2>
                  <p className="text-xs text-slate-400">Designed &amp; Engineered by Thusith Dissanayake</p>
                </div>
              </div>

              <span className="hidden sm:inline-block text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                5-Stage Engine
              </span>
            </div>

            {/* Interactive Flow Stepper */}
            <div className="space-y-3">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                const isSelected = selectedWorkflowStep === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedWorkflowStep(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#12232c] border-[#00E5C9] shadow-lg shadow-[#00E5C9]/10 scale-[1.01]'
                          : 'bg-emerald-50 border-emerald-500 shadow-md scale-[1.01]'
                        : isDark
                        ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center space-x-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-tr ${step.color} shadow-sm`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold text-[#00E5C9]">
                              STAGE {step.step}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white/10 text-slate-300">
                              {step.badge}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {step.title}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {step.titleSi}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 shrink-0 transition-transform ${
                          isSelected ? 'rotate-90 text-[#00E5C9]' : 'text-slate-500'
                        }`}
                      />
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs leading-relaxed text-slate-300 pl-1">
                        <p>{step.summary}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: AREAS OF FOCUS */}
      {activeTab === 'focus' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {focusAreas.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                    isDark
                      ? 'bg-[#0E1720] border-white/10 hover:border-[#00E5C9]/40'
                      : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`p-3 rounded-2xl shrink-0 border ${
                        isDark ? 'bg-white/5' : 'bg-slate-50'
                      } ${item.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-500 dark:text-[#00E5C9]">
                        {item.titleSi}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug pt-1">
                        {item.description}
                      </p>
                      <div className="pt-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                          {item.stat}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: ABOUT THIS APPLICATION */}
      {activeTab === 'app' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className={`rounded-3xl p-6 sm:p-7 border ${
              isDark ? 'bg-[#0E1720] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#00E5C9] flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Application Specifications</h2>
                <p className="text-xs text-slate-400">Project configuration and verified architecture parameters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Application Name
                </div>
                <div className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">
                  {appName}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Application Version
                </div>
                <div className="text-sm font-mono font-extrabold mt-1 text-emerald-600 dark:text-[#00E5C9]">
                  v{appVersion} (Production Build)
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Platform
                </div>
                <div className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Android (Progressive Web App &amp; TWA Compatible)</span>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Languages
                </div>
                <div className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">
                  Sinhala (සිංහල) &amp; English
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Developer &amp; System Designer
                </div>
                <div className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">
                  {developerName}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Operating Company
                </div>
                <div className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">
                  {companyName}
                </div>
              </div>
            </div>

            {/* Architecture Statement */}
            <div
              className={`mt-5 p-4 rounded-2xl border ${
                isDark ? 'bg-blue-950/20 border-blue-500/20 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Enterprise Grade Operational Standards</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                Engineered with dual-layer storage resilience (Browser IndexedDB + localStorage auto-mirroring), offline-first capabilities, and localized for factory environments across Sri Lanka.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO UPLOAD / CHANGE MODAL (ADMIN ONLY) */}
      {isPhotoModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative ${
              isDark ? 'bg-[#0E1720] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00E5C9] to-emerald-600 flex items-center justify-center text-slate-950">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">ඔබගේ සැබෑ ඡායාරූපය යොදන්න</h3>
                <p className="text-xs text-slate-400">Upload Thusith Dissanayake's Profile Photo / සැබෑ ඡායාරූපය තෝරන්න</p>
              </div>
            </div>

            {/* Current Photo Preview in Frame */}
            <div className="flex items-center justify-center my-4">
              <div className="relative">
                <div
                  className={`w-28 h-28 rounded-full p-1 bg-gradient-to-tr ${frameStyles[frameTheme].ring} shadow-xl`}
                >
                  <img
                    src={currentPhoto}
                    alt="Current Profile Preview"
                    className="w-full h-full rounded-full object-cover object-top"
                  />
                </div>
                {isCustomPhoto && (
                  <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    Custom Photo Active
                  </span>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs leading-relaxed space-y-1">
              <p className="font-bold text-blue-300">
                📌 දුරකථනයෙන් හෝ පරිගණකයෙන් තෝරන්න:
              </p>
              <p className="text-[11px] opacity-90">
                පහත ඇති "දුරකථනයෙන්/Gallery එකෙන් තෝරන්න" බොත්තම ඔබා ඔබගේ phone gallery එකෙන් හෝ පරිගණකයෙන් ඔබගේ සැබෑ ඡායාරූපය තෝරන්න. එය වහාම App එකෙහි සහ Dashboard එකෙහි ස්ථිරව සුරැකේ.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Option 1: File Upload */}
              <button
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5C9] to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isProcessing ? 'සැකසෙමින් පවතී (Processing...)' : 'දුරකථනයෙන්/Gallery එකෙන් තෝරන්න (Select Photo)'}
                </span>
              </button>

              {/* Option 2: Image URL */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center space-x-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>හෝ Online Photo Link (Image URL) එකක් ඇතුළත් කරන්න:</span>
                </div>
                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/my-photo.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none focus:border-[#00E5C9] ${
                      isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!urlInput.trim() || isProcessing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-50 transition cursor-pointer"
                  >
                    Save
                  </button>
                </form>
              </div>

              {/* Option 3: Reset */}
              {isCustomPhoto && (
                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPhoto}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center space-x-1.5 cursor-pointer py-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>මුල් ඡායාරූපයට Reset කරන්න</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
