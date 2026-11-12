import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  MessageSquare, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Key, 
  Globe, 
  Send, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Award, 
  Briefcase, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  Sliders,
  Smartphone,
  ExternalLink,
  FileText,
  CheckCheck,
  Clock,
  Copy,
  Edit3,
  Eye,
  HelpCircle,
  Bell,
  Building2,
  Info
} from 'lucide-react';
import { AuthAccount, OfficerUser, SystemNotification, NotificationTriggerEvent } from '../types';
import { 
  WhatsAppGatewayConfig, 
  WhatsAppProvider, 
  getGatewayConfig, 
  saveGatewayConfig, 
  sendWhatsAppMessage, 
  DEFAULT_GATEWAY_CONFIG, 
  PROVIDER_PRESETS 
} from '../utils/whatsappGateway';
import { 
  getStoredAccounts, 
  saveStoredAccounts, 
  registerAccount, 
  deleteAccount, 
  DEFAULT_ACCOUNTS,
  syncAllAccountsAndOfficers 
} from '../utils/auth';
import { 
  getStoredOfficers, 
  saveStoredOfficers, 
  addOfficer,
  deleteOfficer,
  REGISTERED_OFFICERS 
} from '../data/officers';
import {
  NotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_NOTIFICATION_TEMPLATES,
  substituteNotificationVariables
} from '../utils/notificationService';

export type SuperAdminTab = 'NOTIFIKASI' | 'TEMPLATES' | 'LOGS' | 'ACCOUNTS' | 'OFFICERS' | 'WHATSAPP';

interface SuperAdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthAccount | null;
  initialTab?: SuperAdminTab;
  onSendTestNotification?: (channel: 'WHATSAPP' | 'EMAIL' | 'BOTH', sampleEvent: string, customText?: string) => void;
  recentLogs?: SystemNotification[];
}

