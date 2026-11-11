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
  Sparkles, 
  FileCheck2, 
  Upload, 
  Users, 
  Award,
  LogOut,
  ExternalLink,
  ChevronDown,
  MessageSquare,
  Settings,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Menu,
  Sliders,
  CheckCircle2,
  Home,
  FileText,
  Bell
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  currentUser: AuthAccount | null;
  onRoleChange: (role: UserRole) => void;
  onOpenTracking: () => void;
  onOpenNewInspection: () => void;
  onResetData: () => void;
  onOpenOfficerDirectory?: () => void;
  onOpenAccountManagement?: () => void;
  onOpenWaGatewaySettings?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenSuperAdminSettings?: (tab?: SuperAdminTab) => void;
  onOpenSibergasTable?: () => void;
  onLogout?: () => void;
  onOpenPublicPortal?: () => void;
  // Sidebar & Display Mode Controls
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isSidebarHidden?: boolean;
  onToggleHideSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  isWideView?: boolean;
  onToggleWideView?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  activeHomeTab?: 'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE';
  onSelectHomeTab?: (tab: 'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUser,
  onRoleChange,
  onOpenTracking,
  onOpenNewInspection,
  onResetData,
  onOpenOfficerDirectory,
  onOpenAccountManagement,
  onOpenWaGatewaySettings,
  onOpenNotificationSettings,
  onOpenSuperAdminSettings,
  onOpenSibergasTable,
  onLogout,
  onOpenPublicPortal,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isSidebarHidden = false,
  onToggleHideSidebar,
  onOpenMobileSidebar,
  isWideView = false,
  onToggleWideView,
  isFullscreen = false,
  onToggleFullscreen,
  activeHomeTab = 'HOME',
  onSelectHomeTab,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'ADMIN',
      label: 'Admin Balai',
      icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
      desc: 'Upload surat SRIKANDI TTE Kepala Balai, pilih petugas PIC, kelola akun & inspeksi',
    },
    {
      id: 'PETUGAS_EVALUATOR',
      label: 'Petugas / Evaluator',
      icon: <ClipboardCheck className="w-4 h-4 text-teal-400" />,
      desc: 'Terima notifikasi penugasan via WA, periksa bukti CAPA sarana, & lakukan validasi',
    },
    {
      id: 'SUPERVISOR',
      label: 'Supervisor (Kepala Balai)',
      icon: <Award className="w-4 h-4 text-purple-400" />,
      desc: 'Supervisi kepatuhan SLA, monitoring kinerja evaluator, & pengesahan laporan CAPA',
    },
    {
      id: 'SARANA',
      label: 'Portal Publik Sarana',
      icon: <Building2 className="w-4 h-4 text-blue-400" />,
      desc: 'Tampilan publik bagi pelaku usaha untuk lacak status & kirim dokumen tanpa akun',
    },
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <header className="glass-header border-b border-slate-800/80 text-white sticky top-0 z-30 shadow-xs transition-colors">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-2 sm:gap-4">
          
          {/* Left: Sidebar Toggle & Page Title / Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl lg:hidden cursor-pointer shrink-0 transition-colors"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            {/* Desktop Sidebar Toggle Button */}
            {isSidebarHidden ? (
              <button
                type="button"
                onClick={onToggleHideSidebar}
                className="hidden lg:flex px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 items-center gap-1.5 shadow-sm shadow-emerald-950/40"
                title="Tampilkan Kembali Menu Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-white" />
                <span>Buka Menu Sidebar</span>
              </button>
            ) : onToggleSidebar ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer shrink-0 items-center gap-1.5 border border-slate-750/70"
                title={isSidebarCollapsed ? 'Tampilkan Menu Sidebar Lengkap' : 'Ciutkan Menu Sidebar untuk Tampilan Lebih Lebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-semibold text-slate-300 hidden xl:inline">
                  {isSidebarCollapsed ? 'Buka Menu' : 'Sembunyikan'}
                </span>
              </button>
            ) : null}

            {/* Current View Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onSelectHomeTab && onSelectHomeTab('HOME')}
                className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-tight text-white hover:text-emerald-400 transition-colors hidden sm:inline-flex cursor-pointer"
              >
                <img
                  src="/assets/aistudio/logo-simoncer_467003a7.webp"
                  alt="SIMONCER"
                  className="w-5 h-5 object-contain rounded drop-shadow-sm"
                />
                <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-extrabold tracking-tight">
                  SIMONCER
                </span>
              </button>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 truncate">
                {activeHomeTab === 'HOME'
                  ? 'Home'
                  : activeHomeTab === 'DASHBOARD'
                  ? 'Dashboard Temuan'
                  : activeHomeTab === 'DOCUMENTS'
                  ? 'Manajemen Dokumen'
                  : activeHomeTab === 'INSPECTIONS'
                  ? 'Daftar Sesi CAPA'
                  : 'Tabel Hasil Survei SIBERGAS'}
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/80 hidden md:inline">
                {currentRoleObj.label}
              </span>
            </div>
          </div>

          {/* Right: Display Controls, Quick Search, Upload, and User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Quick Track Button */}
            <button
              onClick={onOpenTracking}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-xl transition-all shadow-2xs cursor-pointer group"
              title="Lacak progres CAPA dengan mengetik kode unik"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden md:inline">Lacak CAPA</span>
              <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                Lacak
              </kbd>
            </button>

            {/* Upload Surat SRIKANDI (Khusus Admin Balai) */}
            {currentRole === 'ADMIN' && (
              <button
                onClick={onOpenNewInspection}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-xs shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                title="Upload surat hasil download dari SRIKANDI (TTE Kepala Balai)"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Upload Surat</span>
                <span className="sm:hidden">Upload</span>
              </button>
            )}

            {/* Display Mode: Wide View Toggle */}
            {onToggleWideView && (
              <button
                type="button"
                onClick={onToggleWideView}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  isWideView
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-2xs'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-750'
                }`}
                title={isWideView ? 'Ganti ke Lebar Standar (Max 1280px)' : 'Perlebar Layar ke Lebar Penuh (Fluid 100%)'}
              >
                <Sliders className={`w-3.5 h-3.5 ${isWideView ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden lg:inline">
                  {isWideView ? 'Lebar 100%' : 'Lebar Penuh'}
                </span>
              </button>
            )}

            {/* Notifikasi Otomatis (WhatsApp & Email) */}
            {onOpenNotificationSettings && (
              <button
                type="button"
                onClick={onOpenNotificationSettings}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition-all cursor-pointer relative"
                title="Sesuaikan Pengaturan Notifikasi Otomatis (WhatsApp & Email)"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Notifikasi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            {/* Display Mode: Full Screen Toggle */}
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl border border-slate-700/80 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Mode Layar Penuh (Full Screen)'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>
            )}

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              type="button"
              title="Reset data demo kembali ke kondisi awal"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl border border-slate-700/70 transition-colors cursor-pointer hidden md:block"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                title="Ganti Peran Hak Akses"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="hidden sm:inline">{currentRoleObj.label}</span>
                <span className="sm:hidden">{currentRole}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-750 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1 block uppercase tracking-wider">
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
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-800 shrink-0">
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

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-sm shrink-0 p-1 rounded-lg bg-slate-800/80 border border-slate-700/60" title={currentUser?.name || 'Petugas Balai'}>
                {currentUser?.avatar || '👨‍💼'}
              </span>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Keluar / Logout Akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
