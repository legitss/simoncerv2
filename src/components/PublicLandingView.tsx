import React, { useState } from 'react';
import { InspectionSession, UserRole } from '../types';
import { 
  ShieldCheck, 
  Upload, 
  Search, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  Clock, 
  FileText, 
  UserCheck, 
  Home, 
  ArrowRight, 
  ExternalLink,
  Info,
  Building2, 
  Calendar, 
  AlertCircle, 
  HelpCircle, 
  Award,
  ChevronDown,
  Sparkles,
  Calculator,
  Lock,
  Send,
  Eye,
  Check,
  Zap,
  Layers,
  ArrowUpRight,
  Users,
  Table
} from 'lucide-react';
import { calculateRemainingDays, formatIndonesianDate, getStatusBadgeConfig, addBusinessDays } from '../utils/date';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';

interface PublicLandingViewProps {
  inspections: InspectionSession[];
  onOpenLoginModal: () => void;
  onOpenSubmitCapa: (inspection?: InspectionSession) => void;
  onOpenTrackingModal: (initialCode?: string) => void;
  onSelectInspection: (inspection: InspectionSession) => void;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  inspections,
  onOpenLoginModal,
  onOpenSubmitCapa,
  onOpenTrackingModal,
  onSelectInspection,
  currentRole = 'SARANA',
  onRoleChange,
}) => {
  const [trackQuery, setTrackQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [foundInspection, setFoundInspection] = useState<InspectionSession | null>(null);

  // Dynamic interactive tab on landing page: 'TRACKING' | 'REGULATIONS' | 'SLA_CALCULATOR' | 'FAQ'
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'REGULATIONS' | 'SLA_CALCULATOR' | 'FAQ'>('TRACKING');

  // Interactive SLA Calculator state
  const [calcDate, setCalcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calcDays, setCalcDays] = useState<number>(14);

  // FAQ Accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setFoundInspection(null);

    const query = trackQuery.trim().toLowerCase();
    if (!query) {
      setSearchError('Silakan masukkan Kode CAPA atau Nomor Surat SRIKANDI!');
      return;
    }

    const matched = inspections.find(
      (ins) =>
        ins.capaCode.toLowerCase().includes(query) ||
        ins.srikandiLetter.letterNo.toLowerCase().includes(query) ||
        ins.facility.name.toLowerCase().includes(query) ||
        ins.facility.licenseNo.toLowerCase().includes(query)
    );

    if (matched) {
      setFoundInspection(matched);
    } else {
      setSearchError(`Data pemeriksaan dengan kata kunci "${trackQuery}" tidak ditemukan. Pastikan kode unik sesuai pada surat tindak lanjut.`);
    }
  };

  const handleQuickSampleClick = (code: string) => {
    setTrackQuery(code);
    const matched = inspections.find((i) => i.capaCode === code);
    if (matched) {
      setFoundInspection(matched);
      setSearchError('');
    }
  };

  const handleOpenWhatsAppHelpdesk = () => {
    window.open(
      'https://wa.me/6281277889911?text=Halo%20Admin%20SIMONCER%20BBPOM%20Semarang,%20saya%20ingin%20berkonsultasi%20terkait%20tindak%20lanjut%20CAPA',
      '_blank'
    );
  };

  // SLA Calculation result using Hari Kerja (Business Days - Standar BBPOM Semarang)
  const calculatedDeadline = (() => {
    try {
      return addBusinessDays(calcDate, calcDays);
    } catch {
      return '';
    }
  })();

  const faqItems = [
    {
      q: 'Mengapa sarana wajib mengisi Survei Integritas Petugas (SIBERGAS) sebelum mengirim CAPA?',
      a: 'Sebagai komitmen Zona Integritas Wilayah Bebas dari Korupsi (WBK) dan WBBM di lingkungan Balai Besar POM di Semarang, setiap sarana diwajibkan memberikan penilaian obyektif atas profesionalisme dan integritas petugas pengawas saat pemeriksaan fisik. Survei ini bersifat rahasia dan wajib diisi sebelum dokumen CAPA pertama kali diserahkan.',
    },
    {
      q: 'Apakah pada pengiriman perbaikan CAPA kedua survei SIBERGAS muncul kembali?',
      a: 'Tidak. Survei SIBERGAS hanya diwajibkan satu kali pada saat sarana pertama kali menyerahkan dokumen tindak lanjut (CAPA 1). Jika evaluator meminta perbaikan lanjutan (CAPA 2), sarana dapat langsung mengunggah berkas revisi tanpa perlu mengisi survei lagi.',
    },
    {
      q: 'Bagaimana cara memverifikasi keaslian Surat Tindak Lanjut SRIKANDI (TTE)?',
      a: 'Surat resmi yang diunggah di SIMONCER telah ditandatangani secara elektronik (TTE) tersertifikasi Balai Sertifikasi Elektronik (BSrE - BSSN). Anda dapat memindai QR Code TTE yang tertera pada lembar surat untuk langsung memeriksa keabsahan sertifikat digital Kepala Balai.',
    },
    {
      q: 'Berapa lama batas waktu penyelesaian tindak lanjut CAPA?',
      a: 'Sesuai standar operasional BBPOM di Semarang, sarana memiliki waktu maksimal 14 hari kerja (tidak termasuk akhir pekan & libur nasional) terhitung sejak tanggal pertama kali sarana menerima surat tindak lanjut untuk menyusun RCA (Root Cause Analysis), tindakan perbaikan (CAP), dan tindakan pencegahan (PAP) beserta bukti lampirannya.',
    },
    {
      q: 'Apakah pengiriman CAPA memerlukan pembuatan akun atau pendaftaran login khusus sarana?',
      a: 'Tidak perlu. Sarana dapat langsung melakukan pelacakan dan pengunggahan CAPA secara mandiri hanya dengan memasukkan Kode Unik CAPA yang tertera pada surat atau notifikasi WhatsApp/Email resmi yang diterima.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030d1a] via-[#061c2d] to-[#020912] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950">
      
      {/* Dynamic Animated Ambient Aurora Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Floating Orb 1: Emerald (Top Left) */}
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-transparent rounded-full blur-[120px] animate-aurora-drift"></div>
        {/* Floating Orb 2: Cyan & Sky (Top Right) */}
        <div className="absolute top-12 -right-28 w-[580px] h-[580px] bg-gradient-to-bl from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-[130px] animate-float-reverse"></div>
        {/* Floating Orb 3: Mint Pulse (Center/Bottom) */}
        <div className="absolute top-[45%] left-[25%] w-[420px] h-[420px] bg-emerald-400/10 rounded-full blur-[110px] animate-pulse-glow-slow"></div>
        {/* Subtle Precision Grid Mesh */}
        <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      {/* Simulation Role Selector Bar (for seamless testing between Sarana and Petugas roles) */}
      {onRoleChange && (
        <div className="bg-[#020a14]/90 backdrop-blur-md border-b border-cyan-500/30 text-slate-200 text-xs py-2 px-4 sticky top-0 z-50 shadow-md relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-bold text-white text-xs">
                Simulasi Peran Aktif: <span className="text-cyan-300">🏢 Mode Portal Sarana (Pelaku Usaha)</span>
              </span>
              <span className="text-[10px] bg-cyan-950/90 text-cyan-200 px-2.5 py-0.5 rounded-full border border-cyan-500/40 hidden sm:inline-block font-mono">
                Terkunci: Tanpa Akses Evaluasi Petugas
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] mr-1">Beralih Simulasi:</span>
              <button
                type="button"
                onClick={() => onRoleChange('PETUGAS_EVALUATOR')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="Beralih ke Petugas / Evaluator CAPA"
              >
                <span>👨‍🔬 Petugas / Evaluator</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleChange('SUPERVISOR')}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="Beralih ke Supervisor (Kepala Balai)"
              >
                <span>🎖️ Supervisor</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleChange('ADMIN')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="Beralih ke Administrator Balai"
              >
                <span>👨‍💼 Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER BAR */}
      <header className="bg-[#051424]/85 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 shadow-xl transition-all relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo: CAPA BPOM & Subtitle with Pulsing Ring */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0 border border-emerald-400/40 relative">
                <span className="absolute -inset-0.5 rounded-xl bg-emerald-400/30 blur-xs animate-pulse-ring pointer-events-none"></span>
                <img
                  src="/assets/aistudio/logo-simoncer_467003a7.webp"
                  alt="Logo SIMONCER"
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                    CAPA
                  </span>
                  <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    BPOM
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 ml-1.5 hidden sm:inline-block">
                    SIMONCER v2.4 Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium tracking-wide">
                  Balai Besar Pengawas Obat dan Makanan di Semarang
                </p>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-850/60"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Beranda</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppHelpdesk}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-emerald-950/50 border border-emerald-500/40 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Helpdesk WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-800 hover:to-slate-850 border border-emerald-500/50 hover:border-emerald-400 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-emerald-500/20"
                title="Login khusus Petugas, Evaluator, dan Supervisor Balai"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portal Petugas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Decorative Gradient Line with moving shimmer */}
      <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-300 to-cyan-500 w-full opacity-90 relative z-20"></div>

      {/* 2. DYNAMIC LIVE TICKER / METRICS BAR */}
      <div className="bg-gradient-to-r from-[#020a14] via-[#07192a] to-[#020a14] border-b border-emerald-500/20 py-2.5 px-4 text-xs text-slate-300 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Zona Integritas (WBK/WBBM)
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Survei SIBERGAS Anti-Gratifikasi
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              TTE Resmi BSrE BSSN
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-300 hidden md:inline flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              SLA Responsif 14 Hari Kerja
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Standar Pelayanan Publik BBPOM Semarang</span>
          </div>
        </div>
      </div>

      {/* 3. HERO SECTION WITH MODERN DYNAMIC GRID */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-500/20 bg-gradient-to-b from-[#06182a]/80 via-[#071f35]/60 to-[#030d1a]">
        
        {/* Glow ambient background elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px]"></div>
        <div className="absolute top-10 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          
          {/* NOTICE BANNER & FLOATING BADGES */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="max-w-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-cyan-950/70 backdrop-blur-xl border border-emerald-400/40 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-xl text-xs text-slate-200 shadow-emerald-950/30">
              <div className="p-1.5 rounded-xl bg-emerald-500/25 text-emerald-300 shrink-0 mt-0.5 border border-emerald-400/40 shadow-xs animate-pulse">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <strong className="text-white font-bold block flex items-center gap-2">
                  <span>PEMBERITAHUAN RESMI SARANA / PELAKU USAHA:</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </strong>
                <p className="leading-relaxed text-slate-200">
                  Penyerahan dokumen Corrective and Preventive Action (CAPA) dilakukan mandiri{' '}
                  <span className="text-emerald-300 font-bold underline underline-offset-2">tanpa perlu membuat akun/registrasi</span>. 
                  Cukup gunakan <strong className="text-white">Kode Unik CAPA</strong> dari Surat Tindak Lanjut SRIKANDI (TTE) Anda.
                </p>
              </div>
            </div>

            {/* Dynamic Floating Pill Badges (Moving Animations) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 text-xs font-semibold shadow-lg backdrop-blur-md animate-float-gentle">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>TTE BSrE BSSN Sah</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-semibold shadow-lg backdrop-blur-md animate-float-reverse">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>SLA: 14 Hari Kerja</span>
              </div>
            </div>
          </div>

          {/* MAIN HERO GRID: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: SIMONCER Headline & DYNAMIC PELACAKAN STATUS CAPA FORM */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Brand Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-2xl shadow-emerald-500/30 flex items-center justify-center shrink-0 border border-emerald-400/40 relative group">
                  <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-40 blur-xs group-hover:opacity-75 transition-opacity pointer-events-none animate-pulse"></span>
                  <img
                    src="/assets/aistudio/logo-simoncer_467003a7.webp"
                    alt="SIMONCER"
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>

                <div>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                    <span className="bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent">
                      SIMONCER
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono shadow-xs">
                      BBPOM
                    </span>
                  </h1>
                  <h2 className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight mt-0.5">
                    Sistem Monitoring & Evaluasi CAPA Terintegrasi
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Bagi Pelaku Usaha / Sarana yang telah menerima <strong className="text-white">Surat Tindak Lanjut Hasil Pemeriksaan</strong> dari Balai Besar POM di Semarang, silakan lacak status atau serahkan perbaikan CAPA Anda dengan memasukkan kode unik pada form di bawah.
              </p>

              {/* DYNAMIC FORM PELACAKAN STATUS CAPA (Radiant Gradient & Glow) */}
              <div className="p-5 sm:p-7 bg-gradient-to-br from-[#061d33]/95 via-[#082944]/90 to-[#051829]/95 backdrop-blur-2xl rounded-3xl border border-emerald-400/45 shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)] space-y-5 relative overflow-hidden group">
                {/* Top Radiant Shimmer Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-300 to-cyan-400 opacity-80"></div>
                {/* Ambient Internal Glow */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>

                <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shadow-xs">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        Form Pelacakan Status & Verifikasi CAPA
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        Ketikkan Kode Unik CAPA atau Nomor Surat SRIKANDI
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hidden sm:inline-flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Pencarian Real-Time</span>
                  </span>
                </div>

                {/* Form Input */}
                <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={trackQuery}
                      onChange={(e) => {
                        setTrackQuery(e.target.value);
                        if (searchError) setSearchError('');
                      }}
                      placeholder="Masukkan Kode CAPA (cth: CAPA-2026-SRN01)..."
                      className="w-full pl-10 pr-3 py-3 bg-[#030e1a]/95 border border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden transition-all font-mono shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
                  >
                    <span>Lacak Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Sample Code Chips */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Contoh Kode:</span>
                  {inspections.slice(0, 4).map((ins) => (
                    <button
                      key={ins.id}
                      type="button"
                      onClick={() => handleQuickSampleClick(ins.capaCode)}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        foundInspection?.id === ins.id
                          ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-emerald-400/50'
                      }`}
                    >
                      {ins.capaCode}
                    </button>
                  ))}
                </div>

                {/* Error Banner */}
                {searchError && (
                  <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in shadow-md">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* SEARCH RESULT DIRECT CARD (With SIBERGAS Requirement Enforcement) */}
                {foundInspection && (
                  <div className="p-4 sm:p-5 bg-[#030e1a]/95 border border-emerald-400/60 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {foundInspection.capaCode}
                          </span>
                          <span className="text-xs text-slate-400">
                            {foundInspection.facility.type}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-base text-white mt-1">
                          {foundInspection.facility.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Penanggung Jawab: {foundInspection.facility.picName} ({foundInspection.facility.picPhone})
                        </p>
                      </div>

                      {(() => {
                        const badge = getStatusBadgeConfig(foundInspection.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border} self-start sm:self-center shadow-xs`}>
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                      <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Surat SRIKANDI (TTE):</span>
                        <span className="font-mono font-semibold text-slate-200 text-[11px]">
                          {foundInspection.srikandiLetter.letterNo}
                        </span>
                      </div>

                      <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Sisa Batas Waktu (SLA):</span>
                        {(() => {
                          const sla = calculateRemainingDays(foundInspection.srikandiLetter.deadlineDate);
                          return (
                            <span className={`font-bold text-[11px] ${sla.isOverdue ? 'text-red-400' : 'text-amber-300'}`}>
                              {sla.text} (Batas: {formatIndonesianDate(foundInspection.srikandiLetter.deadlineDate)})
                            </span>
                          );
                        })()}
                      </div>

                      <div className="sm:col-span-2 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Petugas Evaluator PIC:</span>
                        <span className="text-slate-200 font-medium text-[11px]">
                          {foundInspection.assignedOfficer?.name || foundInspection.leadAuditor}
                        </span>
                      </div>
                    </div>

                    {/* Commodity Matrix Tailoring Info */}
                    {(() => {
                      const matrixCfg = getCommodityMatrixConfig(
                        foundInspection.facility.type,
                        foundInspection.facility.name,
                        foundInspection.inspectionScope
                      );
                      return (
                        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Table className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-slate-300">
                              Format Dokumen: <strong className="text-white">{matrixCfg.title}</strong> ({matrixCfg.codeStandard})
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
                            Tampilan Halaman Penuh (Bukan Pop-up)
                          </span>
                        </div>
                      );
                    })()}

                    {/* CRITICAL USER REQUIREMENT: ENFORCE SIBERGAS SURVEY FIRST IF CAPA 1 NOT FILLED */}
                    {foundInspection.sibergasSurvey?.completed ? (
                      /* Survey already completed (CAPA 2 or already filled) */
                      <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-xs">
                            Survei Integritas SIBERGAS telah selesai diisi
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          Tercatat di Audit Log
                        </span>
                      </div>
                    ) : (
                      /* First time submitting CAPA: Survey MUST be filled first! */
                      <div className="p-3.5 bg-amber-950/70 border border-amber-500/50 rounded-xl space-y-2 text-xs text-amber-200">
                        <div className="flex items-center gap-2 font-bold text-amber-300">
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Prasyarat Wajib Sebelum Mengisi Matriks CAPA:</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Sarana Anda <strong>belum mengisi Survei Integritas Petugas (SIBERGAS)</strong>. Sesuai ketentuan Zona Integritas (WBK/WBBM), sebelum membuka formulir dan dokumen matriks CAPA, Anda <strong>wajib mengisi 7 butir kuesioner SIBERGAS terlebih dahulu</strong>.
                        </p>
                      </div>
                    )}

                    {/* Status banner when CAPA is already submitted */}
                    {(foundInspection.status === 'CAPA_TERKIRIM' || foundInspection.status === 'MASIH_EVALUASI') && (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>CAPA Sudah Dikirim ke Balai.</strong> Berkas Anda telah diterima sistem dan sedang dalam antrean evaluasi petugas.
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-300 font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          Menunggu Evaluasi
                        </span>
                      </div>
                    )}

                    {/* Result Card Actions: Direct to Full Page View (Bukan Pop-up) */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => onOpenTrackingModal(foundInspection.capaCode)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lihat Alur & Timeline Lengkap</span>
                      </button>

                      {(() => {
                        const isSubmitted =
                          foundInspection.status === 'CAPA_TERKIRIM' ||
                          foundInspection.status === 'MASIH_EVALUASI' ||
                          foundInspection.status === 'TERVALIDASI' ||
                          foundInspection.status === 'SELESAI_CLOSED';
                        const isRevision = foundInspection.status === 'PERLU_PERBAIKAN';

                        if (isSubmitted) {
                          return (
                            <button
                              type="button"
                              onClick={() => onOpenSubmitCapa(foundInspection)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>Lihat Matriks CAPA Terkirim (Halaman Penuh) →</span>
                            </button>
                          );
                        }

                        if (isRevision) {
                          return (
                            <button
                              type="button"
                              onClick={() => onOpenSubmitCapa(foundInspection)}
                              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                            >
                              <Table className="w-4 h-4" />
                              <span>Perbaiki Matriks CAPA (Permintaan Balai) →</span>
                            </button>
                          );
                        }

                        if (foundInspection.sibergasSurvey?.completed) {
                          return (
                            <button
                              type="button"
                              onClick={() => onOpenSubmitCapa(foundInspection)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                            >
                              <Table className="w-4 h-4" />
                              <span>Buka & Isi Matriks CAPA (Halaman Penuh) →</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => onOpenSubmitCapa(foundInspection)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <ShieldCheck className="w-4 h-4 text-slate-950" />
                            <span>Isi Survei SIBERGAS & Buka Matriks CAPA →</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ALUR PENGIRIMAN MANDIRI WITH ANIMATED MOVING LIGHT TRACK */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
              
              <div className="bg-gradient-to-b from-[#082238]/95 via-[#06192a]/95 to-[#04111d]/95 backdrop-blur-2xl border border-emerald-500/35 rounded-3xl p-6 sm:p-7 shadow-[0_12px_45px_rgba(4,16,28,0.7)] space-y-5 relative overflow-hidden group">
                
                {/* Ambient Moving Glow in Card */}
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/20 transition-all duration-700"></div>
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* Header Window Card */}
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/90 shadow-xs shadow-rose-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-xs shadow-amber-400/40"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-xs shadow-emerald-500/40"></div>
                    <span className="text-xs text-white font-bold ml-2">Alur Pengiriman Mandiri</span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Panduan Alur Resmi
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ikuti 3 tahapan standar penyerahan laporan perbaikan CAPA bagi sarana binaan BBPOM Semarang:
                </p>

                {/* Vertical Stepper: With Animated Moving Light Pulse Beam */}
                <div className="space-y-3.5 relative">
                  {/* Glowing Vertical Connector Track */}
                  <div className="absolute left-5 top-7 bottom-7 w-0.5 bg-gradient-to-b from-emerald-400 via-teal-300 to-cyan-500/40"></div>
                  {/* Animated Moving Light Pulse Beam */}
                  <div className="absolute left-[18.5px] top-6 w-1 h-8 bg-white/90 rounded-full blur-[1px] animate-pulse"></div>
                  
                  {/* Step 1: Terima Surat SRIKANDI (TTE) */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850/90 border border-emerald-500/30 hover:border-emerald-400/60 flex items-start gap-3.5 cursor-default transition-all duration-300 hover:translate-x-1 shadow-sm relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/40 font-black text-sm z-10 shadow-xs">
                      01
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Terima Surat SRIKANDI (TTE BSrE)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Sarana menerima surat hasil pemeriksaan resmi dan <strong className="text-emerald-300">Kode Unik CAPA</strong> via notifikasi WhatsApp & Email resmi BBPOM Semarang.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Wajib Isi Survei Integritas Petugas (SIBERGAS) */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850/90 border border-amber-500/30 hover:border-amber-400/60 flex items-start gap-3.5 cursor-default transition-all duration-300 hover:translate-x-1 shadow-sm relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40 font-black text-sm z-10 shadow-xs">
                      02
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Isi Survei Integritas SIBERGAS
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Wajib mengisi 7 pertanyaan evaluasi integritas petugas sebelum mengirimkan CAPA pertama. Jika sudah mengisi, survei tidak muncul di CAPA kedua.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Unggah Formulir RCA & Bukti Perbaikan */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850/90 border border-cyan-500/30 hover:border-cyan-400/60 flex items-start gap-3.5 cursor-default transition-all duration-300 hover:translate-x-1 shadow-sm relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/25 to-blue-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/40 font-black text-sm z-10 shadow-xs">
                      03
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Unggah Form RCA & Bukti CAPA
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Lengkapi analisis akar masalah, tindakan koreksi, tindakan preventif, dan lampiran bukti dokumen/foto sebelum jatuh tempo 14 hari kerja.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Portal Petugas Fast Access */}
                <div className="pt-2 text-center border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={onOpenLoginModal}
                    className="text-xs text-slate-300 hover:text-emerald-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer group"
                  >
                    <span>Petugas atau Evaluator Balai POM? Masuk ke</span>
                    <span className="text-emerald-400 font-bold underline group-hover:text-emerald-300">Portal Petugas Internal</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. DYNAMIC INTERACTIVE TABS SECTION */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Tab Controls Bar */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1.5 flex-wrap justify-center shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab('TRACKING')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'TRACKING'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Panduan Pelacakan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REGULATIONS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'REGULATIONS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Standar Komoditi (CPOB/CDOB)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SLA_CALCULATOR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'SLA_CALCULATOR'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Kalkulator SLA 14 Hari</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FAQ')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'FAQ'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Tanya Jawab (FAQ)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: PANDUAN PELACAKAN & FITUR UTAMA */}
        {activeTab === 'TRACKING' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-white">Integritas SIBERGAS & TTE</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Survei kepuasan dan integritas petugas pengawas terintegrasi langsung dengan log audit, menjamin pengawasan bersih tanpa gratifikasi dan suap.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-white">SLA Tegas 14 Hari Kalender</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Penghitungan sisa hari berjalan secara otomatis. Peringatan dini H-7 dikirim ke kontak WhatsApp PIC sarana agar terhindar dari sanksi peringatan kedua.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-white">Telaah Detail Per Butir Temuan</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluator memeriksa setiap butir temuan secara terpisah. Sarana dapat melihat status persetujuan, catatan telaah, dan instruksi perbaikan per butir.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: STANDAR KOMODITI */}
        {activeTab === 'REGULATIONS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
            {[
              {
                code: 'CPOB',
                title: 'Industri Farmasi & NPP',
                desc: 'Audit Cara Pembuatan Obat yang Baik mencakup sistem tata udara (HVAC), kualifikasi ruang bersih, validasi proses, dan integritas data batch record.',
                color: 'emerald',
              },
              {
                code: 'CDOB',
                title: 'Pedagang Besar Farmasi (PBF)',
                desc: 'Audit Cara Distribusi Obat yang Baik mencakup rantai dingin (cold chain), kualifikasi pemasok/pelanggan, sistem pemantauan suhu, dan ketertelusuran produk.',
                color: 'blue',
              },
              {
                code: 'CPOTB',
                title: 'Obat Bahan Alam / Tradisional',
                desc: 'Audit Cara Pembuatan Obat Tradisional yang Baik mencakup pengujian cemaran mikroba, logam berat, standardisasi simplisia, dan higienitas produksi.',
                color: 'teal',
              },
              {
                code: 'CPKB',
                title: 'Industri Kosmetik',
                desc: 'Audit Cara Pembuatan Kosmetika yang Baik mencakup pengawasan bahan baku, stabilitas produk, penandaan klaim, dan sanitasi lingkungan kerja.',
                color: 'purple',
              },
              {
                code: 'CPPOB',
                title: 'Pangan Olahan (MD/ML)',
                desc: 'Audit Cara Produksi Pangan Olahan yang Baik mencakup penerapan prinsip HACCP, batas cemaran, pelabelan gizi, dan ketertelusuran bahan.',
                color: 'amber',
              },
              {
                code: 'SARANA_PELAYANAN',
                title: 'Apotek & Klinik Farmasi',
                desc: 'Pengawasan pengelolaan sediaan farmasi, narkotika, psikotropika, dan prekursor farmasi sesuai perundang-undangan.',
                color: 'indigo',
              },
            ].map((reg) => (
              <div
                key={reg.code}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    {reg.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Regulasi BPOM</span>
                </div>
                <h4 className="font-bold text-sm text-white">{reg.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{reg.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: KALKULATOR SLA 14 HARI */}
        {activeTab === 'SLA_CALCULATOR' && (
          <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Kalkulator Simulasi Jatuh Tempo SLA CAPA
                </h3>
                <p className="text-xs text-slate-400">
                  Hitung tanggal batas waktu penyerahan dokumen CAPA berdasarkan tanggal terbit surat
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tanggal Terbit Surat SRIKANDI:
                </label>
                <input
                  type="date"
                  value={calcDate}
                  onChange={(e) => setCalcDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Durasi Standar SLA:
                </label>
                <select
                  value={calcDays}
                  onChange={(e) => setCalcDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value={14}>14 Hari Kalender (Standar Balai POM)</option>
                  <option value={7}>7 Hari Kalender (Perbaikan Mendesak / Kritis)</option>
                  <option value={30}>30 Hari Kalender (Perbaikan Kompleks)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                  Batas Akhir Penyerahan Dokumen (Deadline):
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {formatIndonesianDate(calculatedDeadline)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  SLA {calcDays} Hari
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: FAQ ACCORDION */}
        {activeTab === 'FAQ' && (
          <div className="max-w-3xl mx-auto space-y-3 animate-in fade-in duration-300">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </section>

      {/* 5. FOOTER */}
      <footer className="bg-[#050817] border-t border-slate-800 text-slate-400 text-xs py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-white text-sm">SIMONCER</span>
                <span>— Balai Besar Pengawas Obat dan Makanan di Semarang</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Jl Sukun Raya No 41 A Banyumanik Semarang | Telp: (024) 7612305
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                onClick={handleOpenWhatsAppHelpdesk}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>WhatsApp Pengaduan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                Login Petugas Balai
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
            <p>© {new Date().getFullYear()} Balai Besar POM di Semarang. Hak Cipta Dilindungi.</p>
            <p>Terintegrasi SRIKANDI (TTE BSrE) & Survei Integritas SIBERGAS</p>
          </div>
        </div>
      </footer>

      {/* 6. FLOATING WHATSAPP BUTTON */}
      <button
        type="button"
        onClick={handleOpenWhatsAppHelpdesk}
        title="Hubungi Layanan Inspeksi BBPOM Semarang via WhatsApp"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-emerald-500/20"
      >
        <MessageSquare className="w-6 h-6 fill-white" />
      </button>

    </div>
  );
};
