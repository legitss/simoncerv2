import React, { useState } from 'react';
import { InspectionSession } from '../types';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ArrowRight, 
  Building2, 
  Calendar,
  Send,
  Eye,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import { 
  getStatusBadgeConfig, 
  calculateRemainingDays, 
  formatIndonesianDate 
} from '../utils/date';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspections: InspectionSession[];
  onSelectInspection: (inspection: InspectionSession) => void;
  onSubmitCapa: (inspection: InspectionSession) => void;
  initialCode?: string;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  inspections,
  onSelectInspection,
  onSubmitCapa,
  initialCode,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialCode || '');
  const [hasSearched, setHasSearched] = useState(Boolean(initialCode));

  React.useEffect(() => {
    if (initialCode) {
      setSearchQuery(initialCode);
      setHasSearched(true);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  // Filter based on unique CAPA code, facility name, or letter number
  const trimmed = searchQuery.trim().toLowerCase();
  const matchedInspection = trimmed
    ? inspections.find(
        (ins) =>
          ins.capaCode.toLowerCase().includes(trimmed) ||
          ins.facility.name.toLowerCase().includes(trimmed) ||
          ins.srikandiLetter.letterNo.toLowerCase().includes(trimmed)
      )
    : null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleQuickPick = (code: string) => {
    setSearchQuery(code);
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Lacak Status & Progres CAPA Real-Time
              </h2>
              <p className="text-xs text-slate-300">
                Ketikkan kode unik CAPA atau nama sarana untuk melacak riwayat dan progres detail perbaikan
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="Contoh: CAPA-2026-SRN01 atau nama perusahaan..."
              className="w-full pl-12 pr-28 py-3.5 bg-white border-2 border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-slate-900 font-medium placeholder-slate-400 text-sm transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Lacak</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500">Coba kode cepat:</span>
            {inspections.slice(0, 4).map((ins) => (
              <button
                key={ins.id}
                onClick={() => handleQuickPick(ins.capaCode)}
                type="button"
                className="text-[11px] font-mono font-medium px-2 py-1 rounded-md bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 transition-colors shadow-2xs"
              >
                {ins.capaCode}
              </button>
            ))}
          </div>
        </div>

        {/* Result Area */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {matchedInspection ? (
            <div className="space-y-6">
              {/* Facility & Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {matchedInspection.capaCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                      {matchedInspection.facility.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    {matchedInspection.facility.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Surat SRIKANDI: <span className="font-mono">{matchedInspection.srikandiLetter.letterNo}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  {(() => {
                    const badge = getStatusBadgeConfig(matchedInspection.status);
                    const sla = calculateRemainingDays(matchedInspection.srikandiLetter.deadlineDate);
                    return (
                      <div className="flex flex-col sm:items-end gap-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                        {matchedInspection.status !== 'SELESAI_CLOSED' && (
                          <span
                            className={`text-xs font-medium flex items-center gap-1 ${
                              sla.isOverdue ? 'text-red-600 font-bold' : 'text-amber-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {sla.text} (Batas: {formatIndonesianDate(matchedInspection.srikandiLetter.deadlineDate)})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Step by Step Timeline Progress */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Alur Progres Pemeriksaan & Validasi CAPA
                </h4>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Pemeriksaan Petugas */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        1. Pemeriksaan Fisik Lapangan Dilaksanakan
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tanggal: {formatIndonesianDate(matchedInspection.inspectionDate)} oleh {matchedInspection.leadAuditor}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Surat Tindak Lanjut SRIKANDI TTE */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        2. Surat Tindak Lanjut SRIKANDI (TTE Resmi BSrE)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        No: {matchedInspection.srikandiLetter.letterNo} | Notifikasi WA & Email telah terkirim
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Pengisian Survei SIBERGAS & Penyerahan CAPA */}
                  <div className="relative">
                    {matchedInspection.status === 'MENUNGGU_CAPA' || matchedInspection.status === 'SURAT_TERBIT' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[10px] font-bold ring-4 ring-amber-100 animate-pulse">
                        3
                      </div>
                    ) : (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        3. Pengisian Survei SIBERGAS & Dokumen CAPA
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {matchedInspection.sibergasSurvey?.completed
                          ? `Survei integritas SIBERGAS telah diisi lengkap. ${matchedInspection.findings.some((f) => f.capa.submittedAt) ? `Dokumen CAPA terkirim pada ${formatIndonesianDate(matchedInspection.findings[0].capa.submittedAt)} (${matchedInspection.findings.reduce((acc, f) => acc + f.capa.evidenceFiles.length, 0)} berkas).` : 'Menunggu pengunggahan berkas bukti CAPA.'}`
                          : 'Wajib mengisi Survei Integritas Petugas (SIBERGAS) terlebih dahulu sebelum dapat mengirimkan CAPA pertama.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Evaluasi Petugas */}
                  <div className="relative">
                    {matchedInspection.status === 'MASIH_EVALUASI' || matchedInspection.status === 'CAPA_TERKIRIM' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-purple-100 animate-pulse">
                        4
                      </div>
                    ) : matchedInspection.status === 'PERLU_PERBAIKAN' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-rose-100">
                        !
                      </div>
                    ) : matchedInspection.status === 'TERVALIDASI' || matchedInspection.status === 'SELESAI_CLOSED' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        4
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        4. Evaluasi & Verifikasi oleh Petugas / Evaluator PIC ({matchedInspection.assignedOfficer?.name || matchedInspection.leadAuditor})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {matchedInspection.status === 'CAPA_TERKIRIM'
                          ? `Dokumen CAPA diterima sistem, masuk antrean verifikasi ${matchedInspection.assignedOfficer?.name || matchedInspection.leadAuditor}`
                          : matchedInspection.status === 'MASIH_EVALUASI'
                          ? `Sedang ditelaah intensif oleh ${matchedInspection.assignedOfficer?.name || matchedInspection.leadAuditor}`
                          : matchedInspection.status === 'PERLU_PERBAIKAN'
                          ? 'Perlu Perbaikan: Bukti/tindakan belum memadai, sarana diminta merevisi'
                          : matchedInspection.status === 'TERVALIDASI' || matchedInspection.status === 'SELESAI_CLOSED'
                          ? `Tervalidasi & disetujui memadai oleh ${matchedInspection.assignedOfficer?.name || matchedInspection.leadAuditor}`
                          : `Penugasan verifikator: ${matchedInspection.assignedOfficer?.name || matchedInspection.leadAuditor}`}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Selesai / Closed */}
                  <div className="relative">
                    {matchedInspection.status === 'SELESAI_CLOSED' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-emerald-100">
                        ✓
                      </div>
                    ) : (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                        5
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        5. Status Akhir: Tervalidasi & Selesai (Closed)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {matchedInspection.status === 'SELESAI_CLOSED'
                          ? `Pemeriksaan selesai tuntas. Berita Acara: ${matchedInspection.evaluationReport?.reportNo || 'Telah terbit'}`
                          : 'Proses penutupan sesi pemeriksaan'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Temuan Overview */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Daftar Temuan Ketidaksesuaian ({matchedInspection.findings.length} Butir)
                </h4>
                <div className="space-y-2">
                  {matchedInspection.findings.map((f, idx) => (
                    <div
                      key={f.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-800">
                          Temuan #{idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.category === 'KRITIS'
                              ? 'bg-red-100 text-red-700'
                              : f.category === 'MAYOR'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {f.category}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-2">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SIBERGAS Integrity Survey Notice if not yet filled */}
              {(matchedInspection.status === 'MENUNGGU_CAPA' || matchedInspection.status === 'SURAT_TERBIT' || matchedInspection.status === 'PERLU_PERBAIKAN') && (
                matchedInspection.sibergasSurvey?.completed ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Survei Integritas Petugas (SIBERGAS) telah selesai diisi</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">Tercatat Audit</span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Prasyarat Wajib Sebelum Kirim CAPA Pertama:</p>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        Sarana belum mengisi Survei Integritas Petugas (SIBERGAS). Sebelum formulir dan berkas CAPA dapat diunggah, sarana wajib menyelesaikan 7 butir kuesioner SIBERGAS terlebih dahulu.
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
                {(matchedInspection.status === 'MENUNGGU_CAPA' ||
                  matchedInspection.status === 'PERLU_PERBAIKAN' ||
                  matchedInspection.status === 'SURAT_TERBIT') && (
                  matchedInspection.sibergasSurvey?.completed ? (
                    <button
                      onClick={() => {
                        onClose();
                        onSubmitCapa(matchedInspection);
                      }}
                      type="button"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Kirim / Perbaiki Dokumen CAPA
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onSubmitCapa(matchedInspection);
                      }}
                      type="button"
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Wajib Isi Survei SIBERGAS Dahulu →</span>
                    </button>
                  )
                )}
                <button
                  onClick={() => {
                    onClose();
                    onSelectInspection(matchedInspection);
                  }}
                  type="button"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Buka Berkas & Riwayat Lengkap
                </button>
              </div>
            </div>
          ) : hasSearched && trimmed ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Kode CAPA Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pastikan kode unik yang Anda masukkan sesuai format (contoh:{' '}
                <span className="font-mono font-semibold">CAPA-2026-SRN01</span>)
                atau cari berdasarkan nama sarana.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 px-4 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">
                Ketikkan kode unik di atas untuk menampilkan detail alur CAPA secara langsung
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
