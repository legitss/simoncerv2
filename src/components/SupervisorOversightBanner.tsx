import React from 'react';
import { InspectionSession, AuthAccount } from '../types';
import { 
  Award, 
  ShieldCheck, 
  Clock, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Printer, 
  Eye,
  Filter
} from 'lucide-react';
import { calculateRemainingDays } from '../utils/date';

interface SupervisorOversightBannerProps {
  inspections: InspectionSession[];
  currentUser: AuthAccount | null;
  onFilterChange: (filter: string) => void;
  onOpenPrintReport: () => void;
}

export const SupervisorOversightBanner: React.FC<SupervisorOversightBannerProps> = ({
  inspections,
  currentUser,
  onFilterChange,
  onOpenPrintReport,
}) => {
  // Compute supervisory stats
  const total = inspections.length;
  const inEvaluation = inspections.filter(
    (i) => i.status === 'CAPA_TERKIRIM' || i.status === 'MASIH_EVALUASI'
  ).length;
  const completed = inspections.filter(
    (i) => i.status === 'TERVALIDASI' || i.status === 'SELESAI_CLOSED'
  ).length;
  const needsRevision = inspections.filter((i) => i.status === 'PERLU_PERBAIKAN').length;

  const nearDeadlineH7 = inspections.filter((i) => {
    if (i.status === 'SELESAI_CLOSED' || i.status === 'TERVALIDASI') return false;
    const sla = calculateRemainingDays(i.srikandiLetter.deadlineDate);
    return !sla.isOverdue && sla.days <= 7;
  }).length;

  const overdue = inspections.filter((i) => {
    if (i.status === 'SELESAI_CLOSED' || i.status === 'TERVALIDASI') return false;
    const sla = calculateRemainingDays(i.srikandiLetter.deadlineDate);
    return sla.isOverdue;
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white border border-purple-500/30 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Supervisor Identity & Role */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Mode Supervisi Pimpinan Balai
              </span>
              <span className="text-[11px] font-mono text-purple-200/80">
                BBPOM di Semarang
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white mt-0.5">
              {currentUser?.name || 'Dr. apt. Hendrawan Kusuma, M.Si'}
            </h3>
            <p className="text-xs text-slate-300">
              {currentUser?.position || 'Kepala Balai Besar Pengawas Obat dan Makanan (Supervisor)'}
            </p>
          </div>
        </div>

        {/* Right: Quick Supervisory Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenPrintReport}
            className="px-3.5 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Cetak Rekapitulasi Laporan Pengawasan Terpadu & Audit Trail"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap Laporan</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('EVALUASI')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tinjau Sesi Evaluasi ({inEvaluation})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-purple-900/50">
        
        {/* Completion Rate */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-purple-500/20">
          <span className="text-[10px] text-purple-300 block font-semibold">Tingkat Penyelesaian CAPA</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-white">{completionRate}%</span>
            <span className="text-[11px] text-slate-400">({completed}/{total})</span>
          </div>
        </div>

        {/* Pending Evaluation */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-purple-500/20">
          <span className="text-[10px] text-purple-300 block font-semibold">Menunggu Evaluasi Petugas</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-amber-300">{inEvaluation}</span>
            <span className="text-[11px] text-slate-400">Sarana</span>
          </div>
        </div>

        {/* Near Deadline H-7 */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-purple-500/20">
          <span className="text-[10px] text-purple-300 block font-semibold">Peringatan H-7 (Auto-WA)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-yellow-400">{nearDeadlineH7}</span>
            <span className="text-[11px] text-slate-400">Mendekati Deadline</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-purple-500/20">
          <span className="text-[10px] text-purple-300 block font-semibold">Terlambat SLA Batas Waktu</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl sm:text-2xl font-black ${overdue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {overdue}
            </span>
            <span className="text-[11px] text-slate-400">Sarana</span>
          </div>
        </div>

      </div>
    </div>
  );
};
