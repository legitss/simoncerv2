import React, { useState, useEffect, useMemo } from 'react';
import { 
  InspectionSession, 
  UserRole, 
  AuthAccount,
  SystemNotification,
  InspectionStatus
} from './types';
import { 
  loadInspections, 
  saveInspections, 
  resetInspectionsToDefault, 
  createNotification, 
  createAuditLog 
} from './utils/storage';
import { getCurrentUser, setCurrentUser as persistCurrentUser, DEFAULT_ACCOUNTS, syncAllAccountsAndOfficers } from './utils/auth';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PublicLandingView } from './components/PublicLandingView';
import { LoginModal } from './components/LoginModal';
import { AccountManagementModal } from './components/AccountManagementModal';
import { SupervisorOversightBanner } from './components/SupervisorOversightBanner';
import { DashboardStats } from './components/DashboardStats';
import { OfficerEvaluationDashboard } from './components/OfficerEvaluationDashboard';
import { InspectionList } from './components/InspectionList';
import { TrackingModal } from './components/TrackingModal';
import { SrikandiLetterModal } from './components/SrikandiLetterModal';
import { SrikandiWorkflowModal } from './components/SrikandiWorkflowModal';
import { SubmitCapaModal } from './components/SubmitCapaModal';
import { EvaluationModal } from './components/EvaluationModal';
import { NotificationPreviewModal } from './components/NotificationPreviewModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { NewInspectionModal } from './components/NewInspectionModal';
import { PrintReportView } from './components/PrintReportView';
import { OfficerDirectoryModal } from './components/OfficerDirectoryModal';
import { WhatsAppGatewaySettingsModal } from './components/WhatsAppGatewaySettingsModal';
import { SuperAdminSettingsModal, SuperAdminTab } from './components/SuperAdminSettingsModal';
import { SibergasSurveyModal } from './components/SibergasSurveyModal';
import { SibergasSurveyTable } from './components/SibergasSurveyTable';
import { CapaMatrixFullPageView } from './components/CapaMatrixFullPageView';
import { InteractiveFindingsDashboard } from './components/InteractiveFindingsDashboard';
import { SessionDocumentManager } from './components/SessionDocumentManager';
import { sendSrikandiLetterNotification, sendCapaSubmittedNotification } from './utils/whatsappGateway';
import { createAutomaticNotifications, getNotificationPreferences } from './utils/notificationService';
import { SibergasSurveyData, AuditTrailLog } from './types';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Bell, 
  Sparkles, 
  ArrowRight, 
  Info, 
  Clock, 
  Send, 
  FileCheck2, 
  Search,
  ExternalLink,
  FileText,
  Home,
  LayoutDashboard,
  FolderOpen,
  X
} from 'lucide-react';

