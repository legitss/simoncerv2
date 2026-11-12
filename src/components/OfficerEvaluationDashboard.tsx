import React from 'react';
import { InspectionSession, AuthAccount } from '../types';
import { 
  UserCheck, 
  FileCheck2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Flame, 
  ArrowRight, 
  Building2, 
  Layers, 
  FileText,
  Filter,
  Check
} from 'lucide-react';
import { formatIndonesianDate } from '../utils/date';
import { isCapaPendingEvaluation } from '../utils/csvExport';

interface OfficerEvaluationDashboardProps {
  inspections: InspectionSession[];
  currentUser?: AuthAccount | null;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  isOfficerOnlyFilter: boolean;
  onToggleOfficerFilter: () => void;
  totalAllInspectionsCount: number;
  onSelectInspection: (inspection: InspectionSession) => void;
  onOpenEvaluation: (inspection: InspectionSession) => void;
  onOpenTracking: () => void;
}

export const OfficerEvaluationDashboard: React.FC<OfficerEvaluationDashboardProps> = ({
  inspections,
  currentUser,
  activeFilter,
  onFilterChange,
  isOfficerOnlyFilter,
  onToggleOfficerFilter,
  totalAllInspectionsCount,
  onSelectInspection,
  onOpenEvaluation,
  onOpenTracking,
}) => {
  // 1. Identify incoming CAPA ready for review (CAPA_TERKIRIM, EVALUASI_PETUGAS, MASIH_EVALUASI or pending evaluation)
  const incomingCapaList = inspections.filter(
    (ins) => ins.status === 'CAPA_TERKIRIM' || ins.status === 'EVALUASI_PETUGAS' || ins.status === 'MASIH_EVALUASI' || isCapaPendingEvaluation(ins)
  );

  // 2. Count statistics for simple cards
  const totalCount = inspections.length;
  const inEvaluationCount = incomingCapaList.length;
  const waitingSaranaCount = inspections.filter(
    (i) => i.status === 'MENUNGGU_CAPA' || i.status === 'SURAT_TERBIT'
  ).length;
  const needRevisionCount = inspections.filter(
    (i) => i.status === 'PERLU_PERBAIKAN'
  ).length;
  const closedCount = inspections.filter(
    (i) => i.status === 'SELESAI_CLOSED' || i.status === 'TERVALIDASI'
  ).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Workspace Petugas (Tanpa Tombol Upload SRIKANDI!) */}
      <div className="bpom-hero-gradient rounded-2xl p-5 sm:p-6 text-[#1e3a5f] shadow-md border border-teal-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-800 border border-teal-500/40 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Workspace Petugas Evaluator • BBPOM di Semarang</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1e3a5f] flex items-center gap-2 flex-wrap">
              <span>Selamat Bertugas,</span>
              <span className="text-teal-800">{currentUser?.name || 'Petugas Evaluator'}</span>
            </h1>

            <p className="text-xs text-slate-700 leading-relaxed">
              Fokus tugas Anda adalah <strong>menelaah berkas perbaikan (CAPA) yang masuk dari sarana</strong>, memvalidasi bukti temuan teknis (Memadai / Belum Memadai), dan mengunduh matriks lampiran resmi.
            </p>

            {currentUser?.nip && (
              <div className="flex items-center gap-3 text-[11px] text-teal-800 font-mono">
                <span>NIP. {currentUser.nip}</span>
                <span>•</span>
                <span>{currentUser.position || 'Pengawas Farmasi & Makanan'}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            {/* Tombol Lacak Kode CAPA */}
            <button
              onClick={onOpenTracking}
              type="button"
              className="px-4 py-2.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-xl font-semibold text-xs border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-teal-700" />
              <span>Lacak Kode Unik CAPA</span>
            </button>

            {/* Toggle Penugasan Saya vs Seluruh Balai */}
            <button
              onClick={onToggleOfficerFilter}
              type="button"
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                isOfficerOnlyFilter
                  ? 'bg-teal-600 hover:bg-teal-500 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200'
              }`}
              title="Beralih antara menampilkan hanya penugasan Anda atau seluruh data balai"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {isOfficerOnlyFilter ? `Tugas Saya Saja (${totalCount})` : `Semua Balai (${totalAllInspectionsCount})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SOROTAN KHUSUS: CAPA MASUK YANG PERLU DITELAAH SEGERA */}
      {incomingCapaList.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#eef2ff] via-[#f5f3ff] to-[#e0f2fe] rounded-2xl border-2 border-purple-400/50 shadow-lg text-[#1e3a5f] space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Flame className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-[#1e3a5f]">
                    Sorotan CAPA Masuk: {incomingCapaList.length} Sarana Menunggu Evaluasi Anda
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Perlu Ditelaah
                  </span>
                </div>
                <p className="text-xs text-purple-800 mt-0.5">
                  Sarana telah mengirimkan berkas bukti perbaikan. Mohon lakukan evaluasi teknis pada butir temuan terkait.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onFilterChange(activeFilter === 'EVALUASI' ? 'ALL' : 'EVALUASI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'EVALUASI'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-purple-100 hover:bg-purple-700 text-white border border-purple-500/50'
              }`}
            >
              <span>{activeFilter === 'EVALUASI' ? 'Tampilkan Semua' : 'Filter CAPA Masuk Saja'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List of Incoming CAPA items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {incomingCapaList.slice(0, 4).map((ins) => {
              const pendingItemsCount = ins.findings.filter((f) => f.capa.evaluationStatus !== 'MEMADAI').length;
              return (
                <div
                  key={`spotlight-${ins.id}`}
                  className="p-3.5 rounded-xl bg-white/95 border border-purple-500/40 hover:border-purple-400 flex flex-col justify-between gap-2.5 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">
                          {ins.capaCode}
                        </span>
                        <span className="text-[10px] text-purple-800 font-semibold truncate max-w-[140px]">
                          {ins.facility.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#1e3a5f] text-xs line-clamp-1">
                        {ins.facility.name}
                      </h4>
                      <p className="text-[11px] text-slate-700">
                        {ins.findings.length} Butir Temuan •{' '}
                        <strong className="text-amber-800">{pendingItemsCount} butir belum disetujui</strong>
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2 py-1 rounded border border-purple-200 shrink-0">
                      {formatIndonesianDate(ins.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
                    <button
                      type="button"
                      onClick={() => onSelectInspection(ins)}
                      className="text-[11px] text-purple-800 hover:text-[#1e3a5f] font-semibold cursor-pointer"
                    >
                      Lihat Rincian Sesi →
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEvaluation(ins)}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Telaah CAPA Ini</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. KARTU FILTER TUGAS RINGKAS (MENGGANTIKAN GRAFIK STATISTIK KOMPLEKS) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        
        {/* 1. CAPA Masuk / Siap Ditelaah */}
        <button
          type="button"
          onClick={() => onFilterChange('EVALUASI')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeFilter === 'EVALUASI'
              ? 'bg-purple-900 text-white border-purple-500 shadow-md ring-2 ring-purple-400'
              : 'bg-white hover:bg-purple-50/50 text-slate-800 border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'EVALUASI' ? 'text-purple-800' : 'text-purple-700'}`}>
              CAPA Masuk
            </span>
            <span className={`p-1 rounded-lg ${activeFilter === 'EVALUASI' ? 'bg-purple-800 text-amber-800' : 'bg-purple-100 text-purple-700'}`}>
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-extrabold ${activeFilter === 'EVALUASI' ? 'text-white' : 'text-purple-900'}`}>
              {inEvaluationCount}
            </span>
            <span className={`text-[10px] block truncate ${activeFilter === 'EVALUASI' ? 'text-purple-800' : 'text-slate-500'}`}>
              Perlu Telaah Evaluator
            </span>
          </div>
        </button>

        {/* 2. Menunggu CAPA Sarana */}
        <button
          type="button"
          onClick={() => onFilterChange('MENUNGGU_CAPA')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeFilter === 'MENUNGGU_CAPA'
              ? 'bg-amber-900 text-white border-amber-500 shadow-md ring-2 ring-amber-400'
              : 'bg-white hover:bg-amber-50/50 text-slate-800 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'MENUNGGU_CAPA' ? 'text-amber-800' : 'text-amber-700'}`}>
              Menunggu Sarana
            </span>
            <span className={`p-1 rounded-lg ${activeFilter === 'MENUNGGU_CAPA' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-700'}`}>
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-extrabold ${activeFilter === 'MENUNGGU_CAPA' ? 'text-white' : 'text-amber-900'}`}>
              {waitingSaranaCount}
            </span>
            <span className={`text-[10px] block truncate ${activeFilter === 'MENUNGGU_CAPA' ? 'text-amber-800' : 'text-slate-500'}`}>
              Belum Kirim CAPA
            </span>
          </div>
        </button>

        {/* 3. Perlu Perbaikan / Revisi */}
        <button
          type="button"
          onClick={() => onFilterChange('PERLU_PERBAIKAN')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeFilter === 'PERLU_PERBAIKAN'
              ? 'bg-rose-900 text-white border-rose-500 shadow-md ring-2 ring-rose-400'
              : 'bg-white hover:bg-rose-50/50 text-slate-800 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'PERLU_PERBAIKAN' ? 'text-rose-200' : 'text-rose-700'}`}>
              Perlu Revisi
            </span>
            <span className={`p-1 rounded-lg ${activeFilter === 'PERLU_PERBAIKAN' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-700'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-extrabold ${activeFilter === 'PERLU_PERBAIKAN' ? 'text-white' : 'text-rose-900'}`}>
              {needRevisionCount}
            </span>
            <span className={`text-[10px] block truncate ${activeFilter === 'PERLU_PERBAIKAN' ? 'text-rose-200' : 'text-slate-500'}`}>
              Menunggu Revisi Sarana
            </span>
          </div>
        </button>

        {/* 4. Tervalidasi / Selesai */}
        <button
          type="button"
          onClick={() => onFilterChange('CLOSED')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeFilter === 'CLOSED'
              ? 'bg-emerald-900 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'CLOSED' ? 'text-emerald-200' : 'text-emerald-700'}`}>
              Selesai / Close
            </span>
            <span className={`p-1 rounded-lg ${activeFilter === 'CLOSED' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-extrabold ${activeFilter === 'CLOSED' ? 'text-white' : 'text-emerald-900'}`}>
              {closedCount}
            </span>
            <span className={`text-[10px] block truncate ${activeFilter === 'CLOSED' ? 'text-emerald-200' : 'text-slate-500'}`}>
              CAPA Closed Sah
            </span>
          </div>
        </button>

        {/* 5. Semua Penugasan */}
        <button
          type="button"
          onClick={() => onFilterChange('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeFilter === 'ALL'
              ? 'bg-white text-white border-blue-200 shadow-md ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'ALL' ? 'text-slate-700' : 'text-slate-500'}`}>
              Total Sesi
            </span>
            <span className={`p-1 rounded-lg ${activeFilter === 'ALL' ? 'bg-[#e8f1fb] text-white' : 'bg-slate-100 text-slate-700'}`}>
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-extrabold ${activeFilter === 'ALL' ? 'text-white' : 'text-slate-900'}`}>
              {totalCount}
            </span>
            <span className={`text-[10px] block truncate ${activeFilter === 'ALL' ? 'text-slate-700' : 'text-slate-500'}`}>
              {isOfficerOnlyFilter ? 'Penugasan Saya' : 'Semua Balai'}
            </span>
          </div>
        </button>

      </div>
    </div>
  );
};
