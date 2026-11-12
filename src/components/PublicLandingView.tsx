import React, { useState, useRef, useEffect } from 'react';
import { InspectionSession, UserRole, AuthAccount } from '../types';
import { 
  ShieldCheck, 
  Upload, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  FileText, 
  UserCheck, 
  ArrowRight, 
  Building2, 
  AlertCircle, 
  HelpCircle, 
  Award,
  ChevronDown,
  Sparkles,
  Calculator,
  Lock,
  Layers,
  ArrowUpRight,
  Table,
  Smartphone,
  Sun,
  Moon,
  FileCheck2
} from 'lucide-react';
import { calculateRemainingDays, formatIndonesianDate, getStatusBadgeConfig, addBusinessDays } from '../utils/date';

interface PublicLandingViewProps {
  inspections: InspectionSession[];
  onOpenLoginModal: () => void;
  onOpenSubmitCapa: (inspection?: InspectionSession) => void;
  onOpenTrackingModal: (initialCode?: string) => void;
  onSelectInspection: (inspection: InspectionSession) => void;
  currentRole?: UserRole;
  currentUser?: AuthAccount | null;
  onRoleChange?: (role: UserRole) => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  inspections,
  onOpenLoginModal,
  onOpenSubmitCapa,
  onOpenTrackingModal,
  currentUser,
  onRoleChange,
}) => {
  const [trackQuery, setTrackQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [foundInspection, setFoundInspection] = useState<InspectionSession | null>(null);
  const [showDemoCodes, setShowDemoCodes] = useState(false);
  const [mobileNavTab, setMobileNavTab] = useState<'SEARCH' | 'REGULATIONS' | 'SLA' | 'FAQ'>('SEARCH');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('simoncer_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('simoncer_theme', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('simoncer_theme', 'light'); } catch {}
    }
  }, [isDark]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const infoTabsSectionRef = useRef<HTMLElement>(null);

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
      setSearchError('Silakan masukkan Kode Unik CAPA atau Nomor Surat Tindak Lanjut SRIKANDI perusahaan Anda.');
      return;
    }

    // Pencarian berdasarkan Kode Unik CAPA atau Nomor Surat SRIKANDI (menjaga privasi antar perusahaan)
    const matched = inspections.find(
      (ins) =>
        ins.capaCode.toLowerCase() === query ||
        ins.srikandiLetter.letterNo.toLowerCase() === query ||
        ins.capaCode.toLowerCase().includes(query)
    );

    if (matched) {
      setFoundInspection(matched);
    } else {
      setSearchError(`Kode CAPA atau Nomor Surat "${trackQuery}" tidak ditemukan. Pastikan kode unik sesuai dengan yang tertera pada Surat Tindak Lanjut SRIKANDI (TTE) perusahaan Anda.`);
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
      'https://wa.me/628895166322?text=Halo%20Admin%20SIMONCER%20BBPOM%20Semarang,%20kami%20dari%20perusahaan/sarana%20ingin%20berkonsultasi%20terkait%20pengajuan%20tindak%20lanjut%20CAPA',
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
      q: 'Mengapa data perusahaan lain tidak ditampilkan di halaman depan ini?',
      a: 'Demi menjaga kerahasiaan data pemeriksaan dan privasi masing-masing pelaku usaha (sarana), SIMONCER tidak menampilkan daftar perusahaan secara terbuka. Setiap perusahaan hanya dapat mengakses, melacak, dan mengajukan dokumen CAPA miliknya sendiri menggunakan Kode Unik CAPA rahasia yang dikirimkan melalui Surat Tindak Lanjut SRIKANDI (TTE) atau WhatsApp/Email resmi PIC sarana.',
    },
    {
      q: 'Mengapa sarana wajib mengisi Survei Integritas Petugas (SIBERGAS) sebelum mengirim CAPA?',
      a: 'Sebagai komitmen Zona Integritas Wilayah Bebas dari Korupsi (WBK) dan WBBM di lingkungan Balai Besar POM di Semarang, setiap sarana diwajibkan memberikan penilaian obyektif atas profesionalisme dan integritas petugas pengawas saat pemeriksaan fisik. Survei ini bersifat rahasia dan wajib diisi sebelum dokumen CAPA pertama kali diserahkan.',
    },
    {
      q: 'Apakah pada pengiriman perbaikan CAPA kedua survei SIBERGAS muncul kembali?',
      a: 'Tidak. Survei SIBERGAS hanya diwajibkan satu kali pada saat sarana pertama kali menyerahkan dokumen tindak lanjut (CAPA 1). Jika evaluator meminta perbaikan lanjutan (CAPA 2), sarana dapat langsung mengunggah berkas revisi tanpa perlu mengisi survei lagi.',
    },
    {
      q: 'Berapa lama batas waktu penyelesaian tindak lanjut CAPA?',
      a: 'Sesuai standar operasional BBPOM di Semarang, sarana memiliki waktu maksimal 14 hari kerja (tidak termasuk akhir pekan & libur nasional) terhitung sejak tanggal pertama kali sarana menerima surat tindak lanjut untuk menyusun RCA (Root Cause Analysis), tindakan perbaikan (CAP), dan tindakan pencegahan (PAP) beserta bukti lampirannya.',
    },
    {
      q: 'Apakah pengajuan CAPA memerlukan pembuatan akun atau pendaftaran login khusus perusahaan?',
      a: 'Tidak perlu. Pelaku usaha / perusahaan dapat langsung melakukan pelacakan dan pengajuan CAPA secara mandiri hanya dengan memasukkan Kode Unik CAPA yang tertera pada Surat Tindak Lanjut SRIKANDI (TTE) yang diterima.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#edf3fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#2e8b75] selection:text-white pb-20 md:pb-0 transition-colors duration-200">
      
      {/* Top Banner HANYA TAMPIL JIKA PEGAWAI SUDAH LOGIN dan sedang melihat pratinjau halaman depan */}
      {currentUser && onRoleChange && (
        <div className="bg-[#1d3354] text-blue-100 text-xs py-2 px-3 sm:px-6 z-50 relative border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5eead4] animate-pulse shrink-0"></span>
              <span className="text-[11px] sm:text-xs text-white">
                Login Aktif: <strong className="text-[#99f6e4]">{currentUser.name} ({currentUser.role})</strong> — <span className="text-blue-200">Sedang melihat tampilan Portal Perusahaan</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onRoleChange(currentUser.role)}
              className="px-3 py-1 bg-[#2e8b75] hover:bg-[#24705e] text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>← Kembali ke Dashboard Internal Balai</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER BAR (SOFT BLUE-NAVY KE TEAL DENGAN AKSEN HIJAU SAGE) */}
      <header className="bpom-header-navy text-white sticky top-0 z-40 shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
            
            {/* Logo: SIMONCER BPOM & Subtitle */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0 border border-teal-300/60 relative">
                <img
                  src="/assets/aistudio/logo-simoncer_467003a7.webp"
                  alt="Logo SIMONCER"
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">
                    SIMONCER
                  </span>
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-[#86efac]">
                    BPOM
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-teal-100 border border-white/20 ml-1 hidden md:inline-block font-semibold">
                    BBPOM Semarang
                  </span>
                </div>
                <p className="text-[10px] text-blue-100/90 font-medium tracking-wide truncate mt-0.5">
                  Balai Besar Pengawas Obat dan Makanan di Semarang
                </p>
              </div>
            </div>

            {/* Center Quick Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/12 p-1 rounded-xl border border-white/15 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  searchInputRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#86efac]" />
                <span>Ajukan & Lacak CAPA</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('REGULATIONS');
                  infoTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-[#86efac]" />
                <span>Standar Komoditi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('SLA_CALCULATOR');
                  infoTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-[#86efac]" />
                <span>Kalkulator SLA 14 Hari</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('FAQ');
                  infoTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#86efac]" />
                <span>Panduan & FAQ</span>
              </button>
            </nav>

            {/* Right Navigation */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Light/Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
                title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-100" />}
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppHelpdesk}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer px-3 py-2 rounded-xl border border-white/20"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#86efac]" />
                <span className="hidden md:inline">Helpdesk WA</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentUser && onRoleChange) {
                    onRoleChange(currentUser.role);
                  } else {
                    onOpenLoginModal();
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#2e8b75] hover:bg-[#24705e] border border-teal-300/30 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="Login khusus Petugas, Evaluator, dan Supervisor Balai"
              >
                <UserCheck className="w-3.5 h-3.5 text-white" />
                <span>{currentUser ? 'Dashboard Internal' : 'Portal Petugas'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION DENGAN GRADASI BIRU LANGIT & HIJAU MINT SOFT BERWARNA */}
      <section className="bpom-hero-gradient border-b border-blue-200/80 dark:border-slate-800 relative overflow-hidden pt-6 sm:pt-9 pb-14 sm:pb-18 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10 space-y-6 sm:space-y-8">
          
          {/* NOTICE BANNER & FLOATING BADGES */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="max-w-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-blue-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-start gap-3 shadow-xs text-xs text-slate-700 dark:text-slate-200">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#2b4c7e] to-[#2e8b75] text-white shrink-0 mt-0.5 shadow-2xs">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <strong className="text-[#233d63] dark:text-white font-bold flex items-center gap-2 text-[11px] sm:text-xs">
                  <span>PORTAL PENGAJUAN CAPA PERUSAHAAN / PELAKU USAHA (TERPROTEKSI)</span>
                  <span className="w-2 h-2 rounded-full bg-[#2e8b75] shrink-0"></span>
                </strong>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs">
                  Demi menjaga kerahasiaan data antar perusahaan, masukkan <strong className="text-[#2b4c7e] dark:text-teal-300 font-bold">Kode Unik CAPA</strong> yang tertera pada Surat Tindak Lanjut SRIKANDI (TTE) perusahaan Anda untuk membuka formulir pengajuan CAPA.
                </p>
              </div>
            </div>

            {/* Soft Colored Pill Badges (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-[#233d63] dark:text-slate-200 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#2e8b75]" />
                <span>TTE BSrE BSSN Sah</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2e8b75]/15 dark:bg-teal-950 border border-[#2e8b75]/30 text-[#1f6353] dark:text-teal-300 text-xs font-bold shadow-2xs">
                <Smartphone className="w-3.5 h-3.5 text-[#2e8b75]" />
                <span>Responsif HP & PC</span>
              </div>
            </div>
          </div>

          {/* MAIN HERO GRID: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* LEFT COLUMN: SIMONCER Headline & COLOR-ACCENTED CARD PENGAJUAN CAPA */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Brand Header */}
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-15 h-15 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-slate-800 p-2.5 shadow-md flex items-center justify-center shrink-0 border-2 border-[#2e8b75]/40 relative">
                  <img
                    src="/assets/aistudio/logo-simoncer_467003a7.webp"
                    alt="SIMONCER"
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#233d63] dark:text-white">
                      SIMONCER
                    </h1>
                    <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2e8b75] text-white font-mono shadow-2xs">
                      BBPOM SEMARANG
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#2b4c7e] dark:text-teal-300 tracking-tight mt-0.5">
                    Sistem Monitoring & Evaluasi CAPA Terintegrasi
                  </h2>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Selamat datang di portal resmi pengajuan dan pemantauan tindak lanjut hasil pemeriksaan sarana <strong className="text-[#233d63] dark:text-white">Balai Besar POM di Semarang</strong>. Masukkan kode unik surat pemeriksaan perusahaan Anda untuk mengisi survei <strong className="text-[#24705e] dark:text-teal-300">SIBERGAS</strong> dan menyerahkan dokumen perbaikan CAPA.
              </p>

              {/* FORM PENGAJUAN & PELACAKAN CAPA PERUSAHAAN (KARTU DENGAN HEADER GRADASI SOFT BLUE-TEAL) */}
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border border-blue-200/90 dark:border-slate-800 shadow-lg overflow-hidden">
                {/* Soft Colored Card Header Banner */}
                <div className="bg-gradient-to-r from-[#2b4c7e] via-[#2c6284] to-[#2e8b75] px-4 sm:px-6 py-3.5 text-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs text-white border border-white/20">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        Akses Pengajuan & Pelacakan CAPA Perusahaan
                      </h3>
                      <p className="text-[11px] text-blue-100">
                        Masukkan Kode Unik CAPA atau Nomor Surat Tindak Lanjut SRIKANDI perusahaan Anda
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/25 hidden sm:inline-flex items-center gap-1.5 shrink-0">
                    <Lock className="w-3 h-3 text-[#86efac]" />
                    <span>Akses Privat</span>
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {/* Form Input */}
                  <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#2b4c7e] dark:text-teal-400 absolute left-3.5 top-3.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={trackQuery}
                        onChange={(e) => {
                          setTrackQuery(e.target.value);
                          if (searchError) setSearchError('');
                        }}
                        placeholder="Ketik Kode Unik CAPA atau No. Surat SRIKANDI..."
                        className="w-full pl-10 pr-3 py-3 bg-[#f0f6fc] dark:bg-slate-950 border border-blue-200 dark:border-slate-700 focus:border-[#2b4c7e] dark:focus:border-[#2e8b75] focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden transition-all font-mono font-semibold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-3 bg-gradient-to-r from-[#2e8b75] to-[#24705e] hover:from-[#24705e] hover:to-[#1e5e4f] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      <span>Buka Dokumen CAPA</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Privacy Note */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2e8b75] shrink-0" />
                      <span>Kode unik dikirimkan secara rahasia ke kontak WhatsApp & Email resmi PIC perusahaan.</span>
                    </span>
                  </div>

                  {/* Error Banner */}
                  {searchError && (
                    <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 rounded-xl text-xs text-red-700 dark:text-red-200 flex items-center gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-medium">{searchError}</span>
                    </div>
                  )}

                  {/* SEARCH RESULT DIRECT CARD */}
                  {foundInspection && (
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-[#f0f6fc] to-[#edf8f4] dark:from-slate-950 dark:to-slate-900 border border-blue-200 dark:border-slate-800 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/70 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#2b4c7e] text-white">
                              {foundInspection.capaCode}
                            </span>
                            <span className="text-xs font-semibold text-[#24705e] dark:text-teal-300">
                              {foundInspection.facility.type}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-[#233d63] dark:text-white mt-1">
                            {foundInspection.facility.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Penanggung Jawab: {foundInspection.facility.picName} ({foundInspection.facility.picPhone})
                          </p>
                        </div>

                        {(() => {
                          const badge = getStatusBadgeConfig(foundInspection.status);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border} self-start sm:self-center`}>
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Surat SRIKANDI (TTE):</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                            {foundInspection.srikandiLetter.letterNo}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Sisa Batas Waktu (SLA):</span>
                          {(() => {
                            const sla = calculateRemainingDays(foundInspection.srikandiLetter.deadlineDate);
                            return (
                              <span className={`font-semibold text-[11px] ${sla.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-300'}`}>
                                {sla.text} (Batas: {formatIndonesianDate(foundInspection.srikandiLetter.deadlineDate)})
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* SIBERGAS Status Info */}
                      {foundInspection.sibergasSurvey?.completed ? (
                        <div className="p-3 bg-white/90 dark:bg-emerald-950/60 border border-[#2e8b75]/30 rounded-xl flex items-center justify-between text-xs text-[#24705e] dark:text-emerald-200 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#2e8b75] shrink-0" />
                            <span className="font-semibold text-xs">
                              Survei Integritas SIBERGAS telah selesai diisi
                            </span>
                          </div>
                          <span className="text-[10px] font-mono bg-[#dcf5ec] dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-[#2e8b75]/20 font-semibold">
                            Terverifikasi ✓
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/40 rounded-xl space-y-1 text-xs text-amber-900 dark:text-amber-200">
                          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Prasyarat Wajib Sebelum Mengisi Matriks CAPA:</span>
                          </div>
                          <p className="text-amber-800/80 dark:text-slate-300 text-[11px] leading-relaxed">
                            Sarana wajib mengisi <strong>7 butir kuesioner SIBERGAS</strong> terlebih dahulu sebelum membuka lembar kerja Matriks CAPA.
                          </p>
                        </div>
                      )}

                      {/* Result Card Actions */}
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-blue-200/70 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onOpenTrackingModal(foundInspection.capaCode)}
                          className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-blue-50 text-[#233d63] dark:text-white border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#2b4c7e] dark:text-slate-400" />
                          <span>Lihat Alur & Timeline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenSubmitCapa(foundInspection)}
                          className="px-5 py-2.5 bg-[#2e8b75] hover:bg-[#24705e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Table className="w-4 h-4 text-white" />
                          <span>
                            {foundInspection.sibergasSurvey?.completed
                              ? 'Buka & Ajukan Matriks CAPA →'
                              : 'Isi Survei SIBERGAS & Ajukan CAPA →'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ALUR PENGAJUAN MANDIRI (SOFT COLORED NAVY-TEAL CARD) */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
              <div className="bg-gradient-to-br from-[#233d63] via-[#2b4c7e] to-[#266b6e] text-white border border-white/20 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-300"></div>
                    <span className="text-xs text-white font-bold ml-1.5">Alur Pengajuan CAPA Perusahaan</span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/15 text-teal-100 font-semibold border border-white/20">
                    3 Langkah Mudah
                  </span>
                </div>

                <div className="space-y-3 relative">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-start gap-3.5 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-[#34a87a] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                      01
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#86efac] shrink-0" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Terima Surat SRIKANDI (TTE BSrE)
                        </h4>
                      </div>
                      <p className="text-[11px] text-blue-100/90 leading-relaxed">
                        Perusahaan menerima surat hasil pemeriksaan resmi beserta <strong className="text-[#99f6e4]">Kode Unik CAPA</strong> rahasia melalui WhatsApp & Email PIC.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-start gap-3.5 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/90 text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                      02
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Isi Survei Integritas SIBERGAS
                        </h4>
                      </div>
                      <p className="text-[11px] text-blue-100/90 leading-relaxed">
                        Wajib mengisi 7 pertanyaan evaluasi integritas petugas sebelum mengirimkan CAPA pertama (Zona Integritas WBK/WBBM).
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-start gap-3.5 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-sky-400/90 text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                      03
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Unggah Form RCA & Bukti CAPA
                        </h4>
                      </div>
                      <p className="text-[11px] text-blue-100/90 leading-relaxed">
                        Lengkapi analisis akar masalah, tindakan korektif & preventif, serta tautan bukti perbaikan sebelum batas waktu 14 hari kerja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. INFO STANDAR LAYANAN CAPA (KARTU TINTED BERWARNA SOFT) */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-7 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-[#f2f7fd] to-[#e4effa] dark:from-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2b4c7e] to-[#3b66a3] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Privasi Perusahaan
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-extrabold text-[#233d63] dark:text-white font-mono">
                  100%
                </span>
                <span className="text-[11px] text-[#2b4c7e] dark:text-blue-300 font-semibold truncate">Kode Rahasia</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-[#f1faf6] to-[#e2f5ec] dark:from-slate-900 dark:to-slate-900 border border-emerald-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2e8b75] to-[#34a87a] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Format Matriks
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-extrabold text-[#233d63] dark:text-white font-mono">
                  6
                </span>
                <span className="text-[11px] text-[#24705e] dark:text-teal-400 font-semibold truncate">Standar Komoditi</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-sky-50/70 to-sky-100/60 dark:from-slate-900 dark:to-slate-900 border border-sky-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Zona Integritas
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-extrabold text-[#233d63] dark:text-white font-mono">
                  WBK
                </span>
                <span className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold truncate">Survei SIBERGAS</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-amber-50/70 to-orange-100/50 dark:from-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Standar SLA CAPA
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-extrabold text-[#233d63] dark:text-white font-mono tabular-nums">
                  14
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold truncate">Hari Kerja</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC INTERACTIVE TABS SECTION (PANDUAN, STANDAR KOMODITI, KALKULATOR SLA, & FAQ) */}
      <section ref={infoTabsSectionRef} className="py-10 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 relative z-10">
        
        {/* Tab Controls Bar */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar">
          <div className="bg-white/90 dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 p-1.5 rounded-2xl flex items-center gap-1.5 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('TRACKING')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'TRACKING'
                  ? 'bpom-active-gradient text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#233d63] hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panduan Pengajuan CAPA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REGULATIONS')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'REGULATIONS'
                  ? 'bpom-active-gradient text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#233d63] hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Standar Komoditi (CPOB/CDOB)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SLA_CALCULATOR')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'SLA_CALCULATOR'
                  ? 'bpom-active-gradient text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#233d63] hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Kalkulator SLA 14 Hari</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FAQ')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'FAQ'
                  ? 'bpom-active-gradient text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#233d63] hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Tanya Jawab (FAQ)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: PANDUAN PELACAKAN & FITUR UTAMA */}
        {activeTab === 'TRACKING' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in duration-300">
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-[#f0f6fc] dark:from-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 transition-all space-y-3 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-[#e0ecfa] dark:bg-slate-800 text-[#2b4c7e] dark:text-sky-300 flex items-center justify-center border border-blue-200 dark:border-slate-700">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#233d63] dark:text-white">Kerahasiaan Data Perusahaan</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Data temuan dan dokumen perbaikan bersifat rahasia. Hanya perusahaan pemegang Kode Unik CAPA resmi dari surat SRIKANDI yang dapat membuka lembar kerja CAPA-nya.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-[#eef9f5] dark:from-slate-900 dark:to-slate-900 border border-emerald-200/80 dark:border-slate-800 transition-all space-y-3 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-[#dcf5ec] dark:bg-teal-950/60 text-[#2e8b75] flex items-center justify-center border border-[#2e8b75]/25">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#233d63] dark:text-white">SLA Tegas 14 Hari Kerja</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Penghitungan sisa hari kerja berjalan secara otomatis. Notifikasi pengingat dikirim ke kontak WhatsApp PIC perusahaan agar pengajuan CAPA tepat waktu.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-sky-50/70 dark:from-slate-900 dark:to-slate-900 border border-sky-200/80 dark:border-slate-800 transition-all space-y-3 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 flex items-center justify-center border border-sky-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#233d63] dark:text-white">Evaluasi Transparan Per Klausul</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluator memeriksa setiap butir temuan secara terpisah. Perusahaan dapat memantau status persetujuan, catatan telaah, dan mengunduh bukti tanda terima CAPA.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: STANDAR KOMODITI */}
        {activeTab === 'REGULATIONS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-in fade-in duration-300">
            {[
              {
                code: 'CPOB',
                title: 'Industri Farmasi & NPP',
                desc: 'Audit Cara Pembuatan Obat yang Baik mencakup sistem tata udara (HVAC), kualifikasi ruang bersih, validasi proses, dan integritas data batch record.',
              },
              {
                code: 'CDOB',
                title: 'Pedagang Besar Farmasi (PBF)',
                desc: 'Audit Cara Distribusi Obat yang Baik mencakup rantai dingin (cold chain), kualifikasi pemasok/pelanggan, sistem pemantauan suhu, dan ketertelusuran produk.',
              },
              {
                code: 'CPOTB',
                title: 'Obat Bahan Alam / Tradisional',
                desc: 'Audit Cara Pembuatan Obat Tradisional yang Baik mencakup pengujian cemaran mikroba, logam berat, standardisasi simplisia, dan higienitas produksi.',
              },
              {
                code: 'CPKB',
                title: 'Industri Kosmetik',
                desc: 'Audit Cara Pembuatan Kosmetika yang Baik mencakup pengawasan bahan baku, stabilitas produk, penandaan klaim, dan sanitasi lingkungan kerja.',
              },
              {
                code: 'CPPOB',
                title: 'Pangan Olahan (MD/ML)',
                desc: 'Audit Cara Produksi Pangan Olahan yang Baik mencakup penerapan prinsip HACCP, batas cemaran, pelabelan gizi, dan ketertelusuran bahan.',
              },
              {
                code: 'SARANA_PELAYANAN',
                title: 'Apotek, RS & Klinik Farmasi',
                desc: 'Pengawasan pengelolaan sediaan farmasi, narkotika, psikotropika, dan prekursor farmasi sesuai perundang-undangan.',
              },
            ].map((reg) => (
              <div
                key={reg.code}
                className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#f2f7fd] dark:from-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-[#e0ecfa] dark:bg-slate-800 text-[#2b4c7e] dark:text-teal-300 border border-blue-200 dark:border-slate-700">
                    {reg.code}
                  </span>
                  <span className="text-[10px] text-[#2e8b75] font-semibold">Regulasi BPOM</span>
                </div>
                <h4 className="font-bold text-sm text-[#233d63] dark:text-white">{reg.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{reg.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: KALKULATOR SLA 14 HARI */}
        {activeTab === 'SLA_CALCULATOR' && (
          <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-[#e0ecfa] dark:bg-slate-800 text-[#2b4c7e] dark:text-sky-300">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#233d63] dark:text-white">
                  Kalkulator Simulasi Jatuh Tempo SLA CAPA
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hitung tanggal batas waktu penyerahan dokumen CAPA berdasarkan hari kerja
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                  Tanggal Terbit Surat SRIKANDI:
                </label>
                <input
                  type="date"
                  value={calcDate}
                  onChange={(e) => setCalcDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f0f6fc] dark:bg-slate-950 border border-blue-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono text-xs focus:border-[#2b4c7e] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                  Durasi Standar SLA:
                </label>
                <select
                  value={calcDays}
                  onChange={(e) => setCalcDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#f0f6fc] dark:bg-slate-950 border border-blue-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs focus:border-[#2b4c7e] focus:outline-hidden"
                >
                  <option value={14}>14 Hari Kerja (Standar Balai POM)</option>
                  <option value={7}>7 Hari Kerja (Perbaikan Mendesak / Kritis)</option>
                  <option value={30}>30 Hari Kerja (Perbaikan Kompleks)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#e0ecfa] to-[#dcf5ec] dark:from-slate-800 dark:to-emerald-950/60 border border-[#2e8b75]/30 rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2b4c7e] dark:text-slate-300 block">
                  Batas Akhir Penyerahan Dokumen (Deadline):
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#233d63] dark:text-white mt-0.5 block">
                  {formatIndonesianDate(calculatedDeadline)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs px-3 py-1 rounded-full bg-[#2e8b75] text-white font-semibold shadow-2xs">
                  SLA {calcDays} Hari Kerja
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
                className="bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#233d63] dark:text-white hover:text-[#2e8b75] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-[#2e8b75]' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-blue-100 dark:border-slate-800 bg-[#f8fbff] dark:bg-slate-950 animate-in fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </section>

      {/* 5. FOOTER SOFT BLUE-NAVY KE TEAL */}
      <footer className="bg-gradient-to-r from-[#233d63] via-[#2b4c7e] to-[#266b6e] border-t-3 border-[#34a87a] text-blue-100 text-xs py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#86efac]" />
                <span className="font-bold text-white text-sm">SIMONCER</span>
                <span>— Balai Besar Pengawas Obat dan Makanan di Semarang</span>
              </div>
              <p className="text-[11px] text-blue-200/85">
                Jl. Sukun Raya No. 41 A, Banyumanik, Kota Semarang | Telp: (024) 7612305
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                onClick={handleOpenWhatsAppHelpdesk}
                className="text-[#86efac] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>WhatsApp Helpdesk</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-blue-300/60">•</span>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-white hover:underline font-semibold cursor-pointer"
              >
                Login Petugas Balai
              </button>
            </div>
          </div>

          <div className="border-t border-white/15 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-blue-200/75 text-center sm:text-left">
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
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-[#2e8b75] hover:bg-[#24705e] text-white p-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-white/80"
      >
        <MessageSquare className="w-5 h-5 fill-white" />
      </button>

      {/* 7. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden glass-bottom-nav border-t-2 border-[#34a87a] px-2 py-1.5 shadow-sm">
        <div className="grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => {
              setMobileNavTab('SEARCH');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => searchInputRef.current?.focus(), 300);
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileNavTab === 'SEARCH'
                ? 'text-white bpom-active-gradient font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Ajukan CAPA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileNavTab('REGULATIONS');
              setActiveTab('REGULATIONS');
              infoTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileNavTab === 'REGULATIONS'
                ? 'text-white bpom-active-gradient font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Regulasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileNavTab('SLA');
              setActiveTab('SLA_CALCULATOR');
              infoTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileNavTab === 'SLA'
                ? 'text-white bpom-active-gradient font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Hitung SLA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileNavTab('FAQ');
              setActiveTab('FAQ');
              infoTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileNavTab === 'FAQ'
                ? 'text-white bpom-active-gradient font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Panduan</span>
          </button>

          <button
            type="button"
            onClick={onOpenLoginModal}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-white bg-[#2e8b75] font-bold shadow-2xs cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-white" />
            <span className="text-[10px] mt-0.5">Petugas</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
