import React, { useState, useEffect } from 'react';
import { InspectionSession, FindingItem, EvidenceFile, SibergasSurveyData, UserRole } from '../types';
import { 
  X, 
  ArrowLeft,
  Send, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileCheck,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  MessageSquare,
  Table,
  Info,
  ChevronRight,
  Award,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Link2,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendCapaSubmittedNotification } from '../utils/whatsappGateway';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';
import { createAutomaticNotifications } from '../utils/notificationService';
import { CommodityMatrixTable } from './CommodityMatrixTable';
import { SibergasSurveyForm } from './SibergasSurveyForm';

interface SubmitCapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  onSubmit: (updatedInspection: InspectionSession) => void;
  currentRole?: UserRole;
}

export const SubmitCapaModal: React.FC<SubmitCapaModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onSubmit,
  currentRole = 'SARANA',
}) => {
  const isSarana = currentRole === 'SARANA';
  const isReadOnlyForOfficer = !isSarana;

  const isAlreadySubmitted =
    inspection.status === 'CAPA_TERKIRIM' ||
    inspection.status === 'MASIH_EVALUASI' ||
    inspection.status === 'TERVALIDASI' ||
    inspection.status === 'SELESAI_CLOSED';

  const isNeedsRevision = inspection.status === 'PERLU_PERBAIKAN';

  const [activeStep, setActiveStep] = useState<'SURVEY' | 'CAPA'>(
    inspection.sibergasSurvey?.completed ? 'CAPA' : 'SURVEY'
  );
  const [surveyData, setSurveyData] = useState<SibergasSurveyData | undefined>(
    inspection.sibergasSurvey
  );

  // If survey is already completed, guarantee activeStep stays 'CAPA' so survey tabs never display
  useEffect(() => {
    if (surveyData?.completed && activeStep === 'SURVEY') {
      setActiveStep('CAPA');
    }
  }, [surveyData?.completed, activeStep]);
  const [showSurveyRequiredWarning, setShowSurveyRequiredWarning] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [viewMode, setViewMode] = useState<'FORM' | 'MATRIX'>('FORM');
  const [activeFindingIndex, setActiveFindingIndex] = useState(0);
  const [findingsData, setFindingsData] = useState<FindingItem[]>(
    JSON.parse(JSON.stringify(inspection.findings))
  );

  const [newFileCategory, setNewFileCategory] = useState<EvidenceFile['category']>('Foto Bukti');
  const [newFileName, setNewFileName] = useState('');
  const [showGdriveHelpPopover, setShowGdriveHelpPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const matrixConfig = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  const currentFinding = findingsData[activeFindingIndex];

  const handleFieldChange = (field: keyof FindingItem['capa'], value: any) => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) => {
      const copy = [...prev];
      copy[activeFindingIndex] = {
        ...copy[activeFindingIndex],
        capa: {
          ...copy[activeFindingIndex].capa,
          [field]: value,
        },
      };
      return copy;
    });
  };

  // Add uploaded file evidence (Pure Immutable & Deduplicated)
  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyForOfficer) return;
    const trimmedName = newFileName.trim();
    if (!trimmedName) return;

    const isDriveLink = newFileCategory === 'Link Google Drive' || trimmedName.startsWith('http://') || trimmedName.startsWith('https://');
    const driveUrl = isDriveLink ? trimmedName : undefined;
    const displayName = isDriveLink 
      ? (trimmedName.includes('drive.google') ? 'Folder Google Drive Bukti Terpusat' : 'Tautan Repositori Cloud Bukti Dukung')
      : trimmedName;

    const newEvidence: EvidenceFile = {
      id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${activeFindingIndex}`,
      name: displayName,
      size: isDriveLink ? 'Cloud Link' : `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      type: isDriveLink ? 'cloud/drive' : (trimmedName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      url: driveUrl,
      driveUrl: driveUrl,
      uploadedAt: new Date().toISOString(),
      category: newFileCategory,
    };

    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== activeFindingIndex) return item;
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
  };

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnlyForOfficer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const fileType = file.type || 'application/octet-stream';
    e.target.value = '';

    const newEvidence: EvidenceFile = {
      id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${activeFindingIndex}`,
      name: fileName,
      size: fileSize,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      category: newFileCategory,
    };

    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== activeFindingIndex) return item;
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
  };

  const handleRemoveEvidence = (fileId: string) => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== activeFindingIndex) return item;
        return {
          ...item,
          capa: {
            ...item.capa,
            evidenceFiles: item.capa.evidenceFiles.filter((f) => f.id !== fileId),
          },
        };
      })
    );
  };

  // Apply Quick Template for easy demonstration (Immutable & Deduplicated)
  const handleApplyPreset = () => {
    if (isReadOnlyForOfficer) return;
    setFindingsData((prev) =>
      prev.map((item, idx) => {
        if (idx !== activeFindingIndex) return item;
        const f = { ...item, capa: { ...item.capa } };

        // Set common fields
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
          `DOC-CAPA-${new Date().getFullYear()}/${String(activeFindingIndex + 1).padStart(3, '0')}`;

        // Populate impact for Form 8 Pelayanan Kefarmasian
        if (matrixConfig.id === 'PELAYANAN_KEFARMASIAN') {
          f.capa.impact =
            f.capa.impact ||
            'Berpotensi menimbulkan risiko penurunan mutu sediaan farmasi, ketidaktertelusuran mutasi stok sediaan khusus (NPP), atau risiko keselamatan pasien saat dispensing.';
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
  };

  const handleFinalSubmit = () => {
    // Ensure SIBERGAS survey is completed before allowing final submission
    if (!surveyData || !surveyData.completed) {
      setShowSurveyRequiredWarning(true);
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

    // 1. Automatic receipt notification to Sarana
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

    // 2. Notification to Petugas Evaluator PIC
    const officerWaNotif = {
      id: `NOTIF-${Date.now()}-OFFICER`,
      channel: 'WHATSAPP' as const,
      recipient: `${officerPhone} (${officerName})`,
      subject: `[SIMONCER] Sarana Telah Mengirimkan Berkas CAPA - ${inspection.facility.name}`,
      content: `*PEMBERITAHUAN MASUK DOKUMEN CAPA*\n\nYth. Petugas Evaluator ${officerName},\n\nSarana ${inspection.facility.name} telah menyerahkan dokumen perbaikan CAPA (${inspection.capaCode}) dengan ${totalEvidenceCount} berkas bukti.\n\nSilakan buka portal SIMONCER untuk melakukan telaah dan validasi.`,
      sentAt: nowStr,
      status: 'DELIVERED' as const,
      triggerEvent: 'CAPA_DITERIMA' as const,
    };

    const newAuditLog = {
      id: `LOG-${Date.now()}`,
      action: `Sarana Mengirimkan Laporan CAPA Matriks ${matrixConfig.facilityTypeLabel}`,
      actor: inspection.facility.picName,
      role: 'Sarana' as const,
      timestamp: nowStr,
      details: `Formulir CAPA matriks standar ${matrixConfig.codeStandard} diserahkan dengan ${totalEvidenceCount} berkas bukti perbaikan. Status otomatis berganti dari MENUNGGU_CAPA menjadi EVALUASI_PETUGAS (Menunggu Telaah & Verifikasi Petugas ${officerName}). Notifikasi WhatsApp Gateway otomatis terkirim.`,
      badgeType: 'info' as const,
    };

    const surveyAuditLog = !inspection.sibergasSurvey?.completed && surveyData?.completed ? [{
      id: `LOG-${Date.now()}-SURVEY`,
      action: 'Sarana Menyelesaikan Survei Integritas Petugas (SIBERGAS)',
      actor: inspection.facility.picName,
      role: 'Sarana' as const,
      timestamp: surveyData.submittedAt || nowStr,
      details: `Survei integritas petugas SIBERGAS telah diisi oleh sarana sebagai prasyarat pengiriman CAPA. Penilaian dicatat untuk kepatuhan Zona Integritas (WBK/WBBM).`,
      badgeType: 'success' as const,
    }] : [];

    // Dual-channel automated notifications based on user preferences
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
      auditTrail: [...surveyAuditLog, newAuditLog, ...inspection.auditTrail],
      updatedAt: nowStr,
    };

    // Trigger Real WhatsApp Gateway (Fonnte) in Background
    sendCapaSubmittedNotification(updatedInspection, totalEvidenceCount).catch((err) => {
      console.error('Error sending WhatsApp notification via gateway:', err);
    });

    setTimeout(() => {
      setIsSubmitting(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log(err);
      }
      onSubmit(updatedInspection);
      onClose();
    }, 600);
  };

  const isPBFOrGudang = matrixConfig.id === 'PBF_CDOB' || matrixConfig.id === 'GUDANG_FARMASI';
  const isCPOBCPOTB = matrixConfig.id === 'CPOB_CPOTB';
  const isKosmetikA = matrixConfig.id === 'KOSMETIK_A';
  const isKosmetikaPelaporan = matrixConfig.id === 'KOSMETIKA';
  const isPanganAtauDistribusi = matrixConfig.id === 'PANGAN_PRODUKSI' || matrixConfig.id === 'DISTRIBUSI';
  const isPelayananKefarmasian = matrixConfig.id === 'PELAYANAN_KEFARMASIAN';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Header */}
        <div className="bpom-hero-gradient text-[#1e3a5f] px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-blue-200/80 shrink-0">
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
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#1e3a5f]">
                  Formulir Tindak Lanjut CAPA
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-500/50 font-bold">
                  {inspection.capaCode}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f1fb] text-slate-700 border border-blue-200">
                  {matrixConfig.codeStandard}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                {inspection.facility.name} • {matrixConfig.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStep === 'CAPA' && (
              <div className="bg-[#e8f1fb] p-1 rounded-xl flex items-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('FORM')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'FORM' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-[#1e3a5f]'
                  }`}
                >
                  Form Terpandu
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('MATRIX')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'MATRIX' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-[#1e3a5f]'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Matriks PDF</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup Halaman (Kembali ke Beranda)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="bg-white border-b border-blue-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
          {!surveyData?.completed ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold bg-amber-50 text-amber-800 border border-amber-500/40">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                  1
                </div>
                <span>1. Survei Integritas SIBERGAS</span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-800 font-bold">
                  Wajib Diisi
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold bg-[#e8f1fb] text-slate-500 border border-blue-200 opacity-75">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-[#1e3a5f] flex items-center justify-center text-[11px] font-bold">
                  2
                </div>
                <span>2. Tindak Lanjut CAPA & Bukti (Terkunci)</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="font-bold text-[#1e3a5f]">Formulir Tindak Lanjut CAPA & Bukti Dukung</span>
              <span className="text-slate-500">•</span>
              <span className="text-[11px] text-emerald-700 font-semibold">SIBERGAS Terverifikasi</span>
            </div>
          )}

          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Zona Integritas WBK / WBBM</span>
          </div>
        </div>

        {/* Officer Read-Only Security Banner */}
        {isReadOnlyForOfficer && (
          <div className="bg-amber-50 text-amber-800 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Mode Pratinjau Pengawas (Hanya Baca):</strong> Anda sedang mengakses sebagai <strong>{currentRole}</strong>. Formulir CAPA dan berkas bukti di bawah ini adalah milik Sarana ({inspection.facility.name}) dan terproteksi dari perubahan oleh petugas.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900 border border-amber-600/50 text-amber-800 shrink-0 font-bold">
              TERPROTEKSI
            </span>
          </div>
        )}

        {/* STEP 1: SIBERGAS SURVEY */}
        {activeStep === 'SURVEY' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
            {showSurveyRequiredWarning && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Perhatian Pelaku Usaha:</strong>
                  <span>
                    Untuk menjaga integritas dan transparansi layanan pengawasan Balai POM, Anda wajib menyelesaikan Survei Kepuasan & Integritas Petugas (SIBERGAS) terlebih dahulu sebelum dapat mengirimkan laporan CAPA.
                  </span>
                </div>
              </div>
            )}

            <SibergasSurveyForm
              inspection={inspection}
              initialData={surveyData}
              readOnly={isReadOnlyForOfficer || surveyData?.completed}
              onComplete={(data) => {
                if (isReadOnlyForOfficer) {
                  setActiveStep('CAPA');
                  return;
                }
                setSurveyData(data);
                setShowSurveyRequiredWarning(false);
                setActiveStep('CAPA');
              }}
              onCancel={onClose}
              submitButtonLabel={isReadOnlyForOfficer ? 'Lanjut ke Pratinjau CAPA →' : 'Simpan Jawaban & Lanjut ke Form CAPA →'}
            />
          </div>
        ) : (
          /* STEP 2: CAPA FORM (Guided Form or Matrix) */
          <>
            {/* View Mode: Matrix Table View */}
            {viewMode === 'MATRIX' ? (
              <div className="p-5 overflow-y-auto flex-1 bg-slate-100">
                {surveyData?.completed && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Survei Integritas SIBERGAS Telah Selesai Diisi.</strong> Data penilaian Anda aman dan tersimpan.
                    </span>
                  </div>
                )}
                <CommodityMatrixTable
                  inspection={{
                    ...inspection,
                    findings: findingsData,
                  }}
                  onEditFinding={(_, idx) => {
                    setActiveFindingIndex(idx);
                    setViewMode('FORM');
                  }}
                />
              </div>
            ) : (
              /* View Mode: Guided Form */
              <>
                {/* Findings Tab Bar */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Pilih Butir Temuan:</span>
                <div className="flex items-center gap-1.5">
                  {findingsData.map((f, idx) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFindingIndex(idx)}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeFindingIndex === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <span>Butir #{idx + 1}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          f.category === 'KRITIS'
                            ? 'bg-red-200 text-red-900'
                            : f.category === 'MAYOR'
                            ? 'bg-orange-200 text-orange-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {f.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {!isReadOnlyForOfficer && (
                <button
                  type="button"
                  onClick={handleApplyPreset}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#1e3a5f] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Isi contoh draf standar sesuai format komoditi ini"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gunakan Draf Standar ({matrixConfig.id})</span>
                </button>
              )}
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 bg-slate-50/50">
              
              {/* Verified Survey Banner */}
              {surveyData?.completed && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <span>Survei Integritas SIBERGAS Telah Selesai Diisi</span>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                        Terverifikasi
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Survei kepuasan & integritas petugas pemeriksa telah tersimpan untuk sesi CAPA ini.
                    </p>
                  </div>
                </div>
              )}

              {/* Finding Summary Box */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Temuan #{activeFindingIndex + 1}: {currentFinding.clause}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                    {currentFinding.id}
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
                  {currentFinding.description}
                </p>
                {currentFinding.initialEvidenceDescription && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    Catatan Pemeriksa Lapangan: {currentFinding.initialEvidenceDescription}
                  </p>
                )}
              </div>

              {/* COMMODITY SPECIFIC FIELDS */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Kolom Matriks Standar: {matrixConfig.title}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {matrixConfig.codeStandard}
                  </span>
                </div>

                {/* 1. Persyaratan (If applicable) */}
                {(isPBFOrGudang || isCPOBCPOTB || isKosmetikA || isKosmetikaPelaporan || isPelayananKefarmasian) && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Persyaratan ({isPelayananKefarmasian ? 'Peraturan Perundang-undangan / Pedoman yang Dilanggar' : isPBFOrGudang ? 'CDOB & Protap Perusahaan' : isKosmetikA || isKosmetikaPelaporan ? 'CPKB / Peraturan' : 'Pedoman CPOTB/CPOB'}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.requirement || currentFinding.clause}
                      onChange={(e) => handleFieldChange('requirement', e.target.value)}
                      placeholder={isPelayananKefarmasian ? 'Contoh: Permenkes No. 73/2016 Standar Pelayanan Farmasi / Permenkes No. 3/2015 Tata Kelola NPP' : 'Contoh: CDOB 2024 Bab 9 Butir 9.4 - Pemantauan Suhu / SOP Mutu Perusahaan'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* 2. Kondisi Saat Ini (Specific for CPOB / CPOTB) */}
                {isCPOBCPOTB && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Kondisi Saat Ini di Sarana <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.currentCondition || currentFinding.description}
                      onChange={(e) => handleFieldChange('currentCondition', e.target.value)}
                      placeholder="Jelaskan kondisi faktual yang diamati..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* 3. Root Cause Analysis / GAP Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Root Cause Analysis (Akar Masalah / 5-Why) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.rootCauseAnalysis}
                      onChange={(e) => handleFieldChange('rootCauseAnalysis', e.target.value)}
                      placeholder="Akar penyebab dari ketidaksesuaian yang terjadi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      GAP Analysis (Analisis Kesenjangan Standar vs Kondisi) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.gapAnalysis || ''}
                      onChange={(e) => handleFieldChange('gapAnalysis', e.target.value)}
                      placeholder="Analisis kesenjangan antara persyaratan regulasi dengan kondisi riil fasilitas..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* 3b. Dampak (Khusus Form 8 Pelayanan Kefarmasian - Apotek / RS / Klinik) */}
                {isPelayananKefarmasian && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                    <label className="block text-[11px] font-bold text-amber-950 mb-0.5 flex items-center justify-between">
                      <span>Dampak (Akibat yang ditimbulkan apabila tidak sesuai dengan persyaratan) <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-200/60 px-1.5 py-0.2 rounded">Kolom Wajib Form 8 BPOM</span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.impact || ''}
                      onChange={(e) => handleFieldChange('impact', e.target.value)}
                      placeholder="Jelaskan risiko atau akibat yang mungkin terjadi, misal: potensi penurunan mutu sediaan obat, ketidaktertelusuran mutasi stok narkotika, atau risiko kesalahan dispensing..."
                      className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-500 rounded-lg text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* 4. Tindakan Perbaikan (CA) dan Tindakan Pencegahan (PA) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Tindakan Perbaikan (Corrective Action - CA) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.correctiveAction}
                      onChange={(e) => handleFieldChange('correctiveAction', e.target.value)}
                      placeholder="Langkah-langkah tindakan perbaikan langsung..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Tindakan Pencegahan (Preventive Action - PA) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.preventiveAction}
                      onChange={(e) => handleFieldChange('preventiveAction', e.target.value)}
                      placeholder="Tindakan pencegahan agar temuan tidak terulang kembali..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* 5. Parameter Waktu, Status, PIC, dan No. Dokumen Bukti */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Batas Waktu Penyelesaian <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.targetCompletionDate}
                      onChange={(e) => handleFieldChange('targetCompletionDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Status Penyelesaian
                    </label>
                    <select
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.progressStatus || 'Sudah Selesai'}
                      onChange={(e) => handleFieldChange('progressStatus', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 font-bold disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    >
                      <option value="Sudah Selesai">Sudah Selesai</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Penanggung Jawab (PIC)
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.pic}
                      onChange={(e) => handleFieldChange('pic', e.target.value)}
                      placeholder="Nama Apoteker / Manajer QA"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      No. Bukti / Pengendalian Perubahan
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlyForOfficer}
                      value={currentFinding.capa.evidenceDocNumber || ''}
                      onChange={(e) => handleFieldChange('evidenceDocNumber', e.target.value)}
                      placeholder="Contoh: SOP/QA-024 / CC-2026-08"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* 6. UPLOAD BUKTI DUKUNG DOKUMEN */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Lampiran Berkas Bukti Dukung (Evidence Files)</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {currentFinding.capa.evidenceFiles.length} Berkas Terunggah
                  </span>
                </div>

                {isReadOnlyForOfficer ? (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mode Pratinjau Pengawas: Hanya pihak Sarana yang berhak mengunggah atau menghapus berkas bukti perbaikan.</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Kategori Bukti
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowGdriveHelpPopover((prev) => !prev)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                              title="Bantuan: Penjelasan Repositori Google Drive"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Bantuan</span>
                            </button>

                            {/* Popover Bantuan Google Drive */}
                            {showGdriveHelpPopover && (
                              <div className="absolute z-50 left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-72 sm:w-80 p-3.5 bg-white border border-blue-500/60 rounded-2xl shadow-2xl text-xs text-[#1e3a5f] animate-in fade-in">
                                <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                                  <span className="font-bold text-[#1e3a5f] text-xs flex items-center gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                                    Repositori Dokumen Google Drive
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowGdriveHelpPopover(false)}
                                    className="text-slate-600 hover:text-[#1e3a5f]"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <p className="py-2 text-[11px] text-slate-700 leading-relaxed">
                                  Tautan ini adalah <strong className="text-[#1e3a5f]">repository dokumen pendukung</strong> (seperti file surat dinas, foto fisik, atau laporan teknis) yang tersimpan secara terpusat untuk memudahkan evaluasi oleh petugas Balai POM.
                                </p>
                                <div className="p-2 bg-blue-50 border border-blue-500/30 rounded-lg text-[10px] text-blue-800">
                                  💡 Pastikan hak akses link Google Drive disetel ke: <strong>"Anyone with the link (Viewer)"</strong>.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <select
                          value={newFileCategory}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setNewFileCategory(val);
                            if (val === 'Link Google Drive') {
                              setShowGdriveHelpPopover(true);
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
                            newFileCategory === 'Link Google Drive'
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                              : 'bg-slate-50 border-slate-300'
                          }`}
                        >
                          <option value="Foto Bukti">Foto Bukti Fisik</option>
                          <option value="SOP Terkoreksi">SOP Terkoreksi & TTE</option>
                          <option value="Sertifikat Kalibrasi">Sertifikat Kalibrasi</option>
                          <option value="Laporan Pelatihan">Laporan Pelatihan</option>
                          <option value="Berita Acara">Berita Acara / Logbook</option>
                          <option value="Link Google Drive">Link Google Drive (Repositori Cloud)</option>
                          <option value="Lainnya">Dokumen Lainnya</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {newFileCategory === 'Link Google Drive' ? 'Tautan Folder / File Google Drive' : 'Nama Berkas / Dokumen Bukti'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={newFileCategory === 'Link Google Drive' ? 'url' : 'text'}
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            placeholder={newFileCategory === 'Link Google Drive' ? 'https://drive.google.com/drive/folders/...' : 'Contoh: Sertifikat_Kalibrasi_DataLogger.pdf'}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs border ${
                              newFileCategory === 'Link Google Drive'
                                ? 'bg-blue-50 border-blue-400 font-mono text-blue-900'
                                : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleAddEvidence}
                            className={`px-4 py-2 text-white rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              newFileCategory === 'Link Google Drive'
                                ? 'bg-blue-600 hover:bg-blue-500'
                                : 'bg-white hover:bg-[#e8f1fb]'
                            }`}
                          >
                            {newFileCategory === 'Link Google Drive' ? '+ Tautkan' : '+ Tambah'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Upload File Input */}
                    <div className="p-3 bg-emerald-50/50 border border-dashed border-emerald-300 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px] text-slate-700">Unggah berkas langsung dari perangkat Anda:</span>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUploadSim}
                        className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                    </div>

                    {/* Tautan Google Drive / Cloud Storage untuk bukti dukung jumlah banyak */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                      <div className="flex items-start sm:items-center justify-between gap-2.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-blue-950">
                                Tautan Google Drive / Cloud Storage Bukti Dukung
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                Sarana Bukti Banyak
                              </span>
                            </div>
                            <p className="text-[11px] text-blue-800">
                              Simpan seluruh berkas/foto dalam folder Google Drive & tempelkan tautan folder di sini.
                            </p>
                          </div>
                        </div>

                        {currentFinding.capa.evidenceDriveUrl && (
                          <a
                            href={currentFinding.capa.evidenceDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                            title="Buka tautan folder Google Drive di tab baru"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Drive ↗</span>
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                            <Link2 className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="url"
                            disabled={isReadOnlyForOfficer}
                            value={currentFinding.capa.evidenceDriveUrl || ''}
                            onChange={(e) => handleFieldChange('evidenceDriveUrl', e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/... atau https://dropbox.com/..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-blue-300 focus:border-blue-500 rounded-xl text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 font-mono"
                          />
                        </div>
                        {currentFinding.capa.evidenceDriveUrl && !isReadOnlyForOfficer && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('evidenceDriveUrl', '')}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Hapus Link
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Evidence List */}
                {currentFinding.capa.evidenceFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {currentFinding.capa.evidenceFiles.map((file, fileIdx) => (
                      <div
                        key={`${file.id || 'ev'}-${fileIdx}`}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">📄</span>
                          <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({file.size})</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-bold">
                            {file.category}
                          </span>
                        </div>
                        {!isReadOnlyForOfficer && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(file.id)}
                            className="p-1 text-slate-600 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Petunjuk Pengisian dari PDF */}
              <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-2xl text-[11px] space-y-1.5 text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Petunjuk Pengisian Matriks Komoditi ({matrixConfig.title}):</span>
                </div>
                {matrixConfig.notes.slice(0, 4).map((n, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {n}
                  </p>
                ))}
              </div>

            </div>
          </>
        )}
      </>
    )}

        {/* Footer */}
        {activeStep === 'CAPA' && (
          <div className="p-4 bg-white border-t border-blue-200/80 flex items-center justify-between text-xs text-[#1e3a5f] shrink-0">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">
                Notifikasi otomatis WhatsApp Gateway Fonnte akan dikirimkan ke Petugas Evaluator PIC ({inspection.assignedOfficer?.name || inspection.leadAuditor})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>

              {isReadOnlyForOfficer ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer border border-blue-200"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Tutup Pratinjau (Terkunci untuk Petugas)</span>
                </button>
              ) : isAlreadySubmitted ? (
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
                    className="px-3.5 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl text-xs font-semibold border border-blue-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
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
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim Perbaikan CAPA (Revisi)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mengirimkan CAPA...' : 'Kirim Laporan CAPA Sekarang'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
