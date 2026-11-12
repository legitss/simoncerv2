import React, { useState } from 'react';
import { InspectionSession } from '../types';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Send,
  Eye,
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
  isInternalUser?: boolean;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  inspections,
  onSelectInspection,
  onSubmitCapa,
  initialCode,
  isInternalUser = false,
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

  const trimmed = searchQuery.trim().toLowerCase();
  const matchedInspection = trimmed
    ? inspections.find((ins) => {
        if (isInternalUser) {
          return (
            ins.capaCode.toLowerCase().includes(trimmed) ||
            ins.facility.name.toLowerCase().includes(trimmed) ||
            ins.srikandiLetter.letterNo.toLowerCase().includes(trimmed)
          );
        }
        return (
          ins.capaCode.toLowerCase() === trimmed ||
          ins.srikandiLetter.letterNo.toLowerCase() === trimmed ||
          ins.capaCode.toLowerCase().includes(trimmed)
        );
      })
    : null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bpom-header-navy p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/15 text-[#86efac] border border-white/25">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Lacak Status & Progres CAPA Real-Time
              </h2>
              <p className="text-xs text-blue-100">
                Ketikkan Kode Unik CAPA atau Nomor Surat SRIKANDI untuk melacak riwayat dan progres perbaikan
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="p-6 bg-[#f0f6fc] border-b border-blue-200/80">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="Masukkan Kode Unik CAPA atau Nomor Surat SRIKANDI..."
              className="w-full pl-12 pr-28 py-3.5 bg-white border-2 border-blue-200 focus:border-[#2b4c7e] rounded-xl text-slate-900 font-mono font-semibold placeholder-slate-400 text-sm transition-all focus:outline-hidden"
            />
            <Search className="w-5 h-5 text-[#2b4c7e] absolute left-4 top-4" />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 bg-[#2e8b75] hover:bg-[#24705e] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Lacak</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Result Area */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {matchedInspection ? (
            <div className="space-y-6">
              {/* Facility & Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#2b4c7e] text-white">
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
                  <CheckCircle2 className="w-4 h-4 text-[#2e8b75]" />
                  Alur Progres Pemeriksaan & Validasi CAPA
                </h4>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Pemeriksaan Petugas */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2e8b75] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        1. Pemeriksaan Fisik Lapangan Dilaksanakan
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tanggal: {formatIndonesianDate(matchedInspection.inspectionDate)}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Surat Tindak Lanjut SRIKANDI TTE */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2e8b75] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
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
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2e8b75] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        3. Pengisian Survei SIBERGAS & Dokumen CAPA
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {matchedInspection.sibergasSurvey?.completed
                          ? `Survei integritas SIBERGAS telah diisi lengkap.`
                          : 'Wajib mengisi Survei Integritas Petugas (SIBERGAS) terlebih dahulu sebelum dapat mengirimkan CAPA pertama.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Evaluasi Petugas */}
                  <div className="relative">
                    {matchedInspection.status === 'MASIH_EVALUASI' || matchedInspection.status === 'CAPA_TERKIRIM' || matchedInspection.status === 'EVALUASI_PETUGAS' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-purple-100 animate-pulse">
                        4
                      </div>
                    ) : matchedInspection.status === 'PERLU_PERBAIKAN' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-rose-100">
                        !
                      </div>
                    ) : matchedInspection.status === 'TERVALIDASI' || matchedInspection.status === 'SELESAI_CLOSED' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2e8b75] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                    ) : (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        4
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        4. Evaluasi & Verifikasi oleh Evaluator Balai POM
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {matchedInspection.status === 'CAPA_TERKIRIM' || matchedInspection.status === 'EVALUASI_PETUGAS'
                          ? 'Dokumen CAPA telah diterima sistem dan sedang dalam proses verifikasi petugas.'
                          : matchedInspection.status === 'MASIH_EVALUASI'
                          ? 'Sedang ditelaah intensif oleh evaluator Balai POM.'
                          : matchedInspection.status === 'PERLU_PERBAIKAN'
                          ? 'Perlu Perbaikan: Bukti/tindakan belum memadai, perusahaan diminta melakukan revisi.'
                          : matchedInspection.status === 'TERVALIDASI' || matchedInspection.status === 'SELESAI_CLOSED'
                          ? 'Tervalidasi & disetujui memadai oleh evaluator Balai POM.'
                          : 'Menunggu penyerahan berkas CAPA dari perusahaan.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Selesai / Closed */}
                  <div className="relative">
                    {matchedInspection.status === 'SELESAI_CLOSED' || matchedInspection.status === 'TERVALIDASI' ? (
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2e8b75] text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-emerald-100">
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

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    onClose();
                    onSubmitCapa(matchedInspection);
                  }}
                  type="button"
                  className="px-4 py-2.5 bg-[#2e8b75] hover:bg-[#24705e] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {matchedInspection.sibergasSurvey?.completed ? (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Buka & Ajukan Matriks CAPA</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Isi Survei SIBERGAS & Ajukan CAPA →</span>
                    </>
                  )}
                </button>

                {/* Tombol Berkas Internal HANYA tampil jika sudah login sebagai Petugas Internal */}
                {isInternalUser && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectInspection(matchedInspection);
                    }}
                    type="button"
                    className="px-4 py-2.5 bg-[#233d63] hover:bg-[#2b4c7e] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka Berkas Internal Lengkap</span>
                  </button>
                )}
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
                Pastikan Kode Unik CAPA atau Nomor Surat SRIKANDI yang Anda masukkan sesuai dengan surat resmi perusahaan Anda.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 px-4 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">
                Ketikkan Kode Unik CAPA perusahaan Anda di atas untuk melihat progres secara langsung
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