export const SuperAdminSettingsModal: React.FC<SuperAdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'NOTIFIKASI',
  onSendTestNotification,
  recentLogs = [],
}) => {
  // Normalize initialTab
  const normalizedInitialTab = initialTab === 'WHATSAPP' ? 'NOTIFIKASI' : initialTab;
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(normalizedInitialTab);

  // --- NOTIFICATION & GATEWAY CONFIG STATE ---
  const [waConfig, setWaConfig] = useState<WhatsAppGatewayConfig>(getGatewayConfig());
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // --- TEMPLATE EDITOR & PREVIEW STATE ---
  const [selectedTrigger, setSelectedTrigger] = useState<NotificationTriggerEvent>('SURAT_TINDAK_LANJUT');
  const [editingChannel, setEditingChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [editedTemplates, setEditedTemplates] = useState(
    notifPrefs.templates || DEFAULT_NOTIFICATION_PREFERENCES.templates || {}
  );
  const [testRecipientPhone, setTestRecipientPhone] = useState(notifPrefs.recipients.saranaPhone || '081277889911');
  const [testRecipientEmail, setTestRecipientEmail] = useState(notifPrefs.recipients.saranaEmail || 'qa@kimiafarma-semarang.co.id');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  // --- ACCOUNTS MANAGEMENT STATE ---
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountFormData, setAccountFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'PETUGAS_EVALUATOR' as 'ADMIN' | 'PETUGAS_EVALUATOR' | 'SUPERVISOR',
    nip: '',
    position: 'Pengawas Farmasi & Makanan / Evaluator CAPA',
    phone: '+62 8',
    email: '',
  });
  const [accountErrorMsg, setAccountErrorMsg] = useState('');
  const [accountSuccessMsg, setAccountSuccessMsg] = useState('');

  // --- OFFICERS DIRECTORY STATE ---
  const [officers, setOfficers] = useState<OfficerUser[]>([]);
  const [isAddingOfficer, setIsAddingOfficer] = useState(false);
  const [officerForm, setOfficerForm] = useState({
    name: '',
    nip: '',
    position: 'Pengawas Farmasi dan Makanan Ahli Pertama',
    phone: '+62 812-3344-5566',
    email: '',
  });

  useEffect(() => {
    if (isOpen) {
      syncAllAccountsAndOfficers();
      setWaConfig(getGatewayConfig());
      const prefs = getNotificationPreferences();
      setNotifPrefs(prefs);
      setEditedTemplates(prefs.templates || DEFAULT_NOTIFICATION_PREFERENCES.templates || {});
      setAccounts(getStoredAccounts());
      setOfficers(getStoredOfficers());
      setSaveSuccessMsg(null);
      setTestResult(null);
      setIsAddingAccount(false);
      setIsAddingOfficer(false);
      setAccountErrorMsg('');
      setAccountSuccessMsg('');
      if (initialTab) {
        setActiveTab(initialTab === 'WHATSAPP' ? 'NOTIFIKASI' : initialTab);
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // --- SAVE & RESET HANDLERS ---
  const handleSaveAllSettings = () => {
    // 1. Save WhatsApp Gateway
    saveGatewayConfig(waConfig);
    // 2. Save Notification Preferences & Custom Templates
    const updatedPrefs: NotificationPreferences = {
      ...notifPrefs,
      templates: editedTemplates,
    };
    setNotifPrefs(updatedPrefs);
    saveNotificationPreferences(updatedPrefs);

    setSaveSuccessMsg('Seluruh konfigurasi sistem, pemicu, dan template pesan berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Pulihkan seluruh pengaturan notifikasi, pemicu, dan template pesan ke standar resmi BBPOM?')) {
      setWaConfig({ ...DEFAULT_GATEWAY_CONFIG });
      saveGatewayConfig({ ...DEFAULT_GATEWAY_CONFIG });
      setNotifPrefs(DEFAULT_NOTIFICATION_PREFERENCES);
      setEditedTemplates(DEFAULT_NOTIFICATION_PREFERENCES.templates || {});
      saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      setSaveSuccessMsg('Pengaturan berhasil dipulihkan ke bawaan awal.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // --- TEMPLATE EDITING HANDLERS WITH REAL-TIME LOCALSTORAGE PERSISTENCE ---
  const currentTemplate = editedTemplates[selectedTrigger] || DEFAULT_NOTIFICATION_TEMPLATES[selectedTrigger];

  // Helper to persist templates to localStorage as user types
  const persistTemplatesToStorage = (newTemplates: typeof editedTemplates) => {
    try {
      const currentStoredPrefs = getNotificationPreferences();
      const updatedPrefs: NotificationPreferences = {
        ...currentStoredPrefs,
        templates: newTemplates,
      };
      saveNotificationPreferences(updatedPrefs);
      setNotifPrefs(updatedPrefs);
    } catch (e) {
      console.error('Failed to auto-save template to localStorage:', e);
    }
  };

  const handleTemplateChange = (field: 'waContent' | 'emailSubject' | 'emailContent', value: string) => {
    const updatedTriggerTemplate = {
      ...(editedTemplates[selectedTrigger] || DEFAULT_NOTIFICATION_TEMPLATES[selectedTrigger]),
      [field]: value,
    };
    const updatedAll = {
      ...editedTemplates,
      [selectedTrigger]: updatedTriggerTemplate,
    };
    setEditedTemplates(updatedAll);
    // Real-time automatic persistence into localStorage
    persistTemplatesToStorage(updatedAll);
  };

  const handleInsertTag = (tag: string) => {
    const curr = editedTemplates[selectedTrigger] || DEFAULT_NOTIFICATION_TEMPLATES[selectedTrigger];
    if (editingChannel === 'WHATSAPP') {
      handleTemplateChange('waContent', (curr.waContent || '') + ' ' + tag);
    } else {
      handleTemplateChange('emailContent', (curr.emailContent || '') + ' ' + tag);
    }
  };

  const handleResetCurrentTemplate = () => {
    const defaultForTrigger = DEFAULT_NOTIFICATION_TEMPLATES[selectedTrigger];
    const updatedAll = {
      ...editedTemplates,
      [selectedTrigger]: {
        waContent: defaultForTrigger.waContent,
        emailSubject: defaultForTrigger.emailSubject,
        emailContent: defaultForTrigger.emailContent,
      },
    };
    setEditedTemplates(updatedAll);
    persistTemplatesToStorage(updatedAll);
  };

  // Live formatted variables for preview
  const previewSampleVars = {
    facilityName: 'PT Kimia Farma Trading & Distribution',
    capaCode: 'CAPA-2026-PBF02',
    letterNo: 'B-PW.01.02.41A.11.26.8872',
    findingClause: 'CDOB 2024 Bab 9 Butir 9.1',
    newStatus: 'EVALUASI_PETUGAS',
    findingDescription: 'Chiller Cold Room No. 2 suhu melonjak hingga 14.8°C akibat genset.',
    note: notifPrefs.customNote || 'Mohon pantau sistem SIMONCER secara berkala.',
    deadline: '24 November 2026 (Sisa 14 Hari)',
    issuedDate: '04 November 2026',
    totalFindings: 1,
    officerName: 'apt. Eko Prasetyo, M.Farm',
    timeString: new Date().toLocaleString('id-ID'),
    trackingUrl: 'https://simoncer.id/track?code=CAPA-2026-PBF02',
  };

  const previewWaText = substituteNotificationVariables(currentTemplate.waContent || '', previewSampleVars);
  const previewEmailSubj = substituteNotificationVariables(currentTemplate.emailSubject || '', previewSampleVars);
  const previewEmailBody = substituteNotificationVariables(currentTemplate.emailContent || '', previewSampleVars);

  // --- TEST SEND HANDLER ---
  const handleTestSend = async (channel: 'WHATSAPP' | 'EMAIL') => {
    setIsSendingTest(true);
    setTestResult(null);

    if (channel === 'WHATSAPP') {
      if (!testRecipientPhone.trim()) {
        alert('Masukkan nomor WhatsApp tujuan uji coba!');
        setIsSendingTest(false);
        return;
      }
      const res = await sendWhatsAppMessage(testRecipientPhone, previewWaText, waConfig);
      setIsSendingTest(false);
      setTestResult({
        success: res.success,
        message: res.message,
        details: res.responseRaw ? JSON.stringify(res.responseRaw, null, 2) : undefined,
      });
      if (onSendTestNotification) {
        onSendTestNotification('WHATSAPP', selectedTrigger, previewWaText);
      }
    } else {
      if (!testRecipientEmail.trim()) {
        alert('Masukkan alamat email tujuan uji coba!');
        setIsSendingTest(false);
        return;
      }
      // Simulated Email Send via SMTP Server mail.pom.go.id
      setTimeout(() => {
        setIsSendingTest(false);
        setTestResult({
          success: true,
          message: `Email uji coba berhasil dikirim ke ${testRecipientEmail} via server mail.pom.go.id (TLS 465).`,
          details: `Subject: ${previewEmailSubj}\nRecipient: ${testRecipientEmail}\nStatus: 250 Message accepted for delivery.`,
        });
        if (onSendTestNotification) {
          onSendTestNotification('EMAIL', selectedTrigger, previewEmailBody);
        }
      }, 700);
    }
  };

  // --- ACCOUNT HANDLERS ---
  const handleStartAddAccount = () => {
    setAccountFormData({
      username: '',
      password: 'password123',
      name: '',
      role: 'PETUGAS_EVALUATOR',
      nip: '',
      position: 'Pengawas Farmasi & Makanan / Evaluator CAPA',
      phone: '+62 8',
      email: '',
    });
    setIsAddingAccount(true);
    setAccountErrorMsg('');
    setAccountSuccessMsg('');
  };

  const handleSaveAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountErrorMsg('');
    setAccountSuccessMsg('');

    if (!accountFormData.username.trim() || !accountFormData.password) {
      setAccountErrorMsg('Username dan kata sandi akun wajib diisi!');
      return;
    }
    if (!accountFormData.name.trim()) {
      setAccountErrorMsg('Nama lengkap dan gelar wajib diisi!');
      return;
    }

    const res = registerAccount({
      username: accountFormData.username.trim().toLowerCase(),
      password: accountFormData.password,
      name: accountFormData.name.trim(),
      role: accountFormData.role,
      nip: accountFormData.nip.trim(),
      position: accountFormData.position.trim(),
      phone: accountFormData.phone.trim(),
      email: accountFormData.email.trim(),
    });

    if (res.success) {
      setAccounts(getStoredAccounts());
      setOfficers(getStoredOfficers());
      setIsAddingAccount(false);
      setAccountSuccessMsg(`Akun "${res.account?.name}" (${res.account?.role}) berhasil dibuat! Otomatis terdaftar di Direktori & Dropdown Penugasan PIC.`);
      setTimeout(() => setAccountSuccessMsg(''), 5000);
    } else {
      setAccountErrorMsg(res.message || 'Gagal menambahkan akun.');
    }
  };

  const handleDeleteAccount = (id: string, name: string) => {
    if (currentUser?.id === id) {
      alert('Anda tidak dapat menghapus akun yang sedang aktif digunakan saat ini!');
      return;
    }
    if (window.confirm(`Hapus akun "${name}" secara permanen?`)) {
      deleteAccount(id);
      setAccounts(getStoredAccounts());
      setOfficers(getStoredOfficers());
    }
  };

  const handleResetAccounts = () => {
    if (window.confirm('Kembalikan daftar akun petugas ke konfigurasi bawaan BBPOM?')) {
      saveStoredAccounts([...DEFAULT_ACCOUNTS]);
      syncAllAccountsAndOfficers();
      setAccounts(getStoredAccounts());
      setOfficers(getStoredOfficers());
    }
  };

  // --- OFFICER HANDLERS ---
  const handleSaveOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerForm.name.trim()) return;

    addOfficer({
      name: officerForm.name.trim(),
      nip: officerForm.nip.trim() || '198500000000000000',
      position: officerForm.position.trim() || 'Pengawas Farmasi dan Makanan Ahli Pertama',
      phone: officerForm.phone.trim() || '+62 812-0000-0000',
      email: officerForm.email.trim() || 'petugas@pom.go.id',
    });

    setOfficers(getStoredOfficers());
    setAccounts(getStoredAccounts());
    setIsAddingOfficer(false);
    setOfficerForm({
      name: '',
      nip: '',
      position: 'Pengawas Farmasi dan Makanan Ahli Pertama',
      phone: '+62 812-3344-5566',
      email: '',
    });
  };

  const handleDeleteOfficer = (id: string, name: string) => {
    if (window.confirm(`Hapus petugas "${name}" dari direktori?`)) {
      deleteOfficer(id);
      setOfficers(getStoredOfficers());
      setAccounts(getStoredAccounts());
    }
  };

  const handleResetOfficers = () => {
    if (window.confirm('Kembalikan data direktori petugas ke bawaan awal?')) {
      saveStoredOfficers([...REGISTERED_OFFICERS]);
      syncAllAccountsAndOfficers();
      setOfficers(getStoredOfficers());
      setAccounts(getStoredAccounts());
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.username.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(accountSearch.toLowerCase()) ||
      (a.nip && a.nip.includes(accountSearch))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-blue-200/80 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Terpadu */}
        <div className="p-4 sm:p-5 bg-white border-b border-blue-200/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#1e3a5f]">
                  Pengaturan Terpadu Sistem & Notifikasi SIMONCER
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/40">
                  Full Control Center • BBPOM di Semarang
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Kelola integrasi WhatsApp & Email, pemicu otomatis, editor isi pesan, akun pengguna, dan direktori evaluator dalam satu menu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-[#1e3a5f] rounded-xl hover:bg-[#e8f1fb] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Tab Navigation (No Horizontal Scroll - Fully Responsive Grid) */}
        <div className="p-2 sm:p-2.5 bg-[#f4f8fd] border-b border-blue-200/80 shrink-0 z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('NOTIFIKASI')}
              type="button"
              className={`px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-center cursor-pointer ${
                activeTab === 'NOTIFIKASI'
                  ? 'bg-emerald-600/25 text-emerald-800 border border-emerald-500/50 font-bold shadow-xs'
                  : 'bg-white/85 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#eef5fc] border border-blue-200/80'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="truncate">Saluran & Pemicu</span>
            </button>
            <button
              onClick={() => setActiveTab('TEMPLATES')}
              type="button"
              className={`px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-center cursor-pointer ${
                activeTab === 'TEMPLATES'
                  ? 'bg-cyan-600/25 text-sky-800 border border-cyan-500/50 font-bold shadow-xs'
                  : 'bg-white/85 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#eef5fc] border border-blue-200/80'
              }`}
            >
              <Edit3 className="w-4 h-4 text-sky-700 shrink-0" />
              <span className="truncate">Editor Isi Pesan</span>
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              type="button"
              className={`px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-center cursor-pointer ${
                activeTab === 'LOGS'
                  ? 'bg-purple-600/25 text-purple-800 border border-purple-500/50 font-bold shadow-xs'
                  : 'bg-white/85 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#eef5fc] border border-blue-200/80'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">Log Riwayat ({recentLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              type="button"
              className={`px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-center cursor-pointer ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-amber-600/25 text-amber-800 border border-amber-500/50 font-bold shadow-xs'
                  : 'bg-white/85 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#eef5fc] border border-blue-200/80'
              }`}
            >
              <Users className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">Manajemen Akun ({accounts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('OFFICERS')}
              type="button"
              className={`px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-center cursor-pointer col-span-2 sm:col-span-1 ${
                activeTab === 'OFFICERS'
                  ? 'bg-rose-600/25 text-rose-700 border border-rose-500/50 font-bold shadow-xs'
                  : 'bg-white/85 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#eef5fc] border border-blue-200/80'
              }`}
            >
              <UserCheck className="w-4 h-4 text-rose-700 shrink-0" />
              <span className="truncate">Direktori Petugas ({officers.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-6 text-sm text-[#1e3a5f]">
          
          {/* ========================================================= */}
          {/* TAB 1: NOTIFIKASI, SALURAN & PEMICU OTOMATIS (TERPADU)    */}
          {/* ========================================================= */}
          {activeTab === 'NOTIFIKASI' && (
            <div className="space-y-6">
              
              {/* Status Header Banner */}
              <div className="p-4 bpom-hero-gradient border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1e3a5f] text-xs sm:text-sm">
                      Integrasi Gateway Resmi WhatsApp (Fonnte API) & Server Email SMTP
                    </h4>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      Perangkat Pengirim WA: <span className="text-emerald-700 font-mono font-bold">Device BBPOM ({waConfig.senderNumber || '0812-7788-9911'})</span> • Email Pengirim: <span className="text-blue-700 font-mono">{notifPrefs.emailSenderEmail || 'simoncer@pom.go.id'} ({notifPrefs.emailSmtpServer || 'mail.pom.go.id'})</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('TEMPLATES')}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Buka Editor Isi Pesan ↗</span>
                  </button>
                </div>
              </div>

              {/* Saluran & Konfigurasi Server Pengirim (Gateway & SMTP) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* WhatsApp Gateway Sender Config Card */}
                <div className="p-4 bg-[#f4f8fd] rounded-2xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-700" />
                      <div>
                        <span className="font-bold text-xs text-[#1e3a5f] block">Gateway WhatsApp Pengirim</span>
                        <span className="text-[10px] text-slate-600">Server Pengirim Resmi BBPOM</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs.channels.whatsapp}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          channels: { ...notifPrefs.channels, whatsapp: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#e8f1fb] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Token API Fonnte / Gateway BBPOM
                      </label>
                      <input
                        type="text"
                        value={waConfig.apiKey}
                        onChange={(e) => setWaConfig({ ...waConfig, apiKey: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                        placeholder="Contoh: q1yphTjb... (Token Akun Fonnte BBPOM)"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Kunci autentikasi resmi dari penyedia gateway Fonnte untuk mengirim pesan.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nomor WhatsApp Perangkat Pengirim (Device WA Resmi BBPOM)
                      </label>
                      <input
                        type="text"
                        value={waConfig.senderNumber || '0812-7788-9911'}
                        onChange={(e) => setWaConfig({ ...waConfig, senderNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                        placeholder="Contoh: 0812-7788-9911 (Nomor SIM Device BBPOM)"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Nomor HP kartu SIM instansi BBPOM yang ditautkan di dashboard gateway sebagai pengirim.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Identitas Pengirim WA (Sender Profile Name)
                      </label>
                      <input
                        type="text"
                        value={waConfig.senderName}
                        onChange={(e) => setWaConfig({ ...waConfig, senderName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-emerald-500"
                        placeholder="BBPOM di Semarang (SIMONCER)"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Label nama instansi yang tampil pada header pesan WhatsApp.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Server Sender Config Card */}
                <div className="p-4 bg-[#f4f8fd] rounded-2xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="font-bold text-xs text-[#1e3a5f] block">Server Email Resmi BBPOM</span>
                        <span className="text-[10px] text-slate-600">Server SMTP Pengirim Instansi</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs.channels.email}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          channels: { ...notifPrefs.channels, email: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#e8f1fb] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Host Server SMTP & Port
                      </label>
                      <input
                        type="text"
                        value={notifPrefs.emailSmtpServer}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, emailSmtpServer: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-blue-500"
                        placeholder="mail.pom.go.id (TLS/SSL Port 465)"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Server surat elektronik kedinasan Badan POM dengan enkripsi TLS/SSL.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Alamat Email Pengirim Resmi (BBPOM di Semarang)
                      </label>
                      <input
                        type="email"
                        value={notifPrefs.emailSenderEmail || 'simoncer@pom.go.id'}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          emailSenderEmail: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-blue-500"
                        placeholder="simoncer@pom.go.id"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Alamat email resmi dinas pengirim (*From Header*) surat dan tanda terima CAPA.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Tampilan Pengirim Email (Sender Display Name)
                      </label>
                      <input
                        type="text"
                        value={notifPrefs.emailSenderName || 'SIMONCER - Balai Besar POM di Semarang'}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          emailSenderName: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-blue-500"
                        placeholder="SIMONCER - Balai Besar POM di Semarang"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Nama instansi yang tampak pada inbox surat masuk penerima.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PEMICU NOTIFIKASI OTOMATIS (EVENT TRIGGERS) TERPADU */}
              <div className="p-4 bg-[#f4f8fd] rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#1e3a5f] uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    <span>Pemicu Notifikasi Otomatis (Event Triggers Terpadu)</span>
                  </h4>
                  <span className="text-[11px] text-slate-600">
                    Centang peristiwa yang otomatis mengirimkan notifikasi WA & Email
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* 1. Surat Tindak Lanjut Baru */}
                  <label className="p-3 bg-white border border-blue-200/80 hover:border-blue-200 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1e3a5f] text-xs block">
                          1. Notifikasi Surat Tindak Lanjut ke Sarana & Petugas Evaluator
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Mengirimkan nomor surat SRIKANDI (TTE BSrE), batas SLA hari kerja (terhitung sejak surat diterima), dan tautan tracking mandiri saat surat hasil pemeriksaan diterbitkan.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.triggers.newFollowUpLetter}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setNotifPrefs({
                          ...notifPrefs,
                          triggers: { ...notifPrefs.triggers, newFollowUpLetter: val }
                        });
                        setWaConfig({ ...waConfig, notifyOnSrikandiLetter: val });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded bg-[#e8f1fb] border-blue-200 focus:ring-emerald-500 shrink-0 mt-1"
                    />
                  </label>

                  {/* 2. Capa submitted */}
                  <label className="p-3 bg-white border border-blue-200/80 hover:border-blue-200 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1e3a5f] text-xs block">
                          2. Notifikasi Penyerahan Dokumen CAPA ke Petugas Evaluator PIC & Tanda Terima Sarana
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Mengirimkan pesan penugasan ke nomor Petugas Evaluator ketika sarana menyerahkan matriks CAPA & bukti perbaikan, serta memberikan tanda terima resmi ke sarana.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.triggers.capaSubmissionReceived}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setNotifPrefs({
                          ...notifPrefs,
                          triggers: { ...notifPrefs.triggers, capaSubmissionReceived: val }
                        });
                        setWaConfig({ ...waConfig, notifyOnCapaSubmitted: val });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded bg-[#e8f1fb] border-blue-200 focus:ring-emerald-500 shrink-0 mt-1"
                    />
                  </label>

                  {/* 3. Capa evaluated & status change */}
                  <label className="p-3 bg-white border border-blue-200/80 hover:border-blue-200 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Sliders className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1e3a5f] text-xs block">
                          3. Notifikasi Perubahan Status Evaluasi CAPA ke Sarana & Petugas
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Mengirimkan laporan hasil evaluasi saat status sesi berganti (EVALUASI_PETUGAS, CAPA CLOSED / MEMADAI, atau PERLU PERBAIKAN / EVALUASI ULANG).
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.triggers.capaStatusChange}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setNotifPrefs({
                          ...notifPrefs,
                          triggers: { ...notifPrefs.triggers, capaStatusChange: val }
                        });
                        setWaConfig({ ...waConfig, notifyOnCapaEvaluated: val });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded bg-[#e8f1fb] border-blue-200 focus:ring-emerald-500 shrink-0 mt-1"
                    />
                  </label>

                  {/* 4. Pembaruan Status Temuan */}
                  <label className="p-3 bg-white border border-blue-200/80 hover:border-blue-200 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1e3a5f] text-xs block">
                          4. Notifikasi Pembaruan Status Temuan Pemeriksaan
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Kirim notifikasi saat auditor memverifikasi butir temuan atau mengubah tingkat kritis ketidaksesuaian (Minor/Mayor/Kritis).
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.triggers.findingStatusUpdate}
                      onChange={(e) => setNotifPrefs({
                        ...notifPrefs,
                        triggers: { ...notifPrefs.triggers, findingStatusUpdate: e.target.checked }
                      })}
                      className="w-4 h-4 text-emerald-600 rounded bg-[#e8f1fb] border-blue-200 focus:ring-emerald-500 shrink-0 mt-1"
                    />
                  </label>

                  {/* 5. Deadline Reminder */}
                  <label className="p-3 bg-white border border-blue-200/80 hover:border-blue-200 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1e3a5f] text-xs block">
                          5. Notifikasi Pengingat Tenggat Waktu (Deadline Alert H-7 & H-3)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Mengirimkan peringatan otomatis ke sarana sebelum masa berlaku penyampaian CAPA berakhir agar tidak melanggar kepatuhan regulasi.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.triggers.deadlineReminder}
                      onChange={(e) => setNotifPrefs({
                        ...notifPrefs,
                        triggers: { ...notifPrefs.triggers, deadlineReminder: e.target.checked }
                      })}
                      className="w-4 h-4 text-emerald-600 rounded bg-[#e8f1fb] border-blue-200 focus:ring-emerald-500 shrink-0 mt-1"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EDITOR TEMPLATE PESAN & LIVE PREVIEW (BISA DI-EDIT) */}
          {/* ========================================================= */}
          {activeTab === 'TEMPLATES' && (
            <div className="space-y-5">
              
              {/* Trigger Selector Bar */}
              <div className="p-4 bg-[#f4f8fd] border border-blue-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-xs text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-sky-700" />
                    <span>Pilih Pemicu Notifikasi yang Ingin Diedit Isinya:</span>
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Template tersimpan permanen dan digunakan saat pengiriman otomatis
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { id: 'SURAT_TINDAK_LANJUT', label: '1. Surat TL Baru' },
                    { id: 'CAPA_DITERIMA', label: '2. Tanda Terima CAPA' },
                    { id: 'STATUS_EVALUASI_UPDATE', label: '3. Evaluasi CAPA' },
                    { id: 'TEMUAN_STATUS_UPDATE', label: '4. Update Temuan' },
                    { id: 'REMINDER_DEADLINE', label: '5. Deadline Alert' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTrigger(t.id as NotificationTriggerEvent)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        selectedTrigger === t.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-sky-800 shadow-sm'
                          : 'bg-white border-blue-200/80 text-slate-600 hover:text-[#1e3a5f] hover:border-blue-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Variabel Dinamis Toolbar */}
              <div className="p-3 bg-[#f8fbff] border border-blue-200/80 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  💡 Klik Tag di Bawah untuk Menyisipkan Variabel Otomatis ke dalam Teks:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {[
                    '{SARANA}',
                    '{KODE_CAPA}',
                    '{NO_SURAT}',
                    '{STATUS}',
                    '{LINK}',
                    '{DEADLINE}',
                    '{TANGGAL_SURAT}',
                    '{PETUGAS}',
                    '{KLAUSUL}',
                    '{CATATAN}',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="px-2 py-0.5 rounded-lg bg-[#e8f1fb] hover:bg-sky-100 text-sky-800 border border-blue-200 hover:border-cyan-500 transition-colors cursor-pointer"
                      title={`Klik untuk menyisipkan ${tag}`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Selector: WhatsApp vs Email Editor */}
              <div className="flex gap-2 border-b border-blue-200/80 pb-2">
                <button
                  type="button"
                  onClick={() => setEditingChannel('WHATSAPP')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editingChannel === 'WHATSAPP'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-[#e8f1fb] text-slate-600 hover:text-[#1e3a5f]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Editor Teks WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingChannel('EMAIL')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editingChannel === 'EMAIL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#e8f1fb] text-slate-600 hover:text-[#1e3a5f]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Editor Subjek & Naskah Email</span>
                </button>
              </div>

              {/* 2-Column Layout: Left Editor, Right Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                
                {/* LEFT: TEXTAREA EDITOR */}
                <div className="p-4 bg-[#f4f8fd] rounded-2xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1e3a5f] flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                      <span>Formulir Pengubahan Isi Pesan</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetCurrentTemplate}
                      className="text-[10px] text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      title="Kembalikan pemicu ini ke teks bawaan resmi"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Teks Pemicu Ini</span>
                    </button>
                  </div>

                  {editingChannel === 'WHATSAPP' ? (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Isi Pesan WhatsApp (Mendukung format *tebal*, _miring_, dan emoji):
                      </label>
                      <textarea
                        rows={14}
                        value={currentTemplate.waContent || ''}
                        onChange={(e) => handleTemplateChange('waContent', e.target.value)}
                        className="w-full p-3 bg-white border border-blue-200 focus:border-emerald-500 rounded-xl text-xs font-mono text-[#1e3a5f] focus:outline-none leading-relaxed"
                        placeholder="Tuliskan naskah pesan WhatsApp..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Subjek Email Resmi BBPOM:
                        </label>
                        <input
                          type="text"
                          value={currentTemplate.emailSubject || ''}
                          onChange={(e) => handleTemplateChange('emailSubject', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-blue-200 focus:border-blue-500 rounded-xl text-xs font-mono text-[#1e3a5f] focus:outline-none"
                          placeholder="Subjek email..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Badan Naskah Email:
                        </label>
                        <textarea
                          rows={11}
                          value={currentTemplate.emailContent || ''}
                          onChange={(e) => handleTemplateChange('emailContent', e.target.value)}
                          className="w-full p-3 bg-white border border-blue-200 focus:border-blue-500 rounded-xl text-xs font-mono text-[#1e3a5f] focus:outline-none leading-relaxed"
                          placeholder="Tuliskan naskah isi email..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-blue-200/80">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Tersimpan otomatis saat mengetik</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllSettings}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan Teks</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT: REALISTIC LIVE PREVIEW */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1e3a5f] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pratinjau Langsung (Live Realistic Preview)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-[#f4f8fd] px-2 py-0.5 rounded border border-blue-200/80">
                      Real-time Render
                    </span>
                  </div>

                  {editingChannel === 'WHATSAPP' ? (
                    /* WhatsApp Realistic Dark Chat Bubble */
                    <div className="bg-[#f0f7f4] rounded-2xl border border-blue-200/80 p-4 space-y-2.5 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            BP
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#1e3a5f] block">SIMONCER BBPOM Semarang</span>
                            <span className="text-[9px] text-emerald-700">Online • Centang Hijau Resmi</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600">Fonnte Cloud</span>
                      </div>

                      <div className="bg-[#202c33] rounded-2xl p-3.5 text-[#1e3a5f] font-sans text-xs leading-relaxed shadow-sm space-y-2 border border-blue-200">
                        <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed">
                          {previewWaText}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-slate-600 pt-1 border-t border-blue-200">
                          <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          <CheckCheck className="w-3.5 h-3.5 text-sky-700" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Email Realistic Official Letter Preview */
                    <div className="bg-[#f4f8fd] rounded-2xl border border-blue-200/80 p-4 space-y-2.5 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#1e3a5f] block">Subjek: {previewEmailSubj}</span>
                            <span className="text-[9px] text-blue-400">Pengirim: simoncer@pom.go.id (BBPOM Semarang)</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 text-slate-800 font-sans text-xs space-y-3 shadow-sm border border-slate-200">
                        <div className="border-b-2 border-blue-900 pb-2 flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-[11px] text-blue-950 tracking-wider block">
                              BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG
                            </span>
                            <span className="text-[9px] text-slate-500">
                              Jl Sukun Raya No 41 A Banyumanik Semarang • SIMONCER Portal
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                            RESMI
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-slate-700">
                          {previewEmailBody}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[9px] text-slate-600">Email ini diterbitkan otomatis oleh sistem SIMONCER</span>
                          <span className="px-3 py-1 bg-blue-700 text-white rounded text-[10px] font-bold">
                            Buka Sistem SIMONCER ↗
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LIVE TEST SEND SECTION WITH CURRENT EDITED TEXT */}
                  <div className="p-3.5 bg-[#f4f8fd] rounded-2xl border border-blue-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1e3a5f] flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Kirim Uji Coba Langsung (Menggunakan Teks Hasil Edit di Atas)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">No WhatsApp Uji Coba</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={testRecipientPhone}
                            onChange={(e) => setTestRecipientPhone(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                            placeholder="0812..."
                          />
                          <button
                            type="button"
                            disabled={isSendingTest}
                            onClick={() => handleTestSend('WHATSAPP')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 transition-colors"
                          >
                            {isSendingTest ? 'Mengirim...' : 'Tes WA'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Email Tujuan Uji Coba</label>
                        <div className="flex gap-1.5">
                          <input
                            type="email"
                            value={testRecipientEmail}
                            onChange={(e) => setTestRecipientEmail(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-blue-500"
                            placeholder="pic@sarana.co.id"
                          />
                          <button
                            type="button"
                            disabled={isSendingTest}
                            onClick={() => handleTestSend('EMAIL')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 transition-colors"
                          >
                            {isSendingTest ? 'Mengirim...' : 'Tes Email'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {testResult && (
                      <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in ${
                        testResult.success 
                          ? 'bg-emerald-50 border-emerald-500/40 text-emerald-200' 
                          : 'bg-rose-50 border-rose-500/40 text-rose-200'
                      }`}>
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-[11px]">
                          <strong>{testResult.success ? 'Berhasil Terkirim: ' : 'Gagal: '}</strong>
                          <span>{testResult.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LOG RIWAYAT NOTIFIKASI TERKIRIM                     */}
          {/* ========================================================= */}
          {activeTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                <div>
                  <span className="font-bold text-xs text-[#1e3a5f] block">Log Riwayat Pengiriman Notifikasi Otomatis</span>
                  <span className="text-[11px] text-slate-600">
                    Semua pesan WhatsApp dan Email yang otomatis tersalurkan dari sistem SIMONCER
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {recentLogs.length} Pesan Tercatat
                </span>
              </div>

              {recentLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-[#f8fbff] rounded-2xl border border-dashed border-blue-200/80 text-xs">
                  Belum ada log notifikasi pada sesi ini. Notifikasi akan tercatat secara otomatis saat ada perubahan status temuan, surat baru, atau pengiriman CAPA.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {recentLogs.map((log, idx) => (
                    <div
                      key={log.id || `notif-log-${idx}`}
                      className="p-3 bg-[#f4f8fd] border border-blue-200/80 rounded-xl space-y-1.5 text-xs hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {log.channel === 'WHATSAPP' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email
                            </span>
                          )}
                          <span className="font-semibold text-[#1e3a5f] truncate max-w-sm">{log.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600">
                          <span>{new Date(log.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-500/30">
                            DELIVERED
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-700 font-mono line-clamp-2 bg-white/85 p-2 rounded-lg border border-blue-200/80">
                        {log.content}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-600">
                        <span>Penerima: <strong className="text-slate-700">{log.recipient}</strong></span>
                        <span className="text-slate-500">Pemicu: {log.triggerEvent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MANAJEMEN AKUN PENGGUNA                             */}
          {/* ========================================================= */}
          {activeTab === 'ACCOUNTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="font-bold text-xs text-[#1e3a5f]">Daftar Akun Pengguna Sistem SIMONCER</h4>
                  <p className="text-[11px] text-slate-600">
                    Kelola kredensial akun internal (Admin Balai, Petugas Evaluator, dan Supervisor)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetAccounts}
                    className="px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-slate-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Bawaan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAddAccount}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-900/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Akun Baru</span>
                  </button>
                </div>
              </div>

              {accountSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{accountSuccessMsg}</span>
                </div>
              )}

              {/* Add Account Modal Form inline */}
              {isAddingAccount && (
                <form onSubmit={handleSaveAccountSubmit} className="p-4 bg-[#f4f8fd] rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                    <span className="font-bold text-xs text-emerald-700">Tambah Akun Pengguna Baru</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="text-slate-600 hover:text-[#1e3a5f]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {accountErrorMsg && (
                    <div className="p-2 bg-rose-50 border border-rose-500/50 rounded-lg text-xs text-rose-200">
                      {accountErrorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar *</label>
                      <input
                        type="text"
                        value={accountFormData.name}
                        onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                        placeholder="apt. Nama Petugas, M.Farm"
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Peran Akses (Role) *</label>
                      <select
                        value={accountFormData.role}
                        onChange={(e) => setAccountFormData({ ...accountFormData, role: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PETUGAS_EVALUATOR">Petugas Evaluator CAPA</option>
                        <option value="ADMIN">Admin Balai POM</option>
                        <option value="SUPERVISOR">Supervisor / Pimpinan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username Login *</label>
                      <input
                        type="text"
                        value={accountFormData.username}
                        onChange={(e) => setAccountFormData({ ...accountFormData, username: e.target.value })}
                        placeholder="eko.prasetyo"
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password *</label>
                      <input
                        type="password"
                        value={accountFormData.password}
                        onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Pegawai</label>
                      <input
                        type="text"
                        value={accountFormData.nip}
                        onChange={(e) => setAccountFormData({ ...accountFormData, nip: e.target.value })}
                        placeholder="19870512..."
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor WhatsApp Petugas</label>
                      <input
                        type="text"
                        value={accountFormData.phone}
                        onChange={(e) => setAccountFormData({ ...accountFormData, phone: e.target.value })}
                        placeholder="+62 811-..."
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-[#1e3a5f]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Simpan Akun
                    </button>
                  </div>
                </form>
              )}

              {/* Accounts Table */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Cari akun berdasarkan nama, username, atau NIP..."
                  className="w-full px-3.5 py-2 bg-[#f4f8fd] border border-blue-200/80 rounded-xl text-xs text-[#1e3a5f] focus:outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {filteredAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 bg-[#f4f8fd] border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1e3a5f] truncate block">{acc.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            acc.role === 'ADMIN' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-800'
                              : acc.role === 'SUPERVISOR'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {acc.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono block mt-0.5">
                          @{acc.username} {acc.nip ? `• NIP: ${acc.nip}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-white transition-colors cursor-pointer"
                          title="Hapus akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: DIREKTORI PETUGAS EVALUATOR                        */}
          {/* ========================================================= */}
          {activeTab === 'OFFICERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="font-bold text-xs text-[#1e3a5f]">Direktori Petugas Evaluator BBPOM di Semarang</h4>
                  <p className="text-[11px] text-slate-600">
                    Daftar auditor & evaluator yang terdaftar untuk penugasan verifikasi CAPA
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetOfficers}
                    className="px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-slate-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Bawaan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingOfficer(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-900/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Petugas</span>
                  </button>
                </div>
              </div>

              {isAddingOfficer && (
                <form onSubmit={handleSaveOfficer} className="p-4 bg-[#f4f8fd] rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                    <span className="font-bold text-xs text-emerald-700">Tambah Petugas Evaluator Baru</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingOfficer(false)}
                      className="text-slate-600 hover:text-[#1e3a5f]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Nama & Gelar *</label>
                      <input
                        type="text"
                        value={officerForm.name}
                        onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                        placeholder="apt. ..."
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">NIP Pegawai</label>
                      <input
                        type="text"
                        value={officerForm.nip}
                        onChange={(e) => setOfficerForm({ ...officerForm, nip: e.target.value })}
                        placeholder="198..."
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Nomor WhatsApp</label>
                      <input
                        type="text"
                        value={officerForm.phone}
                        onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })}
                        placeholder="+62 8..."
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Email Resmi</label>
                      <input
                        type="email"
                        value={officerForm.email}
                        onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                        placeholder="...@pom.go.id"
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingOfficer(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-[#1e3a5f]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Simpan Petugas
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {officers.map((off) => (
                  <div
                    key={off.id}
                    className="p-3 bg-[#f4f8fd] border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#1e3a5f] block truncate">{off.name}</span>
                      <span className="text-[10px] text-slate-600 block mt-0.5 truncate">{off.position}</span>
                      <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                        {off.phone} • {off.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteOfficer(off.id, off.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0"
                      title="Hapus petugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Unified Footer */}
        <div className="p-4 sm:p-5 bg-[#f4f8fd] border-t border-blue-200/80 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 text-xs text-slate-600 hover:text-[#1e3a5f] rounded-xl hover:bg-[#e8f1fb] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pulihkan Semua Pengaturan Bawaan</span>
          </button>

          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {saveSuccessMsg}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAllSettings}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Seluruh Pengaturan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
