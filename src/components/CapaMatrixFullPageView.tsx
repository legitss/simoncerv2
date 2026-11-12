import React, { useState, useEffect } from 'react';
import { 
  InspectionSession, 
  FindingItem, 
  EvidenceFile, 
  SibergasSurveyData, 
  UserRole, 
  AuthAccount,
  AuditTrailLog 
} from '../types';
import { 
  ArrowLeft, 
  Send, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Table, 
  Printer, 
  Download, 
  ChevronRight, 
  Save, 
  Eye, 
  Plus, 
  ExternalLink,
  HelpCircle,
  Award,
  Layers,
  Check,
  Edit3,
  Maximize2,
  Minimize2,
  FileCheck,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ListChecks,
  AlertTriangle,
  Target,
  MessageSquare,
  X,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCommodityMatrixConfig, CommodityMatrixColumn } from '../utils/commodityMatrix';
import { createAutomaticNotifications, getNotificationPreferences } from '../utils/notificationService';
import { CommodityMatrixTable } from './CommodityMatrixTable';
import { SibergasSurveyForm } from './SibergasSurveyForm';
import { calculateRemainingDays, formatIndonesianDate, getCategoryBadge, getStatusBadgeConfig } from '../utils/date';
import { generateCommodityMatrixAttachmentPDF, generateSrikandiCoverLetterPDF } from '../utils/pdfReportGenerator';
import { sendCapaSubmittedNotification } from '../utils/whatsappGateway';

interface CapaMatrixFullPageViewProps {
  inspection: InspectionSession;
  currentRole?: UserRole;
  currentUser?: AuthAccount | null;
  onBack: () => void;
  onUpdateInspection: (updated: InspectionSession) => void;
  onSubmitCapa: (updated: InspectionSession) => void;
  onSaveSurvey: (surveyData: SibergasSurveyData) => void;
}

