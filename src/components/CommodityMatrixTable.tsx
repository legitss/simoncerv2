import React, { useState } from 'react';
import { InspectionSession, FindingItem } from '../types';
import { 
  getCommodityMatrixConfig, 
  CommodityType,
  CommodityMatrixColumn
} from '../utils/commodityMatrix';
import { 
  formatIndonesianDate, 
  getCategoryBadge 
} from '../utils/date';
import { 
  Printer, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  ShieldCheck, 
  Info,
  Sparkles,
  Layers,
  Send,
  ExternalLink,
  Check
} from 'lucide-react';
import { 
  generateCommodityMatrixAttachmentPDF, 
  generateSrikandiCoverLetterPDF 
} from '../utils/pdfReportGenerator';

interface CommodityMatrixTableProps {
  inspection: InspectionSession;
  readOnly?: boolean;
  onEditFinding?: (finding: FindingItem, index: number) => void;
  showSignatures?: boolean;
  showTopBar?: boolean;
  showHeaderMeta?: boolean;
  showEvaluationColumn?: boolean;
  onSaveMatrix?: () => void;
  onOpenSrikandiWorkflow?: () => void;
  currentRole?: string;
}

export const CommodityMatrixTable: React.FC<CommodityMatrixTableProps> = ({
  inspection,
  readOnly = false,
  onEditFinding,
  showSignatures = true,
  showTopBar = true,
  showHeaderMeta = true,
  showEvaluationColumn = true,
  onSaveMatrix,
  onOpenSrikandiWorkflow,
  currentRole,
}) => {
  const [isDownloadingMatrix, setIsDownloadingMatrix] = useState(false);
  const [isDownloadingLetter, setIsDownloadingLetter] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const config = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  // Determine active columns to display
  const activeColumns: CommodityMatrixColumn[] = [...config.columns];
  if (showEvaluationColumn) {
    if (!activeColumns.some((c) => c.id === 'evaluationResult')) {
      activeColumns.push({
        id: 'evaluationResult',
        label: 'Evaluasi & Catatan Balai',
        width: 'w-44',
        description: 'Hasil evaluasi dan rekomendasi evaluator BBPOM',
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMatrixPdf = async () => {
    try {
      setIsDownloadingMatrix(true);
      await generateCommodityMatrixAttachmentPDF(inspection);
    } catch (err) {
      console.error('Failed to generate commodity matrix attachment PDF:', err);
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
      console.error('Failed to generate cover letter PDF:', err);
      alert('Gagal mengunduh surat pengantar TTE SRIKANDI.');
    } finally {
      setIsDownloadingLetter(false);
    }
  };

  const handleSave = () => {
    if (onSaveMatrix) {
      onSaveMatrix();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Helper to render individual column cells in accordance with official PDF forms
  const renderCellContent = (
    col: CommodityMatrixColumn,
    finding: FindingItem,
    idx: number
  ) => {
    const capa = finding.capa;
    const catBadge = getCategoryBadge(finding.category);

    switch (col.id) {
      case 'no':
        return (
          <td 
            key={col.id} 
            className="p-3 text-center font-mono font-bold text-slate-700 border-r border-slate-200"
          >
            {idx + 1}
          </td>
        );

      case 'finding':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 space-y-1 min-w-[200px]"
          >
            <div className="font-bold text-slate-900 leading-snug">
              {finding.clause}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
              {finding.description}
            </p>
            {finding.initialEvidenceDescription && (
              <div className="text-[10px] text-slate-500 italic bg-slate-100 p-1.5 rounded mt-1">
                Observasi: {finding.initialEvidenceDescription}
              </div>
            )}
          </td>
        );

      case 'classification':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-center min-w-[100px]"
          >
            <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${catBadge.bg} ${catBadge.text} border ${catBadge.border}`}>
              {finding.category}
            </span>
          </td>
        );

      case 'requirement':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-700 leading-relaxed min-w-[140px]"
          >
            {capa.requirement || finding.clause}
          </td>
        );

      case 'currentCondition':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-700 leading-relaxed min-w-[140px]"
          >
            {capa.currentCondition || finding.description}
          </td>
        );

      case 'gapAnalysis':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-700 leading-relaxed min-w-[150px]"
          >
            {capa.gapAnalysis ? (
              <div className="whitespace-pre-line text-slate-800">{capa.gapAnalysis}</div>
            ) : (
              <span className="text-slate-600 italic">Belum diisi sarana</span>
            )}
          </td>
        );

      case 'rootCause':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-700 leading-relaxed min-w-[150px]"
          >
            {capa.rootCauseAnalysis ? (
              <div className="whitespace-pre-line text-slate-800">{capa.rootCauseAnalysis}</div>
            ) : (
              <span className="text-slate-600 italic">Belum diisi sarana</span>
            )}
          </td>
        );

      case 'impact':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-800 leading-relaxed min-w-[140px] bg-amber-50/30"
          >
            {capa.impact ? (
              <div className="whitespace-pre-line font-medium text-amber-950">{capa.impact}</div>
            ) : (
              <span className="text-slate-600 italic">Belum diisi sarana</span>
            )}
          </td>
        );

      case 'capa':
        // If subColumns exist (CA & PA)
        if (col.subColumns && col.subColumns.length > 0) {
          return (
            <React.Fragment key={col.id}>
              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-800 leading-relaxed min-w-[150px]">
                {capa.correctiveAction ? (
                  <div className="whitespace-pre-line font-medium text-slate-900">
                    {capa.correctiveAction}
                  </div>
                ) : (
                  <span className="text-slate-600 italic">Belum ada tindakan CA</span>
                )}
              </td>
              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-800 leading-relaxed min-w-[150px]">
                {capa.preventiveAction ? (
                  <div className="whitespace-pre-line font-medium text-slate-900">
                    {capa.preventiveAction}
                  </div>
                ) : (
                  <span className="text-slate-600 italic">Belum ada tindakan PA</span>
                )}
              </td>
            </React.Fragment>
          );
        }
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-800 leading-relaxed min-w-[170px]"
          >
            <div className="space-y-1">
              <div>
                <strong className="text-emerald-800 text-[10px] block">Perbaikan (CA):</strong>
                {capa.correctiveAction || <span className="text-slate-600 italic">Belum diisi</span>}
              </div>
              <div>
                <strong className="text-teal-800 text-[10px] block">Pencegahan (PA):</strong>
                {capa.preventiveAction || <span className="text-slate-600 italic">Belum diisi</span>}
              </div>
            </div>
          </td>
        );

      case 'capaCombined':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-800 leading-relaxed min-w-[180px]"
          >
            {capa.correctiveAction || capa.preventiveAction ? (
              <div className="space-y-1.5 whitespace-pre-line">
                {capa.correctiveAction && (
                  <div>
                    <strong className="text-emerald-800 text-[10px] block font-bold">Tindakan Perbaikan (CA):</strong>
                    {capa.correctiveAction}
                  </div>
                )}
                {capa.preventiveAction && (
                  <div>
                    <strong className="text-teal-800 text-[10px] block font-bold">Tindakan Pencegahan (PA):</strong>
                    {capa.preventiveAction}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-600 italic">Belum diisi sarana</span>
            )}
          </td>
        );

      case 'deadlineStatus':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-center space-y-1 min-w-[130px]"
          >
            <div className="font-semibold text-slate-800">
              {capa.targetCompletionDate ? formatIndonesianDate(capa.targetCompletionDate) : inspection.srikandiLetter.deadlineDate}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
              capa.evaluationStatus === 'MEMADAI'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {capa.progressStatus || (capa.evaluationStatus === 'MEMADAI' ? 'Sudah Selesai' : 'Dalam Proses')}
            </span>
          </td>
        );

      case 'deadline':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-center font-medium text-slate-800 min-w-[110px]"
          >
            {capa.targetCompletionDate ? formatIndonesianDate(capa.targetCompletionDate) : inspection.srikandiLetter.deadlineDate}
          </td>
        );

      case 'status':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-center text-[11px] min-w-[110px]"
          >
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
              capa.evaluationStatus === 'MEMADAI'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {capa.progressStatus || (capa.evaluationStatus === 'MEMADAI' ? 'Sudah Selesai' : 'Dalam Proses')}
            </span>
          </td>
        );

      case 'pic':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-700 min-w-[130px]"
          >
            <strong>{capa.pic || inspection.facility.picName}</strong>
          </td>
        );

      case 'evidence':
        return (
          <td 
            key={col.id} 
            className="p-3 border-r border-slate-200 text-[11px] text-slate-700 space-y-1.5 min-w-[150px]"
          >
            {capa.evidenceDocNumber && (
              <div className="font-mono text-[10px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {capa.evidenceDocNumber}
              </div>
            )}
            {capa.evidenceDriveUrl && (
              <a
                href={capa.evidenceDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-semibold truncate max-w-full"
                title="Buka Folder Google Drive Bukti Sarana"
              >
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">Drive Bukti ↗</span>
              </a>
            )}
            {capa.evidenceFiles.length > 0 ? (
              <div className="space-y-1">
                {capa.evidenceFiles.map((f, fIdx) => (
                  <div key={`${f.id || 'ev'}-${fIdx}`} className="text-[10px] text-emerald-800 truncate font-semibold flex items-center gap-1 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                    <span>📄</span>
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            ) : !capa.evidenceDriveUrl ? (
              <span className="text-slate-600 italic text-[10px]">Belum ada berkas</span>
            ) : null}
          </td>
        );

      case 'evaluationResult':
        return (
          <td 
            key={col.id} 
            className="p-3 text-[11px] text-slate-800 min-w-[140px]"
          >
            {capa.evaluatorNotes ? (
              <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 text-[10px] space-y-1">
                <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[9px] ${
                  capa.evaluationStatus === 'MEMADAI' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {capa.evaluationStatus || 'PENDING'}
                </span>
                <p className="leading-snug">{capa.evaluatorNotes}</p>
              </div>
            ) : (
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                capa.evaluationStatus === 'MEMADAI'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : capa.evaluationStatus === 'REVISI' || capa.evaluationStatus === 'BELUM_MEMADAI'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}>
                {capa.evaluationStatus || 'PENDING'}
              </span>
            )}
          </td>
        );

      default:
        return (
          <td key={col.id} className="p-3 border-r border-slate-200 text-[11px] text-slate-700">
            -
          </td>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden text-slate-900 font-sans print:border-none print:shadow-none">
      
      {/* Top Bar for Action (Hidden on Print) */}
      {showTopBar && (
        <div className="no-print bg-white text-[#1e3a5f] px-4 sm:px-5 py-3 flex items-center justify-between border-b border-blue-200/80 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-700 font-bold shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#1e3a5f] text-xs sm:text-sm">
                  Matriks Format Standar: {config.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-500/40">
                  {config.codeStandard}
                </span>
              </div>
              {inspection.srikandiWorkflow?.isMatrixSaved && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Matriks CAPA telah terbentuk & disimpan resmi untuk lampiran SRIKANDI</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Download Commodity Matrix Attachment PDF (Ready for SRIKANDI TTE) */}
            <button
              type="button"
              onClick={handleDownloadMatrixPdf}
              disabled={isDownloadingMatrix}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Unduh Lampiran Matriks CAPA resmi (Landscape PDF) untuk dilampirkan ke SRIKANDI"
            >
              {isDownloadingMatrix ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Matriks Lampiran (.pdf)</span>
                </>
              )}
            </button>

            {/* Cover Letter PDF Button: only if not Petugas/Admin */}
            {currentRole !== 'PETUGAS' && currentRole !== 'ADMIN' && currentRole !== 'SUPERADMIN' && (
              <button
                type="button"
                onClick={handleDownloadCoverLetter}
                disabled={isDownloadingLetter}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:bg-indigo-900 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Unduh Surat Pengantar / Nota Dinas Hasil Evaluasi CAPA untuk diajukan ke SRIKANDI"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Surat Pengantar TTE</span>
              </button>
            )}

            {/* Save Matrix Button */}
            {onSaveMatrix && (
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] hover:text-[#1e3a5f] rounded-lg font-semibold flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
                title="Simpan status Matriks CAPA Terbentuk ini di database SIMONCER"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    <span>Simpan Matriks</span>
                  </>
                )}
              </button>
            )}

            {/* Srikandi Workflow Button */}
            {onOpenSrikandiWorkflow && (
              <button
                type="button"
                onClick={onOpenSrikandiWorkflow}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Buka Jembatan Evaluasi: Unduh Matriks, Draf Surat Pengantar, dan Catat Naskah TTE SRIKANDI"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Jembatan TTE SRIKANDI</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-slate-700 hover:text-[#1e3a5f] rounded-lg font-semibold flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
              title="Cetak Matriks Dokumen CAPA Resmi"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Official Header Section (Formatted like Indonesian Government Document) */}
      <div className="p-4 sm:p-8 space-y-6">
        
        {/* Document Title Header */}
        {showHeaderMeta && (
          <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
            <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase block">
              Formulir Pemantauan & Evaluasi Tindak Lanjut BBPOM di Semarang
            </span>
            <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight uppercase text-slate-900 font-serif">
              {config.title}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Acuan: {config.codeStandard} • Kode Unik Sesi: <strong className="font-mono text-emerald-800">{inspection.capaCode}</strong>
            </p>
          </div>
        )}

        {/* Metadata Block */}
        {showHeaderMeta && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs border border-slate-200 bg-slate-50/70 p-4 rounded-xl">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-44 text-slate-600 font-semibold">{config.headerFields[0]?.label || 'Nama Sarana'}</span>
                <span className="font-bold text-slate-900">: {inspection.facility.name}</span>
              </div>
              <div className="flex">
                <span className="w-44 text-slate-600 font-semibold">{config.headerFields[1]?.label || 'Alamat'}</span>
                <span className="text-slate-800">: {inspection.facility.address}</span>
              </div>
              <div className="flex">
                <span className="w-44 text-slate-600 font-semibold">Izin Sarana / NIB</span>
                <span className="font-mono font-medium text-slate-800">: {inspection.facility.licenseNo}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-44 text-slate-600 font-semibold">{config.headerFields[2]?.label || 'Tujuan Pemeriksaan'}</span>
                <span className="text-slate-800">: {inspection.inspectionScope}</span>
              </div>
              <div className="flex">
                <span className="w-44 text-slate-600 font-semibold">{config.headerFields[3]?.label || 'Tanggal Pemeriksaan'}</span>
                <span className="text-slate-800">: {formatIndonesianDate(inspection.inspectionDate)}</span>
              </div>
              <div className="flex">
                <span className="w-44 text-slate-600 font-semibold">Surat SRIKANDI (TTE)</span>
                <span className="font-mono text-slate-800">: {inspection.srikandiLetter.letterNo}</span>
              </div>
            </div>
          </div>
        )}

        {/* THE OFFICIAL MATRIX TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              {/* Top Row Headers */}
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                {activeColumns.map((col) => {
                  if (col.subColumns && col.subColumns.length > 0) {
                    return (
                      <th
                        key={col.id}
                        colSpan={col.subColumns.length}
                        className={`p-2.5 border-r border-slate-300 font-bold ${col.width || ''}`}
                      >
                        {col.label}
                      </th>
                    );
                  }
                  return (
                    <th
                      key={col.id}
                      rowSpan={activeColumns.some((c) => c.subColumns) ? 2 : 1}
                      className={`p-2.5 border-r border-slate-300 font-bold last:border-r-0 ${col.width || ''}`}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>

              {/* Sub-row for nested columns (e.g. CA and PA) */}
              {activeColumns.some((c) => c.subColumns) && (
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-300 text-center text-[11px]">
                  {activeColumns.map((col) => {
                    if (col.subColumns && col.subColumns.length > 0) {
                      return col.subColumns.map((sub) => (
                        <th
                          key={sub.id}
                          className="p-2 border-r border-slate-300"
                        >
                          {sub.label}
                        </th>
                      ));
                    }
                    return null;
                  })}
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200">
              {inspection.findings.map((finding, idx) => (
                <tr
                  key={finding.id || idx}
                  onClick={() => onEditFinding && onEditFinding(finding, idx)}
                  className={`hover:bg-slate-50/80 transition-colors align-top ${
                    onEditFinding ? 'cursor-pointer' : ''
                  }`}
                >
                  {activeColumns.map((col) => renderCellContent(col, finding, idx))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Petunjuk Pengisian / Keterangan Resmi */}
        {config.notes && config.notes.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Petunjuk Pengisian & Keterangan Matriks CAPA Resmi:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {config.notes.map((note, nIdx) => (
                <p key={nIdx} className="leading-relaxed">
                  {note}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Tanda Tangan Resmi Pengesahan */}
        {showSignatures && (
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-900 font-serif">
            <div className="space-y-16">
              <p className="font-semibold text-slate-700">{config.signatureLeft}</p>
              <div className="space-y-0.5">
                <p className="font-bold underline text-slate-900 font-sans">
                  {inspection.facility.picName}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  Penanggung Jawab Sarana
                </p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-semibold text-slate-700">{config.signatureRight}</p>
              <div className="space-y-0.5">
                <p className="font-bold underline text-slate-900 font-sans">
                  {inspection.assignedOfficer?.name || inspection.leadAuditor}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  NIP: {inspection.assignedOfficer?.nip || '198004122005011002'}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
