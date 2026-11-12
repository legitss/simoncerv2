import React, { useState, useMemo } from 'react';
import { InspectionSession, UserRole } from '../types';
import { 
  X, 
  ArrowLeft,
  ArrowRight,
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  FileCheck2, 
  MessageSquare, 
  Mail, 
  History, 
  Printer, 
  Download, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  QrCode,
  Sparkles,
  Copy,
  Check,
  Smartphone,
  Share2,
  ZoomIn,
  Settings2,
  Table,
  Lock,
  Eye,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  ArrowUpDown,
  Activity,
  UserCheck,
  FolderOpen,
  Bell
} from 'lucide-react';
import { CommodityMatrixTable } from './CommodityMatrixTable';
import { SibergasSurveyForm } from './SibergasSurveyForm';
import { 
  formatIndonesianDate, 
  formatIndonesianDateTime, 
  calculateRemainingDays, 
  getStatusBadgeConfig,
  getCategoryBadge 
} from '../utils/date';
import { InspectionSummaryReportModal } from './InspectionSummaryReportModal';
import { generateInspectionSummaryPDF } from '../utils/pdfReportGenerator';
import { SrikandiWorkflowModal } from './SrikandiWorkflowModal';

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  currentRole: UserRole;
  onOpenSrikandiLetter: () => void;
  onOpenSubmitCapa: () => void;
  onOpenEvaluation: () => void;
  onOpenNotificationPreview: () => void;
  onOpenNotificationSettings?: () => void;
  onTriggerNotify: (channel: 'WHATSAPP' | 'EMAIL') => void;
  onOpenWaGatewaySettings?: () => void;
  onUpdateInspection?: (updated: InspectionSession) => void;
  onOpenFullPageMatrix?: (inspection: InspectionSession) => void;
  onOpenDocumentManager?: (inspectionId: string) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  isOpen,
  onClose,
  inspection,
  currentRole,
  onOpenSrikandiLetter,
  onOpenSubmitCapa,
  onOpenEvaluation,
  onOpenNotificationPreview,
  onOpenNotificationSettings,
  onTriggerNotify,
  onOpenWaGatewaySettings,
  onUpdateInspection,
  onOpenFullPageMatrix,
  onOpenDocumentManager,
}) => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'MATRIX' | 'SRIKANDI' | 'SIBERGAS' | 'NOTIF' | 'AUDIT'
  >('OVERVIEW');

  // Srikandi Workflow & Summary Report Modal State
  const [isSrikandiWorkflowOpen, setIsSrikandiWorkflowOpen] = useState(false);
  const [isSummaryReportOpen, setIsSummaryReportOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Direct Mobile Tracking URL
  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(inspection.capaCode)}`
    : `https://simoncer.id/track?code=${encodeURIComponent(inspection.capaCode)}`;

  // Supervisor Log Histori Filter & Search state
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState<string>('ALL');
  const [logTypeFilter, setLogTypeFilter] = useState<'ALL' | 'STATUS_ONLY' | 'DOCS_ONLY'>('ALL');
  const [logSortOrder, setLogSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [copiedLogSummary, setCopiedLogSummary] = useState(false);

  // Derived audit logs filtered for supervisor
  const filteredLogs = useMemo(() => {
    let logs = [...inspection.auditTrail];
    
    // Sort
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return logSortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    // Role filter
    if (logRoleFilter !== 'ALL') {
      logs = logs.filter((l) => {
        const r = l.role.toLowerCase();
        if (logRoleFilter === 'PETUGAS') return r.includes('petugas') || r.includes('evaluator');
        if (logRoleFilter === 'ADMIN') return r.includes('admin');
        if (logRoleFilter === 'SARANA') return r.includes('sarana');
        if (logRoleFilter === 'SISTEM') return r.includes('sistem');
        if (logRoleFilter === 'SUPERVISOR') return r.includes('supervisor');
        return true;
      });
    }

    // Type filter
    if (logTypeFilter === 'STATUS_ONLY') {
      logs = logs.filter((l) => 
        l.action.toLowerCase().includes('status') || 
        l.details.toLowerCase().includes('status') ||
        l.action.toLowerCase().includes('selesai') ||
        l.action.toLowerCase().includes('closed') ||
        l.action.toLowerCase().includes('perbaikan')
      );
    } else if (logTypeFilter === 'DOCS_ONLY') {
      logs = logs.filter((l) => 
        l.action.toLowerCase().includes('surat') || 
        l.action.toLowerCase().includes('dokumen') ||
        l.action.toLowerCase().includes('berkas') ||
        l.action.toLowerCase().includes('tte') ||
        l.action.toLowerCase().includes('matriks')
      );
    }

    // Search query
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      logs = logs.filter((l) => 
        l.action.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
      );
    }

    return logs;
  }, [inspection.auditTrail, logSortOrder, logRoleFilter, logTypeFilter, logSearchQuery]);

  const auditStats = useMemo(() => {
    const total = inspection.auditTrail.length;
    const statusChanges = inspection.auditTrail.filter((l) => 
      l.action.toLowerCase().includes('status') || 
      l.details.toLowerCase().includes('status') ||
      l.action.toLowerCase().includes('selesai') ||
      l.action.toLowerCase().includes('perbaikan')
    ).length;
    const docs = inspection.auditTrail.filter((l) =>
      l.action.toLowerCase().includes('surat') || 
      l.action.toLowerCase().includes('dokumen') ||
      l.action.toLowerCase().includes('berkas') ||
      l.action.toLowerCase().includes('tte')
    ).length;
    const uniqueActors = new Set(inspection.auditTrail.map((l) => l.actor)).size;
    return { total, statusChanges, docs, uniqueActors };
  }, [inspection.auditTrail]);

  const handleCopyLogSummary = () => {
    const lines = inspection.auditTrail.map((log, idx) => 
      `${idx + 1}. [${formatIndonesianDateTime(log.timestamp)}] (${log.role} - ${log.actor}): ${log.action}\n   Rincian: ${log.details}`
    ).join('\n\n');
    
    const summaryText = `=== LOG HISTORI & JEJAK AUDIT SESI ${inspection.capaCode} ===\nSarana: ${inspection.facility.name}\nStatus Terkini: ${inspection.status}\nTotal Aktivitas: ${inspection.auditTrail.length} Entri\nTerakhir Diperbarui: ${formatIndonesianDateTime(inspection.updatedAt)}\n\n${lines}\n\nDicatat secara terenkripsi oleh Sistem SIMONCER - BBPOM di Semarang`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedLogSummary(true);
      setTimeout(() => setCopiedLogSummary(false), 2500);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleQuickDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await generateInspectionSummaryPDF(inspection);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Gagal mengunduh berkas PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleQuickSaveMatrix = () => {
    const now = new Date().toISOString();
    const updated: InspectionSession = {
      ...inspection,
      srikandiWorkflow: {
        ...(inspection.srikandiWorkflow || {}),
        isMatrixSaved: true,
        matrixSavedAt: now,
        matrixSavedBy: inspection.assignedOfficer?.name || inspection.leadAuditor,
        matrixDocumentName: `Lampiran_Matriks_CAPA_${inspection.capaCode}.pdf`,
      },
      auditTrail: [
        {
          id: `LOG-${Date.now()}`,
          action: 'Matriks CAPA Terbentuk Disimpan Resmi',
          actor: inspection.assignedOfficer?.name || inspection.leadAuditor,
          role: 'Petugas / Evaluator',
          timestamp: now,
          details: `Matriks CAPA resmi untuk ${inspection.facility.name} telah difinalisasi dan disimpan sebagai dokumen lampiran SRIKANDI.`,
          badgeType: 'success',
        },
        ...inspection.auditTrail,
      ],
    };
    if (onUpdateInspection) {
      onUpdateInspection(updated);
    }
  };

  if (!isOpen) return null;

  const statusConfig = getStatusBadgeConfig(inspection.status);
  const sla = calculateRemainingDays(inspection.srikandiLetter.deadlineDate);

  const totalFindings = inspection.findings.length;
  const countKritis = inspection.findings.filter((f) => f.category === 'KRITIS').length;
  const countMayor = inspection.findings.filter((f) => f.category === 'MAYOR').length;
  const countMinor = inspection.findings.filter((f) => f.category === 'MINOR').length;

  const totalFiles = inspection.findings.reduce(
    (acc, f) => acc + f.capa.evidenceFiles.length,
    0
  );
  const isRequiresCapa = inspection.requiresCapa !== false && totalFindings > 0;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Dossier Header Bar (Full Screen Page Header) */}
        <div className="bg-white text-[#1e3a5f] px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-blue-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] hover:text-[#1e3a5f] rounded-xl transition-all cursor-pointer text-xs font-semibold border border-blue-200 shadow-xs"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-500/40">
                  {inspection.capaCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#e8f1fb] text-slate-700 font-medium border border-blue-200">
                  {inspection.facility.type}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                  {statusConfig.label}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#1e3a5f] mt-1">
                {inspection.facility.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Srikandi SOP Workflow Button: only for Sarana, hidden for Petugas and Admin */}
            {currentRole === 'SARANA' && (
              <button
                onClick={() => setIsSrikandiWorkflowOpen(true)}
                type="button"
                className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white border border-purple-400/40 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
                title="Alur SOP Evaluasi & TTE SRIKANDI (5 Tahap Lengkap)"
              >
                <ShieldCheck className="w-4 h-4 text-purple-800" />
                <span className="hidden sm:inline">Alur TTE SRIKANDI</span>
              </button>
            )}

            {/* Document Manager Button */}
            {onOpenDocumentManager && (
              <button
                onClick={() => onOpenDocumentManager(inspection.id)}
                type="button"
                className="px-2.5 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-400/40 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
                title="Buka Sistem Manajemen Dokumen Pemeriksaan Sesi Ini"
              >
                <FolderOpen className="w-4 h-4 text-sky-800" />
                <span className="hidden sm:inline">Dokumen Sesi</span>
              </button>
            )}

            {/* Summary PDF Report Modal Button */}
            <button
              onClick={() => setIsSummaryReportOpen(true)}
              type="button"
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
              title="Buka Lembar Laporan Ringkasan PDF Resmi Temuan"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan PDF</span>
            </button>

            {/* Direct Quick Download PDF Button */}
            <button
              onClick={handleQuickDownloadPdf}
              disabled={isDownloadingPdf}
              type="button"
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white border border-emerald-400/40 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
              title="Unduh Berkas Ringkasan Temuan (PDF Resmi)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">{isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={() => window.print()}
              type="button"
              className="p-2 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#e8f1fb] rounded-lg transition-colors hidden sm:block cursor-pointer"
              title="Cetak Berkas Sesi Pemeriksaan"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-600 hover:text-[#1e3a5f] hover:bg-[#e8f1fb] rounded-lg transition-colors cursor-pointer"
              title="Tutup Halaman (Kembali ke Beranda)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Cleaned: Srikandi hidden for Petugas/Admin; Redundant Bukti CAPA and Evaluasi removed) */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-4 pt-2 gap-1.5 text-xs font-semibold overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'OVERVIEW', label: 'Ringkasan & Alur Sesi', icon: <Building2 className="w-4 h-4" /> },
            { id: 'MATRIX', label: 'Matriks Komoditi (PDF)', icon: <Table className="w-4 h-4 text-emerald-600" /> },
            ...(currentRole === 'SARANA' ? [
              { id: 'SRIKANDI', label: 'Surat SRIKANDI (TTE)', icon: <FileText className="w-4 h-4" /> },
            ] : []),
            { 
              id: 'SIBERGAS', 
              label: `Survei Integritas SIBERGAS ${inspection.sibergasSurvey?.completed ? '✓' : ''}`, 
              icon: <ShieldCheck className={`w-4 h-4 ${inspection.sibergasSurvey?.completed ? 'text-emerald-600' : 'text-slate-600'}`} /> 
            },
            { id: 'NOTIF', label: `Log WA & Email (${inspection.notifications.length})`, icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'AUDIT', label: `Log Histori (${inspection.auditTrail.length})`, icon: <History className="w-4 h-4 text-indigo-600" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 border-t-2 border-emerald-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dossier Content Body */}
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Top Quick Actions Banner */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Aksi Terkait Sesi Pemeriksaan Ini:
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {currentRole === 'SARANA' && (
                      <button
                        onClick={onOpenSrikandiLetter}
                        type="button"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>Surat SRIKANDI TTE</span>
                      </button>
                    )}

                    {/* Dynamic Action Buttons based on isRequiresCapa */}
                    {isRequiresCapa ? (
                      currentRole === 'SARANA' ? (
                        <button
                          onClick={onOpenSubmitCapa}
                          type="button"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Input / Perbaiki CAPA</span>
                        </button>
                      ) : (
                        <button
                          onClick={onOpenSubmitCapa}
                          type="button"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                          title="Pratinjau berkas yang diserahkan sarana (Mode Hanya Baca - Petugas tidak mengubah data sarana)"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Lihat Berkas Sarana (Read-Only)</span>
                        </button>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold border border-teal-200 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Audit Selesai (Tidak Wajib CAPA)</span>
                      </span>
                    )}

                    {/* ONLY Officers / Admin / Supervisor can evaluate CAPA! Sarana is strictly blocked */}
                    {currentRole !== 'SARANA' && isRequiresCapa && (
                      <button
                        onClick={onOpenEvaluation}
                        type="button"
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        title="Evaluasi berkas CAPA dan tetapkan status verifikasi"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Evaluasi CAPA (Petugas / Evaluator)</span>
                      </button>
                    )}

                    {/* Jembatan TTE SRIKANDI: Menghubungkan telaah CAPA dengan Naskah TTE Kepala Balai */}
                    {currentRole !== 'SARANA' && isRequiresCapa && (
                      <button
                        onClick={() => setIsSrikandiWorkflowOpen(true)}
                        type="button"
                        className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        title="Jembatan Evaluasi: Unduh Matriks, Draf Surat Pengantar, dan Catat Naskah TTE SRIKANDI"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-800" />
                        <span>Jembatan TTE SRIKANDI</span>
                      </button>
                    )}

                    {/* Notification Preview: Officers / Admin only */}
                    {currentRole !== 'SARANA' && (
                      <button
                        onClick={onOpenNotificationPreview}
                        type="button"
                        className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Preview Pesan WA/Email</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Deadline SLA Badge / Status Kewajiban CAPA */}
                {isRequiresCapa ? (
                  <div className={`p-3 rounded-xl border shrink-0 ${
                    inspection.status === 'SELESAI_CLOSED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : sla.isOverdue
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {inspection.status === 'SELESAI_CLOSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-700" />
                      )}
                      <span>Batas Waktu CAPA (SLA)</span>
                    </div>
                    <div className="text-xs mt-0.5">
                      {inspection.status === 'SELESAI_CLOSED' ? (
                        <span><strong>Tuntas (Closed)</strong> • SLA Terpenuhi</span>
                      ) : (
                        <span><strong>{formatIndonesianDate(inspection.srikandiLetter.deadlineDate)}</strong> ({sla.text})</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 shrink-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-teal-900">
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                      <span>Status Kewajiban CAPA</span>
                    </div>
                    <div className="text-xs mt-0.5">
                      <strong className="text-teal-900">Tidak Wajib CAPA</strong> • Memenuhi Ketentuan (MK)
                    </div>
                  </div>
                )}
              </div>

              {/* Alur Rekam Dokumen Terintegrasi & Tindak Lanjut Pemeriksaan */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        Alur Rekam Dokumen & Tindak Lanjut Pemeriksaan Sarana
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Tata kelola naskah dinas SRIKANDI (TTE BSrE) dan monitoring respon tindak lanjut sarana
                      </p>
                    </div>
                  </div>

                  <div>
                    {isRequiresCapa ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1.5 shadow-2xs">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-700" />
                        <span>Sarana Wajib Mengirimkan CAPA ({totalFindings} Temuan)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>Sarana Tidak Wajib Mengirimkan CAPA (Memenuhi Ketentuan / Pembinaan)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Keterangan Surat Tindak Lanjut yang Dikirimkan ke Sarana */}
                <div className="p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-indigo-600 text-white">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        Surat Tindak Lanjut Hasil Pemeriksaan (TTE SRIKANDI) yang Dikirimkan ke Sarana
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      TTE BSrE Sah: {inspection.srikandiLetter.tteId || 'BSRE-VERIFIED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-600 block font-semibold">Nomor Surat Naskah Dinas</span>
                      <span className="font-mono font-bold text-slate-900 truncate block">{inspection.srikandiLetter.letterNo}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-600 block font-semibold">Tanggal Terbit & Penandatanganan</span>
                      <span className="font-semibold text-slate-900">{formatIndonesianDate(inspection.srikandiLetter.issuedDate)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-600 block font-semibold">Saluran Penerima Sarana</span>
                      <span className="font-semibold text-slate-900 truncate block">WhatsApp ({inspection.facility.picPhone})</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900">Perihal / Hal: </span>
                    <span>{inspection.srikandiLetter.subject || (isRequiresCapa ? 'Penyampaian Hasil Pemeriksaan dan Permintaan Tindak Lanjut (CAPA)' : 'Penyampaian Surat Hasil Pemeriksaan (Memenuhi Ketentuan)')}</span>
                    <span className="block mt-1 text-slate-600">
                      {isRequiresCapa ? (
                        <span className="text-purple-950 font-semibold">
                          • <strong>Ketentuan Tindak Lanjut:</strong> Berdasarkan temuan ketidakpatuhan ({totalFindings} butir), sarana diwajibkan menyusun dan mengirimkan dokumen perbaikan (CAPA) maksimal {inspection.srikandiLetter.deadlineDays || 14} hari kerja (Senin–Jumat, tidak termasuk akhir pekan & libur nasional) terhitung sejak tanggal pertama kali surat tindak lanjut diterima sarana (Batas Waktu SLA: <strong>{formatIndonesianDate(inspection.srikandiLetter.deadlineDate)}</strong> • <span className="font-bold underline">{sla.text}</span>).
                        </span>
                      ) : (
                        <span className="text-teal-950 font-semibold">
                          • <strong>Ketentuan Tindak Lanjut:</strong> Hasil pemeriksaan sarana dinyatakan <strong>Memenuhi Ketentuan (MK) / Pembinaan</strong>. Surat tindak lanjut ini bersifat pemberitahuan resmi dan sarana <strong>TIDAK diwajibkan mengirimkan dokumen CAPA</strong>.
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Dynamic Stepper Grid */}
                {isRequiresCapa ? (
                  /* ALUR UNTUK SARANA WAJIB CAPA (5 TAHAPAN) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      {
                        step: '1',
                        title: 'Pemeriksaan Petugas',
                        sub: formatIndonesianDate(inspection.inspectionDate),
                        desc: `${totalFindings} butir temuan audit dicatat`,
                        done: true,
                      },
                      {
                        step: '2',
                        title: 'Surat Tindak Lanjut (TTE)',
                        sub: inspection.srikandiLetter.letterNo,
                        desc: 'Terkirim ke WA PIC Sarana',
                        done: true,
                      },
                      {
                        step: '3',
                        title: 'Pengiriman CAPA Sarana',
                        sub: `${totalFiles} berkas bukti`,
                        desc: inspection.status !== 'MENUNGGU_CAPA' && inspection.status !== 'SURAT_TERBIT'
                          ? 'CAPA telah diserahkan sarana'
                          : 'Menunggu respon sarana',
                        done:
                          inspection.status !== 'MENUNGGU_CAPA' &&
                          inspection.status !== 'SURAT_TERBIT',
                      },
                      {
                        step: '4',
                        title: 'Evaluasi CAPA Petugas',
                        sub:
                          inspection.status === 'MASIH_EVALUASI'
                            ? 'Sedang berlangsung'
                            : inspection.status === 'PERLU_PERBAIKAN'
                            ? 'Perlu Revisi (Open)'
                            : inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED'
                            ? 'Selesai disetujui (Close)'
                            : 'Belum verifikasi',
                        desc: 'Telaah kecukupan bukti dukung',
                        done:
                          inspection.status === 'TERVALIDASI' ||
                          inspection.status === 'SELESAI_CLOSED',
                      },
                      {
                        step: '5',
                        title: 'Surat Penutupan / Selesai',
                        sub: inspection.status === 'SELESAI_CLOSED' ? 'Tuntas (Closed Audit)' : 'Menunggu Penutupan',
                        desc: 'Naskah dinas penutupan TTE sah',
                        done: inspection.status === 'SELESAI_CLOSED',
                      },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className={`p-3.5 rounded-xl border transition-all ${
                          s.done
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.done ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-white text-slate-600 border border-slate-200'
                          }`}>
                            Tahap {s.step}
                          </span>
                          {s.done ? (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">Menunggu</span>
                          )}
                        </div>
                        <p className="font-bold text-xs text-slate-900">{s.title}</p>
                        <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">{s.sub}</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ALUR UNTUK SARANA TIDAK WAJIB CAPA (4 TAHAPAN) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        step: '1',
                        title: 'Pemeriksaan Petugas',
                        sub: formatIndonesianDate(inspection.inspectionDate),
                        desc: `Audit lapangan oleh ${inspection.leadAuditor}`,
                        done: true,
                      },
                      {
                        step: '2',
                        title: 'Penerbitan Surat Tindak Lanjut',
                        sub: inspection.srikandiLetter.letterNo,
                        desc: 'Naskah TTE SRIKANDI resmi Kepala Balai',
                        done: true,
                      },
                      {
                        step: '3',
                        title: 'Surat Terkirim ke Sarana',
                        sub: `WhatsApp: ${inspection.facility.picPhone}`,
                        desc: 'Naskah terkirim resmi ke PIC Sarana',
                        done: true,
                      },
                      {
                        step: '4',
                        title: 'Selesai / Diarsipkan',
                        sub: 'Memenuhi Ketentuan (Tanpa CAPA)',
                        desc: 'Pemeriksaan tuntas tanpa kewajiban CAPA',
                        done: true,
                      },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className="p-3.5 rounded-xl border bg-teal-50/70 border-teal-300 text-teal-950 shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300">
                            Tahap {s.step}
                          </span>
                          <span className="text-teal-700 font-bold text-xs flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Tuntas</span>
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-900">{s.title}</p>
                        <p className="text-[11px] font-mono text-teal-900 truncate mt-0.5">{s.sub}</p>
                        <p className="text-[10px] text-slate-600 mt-1 leading-tight">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* PANEL LOG HISTORI AKTIVITAS & PERUBAHAN STATUS (SUPERVISOR AUDIT TRACK)    */}
              {/* ========================================================================= */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          Panel Log Histori & Riwayat Status Sesi
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Audit Trail Supervisor
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Daftar kronologis mutasi status dan aktivitas pengguna untuk pengawasan supervisor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('AUDIT')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Buka Log Lengkap ({inspection.auditTrail.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Supervisor Metrics Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block font-semibold">Total Log Tercatat</span>
                    <span className="font-extrabold text-slate-900 text-sm">{inspection.auditTrail.length} Aktivitas</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block font-semibold">Status Terkini</span>
                    <span className="font-bold text-slate-900 text-xs truncate block">{statusConfig.label}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block font-semibold">Batas Waktu (SLA)</span>
                    <span className="font-bold text-purple-900 text-xs">{sla.text}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block font-semibold">Pembaruan Terakhir</span>
                    <span className="font-mono font-medium text-slate-700 text-[11px] truncate block">
                      {formatIndonesianDateTime(inspection.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Recent Chronological Entries */}
                <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pt-1">
                  {inspection.auditTrail.slice(0, 4).map((log, index) => (
                    <div key={log.id} className="relative group">
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                          index === 0 ? 'ring-2 ring-indigo-400 animate-pulse ' : ''
                        }${
                          log.badgeType === 'danger'
                            ? 'bg-rose-500'
                            : log.badgeType === 'warning'
                            ? 'bg-amber-500'
                            : log.badgeType === 'purple'
                            ? 'bg-purple-500'
                            : log.badgeType === 'success'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl space-y-1 transition-colors">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {log.action}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              log.role.toLowerCase().includes('petugas') || log.role.toLowerCase().includes('evaluator')
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : log.role.toLowerCase().includes('admin')
                                ? 'bg-slate-200 text-slate-800 border-slate-300'
                                : log.role.toLowerCase().includes('sarana')
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                              {log.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {formatIndonesianDateTime(log.timestamp)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Aktor: <strong className="text-slate-700">{log.actor}</strong>
                        </div>
                        <p className="text-slate-700 text-xs pt-1 border-t border-slate-200/60 leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {inspection.auditTrail.length > 4 && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('AUDIT')}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat {inspection.auditTrail.length - 4} riwayat aktivitas sebelumnya pada Tab Log Histori Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Access & SLA Card for Sarana */}
              <div className="p-4 sm:p-5 bpom-hero-gradient rounded-2xl border border-blue-200 text-[#1e3a5f] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-emerald-700" />
                      AKSES PELACAKAN MANDIRI SARANA
                    </span>
                    <span className="text-[10px] text-slate-700">
                      Kode Unik: <strong className="text-[#1e3a5f] font-mono">{inspection.capaCode}</strong>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm sm:text-base text-[#1e3a5f]">
                    Tautan Akses Mandiri Sarana ({inspection.facility.name})
                  </h4>

                  <p className="text-xs text-slate-700 max-w-xl leading-relaxed">
                    Sarana dapat mengakses portal pelacakan menggunakan kode unik <strong>{inspection.capaCode}</strong> untuk memantau batas SLA (<strong>{sla.text}</strong>) dan mengunggah dokumen bukti perbaikan secara mandiri tanpa harus login.
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-mono text-emerald-700 font-bold bg-[#f4f8fd] px-2.5 py-1 rounded-lg border border-blue-200/80 truncate max-w-xs sm:max-w-md select-all">
                      {trackingUrl}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    title="Salin tautan pelacakan ke clipboard"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
                  </button>
                </div>
              </div>

              {/* SIBERGAS Survey Status Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${inspection.sibergasSurvey?.completed ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <span>Survei Integritas Petugas (SIBERGAS)</span>
                        {inspection.sibergasSurvey?.completed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Telah Diisi Sarana
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Menunggu Pengisian
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {inspection.sibergasSurvey?.completed
                          ? `Diselesaikan pada ${formatIndonesianDate(inspection.sibergasSurvey.submittedAt.split('T')[0])} sebagai prasyarat pengiriman CAPA.`
                          : 'Sarana wajib mengisi kuesioner integritas petugas saat pertama kali mengirimkan CAPA.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('SIBERGAS')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{inspection.sibergasSurvey?.completed ? 'Lihat Hasil Survei' : 'Buka Tab SIBERGAS'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {inspection.sibergasSurvey?.completed && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-600 block font-semibold">Tunjukkan ID / Tugas</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {inspection.sibergasSurvey.petugasIdCard.includes('Ya') ? '✓ Ya, Menunjukkan' : '✕ Tidak'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-600 block font-semibold">Profesional & Sopan</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {inspection.sibergasSurvey.profesional.includes('Ya') ? '✓ Sopan & Profesional' : '✕ Tidak Sopan'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-600 block font-semibold">Bebas Gratifikasi</span>
                      <span className="font-bold text-emerald-700 text-[11px]">
                        {inspection.sibergasSurvey.gratifikasi.includes('Tidak') ? '✓ Bebas Gratifikasi' : '✕ Ada Gratifikasi'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-600 block font-semibold">Bebas Pemerasan</span>
                      <span className="font-bold text-emerald-700 text-[11px]">
                        {inspection.sibergasSurvey.pemerasan.includes('Tidak') ? '✓ Bebas Pemerasan' : '✕ Ada Pemerasan'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Sarana & Pemeriksa Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Sarana */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Profil Sarana / Pelaku Usaha
                  </h4>
                  <table className="w-full text-slate-700">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 w-32 font-medium">Nama Sarana</td>
                        <td className="py-1 font-bold text-slate-900">{inspection.facility.name}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 font-medium">Jenis Sarana</td>
                        <td className="py-1 font-semibold">{inspection.facility.type}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 font-medium">Nomor Izin / NIB</td>
                        <td className="py-1 font-mono">{inspection.facility.licenseNo}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 font-medium">PIC / Apoteker PJ</td>
                        <td className="py-1 font-semibold">{inspection.facility.picName}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 font-medium">WhatsApp PIC</td>
                        <td className="py-1 font-mono text-emerald-700 font-semibold">{inspection.facility.picPhone}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-500 font-medium">Email PIC</td>
                        <td className="py-1 font-mono text-blue-700">{inspection.facility.picEmail}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Data Petugas / Evaluator PIC */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Petugas / Evaluator PIC yang Ditugaskan
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Penugasan Resmi
                    </span>
                  </div>
                  <table className="w-full text-slate-700">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 w-32 font-medium">Nama Petugas</td>
                        <td className="py-1 font-bold text-slate-900">
                          {inspection.assignedOfficer?.name || inspection.leadAuditor}
                        </td>
                      </tr>
                      {inspection.assignedOfficer?.nip && (
                        <tr className="border-b border-slate-100">
                          <td className="py-1 text-slate-500 font-medium">NIP Petugas</td>
                          <td className="py-1 font-mono text-slate-700">{inspection.assignedOfficer.nip}</td>
                        </tr>
                      )}
                      {inspection.assignedOfficer?.position && (
                        <tr className="border-b border-slate-100">
                          <td className="py-1 text-slate-500 font-medium">Jabatan</td>
                          <td className="py-1 text-slate-700 text-[11px]">{inspection.assignedOfficer.position}</td>
                        </tr>
                      )}
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 font-medium">WhatsApp Petugas</td>
                        <td className="py-1">
                          <span className="font-mono font-bold text-emerald-800 inline-flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            {inspection.assignedOfficer?.phone || '+62 812-7788-9911'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 font-medium">Tanggal Sesi</td>
                        <td className="py-1 font-semibold">
                          {formatIndonesianDate(inspection.inspectionDate)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-500 font-medium">Ruang Lingkup</td>
                        <td className="py-1 leading-snug">{inspection.inspectionScope}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Findings Summary Table */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      Daftar Temuan Ketidaksesuaian ({inspection.findings.length} Butir)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Rincian klausul audit regulasi dan status pemenuhan perbaikan sarana
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSummaryReportOpen(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Buka pratinjau lembar laporan temuan dan cetak PDF resmi"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Lihat / Cetak Laporan Temuan</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Unduh langsung dokumen PDF rangkuman temuan resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloadingPdf ? 'Memproses...' : 'Unduh PDF'}</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {inspection.findings.map((f, idx) => {
                    const catBadge = getCategoryBadge(f.category);
                    return (
                      <div
                        key={f.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            #{idx + 1} - {f.clause}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${catBadge.badge}`}
                          >
                            {f.category}
                          </span>
                        </div>
                        <p className="text-slate-700">{f.description}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <span>
                              Bukti Terunggah: <strong>{f.capa.evidenceFiles.length} berkas</strong>
                            </span>
                            {f.capa.evidenceDriveUrl && (
                              <a
                                href={f.capa.evidenceDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold hover:underline"
                                title="Buka Google Drive Bukti Sarana"
                              >
                                <span>📁 Drive Bukti ↗</span>
                              </a>
                            )}
                          </div>
                          <span
                            className={`font-semibold ${
                              f.capa.evaluationStatus === 'MEMADAI'
                                ? 'text-emerald-700'
                                : f.capa.evaluationStatus === 'REVISI'
                                ? 'text-rose-700'
                                : 'text-slate-500'
                            }`}
                          >
                            Status Evaluasi: {f.capa.evaluationStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRIKS KOMODITI (PDF & STANDAR RESMI BPOM) */}
          {activeTab === 'MATRIX' && (
            <div className="space-y-4">
              <div className="p-4 bpom-hero-gradient text-[#1e3a5f] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-700/40 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">
                    <Table className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-[#1e3a5f]">
                        Matriks CAPA Sesuai Jenis Fasilitas: {inspection.facility.type}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 font-bold border border-emerald-400/40">
                        Format Standar BPOM
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      Tata letak kolom, klausul butir temuan, persyaratan, hingga analisis kesenjangan disesuaikan secara otomatis berdasarkan formulir resmi BPOM untuk komoditi ini.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => setIsSrikandiWorkflowOpen(true)}
                    type="button"
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    title="Buka 5 Tahap Alur SOP Evaluasi & TTE SRIKANDI"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-800" />
                    <span>Alur TTE SRIKANDI</span>
                  </button>

                  <button
                    onClick={() => setIsSummaryReportOpen(true)}
                    type="button"
                    className="px-3 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Buka Laporan PDF Resmi Lengkap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Laporan PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenFullPageMatrix) {
                        onOpenFullPageMatrix(inspection);
                      } else {
                        onOpenSubmitCapa();
                      }
                    }}
                    type="button"
                    className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    title="Buka Matriks ini dalam Tampilan Penuh Layar tanpa batasan pop-up dialog agar seluruh kolom terbaca jelas"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Matriks Halaman Penuh (Bukan Pop-up)</span>
                  </button>

                  {currentRole === 'SARANA' && (
                    <button
                      onClick={onOpenSubmitCapa}
                      type="button"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Input / Perbaiki CAPA</span>
                    </button>
                  )}
                </div>
              </div>

              {/* The Official Commodity Matrix Table */}
              <CommodityMatrixTable
                inspection={inspection}
                currentRole={currentRole}
                onEditFinding={() => {
                  if (currentRole === 'SARANA') {
                    onOpenSubmitCapa();
                  }
                }}
                onSaveMatrix={handleQuickSaveMatrix}
                onOpenSrikandiWorkflow={() => setIsSrikandiWorkflowOpen(true)}
              />
            </div>
          )}

          {/* TAB: SRIKANDI TTE (Khusus Role Sarana) */}
          {activeTab === 'SRIKANDI' && currentRole === 'SARANA' && (
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-100 text-purple-800">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {inspection.srikandiLetter.letterNo}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        TTE TERVERIFIKASI BSrE
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {inspection.srikandiLetter.subject}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Diterbitkan: {formatIndonesianDate(inspection.srikandiLetter.issuedDate)} • Penandatangan: {inspection.srikandiLetter.signerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsSrikandiWorkflowOpen(true)}
                    type="button"
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-800" />
                    <span>Kelola Alur & Naskah SRIKANDI</span>
                  </button>

                  <button
                    onClick={onOpenSrikandiLetter}
                    type="button"
                    className="px-3.5 py-2 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tampilan Surat Dinas</span>
                  </button>
                </div>
              </div>

              {/* TTE Certificate Detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 md:col-span-2 space-y-3">
                  <h4 className="font-bold text-slate-800">Metadata Sertifikat TTE SRIKANDI</h4>
                  <table className="w-full text-slate-700">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500 w-36">ID TTE Digital</td>
                        <td className="py-1 font-mono font-bold">{inspection.srikandiLetter.tteId}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500">Waktu Penandatanganan</td>
                        <td className="py-1 font-mono">
                          {formatIndonesianDateTime(inspection.srikandiLetter.tteTimestamp)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-slate-500">Lembaga Sertifikasi</td>
                        <td className="py-1 font-semibold">
                          Balai Sertifikasi Elektronik (BSrE) - BSSN RI
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-500">Tautan Validasi Publik</td>
                        <td className="py-1 font-mono text-emerald-700 truncate">
                          {inspection.srikandiLetter.tteQrCodeContent}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <QrCode className="w-20 h-20 text-slate-800 mb-2" />
                  <span className="text-[10px] font-mono font-bold text-slate-700">
                    SCAN VERIFIKASI TTE
                  </span>
                  <span className="text-[9px] text-slate-600 mt-0.5">
                    Aplikasi SRIKANDI Pemerintah RI
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SURVEI INTEGRITAS SIBERGAS */}
          {activeTab === 'SIBERGAS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Integrasi SIBERGAS: Survei Kepuasan & Integritas Petugas</span>
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Rekam survei kepuasan dan integritas petugas pengawas yang diisi oleh sarana ({inspection.facility.name}) menuju Zona Integritas (WBK/WBBM).
                  </p>
                </div>

                {!inspection.sibergasSurvey?.completed && (
                  <button
                    onClick={onOpenSubmitCapa}
                    type="button"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Isi Survei & Kirim CAPA</span>
                  </button>
                )}
              </div>

              {inspection.sibergasSurvey?.completed ? (
                <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-5">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-950">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <strong>Survei Integritas SIBERGAS Selesai:</strong> Diserahkan pada{' '}
                        {formatIndonesianDateTime(inspection.sibergasSurvey.submittedAt)} oleh PIC sarana ({inspection.facility.picName}).
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                      STATUS: VALID / TERVERIFIKASI
                    </span>
                  </div>

                  <SibergasSurveyForm
                    inspection={inspection}
                    initialData={inspection.sibergasSurvey}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">
                    Survei Integritas Petugas Belum Diisi
                  </h4>
                  <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                    Sistem SIMONCER mengintegrasikan SIBERGAS, di mana sarana atau pelaku usaha ({inspection.facility.name}) diwajibkan untuk mengisi survei kepuasan & integritas petugas sebelum mengirimkan dokumen perbaikan CAPA untuk pertama kali.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onOpenSubmitCapa}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Buka Form Pengisian CAPA & Survei SIBERGAS</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* TAB 5: NOTIF LOG */}
          {activeTab === 'NOTIF' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Log Notifikasi Otomatis Terkirim
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Rekaman pengiriman pesan resmi WhatsApp dan Email ke pihak sarana
                  </p>
                </div>

                {currentRole !== 'SARANA' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {onOpenWaGatewaySettings && (
                      <button
                        onClick={onOpenWaGatewaySettings}
                        type="button"
                        className="px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-emerald-800 border border-emerald-500/40 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                        title="Pengaturan WhatsApp Gateway Fonnte & Provider Lainnya"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Pengaturan Gateway WA</span>
                      </button>
                    )}
                    <button
                      onClick={() => onTriggerNotify('WHATSAPP')}
                      type="button"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim Ulang WA</span>
                    </button>
                    <button
                      onClick={() => onTriggerNotify('EMAIL')}
                      type="button"
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Kirim Ulang Email</span>
                    </button>
                    {onOpenNotificationSettings && (
                      <button
                        onClick={onOpenNotificationSettings}
                        type="button"
                        className="px-3 py-1.5 bg-white hover:bg-[#e8f1fb] text-emerald-800 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30"
                        title="Sesuaikan saluran penerima & pemicu otomatis"
                      >
                        <Bell className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Pengaturan Notifikasi Otomatis</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {inspection.notifications.map((notif, idx) => (
                  <div
                    key={notif.id || idx}
                    className="p-4 bg-white rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            notif.channel === 'WHATSAPP'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {notif.channel === 'WHATSAPP' ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </span>
                        <span className="font-bold text-slate-900">{notif.channel}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                          {notif.triggerEvent}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-mono">
                        {formatIndonesianDateTime(notif.sentAt)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Tujuan: <strong className="font-mono">{notif.recipient}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 font-sans whitespace-pre-line text-[11px] leading-relaxed">
                      {notif.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL / LOG HISTORI LENGKAP */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-5">
              {/* Header Panel & Export Actions */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
                      <History className="w-5 h-5" />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Log Histori & Jejak Audit Sesi (Supervisor Track)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Tervalidasi Sistem
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                    Rekam jejak kronologis seluruh mutasi status sesi, penyerahan berkas CAPA, penerbitan surat pengantar TTE SRIKANDI, serta aksi pengguna secara transparan dan akuntabel untuk audit pengawas.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLogSummary}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    title="Salin seluruh ringkasan audit log ke clipboard untuk laporan audit"
                  >
                    {copiedLogSummary ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-indigo-600" />
                        <span>Salin Ringkasan Log</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogSortOrder(logSortOrder === 'DESC' ? 'ASC' : 'DESC')}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Ubah urutan kronologis waktu"
                  >
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                    <span>{logSortOrder === 'DESC' ? 'Terbaru Dahulu' : 'Terlama Dahulu'}</span>
                  </button>
                </div>
              </div>

              {/* KPI Audit Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-medium">Total Aktivitas</span>
                    <Activity className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="font-black text-slate-900 text-lg">
                    {auditStats.total} <span className="text-xs font-semibold text-slate-500">entri</span>
                  </div>
                  <span className="text-[10px] text-slate-600 block mt-0.5">Sejak sesi dibuat</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-medium">Perubahan Status</span>
                    <ChevronRight className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="font-black text-slate-900 text-lg">
                    {auditStats.statusChanges} <span className="text-xs font-semibold text-slate-500">kali</span>
                  </div>
                  <span className="text-[10px] text-slate-600 block mt-0.5">Mutasi status alur</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-medium">Naskah & Berkas</span>
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="font-black text-slate-900 text-lg">
                    {auditStats.docs} <span className="text-xs font-semibold text-slate-500">dokumen</span>
                  </div>
                  <span className="text-[10px] text-slate-600 block mt-0.5">Matriks & surat TTE</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-medium">Aktor Terlibat</span>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="font-black text-slate-900 text-lg">
                    {auditStats.uniqueActors} <span className="text-xs font-semibold text-slate-500">pihak</span>
                  </div>
                  <span className="text-[10px] text-slate-600 block mt-0.5">Petugas, Sarana, Sistem</span>
                </div>
              </div>

              {/* Filtering & Search Controls */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="Cari aksi, nama aktor, status, atau rincian kegiatan..."
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                    />
                    {logSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLogSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Activity Type Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 whitespace-nowrap">
                      <Filter className="w-3.5 h-3.5" />
                      Tipe:
                    </span>
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: 'STATUS_ONLY', label: 'Mutasi Status' },
                      { id: 'DOCS_ONLY', label: 'Dokumen & Naskah' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setLogTypeFilter(type.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          logTypeFilter === type.id
                            ? 'bg-white text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Filters */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Filter Peran (Role):</span>
                  {[
                    { id: 'ALL', label: 'Semua Role' },
                    { id: 'PETUGAS', label: 'Petugas / Evaluator' },
                    { id: 'ADMIN', label: 'Admin BBPOM' },
                    { id: 'SARANA', label: 'Sarana / Pemilik' },
                    { id: 'SISTEM', label: 'Sistem Otomatis' },
                    { id: 'SUPERVISOR', label: 'Supervisor' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setLogRoleFilter(role.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        logRoleFilter === role.id
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}

                  {(logRoleFilter !== 'ALL' || logTypeFilter !== 'ALL' || logSearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogRoleFilter('ALL');
                        setLogTypeFilter('ALL');
                        setLogSearchQuery('');
                      }}
                      className="ml-auto text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Status Bar showing match count */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Menampilkan <strong className="text-slate-800">{filteredLogs.length}</strong> dari{' '}
                  <strong className="text-slate-800">{inspection.auditTrail.length}</strong> aktivitas kronologis
                </span>
                <span className="text-[11px] text-slate-600">
                  Urutan: {logSortOrder === 'DESC' ? 'Terbaru ke Terlama' : 'Terlama ke Terbaru'}
                </span>
              </div>

              {/* Timeline Container */}
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <History className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">Tidak ada log yang sesuai filter</p>
                  <p className="text-slate-600 text-xs">Coba sesuaikan kata kunci pencarian atau ganti filter role/tipe.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLogRoleFilter('ALL');
                      setLogTypeFilter('ALL');
                      setLogSearchQuery('');
                    }}
                    className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Tampilkan Semua Log
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {filteredLogs.map((log, index) => {
                    const isStatusTransition =
                      log.action.toLowerCase().includes('status') ||
                      log.details.toLowerCase().includes('status') ||
                      log.action.toLowerCase().includes('selesai') ||
                      log.action.toLowerCase().includes('closed') ||
                      log.action.toLowerCase().includes('perbaikan');

                    const isDocumentEvent =
                      log.action.toLowerCase().includes('surat') ||
                      log.action.toLowerCase().includes('tte') ||
                      log.action.toLowerCase().includes('matriks') ||
                      log.action.toLowerCase().includes('dokumen') ||
                      log.action.toLowerCase().includes('berkas');

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline Marker Bullet */}
                        <div
                          className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                            index === 0 && logSortOrder === 'DESC' ? 'ring-2 ring-indigo-400 ' : ''
                          }${
                            log.badgeType === 'danger'
                              ? 'bg-rose-500'
                              : log.badgeType === 'warning'
                              ? 'bg-amber-500'
                              : log.badgeType === 'purple'
                              ? 'bg-purple-600'
                              : log.badgeType === 'success'
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          }`}
                        />

                        {/* Card Content */}
                        <div
                          className={`p-4 bg-white border rounded-xl space-y-2 transition-all hover:shadow-2xs ${
                            isStatusTransition
                              ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/20 to-white'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {log.action}
                              </span>

                              {/* Event Category Tag */}
                              {isStatusTransition && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  Mutasi Status
                                </span>
                              )}
                              {isDocumentEvent && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                  Dokumen
                                </span>
                              )}

                              {/* Role Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  log.role.toLowerCase().includes('petugas') || log.role.toLowerCase().includes('evaluator')
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : log.role.toLowerCase().includes('admin')
                                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                                    : log.role.toLowerCase().includes('sarana')
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : log.role.toLowerCase().includes('supervisor')
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}
                              >
                                {log.role}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-mono">
                              <Clock className="w-3 h-3 text-slate-600" />
                              <span>{formatIndonesianDateTime(log.timestamp)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span>Aktor Pelaksana:</span>
                            <strong className="text-slate-800 font-semibold">{log.actor}</strong>
                          </div>

                          <p className="text-slate-700 text-xs pt-1.5 border-t border-slate-100 leading-relaxed font-normal">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Dossier Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="text-xs text-slate-500">
            Dossier Sesi Pemeriksaan #{inspection.id} • Terakhir Diperbarui: {formatIndonesianDateTime(inspection.updatedAt)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSummaryReportOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Buka laporan ringkasan temuan dan unduh PDF resmi"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak / Unduh Laporan PDF</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-lg text-xs font-semibold cursor-pointer"
            >
              Tutup Berkas
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY PDF REPORT & PRINT MODAL */}
      <InspectionSummaryReportModal
        isOpen={isSummaryReportOpen}
        onClose={() => setIsSummaryReportOpen(false)}
        inspection={inspection}
        onOpenSrikandiWorkflow={() => setIsSrikandiWorkflowOpen(true)}
      />

      {/* SRIKANDI TTE & MATRIX WORKFLOW MODAL */}
      <SrikandiWorkflowModal
        isOpen={isSrikandiWorkflowOpen}
        onClose={() => setIsSrikandiWorkflowOpen(false)}
        inspection={inspection}
        currentRole={currentRole}
        onOpenEvaluation={onOpenEvaluation}
        onOpenSrikandiLetter={onOpenSrikandiLetter}
        onUpdateInspection={(updated) => {
          if (onUpdateInspection) onUpdateInspection(updated);
        }}
      />

    </div>
  );
};
