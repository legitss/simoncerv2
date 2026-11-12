import React, { useState, useMemo } from 'react';
import { InspectionSession, FindingItem, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  FileText, 
  ExternalLink, 
  Filter, 
  BarChart3, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Layers, 
  Download, 
  FileCheck2, 
  Calendar, 
  User, 
  Sparkles, 
  TrendingUp, 
  Info,
  FolderOpen,
  Eye,
  RefreshCw
} from 'lucide-react';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';
import { calculateRemainingDays, getStatusBadgeConfig } from '../utils/date';

export interface InteractiveFindingsDashboardProps {
  inspections: InspectionSession[];
  currentRole: UserRole;
  onSelectInspection: (inspection: InspectionSession) => void;
  onOpenMatrix: (inspection: InspectionSession) => void;
  onOpenDocumentManager: (inspectionId?: string) => void;
}

export type FindingStatusCategory = 'ALL' | 'BARU' | 'PROSES' | 'TERVALIDASI' | 'DITUTUP';

export const InteractiveFindingsDashboard: React.FC<InteractiveFindingsDashboardProps> = ({
  inspections,
  currentRole,
  onSelectInspection,
  onOpenMatrix,
  onOpenDocumentManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusCategory, setSelectedStatusCategory] = useState<FindingStatusCategory>('ALL');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [selectedFindingCriticality, setSelectedFindingCriticality] = useState<string>('ALL');
  const [selectedInspectCode, setSelectedInspectCode] = useState<string | null>(null);

  const stats = useMemo(() => {
    let totalSessions = inspections.length;
    let totalFindings = 0;
    let findingsBaru = 0;
    let findingsProses = 0;
    let findingsTervalidasi = 0;
    let findingsDitutup = 0;

    let criticalCount = 0;
    let majorCount = 0;
    let minorCount = 0;

    let totalEvidenceFiles = 0;

    inspections.forEach((session) => {
      const findings = session.findings || [];
      totalFindings += findings.length;

      findings.forEach((f) => {
        const crit = (f.category || 'MAYOR').toUpperCase();
        if (crit.includes('KRITIS') || crit.includes('CRITICAL')) criticalCount++;
        else if (crit.includes('MAYOR') || crit.includes('MAJOR')) majorCount++;
        else minorCount++;

        totalEvidenceFiles += f.capa?.evidenceFiles?.length || 0;

        if (session.status === 'SELESAI_CLOSED') {
          findingsDitutup++;
        } else if (session.status === 'TERVALIDASI' || f.capa?.evaluationStatus === 'MEMADAI') {
          findingsTervalidasi++;
        } else if (
          session.status === 'EVALUASI_PETUGAS' || 
          session.status === 'MASIH_EVALUASI' || 
          session.status === 'CAPA_TERKIRIM' || 
          session.status === 'PERLU_PERBAIKAN'
        ) {
          findingsProses++;
        } else {
          findingsBaru++;
        }
      });
    });

    const closureRate = totalFindings > 0 ? Math.round((findingsDitutup / totalFindings) * 100) : 0;
    const progressRate = totalFindings > 0 ? Math.round(((findingsTervalidasi + findingsDitutup) / totalFindings) * 100) : 0;

    return {
      totalSessions,
      totalFindings,
      findingsBaru,
      findingsProses,
      findingsTervalidasi,
      findingsDitutup,
      criticalCount,
      majorCount,
      minorCount,
      totalEvidenceFiles,
      closureRate,
      progressRate,
    };
  }, [inspections]);

  const commodities = useMemo(() => {
    const set = new Set<string>();
    inspections.forEach((ins) => {
      if (ins.facility?.type) set.add(ins.facility.type);
    });
    return Array.from(set);
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return inspections.filter((ins) => {
      const matchSearch = 
        !q ||
        ins.capaCode.toLowerCase().includes(q) ||
        ins.facility.name.toLowerCase().includes(q) ||
        (ins.srikandiLetter?.letterNo || '').toLowerCase().includes(q) ||
        (ins.assignedOfficer?.name || '').toLowerCase().includes(q) ||
        (ins.leadAuditor || '').toLowerCase().includes(q) ||
        ins.findings.some(f => 
          (f.description || '').toLowerCase().includes(q) || 
          (f.clause || '').toLowerCase().includes(q) ||
          (f.capa?.correctiveAction || '').toLowerCase().includes(q)
        );

      if (!matchSearch) return false;

      if (selectedStatusCategory !== 'ALL') {
        if (selectedStatusCategory === 'BARU') {
          if (ins.status !== 'MENUNGGU_CAPA' && ins.status !== 'SURAT_TERBIT') return false;
        } else if (selectedStatusCategory === 'PROSES') {
          if (
            ins.status !== 'EVALUASI_PETUGAS' && 
            ins.status !== 'MASIH_EVALUASI' && 
            ins.status !== 'CAPA_TERKIRIM' && 
            ins.status !== 'PERLU_PERBAIKAN'
          ) return false;
        } else if (selectedStatusCategory === 'TERVALIDASI') {
          if (ins.status !== 'TERVALIDASI') return false;
        } else if (selectedStatusCategory === 'DITUTUP') {
          if (ins.status !== 'SELESAI_CLOSED') return false;
        }
      }

      if (selectedCommodity !== 'ALL' && ins.facility.type !== selectedCommodity) {
        return false;
      }

      if (selectedFindingCriticality !== 'ALL') {
        const hasCrit = ins.findings.some(f => 
          (f.category || '').toUpperCase().includes(selectedFindingCriticality.toUpperCase())
        );
        if (!hasCrit) return false;
      }

      return true;
    });
  }, [inspections, searchQuery, selectedStatusCategory, selectedCommodity, selectedFindingCriticality]);

  const activeFocusInspection = useMemo(() => {
    if (selectedInspectCode) {
      return inspections.find(i => i.capaCode === selectedInspectCode) || null;
    }
    if (searchQuery.trim().length >= 3 && filteredInspections.length > 0) {
      return filteredInspections[0];
    }
    return null;
  }, [selectedInspectCode, searchQuery, filteredInspections, inspections]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Header — Soft BPOM Sky-Mint Gradient */}
      <div className="bpom-hero-gradient border border-blue-200/80 dark:border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-emerald-500/15 border border-blue-200 dark:border-emerald-500/30 text-[#1e3a5f] dark:text-emerald-300 text-xs font-extrabold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2e8b75]" />
              <span>Monitoring Real-Time SIMONCER BBPOM Semarang</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1e3a5f] dark:text-white tracking-tight flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 text-[#2e8b75] dark:text-emerald-400 shrink-0" />
              <span>Dashboard Interaktif Status Temuan & Progres CAPA</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Pemantauan visual terpadu atas status seluruh butir temuan ketidaksesuaian, siklus evaluasi, beban kerja validator, dan sistem pencarian instan menggunakan Kode CAPA unik.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenDocumentManager()}
              className="px-4 py-2.5 bg-[#2b4c7e] hover:bg-[#233d63] text-white rounded-xl text-xs font-extrabold border border-white/20 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-[#8be9c9]" />
              <span>Manajemen Dokumen Sesi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Visual Status Cards — Soft Pastel Tinted BPOM Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Temuan Baru */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'BARU' ? 'ALL' : 'BARU')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
            selectedStatusCategory === 'BARU'
              ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
              : 'bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]/65 dark:from-slate-900 dark:to-slate-900 border-amber-200/90 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
              Menunggu CAPA
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#1e3a5f] dark:text-white font-mono">
            {stats.findingsBaru}{' '}
            <span className="text-xs font-sans font-bold text-slate-600 dark:text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-extrabold text-amber-800 dark:text-amber-400 mt-1">Temuan Baru Terbit</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Surat tindak lanjut telah terbit di SRIKANDI dan sarana dalam batas waktu SLA penyusunan CAPA.
          </p>
          {selectedStatusCategory === 'BARU' && (
            <div className="mt-2.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Temuan Baru
            </div>
          )}
        </button>

        {/* 2. Temuan Dalam Proses */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'PROSES' ? 'ALL' : 'PROSES')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
            selectedStatusCategory === 'PROSES'
              ? 'bg-sky-100/90 dark:bg-cyan-950/80 border-sky-500 ring-2 ring-sky-500/30 shadow-md'
              : 'bg-gradient-to-br from-[#eff6ff] to-[#e0f2fe]/70 dark:from-slate-900 dark:to-slate-900 border-sky-200/90 dark:border-slate-800 hover:border-sky-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-300/80 flex items-center justify-center text-sky-700 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-200/70 dark:bg-cyan-500/20 text-sky-900 dark:text-cyan-300 border border-sky-300 dark:border-cyan-500/30">
              Sedang Berjalan
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#1e3a5f] dark:text-white font-mono">
            {stats.findingsProses}{' '}
            <span className="text-xs font-sans font-bold text-slate-600 dark:text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-extrabold text-sky-800 dark:text-cyan-400 mt-1">Temuan Dalam Proses</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            CAPA telah diserahkan dan sedang ditelaah evaluator atau dalam siklus revisi perbaikan sarana.
          </p>
          {selectedStatusCategory === 'PROSES' && (
            <div className="mt-2.5 text-[10px] font-extrabold text-sky-800 dark:text-cyan-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Dalam Proses
            </div>
          )}
        </button>

        {/* 3. Temuan Tervalidasi */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'TERVALIDASI' ? 'ALL' : 'TERVALIDASI')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
            selectedStatusCategory === 'TERVALIDASI'
              ? 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5]/65 dark:from-slate-900 dark:to-slate-900 border-emerald-200/90 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-300/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
              Memenuhi Syarat
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#1e3a5f] dark:text-white font-mono">
            {stats.findingsTervalidasi}{' '}
            <span className="text-xs font-sans font-bold text-slate-600 dark:text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">Temuan Tervalidasi</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Telah diperiksa evaluator Balai, seluruh bukti sah, dan menunggu proses pengantar penutupan.
          </p>
          {selectedStatusCategory === 'TERVALIDASI' && (
            <div className="mt-2.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Tervalidasi
            </div>
          )}
        </button>

        {/* 4. Temuan Sudah Ditutup */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'DITUTUP' ? 'ALL' : 'DITUTUP')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
            selectedStatusCategory === 'DITUTUP'
              ? 'bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
              : 'bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff]/65 dark:from-slate-900 dark:to-slate-900 border-indigo-200/90 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-300/80 flex items-center justify-center text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-200/70 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">
              Closed (Tuntas)
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#1e3a5f] dark:text-white font-mono">
            {stats.findingsDitutup}{' '}
            <span className="text-xs font-sans font-bold text-slate-600 dark:text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-extrabold text-indigo-800 dark:text-indigo-400 mt-1">Temuan Ditutup Resmi</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Surat Pengantar Persetujuan Penutupan telah ditandatangani elektronik (TTE SRIKANDI) & tuntas.
          </p>
          {selectedStatusCategory === 'DITUTUP' && (
            <div className="mt-2.5 text-[10px] font-extrabold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Ditutup
            </div>
          )}
        </button>

      </div>

      {/* Pencarian Kode CAPA & Filter Bar — Soft Light Card */}
      <div className="bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#2e8b75] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Kode CAPA (cth: CAPA-2026-PBF02), Nomor Surat SRIKANDI, atau Nama Sarana..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f4f8fd] dark:bg-slate-950 border border-blue-200 dark:border-slate-700/80 rounded-xl text-xs md:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#2e8b75] transition-colors font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer px-2 py-0.5 rounded bg-slate-200/80"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick Filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={selectedStatusCategory}
              onChange={(e) => setSelectedStatusCategory(e.target.value as FindingStatusCategory)}
              className="px-3 py-2.5 bg-[#f4f8fd] dark:bg-slate-950 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#1e3a5f] dark:text-slate-200 focus:outline-none focus:border-[#2e8b75] cursor-pointer"
            >
              <option value="ALL">Semua Status Temuan</option>
              <option value="BARU">Temuan Baru ({stats.findingsBaru})</option>
              <option value="PROSES">Dalam Proses ({stats.findingsProses})</option>
              <option value="TERVALIDASI">Tervalidasi ({stats.findingsTervalidasi})</option>
              <option value="DITUTUP">Ditutup/Closed ({stats.findingsDitutup})</option>
            </select>

            {/* Commodity Filter */}
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="px-3 py-2.5 bg-[#f4f8fd] dark:bg-slate-950 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#1e3a5f] dark:text-slate-200 focus:outline-none focus:border-[#2e8b75] cursor-pointer"
            >
              <option value="ALL">Semua Komoditi</option>
              {commodities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Criticality Filter */}
            <select
              value={selectedFindingCriticality}
              onChange={(e) => setSelectedFindingCriticality(e.target.value)}
              className="px-3 py-2.5 bg-[#f4f8fd] dark:bg-slate-950 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[#1e3a5f] dark:text-slate-200 focus:outline-none focus:border-[#2e8b75] cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Kritis</option>
              <option value="KRITIS">Kritis (Critical)</option>
              <option value="MAYOR">Mayor (Major)</option>
              <option value="MINOR">Minor</option>
            </select>

            {(selectedStatusCategory !== 'ALL' || selectedCommodity !== 'ALL' || selectedFindingCriticality !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatusCategory('ALL');
                  setSelectedCommodity('ALL');
                  setSelectedFindingCriticality('ALL');
                  setSearchQuery('');
                  setSelectedInspectCode(null);
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Quick Click Badges for popular CAPA codes */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-slate-600 text-[11px] font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-[#2b4c7e]" />
            Pintasan Kode Cepat:
          </span>
          {inspections.slice(0, 5).map((ins) => {
            const isSelected = selectedInspectCode === ins.capaCode;
            return (
              <button
                key={ins.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedInspectCode(null);
                  } else {
                    setSelectedInspectCode(ins.capaCode);
                    setSearchQuery(ins.capaCode);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2e8b75] text-white shadow-xs'
                    : 'bg-[#eef5fc] dark:bg-slate-950 border border-blue-200 dark:border-slate-800 text-[#1e3a5f] dark:text-slate-300 hover:bg-blue-100/80'
                }`}
              >
                {ins.capaCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spotlight: Detailed Progress Drawer when item is searched or selected */}
      {activeFocusInspection && (
        <div className="bg-gradient-to-br from-[#f0f7ff] via-white to-[#ecfdf5] dark:from-slate-900 dark:to-slate-950 border-2 border-[#2e8b75]/40 rounded-2xl p-5 md:p-6 shadow-md space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-blue-200/70 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {activeFocusInspection.capaCode}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100/80 text-[#1e3a5f] border border-blue-200">
                  {activeFocusInspection.facility.type}
                </span>
                {getStatusBadgeConfig(activeFocusInspection.status).label && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeConfig(activeFocusInspection.status).bg} ${getStatusBadgeConfig(activeFocusInspection.status).text}`}>
                    {getStatusBadgeConfig(activeFocusInspection.status).label}
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#1e3a5f] dark:text-white">
                {activeFocusInspection.facility.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Alamat: {activeFocusInspection.facility.address} • PIC: {activeFocusInspection.facility.picName} ({activeFocusInspection.facility.picPhone})
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenMatrix(activeFocusInspection)}
                className="px-3.5 py-2 bg-[#2e8b75] hover:bg-[#257360] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Matriks CAPA</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenDocumentManager(activeFocusInspection.id)}
                className="px-3.5 py-2 bg-sky-100 hover:bg-sky-200/80 text-sky-900 rounded-xl text-xs font-bold border border-sky-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-sky-700" />
                <span>Dokumen & Bukti Sesi</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectInspection(activeFocusInspection)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#1e3a5f] rounded-xl text-xs font-bold border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#2b4c7e]" />
                <span>Detail & Log Histori</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Visual */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-[#1e3a5f] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#2e8b75]" />
              Alur Progres Siklus CAPA Sesi Ini
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              {/* Step 1: Naskah Dinas Terbit */}
              <div className="p-3 bg-white dark:bg-slate-950/70 border border-blue-200/80 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1e3a5f] dark:text-slate-200">1. Surat SRIKANDI</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  No: {activeFocusInspection.srikandiLetter?.letterNo || 'Sudah Terbit'}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold">Terkirim ke Sarana</span>
              </div>

              {/* Step 2: Pengisian & Bukti CAPA */}
              <div className={`p-3 border rounded-xl space-y-1 shadow-2xs ${
                activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1e3a5f] dark:text-slate-200">2. Laporan CAPA</span>
                  {activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {activeFocusInspection.findings.reduce((acc, f) => acc + (f.capa?.evidenceFiles?.length || 0), 0)} Berkas Bukti Diunggah
                </p>
                <span className={`text-[10px] font-bold ${
                  activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT'
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}>
                  {activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT'
                    ? 'Diserahkan ke Balai'
                    : 'Dalam Pengisian Sarana'}
                </span>
              </div>

              {/* Step 3: Telaah Evaluator */}
              <div className={`p-3 border rounded-xl space-y-1 shadow-2xs ${
                activeFocusInspection.status === 'TERVALIDASI' || activeFocusInspection.status === 'SELESAI_CLOSED'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : activeFocusInspection.status === 'EVALUASI_PETUGAS' || activeFocusInspection.status === 'MASIH_EVALUASI'
                  ? 'bg-sky-50/80 border-sky-200'
                  : 'bg-white border-blue-200/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1e3a5f] dark:text-slate-200">3. Evaluasi Balai</span>
                  {activeFocusInspection.status === 'TERVALIDASI' || activeFocusInspection.status === 'SELESAI_CLOSED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-sky-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  Evaluator: {activeFocusInspection.assignedOfficer?.name || activeFocusInspection.leadAuditor}
                </p>
                <span className="text-[10px] text-sky-700 font-bold">
                  {activeFocusInspection.status === 'TERVALIDASI' || activeFocusInspection.status === 'SELESAI_CLOSED'
                    ? 'Tervalidasi Sesuai'
                    : 'Sedang Diverifikasi'}
                </span>
              </div>

              {/* Step 4: Naskah Penutupan TTE */}
              <div className={`p-3 border rounded-xl space-y-1 shadow-2xs ${
                activeFocusInspection.status === 'SELESAI_CLOSED'
                  ? 'bg-indigo-50/80 border-indigo-200'
                  : 'bg-white border-blue-200/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1e3a5f] dark:text-slate-200">4. Penutupan Resmi</span>
                  {activeFocusInspection.status === 'SELESAI_CLOSED' ? (
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Surat Pengantar TTE SRIKANDI
                </p>
                <span className={`text-[10px] font-bold ${
                  activeFocusInspection.status === 'SELESAI_CLOSED' ? 'text-indigo-700' : 'text-slate-500'
                }`}>
                  {activeFocusInspection.status === 'SELESAI_CLOSED' ? 'Resmi Ditutup (Closed)' : 'Belum Ditutup'}
                </span>
              </div>
            </div>
          </div>

          {/* Findings List inside spotlight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#1e3a5f] uppercase tracking-wider">
                Daftar Butir Temuan ({activeFocusInspection.findings.length} Butir)
              </h4>
              <span className="text-xs text-slate-600">
                SLA Penyerahan: <strong className="text-[#1e3a5f]">{calculateRemainingDays(activeFocusInspection.srikandiLetter?.deadlineDate || '').text}</strong>
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeFocusInspection.findings.map((f, idx) => {
                const isItemClosed = activeFocusInspection.status === 'SELESAI_CLOSED';
                const isItemVerified = f.capa?.evaluationStatus === 'MEMADAI' || activeFocusInspection.status === 'TERVALIDASI';
                
                return (
                  <div key={f.id || idx} className="p-3 bg-white dark:bg-slate-950 border border-blue-200/80 dark:border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs shadow-2xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-[#2e8b75]">Butir #{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (f.category || '').toUpperCase().includes('KRITIS')
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : (f.category || '').toUpperCase().includes('MAYOR')
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {f.category || 'Mayor'}
                        </span>
                        {f.clause && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Klausul: {f.clause}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs line-clamp-2">
                        {f.description}
                      </p>
                      {f.capa?.correctiveAction && (
                        <p className="text-[11px] text-emerald-700 font-semibold truncate">
                          ✓ Tindakan CA: {f.capa.correctiveAction}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isItemClosed
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : isItemVerified
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : f.capa?.submittedAt
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {isItemClosed ? 'Close' : isItemVerified ? 'Tervalidasi' : f.capa?.submittedAt ? 'Dalam Telaah' : 'Open'}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {f.capa?.evidenceFiles?.length || 0} Berkas Bukti
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Inspeksi & Progres Temuan — Soft BPOM Light Card */}
      <div className="bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="bpom-header-navy p-4 md:p-5 flex items-center justify-between gap-4 flex-wrap text-white">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8be9c9]" />
              <span>Daftar Sesi Pemeriksaan & Rekap Status Temuan</span>
            </h3>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Menampilkan {filteredInspections.length} dari {inspections.length} sesi pemeriksaan aktif
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Tingkat Penutupan Keseluruhan: <strong className="text-[#8be9c9] font-mono">{stats.closureRate}%</strong>
            </span>
          </div>
        </div>

        {filteredInspections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
            <h4 className="text-sm font-bold text-[#1e3a5f] dark:text-white">Tidak ada data temuan yang cocok</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan periksa kembali kata kunci pencarian kode unik atau atur ulang filter status/komoditi di atas.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatusCategory('ALL');
                setSelectedCommodity('ALL');
                setSelectedFindingCriticality('ALL');
              }}
              className="px-4 py-2 bg-[#2e8b75] hover:bg-[#257360] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f6fd] dark:bg-slate-950/80 text-[#1e3a5f] dark:text-slate-400 border-b border-blue-200/80 dark:border-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Kode CAPA & Sarana</th>
                  <th className="py-3.5 px-4">Komoditi & Standar</th>
                  <th className="py-3.5 px-4 text-center">Rekap Status Temuan</th>
                  <th className="py-3.5 px-4">Evaluator & SLA</th>
                  <th className="py-3.5 px-4 text-center">Status Sesi</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {filteredInspections.map((ins) => {
                  const matrixCfg = getCommodityMatrixConfig(ins.facility.type, ins.facility.name);
                  const sla = calculateRemainingDays(ins.srikandiLetter?.deadlineDate || '');
                  const statusBadge = getStatusBadgeConfig(ins.status);

                  let closedCount = 0;
                  let openCount = 0;
                  let verifiedCount = 0;
                  let totalEv = 0;

                  ins.findings.forEach((f) => {
                    totalEv += f.capa?.evidenceFiles?.length || 0;
                    if (ins.status === 'SELESAI_CLOSED') {
                      closedCount++;
                    } else if (f.capa?.evaluationStatus === 'MEMADAI' || ins.status === 'TERVALIDASI') {
                      verifiedCount++;
                    } else {
                      openCount++;
                    }
                  });

                  const isFocused = activeFocusInspection?.id === ins.id;

                  return (
                    <tr 
                      key={ins.id}
                      className={`hover:bg-[#f4f9ff] dark:hover:bg-slate-850/60 transition-colors ${
                        isFocused ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Kode CAPA & Sarana */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInspectCode(ins.capaCode);
                              setSearchQuery(ins.capaCode);
                            }}
                            className="font-mono font-extrabold text-xs text-[#2e8b75] hover:text-[#24705e] hover:underline cursor-pointer block"
                          >
                            {ins.capaCode}
                          </button>
                          <span className="font-bold text-[#1e3a5f] dark:text-white text-xs block leading-tight">
                            {ins.facility.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                            {ins.facility.address}
                          </span>
                        </div>
                      </td>

                      {/* Komoditi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eef5fc] dark:bg-slate-800 text-[#1e3a5f] dark:text-slate-300 border border-blue-200/80 dark:border-slate-700 block w-fit">
                            {ins.facility.type}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {matrixCfg.codeStandard}
                          </span>
                        </div>
                      </td>

                      {/* Rekap Temuan */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 max-w-[200px] mx-auto">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-semibold">Total: {ins.findings.length} Butir</span>
                            <span className="text-[#2e8b75] font-extrabold">{closedCount} Close</span>
                          </div>
                          
                          {/* Mini Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${(closedCount / (ins.findings.length || 1)) * 100}%` }}
                              title={`${closedCount} Close`}
                            />
                            <div 
                              className="bg-sky-500 h-full transition-all"
                              style={{ width: `${(verifiedCount / (ins.findings.length || 1)) * 100}%` }}
                              title={`${verifiedCount} Tervalidasi`}
                            />
                            <div 
                              className="bg-amber-500 h-full transition-all"
                              style={{ width: `${(openCount / (ins.findings.length || 1)) * 100}%` }}
                              title={`${openCount} Masih Open`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Open: {openCount}</span>
                            <span>{totalEv} Dokumen Bukti</span>
                          </div>
                        </div>
                      </td>

                      {/* Evaluator & SLA */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-[#1e3a5f] dark:text-slate-200 block truncate">
                            {ins.assignedOfficer?.name || ins.leadAuditor}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            sla.isOverdue ? 'text-rose-600' : 'text-amber-700'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {sla.text}
                          </span>
                        </div>
                      </td>

                      {/* Status Sesi */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenMatrix(ins)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Buka Matriks CAPA"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDocumentManager(ins.id)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                            title="Buka Manajemen Dokumen Sesi Ini"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectInspection(ins)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                            title="Lihat Detail Sesi Lengkap & Log Histori"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
