import React, { useState, useMemo, useEffect } from 'react';
import { InspectionSession, EvaluationReport, InspectionStatus, CapaItemEvaluation, UserRole } from '../types';
import { 
  X, 
  ArrowLeft,
  FileCheck2, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  Sparkles,
  Building2,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Maximize2,
  Minimize2,
  AlertCircle,
  Activity,
  Check,
  Info,
  ExternalLink,
  Download,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendCapaEvaluatedNotification } from '../utils/whatsappGateway';
import { createAutomaticNotifications } from '../utils/notificationService';
import { generateCapaEvaluationReportPDF } from '../utils/pdfReportGenerator';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  onSubmitEvaluation: (updatedInspection: InspectionSession) => void;
  onOpenSrikandiWorkflow?: (inspection: InspectionSession) => void;
  currentRole?: UserRole;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onSubmitEvaluation,
  onOpenSrikandiWorkflow,
  currentRole = 'PETUGAS_EVALUATOR',
}) => {
  const [evaluatorName, setEvaluatorName] = useState(
    inspection.assignedOfficer?.name || inspection.leadAuditor || 'apt. Bambang Wicaksono, M.Biomed'
  );
  const [evaluatorNip, setEvaluatorNip] = useState(
    inspection.assignedOfficer?.nip || '198004122005011002'
  );
  const [reportNo, setReportNo] = useState(
    inspection.evaluationReport?.reportNo ||
      `BA-EVAL/CAPA/2026/${Math.floor(1000 + Math.random() * 9000)}`
  );

  const [conclusion, setConclusion] = useState(
    'Berdasarkan hasil telaah bukti dukung dan dokumen tindakan perbaikan, seluruh butir temuan telah dinyatakan CLOSE (Memadai).'
  );
  const [notes, setNotes] = useState(
    'Seluruh tindakan perbaikan telah terverifikasi secara administratif dan teknis.'
  );
  const [docName, setDocName] = useState(
    `Berita_Acara_Evaluasi_CAPA_${inspection.capaCode}.pdf`
  );

  // Status for each finding: 'MEMADAI' represents Close, 'REVISI' represents Open
  const [itemStatuses, setItemStatuses] = useState<Record<string, CapaItemEvaluation>>(() => {
    const map: Record<string, CapaItemEvaluation> = {};
    inspection.findings.forEach((f) => {
      // If already REVISI or BELUM_MEMADAI, keep as REVISI (Open). Otherwise default to MEMADAI (Close).
      const current = f.capa?.evaluationStatus;
      map[f.id] = (current === 'REVISI' || current === 'BELUM_MEMADAI') ? 'REVISI' : 'MEMADAI';
    });
    return map;
  });

  const [itemNotes, setItemNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    inspection.findings.forEach((f) => {
      map[f.id] = f.capa?.evaluatorNotes || 'Tindakan perbaikan dan bukti dukung dinilai memadai.';
    });
    return map;
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // ==========================================
  // AUTOMATIC IDENTIFICATION OF SESSION STATUS
  // ==========================================
  // Evaluator doesn't manually pick session status; it is automatically derived from Open vs Close findings
  const statusSummary = useMemo(() => {
    let closeCount = 0;
    let openCount = 0;

    inspection.findings.forEach((f) => {
      const status = itemStatuses[f.id] || 'MEMADAI';
      if (status === 'MEMADAI') {
        closeCount++;
      } else {
        openCount++;
      }
    });

    const total = inspection.findings.length;
    // If all findings are Close -> Sesi SELESAI_CLOSED (Tervalidasi / Closed Audit)
    // If any finding is Open -> Sesi PERLU_PERBAIKAN (Menunggu revisi bukti sarana)
    const inferredSessionStatus: 'SELESAI_CLOSED' | 'PERLU_PERBAIKAN' = 
      openCount > 0 ? 'PERLU_PERBAIKAN' : 'SELESAI_CLOSED';

    return {
      closeCount,
      openCount,
      total,
      inferredSessionStatus,
      isAllClosed: openCount === 0,
    };
  }, [inspection.findings, itemStatuses]);

  const targetStatus = statusSummary.inferredSessionStatus;

  // Auto-update conclusion and notes when the evaluation changes
  useEffect(() => {
    if (statusSummary.isAllClosed) {
      setConclusion(
        `Berdasarkan hasil telaah bukti dukung dan dokumen tindakan perbaikan, seluruh ${statusSummary.total} butir temuan telah dinyatakan CLOSE (Memadai). Sesi pemeriksaan resmi dinyatakan selesai dan memenuhi seluruh ketentuan standar regulasi.`
      );
      setNotes('Seluruh butir temuan telah ditutup (Close). Berita Acara Penyelesaian CAPA diterbitkan.');
    } else {
      setConclusion(
        `Terdapat ${statusSummary.openCount} butir temuan yang masih berstatus OPEN (Perlu Revisi / Belum Memadai). Pihak sarana diminta untuk segera melengkapi bukti perbaikan dan revisi SOP sesuai catatan evaluator.`
      );
      setNotes(`Terdapat ${statusSummary.openCount} butir temuan Open yang membutuhkan perbaikan bukti dukung dari sarana.`);
    }
  }, [statusSummary.isAllClosed, statusSummary.openCount, statusSummary.total]);

  if (!isOpen) return null;

  // STRICT ACCESS CONTROL: SARANA ROLE CAN NEVER ACCESS EVALUATION MENU
  if (currentRole === 'SARANA') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Akses Ditolak (Proteksi Hak Akses)</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Role Sarana Tidak Diizinkan
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pihak Sarana / Pelaku Usaha <strong>tidak berhak mengevaluasi</strong> atau <strong>mengubah status verifikasi CAPA</strong>. Tindakan ini hanya boleh dilakukan oleh <strong>Petugas / Evaluator</strong> dan <strong>Admin Balai Besar POM</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadEvaluationPDF = async () => {
    try {
      await generateCapaEvaluationReportPDF(inspection, {
        reportNo,
        evaluatorName,
        evaluatorNip,
        conclusion,
        finalStatus: targetStatus,
      });
    } catch (e) {
      console.error('Error downloading evaluation report PDF:', e);
    }
  };

  const handleSaveEvaluation = (openWorkflow: boolean = false, autoDownload: boolean = true) => {
    setIsProcessing(true);
    const nowStr = new Date().toISOString();

    if (autoDownload) {
      handleDownloadEvaluationPDF();
    }

    const evaluationReportData: EvaluationReport = {
      reportNo,
      evaluatorName,
      evaluatorNip,
      evaluatedAt: nowStr,
      overallConclusion: conclusion,
      finalStatus: targetStatus,
      uploadedDocumentName: docName,
      uploadedDocumentSize: '1.2 MB',
      notes,
    };

    // Update individual findings evaluation
    const updatedFindings = inspection.findings.map((f) => ({
      ...f,
      capa: {
        ...f.capa,
        evaluatorNotes: itemNotes[f.id] || f.capa?.evaluatorNotes,
        evaluationStatus: itemStatuses[f.id] || 'MEMADAI',
      },
    }));

    // Status Indonesian Label for Notification
    let statusTextIndonesia = '';
    if (targetStatus === 'SELESAI_CLOSED') {
      statusTextIndonesia = 'SELESAI / CLOSED (Seluruh Temuan Close)';
    } else {
      statusTextIndonesia = `PERLU PERBAIKAN (${statusSummary.openCount} Temuan Masih Open)`;
    }

    // Auto Notification for Sarana
    const updateWaNotif = {
      id: `NOTIF-${Date.now()}-EVAL`,
      channel: 'WHATSAPP' as const,
      recipient: `${inspection.facility.picPhone} (${inspection.facility.picName})`,
      subject: `[SIMONCER] Pembaruan Status Evaluasi CAPA - ${statusTextIndonesia}`,
      content: `*PEMBARUAN STATUS EVALUASI CAPA*\n\nYth. Pimpinan/PIC ${inspection.facility.name},\n\nTim Evaluator telah menyelesaikan penilaian dokumen tindak lanjut untuk Kode Unik: *${inspection.capaCode}*.\n\n• Status Hasil Evaluasi: *${statusTextIndonesia}*\n• Ringkasan Temuan: ${statusSummary.closeCount} Close, ${statusSummary.openCount} Open\n• No. Berita Acara: ${reportNo}\n• Evaluator: ${evaluatorName}\n\nCatatan Evaluator:\n"${conclusion}"\n\nSilakan periksa detail laporan evaluasi dan tindak lanjut berikutnya melalui portal SIMONCER:\nhttps://simoncer.id/track?code=${inspection.capaCode}\n\nTerima kasih.`,
      sentAt: nowStr,
      status: 'DELIVERED' as const,
      triggerEvent: 'STATUS_EVALUASI_UPDATE' as const,
    };

    const newAuditLog = {
      id: `LOG-${Date.now()}`,
      action: `Evaluator Memperbarui Status Evaluasi (${targetStatus})`,
      actor: evaluatorName,
      role: 'Petugas' as const,
      timestamp: nowStr,
      details: `Evaluator ${evaluatorName} menetapkan hasil telaah CAPA: ${statusSummary.closeCount} butir Close, ${statusSummary.openCount} butir Open. Status sesi otomatis ditetapkan sebagai: ${targetStatus}. Berkas evaluasi: ${docName}. Lembar hasil evaluasi diteruskan ke antrean Admin untuk naskah dinas SRIKANDI.`,
      badgeType:
        targetStatus === 'SELESAI_CLOSED'
          ? ('success' as const)
          : ('danger' as const),
    };

    const updatedInspection: InspectionSession = {
      ...inspection,
      status: targetStatus,
      findings: updatedFindings,
      evaluationReport: evaluationReportData,
      srikandiWorkflow: {
        ...(inspection.srikandiWorkflow || {}),
        needsAdminCoverLetter: true,
        evaluationCompletedAt: nowStr,
        evaluationCompletedBy: evaluatorName,
        evaluationDocumentName: docName,
        isMatrixSaved: true,
        matrixSavedAt: nowStr,
        matrixSavedBy: evaluatorName,
        matrixDocumentName: `Lampiran_Matriks_CAPA_${inspection.capaCode}.pdf`,
        coverLetterNo:
          inspection.srikandiWorkflow?.coverLetterNo ||
          `PW.01.02.3.33.09.26.${inspection.capaCode.replace('CAPA-', '')}`,
        srikandiStatus: inspection.srikandiWorkflow?.srikandiStatus || 'DRAFT',
      },
      notifications: [
        ...createAutomaticNotifications({
          triggerEvent: 'STATUS_EVALUASI_UPDATE',
          inspection,
          additionalDetails: {
            newStatus: targetStatus,
            customNote: conclusion,
          },
        }),
        updateWaNotif,
        ...inspection.notifications
      ],
      auditTrail: [newAuditLog, ...inspection.auditTrail],
      updatedAt: nowStr,
    };

    // Trigger Real WhatsApp Gateway (Fonnte) in Background
    sendCapaEvaluatedNotification(updatedInspection, {
      reportNo,
      evaluatorName,
      finalStatus: targetStatus,
      notes: conclusion,
    }).catch((err) => {
      console.error('Error sending WhatsApp evaluation notification:', err);
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (targetStatus === 'SELESAI_CLOSED') {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {
          console.log(e);
        }
      }
      onSubmitEvaluation(updatedInspection);
      onClose();
      if (openWorkflow && onOpenSrikandiWorkflow) {
        onOpenSrikandiWorkflow(updatedInspection);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Modal Header */}
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
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base">
                  Panel Petugas / Evaluator: Telaah Hasil Evaluasi & Update Status CAPA
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#e8f1fb] text-slate-700 border border-blue-200">
                  {inspection.capaCode}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-800 border border-purple-500/30 uppercase">
                  Petugas / Evaluator
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {inspection.facility.name} • No Surat SRIKANDI: {inspection.srikandiLetter.letterNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadEvaluationPDF}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Unduh Berita Acara & Lembar Hasil Evaluasi CAPA Resmi (.pdf) untuk dilampirkan ke naskah SRIKANDI oleh Admin"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Lembar Evaluasi (.pdf)</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] transition-colors cursor-pointer"
              title="Tutup Halaman (Kembali ke Beranda)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Petugas / Evaluator Info Bar */}
        <div className="bg-purple-50/80 border-b border-purple-200 px-6 py-2.5 text-xs text-purple-900 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">Otoritas Petugas / Evaluator:</span>
            <span>
              Petugas / Evaluator yang ditugaskan berwenang menelaah kecukupan bukti dukung, memberikan catatan evaluasi, dan menetapkan status CAPA.
            </span>
          </div>
          {inspection.assignedOfficer && (
            <span className="font-semibold text-[11px] bg-purple-200/60 px-2 py-0.5 rounded border border-purple-300">
              PIC: {inspection.assignedOfficer.name} ({inspection.assignedOfficer.phone})
            </span>
          )}
        </div>

        {/* SRIKANDI & Admin Cover Letter Explanatory Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200 px-6 py-2.5 text-xs text-blue-950 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 flex items-center gap-1 shrink-0">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
              Alur Integrasi SRIKANDI:
            </span>
            <span className="text-slate-700">
              Setelah selesai evaluasi, berkas <strong>Lembar Hasil Evaluasi CAPA (.pdf)</strong> menjadi lampiran telaah resmi yang akan dimasukkan oleh <strong>Admin</strong> ke dalam aplikasi <strong>SRIKANDI</strong> bersama Surat Pengantar ber-TTE sebelum dikirimkan ke Sarana.
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto space-y-5 text-xs">
          
          {/* ========================================================================= */}
          {/* IDENTIFIKASI OTOMATIS STATUS SESI (Pengganti manual radio/cards) */}
          {/* ========================================================================= */}
          <div className={`p-4 rounded-xl border transition-all shadow-xs ${
            statusSummary.isAllClosed
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border-emerald-300 text-emerald-950'
              : 'bg-gradient-to-r from-rose-50 via-orange-50 to-rose-100/50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`p-2.5 rounded-xl text-white shadow-xs shrink-0 ${
                  statusSummary.isAllClosed ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {statusSummary.isAllClosed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs uppercase tracking-wide text-slate-800">
                      Status Sesi Teridentifikasi Otomatis:
                    </span>
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-2xs ${
                      statusSummary.isAllClosed
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-rose-600 text-white border-rose-700'
                    }`}>
                      {statusSummary.isAllClosed
                        ? '✓ SELESAI / CLOSED (Semua Temuan Close)'
                        : `⚠️ PERLU PERBAIKAN (${statusSummary.openCount} Temuan Open)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {statusSummary.isAllClosed
                      ? `Seluruh ${statusSummary.total} butir temuan berstatus CLOSE. Status sesi pemeriksaan otomatis dinyatakan selesai dan siap diterbitkan Berita Acara / Surat Penutupan.`
                      : `Terdapat ${statusSummary.openCount} dari ${statusSummary.total} butir temuan berstatus OPEN. Sistem otomatis menetapkan status sesi sebagai Perlu Perbaikan agar sarana merevisi bukti dukung.`}
                  </p>
                </div>
              </div>

              {/* Progress Summary Pill */}
              <div className="flex items-center gap-2 shrink-0 bg-white/90 p-2.5 rounded-xl border border-slate-200 self-start sm:self-center shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Close: {statusSummary.closeCount}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Open: {statusSummary.openCount}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-[11px] font-mono font-bold text-slate-600">
                  Total: {statusSummary.total}
                </span>
              </div>
            </div>
          </div>

          {/* Evaluator Data & Upload BA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800">Data Evaluator / Tim Validasi</h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Petugas Evaluator
                </label>
                <input
                  type="text"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nomor Berita Acara / Laporan Hasil Evaluasi
                </label>
                <input
                  type="text"
                  value={reportNo}
                  onChange={(e) => setReportNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                Unggah Berita Acara / Surat Hasil Evaluasi
              </h4>
              <p className="text-[11px] text-slate-500">
                Unggah berkas resmi hasil telaah CAPA ke sistem untuk dicatat dalam berkas permanen sesi audit.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Dokumen Evaluasi (PDF)
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Format didukung: PDF, Signed SRIKANDI (Maks 10 MB)</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INDIVIDUAL FINDINGS EVALUATION: OPEN vs CLOSE + DISTINCT TEMUAN vs RESPON */}
          {/* ========================================================================= */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Evaluasi Per Butir Temuan ({inspection.findings.length} Butir)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tentukan status setiap butir temuan (<span className="text-emerald-700 font-bold">Close</span> atau <span className="text-rose-700 font-bold">Open</span>). Status sesi otomatis menyesuaikan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allClose: Record<string, CapaItemEvaluation> = {};
                    inspection.findings.forEach(f => { allClose[f.id] = 'MEMADAI'; });
                    setItemStatuses(allClose);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                >
                  ✓ Set Semua Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allOpen: Record<string, CapaItemEvaluation> = {};
                    inspection.findings.forEach(f => { allOpen[f.id] = 'REVISI'; });
                    setItemStatuses(allOpen);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-300 transition-colors cursor-pointer"
                >
                  ✗ Set Semua Open
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {inspection.findings.map((f, idx) => {
                const currentStatus = itemStatuses[f.id] || 'MEMADAI';
                const isClose = currentStatus === 'MEMADAI';
                const isOpen = currentStatus === 'REVISI' || currentStatus === 'BELUM_MEMADAI';

                return (
                  <div
                    key={f.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isClose
                        ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                        : 'bg-rose-50/20 border-rose-300 hover:border-rose-400 shadow-xs'
                    }`}
                  >
                    {/* Header Butir Temuan & Segmented Open/Close Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-800">
                          {f.clause}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.category === 'KRITIS'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : f.category === 'MAYOR'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          }`}
                        >
                          {f.category}
                        </span>
                      </div>

                      {/* Open / Close Segmented Buttons */}
                      <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">
                          Status:
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemStatuses((prev) => ({ ...prev, [f.id]: 'MEMADAI' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isClose
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                          }`}
                          title="Tandai temuan telah tuntas / disetujui (Close)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemStatuses((prev) => ({ ...prev, [f.id]: 'REVISI' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isOpen
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-white/80'
                          }`}
                          title="Tandai temuan masih memerlukan perbaikan / revisi dari sarana (Open)"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>

                    {/* DUAL COMPARISON CONTAINERS: TEMUAN vs RESPON SARANA */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                      
                      {/* 1. KOTAK TEMUAN PEMERIKSAAN LAPANGAN */}
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 border-l-4 border-l-amber-500 rounded-r-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-amber-950 font-extrabold text-[11px] uppercase tracking-wide">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Temuan Pemeriksaan Lapangan</span>
                          </div>
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            Ketidaksesuaian
                          </span>
                        </div>

                        <div className="bg-white/85 p-3 rounded-lg border border-amber-200/80 text-xs text-slate-900 leading-relaxed font-medium">
                          {f.description}
                        </div>

                        {f.initialEvidenceDescription && (
                          <div className="text-[11px] text-amber-900/90 bg-white/70 p-2 rounded-lg border border-amber-200/60 space-y-0.5">
                            <span className="font-bold text-amber-950 block text-[10px] uppercase">
                              Catatan Bukti / Kondisi Awal:
                            </span>
                            <p>{f.initialEvidenceDescription}</p>
                          </div>
                        )}
                      </div>

                      {/* 2. KOTAK RESPON & TINDAKAN PERBAIKAN SARANA (CAPA) */}
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 border-l-4 border-l-emerald-600 rounded-r-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-[11px] uppercase tracking-wide">
                            <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Respon & Tindakan Sarana (CAPA)</span>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                            PIC: {f.capa?.pic || inspection.facility.picName}
                          </span>
                        </div>

                        {/* Tindakan Perbaikan (Corrective Action) */}
                        <div className="bg-white/95 p-3 rounded-lg border border-emerald-200 text-xs text-slate-800 space-y-2">
                          <div>
                            <span className="font-bold text-emerald-950 block mb-0.5">
                              Tindakan Perbaikan (Corrective Action):
                            </span>
                            <p className="leading-relaxed text-slate-800">
                              {f.capa?.correctiveAction || '(Sarana belum mengisi uraian tindakan perbaikan)'}
                            </p>
                          </div>

                          {/* Akar Masalah if present */}
                          {f.capa?.rootCauseAnalysis && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="font-bold text-emerald-950 block mb-0.5">
                                Analisis Akar Masalah (Root Cause):
                              </span>
                              <p className="text-slate-700 leading-relaxed">
                                {f.capa.rootCauseAnalysis}
                              </p>
                            </div>
                          )}

                          {/* Tindakan Pencegahan if present */}
                          {f.capa?.preventiveAction && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="font-bold text-emerald-950 block mb-0.5">
                                Tindakan Pencegahan (Preventive Action):
                              </span>
                              <p className="text-slate-700 leading-relaxed">
                                {f.capa.preventiveAction}
                              </p>
                            </div>
                          )}

                          {/* Evidence Files & Google Drive Link if uploaded */}
                          {((f.capa?.evidenceFiles && f.capa.evidenceFiles.length > 0) || f.capa?.evidenceDriveUrl) && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <span className="font-bold text-emerald-950 block text-[11px]">
                                Bukti Dukung yang Dilampirkan Sarana:
                              </span>

                              {/* Google Drive Link if provided by facility */}
                              {f.capa?.evidenceDriveUrl && (
                                <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-blue-950 text-xs block truncate">
                                        Folder Cloud / Google Drive Bukti Sarana
                                      </span>
                                      <span className="text-[10px] text-blue-700 font-mono truncate block">
                                        {f.capa.evidenceDriveUrl}
                                      </span>
                                    </div>
                                  </div>
                                  <a
                                    href={f.capa.evidenceDriveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                                  >
                                    <span>Buka Folder Drive ↗</span>
                                  </a>
                                </div>
                              )}

                              {/* Evidence Files if uploaded */}
                              {f.capa?.evidenceFiles && f.capa.evidenceFiles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {f.capa.evidenceFiles.map((file, fIdx) => (
                                    <span
                                      key={`${file.id || 'ev'}-${fIdx}`}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-[11px] font-mono font-medium"
                                    >
                                      <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span className="truncate max-w-[180px]">{file.name}</span>
                                      <span className="text-[10px] text-emerald-700">({file.size})</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CATATAN REKOMENDASI EVALUATOR UNTUK BUTIR INI */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Catatan Rekomendasi Evaluator untuk Butir Ini:</span>
                        <span className={`text-[10px] font-bold ${isClose ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isClose ? '✓ Status Butir: Close' : '⚠️ Status Butir: Open (Perlu Revisi)'}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={itemNotes[f.id] || ''}
                        onChange={(e) =>
                          setItemNotes((prev) => ({
                            ...prev,
                            [f.id]: e.target.value,
                          }))
                        }
                        placeholder={
                          isClose
                            ? 'Contoh: Tindakan perbaikan dan bukti dukung dinilai memadai (Close).'
                            : 'Contoh: Bukti sertifikat kalibrasi belum dilampirkan, mohon lengkapi...'
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conclusion Textarea */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">
              Kesimpulan Evaluasi & Catatan Akhir (Otomatis Dikirim ke WA & Email Sarana) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed focus:bg-white focus:border-purple-500"
            />
          </div>

          {/* ========================================================================= */}
          {/* PENGECEKAN STATUS CAPA OTOMATIS SEBELUM PEMBUATAN SURAT PENGANTAR (TTE)   */}
          {/* ========================================================================= */}
          <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
            statusSummary.isAllClosed
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border-emerald-300 text-emerald-950'
              : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border-amber-300 text-amber-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl text-white shadow-xs shrink-0 ${
                  statusSummary.isAllClosed ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  {statusSummary.isAllClosed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Pengecekan Status CAPA Otomatis Sebelum Naskah Dinas:
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      statusSummary.isAllClosed
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-amber-600 text-white border-amber-700'
                    }`}>
                      {statusSummary.isAllClosed
                        ? '✓ 100% CLOSED (SIAP PENUTUPAN RESMI)'
                        : `⚠️ TERDAPAT ${statusSummary.openCount} BUTIR OPEN (PERLU REVISI)`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {statusSummary.isAllClosed ? (
                      <>
                        Seluruh <strong>{statusSummary.total} butir temuan telah dinyatakan Close (Memadai)</strong>. Sistem siap mengarahkan admin/evaluator ke pembuatan <strong>Surat Pengantar Persetujuan & Penutupan CAPA Resmi</strong>.
                      </>
                    ) : (
                      <>
                        Karena masih terdapat <strong>{statusSummary.openCount} butir temuan Open (Belum Memadai)</strong>, sistem <strong>melarang penutupan CAPA</strong> dan mengarahkan otomatis ke alur <strong>Surat Pengantar Hasil Evaluasi Ulang (Perbaikan Lanjutan)</strong> agar sarana melengkapi kekurangan bukti dukung.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                  statusSummary.isAllClosed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {statusSummary.isAllClosed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Alur: Surat Penutupan CAPA</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Alur: Surat Evaluasi Ulang</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Menyimpan evaluasi akan memperbarui status sesi menjadi{' '}
              <strong className={statusSummary.isAllClosed ? 'text-emerald-700' : 'text-rose-700'}>
                {statusSummary.isAllClosed ? 'SELESAI / CLOSED' : 'PERLU PERBAIKAN'}
              </strong>{' '}
              dan memicu notifikasi otomatis ke sarana.
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            <button
              onClick={onClose}
              type="button"
              className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              Batal
            </button>
            <button
              onClick={() => handleSaveEvaluation(false, false)}
              disabled={isProcessing}
              type="button"
              className="px-4 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Simpan draf evaluasi ke sistem tanpa menutup halaman"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Menyimpan...' : 'Simpan Draf'}</span>
            </button>
            <button
              onClick={() => handleSaveEvaluation(true, false)}
              disabled={isProcessing}
              type="button"
              className={`px-4.5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                statusSummary.isAllClosed
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500'
                  : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500'
              }`}
              title={
                statusSummary.isAllClosed
                  ? 'Simpan evaluasi dan teruskan ke alur naskah dinas Admin SRIKANDI (Surat Penutupan)'
                  : 'Simpan evaluasi dan teruskan ke alur naskah dinas Admin SRIKANDI (Surat Evaluasi Ulang)'
              }
            >
              <ShieldCheck className="w-4 h-4 text-[#1e3a5f]" />
              <span>
                {isProcessing
                  ? 'Menyimpan...'
                  : statusSummary.isAllClosed
                  ? '✓ Selesai & Teruskan ke Admin (Surat Penutupan) →'
                  : '⚠️ Selesai & Teruskan ke Admin (Surat Evaluasi Ulang) →'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