export default function App() {
  const [inspections, setInspections] = useState<InspectionSession[]>([]);
  
  // Auth & Roles State
  // Default: Visitor / Sarana Pelaku Usaha sees the public landing page unless logged in
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(() => getCurrentUser());
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const user = getCurrentUser();
    return user ? user.role : 'SARANA';
  });

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isOfficerOnlyFilter, setIsOfficerOnlyFilter] = useState<boolean>(true);

  // Compute displayed inspections for current role and logged-in user
  const displayedInspections = useMemo(() => {
    if (currentRole === 'PETUGAS_EVALUATOR' && currentUser && isOfficerOnlyFilter) {
      const currentUserName = (currentUser.name || '').toLowerCase();
      const currentUserNip = (currentUser.nip || '').trim();
      const currentUserId = currentUser.id;

      return inspections.filter((ins) => {
        // 1. Check assignedOfficer
        if (ins.assignedOfficer) {
          if (currentUserId && ins.assignedOfficer.id === currentUserId) return true;
          if (currentUserNip && ins.assignedOfficer.nip && ins.assignedOfficer.nip.trim() === currentUserNip) return true;
          if (ins.assignedOfficer.name && (
            ins.assignedOfficer.name.toLowerCase().includes(currentUserName) ||
            currentUserName.includes(ins.assignedOfficer.name.toLowerCase())
          )) {
            return true;
          }
        }
        // 2. Check leadAuditor
        if (ins.leadAuditor) {
          const lead = ins.leadAuditor.toLowerCase();
          if (lead.includes(currentUserName) || currentUserName.includes(lead)) {
            return true;
          }
        }
        // 3. Check auditorTeam
        if (ins.auditorTeam && ins.auditorTeam.length > 0) {
          if (ins.auditorTeam.some((auditor) => {
            const a = auditor.toLowerCase();
            return a.includes(currentUserName) || currentUserName.includes(a);
          })) {
            return true;
          }
        }
        return false;
      });
    }
    return inspections;
  }, [inspections, currentRole, currentUser, isOfficerOnlyFilter]);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInitialCode, setTrackingInitialCode] = useState<string | undefined>(undefined);
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionSession | null>(null);
  
  const [isSrikandiModalOpen, setIsSrikandiModalOpen] = useState(false);
  const [isSrikandiWorkflowOpen, setIsSrikandiWorkflowOpen] = useState(false);
  const [isSubmitCapaModalOpen, setIsSubmitCapaModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isNotificationPreviewModalOpen, setIsNotificationPreviewModalOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isOfficerDirectoryOpen, setIsOfficerDirectoryOpen] = useState(false);
  const [isWaGatewaySettingsOpen, setIsWaGatewaySettingsOpen] = useState(false);
  const [isSuperAdminSettingsOpen, setIsSuperAdminSettingsOpen] = useState(false);
  const [superAdminInitialTab, setSuperAdminInitialTab] = useState<SuperAdminTab>('NOTIFIKASI');
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [liveNotificationBanner, setLiveNotificationBanner] = useState<{
    show: boolean;
    channel: string;
    title: string;
    message: string;
  } | null>(null);

  // SIBERGAS Survey Modal states
  const [isSibergasSurveyModalOpen, setIsSibergasSurveyModalOpen] = useState(false);
  const [isSibergasSurveyReadOnly, setIsSibergasSurveyReadOnly] = useState(false);
  const [isSibergasSurveyFirstTime, setIsSibergasSurveyFirstTime] = useState(false);

  // Dedicated Full-Page CAPA Matrix & Survey View (NOT a popup modal!)
  const [fullPageMatrixInspection, setFullPageMatrixInspection] = useState<InspectionSession | null>(null);

  // Navigation view mode: 'HOME' (Beranda) | 'DASHBOARD' (Visual Dashboard Temuan) | 'DOCUMENTS' (Manajemen Dokumen) | 'INSPECTIONS' (Daftar Sesi CAPA) | 'SIBERGAS_TABLE' (Survei SIBERGAS)
  const [activeHomeTab, setActiveHomeTab] = useState<'HOME' | 'DASHBOARD' | 'DOCUMENTS' | 'INSPECTIONS' | 'SIBERGAS_TABLE'>('HOME');
  const [activeDocumentSessionId, setActiveDocumentSessionId] = useState<string | undefined>(undefined);

  const handleOpenDocumentManager = (sessionId?: string) => {
    setActiveDocumentSessionId(sessionId);
    setActiveHomeTab('DOCUMENTS');
  };

  // Sidebar & Layout Display state (collapse, hide, wide view, fullscreen)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('simoncer_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('simoncer_sidebar_hidden') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isWideView, setIsWideView] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('simoncer_wide_view');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('simoncer_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {}
  }, [isSidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('simoncer_sidebar_hidden', String(isSidebarHidden));
    } catch {}
  }, [isSidebarHidden]);

  useEffect(() => {
    try {
      localStorage.setItem('simoncer_wide_view', String(isWideView));
    } catch {}
  }, [isWideView]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleOpenSuperAdminSettings = (tab: SuperAdminTab = 'NOTIFIKASI') => {
    setSuperAdminInitialTab(tab);
    setIsSuperAdminSettingsOpen(true);
  };

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  // Initialize data and check QR Code tracking URL param
  useEffect(() => {
    // Bidirectional sync between Accounts and Officer Directory
    syncAllAccountsAndOfficers();

    const data = loadInspections();
    setInspections(data);

    // If scanned via QR Code with ?track=... or ?code=...
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trackCode = urlParams.get('track') || urlParams.get('code');
      if (trackCode) {
        setTrackingInitialCode(trackCode);
        setIsTrackingModalOpen(true);
        // Clean URL query without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const showToast = (title: string, description: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ title, description, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (account: AuthAccount) => {
    setCurrentUser(account);
    persistCurrentUser(account);
    setCurrentRole(account.role);
    showToast(
      'Login Berhasil!',
      `Selamat datang, ${account.name} (${account.role}). Dashboard internal diaktifkan.`
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    persistCurrentUser(null);
    setCurrentRole('SARANA');
    showToast('Telah Keluar', 'Anda telah keluar dari Portal Petugas. Kembali ke halaman utama publik.', 'info');
  };

  const handleRoleSwitch = (r: UserRole) => {
    setCurrentRole(r);
    if (r === 'PETUGAS_EVALUATOR') {
      if (!currentUser || currentUser.role !== 'PETUGAS_EVALUATOR') {
        const evalUser = DEFAULT_ACCOUNTS.find((a) => a.role === 'PETUGAS_EVALUATOR') || null;
        if (evalUser) {
          setCurrentUser(evalUser);
          persistCurrentUser(evalUser);
        }
      }
    } else if (r === 'ADMIN') {
      if (!currentUser || currentUser.role !== 'ADMIN') {
        const adminUser = DEFAULT_ACCOUNTS.find((a) => a.role === 'ADMIN') || null;
        if (adminUser) {
          setCurrentUser(adminUser);
          persistCurrentUser(adminUser);
        }
      }
    } else if (r === 'SUPERVISOR') {
      if (!currentUser || currentUser.role !== 'SUPERVISOR') {
        const superUser = DEFAULT_ACCOUNTS.find((a) => a.role === 'SUPERVISOR') || null;
        if (superUser) {
          setCurrentUser(superUser);
          persistCurrentUser(superUser);
        }
      }
    }
    showToast('Peran Aktif Diubah', `Anda saat ini menjelajah sebagai ${r}.`, 'info');
  };

  const handleUpdateInspection = (updated: InspectionSession) => {
    const nextList = inspections.map((i) => (i.id === updated.id ? updated : i));
    setInspections(nextList);
    saveInspections(nextList);
    setSelectedInspection(updated);
    showToast(
      'Pembaruan Berhasil!',
      `Sesi ${updated.capaCode} (${updated.facility.name}) telah diperbarui. Notifikasi otomatis telah dicatat.`
    );
  };

  const handleCreateInspection = (created: InspectionSession) => {
    const nextList = [created, ...inspections];
    setInspections(nextList);
    saveInspections(nextList);
    setSelectedInspection(created);
    showToast(
      'Pemeriksaan Berhasil Diterbitkan!',
      `Surat SRIKANDI TTE ${created.srikandiLetter.letterNo} dan Kode CAPA ${created.capaCode} terbit.`
    );
  };

  const handleResetData = () => {
    if (window.confirm('Kembalikan seluruh data demo SIMONCER ke kondisi awal?')) {
      const reset = resetInspectionsToDefault();
      setInspections(reset);
      setSelectedInspection(null);
      showToast('Data Direset', 'Semua data pemeriksaan telah dikembalikan ke dataset default.', 'info');
    }
  };

  const handleSendTestNotification = (
    channel: 'WHATSAPP' | 'EMAIL' | 'BOTH',
    sampleEvent: string = 'CAPA_DITERIMA',
    customText?: string
  ) => {
    const targetInspection = selectedInspection || inspections[0];
    if (!targetInspection) return;

    const prefs = getNotificationPreferences();
    const eventKey = (sampleEvent || 'CAPA_DITERIMA') as any;
    const autoNotifs = createAutomaticNotifications({
      triggerEvent: eventKey,
      inspection: targetInspection,
      additionalDetails: {
        newStatus: 'EVALUASI_PETUGAS',
        customNote: customText ? customText.slice(0, 100) : `Uji Coba Pengiriman Otomatis SIMONCER (${channel})`,
      },
    }, prefs);

    const filteredNotifs = autoNotifs
      .filter(n => {
        if (channel === 'WHATSAPP') return n.channel === 'WHATSAPP';
        if (channel === 'EMAIL') return n.channel === 'EMAIL';
        return true;
      })
      .map(n => {
        if (customText) {
          return {
            ...n,
            content: customText,
          };
        }
        return n;
      });

    if (filteredNotifs.length > 0) {
      setInspections(prev => prev.map(item => {
        if (item.id !== targetInspection.id) return item;
        return {
          ...item,
          notifications: [...filteredNotifs, ...item.notifications],
        };
      }));

      if (selectedInspection?.id === targetInspection.id) {
        setSelectedInspection(prev => prev ? {
          ...prev,
          notifications: [...filteredNotifs, ...prev.notifications],
        } : null);
      }

      setLiveNotificationBanner({
        show: true,
        channel: channel === 'BOTH' ? 'WhatsApp & Email' : channel,
        title: `Notifikasi Otomatis (${channel}) Terkirim!`,
        message: `Pesan uji coba (${eventKey}) berhasil disalurkan ke ${filteredNotifs.map(n => n.recipient).join(' dan ')}. Status: DELIVERED.`,
      });

      setTimeout(() => {
        setLiveNotificationBanner(null);
      }, 6000);
    }
  };

  const handleTriggerNotify = (channel: 'WHATSAPP' | 'EMAIL') => {
    if (!selectedInspection) return;

    const notif = createNotification(
      channel,
      channel === 'WHATSAPP'
        ? `${selectedInspection.facility.picPhone} (${selectedInspection.facility.picName})`
        : selectedInspection.facility.picEmail,
      `[SIMONCER] Pemberitahuan Status Pemeriksaan - ${selectedInspection.capaCode}`,
      `*PEMBERITAHUAN RESMI SIMONCER*\n\nYth. Pimpinan/PIC ${selectedInspection.facility.name},\n\nSesi Pemeriksaan Kode: *${selectedInspection.capaCode}*\n• No Surat SRIKANDI: ${selectedInspection.srikandiLetter.letterNo}\n• Status Saat Ini: *${selectedInspection.status}*\n• Batas Tindak Lanjut: ${selectedInspection.srikandiLetter.deadlineDate}\n\nSilakan akses portal SIMONCER:\nhttps://simoncer.id/track?code=${selectedInspection.capaCode}`,
      'SURAT_TINDAK_LANJUT'
    );

    const log = createAuditLog(
      `Notifikasi ${channel} Dikirimkan Ulang`,
      'SIMONCER Auto-Notifier',
      'Sistem',
      `Pemberitahuan terkirim ulang ke ${notif.recipient}.`,
      'purple'
    );

    const updated: InspectionSession = {
      ...selectedInspection,
      notifications: [notif, ...selectedInspection.notifications],
      auditTrail: [log, ...selectedInspection.auditTrail],
      updatedAt: new Date().toISOString(),
    };

    handleUpdateInspection(updated);

    if (channel === 'WHATSAPP') {
      sendSrikandiLetterNotification(selectedInspection).then((res) => {
        if (res.success) {
          showToast('WhatsApp Fonnte Terkirim!', res.message, 'success');
        } else {
          showToast('Status Gateway WhatsApp', res.message, 'info');
        }
      }).catch((err) => {
        console.error('Error sending WhatsApp message:', err);
      });
    } else {
      showToast(
        `Notifikasi ${channel} Terkirim!`,
        `Pesan otomatis berhasil dikirimkan ke pihak ${selectedInspection.facility.name}.`
      );
    }
  };

  // Open Tracking with optional code from Landing page
  const handleOpenTrackingFromLanding = (code?: string) => {
    setTrackingInitialCode(code);
    setIsTrackingModalOpen(true);
  };

  // Open Evaluation Modal with strict role enforcement (SARANA cannot access)
  const handleOpenEvaluation = (inspection?: InspectionSession) => {
    if (currentRole === 'SARANA') {
      showToast(
        'Akses Dibatasi: Role Sarana',
        'Role Sarana tidak diizinkan membuka menu evaluasi atau mengubah status verifikasi CAPA. Menu ini khusus Petugas / Evaluator dan Admin Balai.',
        'warning'
      );
      return;
    }
    if (inspection) setSelectedInspection(inspection);
    setIsEvaluationModalOpen(true);
  };

  // Request submit CAPA handler
  // User requested: "buat matrik ini tidak jadi pop up karena preview nya jadi mengecil atau harus geser kanan kiri untuk melihat seluruh dokumen capa nya"
  // Opens dedicated full-page matrix view (bukan pop-up)!
  // Enforces Step 1 (Survei SIBERGAS) first before unlocking Step 2 (Matriks CAPA Komoditi)!
  const handleRequestSubmitCapa = (inspection?: InspectionSession) => {
    let target = inspection;
    if (!target) {
      const waiting = inspections.find((i) => i.status === 'MENUNGGU_CAPA' || i.status === 'PERLU_PERBAIKAN');
      target = waiting || inspections[0];
    }
    if (!target) return;

    setSelectedInspection(target);
    setIsSubmitCapaModalOpen(false);
    setIsSibergasSurveyModalOpen(false);
    setFullPageMatrixInspection(target);
  };

  const handleSaveSibergasSurvey = (surveyData: SibergasSurveyData) => {
    if (!selectedInspection) return;

    const nowStr = new Date().toISOString();
    const newAuditLog: AuditTrailLog = {
      id: `LOG-${Date.now()}-SIBERGAS`,
      action: 'Sarana Mengisi Survei Integritas Petugas (SIBERGAS)',
      actor: selectedInspection.facility.picName,
      role: 'Sarana',
      timestamp: nowStr,
      details: `Survei integritas petugas SIBERGAS telah diisi oleh sarana sebagai prasyarat pengiriman CAPA pertama. Penilaian: ID Card (${surveyData.petugasIdCard.includes('Ya') ? 'Ya' : 'Tidak'}), Profesional (${surveyData.profesional.includes('Ya') ? 'Sopan & Profesional' : 'Kurang Sopan'}), Arogan (${surveyData.arogan.includes('Tidak') ? 'Bebas Arogan' : 'Arogan'}), Gratifikasi (${surveyData.gratifikasi.includes('Tidak') ? 'Bebas Gratifikasi' : 'Ada Gratifikasi'}), Pemerasan (${surveyData.pemerasan.includes('Tidak') ? 'Bebas Pemerasan' : 'Ada Pemerasan'}), SIMONCER Membantu (${surveyData.simoncerMembantu.includes('Ya') ? 'Ya' : 'Tidak'}). Masukan: ${surveyData.saranaMasukan ? `"${surveyData.saranaMasukan}"` : '(Tanpa catatan)'}.`,
      badgeType: 'success',
    };

    const updated: InspectionSession = {
      ...selectedInspection,
      sibergasSurvey: {
        ...surveyData,
        completed: true,
        submittedAt: surveyData.submittedAt || nowStr,
      },
      auditTrail: [newAuditLog, ...selectedInspection.auditTrail],
      updatedAt: nowStr,
    };

    handleUpdateInspection(updated);
    setSelectedInspection(updated);
    setIsSibergasSurveyModalOpen(false);

    if (isSibergasSurveyFirstTime) {
      showToast(
        'Survei SIBERGAS Berhasil Disimpan!',
        'Terima kasih telah mengisi survei integritas. Sekarang Anda dapat mengisi formulir & berkas CAPA.',
        'success'
      );
      // Open SubmitCapaModal immediately!
      setIsSubmitCapaModalOpen(true);
    } else {
      showToast('Survei SIBERGAS Diperbarui', 'Data kuesioner integritas berhasil diperbarui.', 'success');
    }
  };

  const handleOpenSurveyReadOnly = (inspection: InspectionSession) => {
    setSelectedInspection(inspection);
    setIsSibergasSurveyFirstTime(false);
    setIsSibergasSurveyReadOnly(true);
    setIsSibergasSurveyModalOpen(true);
  };

  // =========================================================================
  // AUTOMATIC STATUS TRANSITION: MENUNGGU_CAPA -> EVALUASI_PETUGAS
  // Mengubah status sesi langsung menjadi EVALUASI_PETUGAS saat sarana
  // menyerahkan CAPA serta memicu notifikasi WhatsApp ke Petugas yang ditunjuk.
  // =========================================================================
  const handleCapaSubmitted = async (submittedInspection: InspectionSession) => {
    const nowStr = new Date().toISOString();
    const officerName = submittedInspection.assignedOfficer?.name || submittedInspection.leadAuditor || 'Petugas Evaluator';
    const officerPhone = submittedInspection.assignedOfficer?.phone || '+62 812-7788-9911';

    const totalEvidenceCount = submittedInspection.findings.reduce(
      (acc, f) => acc + (f.capa?.evidenceFiles?.length || 0),
      0
    );

    // 1. Otomatis transisi status dari MENUNGGU_CAPA ke EVALUASI_PETUGAS
    const targetStatus: InspectionStatus = 'EVALUASI_PETUGAS';

    const transitionAuditLog: AuditTrailLog = {
      id: `LOG-${Date.now()}-TRANSITION`,
      action: 'Transisi Status Otomatis: MENUNGGU_CAPA ➔ EVALUASI_PETUGAS',
      actor: submittedInspection.facility.picName,
      role: 'Sarana',
      timestamp: nowStr,
      details: `Laporan CAPA dengan ${totalEvidenceCount} berkas bukti telah diserahkan. Sistem SIMONCER secara otomatis memperbarui status sesi dari MENUNGGU_CAPA menjadi EVALUASI_PETUGAS dan meneruskan penugasan verifikasi ke Petugas Evaluator ${officerName} (${officerPhone}).`,
      badgeType: 'info',
    };

    const finalInspection: InspectionSession = {
      ...submittedInspection,
      status: targetStatus,
      auditTrail: [transitionAuditLog, ...submittedInspection.auditTrail],
      updatedAt: nowStr,
    };

    // 2. Simpan pembaruan status ke sistem & memori
    handleUpdateInspection(finalInspection);
    if (fullPageMatrixInspection) {
      setFullPageMatrixInspection(finalInspection);
    }
    setIsSubmitCapaModalOpen(false);

    // 3. Memicu pengiriman notifikasi otomatis ke WhatsApp Petugas yang ditunjuk
    try {
      const waResult = await sendCapaSubmittedNotification(finalInspection, totalEvidenceCount);
      const toOfficerSuccess = waResult?.toOfficer?.success;

      showToast(
        'Laporan CAPA Berhasil Diserahkan!',
        `Status sesi otomatis berubah menjadi EVALUASI_PETUGAS. ${
          toOfficerSuccess
            ? `Notifikasi WhatsApp resmi telah berhasil dikirimkan ke Petugas ${officerName} (${officerPhone}).`
            : `Penugasan evaluasi telah dicatat di sistem untuk Petugas ${officerName}.`
        }`,
        'success'
      );
    } catch (err) {
      console.error('Error sending WhatsApp message on CAPA submit:', err);
      showToast(
        'Laporan CAPA Berhasil Diserahkan!',
        `Status sesi langsung berubah menjadi EVALUASI_PETUGAS untuk ditindaklanjuti oleh Petugas ${officerName}.`,
        'success'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 max-w-sm flex items-start gap-3">
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-slate-100">{toastMessage.title}</h4>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{toastMessage.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* CONDITIONAL VIEW: IF FULL-PAGE MATRIX IS OPEN (NOT A POPUP MODAL!) */}
      {fullPageMatrixInspection ? (
        <CapaMatrixFullPageView
          inspection={fullPageMatrixInspection}
          currentRole={currentRole}
          currentUser={currentUser}
          onBack={() => setFullPageMatrixInspection(null)}
          onUpdateInspection={(updated) => {
            handleUpdateInspection(updated);
            setFullPageMatrixInspection(updated);
          }}
          onSubmitCapa={handleCapaSubmitted}
          onSaveSurvey={(surveyData) => {
            handleSaveSibergasSurvey(surveyData);
          }}
        />
      ) : currentRole === 'SARANA' ? (
        <PublicLandingView
          inspections={inspections}
          currentRole={currentRole}
          onRoleChange={(r) => {
            setCurrentRole(r);
            showToast('Peran Aktif Diubah', `Anda saat ini menjelajah sebagai ${r}.`, 'info');
          }}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenSubmitCapa={handleRequestSubmitCapa}
          onOpenTrackingModal={handleOpenTrackingFromLanding}
          onSelectInspection={(ins) => setSelectedInspection(ins)}
        />
      ) : (
        /* INTERNAL MANAGEMENT DASHBOARD FOR ADMIN, PETUGAS/EVALUATOR, AND SUPERVISOR */
        <div className="flex-1 flex overflow-hidden min-h-screen relative">
          {/* Floating Drawer Handle when Sidebar is completely Hidden */}
          {isSidebarHidden && (
            <button
              type="button"
              onClick={() => setIsSidebarHidden(false)}
              className="fixed left-0 top-24 z-40 bg-slate-900/95 hover:bg-emerald-600 text-slate-300 hover:text-white px-2 py-3 rounded-r-xl border-y border-r border-slate-700 shadow-xl transition-all flex flex-col items-center gap-1 cursor-pointer group backdrop-blur-md"
              title="Klik untuk Menampilkan Kembali Menu Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              <span className="text-[9px] font-bold tracking-widest [writing-mode:vertical-lr] text-slate-400 group-hover:text-white">
                MENU
              </span>
            </button>
          )}

          {/* Collapsible / Hideable Sidebar Navigation */}
          {!isSidebarHidden && (
            <Sidebar
              currentRole={currentRole}
              currentUser={currentUser}
              activeHomeTab={activeHomeTab}
              onSelectHomeTab={(tab) => {
                setActiveHomeTab(tab);
                if (tab === 'SIBERGAS_TABLE') {
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }
              }}
              inspectionsCount={inspections.length}
              surveysCount={inspections.filter((i) => i.sibergasSurvey?.completed).length}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isHidden={isSidebarHidden}
              onToggleHide={() => setIsSidebarHidden(true)}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              onRoleChange={handleRoleSwitch}
              onOpenTracking={() => {
                setTrackingInitialCode(undefined);
                setIsTrackingModalOpen(true);
              }}
              onOpenNewInspection={() => setIsNewInspectionModalOpen(true)}
              onOpenOfficerDirectory={() => setIsOfficerDirectoryOpen(true)}
              onOpenNotificationSettings={() => handleOpenSuperAdminSettings('NOTIFIKASI')}
              onOpenSuperAdminSettings={handleOpenSuperAdminSettings}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
              onResetData={handleResetData}
              onLogout={handleLogout}
              onOpenPublicPortal={() => setCurrentRole('SARANA')}
              isWideView={isWideView}
              onToggleWideView={() => setIsWideView(!isWideView)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          )}

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Top Bar with View Controls, Search, and Fullscreen */}
            <Navbar
              currentRole={currentRole}
              currentUser={currentUser}
              onRoleChange={handleRoleSwitch}
              onOpenTracking={() => {
                setTrackingInitialCode(undefined);
                setIsTrackingModalOpen(true);
              }}
              onOpenNewInspection={() => setIsNewInspectionModalOpen(true)}
              onResetData={handleResetData}
              onOpenOfficerDirectory={() => setIsOfficerDirectoryOpen(true)}
              onOpenAccountManagement={() => handleOpenSuperAdminSettings('ACCOUNTS')}
              onOpenWaGatewaySettings={() => handleOpenSuperAdminSettings('WHATSAPP')}
              onOpenNotificationSettings={() => handleOpenSuperAdminSettings('NOTIFIKASI')}
              onOpenSuperAdminSettings={handleOpenSuperAdminSettings}
              onOpenSibergasTable={() => {
                setActiveHomeTab('SIBERGAS_TABLE');
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
              onLogout={handleLogout}
              onOpenPublicPortal={() => setCurrentRole('SARANA')}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isSidebarHidden={isSidebarHidden}
              onToggleHideSidebar={() => setIsSidebarHidden(!isSidebarHidden)}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
              isWideView={isWideView}
              onToggleWideView={() => setIsWideView(!isWideView)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              activeHomeTab={activeHomeTab}
              onSelectHomeTab={setActiveHomeTab}
            />

            {/* Role Context Helper Banner */}
            <div className="bg-slate-900/95 border-b border-slate-800 text-xs py-2 px-4 sm:px-6 shrink-0 text-slate-300">
              <div className={`${isWideView ? 'w-full' : 'max-w-7xl mx-auto'} flex items-center justify-between flex-wrap gap-2`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="truncate">
                    <strong className="text-white font-semibold">Otoritas Akses:</strong>{' '}
                    {currentRole === 'SUPERVISOR' && 'Supervisor (Supervisi kepatuhan SLA 14 hari, evaluasi kinerja evaluator, & pengesahan laporan CAPA)'}
                    {currentRole === 'ADMIN' && 'Admin Balai (Pengelolaan surat SRIKANDI TTE Kepala Balai, penugasan Petugas PIC, & akun)'}
                    {currentRole === 'PETUGAS_EVALUATOR' && 'Petugas / Evaluator (Telaah bukti tindak lanjut CAPA sarana, catatan rekomendasi, & validasi status)'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentRole('SARANA')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Portal Publik Pelaku Usaha</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <main className={`flex-1 w-full py-5 sm:py-6 space-y-5 sm:space-y-6 transition-all duration-200 ${
              isWideView ? 'px-3 sm:px-8' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8'
            }`}>

              {/* Menu Tab Switcher: Modern Segmented Navigation Bar */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
                <nav className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-1 backdrop-blur-xs border border-slate-300/80 shadow-2xs overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveHomeTab('HOME')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeHomeTab === 'HOME'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-300/70'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-semibold'
                    }`}
                  >
                    <Home className={`w-4 h-4 ${activeHomeTab === 'HOME' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span>Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHomeTab('DASHBOARD')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeHomeTab === 'DASHBOARD'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-300/70'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-semibold'
                    }`}
                  >
                    <LayoutDashboard className={`w-4 h-4 ${activeHomeTab === 'DASHBOARD' ? 'text-teal-600' : 'text-slate-500'}`} />
                    <span>Dashboard Temuan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHomeTab('DOCUMENTS')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeHomeTab === 'DOCUMENTS'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-300/70'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-semibold'
                    }`}
                  >
                    <FolderOpen className={`w-4 h-4 ${activeHomeTab === 'DOCUMENTS' ? 'text-cyan-600' : 'text-slate-500'}`} />
                    <span>Manajemen Dokumen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHomeTab('INSPECTIONS')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeHomeTab === 'INSPECTIONS'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-300/70'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-semibold'
                    }`}
                  >
                    <FileText className={`w-4 h-4 ${activeHomeTab === 'INSPECTIONS' ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>Daftar Sesi CAPA</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold font-mono tabular-nums ${
                      activeHomeTab === 'INSPECTIONS' ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'bg-slate-300/70 text-slate-700'
                    }`}>
                      {displayedInspections.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHomeTab('SIBERGAS_TABLE')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeHomeTab === 'SIBERGAS_TABLE'
                        ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-300/70'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-semibold'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 ${activeHomeTab === 'SIBERGAS_TABLE' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span>Survei SIBERGAS</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold font-mono tabular-nums ${
                      activeHomeTab === 'SIBERGAS_TABLE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-300/70 text-slate-700'
                    }`}>
                      {inspections.filter((i) => i.sibergasSurvey?.completed).length}/{inspections.length}
                    </span>
                  </button>
                </nav>

                <div className="text-xs text-slate-500 items-center gap-1.5 hidden md:flex">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zona Integritas (WBK/WBBM) BBPOM</span>
                </div>
              </div>

              {/* 1. MENU UTAMA: HOME (Mencakup seluruh isi: Banner, Dashboard Stats, dan Daftar Sesi CAPA) */}
              {activeHomeTab === 'HOME' && (
                <div className="space-y-6">
                  {/* SUPERVISOR OVERSIGHT BANNER (If current role is SUPERVISOR) */}
                  {currentRole === 'SUPERVISOR' && (
                    <SupervisorOversightBanner
                      inspections={inspections}
                      currentUser={currentUser}
                      onFilterChange={(f) => setActiveFilter(f)}
                      onOpenPrintReport={() => setIsPrintReportOpen(true)}
                    />
                  )}

                  {/* Quick Hero Section (Khusus Admin Balai) */}
                  {currentRole === 'ADMIN' && (
                    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none"></div>
                      
                      <div className="max-w-2xl relative z-10 space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>SIMONCER • Sistem Terintegrasi Pemantauan Kinerja & CAPA</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                          Pelacakan Kinerja & Evaluasi CAPA Real-Time, Akurat, dan Transparan
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Admin mengunggah surat tindak lanjut yang telah diunduh dari <strong>SRIKANDI (TTE Kepala Balai)</strong>. Sistem secara otomatis mengekstrak seluruh parameter surat serta rincian temuan per klausul regulasi, dan memicu notifikasi pembaruan ke pihak sarana via WhatsApp & Email.
                        </p>

                        <div className="pt-2 flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => setIsNewInspectionModalOpen(true)}
                            type="button"
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Upload Surat SRIKANDI (TTE)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setTrackingInitialCode(undefined);
                              setIsTrackingModalOpen(true);
                            }}
                            type="button"
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Search className="w-4 h-4 text-emerald-400" />
                            <span>Lacak Kode Unik CAPA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Workspace Khusus Petugas / Evaluator */}
                  {currentRole === 'PETUGAS_EVALUATOR' && (
                    <OfficerEvaluationDashboard
                      inspections={displayedInspections}
                      currentUser={currentUser}
                      activeFilter={activeFilter}
                      onFilterChange={(f) => setActiveFilter(f)}
                      isOfficerOnlyFilter={isOfficerOnlyFilter}
                      onToggleOfficerFilter={() => setIsOfficerOnlyFilter(!isOfficerOnlyFilter)}
                      totalAllInspectionsCount={inspections.length}
                      onSelectInspection={(ins) => setSelectedInspection(ins)}
                      onOpenEvaluation={(ins) => handleOpenEvaluation(ins)}
                      onOpenTracking={() => {
                        setTrackingInitialCode(undefined);
                        setIsTrackingModalOpen(true);
                      }}
                    />
                  )}

                  {/* Real-Time Interactive Performance Dashboard */}
                  <DashboardStats
                    inspections={displayedInspections}
                    activeFilter={activeFilter}
                    onFilterChange={(f) => setActiveFilter(f)}
                    onSelectInspection={(ins) => setSelectedInspection(ins)}
                    onOpenTrackingModal={(code) => {
                      setTrackingInitialCode(code);
                      setIsTrackingModalOpen(true);
                    }}
                    onSubmitCapa={(ins) => handleRequestSubmitCapa(ins)}
                    onOpenEvaluation={(ins) => handleOpenEvaluation(ins)}
                  />

                  {/* Section Akses Cepat Sesi CAPA di Beranda */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex-wrap">
                      <div>
                        <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>Daftar Sesi CAPA Terkini</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tinjau cepat status pemeriksaan sarana atau gunakan menu khusus "Daftar Sesi CAPA" untuk tampilan kartu penuh.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveHomeTab('INSPECTIONS')}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>Buka Tampilan Khusus Daftar Sesi CAPA ({displayedInspections.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <InspectionList
                      inspections={displayedInspections}
                      currentRole={currentRole}
                      currentUser={currentUser}
                      isOfficerFiltered={isOfficerOnlyFilter}
                      onToggleOfficerFilter={() => setIsOfficerOnlyFilter(!isOfficerOnlyFilter)}
                      totalUnfilteredCount={inspections.length}
                      activeFilter={activeFilter}
                      onFilterChange={(f) => setActiveFilter(f)}
                      hideOfficerBanner={currentRole === 'PETUGAS_EVALUATOR'}
                      onSelectInspection={(ins) => setSelectedInspection(ins)}
                      onOpenSrikandiLetter={(ins) => {
                        setSelectedInspection(ins);
                        setIsSrikandiModalOpen(true);
                      }}
                      onOpenSubmitCapa={(ins) => handleRequestSubmitCapa(ins)}
                      onOpenEvaluation={(ins) => handleOpenEvaluation(ins)}
                      onOpenNotificationPreview={(ins) => {
                        setSelectedInspection(ins);
                        setIsNotificationPreviewModalOpen(true);
                      }}
                      onOpenSrikandiWorkflow={(ins) => {
                        setSelectedInspection(ins);
                        setIsSrikandiWorkflowOpen(true);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 2. MENU UTAMA: DASHBOARD TEMUAN & PROGRES CAPA INTERAKTIF */}
              {activeHomeTab === 'DASHBOARD' && (
                <InteractiveFindingsDashboard
                  inspections={displayedInspections}
                  currentRole={currentRole}
                  onSelectInspection={(ins) => setSelectedInspection(ins)}
                  onOpenMatrix={(ins) => handleRequestSubmitCapa(ins)}
                  onOpenDocumentManager={(id) => handleOpenDocumentManager(id)}
                />
              )}

              {/* 3. MENU UTAMA: SISTEM MANAJEMEN DOKUMEN PEMERIKSAAN */}
              {activeHomeTab === 'DOCUMENTS' && (
                <SessionDocumentManager
                  inspections={displayedInspections}
                  initialInspectionId={activeDocumentSessionId}
                  currentRole={currentRole}
                  onSelectInspection={(ins) => setSelectedInspection(ins)}
                  onOpenMatrix={(ins) => handleRequestSubmitCapa(ins)}
                  onClose={() => setActiveHomeTab('HOME')}
                />
              )}

              {/* 4. MENU UTAMA: DAFTAR SESI CAPA (HANYA SESI CAPA SAJA - Sesuai Permintaan User & Gambar) */}
              {activeHomeTab === 'INSPECTIONS' && (
                <div className="space-y-4">
                  {/* Clean Page Title Header */}
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </span>
                        <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
                          Daftar Sesi CAPA
                        </h1>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {displayedInspections.length} Sesi Pemeriksaan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Daftar lengkap sesi pemeriksaan sarana, status SLA penutupan temuan, dan monitoring perbaikan klausul regulasi.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => setIsNewInspectionModalOpen(true)}
                          type="button"
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Upload Surat SRIKANDI (TTE)</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setTrackingInitialCode(undefined);
                          setIsTrackingModalOpen(true);
                        }}
                        type="button"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lacak Kode CAPA</span>
                      </button>
                    </div>
                  </div>

                  {/* ONLY THE INSPECTION LIST: Search input, filter buttons, and cards grid */}
                  <InspectionList
                    inspections={displayedInspections}
                    currentRole={currentRole}
                    currentUser={currentUser}
                    isOfficerFiltered={isOfficerOnlyFilter}
                    onToggleOfficerFilter={() => setIsOfficerOnlyFilter(!isOfficerOnlyFilter)}
                    totalUnfilteredCount={inspections.length}
                    activeFilter={activeFilter}
                    onFilterChange={(f) => setActiveFilter(f)}
                    hideOfficerBanner={currentRole === 'PETUGAS_EVALUATOR'}
                    onSelectInspection={(ins) => setSelectedInspection(ins)}
                    onOpenSrikandiLetter={(ins) => {
                      setSelectedInspection(ins);
                      setIsSrikandiModalOpen(true);
                    }}
                    onOpenSubmitCapa={(ins) => handleRequestSubmitCapa(ins)}
                    onOpenEvaluation={(ins) => handleOpenEvaluation(ins)}
                    onOpenNotificationPreview={(ins) => {
                      setSelectedInspection(ins);
                      setIsNotificationPreviewModalOpen(true);
                    }}
                    onOpenSrikandiWorkflow={(ins) => {
                      setSelectedInspection(ins);
                      setIsSrikandiWorkflowOpen(true);
                    }}
                  />
                </div>
              )}

              {/* 3. MENU UTAMA: TABEL HASIL SURVEI SIBERGAS */}
              {activeHomeTab === 'SIBERGAS_TABLE' && (
                <SibergasSurveyTable
                  inspections={displayedInspections}
                  currentRole={currentRole}
                  onOpenSurveyModal={handleOpenSurveyReadOnly}
                  onRequestSubmitCapa={handleRequestSubmitCapa}
                  onSelectInspection={(ins) => setSelectedInspection(ins)}
                />
              )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-12 shrink-0">
              <div className={`${isWideView ? 'w-full px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">SIMONCER</span>
                  <span>— Balai Besar Pengawas Obat dan Makanan di Semarang</span>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[11px] flex-wrap">
                  <span>Integrasi SRIKANDI (TTE BSrE)</span>
                  <span>•</span>
                  <span>Gateway WhatsApp & Email Otomatis</span>
                  <span>•</span>
                  <span>Supervisi & Rekam Audit Balai</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ALL MODALS & DIALOGS */}
      
      {/* 0. Login Modal for Internal Portal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 0.1 Account Management Modal */}
      <AccountManagementModal
        isOpen={isAccountManagementOpen}
        onClose={() => setIsAccountManagementOpen(false)}
        currentUser={currentUser}
      />

      {/* 1. Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingInitialCode(undefined);
        }}
        inspections={inspections}
        initialCode={trackingInitialCode}
        onSelectInspection={(ins) => {
          setSelectedInspection(ins);
          setIsTrackingModalOpen(false);
        }}
        onSubmitCapa={(ins) => {
          setIsTrackingModalOpen(false);
          handleRequestSubmitCapa(ins);
        }}
      />

      {/* 2. New Inspection Modal */}
      <NewInspectionModal
        isOpen={isNewInspectionModalOpen}
        onClose={() => setIsNewInspectionModalOpen(false)}
        onCreated={handleCreateInspection}
      />

      {/* 3. Detailed Inspection Dossier Modal */}
      {selectedInspection && !isSrikandiModalOpen && !isSubmitCapaModalOpen && !isEvaluationModalOpen && !isNotificationPreviewModalOpen && !isPrintReportOpen && !isSibergasSurveyModalOpen && !fullPageMatrixInspection && (
        <InspectionDetailModal
          isOpen={Boolean(selectedInspection)}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          currentRole={currentRole}
          onOpenSrikandiLetter={() => setIsSrikandiModalOpen(true)}
          onOpenSubmitCapa={() => handleRequestSubmitCapa(selectedInspection)}
          onOpenEvaluation={() => handleOpenEvaluation(selectedInspection)}
          onOpenNotificationPreview={() => setIsNotificationPreviewModalOpen(true)}
          onOpenNotificationSettings={() => handleOpenSuperAdminSettings('NOTIFIKASI')}
          onTriggerNotify={handleTriggerNotify}
          onOpenWaGatewaySettings={() => handleOpenSuperAdminSettings('WHATSAPP')}
          onUpdateInspection={handleUpdateInspection}
          onOpenFullPageMatrix={(ins) => {
            setSelectedInspection(null);
            setFullPageMatrixInspection(ins);
          }}
          onOpenDocumentManager={(id) => {
            setSelectedInspection(null);
            handleOpenDocumentManager(id);
          }}
        />
      )}

      {/* 4. SRIKANDI Letter Official Modal */}
      {selectedInspection && isSrikandiModalOpen && (
        <SrikandiLetterModal
          isOpen={isSrikandiModalOpen}
          onClose={() => setIsSrikandiModalOpen(false)}
          inspection={selectedInspection}
          onTriggerNotify={handleTriggerNotify}
        />
      )}

      {/* 5. SIBERGAS Survey Modal (Appears BEFORE SubmitCapaModal when submitting CAPA for the first time, or in readOnly mode) */}
      {selectedInspection && isSibergasSurveyModalOpen && (
        <SibergasSurveyModal
          isOpen={isSibergasSurveyModalOpen}
          onClose={() => setIsSibergasSurveyModalOpen(false)}
          inspection={selectedInspection}
          onSaveSurvey={handleSaveSibergasSurvey}
          readOnly={isSibergasSurveyReadOnly}
          isFirstTimeCapaSubmission={isSibergasSurveyFirstTime}
        />
      )}

      {/* 6. Submit CAPA Modal */}
      {selectedInspection && isSubmitCapaModalOpen && (
        <SubmitCapaModal
          isOpen={isSubmitCapaModalOpen}
          onClose={() => setIsSubmitCapaModalOpen(false)}
          inspection={selectedInspection}
          onSubmit={handleCapaSubmitted}
          currentRole={currentRole}
        />
      )}

      {/* 6. Evaluation Modal */}
      {selectedInspection && isEvaluationModalOpen && (
        <EvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={() => setIsEvaluationModalOpen(false)}
          inspection={selectedInspection}
          onSubmitEvaluation={handleUpdateInspection}
          onOpenSrikandiWorkflow={(ins) => {
            setSelectedInspection(ins);
            setIsSrikandiWorkflowOpen(true);
          }}
          currentRole={currentRole}
        />
      )}

      {/* 6.5. SRIKANDI TTE & Matriks SOP Workflow Modal */}
      {selectedInspection && isSrikandiWorkflowOpen && (
        <SrikandiWorkflowModal
          isOpen={isSrikandiWorkflowOpen}
          onClose={() => setIsSrikandiWorkflowOpen(false)}
          inspection={selectedInspection}
          currentRole={currentRole}
          onOpenEvaluation={() => {
            setIsSrikandiWorkflowOpen(false);
            handleOpenEvaluation(selectedInspection);
          }}
          onOpenSrikandiLetter={() => {
            setIsSrikandiWorkflowOpen(false);
            setIsSrikandiModalOpen(true);
          }}
          onUpdateInspection={handleUpdateInspection}
        />
      )}

      {/* 7. Notification Preview & Simulation Modal */}
      {selectedInspection && isNotificationPreviewModalOpen && (
        <NotificationPreviewModal
          isOpen={isNotificationPreviewModalOpen}
          onClose={() => setIsNotificationPreviewModalOpen(false)}
          inspection={selectedInspection}
        />
      )}

      {/* 8. Print Official Report View */}
      {isPrintReportOpen && (
        <PrintReportView
          inspection={selectedInspection || inspections[0]}
          onClose={() => setIsPrintReportOpen(false)}
        />
      )}

      {/* 9. Standalone Officer Directory Settings Modal */}
      <OfficerDirectoryModal
        isOpen={isOfficerDirectoryOpen}
        onClose={() => setIsOfficerDirectoryOpen(false)}
      />

      {/* 10. Pusat Pengaturan Terpadu SIMONCER (Notifikasi, Template Editor & Live Preview, Gateway WA Fonnte, Akun & Petugas) */}
      <SuperAdminSettingsModal
        isOpen={isSuperAdminSettingsOpen || isNotificationSettingsOpen}
        onClose={() => {
          setIsSuperAdminSettingsOpen(false);
          setIsNotificationSettingsOpen(false);
        }}
        currentUser={currentUser}
        initialTab={superAdminInitialTab}
        onSendTestNotification={handleSendTestNotification}
        recentLogs={selectedInspection?.notifications || inspections[0]?.notifications || []}
      />

      {/* Real-time Toast Banner Pengiriman Notifikasi Otomatis */}
      {liveNotificationBanner && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl text-white animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-emerald-400">
                    {liveNotificationBanner.title}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {liveNotificationBanner.channel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {liveNotificationBanner.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLiveNotificationBanner(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
