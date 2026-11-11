import React, { useState } from 'react';
import { InspectionSession } from '../types';
import { 
  X, 
  ArrowLeft,
  Download, 
  Printer, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  ExternalLink, 
  Check, 
  Layers 
} from 'lucide-react';
import { formatIndonesianDate, calculateRemainingDays, getStatusBadgeConfig } from '../utils/date';
import { 
  generateInspectionSummaryPDF, 
  generateCommodityMatrixAttachmentPDF, 
  generateSrikandiCoverLetterPDF 
} from '../utils/pdfReportGenerator';
import { CommodityMatrixTable } from './CommodityMatrixTable';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';

interface InspectionSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  onOpenSrikandiWorkflow?: () => void;
}

export const InspectionSummaryReportModal: React.FC<InspectionSummaryReportModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onOpenSrikandiWorkflow,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingMatrix, setIsDownloadingMatrix] = useState(false);
  const [isDownloadingCoverLetter, setIsDownloadingCoverLetter] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const sla = calculateRemainingDays(inspection.srikandiLetter.deadlineDate);
  const statusBadge = getStatusBadgeConfig(inspection.status);
  const matrixConfig = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  if (!isOpen) return null;

  const handleDownloadFullPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateInspectionSummaryPDF(inspection);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat dokumen PDF. Silakan gunakan opsi Cetak Langsung.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMatrixOnly = async () => {
    try {
      setIsDownloadingMatrix(true);
      await generateCommodityMatrixAttachmentPDF(inspection);
    } catch (err) {
      console.error('Error generating matrix attachment PDF:', err);
      alert('Gagal membuat dokumen lampiran matriks CAPA.');
    } finally {
      setIsDownloadingMatrix(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    try {
      setIsDownloadingCoverLetter(true);
      await generateSrikandiCoverLetterPDF(inspection);
    } catch (err) {
      console.error('Error generating cover letter PDF:', err);
      alert('Gagal membuat surat pengantar TTE SRIKANDI.');
    } finally {
      setIsDownloadingCoverLetter(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const countKritis = inspection.findings.filter((f) => f.category === 'KRITIS').length;
  const countMayor = inspection.findings.filter((f) => f.category === 'MAYOR').length;
  const countMinor = inspection.findings.filter((f) => f.category === 'MINOR').length;
  const countAccepted = inspection.findings.filter((f) => f.capa.evaluationStatus === 'MEMADAI').length;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Top Header / Control Toolbar (Hidden in print) */}
        <div className="no-print bg-gradient-to-r from-slate-950 via-[#0b1437] to-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 flex-wrap gap-3">
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Laporan Ringkasan Temuan & Rekap CAPA
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {inspection.capaCode}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                  {matrixConfig.codeStandard}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate max-w-md sm:max-w-lg">
                Format resmi Balai Besar POM di Semarang dengan Matriks Komoditi Asli ({inspection.facility.type})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Download Full PDF Report */}
            <button
              type="button"
              onClick={handleDownloadFullPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              title="Unduh berkas PDF laporan lengkap resmi dengan kop dan tanda tangan"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>PDF Terunduh!</span>
                </>
              ) : isGeneratingPdf ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Laporan Lengkap (.pdf)</span>
                </>
              )}
            </button>

            {/* Download Matrix Attachment Only */}
            <button
              type="button"
              onClick={handleDownloadMatrixOnly}
              disabled={isDownloadingMatrix}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Unduh khusus Lampiran Matriks CAPA resmi untuk naskah SRIKANDI"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Unduh Lampiran Matriks (.pdf)</span>
            </button>

            {/* Srikandi Workflow */}
            {onOpenSrikandiWorkflow && (
              <button
                type="button"
                onClick={onOpenSrikandiWorkflow}
                className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Buka Alur Pengelolaan TTE SRIKANDI"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Alur TTE SRIKANDI</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Cetak langsung ke printer atau simpan sebagai PDF via browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="p-4 sm:p-8 text-slate-900 bg-white overflow-y-auto flex-1 font-sans text-xs space-y-6">
          
          {/* 1. Official Letterhead / Kop Surat */}
          <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
              BADAN PENGAWAS OBAT DAN MAKANAN REPUBLIK INDONESIA
            </h2>
            <h1 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight">
              BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG
            </h1>
            <p className="text-[10px] text-slate-500">
              Jl Sukun Raya No 41 A Banyumanik Semarang | Telp: (024) 7612305 | Email: bbpom_semarang@pom.go.id
            </p>
            <div className="h-0.5 bg-slate-900 w-full mt-2"></div>
            <div className="h-px bg-slate-400 w-full mt-0.5"></div>
          </div>

          {/* 2. Document Title */}
          <div className="text-center space-y-0.5">
            <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wide">
              LEMBAR HASIL PENGAWASAN & REKAPITULASI RESMI TEMUAN CAPA
            </h3>
            <p className="text-[11px] font-bold text-emerald-800 font-mono">
              SISTEM MONITORING EVALUASI CAPA TERINTEGRASI (SIMONCER)
            </p>
          </div>

          {/* 3. Inspection & Facility Identity Matrix */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50">
                  <td className="w-40 p-2.5 font-bold text-slate-600 border-r border-slate-200">Kode Unik CAPA</td>
                  <td className="p-2.5 font-mono font-black text-emerald-800">{inspection.capaCode}</td>
                  <td className="w-36 p-2.5 font-bold text-slate-600 border-r border-slate-200 border-l">Status Sesi</td>
                  <td className="p-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                      {statusBadge.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200">Surat SRIKANDI (TTE)</td>
                  <td className="p-2.5 font-mono font-bold">{inspection.srikandiLetter.letterNo}</td>
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200 border-l">Tanggal Surat</td>
                  <td className="p-2.5 font-medium">{formatIndonesianDate(inspection.srikandiLetter.issuedDate)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200">Nama Sarana / Fasilitas</td>
                  <td className="p-2.5 font-bold text-slate-900">{inspection.facility.name}</td>
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200 border-l">Jenis Sarana / Form</td>
                  <td className="p-2.5 font-medium">
                    <span className="font-bold text-slate-900">{inspection.facility.type}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({matrixConfig.codeStandard})</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200">Nomor Izin / NIB</td>
                  <td className="p-2.5 font-mono">{inspection.facility.licenseNo}</td>
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200 border-l">PIC / APJ Sarana</td>
                  <td className="p-2.5 font-medium">{inspection.facility.picName} ({inspection.facility.picPhone})</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200">Tenggat Waktu SLA (14 Hari)</td>
                  <td className="p-2.5 font-bold text-amber-800">
                    {formatIndonesianDate(inspection.srikandiLetter.deadlineDate)} ({sla.text})
                  </td>
                  <td className="p-2.5 font-bold text-slate-600 border-r border-slate-200 border-l">Petugas PIC Balai</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    {inspection.assignedOfficer?.name || inspection.leadAuditor}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Findings Summary Metric Pills */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-700">
              Statistik Temuan: <strong className="text-slate-900">{inspection.findings.length} Butir</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[10px]">
                Kritis: {countKritis}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[10px]">
                Mayor: {countMayor}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-300 text-[10px]">
                Minor: {countMinor}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[10px]">
                Diterima / Memadai: {countAccepted}/{inspection.findings.length}
              </span>
            </div>
          </div>

          {/* 5. OFFICIAL COMMODITY MATRIX TABLE (MATCHES TAB VIEW EXACTLY!) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm uppercase text-slate-900">
                  A. Matriks Tindak Lanjut Perbaikan (CAPA) - {matrixConfig.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Format resmi BPOM disesuaikan dengan jenis fasilitas ({inspection.facility.type}). Seluruh kolom, analisis, dampak, dan bukti terlampir secara presisi.
                </p>
              </div>

              <div className="no-print flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadMatrixOnly}
                  disabled={isDownloadingMatrix}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh Matriks Ini Saja (.pdf)</span>
                </button>
              </div>
            </div>

            {/* Embedded CommodityMatrixTable without duplicate topbar/metadata */}
            <CommodityMatrixTable
              inspection={inspection}
              readOnly={true}
              showTopBar={false}
              showHeaderMeta={false}
              showSignatures={false}
              showEvaluationColumn={true}
            />
          </div>

          {/* 6. Evaluation Conclusions */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
            <h4 className="font-bold text-xs uppercase text-slate-900">
              B. Kesimpulan Evaluasi & Tindak Lanjut Tim Pemeriksa Balai
            </h4>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <p>
                <strong>Nomor Berita Acara:</strong> {inspection.evaluationReport?.reportNo || `BA-EVAL-${inspection.capaCode}`}
              </p>
              <p>
                <strong>Catatan / Rekomendasi:</strong>{' '}
                {inspection.evaluationReport?.overallConclusion ||
                  inspection.evaluationReport?.notes ||
                  (inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED'
                    ? 'Seluruh perbaikan dan bukti pencegahan telah diverifikasi oleh tim evaluator BBPOM di Semarang dan dinyatakan MEMENUHI SYARAT (Closed/Tervalidasi).'
                    : inspection.status === 'PERLU_PERBAIKAN'
                    ? 'Terdapat butir CAPA yang belum memadai. Sarana diminta untuk melengkapi bukti perbaikan lanjutan.'
                    : 'Pemeriksaan masih dalam proses penyusunan/evaluasi tindak lanjut perbaikan CAPA.')}
              </p>
            </div>
          </div>

          {/* 7. Signatures Section */}
          <div className="pt-4 border-t border-slate-300 flex items-start justify-between text-xs px-4">
            {/* Left: PIC Sarana */}
            <div className="text-center space-y-12">
              <div>
                <p className="text-slate-600">{matrixConfig.signatureLeft || 'Pimpinan / Penanggung Jawab,'}</p>
                <p className="font-bold text-slate-900">{inspection.facility.name}</p>
              </div>
              <div className="border-t border-slate-400 pt-1 min-w-[200px]">
                <p className="font-bold text-slate-900">{inspection.facility.picName}</p>
                <p className="text-[10px] text-slate-500">NIB: {inspection.facility.licenseNo}</p>
              </div>
            </div>

            {/* Right: Lead Auditor BBPOM */}
            <div className="text-center space-y-12">
              <div>
                <p className="text-slate-600">Semarang, {formatIndonesianDate(new Date().toISOString())}</p>
                <p className="font-bold text-slate-900">{matrixConfig.signatureRight || 'Petugas / Lead Auditor BBPOM,'}</p>
              </div>
              <div className="border-t border-slate-400 pt-1 min-w-[200px]">
                <p className="font-bold text-slate-900">
                  {inspection.assignedOfficer?.name || inspection.leadAuditor}
                </p>
                <p className="text-[10px] text-slate-500">
                  {inspection.assignedOfficer?.nip ? `NIP. ${inspection.assignedOfficer.nip}` : 'Pengawas Farmasi & Makanan'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline text-[11px]">
              Dokumen ini di-generate secara real-time dari pangkalan data SIMONCER BBPOM Semarang.
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              type="button"
              onClick={handleDownloadCoverLetter}
              disabled={isDownloadingCoverLetter}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Unduh Nota Dinas / Surat Pengantar TTE SRIKANDI"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-700" />
              <span>Surat Pengantar TTE (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMatrixOnly}
              disabled={isDownloadingMatrix}
              className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Unduh dokumen lampiran Matriks CAPA resmi untuk SRIKANDI"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Unduh Matriks Lampiran (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFullPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Memproses...' : 'Unduh Laporan Lengkap (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
