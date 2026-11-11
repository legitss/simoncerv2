import React from 'react';
import { InspectionSession } from '../types';
import { formatIndonesianDate } from '../utils/date';
import { ShieldCheck, Printer, X, Download } from 'lucide-react';
import { CommodityMatrixTable } from './CommodityMatrixTable';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';
import { generateInspectionSummaryPDF, generateCommodityMatrixAttachmentPDF } from '../utils/pdfReportGenerator';

interface PrintReportViewProps {
  inspection: InspectionSession;
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  inspection,
  onClose,
}) => {
  const matrixConfig = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden my-4">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Laporan Evaluasi & Penutupan CAPA (Format Cetak Resmi Matriks Komoditi)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateInspectionSummaryPDF(inspection)}
              type="button"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              type="button"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-6 sm:p-10 text-slate-900 bg-white max-h-[85vh] overflow-y-auto font-sans text-xs space-y-6">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-base font-extrabold uppercase tracking-wide">
              LEMBAR HASIL EVALUASI TINDAK LANJUT (CAPA) TERPADU
            </h1>
            <h2 className="text-xs font-bold text-slate-700 uppercase mt-0.5">
              SISTEM MONITORING EVALUASI CAPA TERINTEGRASI (SIMONCER)
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Kode Unik CAPA: {inspection.capaCode} • No. Surat Tindak Lanjut: {inspection.srikandiLetter.letterNo}
            </p>
          </div>

          {/* Sarana & Inspection Table */}
          <table className="w-full border border-slate-400 text-xs">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="w-40 p-2 bg-slate-100 font-semibold border-r border-slate-300">Nama Sarana / Fasilitas</td>
                <td className="p-2 font-bold">{inspection.facility.name}</td>
                <td className="w-36 p-2 bg-slate-100 font-semibold border-r border-slate-300 border-l">Jenis Sarana</td>
                <td className="p-2 font-medium">{inspection.facility.type} ({matrixConfig.codeStandard})</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 bg-slate-100 font-semibold border-r border-slate-300">Nomor Izin / NIB</td>
                <td className="p-2 font-mono">{inspection.facility.licenseNo}</td>
                <td className="p-2 bg-slate-100 font-semibold border-r border-slate-300 border-l">PIC / Apoteker PJ</td>
                <td className="p-2">{inspection.facility.picName}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 bg-slate-100 font-semibold border-r border-slate-300">Tanggal Pemeriksaan</td>
                <td className="p-2">{formatIndonesianDate(inspection.inspectionDate)}</td>
                <td className="p-2 bg-slate-100 font-semibold border-r border-slate-300 border-l">Petugas / Evaluator PIC</td>
                <td className="p-2 font-bold">{inspection.assignedOfficer?.name || inspection.leadAuditor}</td>
              </tr>
              <tr>
                <td className="p-2 bg-slate-100 font-semibold border-r border-slate-300">Status Akhir Sesi</td>
                <td className="p-2 font-bold text-emerald-800" colSpan={3}>
                  {inspection.status.replace(/_/g, ' ')} (Disertai Berita Acara: {inspection.evaluationReport?.reportNo || '-'})
                </td>
              </tr>
            </tbody>
          </table>

          {/* OFFICIAL COMMODITY MATRIX TABLE */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase text-slate-900">
              A. Matriks Temuan Ketidaksesuaian & Tindak Lanjut Perbaikan (CAPA) - {matrixConfig.title}
            </h3>
            
            <CommodityMatrixTable
              inspection={inspection}
              readOnly={true}
              showTopBar={false}
              showHeaderMeta={false}
              showSignatures={false}
              showEvaluationColumn={true}
            />
          </div>

          {/* Evaluator Conclusion Box */}
          {inspection.evaluationReport && (
            <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-1">
              <span className="font-bold block text-slate-800">
                B. Kesimpulan Evaluasi & Berita Acara No. {inspection.evaluationReport.reportNo}:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {inspection.evaluationReport.overallConclusion}
              </p>
            </div>
          )}

          {/* Official Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center mt-8 break-inside-avoid pt-4 border-t border-slate-300">
            <div>
              <p className="text-slate-600">{matrixConfig.signatureLeft || 'Pihak Sarana / Penanggung Jawab,'}</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-slate-400 italic text-[11px]">[Tanda Tangan & Cap]</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px]">
                {inspection.facility.picName}
              </p>
              <p className="text-[10px] text-slate-500">{inspection.facility.name}</p>
            </div>

            <div>
              <p className="text-slate-600">Semarang, {formatIndonesianDate(new Date().toISOString())}</p>
              <p className="text-slate-600 text-[11px]">{matrixConfig.signatureRight || 'Ketua Tim Evaluator / Auditor,'}</p>
              <div className="h-14 flex items-center justify-center">
                <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-mono border border-emerald-400 bg-emerald-50 px-2 py-1 rounded">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>TERVERIFIKASI TTE</span>
                </div>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px]">
                {inspection.assignedOfficer?.name || inspection.leadAuditor}
              </p>
              <p className="text-[10px] text-slate-500">
                {inspection.assignedOfficer?.nip ? `NIP. ${inspection.assignedOfficer.nip}` : 'Pengawas Farmasi & Makanan'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
