import React, { useState, useEffect } from 'react';
import { UserRole, AuthAccount } from '../types';
import { SuperAdminTab } from './SuperAdminSettingsModal';
import { 
  Search, 
  RefreshCw, 
  UserCheck, 
  Building2, 
  ClipboardCheck, 
  Upload, 
  Award,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Menu,
  Sliders,
  CheckCircle2,
  Bell,
  Sun,
  Moon
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
  onOpenNotificationSettings,
  onLogout,
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('simoncer_theme');
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else if (saved === 'light') {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    } catch {}
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('simoncer_theme', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('simoncer_theme', 'light'); } catch {}
    }
  };

  const roles: { id: UserRole; label: string; shortLabel: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'ADMIN',
      label: 'Admin Balai',
      shortLabel: 'Admin',
      icon: <UserCheck className="w-4 h-4 text-[#2e856e]" />,
      desc: 'Upload surat SRIKANDI TTE Kepala Balai, pilih petugas PIC, kelola akun & inspeksi',
    },
    {
      id: 'PETUGAS_EVALUATOR',
      label: 'Petugas / Evaluator',
      shortLabel: 'Evaluator',
      icon: <ClipboardCheck className="w-4 h-4 text-sky-500" />,
      desc: 'Terima notifikasi penugasan via WA, periksa bukti CAPA sarana, & lakukan validasi',
    },
    {
      id: 'SUPERVISOR',
      label: 'Supervisor (Kepala Balai)',
      shortLabel: 'Supervisor',
      icon: <Award className="w-4 h-4 text-purple-500" />,
      desc: 'Supervisi kepatuhan SLA, monitoring kinerja evaluator, & pengesahan laporan CAPA',
    },
    {
      id: 'SARANA',
      label: 'Portal Publik Sarana',
      shortLabel: 'Sarana',
      icon: <Building2 className="w-4 h-4 text-amber-500" />,
      desc: 'Tampilan publik bagi pelaku usaha untuk lacak status & kirim dokumen tanpa akun',
    },
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <header className="bpom-header-navy text-white sticky top-0 z-30 transition-colors">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left: Sidebar Toggle & Page Title / Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl lg:hidden cursor-pointer shrink-0 transition-colors"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-[#22c55e]" />
            </button>

            {/* Desktop Sidebar Toggle Button */}
            {isSidebarHidden ? (
              <button
                type="button"
                onClick={onToggleHideSidebar}
                className="hidden lg:flex px-3 py-1.5 bg-[#2e856e] hover:bg-[#256d5a] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 items-center gap-1.5 shadow-sm"
                title="Tampilkan Kembali Menu Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-white" />
                <span>Buka Menu Sidebar</span>
              </button>
            ) : onToggleSidebar ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer shrink-0 items-center gap-1.5 border border-white/15"
                title={isSidebarCollapsed ? 'Tampilkan Menu Sidebar Lengkap' : 'Ciutkan Menu Sidebar untuk Tampilan Lebih Lebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-[#22c55e]" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-white/80" />
                )}
                <span className="text-xs font-semibold text-white/90 hidden xl:inline">
                  {isSidebarCollapsed ? 'Buka Menu' : 'Ciutkan Menu'}
                </span>
              </button>
            ) : null}

            {/* Current View Breadcrumb (Visible on both Mobile & Desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onSelectHomeTab && onSelectHomeTab('HOME')}
                className="flex items-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base tracking-tight text-white hover:text-[#86efac] transition-colors cursor-pointer shrink-0"
              >
                <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0">
                  <img
                    src="/assets/aistudio/logo-simoncer_467003a7.webp"
                    alt="SIMONCER"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-white font-black tracking-tight">
                  SIMONCER
                </span>
              </button>
              <span className="text-white/40">/</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#86efac] truncate">
                {activeHomeTab === 'HOME'
                  ? 'Beranda'
                  : activeHomeTab === 'DASHBOARD'
                  ? 'Temuan'
                  : activeHomeTab === 'DOCUMENTS'
                  ? 'Dokumen'
                  : activeHomeTab === 'INSPECTIONS'
                  ? 'Sesi CAPA'
                  : 'SIBERGAS'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/15 text-white border border-white/20 whitespace-nowrap shrink-0 hidden 2xl:inline">
                {currentRoleObj.label}
              </span>
            </div>
          </div>

          {/* Right: Display Controls, Quick Search, Upload, Theme Toggle, and User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Track Button */}
            <button
              onClick={onOpenTracking}
              type="button"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer group"
              title="Lacak progres CAPA dengan mengetik kode unik"
            >
              <Search className="w-3.5 h-3.5 text-[#86efac] group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden md:inline">Lacak CAPA</span>
            </button>

            {/* Upload Surat SRIKANDI (Khusus Admin Balai) */}
            {currentRole === 'ADMIN' && (
              <button
                onClick={onOpenNewInspection}
                type="button"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-extrabold text-white bg-[#2e856e] hover:bg-[#256d5a] rounded-xl shadow-md shadow-[#2e856e]/30 border border-white/20 transition-all cursor-pointer shrink-0"
                title="Upload surat hasil download dari SRIKANDI (TTE Kepala Balai)"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Upload Surat</span>
              </button>
            )}

            {/* Display Mode: Wide View Toggle */}
            {onToggleWideView && (
              <button
                type="button"
                onClick={onToggleWideView}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isWideView
                    ? 'bg-[#2e856e] text-white border-white/30 shadow-xs'
                    : 'bg-white/10 text-white/90 hover:text-white border-white/20 hover:bg-white/20'
                }`}
                title={isWideView ? 'Ganti ke Lebar Standar (Max 1280px)' : 'Perlebar Layar ke Lebar Penuh (Fluid 100%)'}
              >
                <Sliders className="w-3.5 h-3.5 text-white" />
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer relative"
                title="Sesuaikan Pengaturan Notifikasi Otomatis (WhatsApp & Email)"
              >
                <Bell className="w-3.5 h-3.5 text-[#86efac]" />
                <span className="hidden xl:inline">Notifikasi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" />
              </button>
            )}

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              title={isDarkMode ? 'Beralih ke Mode Terang (BPOM Clean Light)' : 'Beralih ke Mode Gelap (Dark Mode)'}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-sky-200" />
              )}
            </button>

            {/* Display Mode: Full Screen Toggle */}
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Mode Layar Penuh (Full Screen)'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            )}

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              type="button"
              title="Reset data demo kembali ke kondisi awal"
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors cursor-pointer hidden md:block"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white text-[#243b55] hover:bg-slate-100 text-xs font-extrabold transition-colors cursor-pointer shadow-sm"
                title="Ganti Peran Hak Akses"
              >
                <span className="w-2 h-2 rounded-full bg-[#2e856e] shrink-0"></span>
                <span className="hidden sm:inline">{currentRoleObj.label}</span>
                <span className="sm:hidden text-[11px]">{currentRoleObj.shortLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#243b55]/70 shrink-0" />
              </button>

              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                    <span className="text-[10px] font-extrabold text-slate-400 px-2 py-1 block uppercase tracking-wider">
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
                </>
              )}
            </div>

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-white/20">
              <span className="text-sm shrink-0 p-1 rounded-lg bg-white/15 border border-white/20" title={currentUser?.name || 'Petugas Balai'}>
                {currentUser?.avatar || '👨‍💼'}
              </span>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-white/80 hover:text-rose-200 hover:bg-rose-500/30 rounded-xl transition-colors cursor-pointer shrink-0"
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
