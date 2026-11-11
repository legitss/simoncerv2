import React, { useState, useRef, useMemo } from 'react';
import { InspectionSession, UserRole, SrikandiTteWorkflow, SrikandiDocumentItem } from '../types';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Download, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Upload, 
  Check, 
  AlertCircle,
  Building2, 
  FileCheck2, 
  ArrowRight,
  ArrowLeft,
  Layers, 
  MessageSquare, 
  QrCode,
  Copy,
  Share2,
  Clock,
  FileUp,
  FolderOpen,
  UserCheck,
  CheckCircle,
  Paperclip,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Maximize2,
  Minimize2,
  PlusCircle,
  History,
  Info,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatIndonesianDate, formatIndonesianDateTime } from '../utils/date';
import { 
  generateCommodityMatrixAttachmentPDF, 
  generateSrikandiCoverLetterPDF,
  generateCapaEvaluationReportPDF,
} from '../utils/pdfReportGenerator';
import { 
  sendWhatsAppMessage,
  cleanPhoneNumber
} from '../utils/whatsappGateway';
import { createAutomaticNotifications } from '../utils/notificationService';

interface SrikandiWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  currentRole: UserRole;
  onUpdateInspection: (updated: InspectionSession) => void;
  onOpenEvaluation?: () => void;
  onOpenSrikandiLetter?: () => void;
}

