import React, { useState, useMemo } from 'react';
import { InspectionSession, FindingItem, EvidenceFile, UserRole, AuditTrailLog } from '../types';
import { 
  FolderOpen, 
  FileText, 
  Download, 
  ExternalLink, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  User, 
  ShieldCheck, 
  Eye, 
  Copy, 
  Check, 
  ArrowLeft, 
  Upload, 
  History, 
  Paperclip, 
  FileCheck2, 
  Award, 
  Printer, 
  Share2,
  HardDrive,
  Info,
  X
} from 'lucide-react';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';
import { calculateRemainingDays, getStatusBadgeConfig } from '../utils/date';

export interface SessionDocumentManagerProps {
  inspections: InspectionSession[];
  initialInspectionId?: string;
  currentRole: UserRole;
  onSelectInspection?: (inspection: InspectionSession) => void;
  onOpenMatrix?: (inspection: InspectionSession) => void;
  onClose?: () => void;
}

export type DocumentCategoryTab = 'ALL' | 'SURAT_PEMERIKSAAN' | 'BUKTI_SARANA' | 'HASIL_EVALUASI' | 'AUDIT_TRAIL';

export interface UnifiedDocumentItem {
  id: string;
  category: 'SURAT_PEMERIKSAAN' | 'BUKTI_SARANA' | 'HASIL_EVALUASI';
  categoryLabel: string;
  title: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  uploadedBy: string;
  uploadedAt: string;
  findingIndex?: number;
  findingClause?: string;
  tteStatus?: string;
  cloudUrl?: string;
  notes?: string;
}

