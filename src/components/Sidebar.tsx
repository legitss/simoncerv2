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
  FileCheck2, 
  Upload, 
  Users, 
  Award,
  LogOut,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Settings,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Sparkles,
  Smartphone,
  Printer,
  X,
  Compass,
  Sliders,
  CheckCircle2,
  Table,
  Home,
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Bell
} from 'lucide-react';

export interface SidebarProps {
  currentRole: UserRole;
  currentUser: AuthAccount | null;
  activeHomeTab: 'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE';
  onSelectHomeTab: (tab: 'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE') => void;
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
  onOpenNotificationSettings,
  onOpenSuperAdminSettings,
  onOpenPrintReport,
  onResetData,
  onLogout,
  onOpenPublicPortal,
  isWideView,
  onToggleWideView,
  isFullscreen,
  onToggleFullscreen,
  isHidden = false,
  onToggleHide,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string; badge: string }[] = [
    {
      id: 'ADMIN',
      label: 'Admin Balai POM',
      icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
      desc: 'Upload surat SRIKANDI TTE, tunjuk petugas PIC, & kelola akun',
      badge: 'Admin',
    },
    {
      id: 'PETUGAS_EVALUATOR',
      label: 'Petugas / Evaluator',
      icon: <ClipboardCheck className="w-4 h-4 text-teal-400" />,
      desc: 'Telaah bukti CAPA sarana & verifikasi pemenuhan standar',
      badge: 'Evaluator',
    },
    {
      id: 'SUPERVISOR',
      label: 'Supervisor (Kepala Balai)',
      icon: <Award className="w-4 h-4 text-purple-400" />,
      desc: 'Supervisi SLA 14 hari, evaluasi kinerja, & berita acara',
      badge: 'Supervisor',
    },
    {
      id: 'SARANA',
      label: 'Portal Pelaku Usaha',
      icon: <Building2 className="w-4 h-4 text-blue-400" />,
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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col bg-slate-950 text-slate-200 border-r border-slate-800/80 shadow-2xl transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/90 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md shadow-emerald-500/20 shrink-0 border border-slate-700 flex items-center justify-center">
              <img
                src="/assets/aistudio/logo-simoncer_467003a7.webp"
                alt="Logo SIMONCER"
                className="w-full h-full object-contain"
              />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    SIMONCER
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    BBPOM
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">
                  Semarang • CAPA Integrated
                </span>
              </div>
            )}
          </div>

          {/* Collapse/Expand Toggle Button (Desktop) & Close Button (Mobile) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Perlebar Sidebar (Expand Menu)' : 'Ciutkan Sidebar (Collapse Menu)'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-emerald-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {onToggleHide && (
              <button
                type="button"
                onClick={onToggleHide}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Sembunyikan Sidebar Sepenuhnya (Hide Sidebar)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Section 1: Navigasi Utama */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'HOME'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title="Home • Dashboard Kinerja, Evaluasi, & Ringkasan Alur"
            >
              <Home className={`w-4 h-4 shrink-0 ${activeHomeTab === 'HOME' ? 'text-slate-950' : 'text-emerald-400'}`} />
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Home</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  Home (Beranda)
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'DASHBOARD'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title="Dashboard Interaktif Ringkasan Visual Status Temuan & CAPA"
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeHomeTab === 'DASHBOARD' ? 'text-slate-950' : 'text-emerald-400'}`} />
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Dashboard Temuan</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'DOCUMENTS'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title="Sistem Manajemen Dokumen Pemeriksaan (Surat TL, Bukti, Hasil Evaluasi, & Jejak Audit)"
            >
              <FolderOpen className={`w-4 h-4 shrink-0 ${activeHomeTab === 'DOCUMENTS' ? 'text-slate-950' : 'text-emerald-400'}`} />
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Manajemen Dokumen</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'INSPECTIONS'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title="Daftar Sesi CAPA Sarana (Pemeriksaan & Tindak Lanjut)"
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeHomeTab === 'INSPECTIONS' ? 'text-slate-950' : 'text-emerald-400'}`} />
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">Daftar Sesi CAPA</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono tabular-nums font-bold ${
                    activeHomeTab === 'INSPECTIONS'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {inspectionsCount}
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer group relative ${
                activeHomeTab === 'SIBERGAS_TABLE'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title="Tabel & Rekap Hasil Survei Integritas Petugas (SIBERGAS)"
            >
              <ShieldCheck className={`w-4 h-4 shrink-0 ${activeHomeTab === 'SIBERGAS_TABLE' ? 'text-slate-950' : 'text-emerald-400'}`} />
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">Survei SIBERGAS</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono tabular-nums font-bold ${
                    activeHomeTab === 'SIBERGAS_TABLE'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-emerald-400'
                  }`}>
                    {surveysCount}
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  Survei SIBERGAS ({surveysCount})
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer group relative"
              title="Lacak status CAPA secara cepat menggunakan Kode Unik"
            >
              <Search className="w-4 h-4 text-emerald-400 shrink-0" />
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Lacak Kode CAPA</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  Lacak Kode CAPA
                </div>
              )}
            </button>
          </div>

          {/* Section 2: Operasional & Tindak Lanjut */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-all cursor-pointer group relative"
                title="Upload surat SRIKANDI TTE untuk terbitkan kode CAPA baru"
              >
                <Upload className="w-4 h-4 shrink-0 text-white" />
                
                {!isCollapsed ? (
                  <>
                    <span className="flex-1 text-left truncate font-bold">Upload Surat (TTE)</span>
                    <span className="text-[9px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      Baru
                    </span>
                  </>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                    Upload Surat SRIKANDI (TTE)
                  </div>
                )}
              </button>
            )}

            {/* Direktori Petugas / PIC Evaluator (Hanya untuk Admin & Supervisor, disembunyikan pada role Petugas/Evaluator) */}
            {onOpenOfficerDirectory && currentRole !== 'PETUGAS_EVALUATOR' && (
              <button
                type="button"
                onClick={() => {
                  onOpenOfficerDirectory();
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer group relative"
                title="Lihat & kelola data Petugas/Evaluator Balai"
              >
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate">Direktori Petugas PIC</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer group relative"
                title="Cetak Laporan Rekapitulasi Pengawasan & CAPA Balai"
              >
                <Printer className="w-4 h-4 text-purple-400 shrink-0" />
                
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate">Cetak Rekap Balai</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer group relative"
              title="Beralih ke tampilan publik portal sarana / pelaku usaha"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">Portal Publik Sarana</span>
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/50">
                    Publik
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  Portal Publik Sarana
                </div>
              )}
            </button>
          </div>

          {/* Section 3: Pusat Pengaturan Terpadu (Notifikasi & Sistem) */}
          {(currentRole === 'ADMIN' || currentRole === 'SUPERVISOR') && onOpenSuperAdminSettings && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="flex items-center justify-between px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pengaturan SIMONCER
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 shadow-sm transition-all cursor-pointer group relative"
                title="Pusat Pengaturan Terpadu: Pemicu Notifikasi, Saluran, Template & Live Preview, Gateway WA Fonnte, Akun & Petugas"
              >
                <Settings className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform shrink-0" />
                
                {!isCollapsed ? (
                  <>
                    <span className="flex-1 text-left truncate">Menu Pengaturan</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Semua Opsi
                    </span>
                  </>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 whitespace-nowrap z-50 font-sans">
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs text-slate-300 hover:bg-slate-900/60 hover:text-emerald-400 transition-all cursor-pointer group relative"
                title="Sesuaikan Saluran (WA & Email) & Pemicu Notifikasi Otomatis"
              >
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate text-[11px]">Pemicu & Saluran Notif</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs text-slate-300 hover:bg-slate-900/60 hover:text-cyan-400 transition-all cursor-pointer group relative"
                title="Edit Teks Pesan WhatsApp & Email serta Live Preview"
              >
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate text-[11px]">Template & Live Preview</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs text-slate-300 hover:bg-slate-900/60 hover:text-emerald-400 transition-all cursor-pointer group relative"
                title="Integrasi & Uji Coba WhatsApp Gateway Fonnte"
              >
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate text-[11px]">Gateway WA Fonnte</span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                    Gateway WA Fonnte
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Section 4: Mode Tampilan & Layar Penuh (Wide / Full Screen) */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mode Tampilan
              </span>
            )}

            {/* Toggle Lebar Penuh (Fluid Width) */}
            <button
              type="button"
              onClick={onToggleWideView}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer group relative ${
                isWideView
                  ? 'bg-slate-900 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title={isWideView ? 'Ganti ke Lebar Standar (Max 1280px)' : 'Perlebar Konten ke Layar Penuh (Fluid Width)'}
            >
              <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
              
              {!isCollapsed ? (
                <>
                  <span className="flex-1 text-left truncate">
                    {isWideView ? 'Tampilan Lebar Aktif' : 'Tampilan Lebih Lebar'}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    isWideView ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isWideView ? '100%' : 'Standar'}
                  </span>
                </>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  {isWideView ? 'Lebar 100%' : 'Lebar Standar'}
                </div>
              )}
            </button>

            {/* Toggle Full Screen API */}
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer group relative"
              title={isFullscreen ? 'Keluar dari Layar Penuh (Exit Fullscreen)' : 'Tampilan Layar Penuh (Fullscreen Mode)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Maximize2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">
                  {isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
                </span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  {isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
                </div>
              )}
            </button>

            {/* Sembunyikan Sidebar Sepenuhnya (Hide Sidebar untuk Full Screen / Max Width) */}
            {onToggleHide && (
              <button
                type="button"
                onClick={onToggleHide}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all cursor-pointer group relative border border-rose-900/30"
                title="Sembunyikan menu sidebar sepenuhnya untuk ruang tampilan layar maksimal"
              >
                <PanelLeftClose className="w-4 h-4 text-rose-400 shrink-0" />
                
                {!isCollapsed ? (
                  <span className="flex-1 text-left truncate">
                    Sembunyikan Sidebar
                  </span>
                ) : (
                  <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                    Sembunyikan Sidebar
                  </div>
                )}
              </button>
            )}

            {/* Reset Data Button */}
            <button
              type="button"
              onClick={onResetData}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all cursor-pointer group relative"
              title="Reset data demo kembali ke kondisi awal"
            >
              <RefreshCw className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
              
              {!isCollapsed ? (
                <span className="flex-1 text-left truncate">Reset Data Demo</span>
              ) : (
                <div className="absolute left-full ml-2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 font-sans">
                  Reset Data Demo
                </div>
              )}
            </button>
          </div>

        </div>

        {/* Footer: User Role Selector & Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/95 space-y-2 shrink-0">
          
          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs transition-colors cursor-pointer"
              title="Ganti Peran Simulasi Hak Akses"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                {currentRoleObj.icon}
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left truncate">
                    <span className="text-[10px] text-slate-400 block leading-tight">Peran Aktif</span>
                    <span className="font-bold text-slate-100 truncate block leading-tight">
                      {currentRoleObj.label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </>
              )}
            </button>

            {/* Role Switcher Menu Popup */}
            {showRoleDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-bold text-slate-400 px-2 py-1 block uppercase">
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
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="p-1 rounded-lg bg-slate-800 shrink-0">
                        {r.icon}
                      </div>
                      <div className="flex-1 truncate">
                        <span className="block truncate font-semibold">{r.label}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{r.desc}</span>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
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
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {currentUser?.name || 'Petugas Balai POM'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate leading-tight">
                    {currentUser?.nip ? `NIP: ${currentUser.nip}` : currentRole}
                  </span>
                </div>
              )}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
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