export const CapaMatrixFullPageView: React.FC<CapaMatrixFullPageViewProps> = ({
  inspection,
  currentRole = 'SARANA',
  currentUser,
  onBack,
  onUpdateInspection,
  onSubmitCapa,
  onSaveSurvey,
}) => {
  const isSarana = currentRole === 'SARANA';
  const isReadOnlyForOfficer = !isSarana;

  // Active Main Step: 'SURVEY' (Langkah 1) vs 'CAPA' (Langkah 2)
  const isSurveyDone = !!inspection.sibergasSurvey?.completed;
  const [activeStep, setActiveStep] = useState<'SURVEY' | 'CAPA'>(
    isSurveyDone ? 'CAPA' : 'SURVEY'
  );

  // Local state for survey data
  const [surveyData, setSurveyData] = useState<SibergasSurveyData | undefined>(
    inspection.sibergasSurvey
  );

  // If survey is already completed, guarantee activeStep stays 'CAPA' so survey tabs never display
  useEffect(() => {
    if (surveyData?.completed && activeStep === 'SURVEY') {
      setActiveStep('CAPA');
    }
  }, [surveyData?.completed, activeStep]);

  // View modes within CAPA Step:
  // 'WIDE_MATRIX' -> Full-width interactive table with all commodity columns
  // 'GUIDED_FORM' -> Detailed row-by-row editor with evidence uploader & presets
  // 'DOCUMENT_PREVIEW' -> Official government-formatted document ready to print/PDF
  const [viewMode, setViewMode] = useState<'WIDE_MATRIX' | 'GUIDED_FORM' | 'DOCUMENT_PREVIEW'>('WIDE_MATRIX');

  // Findings state
  const [findingsData, setFindingsData] = useState<FindingItem[]>(() =>
    JSON.parse(JSON.stringify(inspection.findings))
  );
  const [activeFindingIndex, setActiveFindingIndex] = useState(0);

  // Controls whether the giant official print matrix table is expanded
  const [showFullMatrixTable, setShowFullMatrixTable] = useState(false);

  // Completion statistics for findings
  const completedFindingsCount = findingsData.filter(
    (f) => !!(f.capa?.correctiveAction?.trim() && f.capa?.preventiveAction?.trim())
  ).length;
  const isAllFindingsCompleted = findingsData.length > 0 && completedFindingsCount === findingsData.length;
  const completionPercentage = findingsData.length > 0
    ? Math.round((completedFindingsCount / findingsData.length) * 100)
    : 0;

  // Quick edit row state in WIDE_MATRIX view
  const [expandedRowId, setExpandedRowId] = useState<string | null>(
    findingsData[0]?.id || null
  );

  // Evidence file upload inputs
  const [newFileCategory, setNewFileCategory] = useState<EvidenceFile['category']>('Foto Bukti');
  const [newFileName, setNewFileName] = useState('');
  const [showGdriveHelpPopover, setShowGdriveHelpPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Submission success popup modal state
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [showSubmissionSuccessModal, setShowSubmissionSuccessModal] = useState(false);
  const [showWaPreviewInModal, setShowWaPreviewInModal] = useState(false);

  // PDF download loading states
  const [isDownloadingMatrix, setIsDownloadingMatrix] = useState(false);
  const [isDownloadingLetter, setIsDownloadingLetter] = useState(false);

  // Sync findings when inspection prop changes (Guaranteed clean & deduplicated)
  useEffect(() => {
    const rawFindings: FindingItem[] = JSON.parse(JSON.stringify(inspection.findings || []));
    const cleanFindings = rawFindings.map((f, fIdx) => {
      if (!f.capa || !Array.isArray(f.capa.evidenceFiles)) return f;
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const cleanFiles: EvidenceFile[] = [];
      f.capa.evidenceFiles.forEach((ev, evIdx) => {
        if (!ev) return;
        const cleanId = ev.id || `EV-${f.id || fIdx}-${evIdx}-${Math.random().toString(36).slice(2, 6)}`;
        const cleanName = (ev.name || '').trim().toLowerCase();
        if (seenIds.has(cleanId) || (cleanName && seenNames.has(cleanName))) return;
        seenIds.add(cleanId);
        if (cleanName) seenNames.add(cleanName);
        cleanFiles.push({ ...ev, id: cleanId });
      });
      return {
        ...f,
        capa: {
          ...f.capa,
          evidenceFiles: cleanFiles,
        },
      };
    });

    setFindingsData(cleanFindings);
    if (inspection.sibergasSurvey?.completed) {
      setSurveyData(inspection.sibergasSurvey);
    }
  }, [inspection]);

  const matrixConfig = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  const currentFinding = findingsData[activeFindingIndex] || findingsData[0];
  const sla = calculateRemainingDays(inspection.srikandiLetter.deadlineDate);
  const statusBadge = getStatusBadgeConfig(inspection.status);

  // Status flags for submission (Include EVALUASI_PETUGAS and localSubmitted)
  const isAlreadySubmitted =
    localSubmitted ||
    inspection.status === 'EVALUASI_PETUGAS' ||
    inspection.status === 'CAPA_TERKIRIM' ||
    inspection.status === 'MASIH_EVALUASI' ||
    inspection.status === 'TERVALIDASI' ||
    inspection.status === 'SELESAI_CLOSED';

  const isNeedsRevision = inspection.status === 'PERLU_PERBAIKAN';

  // Update field in active finding (Pure Immutable)
  const handleFieldChange = (index: number, field: keyof FindingItem['capa'], value: any) => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          capa: {
            ...item.capa,
            [field]: value,
          },
        };
      })
    );
  };

  // Add evidence to finding (Pure Immutable & Deduplicated)
  const handleAddEvidence = (targetIndex: number) => {
    if (isReadOnlyForOfficer) return;
    const trimmedName = newFileName.trim();
    if (!trimmedName) return;

    const isDriveLink = newFileCategory === 'Link Google Drive' || trimmedName.startsWith('http://') || trimmedName.startsWith('https://');
    const driveUrl = isDriveLink ? trimmedName : undefined;
    const displayName = isDriveLink 
      ? (trimmedName.includes('drive.google') ? 'Folder Google Drive Bukti Terpusat' : 'Tautan Repositori Cloud Bukti Dukung')
      : trimmedName;

    const newEvidence: EvidenceFile = {
      id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${targetIndex}`,
      name: displayName,
      size: isDriveLink ? 'Cloud Link' : `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      type: isDriveLink ? 'cloud/drive' : (trimmedName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      url: driveUrl,
      driveUrl: driveUrl,
      uploadedAt: new Date().toISOString(),
      category: newFileCategory,
    };

    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== targetIndex) return item;
        // Prevent duplicate file with identical name or ID
        const existingFiles = (item.capa?.evidenceFiles || []).filter(
          (f) => f.name.toLowerCase() !== displayName.toLowerCase() && f.id !== newEvidence.id
        );
        return {
          ...item,
          capa: {
            ...item.capa,
            evidenceFiles: [...existingFiles, newEvidence],
            ...(isDriveLink ? { evidenceDriveUrl: driveUrl } : {}),
          },
        };
      })
    );

    setNewFileName('');
    showAutoSaveToast(isDriveLink ? 'Tautan repositori Google Drive berhasil disimpan.' : 'Berkas bukti berhasil dilampirkan.');
  };

  const handleEvidenceDriveUrlChange = (targetIndex: number, url: string) => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== targetIndex) return item;
        return {
          ...item,
          capa: {
            ...item.capa,
            evidenceDriveUrl: url,
          },
        };
      })
    );
  };

  const handleFileUploadSim = (targetIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnlyForOfficer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const fileType = file.type || 'application/octet-stream';
    // Clear input value immediately to prevent double fire or stale cache
    e.target.value = '';

    const newEvidence: EvidenceFile = {
      id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${targetIndex}`,
      name: fileName,
      size: fileSize,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      category: newFileCategory,
    };

    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== targetIndex) return item;
        // Prevent duplicate upload with same name or ID
        const existingFiles = (item.capa?.evidenceFiles || []).filter(
          (f) => f.name.toLowerCase() !== fileName.toLowerCase() && f.id !== newEvidence.id
        );
        return {
          ...item,
          capa: {
            ...item.capa,
            evidenceFiles: [...existingFiles, newEvidence],
          },
        };
      })
    );

    showAutoSaveToast(`Berkas "${fileName}" berhasil diunggah.`);
  };

  const handleRemoveEvidence = (targetIndex: number, fileId: string) => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== targetIndex) return item;
        return {
          ...item,
          capa: {
            ...item.capa,
            evidenceFiles: item.capa.evidenceFiles.filter((f) => f.id !== fileId),
          },
        };
      })
    );
    showAutoSaveToast('Berkas bukti dihapus.');
  };

  // Populate realistic commodity-tailored presets (Immutable & Deduplicated)
  const handleApplyPreset = (targetIndex: number) => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== targetIndex) return item;
        const f = { ...item, capa: { ...item.capa } };

        // Common fields
        f.capa.rootCauseAnalysis =
          f.capa.rootCauseAnalysis ||
          'Terjadinya kegagalan pemeliharaan berkala pada instrumen terkait dan pergantian personil tanpa orientasi SOP yang memadai (Human Error & Gap Knowledge).';
        f.capa.gapAnalysis =
          f.capa.gapAnalysis ||
          'Kesenjangan antara prosedur tetap operasional terkini dengan pelaksanaan fisik di area kerja.';
        f.capa.requirement =
          f.capa.requirement ||
          (f.clause || 'Persyaratan standar pemenuhan regulasi yang berlaku');
        f.capa.currentCondition =
          f.capa.currentCondition ||
          (f.description || 'Kondisi observasi fisik saat pemeriksaan lapangan');
        f.capa.correctiveAction =
          f.capa.correctiveAction ||
          '1) Melakukan isolasi dan kalibrasi ulang instrumen terdampak oleh teknisi bersertifikat. 2) Melakukan rekonsiliasi data dan pembaruan dokumen logbook yang tertinggal.';
        f.capa.preventiveAction =
          f.capa.preventiveAction ||
          '1) Merevisi SOP Pemeliharaan & Kualifikasi Berkala No. SOP/QA-024 dengan jadwal audit internal per 2 minggu. 2) Melaksanakan pelatihan penyegaran regulasi bagi seluruh staf operasional.';
        f.capa.pic = f.capa.pic || inspection.facility.picName;
        f.capa.targetCompletionDate =
          f.capa.targetCompletionDate ||
          new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
        f.capa.progressStatus = f.capa.progressStatus || 'Sudah Selesai';
        f.capa.evidenceDocNumber =
          f.capa.evidenceDocNumber ||
          `DOC-CAPA-${new Date().getFullYear()}/${String(targetIndex + 1).padStart(3, '0')}`;

        // Form 8 Pelayanan Kefarmasian specific impact
        if (matrixConfig.id === 'PELAYANAN_KEFARMASIAN') {
          f.capa.impact =
            f.capa.impact ||
            'Berpotensi menimbulkan risiko penurunan mutu sediaan farmasi, ketidaktertelusuran mutasi stok sediaan khusus (NPP), atau risiko kesalahan dispensing terhadap keselamatan pasien.';
        }

        const existingNames = new Set(f.capa.evidenceFiles.map((ev) => ev.name.toLowerCase()));
        const newEvFiles = [...f.capa.evidenceFiles];

        const default1Name = `Foto_Perbaikan_Fisik_${f.id}.jpg`;
        if (!existingNames.has(default1Name.toLowerCase())) {
          newEvFiles.push({
            id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-1`,
            name: default1Name,
            size: '1.4 MB',
            type: 'image/jpeg',
            uploadedAt: new Date().toISOString(),
            category: 'Foto Bukti',
          });
        }

        const default2Name = `Revisi_SOP_Terkoreksi_Bertandatangan.pdf`;
        if (!existingNames.has(default2Name.toLowerCase())) {
          newEvFiles.push({
            id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-2`,
            name: default2Name,
            size: '890 KB',
            type: 'application/pdf',
            uploadedAt: new Date().toISOString(),
            category: 'SOP Terkoreksi',
          });
        }

        f.capa.evidenceFiles = newEvFiles;
        return f;
      })
    );

    showAutoSaveToast(`Draf standar format ${matrixConfig.title} berhasil diterapkan.`);
  };

  // Toast feedback
  const showAutoSaveToast = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Save Draft
  const handleSaveDraft = () => {
    const updated: InspectionSession = {
      ...inspection,
      findings: findingsData,
      sibergasSurvey: surveyData,
      updatedAt: new Date().toISOString(),
    };
    onUpdateInspection(updated);
    showAutoSaveToast('Draf isian matriks CAPA berhasil disimpan ke sistem.');
  };

  // Survey Complete handler
  const handleSurveyCompleted = (data: SibergasSurveyData) => {
    setSurveyData(data);
    onSaveSurvey(data);

    const nowStr = new Date().toISOString();
    const newAuditLog: AuditTrailLog = {
      id: `LOG-${Date.now()}-SIBERGAS`,
      action: 'Sarana Menyelesaikan Survei Integritas Petugas (SIBERGAS)',
      actor: inspection.facility.picName,
      role: 'Sarana',
      timestamp: nowStr,
      details: `Survei integritas petugas SIBERGAS telah diisi oleh sarana sebagai prasyarat pengisian matriks CAPA pertama. Penilaian dicatat untuk kepatuhan Zona Integritas WBK/WBBM.`,
      badgeType: 'success',
    };

    const updated: InspectionSession = {
      ...inspection,
      sibergasSurvey: {
        ...data,
        completed: true,
        submittedAt: data.submittedAt || nowStr,
      },
      auditTrail: [newAuditLog, ...inspection.auditTrail],
      updatedAt: nowStr,
    };

    onUpdateInspection(updated);
    setActiveStep('CAPA');
    showAutoSaveToast('Survei integritas SIBERGAS berhasil disimpan! Formulir matriks CAPA telah terbuka.');
  };

  // Final Submit to BBPOM
  const handleFinalSubmit = () => {
    if (!surveyData || !surveyData.completed) {
      alert('Prasyarat Wajib: Anda harus menyelesaikan Survei Integritas Petugas (SIBERGAS) terlebih dahulu sebelum mengirimkan berkas CAPA.');
      setActiveStep('SURVEY');
      return;
    }

    setIsSubmitting(true);
    const nowStr = new Date().toISOString();
    const updatedFindings = findingsData.map((f) => ({
      ...f,
      capa: {
        ...f.capa,
        submittedAt: nowStr,
        evaluationStatus: 'PENDING' as const,
      },
    }));

    const totalEvidenceCount = updatedFindings.reduce(
      (acc, f) => acc + f.capa.evidenceFiles.length,
      0
    );

    const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;
    const officerPhone = inspection.assignedOfficer?.phone || '+62 812-7788-9911';

    // 1. WhatsApp Receipt for Sarana
    const receiptWaNotif = {
      id: `NOTIF-${Date.now()}-REC`,
      channel: 'WHATSAPP' as const,
      recipient: `${inspection.facility.picPhone} (${inspection.facility.picName})`,
      subject: `[SIMONCER] Tanda Terima Laporan CAPA - Kode: ${inspection.capaCode}`,
      content: `*PEMBERITAHUAN TANDA TERIMA CAPA*\n\nYth. Manajemen ${inspection.facility.name},\n\nLaporan tindakan perbaikan dan pencegahan (CAPA) format ${matrixConfig.title} untuk Kode: *${inspection.capaCode}* telah *BERHASIL DITERIMA* oleh sistem SIMONCER pada ${new Date().toLocaleDateString('id-ID')} pukul ${new Date().toLocaleTimeString('id-ID')} WIB dengan total ${totalEvidenceCount} berkas bukti.\n\nStatus saat ini: *MASIH_EVALUASI (Menunggu Verifikasi Evaluator: ${officerName})*\n\nTim verifikator kami akan menelaah kecukupan bukti dan efektivitas tindakan perbaikan yang Anda unggah. Anda dapat memantau status secara langsung melalui portal SIMONCER.\n\nTerima kasih atas kerja samanya dalam pemenuhan standar kepatuhan.`,
      sentAt: nowStr,
      status: 'DELIVERED' as const,
      triggerEvent: 'CAPA_DITERIMA' as const,
    };

    // 2. WhatsApp Notification for Officer Evaluator
    const officerWaNotif = {
      id: `NOTIF-${Date.now()}-OFFICER`,
      channel: 'WHATSAPP' as const,
      recipient: `${officerPhone} (${officerName})`,
      subject: `[SIMONCER] Sarana Telah Mengirimkan Berkas CAPA - ${inspection.facility.name}`,
      content: `*PEMBERITAHUAN MASUK DOKUMEN CAPA*\n\nYth. Petugas Evaluator ${officerName},\n\nSarana ${inspection.facility.name} telah menyerahkan dokumen perbaikan CAPA (${inspection.capaCode}) format ${matrixConfig.title} dengan ${totalEvidenceCount} berkas bukti.\n\nSilakan buka portal SIMONCER untuk melakukan telaah dan validasi.`,
      sentAt: nowStr,
      status: 'DELIVERED' as const,
      triggerEvent: 'CAPA_DITERIMA' as const,
    };

    const newAuditLog: AuditTrailLog = {
      id: `LOG-${Date.now()}`,
      action: `Sarana Mengirimkan Laporan CAPA Matriks ${matrixConfig.facilityTypeLabel}`,
      actor: inspection.facility.picName,
      role: 'Sarana',
      timestamp: nowStr,
      details: `Formulir CAPA matriks standar ${matrixConfig.codeStandard} diserahkan dengan ${totalEvidenceCount} berkas bukti perbaikan. Status otomatis berganti dari MENUNGGU_CAPA menjadi EVALUASI_PETUGAS (Menunggu Telaah & Verifikasi Petugas ${officerName}). Notifikasi WhatsApp Gateway otomatis terkirim.`,
      badgeType: 'info',
    };

    // Dispatch dual-channel notifications (WhatsApp & Email) based on user preferences
    const autoNotifs = createAutomaticNotifications({
      triggerEvent: 'CAPA_DITERIMA',
      inspection,
      additionalDetails: {
        newStatus: 'EVALUASI_PETUGAS',
        customNote: `Telah diserahkan ${totalEvidenceCount} berkas bukti dukung beserta repositori Google Drive.`,
      },
    });

    const updatedInspection: InspectionSession = {
      ...inspection,
      status: 'EVALUASI_PETUGAS',
      findings: updatedFindings,
      sibergasSurvey: surveyData,
      notifications: [...autoNotifs, officerWaNotif, receiptWaNotif, ...inspection.notifications],
      auditTrail: [newAuditLog, ...inspection.auditTrail],
      updatedAt: nowStr,
    };

    sendCapaSubmittedNotification(updatedInspection, totalEvidenceCount).catch((err) => {
      console.error('Error sending WhatsApp notification via gateway:', err);
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setLocalSubmitted(true);
      setShowSubmissionSuccessModal(true);
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch (err) {
        console.log(err);
      }
      onSubmitCapa(updatedInspection);
    }, 600);
  };

  const handleDownloadPdfAttachment = async () => {
    try {
      setIsDownloadingMatrix(true);
      await generateCommodityMatrixAttachmentPDF({
        ...inspection,
        findings: findingsData,
      });
    } catch (err) {
      console.error('Download matrix PDF failed:', err);
      alert('Gagal mengunduh dokumen lampiran matriks CAPA.');
    } finally {
      setIsDownloadingMatrix(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    try {
      setIsDownloadingLetter(true);
      await generateSrikandiCoverLetterPDF(inspection);
    } catch (err) {
      console.error('Download cover letter failed:', err);
      alert('Gagal mengunduh surat pengantar TTE SRIKANDI.');
    } finally {
      setIsDownloadingLetter(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-[#1e3a5f] flex flex-col font-sans selection:bg-emerald-500 selection:text-white print:bg-white print:text-black">
      
      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="px-4 py-3 bg-emerald-900/95 text-emerald-100 border border-emerald-500 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold">{saveSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* TOP APP BAR (FULL WIDTH, BPOM OFFICIAL NAVY & GREEN HEADER!) */}
      <header className="sticky top-0 z-40 bpom-header-navy text-white shadow-xl shrink-0 print:hidden">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Back button & Title identification */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="p-2 text-[#1e3a5f] bg-white/15 hover:bg-white/25 rounded-xl border border-white/25 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                title="Kembali ke Halaman Sebelumnya"
              >
                <ArrowLeft className="w-4 h-4 text-[#86efac]" />
                <span className="hidden xs:inline">Kembali</span>
              </button>

              <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[#2e856e] text-white border border-white/20 shrink-0 shadow-xs">
                    {inspection.capaCode}
                  </span>
                  <span className="text-xs font-extrabold text-[#1e3a5f] truncate max-w-[170px] sm:max-w-none">
                    {inspection.facility.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-[#1e3a5f] border border-white/25 font-semibold hidden md:inline-block">
                    {matrixConfig.codeStandard}
                  </span>
                </div>
                <p className="text-[11px] text-[#1e3a5f]/80 mt-0.5 hidden sm:flex items-center gap-2 truncate">
                  <span>{matrixConfig.title}</span>
                  <span>•</span>
                  <span>PIC: {inspection.facility.picName} ({inspection.facility.picPhone})</span>
                </p>
              </div>
            </div>

            {/* Mobile SLA Pill */}
            <div className={`sm:hidden px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 ${
              sla.isOverdue 
                ? 'bg-red-600/90 text-white border-red-300/40' 
                : 'bg-amber-500/90 text-slate-950 border-amber-300/40'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{sla.text}</span>
            </div>
          </div>

          {/* Right: Actions, SLA, and Submit (Desktop & Tablet >= sm) */}
          <div className="hidden sm:flex items-center gap-2.5 flex-wrap">
            
            {/* SLA Badge */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              sla.isOverdue 
                ? 'bg-red-600/90 text-white border-red-300/40' 
                : 'bg-amber-400/20 text-amber-800 border-amber-300/40'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{sla.text}</span>
            </div>

            {/* Save Draft */}
            {!isReadOnlyForOfficer && activeStep === 'CAPA' && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-[#1e3a5f] rounded-xl text-xs font-bold border border-white/25 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#86efac]" />
                <span>Simpan Draf</span>
              </button>
            )}

            {/* Download PDF Matriks */}
            <button
              type="button"
              onClick={handleDownloadPdfAttachment}
              disabled={isDownloadingMatrix}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-[#1e3a5f] rounded-xl text-xs font-bold border border-white/25 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Unduh Dokumen Lampiran Matriks CAPA Resmi"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>{isDownloadingMatrix ? 'Memproses PDF...' : 'Unduh PDF Matriks'}</span>
            </button>

            {/* Print Official Document */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-white/15 hover:bg-white/25 text-[#1e3a5f] rounded-xl border border-white/25 transition-colors cursor-pointer"
              title="Cetak Dokumen Resmi"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Submit / Status CAPA Button */}
            {!isReadOnlyForOfficer && activeStep === 'CAPA' && (
              isAlreadySubmitted ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3.5 py-1.5 bg-[#2e856e] border border-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#1e3a5f] shrink-0" />
                    <div className="text-left">
                      <span className="font-extrabold text-[#1e3a5f] block leading-tight">
                        {inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED'
                          ? 'CAPA Telah Tervalidasi Balai'
                          : 'CAPA Telah Terkirim ke Balai'}
                      </span>
                      <span className="text-[10px] text-[#1e3a5f]/90 font-medium block">
                        {inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED'
                          ? 'Selesai (Closed)'
                          : 'Status: EVALUASI_PETUGAS'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSubmissionSuccessModal(true)}
                    className="px-3 py-2 bg-white text-[#243b55] hover:bg-slate-100 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Lihat tanda terima resmi dan status notifikasi penyerahan CAPA"
                  >
                    <Check className="w-3.5 h-3.5 text-[#2e856e]" />
                    <span>Bukti Penyerahan</span>
                  </button>
                </div>
              ) : isNeedsRevision ? (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim Perbaikan CAPA ke Balai (Revisi)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#2e856e] hover:bg-[#256d5a] text-white border border-white/25 rounded-xl text-xs font-extrabold shadow-lg shadow-[#2e856e]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim CAPA ke Balai'}</span>
                </button>
              )
            )}
          </div>

        </div>

        {/* SUBHEADER: STEPPER (Hanya jika survei belum selesai) ATAU TABS VIEW CAPA (jika survei sudah selesai) */}
        <div className="bg-[#243b55]/90 border-t border-white/15 px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          
          {!surveyData?.completed ? (
            /* Jika belum isi survei: Tampilkan alur prasyarat survei */
            <div className="flex items-center gap-2 sm:gap-3 text-xs whitespace-nowrap">
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold bg-amber-400/20 text-amber-800 border border-amber-300/40 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                  1
                </div>
                <span>Langkah 1: Survei Integritas (SIBERGAS)</span>
                <span className="text-[10px] bg-amber-400/30 text-[#1e3a5f] px-1.5 py-0.5 rounded font-bold hidden sm:inline">
                  Wajib Diisi Dahulu
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-[#1e3a5f]/50 shrink-0" />

              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold bg-white/10 text-[#1e3a5f]/60 border border-white/15">
                <div className="w-5 h-5 rounded-full bg-white/20 text-[#1e3a5f] flex items-center justify-center text-[10px] font-bold">
                  2
                </div>
                <span>Langkah 2: Matriks CAPA (Terkunci)</span>
              </div>
            </div>
          ) : (
            /* Jika survei SUDAH diisi: Tab survei dihilangkan sepenuhnya agar tidak membingungkan sarana */
            <div className="hidden md:flex items-center gap-2 sm:gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 text-[#1e3a5f]">
                <div className="w-6 h-6 rounded-lg bg-[#2e856e] text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-[#1e3a5f] text-xs block leading-tight">
                    Pengisian Formulir Dokumen CAPA
                  </span>
                  <span className="text-[10px] text-[#86efac] font-semibold block">
                    Zona Integritas WBK / WBBM • SIBERGAS Terverifikasi ✓
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* View mode switchers (Tampil saat di langkah CAPA / survei sudah selesai) */}
          {(surveyData?.completed || activeStep === 'CAPA') && (
            <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/20 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('WIDE_MATRIX')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'WIDE_MATRIX'
                    ? 'bg-[#2e856e] text-white font-extrabold shadow-xs'
                    : 'text-white/80 hover:text-[#1e3a5f]'
                }`}
                title="Daftar Butir Temuan dan Status Pengisian CAPA"
              >
                <ListChecks className="w-3.5 h-3.5 shrink-0" />
                <span>Daftar Temuan</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isAllFindingsCompleted
                    ? 'bg-white/25 text-white'
                    : 'bg-black/25 text-white'
                }`}>
                  {completedFindingsCount}/{findingsData.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('GUIDED_FORM')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'GUIDED_FORM'
                    ? 'bg-[#2e856e] text-white font-extrabold shadow-xs'
                    : 'text-white/80 hover:text-[#1e3a5f]'
                }`}
                title="Formulir Pengisian Terpadu per Butir Temuan"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span>Form (#{activeFindingIndex + 1})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('DOCUMENT_PREVIEW')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'DOCUMENT_PREVIEW'
                    ? 'bg-[#2e856e] text-white font-extrabold shadow-xs'
                    : 'text-white/80 hover:text-[#1e3a5f]'
                }`}
                title="Preview Dokumen Resmi Srikandi Siap Cetak"
              >
                <FileCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Preview Resmi</span>
              </button>
            </div>
          )}

        </div>
      </header>

      {/* MAIN VIEWPORT (FULL-WIDTH WORKSPACE) */}
      <main className="flex-1 w-full p-3 sm:p-6 lg:p-8 pb-24 sm:pb-8 space-y-6">

        {/* STEP 1: SIBERGAS INTEGRITY SURVEY (HANYA MUNCUL JIKA BELUM SELESAI) */}
        {!surveyData?.completed && activeStep === 'SURVEY' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            
            {/* Banner: Survey is required before CAPA form */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-[#fffbeb] to-amber-50 border border-amber-500/50 rounded-2xl space-y-2.5 text-xs text-amber-800 shadow-xl">
              <div className="flex items-center gap-2.5 font-bold text-amber-800 text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Prasyarat Mutlak Zona Integritas (WBK/WBBM) - Langkah 1</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-xs">
                Sesuai standar operasional Balai Besar POM di Semarang, sebelum mengisi dan menyerahkan dokumen Matriks CAPA, sarana <strong>wajib mengisi 7 butir kuesioner integritas petugas (SIBERGAS)</strong> terlebih dahulu. Penilaian Anda dijamin kerahasiaannya dan digunakan untuk evaluasi pelayanan prima bebas dari korupsi & gratifikasi.
              </p>
            </div>

            {/* Real Survey Form Component */}
            <div className="bg-[#f4f8fd] border border-blue-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <SibergasSurveyForm
                inspection={inspection}
                initialData={surveyData}
                readOnly={isReadOnlyForOfficer}
                onComplete={handleSurveyCompleted}
                onCancel={onBack}
                submitButtonLabel="Simpan Survei & Lanjutkan ke Matriks CAPA →"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CAPA MATRIX FORM (FULL WIDTH - NO POP-UP!) */}
        {(surveyData?.completed || activeStep === 'CAPA') && (
          <div className="w-full space-y-6 animate-in fade-in">
            
            {/* Top Commodity Standard Information Banner */}
            <div className="bg-[#f4f8fd] border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Standar Format Komoditi:
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">
                    {matrixConfig.codeStandard}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1e3a5f]">
                  {matrixConfig.title}
                </h2>
                <p className="text-xs text-slate-600">
                  {matrixConfig.sampleGuidance}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {!isReadOnlyForOfficer && (
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(activeFindingIndex)}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Isi draf standar sesuai klausul dan format komoditi ini"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Gunakan Draf Standar ({matrixConfig.id})</span>
                  </button>
                )}

                <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 text-xs text-slate-700">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Evaluator Balai:</span>
                  <span className="font-semibold text-emerald-700">
                    {inspection.assignedOfficer?.name || inspection.leadAuditor}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. VIEW MODE: WIDE MATRIX (Daftar Butir Temuan Disodorkan di Awal & Tabel Matriks Collapsible) */}
            {viewMode === 'WIDE_MATRIX' && (
              <div className="bg-[#f4f8fd] border border-blue-200/80 rounded-3xl overflow-hidden shadow-2xl space-y-6 p-4 sm:p-6 lg:p-8">
                
                {/* Header: Friendly orientation and instruction */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-200/80">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#1e3a5f] flex items-center gap-2.5">
                      <ListChecks className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span>Daftar Butir Temuan Yang Wajib Diisi CAPA</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 font-mono font-bold">
                        {findingsData.length} Butir Temuan
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Survei integritas SIBERGAS telah selesai! Di bawah ini adalah seluruh butir temuan ketidaksesuaian hasil pemeriksaan Balai. Silakan klik tombol <strong className="text-emerald-700">"Isi CAPA Butir Ini"</strong> pada masing-masing kartu untuk menyusun tindakan perbaikan & mengunggah bukti pendukung.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFindingIndex(0);
                        setViewMode('GUIDED_FORM');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Mulai Formulir Berurutan →</span>
                    </button>
                  </div>
                </div>

                {/* Progress Tracking Bar */}
                <div className="p-4 bg-white border border-blue-200/80 rounded-2xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#1e3a5f] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>Progres Kelengkapan Pengisian CAPA:</span>
                      <strong className="text-emerald-700 font-mono">
                        {completedFindingsCount} dari {findingsData.length} Butir Lengkap ({completionPercentage}%)
                      </strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-500/30 text-[11px] font-semibold">
                        ✓ {completedFindingsCount} Lengkap
                      </span>
                      {findingsData.length - completedFindingsCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-500/30 text-[11px] font-semibold">
                          ⚠️ {findingsData.length - completedFindingsCount} Belum Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full bg-[#e8f1fb] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {isAllFindingsCompleted
                      ? '🎉 Seluruh butir temuan telah dilengkapi CAPA! Anda dapat meninjau dokumen matriks resmi di bawah atau langsung kirim ke Balai.'
                      : '💡 Pastikan semua butir temuan terisi (Akar Masalah, Tindakan Korektif, Pencegahan, dan Bukti Foto/SOP) sebelum mengirimkan dokumen ke Balai.'}
                  </p>
                </div>

                {/* KARTU BUTIR TEMUAN DISODORKAN LANGSUNG DI AWAL (UPFRONT) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span>Kartu Rincian Butir Temuan & Status Pengisian:</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Pilih kartu butir yang ingin Anda lengkapi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {findingsData.map((f, idx) => {
                      const cat = getCategoryBadge(f.category);
                      const isComplete = !!(f.capa?.correctiveAction?.trim() && f.capa?.preventiveAction?.trim());
                      const hasPartial = !isComplete && !!(f.capa?.rootCauseAnalysis?.trim() || f.capa?.correctiveAction?.trim() || f.capa?.preventiveAction?.trim());
                      const evidenceCount = f.capa?.evidenceFiles?.length || 0;

                      return (
                        <div
                          key={f.id}
                          className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                            isComplete
                              ? 'bg-white border-emerald-500/40 shadow-sm'
                              : 'bg-white/90 border-blue-200/80 hover:border-blue-200'
                          }`}
                        >
                          {/* Header row: Finding number, Category Badge, and Completion Status Badge */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-500/30 text-emerald-700 font-mono font-black text-xs">
                                Butir #{idx + 1}
                              </span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase ${cat.bg} ${cat.text} border ${cat.border}`}>
                                {f.category}
                              </span>
                            </div>

                            {/* Status Badge */}
                            {isComplete ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>CAPA Lengkap</span>
                              </span>
                            ) : hasPartial ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Draf Sebagian</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-700 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                                <span>Belum Diisi</span>
                              </span>
                            )}
                          </div>

                          {/* Klausul Acuan Standar */}
                          <div className="text-xs font-bold text-[#1e3a5f] flex items-start gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <span>{f.clause}</span>
                          </div>

                          {/* Deskripsi Temuan Ketidaksesuaian dari Pemeriksa */}
                          <div className="p-3.5 bg-[#f4f8fd] rounded-xl border border-blue-200/80 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                              <span>Temuan Hasil Pemeriksaan Lapangan:</span>
                            </div>
                            <p className="text-xs text-[#1e3a5f] leading-relaxed font-normal">
                              {f.description}
                            </p>
                          </div>

                          {/* Mini Checklist of Filled Items */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                            <div className={`p-1.5 rounded-lg border text-center ${
                              f.capa?.rootCauseAnalysis ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800' : 'bg-[#f4f8fd] border-blue-200/80 text-slate-500'
                            }`}>
                              <span className="block font-bold">Akar Masalah</span>
                              <span>{f.capa?.rootCauseAnalysis ? '✓ Ada' : 'Belum'}</span>
                            </div>

                            <div className={`p-1.5 rounded-lg border text-center ${
                              f.capa?.correctiveAction ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800' : 'bg-[#f4f8fd] border-blue-200/80 text-slate-500'
                            }`}>
                              <span className="block font-bold">Tindakan CA</span>
                              <span>{f.capa?.correctiveAction ? '✓ Ada' : 'Belum'}</span>
                            </div>

                            <div className={`p-1.5 rounded-lg border text-center ${
                              f.capa?.preventiveAction ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800' : 'bg-[#f4f8fd] border-blue-200/80 text-slate-500'
                            }`}>
                              <span className="block font-bold">Tindakan PA</span>
                              <span>{f.capa?.preventiveAction ? '✓ Ada' : 'Belum'}</span>
                            </div>

                            <div className={`p-1.5 rounded-lg border text-center ${
                              evidenceCount > 0 ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800' : 'bg-[#f4f8fd] border-blue-200/80 text-slate-500'
                            }`}>
                              <span className="block font-bold">Bukti Foto/SOP</span>
                              <span>{evidenceCount > 0 ? `✓ ${evidenceCount} berkas` : 'Belum ada'}</span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-blue-200/80 flex items-center justify-between gap-2 flex-wrap">
                            {!isReadOnlyForOfficer && !isComplete ? (
                              <button
                                type="button"
                                onClick={() => handleApplyPreset(idx)}
                                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Gunakan draf rekomendasi standar untuk butir ini"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Gunakan Draf Rekomendasi</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-mono">
                                Target: {f.capa?.targetCompletionDate || 'Belum diatur'}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveFindingIndex(idx);
                                setViewMode('GUIDED_FORM');
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                isComplete
                                  ? 'bg-[#e8f1fb] hover:bg-[#d0e2f5] text-emerald-700 border border-emerald-500/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isComplete ? 'Periksa / Ubah Butir Ini' : 'Isi CAPA Butir Ini →'}</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Section for the Full Matrix Document Table */}
                <div className="pt-4 border-t border-blue-200/80 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowFullMatrixTable(!showFullMatrixTable)}
                    className="w-full p-4 bg-white hover:bg-white border border-blue-200/80 hover:border-blue-200 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#e8f1fb] flex items-center justify-center text-emerald-700 group-hover:bg-[#d0e2f5] transition-colors">
                        <Table className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-[#1e3a5f] flex items-center gap-2 flex-wrap">
                          <span>{showFullMatrixTable ? 'Sembunyikan' : 'Tampilkan'} Format Tabel Matriks Resmi Komoditi</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#e8f1fb] text-slate-700 border border-blue-200">
                            {matrixConfig.codeStandard}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Klik untuk melihat atau mengecek tata letak lembar matriks cetak kertas formal BBPOM Semarang lengkap dengan kop surat dan kolom regulasi komoditi.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 shrink-0 ml-2">
                      <span>{showFullMatrixTable ? 'Tutup Tabel' : 'Buka Tabel Matriks'}</span>
                      {showFullMatrixTable ? (
                        <ChevronUp className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-emerald-700" />
                      )}
                    </div>
                  </button>

                  {/* Render the full wide Commodity Matrix Table only when toggled */}
                  {showFullMatrixTable && (
                    <div className="overflow-x-auto rounded-2xl border border-blue-200/80 bg-white text-slate-900 p-2 sm:p-4 shadow-inner animate-in fade-in">
                      <div className="mb-3 p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                        <span>Format Dokumen Kertas Resmi Srikandi / BBPOM di Semarang:</span>
                        <span className="font-semibold text-slate-900">{matrixConfig.title}</span>
                      </div>
                      <CommodityMatrixTable
                        inspection={{
                          ...inspection,
                          findings: findingsData,
                        }}
                        onEditFinding={(_, idx) => {
                          setActiveFindingIndex(idx);
                          setViewMode('GUIDED_FORM');
                        }}
                        onSaveMatrix={handleSaveDraft}
                      />
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. VIEW MODE: GUIDED FORM (Formulir Rinci per Butir Temuan) */}
            {viewMode === 'GUIDED_FORM' && currentFinding && (
              <div className="bg-[#f4f8fd] border border-blue-200/80 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
                
                {/* Findings Selector Tabs & Back Button */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-blue-200/80 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-600">Pilih Butir Temuan:</span>
                    {findingsData.map((f, idx) => {
                      const isCurrent = activeFindingIndex === idx;
                      const cat = getCategoryBadge(f.category);
                      const isComplete = !!(f.capa?.correctiveAction?.trim() && f.capa?.preventiveAction?.trim());
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActiveFindingIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-slate-600 hover:text-[#1e3a5f] border border-blue-200/80'
                          }`}
                        >
                          {isComplete && <Check className="w-3 h-3 text-emerald-800 shrink-0" />}
                          <span>Butir #{idx + 1}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${cat.bg} ${cat.text}`}>
                            {f.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('WIDE_MATRIX')}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] hover:text-[#1e3a5f] rounded-xl text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Kembali ke Daftar Butir Temuan</span>
                    </button>
                  </div>
                </div>

                {/* 🎯 KOMPONEN VISUAL SOROTAN UTAMA: BUTIR TEMUAN HASIL PEMERIKSAAN */}
                {(() => {
                  const isCurrentComplete = !!(currentFinding.capa?.correctiveAction?.trim() && currentFinding.capa?.preventiveAction?.trim());
                  const isKritis = currentFinding.category === 'KRITIS';
                  const isMayor = currentFinding.category === 'MAYOR';
                  
                  // Dynamic styles based on severity
                  const theme = isKritis
                    ? {
                        wrapper: 'border-2 border-red-500/70 bg-gradient-to-br from-rose-50/90 via-white to-red-50/60 shadow-xl shadow-red-500/10',
                        accentBar: 'border-l-4 border-l-red-500',
                        badgeGlow: 'bg-red-500/20 text-red-700 border-red-500/50',
                        titleColor: 'text-red-700',
                        iconColor: 'text-red-700'
                      }
                    : isMayor
                    ? {
                        wrapper: 'border-2 border-amber-500/70 bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/60 shadow-xl shadow-amber-500/10',
                        accentBar: 'border-l-4 border-l-amber-500',
                        badgeGlow: 'bg-amber-500/20 text-amber-800 border-amber-500/50',
                        titleColor: 'text-amber-700',
                        iconColor: 'text-amber-700'
                      }
                    : {
                        wrapper: 'border-2 border-sky-500/60 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/60 shadow-xl shadow-sky-500/10',
                        accentBar: 'border-l-4 border-l-sky-500',
                        badgeGlow: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
                        titleColor: 'text-sky-400',
                        iconColor: 'text-sky-400'
                      };

                  const evidenceCount = currentFinding.capa?.evidenceFiles?.length || 0;

                  return (
                    <div className={`p-5 sm:p-6 rounded-3xl transition-all space-y-4 ${theme.wrapper}`}>
                      {/* Top Bar: Spotlight Badge, Severity Pill, Completion Status, and Quick Navigator */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-200/80 pb-3.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-3 py-1 rounded-xl bg-[#f4f8fd] border border-blue-200 font-mono font-black text-xs text-[#1e3a5f] flex items-center gap-1.5 shadow-sm">
                            <Target className="w-4 h-4 text-emerald-700" />
                            <span>FOKUS TEMUAN BUTIR #{activeFindingIndex + 1} DARI {findingsData.length}</span>
                          </span>

                          <span className={`px-3 py-1 rounded-xl font-black uppercase text-xs flex items-center gap-1.5 border shadow-xs ${theme.badgeGlow}`}>
                            {isKritis && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block mr-0.5" />}
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>TINGKAT {currentFinding.category}</span>
                          </span>

                          {isCurrentComplete ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>CAPA Sudah Lengkap</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Wajib Diisi & Dilengkapi</span>
                            </span>
                          )}
                        </div>

                        {/* Quick Presets & Sibling Navigation */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {!isReadOnlyForOfficer && (
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(activeFindingIndex)}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              title="Terapkan draf rekomendasi standar untuk butir ini"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                              <span>Gunakan Draf Standar</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={activeFindingIndex === 0}
                              onClick={() => setActiveFindingIndex((prev) => Math.max(0, prev - 1))}
                              className="p-1.5 bg-white hover:bg-[#e8f1fb] disabled:opacity-30 text-slate-700 rounded-lg text-xs border border-blue-200 cursor-pointer disabled:cursor-not-allowed transition-colors"
                              title="Butir Sebelumnya"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-mono text-slate-600 px-1">
                              {activeFindingIndex + 1}/{findingsData.length}
                            </span>
                            <button
                              type="button"
                              disabled={activeFindingIndex === findingsData.length - 1}
                              onClick={() => setActiveFindingIndex((prev) => Math.min(findingsData.length - 1, prev + 1))}
                              className="p-1.5 bg-white hover:bg-[#e8f1fb] disabled:opacity-30 text-slate-700 rounded-lg text-xs border border-blue-200 cursor-pointer disabled:cursor-not-allowed transition-colors"
                              title="Butir Berikutnya"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Standar & Klausul Regulasi Acuan */}
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1e3a5f] bg-[#f4f8fd] p-2.5 px-3.5 rounded-xl border border-blue-200/80">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-slate-600 font-semibold">Klausul Acuan Regulasi:</span>
                        <span className="text-[#1e3a5f] font-mono">{currentFinding.clause}</span>
                      </div>

                      {/* Centerpiece Spotlight: Deskripsi Temuan Ketidaksesuaian Hasil Pemeriksaan */}
                      <div className={`p-4 sm:p-5 rounded-2xl bg-[#f4f8fd] border border-blue-200/80 space-y-2 shadow-inner ${theme.accentBar}`}>
                        <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Deskripsi Ketidaksesuaian Hasil Pemeriksaan Lapangan (Wajib Ditindaklanjuti):</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-[#1e3a5f] leading-relaxed font-sans pl-1">
                          "{currentFinding.description}"
                        </p>
                      </div>

                      {/* Interactive 4-Step Checklist Roadmap for this Finding */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                          currentFinding.capa?.rootCauseAnalysis?.trim()
                            ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800'
                            : 'bg-[#f4f8fd] border-blue-200/80 text-slate-600'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            currentFinding.capa?.rootCauseAnalysis?.trim() ? 'bg-emerald-500 text-slate-950' : 'bg-[#e8f1fb] text-slate-600'
                          }`}>
                            {currentFinding.capa?.rootCauseAnalysis?.trim() ? '✓' : '1'}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-[11px] truncate">1. Akar Masalah</span>
                            <span className="text-[10px] block opacity-80">
                              {currentFinding.capa?.rootCauseAnalysis?.trim() ? 'Sudah dianalisis' : 'Wajib diisi'}
                            </span>
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                          currentFinding.capa?.correctiveAction?.trim()
                            ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800'
                            : 'bg-[#f4f8fd] border-blue-200/80 text-slate-600'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            currentFinding.capa?.correctiveAction?.trim() ? 'bg-emerald-500 text-slate-950' : 'bg-[#e8f1fb] text-slate-600'
                          }`}>
                            {currentFinding.capa?.correctiveAction?.trim() ? '✓' : '2'}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-[11px] truncate">2. Tindakan CA</span>
                            <span className="text-[10px] block opacity-80">
                              {currentFinding.capa?.correctiveAction?.trim() ? 'Sudah diisi' : 'Koreksi langsung'}
                            </span>
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                          currentFinding.capa?.preventiveAction?.trim()
                            ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800'
                            : 'bg-[#f4f8fd] border-blue-200/80 text-slate-600'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            currentFinding.capa?.preventiveAction?.trim() ? 'bg-emerald-500 text-slate-950' : 'bg-[#e8f1fb] text-slate-600'
                          }`}>
                            {currentFinding.capa?.preventiveAction?.trim() ? '✓' : '3'}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-[11px] truncate">3. Tindakan PA</span>
                            <span className="text-[10px] block opacity-80">
                              {currentFinding.capa?.preventiveAction?.trim() ? 'Sudah diisi' : 'Pencegahan sistemik'}
                            </span>
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                          evidenceCount > 0
                            ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800'
                            : 'bg-[#f4f8fd] border-blue-200/80 text-slate-600'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            evidenceCount > 0 ? 'bg-emerald-500 text-slate-950' : 'bg-[#e8f1fb] text-slate-600'
                          }`}>
                            {evidenceCount > 0 ? '✓' : '4'}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-[11px] truncate">4. Bukti Dukung</span>
                            <span className="text-[10px] block opacity-80">
                              {evidenceCount > 0 ? `${evidenceCount} Berkas Terunggah` : 'Unggah foto/SOP'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* DYNAMIC FORM INPUTS TAILORED TO COMMODITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* Standar & Kriteria */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">
                      Standar / Kriteria Acuan Regulasi
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.requirement || currentFinding.clause}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'requirement', e.target.value)}
                      placeholder="Contoh: Permenkes Standar Pelayanan Kefarmasian / CDOB Klausul 3.4"
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Kondisi Nyata / Current Condition */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">
                      Kondisi Nyata Saat Pemeriksaan (Observasi Lapangan)
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.currentCondition || currentFinding.description}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'currentCondition', e.target.value)}
                      placeholder="Observasi fisik yang dicatat inspektur"
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Analisis GAP */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Analisis Kesenjangan (GAP Analysis)</span>
                      <span className="text-[11px] text-slate-500">Perbandingan kondisi nyata vs persyaratan regulasi</span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.gapAnalysis || ''}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'gapAnalysis', e.target.value)}
                      placeholder="Tuliskan gap atau kesenjangan yang terjadi antara SOP / fasilitas fisik dengan standar BPOM..."
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Analisis Akar Masalah (Root Cause Analysis - 5 Whys / Fishbone) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Analisis Akar Penyebab Masalah (Root Cause Analysis - 5 Whys / Man, Machine, Method)</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">Wajib Analisis Mendalam</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.rootCauseAnalysis || ''}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'rootCauseAnalysis', e.target.value)}
                      placeholder="Mengapa ketidaksesuaian ini bisa terjadi? Jelaskan penyebab mendasar (bukan hanya gejala di permukaan)..."
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Khusus Komoditi Pelayanan Kefarmasian: Dampak (Impact) */}
                  {matrixConfig.id === 'PELAYANAN_KEFARMASIAN' && (
                    <div className="space-y-1.5 md:col-span-2 p-3.5 bg-amber-50 border border-amber-500/40 rounded-xl">
                      <label className="font-bold text-amber-800 flex items-center justify-between">
                        <span>Dampak terhadap Mutu Obat & Keselamatan Pasien (Form 8 Standar Pelayanan Kefarmasian)</span>
                        <span className="text-[11px] text-amber-700">Kolom Khusus Apotek / Toko Obat</span>
                      </label>
                      <textarea
                        rows={2}
                        disabled={isReadOnlyForOfficer}
                        value={currentFinding.capa.impact || ''}
                        onChange={(e) => handleFieldChange(activeFindingIndex, 'impact', e.target.value)}
                        placeholder="Jelaskan dampak temuan ini terhadap stabilitas obat, keabsahan resep, atau keselamatan pasien..."
                        className="w-full p-2.5 bg-white border border-amber-500/50 rounded-lg text-[#1e3a5f] focus:outline-none focus:border-amber-400 disabled:opacity-60"
                      />
                    </div>
                  )}

                  {/* Tindakan Perbaikan (Corrective Action - CA) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">
                      Tindakan Perbaikan (Corrective Action / CA)
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.correctiveAction || ''}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'correctiveAction', e.target.value)}
                      placeholder="Langkah perbaikan langsung untuk menyelesaikan temuan saat ini..."
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Tindakan Pencegahan (Preventive Action - PA) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">
                      Tindakan Pencegahan (Preventive Action / PA)
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.preventiveAction || ''}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'preventiveAction', e.target.value)}
                      placeholder="Langkah sistemik agar ketidaksesuaian serupa tidak terulang kembali..."
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Target Waktu & PIC */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">
                      Target Waktu Penyelesaian (Timeline)
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.targetCompletionDate || ''}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'targetCompletionDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">
                      Penanggung Jawab Tindakan (PIC)
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.pic || ''}
                      onChange={(e) => handleFieldChange(activeFindingIndex, 'pic', e.target.value)}
                      placeholder="Nama Apoteker / Penanggung Jawab Teknis"
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-[#1e3a5f] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                </div>

                {/* BUKTI DUKUNG PERBAIKAN (EVIDENCE UPLOAD) */}
                <div className="pt-6 border-t border-blue-200/80 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#1e3a5f] flex items-center gap-2">
                        <Upload className="w-4 h-4 text-emerald-700" />
                        <span>Berkas Bukti Dukung Perbaikan untuk Butir #{activeFindingIndex + 1}</span>
                      </h4>
                      <p className="text-xs text-slate-600">
                        Unggah foto perbaikan fisik, SOP yang telah direvisi & ditandatangani, logbook, sertifikat kalibrasi, atau dokumen pendukung.
                      </p>
                    </div>

                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {currentFinding.capa.evidenceFiles.length} Berkas Terlampir
                    </span>
                  </div>

                  {/* Metode Unggah Bukti Dukung */}
                  {!isReadOnlyForOfficer && (
                    <div className="space-y-3">
                      {/* Opsi 1: Unggah Berkas Langsung */}
                      <div className="p-4 bg-white rounded-2xl border border-blue-200/80 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Metode 1: Unggah Berkas Langsung (File dari Komputer / HP)</span>
                          </span>
                          <span className="text-[10px] text-slate-500">PDF, JPG, PNG, DOC (Maks. 25MB)</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative">
                          {/* Dropdown Kategori Berkas & Repositori Drive */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <select
                              value={newFileCategory}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setNewFileCategory(val);
                                if (val === 'Link Google Drive') {
                                  setShowGdriveHelpPopover(true);
                                }
                              }}
                              className={`px-3 py-2 bg-[#e8f1fb] border rounded-xl text-xs text-white focus:outline-none transition-all ${
                                newFileCategory === 'Link Google Drive'
                                  ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500/40'
                                  : 'border-blue-200 focus:border-emerald-500'
                              }`}
                              title="Pilih jenis bukti dukung atau repositori cloud"
                            >
                              <option value="Foto Bukti">Foto Bukti Fisik</option>
                              <option value="SOP Terkoreksi">SOP Terkoreksi & TTE</option>
                              <option value="Logbook Kalibrasi">Logbook / Kalibrasi</option>
                              <option value="Sertifikat Pelatihan">Sertifikat Pelatihan</option>
                              <option value="Link Google Drive">Link Google Drive (Repositori Cloud)</option>
                              <option value="Dokumen Lainnya">Dokumen Pendukung Lainnya</option>
                            </select>

                            {/* Tombol Info / Bantuan Ikon */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowGdriveHelpPopover((prev) => !prev)}
                                className={`px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                  showGdriveHelpPopover || newFileCategory === 'Link Google Drive'
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/30'
                                    : 'bg-blue-50 hover:bg-blue-900 border-blue-500/40 text-blue-700 hover:text-[#1e3a5f]'
                                }`}
                                title="Klik untuk Bantuan & Penjelasan Repositori Google Drive"
                              >
                                <HelpCircle className="w-4 h-4 text-blue-700" />
                                <span className="text-[11px] font-semibold hidden md:inline">Bantuan</span>
                              </button>

                              {/* POPOVER PENJELASAN REPOSITORI GOOGLE DRIVE */}
                              {showGdriveHelpPopover && (
                                <div className="absolute z-50 left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 sm:w-96 p-4 bg-white border border-blue-500/60 rounded-2xl shadow-2xl text-xs text-[#1e3a5f] animate-in fade-in zoom-in-95">
                                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-blue-200/80">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
                                        <HelpCircle className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h5 className="font-extrabold text-[#1e3a5f] text-xs">
                                          Bantuan: Repositori Google Drive
                                        </h5>
                                        <span className="text-[10px] text-blue-700 font-semibold">
                                          Penyimpanan Dokumen Terpusat
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowGdriveHelpPopover(false)}
                                      className="p-1 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="py-2.5 space-y-2 text-[11px] leading-relaxed text-slate-700">
                                    <p>
                                      Tautan ini adalah <strong className="text-[#1e3a5f]">repository dokumen pendukung</strong> (seperti file surat dinas tindak lanjut, foto bukti fisik resolusi tinggi, rekaman video inspeksi, sertifikat kalibrasi, atau laporan teknis) yang tersimpan secara terpusat untuk memudahkan evaluasi oleh petugas Balai POM.
                                    </p>

                                    <div className="p-2.5 bg-blue-50 border border-blue-500/30 rounded-xl space-y-1.5 text-[10px]">
                                      <span className="font-bold text-blue-700 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-blue-400" />
                                        Keuntungan Repositori Cloud:
                                      </span>
                                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                        <li>Bebas batas ukuran upload untuk dokumen tebal / video.</li>
                                        <li>Auditor Balai POM dapat meninjau seluruh berkas secara terstruktur dalam 1 klik.</li>
                                        <li>Pastikan hak akses tautan disetel ke: <span className="text-emerald-800 font-semibold">"Anyone with the link / Siapa saja yang memiliki link (Viewer)"</span>.</li>
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-600">SIMONCER Cloud Repo</span>
                                    <button
                                      type="button"
                                      onClick={() => setShowGdriveHelpPopover(false)}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                                    >
                                      Saya Mengerti
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Input: URL Google Drive vs File Name */}
                          {newFileCategory === 'Link Google Drive' ? (
                            <input
                              type="url"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              placeholder="Tempel tautan folder / file Google Drive (https://drive.google.com/drive/...)"
                              className="flex-1 px-3.5 py-2 bg-[#f4f8fd] border border-blue-500/50 rounded-xl text-xs text-[#1e3a5f] placeholder-slate-500 font-mono focus:outline-none focus:border-blue-400 ring-1 ring-blue-500/30"
                            />
                          ) : (
                            <input
                              type="text"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              placeholder="Nama berkas bukti (contoh: Foto_Suhu_Chiller_Terkalibrasi.jpg)"
                              className="flex-1 px-3.5 py-2 bg-[#e8f1fb] border border-blue-200 rounded-xl text-xs text-[#1e3a5f] focus:outline-none focus:border-emerald-500"
                            />
                          )}

                          {/* Action Button: Link vs Upload */}
                          <button
                            type="button"
                            onClick={() => handleAddEvidence(activeFindingIndex)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                              newFileCategory === 'Link Google Drive'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                            }`}
                          >
                            {newFileCategory === 'Link Google Drive' ? (
                              <>
                                <Link2 className="w-3.5 h-3.5" />
                                <span>Tautkan Link Drive</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Berkas</span>
                              </>
                            )}
                          </button>

                          {newFileCategory !== 'Link Google Drive' && (
                            <label className="px-3.5 py-2 bg-[#e8f1fb] hover:bg-slate-750 text-emerald-800 hover:text-[#1e3a5f] rounded-xl text-xs font-semibold border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                              <Upload className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Pilih File</span>
                              <input
                                type="file"
                                onChange={(e) => handleFileUploadSim(activeFindingIndex, e)}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAUTAN GOOGLE DRIVE / CLOUD STORAGE (Metode 2 untuk bukti dukung jumlah banyak) */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-500/30 rounded-2xl space-y-2.5">
                    <div className="flex items-start sm:items-center justify-between gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-extrabold text-xs sm:text-sm text-[#1e3a5f]">
                              Metode 2: Tautan Google Drive / Cloud Storage Bukti Dukung
                            </h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 border border-blue-500/40">
                              Alternatif Berkas Banyak / Arsip Besar
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed mt-0.5">
                            Jika sarana memiliki puluhan berkas (seperti logbook suhu berkala, rekaman video, atau arsip tebal), simpan semua berkas ke folder Google Drive sarana, lalu <span className="text-blue-700 font-semibold">tempelkan tautan/link share folder di bawah ini</span>. Petugas Balai POM dapat langsung membuka folder tersebut.
                          </p>
                        </div>
                      </div>
                      {currentFinding.capa.evidenceDriveUrl && (
                        <a
                          href={currentFinding.capa.evidenceDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer shrink-0"
                          title="Buka dan verifikasi tautan di tab baru"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Tautan Drive ↗</span>
                        </a>
                      )}
                    </div>

                    {!isReadOnlyForOfficer ? (
                      <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={currentFinding.capa.evidenceDriveUrl || ''}
                            onChange={(e) => handleEvidenceDriveUrlChange(activeFindingIndex, e.target.value)}
                            placeholder="Tempel tautan folder Google Drive (contoh: https://drive.google.com/drive/folders/...)"
                            className="w-full pl-9 pr-8 py-2.5 bg-[#f4f8fd] border border-blue-500/40 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl text-xs text-[#1e3a5f] placeholder-slate-500 font-mono transition-all"
                          />
                          <ExternalLink className="w-4 h-4 text-blue-400 absolute left-3 top-3" />
                          {currentFinding.capa.evidenceDriveUrl && (
                            <button
                              type="button"
                              onClick={() => handleEvidenceDriveUrlChange(activeFindingIndex, '')}
                              className="absolute right-2.5 top-2.5 text-slate-600 hover:text-rose-700 text-xs px-1"
                              title="Hapus tautan"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      currentFinding.capa.evidenceDriveUrl ? (
                        <div className="p-3 bg-[#f4f8fd] rounded-xl border border-blue-500/40 flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-blue-700 truncate">
                            {currentFinding.capa.evidenceDriveUrl}
                          </span>
                          <a
                            href={currentFinding.capa.evidenceDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Folder Drive</span>
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Sarana tidak menyematkan tautan folder Google Drive tambahan.
                        </p>
                      )
                    )}
                  </div>

                  {/* List of uploaded files */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentFinding.capa.evidenceFiles.map((file, fileIdx) => {
                      const isDriveItem = file.category === 'Link Google Drive' || Boolean(file.driveUrl) || (Boolean(file.url) && file.url!.startsWith('http'));
                      const linkHref = file.driveUrl || file.url;
                      return (
                        <div
                          key={`${file.id || 'ev'}-${fileIdx}`}
                          className={`p-3 rounded-xl flex items-center justify-between gap-2.5 text-xs border transition-all ${
                            isDriveItem
                              ? 'bg-blue-50 border-blue-500/40 hover:border-blue-400/60'
                              : 'bg-white border-blue-200/80 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isDriveItem ? (
                              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-[#1e3a5f] truncate block">
                                {file.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className={`text-[10px] ${isDriveItem ? 'text-blue-700 font-semibold' : 'text-slate-600'}`}>
                                  {file.category}
                                </span>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className="text-[10px] text-slate-600 font-mono">
                                  {file.size}
                                </span>
                                {linkHref && (
                                  <a
                                    href={linkHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-sky-700 hover:text-sky-800 underline font-semibold flex items-center gap-0.5 ml-1"
                                  >
                                    Buka Drive ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          {!isReadOnlyForOfficer && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEvidence(activeFindingIndex, file.id)}
                              className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-[#e8f1fb] transition-colors cursor-pointer shrink-0"
                              title="Hapus berkas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {currentFinding.capa.evidenceFiles.length === 0 && (
                      <div className="col-span-full py-6 text-center text-xs text-slate-500 bg-[#f4f8fd] rounded-2xl border border-dashed border-blue-200/80">
                        Belum ada berkas bukti dukung untuk butir ini. Tambahkan minimal 1 foto atau dokumen pendukung.
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom Navigation & Submission Section in GUIDED_FORM */}
                <div className="pt-6 border-t border-blue-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Paging between findings */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeFindingIndex === 0}
                      onClick={() => setActiveFindingIndex((prev) => Math.max(0, prev - 1))}
                      className="px-3.5 py-2 bg-white hover:bg-[#e8f1fb] disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold border border-blue-200/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Butir Sebelumnya</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeFindingIndex === findingsData.length - 1}
                      onClick={() => setActiveFindingIndex((prev) => Math.min(findingsData.length - 1, prev + 1))}
                      className="px-3.5 py-2 bg-white hover:bg-[#e8f1fb] disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold border border-blue-200/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span>Butir Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Submission and Save Draft Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {!isReadOnlyForOfficer && (
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-4 py-2.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Simpan Draf</span>
                      </button>
                    )}

                    {!isReadOnlyForOfficer && (
                      isAlreadySubmitted ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-500/50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                              {inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED'
                                ? 'CAPA Telah Tervalidasi Balai'
                                : 'CAPA Sudah Dikirim ke Balai (Menunggu Evaluasi)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting}
                            className="px-3.5 py-2.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl text-xs font-semibold border border-blue-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                            <span>Kirim Pembaruan Tambahan</span>
                          </button>
                        </div>
                      ) : isNeedsRevision ? (
                        <button
                          type="button"
                          onClick={handleFinalSubmit}
                          disabled={isSubmitting}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim Perbaikan CAPA ke Balai (Revisi)'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinalSubmit}
                          disabled={isSubmitting}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim CAPA ke Balai'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 3. VIEW MODE: OFFICIAL DOCUMENT PREVIEW (Format Cetak / PDF Lengkap) */}
            {viewMode === 'DOCUMENT_PREVIEW' && (
              <div className="bg-white text-slate-950 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-6xl mx-auto print:p-0 print:shadow-none">
                
                {/* Government Official Letterhead */}
                <div className="border-b-2 border-slate-950 pb-4 text-center space-y-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    BADAN PENGAWAS OBAT DAN MAKANAN REPUBLIK INDONESIA
                  </div>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                    BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    Jl. Sukun Raya No. 41A, Srondol Wetan, Banyumanik, Kota Semarang, Jawa Tengah 50263
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Sistem Terintegrasi Monitoring Kinerja dan Evaluasi CAPA (SIMONCER)
                  </p>
                </div>

                {/* Document Metadata Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-slate-700">Lampiran Matriks: </span>
                      <span className="font-bold text-slate-950">{matrixConfig.title}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Standar Acuan: </span>
                      <span className="font-mono">{matrixConfig.codeStandard}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Nomor Surat SRIKANDI (TTE): </span>
                      <span className="font-mono font-bold text-slate-950">{inspection.srikandiLetter.letterNo}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Kode Unik CAPA: </span>
                      <span className="font-mono font-extrabold text-slate-950 bg-slate-200 px-2 py-0.5 rounded">
                        {inspection.capaCode}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right sm:text-right">
                    <div>
                      <span className="font-bold text-slate-700">Nama Sarana: </span>
                      <span className="font-extrabold text-slate-950">{inspection.facility.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Jenis Sarana: </span>
                      <span>{inspection.facility.type}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Penanggung Jawab: </span>
                      <span>{inspection.facility.picName} ({inspection.facility.picPhone})</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Tanggal Pemeriksaan: </span>
                      <span>{formatIndonesianDate(inspection.inspectionDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Embedded Commodity Matrix Table for Print */}
                <div className="overflow-x-auto rounded-xl border border-slate-300">
                  <CommodityMatrixTable
                    inspection={{
                      ...inspection,
                      findings: findingsData,
                    }}
                    showSignatures={false}
                    showTopBar={false}
                    showHeaderMeta={false}
                  />
                </div>

                {/* Official Signatures Block */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center border-t border-slate-300">
                  <div className="space-y-16">
                    <div>
                      <p className="text-slate-600">Pimpinan / Penanggung Jawab Sarana,</p>
                      <p className="font-bold text-slate-900 mt-1">{inspection.facility.name}</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{inspection.facility.picName}</p>
                      <p className="text-[10px] text-slate-600">Apoteker / Penanggung Jawab Teknis</p>
                    </div>
                  </div>

                  <div className="space-y-16">
                    <div>
                      <p className="text-slate-600">Semarang, {formatIndonesianDate(new Date().toISOString().split('T')[0])}</p>
                      <p className="font-bold text-slate-900 mt-1">Petugas Evaluator BBPOM di Semarang,</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">
                        {inspection.assignedOfficer?.name || inspection.leadAuditor}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        NIP. {inspection.assignedOfficer?.nip || '19840512 200801 1 003'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Document Controls */}
                <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap print:hidden">
                  <span className="text-xs text-slate-500">
                    Dokumen ini digenerate secara otomatis oleh SIMONCER BBPOM Semarang.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Sekarang</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPdfAttachment}
                      disabled={isDownloadingMatrix}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh PDF Matriks</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Modal Sukses Pengiriman CAPA & WhatsApp Dispatch Info */}
      {showSubmissionSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="bpom-hero-gradient p-6 border-b border-emerald-500/20 text-center relative">
              <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 text-emerald-700" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 mb-2">
                <Check className="w-3.5 h-3.5" />
                Status Sesi: EVALUASI_PETUGAS
              </span>
              <h3 className="text-xl font-black text-[#1e3a5f]">Laporan CAPA Berhasil Terkirim ke Balai!</h3>
              <p className="text-xs text-slate-700 mt-1 max-w-md mx-auto">
                Berkas tindak lanjut perbaikan matriks komoditi <strong className="text-emerald-800">{inspection.facility.name}</strong> telah tersimpan dalam sistem dan diserahkan ke evaluator BBPOM di Semarang.
              </p>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-sm">
              {/* Summary card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f4f8fd] border border-blue-200/80 rounded-xl p-3.5">
                <div>
                  <span className="text-[11px] text-slate-600 block font-medium">Kode CAPA</span>
                  <span className="text-xs font-mono font-bold text-[#1e3a5f]">{inspection.capaCode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block font-medium">Total Temuan</span>
                  <span className="text-xs font-bold text-[#1e3a5f]">{findingsData.length} Butir</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block font-medium">Berkas Bukti</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {findingsData.reduce((acc, f) => acc + (f.capa?.evidenceFiles?.length || 0), 0)} Berkas Terunggah
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block font-medium">Evaluator</span>
                  <span className="text-xs font-bold text-sky-800 truncate block">
                    {inspection.assignedOfficer?.name || inspection.leadAuditor}
                  </span>
                </div>
              </div>

              {/* WhatsApp Gateway Dispatch Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Notifikasi Otomatis WhatsApp Gateway
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowWaPreviewInModal(!showWaPreviewInModal)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline flex items-center gap-1"
                  >
                    {showWaPreviewInModal ? 'Sembunyikan Draf Pesan' : 'Lihat Draf Pesan Terkirim'}
                  </button>
                </div>

                {/* 1. Ke Sarana */}
                <div className="bg-[#f4f8fd] border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#1e3a5f]">Notifikasi Tanda Terima ke Sarana</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-700/50">
                        ✓ Terkirim ke WhatsApp PIC
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Penerima: <span className="text-[#1e3a5f] font-medium">{inspection.facility.picPhone}</span> ({inspection.facility.picName})
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Pesan tanda terima resmi penyerahan CAPA dan nomor tiket konfirmasi telah dikirimkan ke WhatsApp PIC sarana.
                    </p>
                    {showWaPreviewInModal && (
                      <div className="mt-2.5 p-2.5 bg-white border border-blue-200/80 rounded-lg text-[11px] font-mono text-slate-700 whitespace-pre-line">
                        {`*PEMBERITAHUAN RESMI: LAPORAN CAPA TELAH DIKIRIMKAN*\n\nYth. Manajemen ${inspection.facility.name},\nLaporan CAPA (${inspection.capaCode}) format ${matrixConfig.title} telah *BERHASIL DIKIRIMKAN* ke Balai BBPOM di Semarang.\nStatus: EVALUASI_PETUGAS\nEvaluator: ${inspection.assignedOfficer?.name || inspection.leadAuditor}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Ke Petugas Evaluator */}
                <div className="bg-[#f4f8fd] border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#1e3a5f]">Notifikasi Berkas Masuk ke Petugas Evaluator</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-cyan-700/50">
                        ✓ Berkas Siap Ditelaah
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Penerima: <span className="text-[#1e3a5f] font-medium">{inspection.assignedOfficer?.phone || '+62 812-7788-9911'}</span> ({inspection.assignedOfficer?.name || inspection.leadAuditor})
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Petugas evaluator telah menerima pemberitahuan bahwa berkas CAPA telah lengkap dan siap ditelaah di portal SIMONCER.
                    </p>
                    {showWaPreviewInModal && (
                      <div className="mt-2.5 p-2.5 bg-white border border-blue-200/80 rounded-lg text-[11px] font-mono text-slate-700 whitespace-pre-line">
                        {`*NOTIFIKASI DOKUMEN: BERKAS CAPA TELAH DITERIMA*\n\nYth. Petugas Evaluator ${inspection.assignedOfficer?.name || inspection.leadAuditor},\nSarana ${inspection.facility.name} telah mengirimkan berkas CAPA (${inspection.capaCode}). Berkas telah diterima dan siap untuk dilakukan telaah & evaluasi.`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-[#f4f8fd] border-t border-blue-200/80 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPdfAttachment}
                disabled={isDownloadingMatrix}
                className="px-3.5 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl text-xs font-semibold border border-blue-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-sky-700" />
                <span>Unduh PDF Matriks</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmissionSuccessModal(false)}
                  className="px-3.5 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Tetap di Halaman Ini
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Selesai & Ke Beranda</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE BOTTOM ACTION BAR FOR CAPA MATRIX (HP < sm) */}
      {(surveyData?.completed || activeStep === 'CAPA') && (
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden glass-bottom-nav border-t border-blue-200/80 px-3 py-2 flex items-center justify-between gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] print:hidden">
          {!isReadOnlyForOfficer && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-2.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-emerald-700" />
              <span>Simpan</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdfAttachment}
            disabled={isDownloadingMatrix}
            className="px-3 py-2.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-sky-700" />
            <span>PDF</span>
          </button>

          {!isReadOnlyForOfficer && (
            isAlreadySubmitted ? (
              <button
                type="button"
                onClick={() => setShowSubmissionSuccessModal(true)}
                className="flex-1 px-3 py-2.5 bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">Terkirim (Bukti)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isSubmitting ? 'Mengirim...' : 'Kirim CAPA ke Balai'}</span>
              </button>
            )
          )}
        </div>
      )}

    </div>
  );
};