export const SessionDocumentManager: React.FC<SessionDocumentManagerProps> = ({
  inspections,
  initialInspectionId,
  currentRole,
  onSelectInspection,
  onOpenMatrix,
  onClose,
}) => {
  // Current active inspection session
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (initialInspectionId && inspections.some(i => i.id === initialInspectionId)) {
      return initialInspectionId;
    }
    return inspections[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<DocumentCategoryTab>('ALL');
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<UnifiedDocumentItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active Inspection Session
  const activeSession = useMemo(() => {
    return inspections.find(i => i.id === selectedSessionId) || inspections[0] || null;
  }, [inspections, selectedSessionId]);

  const matrixConfig = useMemo(() => {
    if (!activeSession) return null;
    return getCommodityMatrixConfig(activeSession.facility.type, activeSession.facility.name);
  }, [activeSession]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Compile Unified Documents for Active Session
  const sessionDocuments = useMemo(() => {
    if (!activeSession) return [];
    const docs: UnifiedDocumentItem[] = [];

    // 1. Group A: Surat Tindak Lanjut Hasil Pemeriksaan (SRIKANDI & TTE BSrE)
    const letterNumber = activeSession.srikandiLetter?.letterNo || 'B-PW.01.12.33.334.09.26.1102';
    const letterDate = activeSession.srikandiLetter?.issuedDate || activeSession.inspectionDate;
    
    docs.push({
      id: `DOC-SRIKANDI-TL-${activeSession.id}`,
      category: 'SURAT_PEMERIKSAAN',
      categoryLabel: 'Surat Hasil Pemeriksaan (SRIKANDI)',
      title: `Surat Tindak Lanjut Hasil Pemeriksaan Sarana ${activeSession.facility.name}`,
      fileName: `Surat_TL_${activeSession.capaCode}_SRIKANDI.pdf`,
      fileSize: '1.8 MB',
      fileType: 'application/pdf',
      uploadedBy: 'Admin Balai BBPOM Semarang (SRIKANDI)',
      uploadedAt: letterDate,
      tteStatus: 'TTE BSrE BSSN Sah & Terverifikasi',
      notes: `Hal: ${activeSession.srikandiLetter?.subject || 'Tindak Lanjut Hasil Pemeriksaan Sarana Pelayanan/Distribusi Obat dan Makanan'}. No Surat: ${letterNumber}`,
    });

    docs.push({
      id: `DOC-BAP-${activeSession.id}`,
      category: 'SURAT_PEMERIKSAAN',
      categoryLabel: 'Berita Acara Pemeriksaan (BAP)',
      title: `Berita Acara Pemeriksaan Lapangan & Deskripsi Temuan`,
      fileName: `BAP_Pemeriksaan_${activeSession.capaCode}.pdf`,
      fileSize: '2.4 MB',
      fileType: 'application/pdf',
      uploadedBy: `Tim Pemeriksa (${activeSession.leadAuditor})`,
      uploadedAt: activeSession.inspectionDate,
      tteStatus: 'Tanda Tangan Petugas & Sarana',
      notes: `Diterbitkan saat exit meeting audit lapangan. Meliputi ${activeSession.findings.length} butir ketidaksesuaian.`,
    });

    // 2. Group B: Bukti Tindak Lanjut Perbaikan Sarana
    activeSession.findings.forEach((finding, idx) => {
      // Evidence files
      (finding.capa?.evidenceFiles || []).forEach((ev, evIdx) => {
        const driveLink = ev.driveUrl || ev.url || finding.capa?.evidenceDriveUrl;
        docs.push({
          id: `DOC-EV-${finding.id}-${ev.id || evIdx}`,
          category: 'BUKTI_SARANA',
          categoryLabel: `Bukti Perbaikan Butir #${idx + 1}`,
          title: `Bukti Butir #${idx + 1}: ${ev.name}`,
          fileName: ev.name,
          fileSize: ev.size || '1.2 MB',
          fileType: ev.type || 'application/pdf',
          uploadedBy: `${activeSession.facility.picName} (PIC ${activeSession.facility.name})`,
          uploadedAt: ev.uploadedAt || finding.capa?.submittedAt || activeSession.updatedAt,
          findingIndex: idx + 1,
          findingClause: finding.clause,
          cloudUrl: driveLink,
          notes: `Kategori: ${ev.category || 'Dokumen/SOP'}. Klausul: ${finding.clause || 'Standar Regulasi'}. Tindakan CA: ${finding.capa?.correctiveAction?.slice(0, 80) || '-'}...`,
        });
      });

      // If sarana provided a dedicated Google Drive link for finding
      if (finding.capa?.evidenceDriveUrl) {
        docs.push({
          id: `DOC-DRIVE-${finding.id}`,
          category: 'BUKTI_SARANA',
          categoryLabel: `Tautan Cloud Drive Butir #${idx + 1}`,
          title: `Google Drive Bukti Pendukung Lengkap Butir #${idx + 1}`,
          fileName: `Drive_Folder_${activeSession.capaCode}_Butir_${idx + 1}`,
          fileSize: 'Cloud Storage (Multi-Files)',
          fileType: 'url/drive',
          uploadedBy: `${activeSession.facility.picName} (PIC Sarana)`,
          uploadedAt: finding.capa?.submittedAt || activeSession.updatedAt,
          findingIndex: idx + 1,
          cloudUrl: finding.capa.evidenceDriveUrl,
          notes: `Tautan penyimpanan eksternal Google Drive untuk dokumen lampiran skala besar / video demonstrasi perbaikan.`,
        });
      }
    });

    // 3. Group C: Lembar Hasil Evaluasi CAPA & Naskah Pengantar Balai
    const evaluatorName = activeSession.assignedOfficer?.name || activeSession.leadAuditor;
    
    docs.push({
      id: `DOC-LEMBAR-EVAL-${activeSession.id}`,
      category: 'HASIL_EVALUASI',
      categoryLabel: 'Lembar Evaluasi CAPA Balai',
      title: `Formulir Hasil Evaluasi Tindakan Perbaikan (CAPA)`,
      fileName: `Lembar_Evaluasi_CAPA_${activeSession.capaCode}.pdf`,
      fileSize: '840 KB',
      fileType: 'application/pdf',
      uploadedBy: `Evaluator Balai (${evaluatorName})`,
      uploadedAt: activeSession.evaluationReport?.evaluatedAt || activeSession.updatedAt,
      tteStatus: 'TTE Petugas Evaluator Terverifikasi',
      notes: `Evaluator: ${evaluatorName}. Kesimpulan Telaah: ${activeSession.status === 'SELESAI_CLOSED' || activeSession.status === 'TERVALIDASI' ? 'Seluruh Butir Memenuhi Syarat (Close)' : 'Perlu Kelengkapan Bukti Tambahan'}.`,
    });

    if (activeSession.srikandiWorkflow?.signedDocumentNo || activeSession.status === 'SELESAI_CLOSED' || activeSession.status === 'TERVALIDASI') {
      const closingLetterNumber = activeSession.srikandiWorkflow?.signedDocumentNo || `B-PW.04.02.33.334.${new Date().getMonth() + 1}.26.${Math.floor(1000 + Math.random() * 9000)}`;
      
      docs.push({
        id: `DOC-SURAT-PENGANTAR-${activeSession.id}`,
        category: 'HASIL_EVALUASI',
        categoryLabel: 'Surat Pengantar Evaluasi (SRIKANDI)',
        title: activeSession.status === 'SELESAI_CLOSED'
          ? `Surat Persetujuan & Penutupan CAPA (TTE SRIKANDI)`
          : `Surat Pengantar Hasil Evaluasi CAPA (TTE SRIKANDI)`,
        fileName: activeSession.srikandiWorkflow?.signedDocumentName || `Surat_Pengantar_Evaluasi_${activeSession.capaCode}_SRIKANDI.pdf`,
        fileSize: '1.4 MB',
        fileType: 'application/pdf',
        uploadedBy: 'Kepala BBPOM di Semarang (TTE SRIKANDI BSrE)',
        uploadedAt: activeSession.srikandiWorkflow?.signedByAdminAt || activeSession.updatedAt,
        tteStatus: 'TTE BSrE BSSN Kepala Balai (Sah)',
        notes: `No Naskah: ${closingLetterNumber}. Hal: ${activeSession.srikandiWorkflow?.signedDocumentSubject || 'Penyampaian Hasil Evaluasi CAPA & Penutupan'}.`,
      });
    }

    return docs;
  }, [activeSession]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    const q = searchDocQuery.toLowerCase().trim();

    return sessionDocuments.filter((doc) => {
      if (activeTab !== 'ALL' && doc.category !== activeTab) {
        return false;
      }
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.uploadedBy.toLowerCase().includes(q) ||
        (doc.notes || '').toLowerCase().includes(q) ||
        (doc.findingClause || '').toLowerCase().includes(q)
      );
    });
  }, [sessionDocuments, activeTab, searchDocQuery]);

  // Categorical counts
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: sessionDocuments.length,
      SURAT_PEMERIKSAAN: 0,
      BUKTI_SARANA: 0,
      HASIL_EVALUASI: 0,
      AUDIT_TRAIL: activeSession?.auditTrail?.length || 0,
    };
    sessionDocuments.forEach((doc) => {
      counts[doc.category]++;
    });
    return counts;
  }, [sessionDocuments, activeSession]);

  if (!activeSession) {
    return (
      <div className="p-8 text-center text-slate-400">
        Tidak ada data sesi pemeriksaan tersedia.
      </div>
    );
  }

  const sla = calculateRemainingDays(activeSession.srikandiLetter?.deadlineDate || '');
  const statusBadge = getStatusBadgeConfig(activeSession.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Dossier & Repositori Dokumen Terpadu</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Sistem Manajemen Dokumen Pemeriksaan</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Pusat arsip dan tata kelola seluruh file pemeriksaan: Naskah Dinas SRIKANDI (TTE BSrE), berkas bukti perbaikan sarana, lembar evaluasi CAPA auditor, dan jejak audit kronologis per sesi.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            {onOpenMatrix && (
              <button
                type="button"
                onClick={() => onOpenMatrix(activeSession)}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Matriks CAPA Sesi Ini</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
                title="Tutup Manajemen Dokumen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Switcher Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Sesi Pemeriksaan Yang Dipilih:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">
                  {activeSession.facility.name}
                </h2>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeSession.capaCode}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Sesi Dropdown Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0 font-medium hidden sm:inline">
              Pilih Sesi Lain:
            </span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-xs md:max-w-sm"
            >
              {inspections.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.capaCode} - {ins.facility.name} ({ins.facility.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Session Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block">Komoditi & Standar</span>
            <span className="font-semibold text-slate-200 truncate block">
              {activeSession.facility.type} • {matrixConfig?.codeStandard || 'Standar CDOB/CPOB'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">No. Surat SRIKANDI</span>
            <div className="flex items-center gap-1 font-mono text-cyan-300 truncate">
              <span className="truncate">{activeSession.srikandiLetter?.letterNo || '-'}</span>
              <button
                type="button"
                onClick={() => handleCopy(activeSession.srikandiLetter?.letterNo || '', 'srikandi-no')}
                className="text-slate-400 hover:text-white cursor-pointer shrink-0"
                title="Salin Nomor Surat"
              >
                {copiedText === 'srikandi-no' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Lead Auditor / Evaluator</span>
            <span className="font-semibold text-slate-200 truncate block">
              {activeSession.assignedOfficer?.name || activeSession.leadAuditor}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Batas Waktu (SLA)</span>
            <span className={`font-bold ${sla.isOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
              {sla.text}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Semua Berkas ({categoryCounts.ALL})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SURAT_PEMERIKSAAN')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'SURAT_PEMERIKSAAN'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Surat Hasil Pemeriksaan ({categoryCounts.SURAT_PEMERIKSAAN})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BUKTI_SARANA')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'BUKTI_SARANA'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Bukti Tindak Lanjut ({categoryCounts.BUKTI_SARANA})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HASIL_EVALUASI')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'HASIL_EVALUASI'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Hasil Evaluasi CAPA ({categoryCounts.HASIL_EVALUASI})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('AUDIT_TRAIL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'AUDIT_TRAIL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat & Jejak Audit ({categoryCounts.AUDIT_TRAIL})</span>
            </button>
          </div>

          {/* Filter Search Input */}
          {activeTab !== 'AUDIT_TRAIL' && (
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                placeholder="Cari nama berkas, nomor, atau pengunggah..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'AUDIT_TRAIL' ? (
        /* Log Histori & Jejak Audit Dokumen */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Riwayat Dokumen & Log Jejak Audit Kronologis</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pencatatan resmi setiap tindakan terhadap naskah dinas, bukti perbaikan, dan evaluasi pada sesi {activeSession.capaCode}.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total {activeSession.auditTrail?.length || 0} Aktivitas
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {(activeSession.auditTrail || []).map((log, idx) => (
              <div key={log.id || idx} className="relative flex items-start gap-3.5 pl-1 text-xs">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border ${
                  log.badgeType === 'success'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : log.badgeType === 'danger'
                    ? 'bg-rose-950 border-rose-500 text-rose-400'
                    : 'bg-cyan-950 border-cyan-500 text-cyan-400'
                }`}>
                  <Check className="w-3 h-3" />
                </div>

                <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Aktor: <strong className="text-slate-200">{log.actor}</strong></span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">{log.role}</span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* File Cards Grid */
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Tidak ada berkas yang ditemukan</h4>
              <p className="text-xs text-slate-400">
                Silakan sesuaikan filter kategori atau kata kunci pencarian dokumen di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocuments.map((doc) => {
                const isPdf = doc.fileName.toLowerCase().endsWith('.pdf');
                const isDrive = doc.fileType?.includes('drive') || !!doc.cloudUrl;

                return (
                  <div
                    key={doc.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 shadow-md hover:shadow-lg relative group"
                  >
                    <div className="space-y-2">
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.category === 'SURAT_PEMERIKSAAN'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                            : doc.category === 'BUKTI_SARANA'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        }`}>
                          {doc.categoryLabel}
                        </span>

                        {doc.tteStatus && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {doc.tteStatus}
                          </span>
                        )}
                      </div>

                      {/* Title & Filename */}
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                          <span className="truncate">{doc.fileName}</span>
                          <span>•</span>
                          <span className="shrink-0">{doc.fileSize}</span>
                        </div>
                      </div>

                      {/* Notes / Description */}
                      {doc.notes && (
                        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 line-clamp-2">
                          {doc.notes}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="truncate">Pengunggah: {doc.uploadedBy}</span>
                        <span className="shrink-0 font-mono">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Pratinjau</span>
                        </button>

                        {doc.cloudUrl && (
                          <a
                            href={doc.cloudUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-200 rounded-lg text-xs font-semibold border border-blue-700/50 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka Google Drive</span>
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // Simulate download
                          alert(`Mengunduh berkas: ${doc.fileName}`);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Unduh Salinan Dokumen Resmi"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Unduh File</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  {selectedPreviewDoc.categoryLabel}
                </span>
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {selectedPreviewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Document Mock Viewer Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400 shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedPreviewDoc.fileName}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Format: {selectedPreviewDoc.fileType} • Ukuran: {selectedPreviewDoc.fileSize}
                  </p>
                </div>

                {selectedPreviewDoc.tteStatus && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{selectedPreviewDoc.tteStatus}</span>
                  </div>
                )}

                <div className="text-left bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sesi Pemeriksaan:</span>
                    <span className="font-mono text-emerald-400 font-bold">{activeSession.capaCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sarana:</span>
                    <span className="text-white font-medium">{activeSession.facility.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pengunggah:</span>
                    <span className="text-slate-200">{selectedPreviewDoc.uploadedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal Rekam:</span>
                    <span className="text-slate-200 font-mono">
                      {new Date(selectedPreviewDoc.uploadedAt).toLocaleString('id-ID')} WIB
                    </span>
                  </div>
                  {selectedPreviewDoc.notes && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Catatan Dokumen:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {selectedPreviewDoc.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPreviewDoc.cloudUrl && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-blue-300">
                    <HardDrive className="w-4 h-4" />
                    <span>Tersimpan di Google Drive Sarana</span>
                  </div>
                  <a
                    href={selectedPreviewDoc.cloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka Drive
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
              >
                Tutup Pratinjau
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`Mengunduh berkas: ${selectedPreviewDoc.fileName}`);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen Asli</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
