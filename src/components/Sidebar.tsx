import React, { useState } from 'react';
import { UserRole, AuthAccount } from '../types';
import { SuperAdminTab } from './SuperAdminSettingsModal';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  UserCheck, 
  Building2, 
  ClipboardCheck, 
  Upload, 
  Users, 
  Award,
  LogOut,
  ExternalLink,
  ChevronDown,
  Settings,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Smartphone,
  Printer,
  X,
  Sliders,
  CheckCircle2,
  Home,
  LayoutDashboard,
  FolderOpen,
  Bell,
  FileSpreadsheet
} from 'lucide-react';

export interface SidebarProps {
  currentRole: UserRole;
  currentUser: AuthAccount | null;
  activeHomeTab: 'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE' | 'SHEET_REKAP';
  onSelectHomeTab: (tab: 'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE' | 'SHEET_REKAP') => void;
  inspectionsCount: number;
  surveysCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onRoleChange: (role: UserRole) => void;
  onOpenTracking: () => void;
  onOpenNewInspection: () => void;
  onOpenOfficerDirectory?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenSuperAdminSettings?: (tab?: SuperAdminTab) => void;
  onOpenPrintReport?: () => void;
  onResetData: () => void;
  onLogout?: () => void;
  onOpenPublicPortal: () => void;
  isWideView: boolean;
  onToggleWideView: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isHidden?: boolean;
  onToggleHide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentUser,
  activeHomeTab,
  onSelectHomeTab,
  inspectionsCount,
  surveysCount,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  onRoleChange,
  onOpenTracking,
  onOpenNewInspection,
  onOpenOfficerDirectory,
  onOpenSuperAdminSettings,
  onOpenPrintReport,
  onResetData,
  onLogout,
  onOpenPublicPortal,
  isWideView,
  onToggleWideView,
  isFullscreen,
  onToggleFullscreen,
  onToggleHide,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string; badge: string }[] = [
    {
      id: 'ADMIN',
      label: 'Admin Balai POM',
      icon: <UserCheck className="w-4 h-4 text-[#2e856e]" />,
      desc: 'Upload surat SRIKANDI TTE, tunjuk petugas PIC, & kelola akun',
      badge: 'Admin',
    },
    {
      id: 'PETUGAS_EVALUATOR',
      label: 'Petugas / Evaluator',
      icon: <ClipboardCheck className="w-4 h-4 text-[#2c4c70] dark:text-sky-400" />,
      desc: 'Telaah bukti CAPA sarana & verifikasi pemenuhan standar',
      badge: 'Evaluator',
    },
    {
      id: 'SUPERVISOR',
      label: 'Supervisor (Kepala Balai)',
      icon: <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      desc: 'Supervisi SLA 14 hari, evaluasi kinerja, & berita acara',
      badge: 'Supervisor',
    },
    {
      id: 'SARANA',
      label: 'Portal Pelaku Usaha',
      icon: <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      desc: 'Lacak status & kirim dokumen tindak lanjut sarana',
      badge: 'Sarana',
    },
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#243b55]/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container — Clean White BPOM Identity with Dark Mode support */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-r border-slate-200/90 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,64,133,0.05)] transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'w-16' : 'w-56'
        } ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand Logo — BPOM Identity */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-gradient-to-r from-[#2c4c70]/[0.05] via-[#2e856e]/[0.04] to-transparent">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-white p-1 shadow-xs shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <img
                src="/assets/aistudio/logo-simoncer_467003a7.webp"
                alt="Logo SIMONCER"
                className="w-full h-full object-contain"
              />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1">
                  <span className="font-black text-sm tracking-tight text-[#243b55] dark:text-white">
                    SIMONCER
                  </span>
                  <span className="text-[8px] uppercase font-extrabold px-1 py-0.5 rounded bg-[#2e856e]/15 text-[#2e856e] border border-[#2e856e]/30">
                    BBPOM
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  BBPOM di Semarang
                </span>
              </div>
            )}
          </div>

          {/* Collapse/Expand Toggle Button (Desktop) & Close Button (Mobile) */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 text-slate-500 hover:text-[#243b55] dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1 text-slate-500 hover:text-[#243b55] dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Perlebar Sidebar (Expand Menu)' : 'Ciutkan Sidebar (Collapse Menu)'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#2e856e]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {onToggleHide && !isCollapsed && (
              <button
                type="button"
                onClick={onToggleHide}
                className="hidden lg:flex p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Sembunyikan Sidebar Sepenuhnya (Hide Sidebar)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 scrollbar-thin">
          
          {/* Section 1: Navigasi Utama */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menu Utama
              </span>
            )}

            {/* 1. Home / Beranda */}
            <button
              type="button"
              onClick={() => {
                onSelectHomeTab('HOME');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'HOME'
                  ? 'bpom-active-gradient text-white shadow-sm shadow-[#243b55]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white'
              }`}
              title="Home • Dashboard Kinerja, Evaluasi, & Ringkasan Alur"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeHomeTab === 'HOME'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#2c4c70]/10 dark:bg-slate-800 text-[#2c4c70] dark:text-sky-400'
              }`}>
                <Home className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Beranda Utama</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Beranda Utama
                </div>
              )}
            </button>

            {/* 2. Dashboard Temuan & CAPA */}
            <button
              type="button"
              onClick={() => {
                onSelectHomeTab('DASHBOARD');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'DASHBOARD'
                  ? 'bpom-active-gradient text-white shadow-sm shadow-[#243b55]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white'
              }`}
              title="Dashboard Interaktif Ringkasan Visual Status Temuan & CAPA"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeHomeTab === 'DASHBOARD'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#2e856e]/10 dark:bg-slate-800 text-[#2e856e]'
              }`}>
                <LayoutDashboard className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Dashboard Temuan</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Dashboard Temuan & CAPA
                </div>
              )}
            </button>

            {/* 3. Manajemen Dokumen Pemeriksaan */}
            <button
              type="button"
              onClick={() => {
                onSelectHomeTab('DOCUMENTS');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'DOCUMENTS'
                  ? 'bpom-active-gradient text-white shadow-sm shadow-[#243b55]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white'
              }`}
              title="Sistem Manajemen Dokumen Pemeriksaan (Surat TL, Bukti, Hasil Evaluasi, & Jejak Audit)"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeHomeTab === 'DOCUMENTS'
                  ? 'bg-white/20 text-white'
                  : 'bg-sky-500/10 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
              }`}>
                <FolderOpen className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Manajemen Dokumen</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Manajemen Dokumen Pemeriksaan
                </div>
              )}
            </button>

            {/* 4. Daftar Sesi CAPA */}
            <button
              type="button"
              onClick={() => {
                onSelectHomeTab('INSPECTIONS');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'INSPECTIONS'
                  ? 'bpom-active-gradient text-white shadow-sm shadow-[#243b55]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white'
              }`}
              title="Daftar Sesi CAPA Sarana (Pemeriksaan & Tindak Lanjut)"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeHomeTab === 'INSPECTIONS'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-500/10 dark:bg-slate-800 text-[#243b55] dark:text-indigo-400'
              }`}>
                <FileText className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">Daftar Sesi CAPA</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums font-extrabold ${
                    activeHomeTab === 'INSPECTIONS'
                      ? 'bg-white/25 text-white'
                      : 'bg-[#2c4c70]/10 dark:bg-slate-800 text-[#243b55] dark:text-slate-300'
                  }`}>
                    {inspectionsCount}
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Daftar Sesi CAPA ({inspectionsCount})
                </div>
              )}
            </button>

            {/* 5. Hasil Survei Integritas SIBERGAS */}
            <button
              type="button"
              onClick={() => {
                onSelectHomeTab('SIBERGAS_TABLE');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'SIBERGAS_TABLE'
                  ? 'bpom-active-gradient text-white shadow-sm shadow-[#243b55]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white'
              }`}
              title="Tabel & Rekap Hasil Survei Integritas Petugas (SIBERGAS)"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeHomeTab === 'SIBERGAS_TABLE'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#2e856e]/10 dark:bg-slate-800 text-[#2e856e]'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">Survei SIBERGAS</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums font-extrabold ${
                    activeHomeTab === 'SIBERGAS_TABLE'
                      ? 'bg-white/25 text-white'
                      : 'bg-[#2e856e]/15 text-[#2e856e]'
                  }`}>
                    {surveysCount}
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Survei SIBERGAS ({surveysCount})
                </div>
              )}
            </button>

            {/* 5b. Rekap Pemeriksaan dari Google Spreadsheet */}
            <button
              type="button"
              onClick={() => {
                onSelectHomeTab('SHEET_REKAP');
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'SHEET_REKAP'
                  ? 'bpom-active-gradient text-white shadow-sm shadow-[#243b55]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white'
              }`}
              title="Rekap Pemeriksaan dari Google Spreadsheet (sinkron otomatis)"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeHomeTab === 'SHEET_REKAP'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#2e856e]/10 dark:bg-slate-800 text-[#2e856e]'
              }`}>
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </span>

              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Rekap Spreadsheet</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Rekap Spreadsheet
                </div>
              )}
            </button>

            {/* 6. Lacak Kode CAPA */}
            <button
              type="button"
              onClick={() => {
                onOpenTracking();
                if (isOpenMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
              title="Lacak status CAPA secara cepat menggunakan Kode Unik"
            >
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Search className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Lacak Kode CAPA</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Lacak Kode CAPA
                </div>
              )}
            </button>
          </div>

          {/* Section 2: Operasional & Tindak Lanjut */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Operasional Balai
              </span>
            )}

            {/* Upload Surat SRIKANDI (Khusus Admin Balai) */}
            {currentRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  onOpenNewInspection();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs bg-[#2e856e] hover:bg-[#256d5a] text-white shadow-sm shadow-[#2e856e]/20 transition-all cursor-pointer group relative"
                title="Upload surat SRIKANDI TTE untuk terbitkan kode CAPA baru"
              >
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Upload className="w-3.5 h-3.5 text-white" />
                </span>
                
                {!isCollapsed ? (
                  <>
                    <span className="flex-1 text-left truncate font-extrabold">Upload Surat (TTE)</span>
                    <span className="text-[8px] bg-white/25 text-white px-1 py-0.5 rounded font-mono font-bold">
                      Baru
                    </span>
                  </>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#2e856e] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                    Upload Surat SRIKANDI (TTE)
                  </div>
                )}
              </button>
            )}

            {/* Direktori Petugas / PIC Evaluator */}
            {onOpenOfficerDirectory && currentRole !== 'PETUGAS_EVALUATOR' && (
              <button
                type="button"
                onClick={() => {
                  onOpenOfficerDirectory();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
                title="Lihat & kelola data Petugas/Evaluator Balai"
              >
                <span className="w-6 h-6 rounded-lg bg-[#2c4c70]/10 dark:bg-slate-800 text-[#2c4c70] dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </span>
                
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate">Direktori Petugas PIC</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                    Direktori Petugas PIC
                  </div>
                )}
              </button>
            )}

            {/* Rekap Laporan PDF (Khusus Supervisor) */}
            {currentRole === 'SUPERVISOR' && onOpenPrintReport && (
              <button
                type="button"
                onClick={() => {
                  onOpenPrintReport();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
                title="Cetak Laporan Rekapitulasi Pengawasan & CAPA Balai"
              >
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                </span>
                
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate">Cetak Rekap Balai</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                    Cetak Rekap Balai
                  </div>
                )}
              </button>
            )}

            {/* Portal Publik Sarana */}
            <button
              type="button"
              onClick={() => {
                onOpenPublicPortal();
                if (isOpenMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-[#2c4c70]/[0.06] dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
              title="Beralih ke tampilan publik portal sarana / pelaku usaha"
            >
              <span className="w-6 h-6 rounded-lg bg-sky-500/10 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">Portal Publik</span>
                  <span className="text-[9px] text-[#2c4c70] dark:text-sky-300 font-bold bg-[#2c4c70]/10 dark:bg-sky-950/60 px-1 py-0.5 rounded border border-[#2c4c70]/20">
                    Publik
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 font-sans">
                  Portal Publik Sarana
                </div>
              )}
            </button>
          </div>

          {/* Section 3: Pusat Pengaturan Terpadu (Notifikasi & Sistem) */}
          {(currentRole === 'ADMIN' || currentRole === 'SUPERVISOR') && onOpenSuperAdminSettings && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="flex items-center justify-between px-2.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Pengaturan
                  </span>
                  <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-[#2c4c70]/10 text-[#2c4c70] dark:text-sky-300">
                    Terpadu
                  </span>
                </div>
              )}

              {/* Pusat Pengaturan Utama */}
              <button
                type="button"
                onClick={() => {
                  onOpenSuperAdminSettings('NOTIFIKASI');
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs text-[#243b55] dark:text-white bg-[#2c4c70]/[0.06] hover:bg-[#2c4c70]/[0.12] dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-[#2c4c70]/20 dark:border-slate-700 shadow-2xs transition-all cursor-pointer group relative"
                title="Pusat Pengaturan Terpadu: Pemicu Notifikasi, Saluran, Template & Live Preview, Gateway WA Fonnte, Akun & Petugas"
              >
                <Settings className="w-3.5 h-3.5 text-[#2e856e] group-hover:rotate-45 transition-transform shrink-0" />
                
                {!isCollapsed ? (
                  <>
                    <span className="flex-1 text-left truncate">Menu Pengaturan</span>
                    <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-[#2e856e]/15 text-[#2e856e] border border-[#2e856e]/30">
                      Opsi
                    </span>
                  </>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-[#243b55] text-white text-xs rounded-xl shadow-xl whitespace-nowrap z-50 font-sans">
                    Menu Pengaturan Terpadu
                  </div>
                )}
              </button>

              {/* Sub: Pemicu & Saluran Notifikasi */}
              <button
                type="button"
                onClick={() => {
                  onOpenSuperAdminSettings('NOTIFIKASI');
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
                title="Sesuaikan Saluran (WA & Email) & Pemicu Notifikasi Otomatis"
              >
                <Bell className="w-3.5 h-3.5 text-[#2e856e] shrink-0" />
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate text-[11px]">Pemicu & Saluran Notif</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-[#243b55] text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 font-sans">
                    Pemicu & Saluran Notifikasi
                  </div>
                )}
              </button>

              {/* Sub: Template Pesan & Live Preview */}
              <button
                type="button"
                onClick={() => {
                  onOpenSuperAdminSettings('TEMPLATES');
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
                title="Edit Teks Pesan WhatsApp & Email serta Live Preview"
              >
                <FileText className="w-3.5 h-3.5 text-[#2c4c70] dark:text-sky-400 shrink-0" />
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate text-[11px]">Template & Live Preview</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-[#243b55] text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 font-sans">
                    Template & Live Preview
                  </div>
                )}
              </button>

              {/* Sub: Gateway WA Fonnte */}
              <button
                type="button"
                onClick={() => {
                  onOpenSuperAdminSettings('WHATSAPP');
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#243b55] dark:hover:text-white transition-all cursor-pointer group relative"
                title="Integrasi & Uji Coba WhatsApp Gateway Fonnte"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#2e856e] shrink-0" />
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate text-[11px]">Gateway WA Fonnte</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-[#243b55] text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 font-sans">
                    Gateway WA Fonnte
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Section 4: Mode Tampilan & Layar Penuh */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Mode Tampilan
              </span>
            )}

            {/* Toggle Lebar Penuh (Fluid Width) */}
            <button
              type="button"
              onClick={onToggleWideView}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer group relative ${
                isWideView
                  ? 'bg-[#2e856e]/10 text-[#2e856e] border border-[#2e856e]/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isWideView ? 'Ganti ke Lebar Standar (Max 1280px)' : 'Perlebar Konten ke Layar Penuh (Fluid Width)'}
            >
              <Sliders className="w-3.5 h-3.5 text-[#2e856e] shrink-0" />
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate text-[11px]">
                    {isWideView ? 'Lebar Penuh Aktif' : 'Tampilan Lebar'}
                  </span>
                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                    isWideView ? 'bg-[#2e856e] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isWideView ? '100%' : 'Std'}
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-[#243b55] text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 font-sans">
                  {isWideView ? 'Lebar 100%' : 'Lebar Standar'}
                </div>
              )}
            </button>

            {/* Toggle Full Screen API */}
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group relative"
              title={isFullscreen ? 'Keluar dari Layar Penuh (Exit Fullscreen)' : 'Tampilan Layar Penuh (Fullscreen Mode)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-[#2c4c70] dark:text-sky-400 shrink-0" />
              )}
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate text-[11px]">
                  {isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
                </span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-[#243b55] text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 font-sans">
                  {isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
                </div>
              )}
            </button>

            {/* Reset Data Button */}
            <button
              type="button"
              onClick={onResetData}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer group relative"
              title="Reset data demo kembali ke kondisi awal"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate text-[11px]">Reset Data Demo</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-[#243b55] text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 font-sans">
                  Reset Data Demo
                </div>
              )}
            </button>
          </div>

        </div>

        {/* Footer: User Role Selector & Profile */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95 space-y-1.5 shrink-0">
          
          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="w-full flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs transition-colors cursor-pointer shadow-2xs"
              title="Ganti Peran Simulasi Hak Akses"
            >
              <div className="w-6 h-6 rounded-lg bg-[#2c4c70]/10 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {currentRoleObj.icon}
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left truncate">
                    <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Peran Aktif</span>
                    <span className="font-extrabold text-[11px] text-[#243b55] dark:text-white truncate block leading-tight">
                      {currentRoleObj.label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </>
              )}
            </button>

            {/* Role Switcher Menu Popup */}
            {showRoleDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-extrabold text-slate-400 px-2 py-1 block uppercase">
                  Pilih Peran Pengguna
                </span>
                {roles.map((r) => {
                  const isActive = currentRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onRoleChange(r.id);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#2c4c70]/10 dark:bg-[#2e856e]/20 text-[#243b55] dark:text-white font-bold border border-[#2c4c70]/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                        {r.icon}
                      </div>
                      <div className="flex-1 truncate">
                        <span className="block truncate font-bold">{r.label}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{r.desc}</span>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#2e856e] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Account & Logout */}
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{currentUser?.avatar || '👨‍💼'}</span>
              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-xs font-extrabold text-[#243b55] dark:text-white block truncate leading-tight">
                    {currentUser?.name || 'Petugas Balai POM'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate leading-tight">
                    {currentUser?.nip ? `NIP: ${currentUser.nip}` : currentRole}
                  </span>
                </div>
              )}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Keluar / Logout Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
