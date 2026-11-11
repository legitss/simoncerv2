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

  // Grouping helper for findings and inspections
  // 1. Temuan Baru: Status sesi MENUNGGU_CAPA / SURAT_TERBIT
  // 2. Temuan Dalam Proses: Status sesi EVALUASI_PETUGAS / MASIH_EVALUASI / CAPA_TERKIRIM / PERLU_PERBAIKAN
  // 3. Temuan Tervalidasi: Status sesi TERVALIDASI
  // 4. Temuan Ditutup: Status sesi SELESAI_CLOSED

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

        // Categorize finding based on session status and finding evaluation
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

  // Commodity list
  const commodities = useMemo(() => {
    const set = new Set<string>();
    inspections.forEach((ins) => {
      if (ins.facility?.type) set.add(ins.facility.type);
    });
    return Array.from(set);
  }, [inspections]);

  // Filtered Inspections
  const filteredInspections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return inspections.filter((ins) => {
      // Search matching
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

      // Status Category Matching
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

      // Commodity matching
      if (selectedCommodity !== 'ALL' && ins.facility.type !== selectedCommodity) {
        return false;
      }

      // Criticality matching
      if (selectedFindingCriticality !== 'ALL') {
        const hasCrit = ins.findings.some(f => 
          (f.category || '').toUpperCase().includes(selectedFindingCriticality.toUpperCase())
        );
        if (!hasCrit) return false;
      }

      return true;
    });
  }, [inspections, searchQuery, selectedStatusCategory, selectedCommodity, selectedFindingCriticality]);

  // Highlighted inspection when searching or selecting
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
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monitoring Real-Time SIMONCER BBPOM Semarang</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Dashboard Interaktif Status Temuan & Progres CAPA</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Pemantauan visual terpadu atas status seluruh butir temuan ketidaksesuaian, siklus evaluasi, beban kerja validator, dan sistem pencarian instan menggunakan Kode CAPA unik.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenDocumentManager()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span>Manajemen Dokumen Sesi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Visual Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Temuan Baru */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'BARU' ? 'ALL' : 'BARU')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatusCategory === 'BARU'
              ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Menunggu CAPA
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {stats.findingsBaru}{' '}
            <span className="text-xs font-sans font-medium text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-bold text-amber-400 mt-1">Temuan Baru Terbit</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Surat tindak lanjut telah terbit di SRIKANDI dan sarana dalam batas waktu SLA penyusunan CAPA.
          </p>
          {selectedStatusCategory === 'BARU' && (
            <div className="mt-2.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Temuan Baru
            </div>
          )}
        </button>

        {/* 2. Temuan Dalam Proses */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'PROSES' ? 'ALL' : 'PROSES')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatusCategory === 'PROSES'
              ? 'bg-cyan-950/80 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Sedang Berjalan
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {stats.findingsProses}{' '}
            <span className="text-xs font-sans font-medium text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-bold text-cyan-400 mt-1">Temuan Dalam Proses</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            CAPA telah diserahkan dan sedang ditelaah evaluator atau dalam siklus revisi perbaikan sarana.
          </p>
          {selectedStatusCategory === 'PROSES' && (
            <div className="mt-2.5 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Dalam Proses
            </div>
          )}
        </button>

        {/* 3. Temuan Tervalidasi */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'TERVALIDASI' ? 'ALL' : 'TERVALIDASI')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatusCategory === 'TERVALIDASI'
              ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Memenuhi Syarat
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {stats.findingsTervalidasi}{' '}
            <span className="text-xs font-sans font-medium text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-bold text-emerald-400 mt-1">Temuan Tervalidasi</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Telah diperiksa evaluator Balai, seluruh bukti sah, dan menunggu proses pengantar penutupan.
          </p>
          {selectedStatusCategory === 'TERVALIDASI' && (
            <div className="mt-2.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Tervalidasi
            </div>
          )}
        </button>

        {/* 4. Temuan Sudah Ditutup */}
        <button
          type="button"
          onClick={() => setSelectedStatusCategory(selectedStatusCategory === 'DITUTUP' ? 'ALL' : 'DITUTUP')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatusCategory === 'DITUTUP'
              ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Closed (Tuntas)
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {stats.findingsDitutup}{' '}
            <span className="text-xs font-sans font-medium text-slate-400">Butir</span>
          </div>
          <p className="text-xs font-bold text-indigo-400 mt-1">Temuan Ditutup Resmi</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Surat Pengantar Persetujuan Penutupan telah ditandatangani elektronik (TTE SRIKANDI) & tuntas.
          </p>
          {selectedStatusCategory === 'DITUTUP' && (
            <div className="mt-2.5 text-[10px] font-bold text-indigo-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> Memfilter kategori Ditutup
            </div>
          )}
        </button>

      </div>

      {/* Pencarian Kode CAPA & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Kode CAPA (cth: CAPA-2026-PBF02), Nomor Surat SRIKANDI, atau Nama Sarana..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded bg-slate-800"
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
              className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
              className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
              className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Quick Click Badges for popular CAPA codes */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
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
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white'
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
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeFocusInspection.capaCode}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {activeFocusInspection.facility.type}
                </span>
                {getStatusBadgeConfig(activeFocusInspection.status).label && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeConfig(activeFocusInspection.status).bg} ${getStatusBadgeConfig(activeFocusInspection.status).text}`}>
                    {getStatusBadgeConfig(activeFocusInspection.status).label}
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                {activeFocusInspection.facility.name}
              </h2>
              <p className="text-xs text-slate-400">
                Alamat: {activeFocusInspection.facility.address} • PIC: {activeFocusInspection.facility.picName} ({activeFocusInspection.facility.picPhone})
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenMatrix(activeFocusInspection)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Matriks CAPA</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenDocumentManager(activeFocusInspection.id)}
                className="px-3.5 py-2 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 rounded-xl text-xs font-bold border border-cyan-600/50 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Dokumen & Bukti Sesi</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectInspection(activeFocusInspection)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Detail & Log Histori</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Visual */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Alur Progres Siklus CAPA Sesi Ini
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              {/* Step 1: Naskah Dinas Terbit */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">1. Surat SRIKANDI</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  No: {activeFocusInspection.srikandiLetter?.letterNo || 'Sudah Terbit'}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium">Terkirim ke Sarana</span>
              </div>

              {/* Step 2: Pengisian & Bukti CAPA */}
              <div className={`p-3 border rounded-xl space-y-1 ${
                activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT'
                  ? 'bg-slate-950/70 border-emerald-500/30'
                  : 'bg-amber-950/20 border-amber-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">2. Laporan CAPA</span>
                  {activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeFocusInspection.findings.reduce((acc, f) => acc + (f.capa?.evidenceFiles?.length || 0), 0)} Berkas Bukti Diunggah
                </p>
                <span className={`text-[10px] font-medium ${
                  activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {activeFocusInspection.status !== 'MENUNGGU_CAPA' && activeFocusInspection.status !== 'SURAT_TERBIT'
                    ? 'Diserahkan ke Balai'
                    : 'Dalam Pengisian Sarana'}
                </span>
              </div>

              {/* Step 3: Telaah Evaluator */}
              <div className={`p-3 border rounded-xl space-y-1 ${
                activeFocusInspection.status === 'TERVALIDASI' || activeFocusInspection.status === 'SELESAI_CLOSED'
                  ? 'bg-slate-950/70 border-emerald-500/30'
                  : activeFocusInspection.status === 'EVALUASI_PETUGAS' || activeFocusInspection.status === 'MASIH_EVALUASI'
                  ? 'bg-cyan-950/20 border-cyan-500/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">3. Evaluasi Balai</span>
                  {activeFocusInspection.status === 'TERVALIDASI' || activeFocusInspection.status === 'SELESAI_CLOSED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Evaluator: {activeFocusInspection.assignedOfficer?.name || activeFocusInspection.leadAuditor}
                </p>
                <span className="text-[10px] text-cyan-400 font-medium">
                  {activeFocusInspection.status === 'TERVALIDASI' || activeFocusInspection.status === 'SELESAI_CLOSED'
                    ? 'Tervalidasi Sesuai'
                    : 'Sedang Diverifikasi'}
                </span>
              </div>

              {/* Step 4: Naskah Penutupan TTE */}
              <div className={`p-3 border rounded-xl space-y-1 ${
                activeFocusInspection.status === 'SELESAI_CLOSED'
                  ? 'bg-indigo-950/30 border-indigo-500/40'
                  : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">4. Penutupan Resmi</span>
                  {activeFocusInspection.status === 'SELESAI_CLOSED' ? (
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Surat Pengantar TTE SRIKANDI
                </p>
                <span className={`text-[10px] font-bold ${
                  activeFocusInspection.status === 'SELESAI_CLOSED' ? 'text-indigo-300' : 'text-slate-500'
                }`}>
                  {activeFocusInspection.status === 'SELESAI_CLOSED' ? 'Resmi Ditutup (Closed)' : 'Belum Ditutup'}
                </span>
              </div>
            </div>
          </div>

          {/* Findings List inside spotlight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Daftar Butir Temuan ({activeFocusInspection.findings.length} Butir)
              </h4>
              <span className="text-xs text-slate-400">
                SLA Penyerahan: <strong className="text-white">{calculateRemainingDays(activeFocusInspection.srikandiLetter?.deadlineDate || '').text}</strong>
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {activeFocusInspection.findings.map((f, idx) => {
                const isItemClosed = activeFocusInspection.status === 'SELESAI_CLOSED';
                const isItemVerified = f.capa?.evaluationStatus === 'MEMADAI' || activeFocusInspection.status === 'TERVALIDASI';
                
                return (
                  <div key={f.id || idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-emerald-400">Butir #{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (f.category || '').toUpperCase().includes('KRITIS')
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : (f.category || '').toUpperCase().includes('MAYOR')
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {f.category || 'Mayor'}
                        </span>
                        {f.clause && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Klausul: {f.clause}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs line-clamp-2">
                        {f.description}
                      </p>
                      {f.capa?.correctiveAction && (
                        <p className="text-[11px] text-emerald-400/90 truncate">
                          ✓ Tindakan CA: {f.capa.correctiveAction}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isItemClosed
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                          : isItemVerified
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : f.capa?.submittedAt
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
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

      {/* Main Table: Inspeksi & Progres Temuan */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Daftar Sesi Pemeriksaan & Rekap Status Temuan</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan {filteredInspections.length} dari {inspections.length} sesi pemeriksaan aktif
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Tingkat Penutupan Keseluruhan: <strong className="text-emerald-400 font-mono">{stats.closureRate}%</strong>
            </span>
          </div>
        </div>

        {filteredInspections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
            <h4 className="text-sm font-bold text-white">Tidak ada data temuan yang cocok</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Kode CAPA & Sarana</th>
                  <th className="py-3 px-4">Komoditi & Standar</th>
                  <th className="py-3 px-4 text-center">Rekap Status Temuan</th>
                  <th className="py-3 px-4">Evaluator & SLA</th>
                  <th className="py-3 px-4 text-center">Status Sesi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInspections.map((ins) => {
                  const matrixCfg = getCommodityMatrixConfig(ins.facility.type, ins.facility.name);
                  const sla = calculateRemainingDays(ins.srikandiLetter?.deadlineDate || '');
                  const statusBadge = getStatusBadgeConfig(ins.status);

                  // Count item status
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
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isFocused ? 'bg-emerald-950/20' : ''
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
                            className="font-mono font-bold text-xs text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer block"
                          >
                            {ins.capaCode}
                          </button>
                          <span className="font-bold text-white text-xs block leading-tight">
                            {ins.facility.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {ins.facility.address}
                          </span>
                        </div>
                      </td>

                      {/* Komoditi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 block w-fit">
                            {ins.facility.type}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {matrixCfg.codeStandard}
                          </span>
                        </div>
                      </td>

                      {/* Rekap Temuan */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 max-w-[200px] mx-auto">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Total: {ins.findings.length} Butir</span>
                            <span className="text-emerald-400 font-bold">{closedCount} Close</span>
                          </div>
                          
                          {/* Mini Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${(closedCount / (ins.findings.length || 1)) * 100}%` }}
                              title={`${closedCount} Close`}
                            />
                            <div 
                              className="bg-cyan-500 h-full transition-all"
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
                          <span className="text-xs font-semibold text-slate-200 block truncate">
                            {ins.assignedOfficer?.name || ins.leadAuditor}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            sla.isOverdue ? 'text-rose-400' : 'text-amber-400'
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
                            className="p-1.5 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 rounded-lg border border-emerald-700/50 transition-colors cursor-pointer"
                            title="Buka Matriks CAPA"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDocumentManager(ins.id)}
                            className="p-1.5 bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 rounded-lg border border-cyan-700/50 transition-colors cursor-pointer"
                            title="Buka Manajemen Dokumen Sesi Ini"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectInspection(ins)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
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