export const SrikandiWorkflowModal: React.FC<SrikandiWorkflowModalProps> = ({
  isOpen,
  onClose,
  inspection,
  currentRole,
  onUpdateInspection,
  onOpenEvaluation,
  onOpenSrikandiLetter,
}) => {
  if (!isOpen) return null;

  const canManage = currentRole !== 'SARANA';
  const isAdmin = currentRole === 'ADMIN';
  const isRequiresCapa = inspection.requiresCapa !== false && inspection.findings.length > 0;

  const currentWorkflow: SrikandiTteWorkflow = inspection.srikandiWorkflow || {
    requiresCapa: isRequiresCapa,
    isMatrixSaved: !!inspection.evaluationReport,
    matrixSavedAt: inspection.evaluationReport?.evaluatedAt,
    matrixSavedBy: inspection.assignedOfficer?.name || inspection.leadAuditor,
    matrixDocumentName: `Lampiran_Matriks_CAPA_${inspection.capaCode}.pdf`,
    coverLetterNo: `PW.01.02.3.33.09.26.${inspection.capaCode.replace('CAPA-', '')}`,
    coverLetterDate: new Date().toISOString(),
    srikandiStatus: inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED' ? 'SUDAH_TTE' : 'DRAFT',
  };

  // Determine active step: 
  // If Sarana has submitted or evaluation is underway, default to Step 2. Otherwise Step 1.
  const hasSaranaSubmitted = 
    inspection.status === 'CAPA_TERKIRIM' || 
    inspection.status === 'MASIH_EVALUASI' || 
    inspection.status === 'PERLU_PERBAIKAN' || 
    inspection.status === 'TERVALIDASI' || 
    inspection.status === 'SELESAI_CLOSED';

  const [activeTab, setActiveTab] = useState<'DOSSIER_TL' | 'EVALUASI_CAPA'>(
    hasSaranaSubmitted ? 'EVALUASI_CAPA' : 'DOSSIER_TL'
  );
  const [isMaximized, setIsMaximized] = useState(false);

  // Multi-stage evaluation history and cycle tracking
  const existingStageLetters = (currentWorkflow.srikandiDocuments || []).filter(
    (d) => d.type === 'SURAT_PENGANTAR_EVALUASI' || d.type === 'SURAT_PENUTUPAN_CAPA'
  );

  const [activeStageCycle, setActiveStageCycle] = useState<number>(() => {
    if (existingStageLetters.length > 0) return existingStageLetters.length;
    const evalLogCount = inspection.auditTrail.filter((l) =>
      l.action.toLowerCase().includes('evaluasi') || l.action.toLowerCase().includes('revisi')
    ).length;
    return evalLogCount > 1 ? 3 : (evalLogCount === 1 ? 2 : 1);
  });
  const evaluationCycle = activeStageCycle;

  // Findings summary: count Open vs Closed
  const totalFindings = inspection.findings.length;
  const totalClosed = inspection.findings.filter((f) => f.capa.evaluationStatus === 'MEMADAI').length;
  const totalOpen = inspection.findings.filter((f) => f.capa.evaluationStatus !== 'MEMADAI').length;
  const totalEvidenceCount = inspection.findings.reduce((acc, f) => acc + (f.capa.evidenceFiles?.length || 0), 0);

  // Cluster Selection & Filter State for Multi-Session CAPA
  const [selectedClusterStage, setSelectedClusterStage] = useState<number>(() => activeStageCycle || 1);
  const [findingsFilter, setFindingsFilter] = useState<'ALL' | 'MEMADAI' | 'REVISI'>('ALL');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);
  const [showUploadFormOverride, setShowUploadFormOverride] = useState(false);

  // Available Stages list (e.g., Sesi CAPA 1, Sesi CAPA 2, etc.)
  const availableStageNumbers = useMemo(() => {
    const list = [1];
    if (activeStageCycle >= 2 || existingStageLetters.length >= 2 || totalOpen > 0 || inspection.status === 'PERLU_PERBAIKAN') {
      if (!list.includes(2)) list.push(2);
    }
    if (activeStageCycle >= 3 || existingStageLetters.length >= 3) {
      if (!list.includes(3)) list.push(3);
    }
    (currentWorkflow.srikandiDocuments || []).forEach((d) => {
      const match = d.title.match(/Tahap ke-(\d+)/i) || d.notes?.match(/Tahap ke-(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && !list.includes(n)) list.push(n);
      }
    });
    return list.sort((a, b) => a - b);
  }, [activeStageCycle, existingStageLetters.length, totalOpen, inspection.status, currentWorkflow.srikandiDocuments]);

  // Step 2 Form: Upload Surat Pengantar Evaluasi CAPA yang SUDAH ber-TTE di SRIKANDI
  const [signedDocNo, setSignedDocNo] = useState(
    currentWorkflow.signedDocumentNo || `PW.01.02.3.33.09.26.${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [signedDocDate, setSignedDocDate] = useState(
    currentWorkflow.signedDocumentDate ? currentWorkflow.signedDocumentDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const defaultDocSubject = totalOpen === 0
    ? `Penyampaian Rekomendasi Hasil Evaluasi & Penutupan CAPA Sarana ${inspection.facility.name} (${inspection.capaCode})`
    : `Penyampaian Hasil Evaluasi CAPA Tahap ke-${activeStageCycle} & Permintaan Perbaikan Lanjutan Sarana ${inspection.facility.name} (${inspection.capaCode})`;

  const [signedDocSubject, setSignedDocSubject] = useState(
    currentWorkflow.signedDocumentSubject || defaultDocSubject
  );
  const [signedDocName, setSignedDocName] = useState(
    currentWorkflow.signedDocumentName || `Surat_Pengantar_Evaluasi_Tahap_${activeStageCycle}_TTE_SRIKANDI_${inspection.capaCode}.pdf`
  );
  const [signedDocSize, setSignedDocSize] = useState('2.4 MB');
  const [isLetterUploaded, setIsLetterUploaded] = useState<boolean>(
    !!(currentWorkflow.signedDocumentNo && currentWorkflow.srikandiStatus === 'SUDAH_TTE')
  );
  const [bsreId, setBsreId] = useState(
    currentWorkflow.tteBsreId || `BSRE-${Date.now().toString(36).toUpperCase()}`
  );
  const [evaluationOutcome, setEvaluationOutcome] = useState<'SELESAI_CLOSED' | 'PERLU_PERBAIKAN'>(() => {
    return totalOpen === 0 && totalFindings > 0 ? 'SELESAI_CLOSED' : 'PERLU_PERBAIKAN';
  });

  const [notificationNotes, setNotificationNotes] = useState(
    currentWorkflow.notificationNotes ||
    (totalOpen === 0
      ? `Seluruh butir tindakan perbaikan dan pencegahan (CAPA) yang disampaikan oleh sarana telah dievaluasi dan dinyatakan MEMADAI / MEMENUHI PERSYARATAN (Total ${totalFindings} Butir CLOSED). Naskah dinas resmi hasil evaluasi telah ditandatangani secara elektronik (TTE) di SRIKANDI oleh Kepala Balai. Status CAPA resmi: SELESAI / CLOSED (Tuntas).`
      : `Hasil evaluasi tindak lanjut (CAPA) Tahap ke-${activeStageCycle} sarana telah ditelaah (${totalClosed} butir disetujui / CLOSED, namun masih terdapat ${totalOpen} butir yang berstatus OPEN / Perlu Revisi). Mohon sampaikan berkas perbaikan lanjutan melalui portal SIMONCER dengan Kode Unik yang sama.`)
  );

  // Helper untuk sinkronisasi kesimpulan evaluasi & draf catatan notifikasi WA
  const handleSelectOutcome = (outcome: 'SELESAI_CLOSED' | 'PERLU_PERBAIKAN') => {
    if (outcome === 'SELESAI_CLOSED' && totalOpen > 0) {
      showFeedback(
        `Peringatan: Surat Pengantar Penutupan terkunci karena masih terdapat ${totalOpen} butir temuan berstatus OPEN. Sistem mengarahkan ke Surat Pengantar Hasil Evaluasi Ulang.`,
        'error'
      );
      setEvaluationOutcome('PERLU_PERBAIKAN');
      return;
    }
    setEvaluationOutcome(outcome);
    if (outcome === 'SELESAI_CLOSED') {
      setSignedDocSubject(
        `Penyampaian Rekomendasi Hasil Evaluasi & Penutupan CAPA Sarana ${inspection.facility.name} (${inspection.capaCode})`
      );
      setNotificationNotes(
        `Seluruh butir tindakan perbaikan dan pencegahan (CAPA) yang disampaikan oleh sarana telah dievaluasi dan dinyatakan MEMADAI / MEMENUHI PERSYARATAN (Total ${totalFindings} Butir CLOSED). Naskah dinas resmi hasil evaluasi telah ditandatangani secara elektronik (TTE) di SRIKANDI oleh Kepala Balai. Status CAPA resmi: SELESAI / CLOSED (Tuntas).`
      );
    } else {
      setSignedDocSubject(
        `Penyampaian Hasil Evaluasi CAPA Tahap ke-${activeStageCycle} & Permintaan Perbaikan Lanjutan Sarana ${inspection.facility.name} (${inspection.capaCode})`
      );
      setNotificationNotes(
        `Hasil evaluasi tindak lanjut (CAPA) Tahap ke-${activeStageCycle} sarana telah ditelaah (${totalClosed} butir disetujui / CLOSED, namun masih terdapat ${totalOpen} butir yang berstatus OPEN / Perlu Revisi). Mohon sampaikan berkas perbaikan lanjutan melalui portal SIMONCER dengan Kode Unik yang sama.`
      );
    }
  };

  // Helper untuk membuat surat pengantar evaluasi tahap baru (bila ada butir yang masih OPEN)
  const handleCreateNewStageLetter = () => {
    const nextCycle = activeStageCycle + 1;
    setActiveStageCycle(nextCycle);
    const newDocNo = `PW.01.02.3.33.09.26.${Math.floor(1000 + Math.random() * 9000)}`;
    setSignedDocNo(newDocNo);
    setSignedDocDate(new Date().toISOString().split('T')[0]);
    setSignedDocSubject(
      `Penyampaian Hasil Evaluasi CAPA Tahap ke-${nextCycle} & Permintaan Perbaikan Lanjutan Sarana ${inspection.facility.name} (${inspection.capaCode})`
    );
    setSignedDocName(`Surat_Pengantar_Evaluasi_Tahap_${nextCycle}_TTE_SRIKANDI_${inspection.capaCode}.pdf`);
    setBsreId(`BSRE-${Date.now().toString(36).toUpperCase()}`);
    setIsLetterUploaded(false);
    setEvaluationOutcome('PERLU_PERBAIKAN');
    setNotificationNotes(
      `Hasil evaluasi tindak lanjut (CAPA) Tahap ke-${nextCycle} sarana telah ditelaah (${totalClosed} butir disetujui / CLOSED, namun masih terdapat ${totalOpen} butir yang berstatus OPEN / Perlu Revisi). Mohon segera lengkapi perbaikan butir open tersebut melalui portal SIMONCER dengan Kode Unik yang sama.`
    );
    showFeedback(
      `Formulir disiapkan untuk Naskah Surat Pengantar Evaluasi Tahap ke-${nextCycle}. Silakan masukkan nomor surat baru dan unggah berkas PDF ber-TTE dari SRIKANDI.`,
      'info'
    );
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // File input ref for signed letter upload
  const evalSignedFileInputRef = useRef<HTMLInputElement>(null);

  // Sarana portal tracking link
  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(inspection.capaCode)}`
    : `https://simoncer.id/track?code=${encodeURIComponent(inspection.capaCode)}`;

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inspection.capaCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download Matrix PDF
  const handleDownloadMatrixPdf = async () => {
    setIsProcessing(true);
    try {
      await generateCommodityMatrixAttachmentPDF(inspection);
      showFeedback('Berkas Lampiran Matriks CAPA berhasil diunduh.', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Draft Cover Letter PDF for SRIKANDI (Auto-checks Open vs Close status)
  const handleDownloadCoverLetterDraft = async () => {
    setIsProcessing(true);
    try {
      await generateSrikandiCoverLetterPDF(inspection, activeStageCycle);
      showFeedback(
        totalOpen > 0
          ? `Draf Surat Pengantar Hasil Evaluasi Ulang (Tahap ke-${activeStageCycle}) berhasil diunduh.`
          : 'Draf Surat Pengantar Persetujuan & Penutupan CAPA berhasil diunduh.',
        'success'
      );
    } catch (e) {
      console.error(e);
      showFeedback('Gagal mengunduh draf surat pengantar.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Official CAPA Evaluation Report PDF (Attachment for SRIKANDI)
  const handleDownloadEvaluationReportPdf = async () => {
    setIsProcessing(true);
    try {
      await generateCapaEvaluationReportPDF(inspection, {
        reportNo: inspection.evaluationReport?.reportNo,
        evaluatorName: inspection.evaluationReport?.evaluatorName || inspection.assignedOfficer?.name,
        evaluatorNip: inspection.evaluationReport?.evaluatorNip || inspection.assignedOfficer?.nip,
        conclusion: inspection.evaluationReport?.overallConclusion,
        finalStatus: inspection.status,
        stageCycle: activeStageCycle,
      });
      showFeedback('Berita Acara & Lembar Hasil Evaluasi CAPA berhasil diunduh.', 'success');
    } catch (e) {
      console.error(e);
      showFeedback('Gagal mengunduh lembar hasil evaluasi CAPA.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. ACTION: UPLOAD & SIMPAN SURAT PENGANTAR EVALUASI TTE DARI SRIKANDI
  const handleSaveSignedEvaluationLetter = () => {
    const now = new Date().toISOString();
    // STRICT VALIDATION: Penutupan CAPA (SELESAI_CLOSED) hanya sah jika 100% butir close (totalOpen === 0)
    const effectiveOutcome = (totalOpen > 0) ? 'PERLU_PERBAIKAN' : evaluationOutcome;
    const isClosed = effectiveOutcome === 'SELESAI_CLOSED' && totalOpen === 0;

    const finalDocItem: SrikandiDocumentItem = {
      id: `SRK-DOC-FINAL-${Date.now()}`,
      type: isClosed ? 'SURAT_PENUTUPAN_CAPA' : 'SURAT_PENGANTAR_EVALUASI',
      letterNo: signedDocNo,
      title: signedDocSubject || (isClosed 
        ? `Surat Pengantar Persetujuan & Penutupan CAPA - ${inspection.facility.name}` 
        : `Surat Pengantar Hasil Evaluasi CAPA (Tahap ke-${activeStageCycle}) - Permintaan Perbaikan Lanjutan`),
      issuedDate: signedDocDate,
      signerName: inspection.srikandiLetter?.signerName || 'apt. Sri Mulyani, S.Si',
      tteBsreId: bsreId,
      documentFileName: signedDocName,
      uploadedAt: now,
      uploadedBy: currentRole === 'ADMIN' ? 'Admin SIMONCER' : (inspection.assignedOfficer?.name || 'Petugas Evaluator'),
      isVerifiedTTE: true,
      notes: isClosed 
        ? 'CAPA Memenuhi Ketentuan & Ditutup Resmi (Closed, 0 Butir Open)' 
        : `Evaluasi Tahap ke-${activeStageCycle}: Masih terdapat ${totalOpen} butir yang berstatus OPEN / Perlu Revisi Lanjutan`,
    };

    const updatedDocuments = [
      finalDocItem,
      ...(currentWorkflow.srikandiDocuments || []).filter((d) => d.letterNo !== signedDocNo),
    ];

    const updated: InspectionSession = {
      ...inspection,
      status: isClosed ? 'SELESAI_CLOSED' : 'PERLU_PERBAIKAN',
      srikandiWorkflow: {
        ...currentWorkflow,
        needsAdminCoverLetter: false,
        signedDocumentNo: signedDocNo,
        signedDocumentName: signedDocName,
        signedDocumentDate: signedDocDate,
        signedDocumentSubject: signedDocSubject,
        signedByAdminAt: now,
        adminName: currentRole === 'ADMIN' ? 'Admin SIMONCER' : (inspection.assignedOfficer?.name || 'Petugas Evaluator'),
        tteBsreId: bsreId,
        srikandiStatus: 'SUDAH_TTE',
        notificationNotes,
        srikandiDocuments: updatedDocuments,
      },
      auditTrail: [
        {
          id: `LOG-${Date.now()}-FINAL-SIGNED`,
          action: `Unggah Surat Pengantar Evaluasi CAPA Tahap ke-${activeStageCycle} (TTE SRIKANDI)`,
          actor: currentRole === 'ADMIN' ? 'Admin SIMONCER' : (inspection.assignedOfficer?.name || 'Petugas Evaluator'),
          role: currentRole === 'ADMIN' ? 'Admin' : 'Petugas / Evaluator',
          timestamp: now,
          details: `Surat Pengantar Hasil Evaluasi Tahap ke-${activeStageCycle} TTE SRIKANDI (No: ${signedDocNo}, Hal: ${signedDocSubject}) berhasil diunggah. Kesimpulan: ${isClosed ? 'Seluruh Butir CLOSED (Selesai/Tuntas)' : `${totalOpen} Butir Masih OPEN (Perlu Revisi Lanjutan)`}. Menu notifikasi WhatsApp ke sarana kini aktif dan siap dikirim.`,
          badgeType: isClosed ? 'success' : 'warning',
        },
        ...inspection.auditTrail,
      ],
    };

    if (isClosed) {
      try {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      } catch (e) {
        console.log(e);
      }
    }

    setIsLetterUploaded(true);
    onUpdateInspection(updated);
    showFeedback(`Naskah Surat Pengantar Evaluasi Tahap ke-${activeStageCycle} TTE SRIKANDI berhasil disimpan! Menu notifikasi WhatsApp ke Sarana kini aktif dan siap dikirim.`, 'success');
  };

  // 2. ACTION: KIRIM NOTIFIKASI HASIL EVALUASI KE WHATSAPP SARANA (AKTIF SETELAH SURAT TERUPLOAD)
  const handleSendNotificationToSarana = async () => {
    if (!isLetterUploaded) {
      alert('Unggah dan simpan Surat Pengantar Evaluasi TTE SRIKANDI terlebih dahulu agar dokumen terlampir resmi ke sarana.');
      return;
    }

    setIsProcessing(true);
    const now = new Date().toISOString();
    const isClosed = evaluationOutcome === 'SELESAI_CLOSED';

    const waContent = isClosed
      ? `*PEMBERITAHUAN RESMI HASIL EVALUASI CAPA (TTE SRIKANDI)*\n` +
        `*BBPOM DI SEMARANG*\n\n` +
        `Yth. Pimpinan / Penanggung Jawab\n` +
        `*${inspection.facility.name}*\n` +
        `d/a: Sdr. ${inspection.facility.picName}\n\n` +
        `Bersama ini disampaikan bahwa *Surat Pengantar Hasil Evaluasi CAPA (Tahap ke-${activeStageCycle})* telah diterbitkan secara resmi melalui aplikasi SRIKANDI dan telah ditandatangani secara elektronik (TTE) oleh Kepala Balai:\n\n` +
        `📋 *Detail Naskah Dinas SRIKANDI:*\n` +
        `• *Nomor Surat Pengantar:* ${signedDocNo}\n` +
        `• *Tanggal Naskah:* ${signedDocDate}\n` +
        `• *Hal:* ${signedDocSubject}\n` +
        `• *Status Akhir CAPA:* *SELURUH BUTIR TELAH CLOSE (TUNTAS / SELESAI)*\n` +
        `• *Rincian Butir Temuan:* Seluruh ${totalFindings} Butir Memenuhi Ketentuan (0 Butir Open)\n` +
        `• *Kode Unik CAPA:* *${inspection.capaCode}*\n\n` +
        `📝 *Catatan Resmi Evaluator BBPOM:*\n` +
        `"${notificationNotes}"\n\n` +
        `📄 *Dokumen Naskah & Lampiran Matriks Evaluasi:*\n` +
        `Surat Pengantar resmi dan Lampiran Matriks Evaluasi CAPA (format standar komoditi ${inspection.facility.type}) dapat diakses dan diunduh langsung melalui tautan portal SIMONCER:\n` +
        `${trackingUrl}\n\n` +
        `✅ *Kesimpulan:* Selamat atas komitmen perbaikan fasilitas Anda sehingga seluruh butir temuan telah terselesaikan dan disetujui (Close).\n\n` +
        `_BBPOM di Semarang - Melayani dengan Integritas_`
      : `*PEMBERITAHUAN RESMI HASIL EVALUASI CAPA (TTE SRIKANDI)*\n` +
        `*BBPOM DI SEMARANG*\n\n` +
        `Yth. Pimpinan / Penanggung Jawab\n` +
        `*${inspection.facility.name}*\n` +
        `d/a: Sdr. ${inspection.facility.picName}\n\n` +
        `Bersama ini disampaikan bahwa *Surat Pengantar Hasil Evaluasi CAPA (Tahap ke-${activeStageCycle})* telah diterbitkan secara resmi melalui aplikasi SRIKANDI dan telah ditandatangani secara elektronik (TTE) oleh Kepala Balai:\n\n` +
        `📋 *Detail Naskah Dinas SRIKANDI:*\n` +
        `• *Nomor Surat Pengantar:* ${signedDocNo}\n` +
        `• *Tanggal Naskah:* ${signedDocDate}\n` +
        `• *Hal:* ${signedDocSubject}\n` +
        `• *Status Hasil Evaluasi:* *PERLU REVISI / PERBAIKAN LANJUTAN (MASIH ADA ${totalOpen} BUTIR OPEN)*\n` +
        `• *Rincian Status Butir:* ${totalClosed} Butir Closed, ${totalOpen} Butir Masih OPEN / Perlu Revisi\n` +
        `• *Kode Unik CAPA:* *${inspection.capaCode}*\n\n` +
        `📝 *Catatan Resmi Evaluator BBPOM:*\n` +
        `"${notificationNotes}"\n\n` +
        `📄 *Dokumen Naskah & Lampiran Matriks Evaluasi:*\n` +
        `Surat Pengantar resmi Tahap ke-${activeStageCycle} dan rincian catatan tiap butir temuan dapat diakses langsung melalui tautan portal SIMONCER:\n` +
        `${trackingUrl}\n\n` +
        `⚠️ *Tindak Lanjut Segera:* Mengingat masih terdapat *${totalOpen} butir yang berstatus OPEN*, mohon pimpinan / penanggung jawab sarana segera memperbaiki dan mengunggah kembali dokumen bukti pemenuhan melalui portal SIMONCER menggunakan Kode Unik yang sama sebelum batas waktu berakhir.\n\n` +
        `_BBPOM di Semarang - Melayani dengan Integritas_`;

    const notifWa = {
      id: `NOTIF-${Date.now()}-TTE-EVAL`,
      channel: 'WHATSAPP' as const,
      recipient: `${inspection.facility.picPhone} (${inspection.facility.picName})`,
      subject: `[SIMONCER] Surat Pengantar Hasil Evaluasi CAPA Tahap ke-${activeStageCycle} - ${inspection.facility.name}`,
      content: waContent,
      sentAt: now,
      status: 'DELIVERED' as const,
      triggerEvent: 'STATUS_EVALUASI_UPDATE' as const,
    };

    try {
      const res = await sendWhatsAppMessage(inspection.facility.picPhone, notifWa.content);

      const autoNotifs = createAutomaticNotifications({
        triggerEvent: 'SURAT_TINDAK_LANJUT',
        inspection,
        additionalDetails: {
          letterNo: signedDocNo,
          customNote: notificationNotes,
        },
      });

      const updated: InspectionSession = {
        ...inspection,
        notifications: [...autoNotifs, notifWa, ...inspection.notifications],
        srikandiWorkflow: {
          ...currentWorkflow,
          saranaNotifiedAt: now,
          saranaNotifiedBy: currentRole === 'ADMIN' ? 'Admin SIMONCER' : (inspection.assignedOfficer?.name || 'Petugas Evaluator'),
          notificationChannels: ['WHATSAPP', 'EMAIL'],
          notificationNotes,
        },
        auditTrail: [
          {
            id: `LOG-${Date.now()}-NOTIF-SENT`,
            action: 'Notifikasi WhatsApp Surat Pengantar Evaluasi TTE Terkirim ke Sarana',
            actor: currentRole === 'ADMIN' ? 'Admin SIMONCER' : (inspection.assignedOfficer?.name || 'Petugas Evaluator'),
            role: currentRole === 'ADMIN' ? 'Admin' : 'Petugas / Evaluator',
            timestamp: now,
            details: `Surat Pengantar TTE SRIKANDI (No: ${signedDocNo}) beserta hasil evaluasi ${totalClosed} butir disetujui & ${totalOpen} butir open berhasil dikirim ke nomor WhatsApp Sarana (${inspection.facility.picPhone}). Status: ${res.message}`,
            badgeType: res.success ? 'success' : 'warning',
          },
          ...inspection.auditTrail,
        ],
      };

      onUpdateInspection(updated);
      showFeedback(`Notifikasi WhatsApp hasil evaluasi & lampiran surat TTE berhasil terkirim ke Sarana!`, 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0b1b3d] to-purple-950 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-semibold border border-slate-700 shadow-xs"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white">
                  Alur Integrasi SRIKANDI (TTE BSrE) ⇄ SIMONCER
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {inspection.capaCode}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isRequiresCapa
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
                    : 'bg-teal-500/30 text-teal-200 border-teal-400/40'
                }`}>
                  {isRequiresCapa ? 'Wajib Kirim CAPA' : 'Memenuhi Ketentuan (MK)'}
                </span>
              </div>
              <p className="text-xs text-purple-200/90 mt-0.5">
                {inspection.facility.name} • Tata Kelola Naskah Dinas SRIKANDI & Monitoring Evaluasi CAPA SIMONCER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Tutup Halaman (Kembali ke Beranda)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if any */}
        {feedbackMessage && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-inner transition-all animate-in slide-in-from-top ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : feedbackMessage.type === 'error' 
              ? 'bg-rose-600 text-white' 
              : 'bg-blue-600 text-white'
          }`}>
            <Check className="w-4 h-4 text-white shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Simplified 2-Step Header Navigation (Langkah 3, 4, 5 dihilangkan sesuai permintaan user) */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 sm:px-4 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            
            {/* TAB 1: DOSSIER SURAT TINDAK LANJUT */}
            <button
              type="button"
              onClick={() => setActiveTab('DOSSIER_TL')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'DOSSIER_TL'
                  ? 'bg-purple-900 text-white shadow-sm font-bold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  activeTab === 'DOSSIER_TL'
                    ? 'bg-white text-purple-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                1
              </span>
              <div className="leading-tight truncate">
                <p className="text-xs font-bold truncate">1. Dossier Surat Tindak Lanjut (TL)</p>
                <p className={`text-[10px] truncate ${activeTab === 'DOSSIER_TL' ? 'text-purple-200' : 'text-slate-400'}`}>
                  Data Surat Awal SRIKANDI (Sudah Terkirim)
                </p>
              </div>
            </button>

            {/* TAB 2: EVALUASI CAPA & UPLOAD SURAT PENGANTAR TTE */}
            <button
              type="button"
              onClick={() => setActiveTab('EVALUASI_CAPA')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'EVALUASI_CAPA'
                  ? 'bg-purple-900 text-white shadow-sm font-bold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  activeTab === 'EVALUASI_CAPA'
                    ? 'bg-white text-purple-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </span>
              <div className="leading-tight truncate">
                <p className="text-xs font-bold truncate">
                  2. Jembatan Evaluasi CAPA & Naskah TTE SRIKANDI
                </p>
                <p className={`text-[10px] truncate ${activeTab === 'EVALUASI_CAPA' ? 'text-purple-200' : 'text-slate-400'}`}>
                  Tahap {evaluationCycle} • {totalOpen > 0 ? `${totalOpen} Butir Open (Revisi Lanjutan)` : 'Semua Butir Close (Tuntas)'}
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 font-sans text-xs space-y-4">
          
          {/* ========================================================================= */}
          {/* LANGKAH 1: DATA DOSSIER SURAT TINDAK LANJUT (TL)                          */}
          {/* (Dipersingkat: Hanya tampilkan data dossier tanpa perlu mengisi ulang)    */}
          {/* ========================================================================= */}
          {activeTab === 'DOSSIER_TL' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-950 text-sm">
                      Dossier Surat Tindak Lanjut Hasil Pemeriksaan (SRIKANDI TTE)
                    </h4>
                    <p className="text-purple-800 text-xs mt-0.5 leading-relaxed">
                      Surat tindak lanjut ini telah diterbitkan resmi di SRIKANDI dan otomatis terkirim ke WhatsApp PIC Sarana saat pertama kali sesi pemeriksaan dibuat oleh Admin.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-center">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sudah Terkirim ke Sarana</span>
                  </span>
                </div>
              </div>

              {/* Data Naskah Dinas Terkunci (Read-Only Dossier) */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Rincian Metadata Naskah Dinas SRIKANDI
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    Sertifikat Digital BSrE BSSN Sah
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-700">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Nomor Surat SRIKANDI</span>
                    <span className="font-mono font-bold text-xs text-slate-900">{inspection.srikandiLetter.letterNo}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Terbit Naskah</span>
                    <span className="font-semibold text-xs text-slate-900">{formatIndonesianDate(inspection.srikandiLetter.issuedDate)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Batas Waktu CAPA (SLA)</span>
                    <span className="font-bold text-xs text-purple-900">{formatIndonesianDate(inspection.srikandiLetter.deadlineDate)} ({inspection.srikandiLetter.deadlineDays} Hari Kerja)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Pejabat Penandatangan (TTE)</span>
                    <span className="font-semibold text-xs text-slate-900">{inspection.srikandiLetter.signerName}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">ID Sertifikat TTE BSrE</span>
                    <span className="font-mono font-semibold text-xs text-slate-900">{inspection.srikandiLetter.tteId}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Status Kewajiban</span>
                    <span className={`font-bold text-xs ${isRequiresCapa ? 'text-purple-800' : 'text-teal-800'}`}>
                      {isRequiresCapa ? `Wajib CAPA (${inspection.findings.length} Butir)` : 'Memenuhi Ketentuan (MK)'}
                    </span>
                  </div>
                </div>

                {/* Berkas Lampiran PDF & Akses Sarana */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">
                        Berkas Naskah Surat Terlampir:
                      </span>
                      <span className="font-mono text-[11px] text-purple-900 font-bold">
                        {currentWorkflow.initialLetterFileName || inspection.srikandiLetter.documentFileUrl?.split('/').pop() || `Surat_Pemeriksaan_SRIKANDI_${inspection.capaCode}.pdf`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenSrikandiLetter && (
                      <button
                        type="button"
                        onClick={onOpenSrikandiLetter}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Surat Dinas</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Kode Unik CAPA & Tautan Sarana */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 uppercase">
                        Kunci Akses Sarana
                      </span>
                      <span className="font-bold text-purple-950 text-xs">
                        Kode Unik: <strong className="font-mono text-purple-900">{inspection.capaCode}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-800">
                      Telah terkirim ke WhatsApp PIC: <strong>{inspection.facility.picName} ({inspection.facility.picPhone})</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('EVALUASI_CAPA')}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Lanjut ke Evaluasi CAPA (Langkah 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* LANGKAH 2: EVALUASI CAPA & UPLOAD SURAT PENGANTAR TTE                     */}
          {/* (Rekap butir Open vs Close, form upload surat pengantar ber-TTE,           */}
          {/*  dan menu notifikasi WA yang aktif setelah surat terupload)               */}
          {/* ========================================================================= */}
          {activeTab === 'EVALUASI_CAPA' && (
            <div className="space-y-4">
              
              {/* ADMIN TASK ALERT: MENUNGGU SURAT PENGANTAR SRIKANDI */}
              {currentWorkflow.needsAdminCoverLetter && (
                <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border border-blue-400/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs uppercase text-blue-200">
                          Tugas Admin SIMONCER (Integrasi Naskah SRIKANDI):
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold shadow-xs">
                          Menunggu Naskah Surat Pengantar
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                        Evaluator (<strong>{currentWorkflow.evaluationCompletedBy || inspection.assignedOfficer?.name || 'Petugas'}</strong>) telah menyelesaikan telaah evaluasi CAPA. Lembar hasil evaluasi dapat diunduh pada tombol aksi kluster di bawah, lalu unggah Surat Pengantar ber-TTE agar resmi diteruskan ke Sarana.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* NAVIGASI KLUSTER SESI CAPA (Sesi CAPA 1, Sesi CAPA 2, dst.)               */}
              {/* ========================================================================= */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Kluster Sesi Evaluasi & Tindak Lanjut CAPA Sarana
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        {availableStageNumbers.length} Sesi Terdata
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih sesi untuk melihat status Surat Pengantar SRIKANDI, butir evaluasi petugas, dan menu kirim hasil telaah ke sarana.
                    </p>
                  </div>

                  {/* Tombol Buat / Buka Siklus CAPA Baru jika masih ada butir open */}
                  {totalOpen > 0 && canManage && (
                    <button
                      type="button"
                      onClick={handleCreateNewStageLetter}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                      title="Buka siklus perbaikan CAPA tahap berikutnya untuk butir yang masih open"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Buka Sesi CAPA {availableStageNumbers[availableStageNumbers.length - 1] + 1}</span>
                    </button>
                  )}
                </div>

                {/* Sesi / Cluster Selector Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {availableStageNumbers.map((stageNum: number) => {
                    const isSelected = selectedClusterStage === stageNum;
                    const isStageLetterAvailable = 
                      stageNum === activeStageCycle 
                        ? isLetterUploaded 
                        : (existingStageLetters.length >= stageNum || (stageNum === 1 && currentWorkflow.signedDocumentNo));

                    return (
                      <button
                        key={stageNum}
                        type="button"
                        onClick={() => setSelectedClusterStage(stageNum)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer shrink-0 min-w-[210px] ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-950 shadow-md ring-2 ring-purple-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-white text-purple-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {stageNum}
                        </div>
                        <div className="leading-tight truncate flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-xs truncate">
                              Sesi CAPA {stageNum}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              isSelected
                                ? 'bg-purple-800 text-purple-200'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              Tahap ke-{stageNum}
                            </span>
                          </div>
                          <span className={`text-[10px] block truncate mt-0.5 ${
                            isSelected ? 'text-purple-200' : 'text-slate-500'
                          }`}>
                            {isStageLetterAvailable ? '✓ Surat Pengantar Siap' : '⚠️ Menunggu Surat Pengantar'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bar Keterangan Riwayat Urutan Siklus CAPA Sarana */}
                <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-start gap-2.5 text-xs text-purple-950">
                  <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold block">
                      Riwayat Urutan Siklus CAPA Sarana ({inspection.facility.name}):
                    </span>
                    <p className="text-[11px] text-purple-900">
                      Sarana telah menjalani <strong>{availableStageNumbers.length} Sesi CAPA</strong> yang dikerjakan secara berurutan.
                      {totalOpen === 0 ? (
                        <span> Seluruh <strong>{totalFindings} butir temuan telah terverifikasi CLOSED (Tuntas)</strong> pada evaluasi terakhir.</span>
                      ) : (
                        <span> Dari total {totalFindings} butir temuan: <strong>{totalClosed} butir telah disetujui (Close)</strong> dan <strong>{totalOpen} butir masih berstatus Open</strong> yang sedang ditindaklanjuti pada Sesi CAPA {selectedClusterStage}.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* KONTEN KLUSTER TERPADU SESI CAPA (Pilar 1: Surat Pengantar, Pilar 2: Evaluasi Butir, Pilar 3: Menu Kirim) */}
              {/* ========================================================================= */}
              {(() => {
                const isSelectedActive = selectedClusterStage === activeStageCycle;
                const stageLetterDoc = existingStageLetters.find((d) => 
                  d.title?.includes(`Tahap ke-${selectedClusterStage}`) || 
                  d.notes?.includes(`Tahap ke-${selectedClusterStage}`) ||
                  (selectedClusterStage === 1 && !d.notes?.includes('Tahap ke-') && (d.type === 'SURAT_PENGANTAR_EVALUASI' || d.type === 'SURAT_PENUTUPAN_CAPA'))
                );
                
                const isStageLetterReady = isSelectedActive
                  ? isLetterUploaded
                  : Boolean(stageLetterDoc || (selectedClusterStage === 1 && currentWorkflow.signedDocumentNo));

                const displayLetterNo = isSelectedActive
                  ? signedDocNo
                  : (stageLetterDoc?.letterNo || currentWorkflow.signedDocumentNo || `PW.01.02.3.33.09.26.${inspection.capaCode.replace('CAPA-', '')}`);

                const displayLetterDate = isSelectedActive
                  ? signedDocDate
                  : (stageLetterDoc?.issuedDate || currentWorkflow.signedDocumentDate || new Date().toISOString().split('T')[0]);

                const displayLetterSubject = isSelectedActive
                  ? signedDocSubject
                  : (stageLetterDoc?.title || currentWorkflow.signedDocumentSubject || `Penyampaian Hasil Evaluasi CAPA Tahap ke-${selectedClusterStage}`);

                const displayLetterFileName = isSelectedActive
                  ? signedDocName
                  : (stageLetterDoc?.documentFileName || `Surat_Pengantar_Evaluasi_Tahap_${selectedClusterStage}_TTE_SRIKANDI.pdf`);

                const displayBsreId = isSelectedActive
                  ? bsreId
                  : (stageLetterDoc?.tteBsreId || currentWorkflow.tteBsreId || 'BSRE-VERIFIED-2026');

                const filteredFindings = inspection.findings.filter((f) => {
                  if (findingsFilter === 'MEMADAI') return f.capa.evaluationStatus === 'MEMADAI';
                  if (findingsFilter === 'REVISI') return f.capa.evaluationStatus !== 'MEMADAI';
                  return true;
                });

                const allFindingsEvaluated = inspection.findings.every(
                  (f) => f.capa.evaluationStatus === 'MEMADAI' || f.capa.evaluationStatus === 'REVISI' || f.capa.evaluationStatus === 'BELUM_MEMADAI'
                );

                const isClusterComplete = isStageLetterReady && allFindingsEvaluated;

                // Status apakah notifikasi resmi untuk sesi ini sudah pernah dikirimkan ke sarana
                const isStageAlreadySent = Boolean(
                  (isSelectedActive && currentWorkflow.saranaNotifiedAt) ||
                  (stageLetterDoc && currentWorkflow.saranaNotifiedAt) ||
                  inspection.notifications.some(
                    (n) => (n.channel === 'WHATSAPP' || n.channel === 'EMAIL') &&
                           (n.subject.includes(`Tahap ke-${selectedClusterStage}`) ||
                            n.subject.includes(`Sesi ${selectedClusterStage}`) ||
                            n.content.includes(`Tahap ke-${selectedClusterStage}`) ||
                            (selectedClusterStage === activeStageCycle && currentWorkflow.saranaNotifiedAt))
                  )
                );

                return (
                  <div className="bg-white border-2 border-purple-200/90 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">

                    {/* TOP HEADER KLUSTER SESI */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-xl bg-purple-500/30 text-purple-200 text-xs font-black uppercase tracking-wider border border-purple-400/40">
                            Kluster: Sesi CAPA {selectedClusterStage}
                          </span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                            isClusterComplete 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isClusterComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{isClusterComplete ? 'Dokumen & Evaluasi: KOMPLIT (Siap Dikirim)' : 'Dokumen & Evaluasi: BELUM KOMPLIT'}</span>
                          </span>
                          <span className="text-[11px] font-mono bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-lg border border-blue-400/30">
                            Tahap Pemeriksaan ke-{selectedClusterStage}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          Paket Terpadu Evaluasi & Naskah Dinas SRIKANDI (Sesi CAPA {selectedClusterStage})
                        </h3>
                        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                          Satu kesatuan kluster yang memuat status Surat Pengantar resmi SRIKANDI (TTE BSrE), rekap butir-butir evaluasi telaah petugas, serta kontrol pengiriman hasil ke Sarana.
                        </p>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={handleDownloadEvaluationReportPdf}
                          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Unduh Berita Acara & Lembar Hasil Evaluasi CAPA (.pdf)"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Hasil Evaluasi (.pdf)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadMatrixPdf}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Unduh Matriks Lampiran Standar Komoditi (.pdf)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Unduh Matriks (.pdf)</span>
                        </button>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* PILAR 1: STATUS SURAT PENGANTAR EVALUASI CAPA (SRIKANDI TTE BSrE)         */}
                    {/* ========================================================================= */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isStageLetterReady ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs'
                          }`}>
                            1
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                <FileCheck2 className="w-4 h-4 text-purple-700" />
                                Surat Pengantar Hasil Evaluasi CAPA (SRIKANDI TTE BSrE)
                              </h4>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isStageLetterReady
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {isStageLetterReady ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>SUDAH DIUNGGAH RESMI</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                                    <span>BELUM DIUNGGAH</span>
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {isStageLetterReady
                                ? `Naskah dinas resmi Sesi CAPA ${selectedClusterStage} telah tersimpan dan berstatus sah TTE BSrE.`
                                : `Naskah dinas resmi Sesi CAPA ${selectedClusterStage} belum diunggah ke SIMONCER.`}
                            </p>
                          </div>
                        </div>

                        {/* Toggle button jika surat sudah ada dan canManage */}
                        {isStageLetterReady && canManage && (
                          <button
                            type="button"
                            onClick={() => setShowUploadFormOverride(!showUploadFormOverride)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-purple-600" />
                            <span>{showUploadFormOverride ? 'Tutup Formulir Perbaruan' : 'Perbarui / Ganti Berkas Naskah'}</span>
                          </button>
                        )}
                      </div>

                      {/* Kondisi 1A: Surat SUDAH DIUNGGAH (Tampilan Detail Kartu) */}
                      {isStageLetterReady && !showUploadFormOverride ? (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3.5">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm block truncate max-w-lg">
                                  {displayLetterFileName}
                                </span>
                                <span className="text-[11px] text-slate-600">
                                  Naskah dinas berkekuatan hukum dengan sertifikasi digital BSrE BSSN • Sesi CAPA {selectedClusterStage}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-900 font-bold border border-emerald-300">
                                ID: {displayBsreId}
                              </span>
                              <button
                                type="button"
                                onClick={handleDownloadCoverLetterDraft}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Unduh naskah surat pengantar resmi"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh PDF Naskah</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-100 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                              <span className="text-[10px] text-slate-400 block font-semibold">Nomor Surat Pengantar</span>
                              <span className="font-mono font-bold text-slate-900 text-xs">{displayLetterNo}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                              <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Naskah</span>
                              <span className="font-semibold text-slate-900 text-xs">{formatIndonesianDate(displayLetterDate)}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                              <span className="text-[10px] text-slate-400 block font-semibold">Status Akhir Sesi Ini</span>
                              <span className={`font-bold text-xs ${totalOpen === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {totalOpen === 0 ? '✓ SELESAI / CLOSED (100%)' : `⚠️ PERLU PERBAIKAN (${totalOpen} Butir Open)`}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                            <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Hal (Perihal Surat):</span>
                            <p className="font-medium text-slate-900">{displayLetterSubject}</p>
                          </div>

                          {notificationNotes && (
                            <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Catatan Resmi Evaluator:</span>
                              <p className="italic text-slate-700 leading-relaxed">"{notificationNotes}"</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Kondisi 1B: Surat BELUM DIUNGGAH atau Sedang Perbarui */
                        canManage ? (
                          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <div className="space-y-0.5 leading-relaxed">
                                <span className="font-bold block">
                                  {showUploadFormOverride 
                                    ? `Perbarui Naskah Surat Pengantar Sesi CAPA ${selectedClusterStage}:` 
                                    : `Surat Pengantar Sesi CAPA ${selectedClusterStage} Belum Diunggah:`}
                                </span>
                                <p className="text-[11px] text-amber-900">
                                  Silakan unggah Surat Pengantar resmi hasil evaluasi yang telah ditandatangani secara elektronik (TTE) di SRIKANDI oleh Kepala Balai. Dokumen ini wajib diunggah agar menu pengiriman WhatsApp ke Sarana dapat aktif.
                                </p>
                              </div>
                            </div>

                            {/* Dropzone & File Picker */}
                            <div className="p-4 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <FileUp className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="font-bold text-teal-950 text-xs block">
                                      Pilih Berkas PDF Surat Pengantar (TTE SRIKANDI) Sesi CAPA {selectedClusterStage}
                                    </span>
                                    <span className="text-[11px] text-teal-800">
                                      Format .pdf • Dokumen sah tersertifikasi digital BSrE BSSN
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    ref={evalSignedFileInputRef}
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        setSignedDocName(file.name);
                                        setSignedDocSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                                        showFeedback(`Berkas ${file.name} terpilih. Tekan "Simpan Naskah TTE ke Sistem".`, 'info');
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => evalSignedFileInputRef.current?.click()}
                                    className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span>Pilih Berkas PDF</span>
                                  </button>
                                </div>
                              </div>

                              <div className="p-2.5 bg-white rounded-lg border border-teal-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                                  <span className="font-mono font-bold text-slate-800 text-xs truncate max-w-xs sm:max-w-md">
                                    {signedDocName}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                  TTE SRIKANDI
                                </span>
                              </div>
                            </div>

                            {/* Metadata Naskah */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                              <div className="md:col-span-4">
                                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                                  Nomor Surat Pengantar SRIKANDI (Sesi {selectedClusterStage})
                                </label>
                                <input
                                  type="text"
                                  value={signedDocNo}
                                  onChange={(e) => setSignedDocNo(e.target.value)}
                                  placeholder="Contoh: PW.01.02.3.33.09.26.4182"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-teal-500"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                                  Tanggal Naskah
                                </label>
                                <input
                                  type="date"
                                  value={signedDocDate}
                                  onChange={(e) => setSignedDocDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-500"
                                />
                              </div>
                              <div className="md:col-span-5">
                                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                                  Hal (Perihal Surat Pengantar)
                                </label>
                                <input
                                  type="text"
                                  value={signedDocSubject}
                                  onChange={(e) => setSignedDocSubject(e.target.value)}
                                  placeholder="Contoh: Penyampaian Hasil Evaluasi CAPA..."
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:border-teal-500"
                                />
                              </div>
                            </div>

                            {/* Catatan Resmi Evaluator */}
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                                Catatan Resmi Evaluator (Dicantumkan pada Naskah & WhatsApp Sarana)
                              </label>
                              <textarea
                                rows={2}
                                value={notificationNotes}
                                onChange={(e) => setNotificationNotes(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed"
                              />
                            </div>

                            {/* Tombol Simpan Naskah */}
                            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                              <span className="text-[11px] text-slate-500">
                                Setelah disimpan, Naskah Surat Pengantar resmi akan mengaktifkan menu kirim notifikasi ke sarana.
                              </span>
                              <div className="flex items-center gap-2">
                                {showUploadFormOverride && (
                                  <button
                                    type="button"
                                    onClick={() => setShowUploadFormOverride(false)}
                                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSaveSignedEvaluationLetter();
                                    setShowUploadFormOverride(false);
                                  }}
                                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all text-xs"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Simpan Naskah TTE ke Sistem</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-600">
                            Naskah Surat Pengantar SRIKANDI sedang diproses dan diunggah oleh Admin SIMONCER.
                          </div>
                        )
                      )}
                    </div>

                    {/* ========================================================================= */}
                    {/* PILAR 2: BUTIR-BUTIR EVALUASI CAPA OLEH PETUGAS EVALUATOR                 */}
                    {/* ========================================================================= */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            2
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-purple-700" />
                                Butir-Butir Evaluasi CAPA oleh Petugas (Sesi CAPA {selectedClusterStage})
                              </h4>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 font-mono">
                                Total {totalFindings} Butir
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Hasil telaah bukti dukung sarana, tindakan perbaikan, status evaluasi, dan rekomendasi teknis evaluator.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Filter Tabs */}
                          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setFindingsFilter('ALL')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                findingsFilter === 'ALL'
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              Semua ({totalFindings})
                            </button>
                            <button
                              type="button"
                              onClick={() => setFindingsFilter('MEMADAI')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                findingsFilter === 'MEMADAI'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              ✓ Close ({totalClosed})
                            </button>
                            <button
                              type="button"
                              onClick={() => setFindingsFilter('REVISI')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                findingsFilter === 'REVISI'
                                  ? 'bg-amber-600 text-white'
                                  : 'text-amber-800 hover:bg-amber-50'
                              }`}
                            >
                              ⚠️ Open ({totalOpen})
                            </button>
                          </div>

                          {/* Tombol Buka Lembar Evaluasi Petugas */}
                          {onOpenEvaluation && (
                            <button
                              type="button"
                              onClick={onOpenEvaluation}
                              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Buka form evaluasi butir untuk petugas evaluator"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Evaluator</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Summary Metrics Bar for Findings */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">Total Temuan Audit</span>
                          <span className="font-extrabold text-sm text-slate-900 font-mono">{totalFindings} Butir</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-emerald-600 block font-semibold">Butir Sudah Close</span>
                          <span className="font-extrabold text-sm text-emerald-700 font-mono">{totalClosed} Butir</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-amber-200">
                          <span className="text-[10px] text-amber-600 block font-semibold">Butir Masih Open</span>
                          <span className="font-extrabold text-sm text-amber-700 font-mono">{totalOpen} Butir</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-200">
                          <span className="text-[10px] text-blue-600 block font-semibold">Bukti Diunggah Sarana</span>
                          <span className="font-extrabold text-sm text-blue-700 font-mono">{totalEvidenceCount} Berkas</span>
                        </div>
                      </div>

                      {/* DAFTAR BUTIR EVALUASI TERPERINCI */}
                      <div className="space-y-3">
                        {filteredFindings.length === 0 ? (
                          <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-1 text-slate-500 text-xs">
                            <p className="font-semibold text-slate-700">Tidak ada butir temuan yang sesuai dengan filter.</p>
                            <p className="text-[11px]">Silakan pilih filter "Semua" untuk melihat seluruh butir evaluasi.</p>
                          </div>
                        ) : (
                          filteredFindings.map((finding, idx) => {
                            const isClose = finding.capa.evaluationStatus === 'MEMADAI';
                            const isExpanded = expandedFindingId === finding.id;

                            return (
                              <div
                                key={finding.id || idx}
                                className={`bg-white border rounded-2xl p-4 transition-all shadow-2xs space-y-3 ${
                                  isClose ? 'border-emerald-200 hover:border-emerald-300' : 'border-amber-200 hover:border-amber-300'
                                }`}
                              >
                                {/* Finding Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-extrabold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200">
                                      Klausul: {finding.clause}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                                      finding.category === 'KRITIS'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : finding.category === 'MAYOR'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                                    }`}>
                                      {finding.category}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      Butir ke-{idx + 1}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                                      isClose
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}>
                                      {isClose ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                                      <span>{isClose ? 'MEMADAI (CLOSE)' : 'BELUM MEMADAI (OPEN)'}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Deskripsi Temuan Audit */}
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Deskripsi Temuan Pemeriksaan:
                                  </span>
                                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                    {finding.description}
                                  </p>
                                </div>

                                {/* Dua Kolom: Tindak Lanjut Sarana & Telaah Evaluator */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {/* Kolom Kiri: Tindakan Perbaikan Sarana */}
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-indigo-600" />
                                        Tindak Lanjut & Bukti Sarana
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500">
                                        {finding.capa.evidenceFiles?.length || 0} Bukti Fisik
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-semibold">Akar Masalah (RCA):</span>
                                      <p className="text-slate-700 text-[11px] italic">
                                        "{finding.capa.rootCauseAnalysis || 'Tidak dicantumkan oleh sarana'}"
                                      </p>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-semibold">Tindakan Perbaikan (CAP):</span>
                                      <p className="text-slate-700 text-[11px]">
                                        {finding.capa.correctiveAction || 'Menunggu tindakan perbaikan sarana'}
                                      </p>
                                    </div>

                                    {/* Bukti Berkas */}
                                    {finding.capa.evidenceFiles && finding.capa.evidenceFiles.length > 0 && (
                                      <div className="pt-1 border-t border-slate-200">
                                        <span className="text-[10px] text-slate-400 block font-semibold mb-1">Berkas Bukti Dukung:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {finding.capa.evidenceFiles.map((ev, eIdx) => (
                                            <span
                                              key={ev.id || eIdx}
                                              className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700 flex items-center gap-1"
                                              title={ev.name}
                                            >
                                              <Paperclip className="w-2.5 h-2.5 text-indigo-500" />
                                              <span className="truncate max-w-[140px]">{ev.name}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Kolom Kanan: Hasil Telaah Evaluator BBPOM */}
                                  <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                                    isClose ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                                  }`}>
                                    <div className="flex items-center justify-between border-b pb-1 border-slate-200">
                                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                        <UserCheck className="w-3 h-3 text-purple-600" />
                                        Hasil Telaah Evaluator BBPOM
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {inspection.evaluationReport?.evaluatedAt ? formatIndonesianDate(inspection.evaluationReport.evaluatedAt) : 'Evaluasi Terkini'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-semibold">Nama Evaluator:</span>
                                      <span className="font-semibold text-slate-900 text-xs">
                                        {inspection.evaluationReport?.evaluatorName || inspection.assignedOfficer?.name || 'Petugas Evaluator BBPOM'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Catatan & Masukan Evaluator:</span>
                                      <p className="text-[11px] text-slate-800 leading-relaxed bg-white p-2 rounded-lg border border-slate-200 italic">
                                        "{finding.capa.evaluatorNotes || (isClose ? 'Tindakan perbaikan dan dokumen bukti telah memenuhi ketentuan (Close).' : 'Masih diperlukan kelengkapan bukti dan revisi SOP lanjutan.')}"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* PILAR 3: STATUS KELENGKAPAN & MENU KIRIM CAPA KE SARANA                  */}
                    {/* ========================================================================= */}
                    <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-4 ${
                      isClusterComplete
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                        : 'border-slate-300 bg-slate-50/80'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isClusterComplete ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                          }`}>
                            3
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                <Send className="w-4 h-4 text-emerald-700" />
                                Status Kelengkapan Sesi & Menu Kirim Hasil Evaluasi ke Sarana
                              </h4>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isStageAlreadySent
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isClusterComplete
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-slate-200 text-slate-700 border border-slate-300'
                              }`}>
                                {isStageAlreadySent ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>✓ SUDAH TERKIRIM KE SARANA</span>
                                  </>
                                ) : isClusterComplete ? (
                                  <>
                                    <Check className="w-3 h-3 text-blue-600" />
                                    <span>✓ SIAP DIKIRIM</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-slate-500" />
                                    <span>TERKUNCI (BELUM KOMPLIT)</span>
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Pengecekan otomatis kelengkapan paket sebelum notifikasi dan berkas diteruskan ke Sarana.
                            </p>
                          </div>
                        </div>

                        {/* Status badge kelengkapan */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                            isStageAlreadySent
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                              : isClusterComplete
                              ? 'bg-white text-emerald-800 border-emerald-300 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}>
                            {isStageAlreadySent ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : isClusterComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400" />
                            )}
                            <span>
                              {isStageAlreadySent
                                ? `Notifikasi & Naskah Telah Terkirim (${currentWorkflow.saranaNotifiedAt ? formatIndonesianDate(currentWorkflow.saranaNotifiedAt) : 'Selesai'})`
                                : isClusterComplete
                                ? 'Semua Persyaratan Terpenuhi'
                                : 'Menunggu Berkas Surat Pengantar'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Checklist Kelengkapan Interaktif */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {/* Syarat 1: Evaluasi Petugas */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5 shadow-2xs">
                          <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              1. Evaluasi Seluruh Butir oleh Petugas:
                            </span>
                            <span className="text-[11px] text-slate-600">
                              ✓ {totalFindings} dari {totalFindings} butir temuan telah selesai dievaluasi ({totalClosed} Close, {totalOpen} Open).
                            </span>
                          </div>
                        </div>

                        {/* Syarat 2: Surat Pengantar SRIKANDI */}
                        <div className={`p-3 bg-white rounded-xl border flex items-start gap-2.5 shadow-2xs ${
                          isStageLetterReady ? 'border-emerald-200' : 'border-amber-200'
                        }`}>
                          <div className={`p-1 rounded-full mt-0.5 ${
                            isStageLetterReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isStageLetterReady ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              2. Naskah Surat Pengantar SRIKANDI (TTE):
                            </span>
                            <span className={`text-[11px] ${isStageLetterReady ? 'text-emerald-700 font-semibold' : 'text-amber-800'}`}>
                              {isStageLetterReady 
                                ? `✓ Surat TTE No: ${displayLetterNo} telah tersimpan di sistem.` 
                                : `⚠️ Menunggu Admin mengunggah surat ber-TTE dari SRIKANDI pada Pilar 1.`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Area Pengiriman Notifikasi WA & Email */}
                      {canManage ? (
                        <div className={`p-4 rounded-2xl border space-y-3 shadow-2xs transition-all ${
                          isStageAlreadySent 
                            ? 'bg-emerald-50/70 border-emerald-300' 
                            : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                                  Pengiriman Notifikasi WhatsApp & Email Resmi ke Sarana
                                </span>
                                {isStageAlreadySent && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>STATUS: SUDAH TERKIRIM</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 space-y-0.5">
                                <p>
                                  Sarana Penerima: <strong>{inspection.facility.name}</strong> • PIC: <strong>{inspection.facility.picName}</strong>
                                </p>
                                <p>
                                  Saluran: WhatsApp (<strong>{inspection.facility.picPhone}</strong>) & Email (<strong>{inspection.facility.picEmail || 'qa@sarana.co.id'}</strong>)
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={handleSendNotificationToSarana}
                                disabled={!isClusterComplete || isProcessing}
                                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all shadow-md shrink-0 ${
                                  isClusterComplete
                                    ? isStageAlreadySent
                                      ? 'bg-indigo-700 hover:bg-indigo-600 text-white cursor-pointer active:scale-95'
                                      : totalOpen === 0
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                                      : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer active:scale-95'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                                title={isStageAlreadySent ? `Kirim ulang ringkasan hasil telaah Sesi ${selectedClusterStage} ke WhatsApp sarana` : undefined}
                              >
                                {isStageAlreadySent ? (
                                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                <span>
                                  {isProcessing
                                    ? isStageAlreadySent ? 'Mengirim Ulang Notifikasi...' : 'Mengirimkan Notifikasi...'
                                    : isStageAlreadySent
                                    ? `Kirim Ulang Notifikasi Sesi ${selectedClusterStage} ke Sarana`
                                    : totalOpen === 0
                                    ? `Kirim Hasil Evaluasi Sesi ${selectedClusterStage} (Selesai/Closed) ke Sarana`
                                    : `Kirim Hasil Evaluasi Sesi ${selectedClusterStage} (${totalOpen} Butir Open) ke Sarana`}
                                </span>
                              </button>
                            </div>
                          </div>

                          {currentWorkflow.saranaNotifiedAt && (
                            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 text-[11px] text-emerald-900 font-semibold flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>✓ Notifikasi Sesi {selectedClusterStage} telah berhasil dikirimkan ke Sarana pada: {formatIndonesianDateTime(currentWorkflow.saranaNotifiedAt)}</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-bold border border-emerald-300">
                                DELIVERED
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                          {currentWorkflow.saranaNotifiedAt ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Notifikasi resmi telah terkirim ke WhatsApp PIC Sarana pada {formatIndonesianDateTime(currentWorkflow.saranaNotifiedAt)}.
                            </span>
                          ) : (
                            <span>Pengiriman notifikasi ke sarana dikelola oleh Admin SIMONCER BBPOM setelah naskah surat pengantar ber-TTE diunggah.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ========================================================================= */}
                    {/* TRANSISI KE SESI CAPA BERIKUTNYA (JIKA MASIH ADA BUTIR OPEN)              */}
                    {/* ========================================================================= */}
                    {totalOpen > 0 && (
                      <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-amber-950 text-xs sm:text-sm block">
                              Siklus Lanjutan: Sesi CAPA {selectedClusterStage === 1 ? '2' : selectedClusterStage + 1} Diperlukan
                            </span>
                            <p className="text-[11px] text-amber-900 leading-relaxed max-w-2xl">
                              Pada Sesi CAPA {selectedClusterStage} ini, terdapat <strong>{totalOpen} butir temuan yang masih berstatus OPEN</strong> (Belum Memadai). Sarana diwajibkan untuk menindaklanjuti dan mengunggah perbaikan lanjutan pada kluster sesi berikutnya agar seluruh butir dapat dinyatakan Tuntas (Closed).
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {selectedClusterStage === 1 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedClusterStage(2)}
                              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <span>Beralih ke Kluster Sesi CAPA 2</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : canManage && (
                            <button
                              type="button"
                              onClick={handleCreateNewStageLetter}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ Buka Sesi CAPA Baru</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RIWAYAT NASKAH MULTI-SESI / DOSSIER TIMELINE */}
                    {existingStageLetters.length > 0 && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <History className="w-4 h-4 text-indigo-600" />
                            Dossier Naskah Surat Pengantar Antar-Sesi CAPA
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">
                            Total: {existingStageLetters.length} Dokumen Resmi
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {existingStageLetters.map((doc, idx) => (
                            <div
                              key={doc.id || idx}
                              className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs flex-wrap gap-2 hover:border-indigo-300 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-indigo-200">
                                  S{existingStageLetters.length - idx}
                                </span>
                                <div>
                                  <span className="font-mono font-bold text-slate-900 text-xs block">
                                    {doc.letterNo}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {doc.title} • Tanggal: {formatIndonesianDate(doc.issuedDate)}
                                  </span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                doc.type === 'SURAT_PENUTUPAN_CAPA' || doc.notes?.toLowerCase().includes('closed')
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {doc.type === 'SURAT_PENUTUPAN_CAPA' || doc.notes?.toLowerCase().includes('closed')
                                  ? '✓ Closed (Tuntas)'
                                  : '⚠️ Perlu Perbaikan'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>
              SOP Terintegrasi SIMONCER BBPOM Semarang • Menghubungkan SRIKANDI (TTE) dengan Sarana
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
