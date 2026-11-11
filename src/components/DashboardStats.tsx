import React, { useState, useMemo } from 'react';
import { InspectionSession, InspectionStatus, FindingCategory, FindingItem } from '../types';
import { 
  ClipboardCheck, 
  Clock, 
  Hourglass, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Building2,
  Calendar,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Percent,
  Activity,
  Download,
  FileSpreadsheet,
  Search,
  X,
  Eye,
  FileText,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { calculateRemainingDays, formatIndonesianDate, getStatusBadgeConfig } from '../utils/date';
import { exportAnnualAuditActivityCSV } from '../utils/csvExport';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';

interface DashboardStatsProps {
  inspections: InspectionSession[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSelectInspection?: (inspection: InspectionSession) => void;
  onOpenTrackingModal?: (code?: string) => void;
  onSubmitCapa?: (inspection: InspectionSession) => void;
  onOpenEvaluation?: (inspection: InspectionSession) => void;
}

interface FindingDetailWithSession {
  finding: FindingItem;
  session: InspectionSession;
  statusCategory: 'OPEN' | 'IN_PROGRESS' | 'VALIDATED';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  inspections,
  activeFilter,
  onFilterChange,
  onSelectInspection,
  onOpenTrackingModal,
  onSubmitCapa,
  onOpenEvaluation,
}) => {
  // Analytical view states
  const [chartViewMode, setChartViewMode] = useState<'FINDINGS_CATEGORY' | 'STATUS_TREND'>('STATUS_TREND');
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState<boolean>(true);
  const [selectedExportYear, setSelectedExportYear] = useState<string>('2026');
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState<string | null>(null);

  // Search & Track State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

  // Drill-down Modal State for Findings Breakdown
  const [drilldownCategory, setDrilldownCategory] = useState<'OPEN' | 'IN_PROGRESS' | 'VALIDATED' | 'COMPLETED_CAPA' | null>(null);

  // View Mode: Aggregate (All Facilities) vs Per-Facility Breakdown
  const [metricsViewMode, setMetricsViewMode] = useState<'AGGREGATE' | 'PER_SARANA'>('AGGREGATE');

  // ==========================================
  // REAL-TIME METRICS CALCULATION
  // ==========================================

  // Classify all findings across all sessions in real-time
  const classifiedFindings = useMemo(() => {
    const open: FindingDetailWithSession[] = [];
    const inProgress: FindingDetailWithSession[] = [];
    const validated: FindingDetailWithSession[] = [];

    inspections.forEach((session) => {
      const isSessionClosed = session.status === 'SELESAI_CLOSED' || session.status === 'TERVALIDASI';

      session.findings.forEach((finding) => {
        const isMemadai = finding.capa?.evaluationStatus === 'MEMADAI' || finding.capa?.progressStatus === 'Sudah Selesai';

        if (isSessionClosed || isMemadai) {
          validated.push({ finding, session, statusCategory: 'VALIDATED' });
        } else {
          const hasSubmitted = Boolean(finding.capa?.submittedAt) || 
            session.status === 'CAPA_TERKIRIM' || 
            session.status === 'MASIH_EVALUASI' || 
            session.status === 'EVALUASI_PETUGAS' ||
            finding.capa?.progressStatus === 'Dalam Proses';
          
          const isRevisionNeeded = finding.capa?.evaluationStatus === 'REVISI' || 
            finding.capa?.evaluationStatus === 'BELUM_MEMADAI' || 
            session.status === 'PERLU_PERBAIKAN';

          if (isRevisionNeeded) {
            open.push({ finding, session, statusCategory: 'OPEN' });
          } else if (hasSubmitted) {
            inProgress.push({ finding, session, statusCategory: 'IN_PROGRESS' });
          } else {
            open.push({ finding, session, statusCategory: 'OPEN' });
          }
        }
      });
    });

    return { open, inProgress, validated };
  }, [inspections]);

  // Unique facilities contributing to each finding category
  const facilitiesWithOpenCount = useMemo(() => {
    return new Set(classifiedFindings.open.map((f) => f.session.id)).size;
  }, [classifiedFindings.open]);

  const facilitiesWithInProgressCount = useMemo(() => {
    return new Set(classifiedFindings.inProgress.map((f) => f.session.id)).size;
  }, [classifiedFindings.inProgress]);

  const facilitiesWithValidatedCount = useMemo(() => {
    return new Set(classifiedFindings.validated.map((f) => f.session.id)).size;
  }, [classifiedFindings.validated]);

  // Total findings and counts
  const allFindings = useMemo(() => {
    return inspections.flatMap((ins) => ins.findings);
  }, [inspections]);

  const totalFindings = allFindings.length;
  const openFindingsCount = classifiedFindings.open.length;
  const inProgressFindingsCount = classifiedFindings.inProgress.length;
  const validatedFindingsCount = classifiedFindings.validated.length;

  // Breakdown of Open Findings
  const openKritis = classifiedFindings.open.filter((f) => f.finding.category === 'KRITIS').length;
  const openMayor = classifiedFindings.open.filter((f) => f.finding.category === 'MAYOR').length;
  const openMinor = classifiedFindings.open.filter((f) => f.finding.category === 'MINOR').length;

  // Breakdown of In-Progress Findings
  const inProgKritis = classifiedFindings.inProgress.filter((f) => f.finding.category === 'KRITIS').length;
  const inProgMayor = classifiedFindings.inProgress.filter((f) => f.finding.category === 'MAYOR').length;
  const inProgMinor = classifiedFindings.inProgress.filter((f) => f.finding.category === 'MINOR').length;

  // Breakdown of Validated Findings
  const valKritis = classifiedFindings.validated.filter((f) => f.finding.category === 'KRITIS').length;
  const valMayor = classifiedFindings.validated.filter((f) => f.finding.category === 'MAYOR').length;
  const valMinor = classifiedFindings.validated.filter((f) => f.finding.category === 'MINOR').length;

  // Sessions metrics
  const totalSessions = inspections.length;
  const completedCapaCount = inspections.filter(
    (i) => i.status === 'SELESAI_CLOSED' || i.status === 'TERVALIDASI'
  ).length;

  const waitingCapaSessions = inspections.filter(
    (i) => i.status === 'MENUNGGU_CAPA' || i.status === 'SURAT_TERBIT'
  ).length;

  const inEvaluationSessions = inspections.filter(
    (i) => i.status === 'CAPA_TERKIRIM' || i.status === 'MASIH_EVALUASI'
  ).length;

  const needRevisionSessions = inspections.filter(
    (i) => i.status === 'PERLU_PERBAIKAN'
  ).length;

  // Percentages
  const validatedFindingsRate = totalFindings > 0 ? Math.round((validatedFindingsCount / totalFindings) * 100) : 0;
  const inProgressFindingsRate = totalFindings > 0 ? Math.round((inProgressFindingsCount / totalFindings) * 100) : 0;
  const openFindingsRate = totalFindings > 0 ? Math.round((openFindingsCount / totalFindings) * 100) : 0;
  const completedCapaRate = totalSessions > 0 ? Math.round((completedCapaCount / totalSessions) * 100) : 0;

  // Overdue count based on SLA 14 days
  const overdueCount = inspections.filter((i) => {
    if (i.status === 'SELESAI_CLOSED' || i.status === 'TERVALIDASI') return false;
    const sla = calculateRemainingDays(i.srikandiLetter.deadlineDate);
    return sla.isOverdue;
  }).length;

  const complianceRate = totalSessions > 0 ? Math.round(((totalSessions - overdueCount) / totalSessions) * 100) : 100;

  // Available audit years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    inspections.forEach((ins) => {
      const y = (ins.inspectionDate || ins.createdAt).substring(0, 4);
      if (y && y.length === 4) years.add(y);
    });
    years.add('2026');
    return Array.from(years).sort().reverse();
  }, [inspections]);

  // Handle CSV Download
  const handleDownloadCSV = (year: string) => {
    setIsExportingCsv(true);
    try {
      const result = exportAnnualAuditActivityCSV(inspections, year);
      if (result.success) {
        setCsvExportSuccess(`Berhasil mengunduh ${result.totalExported} data aktivitas audit tahunan (${result.filename})`);
        setTimeout(() => setCsvExportSuccess(null), 4500);
      }
    } catch (err) {
      console.error('Gagal mengunduh CSV audit tahunan:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  // ==========================================
  // SEARCH & TRACK FILTERING
  // ==========================================
  const trimmedSearch = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedSearch) return [];
    return inspections.filter((ins) => {
      const matchCapa = ins.capaCode.toLowerCase().includes(trimmedSearch);
      const matchId = ins.id.toLowerCase().includes(trimmedSearch);
      const matchLetter = ins.srikandiLetter?.letterNo?.toLowerCase().includes(trimmedSearch);
      const matchFacility = ins.facility?.name?.toLowerCase().includes(trimmedSearch);
      const matchPic = ins.facility?.picName?.toLowerCase().includes(trimmedSearch);
      const matchOfficer = ins.leadAuditor?.toLowerCase().includes(trimmedSearch) || 
        ins.assignedOfficer?.name?.toLowerCase().includes(trimmedSearch);
      
      return matchCapa || matchId || matchLetter || matchFacility || matchPic || matchOfficer;
    });
  }, [inspections, trimmedSearch]);

  // Sample quick codes from inspections for 1-click test
  const quickPickCodes = useMemo(() => {
    return inspections.slice(0, 6).map((i) => ({
      code: i.capaCode,
      name: i.facility.name,
      status: i.status
    }));
  }, [inspections]);

  // ==========================================
  // RECHARTS PREPARATION
  // ==========================================
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, {
      monthKey: string;
      label: string;
      timestamp: number;
      totalTemuan: number;
      kritis: number;
      mayor: number;
      minor: number;
      tervalidasi: number;
      masihEvaluasi: number;
      menungguCapa: number;
      perluPerbaikan: number;
      totalSesi: number;
    }> = {};

    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    inspections.forEach((item) => {
      const dateStr = item.inspectionDate || item.createdAt.substring(0, 10);
      const dateObj = new Date(dateStr);
      const year = dateObj.getFullYear();
      const monthIdx = dateObj.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${MONTH_LABELS[monthIdx]} ${year}`;

      if (!monthMap[key]) {
        monthMap[key] = {
          monthKey: key,
          label,
          timestamp: new Date(year, monthIdx, 1).getTime(),
          totalTemuan: 0,
          kritis: 0,
          mayor: 0,
          minor: 0,
          tervalidasi: 0,
          masihEvaluasi: 0,
          menungguCapa: 0,
          perluPerbaikan: 0,
          totalSesi: 0,
        };
      }

      monthMap[key].totalSesi += 1;
      monthMap[key].totalTemuan += item.findings.length;

      item.findings.forEach((f) => {
        if (f.category === 'KRITIS') monthMap[key].kritis += 1;
        else if (f.category === 'MAYOR') monthMap[key].mayor += 1;
        else if (f.category === 'MINOR') monthMap[key].minor += 1;
      });

      if (item.status === 'SELESAI_CLOSED' || item.status === 'TERVALIDASI') {
        monthMap[key].tervalidasi += 1;
      } else if (item.status === 'CAPA_TERKIRIM' || item.status === 'MASIH_EVALUASI') {
        monthMap[key].masihEvaluasi += 1;
      } else if (item.status === 'MENUNGGU_CAPA' || item.status === 'SURAT_TERBIT') {
        monthMap[key].menungguCapa += 1;
      } else if (item.status === 'PERLU_PERBAIKAN') {
        monthMap[key].perluPerbaikan += 1;
      }
    });

    return Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [inspections]);

  // Donut chart of findings distribution
  const findingsPieData = useMemo(() => {
    return [
      {
        id: 'VALIDATED',
        name: 'Temuan Tervalidasi',
        value: validatedFindingsCount,
        color: '#10b981', // emerald-500
        desc: 'Selesai diverifikasi (Memadai)',
        percentage: validatedFindingsRate,
      },
      {
        id: 'IN_PROGRESS',
        name: 'Temuan Dalam Proses',
        value: inProgressFindingsCount,
        color: '#8b5cf6', // purple-500
        desc: 'Tahap evaluasi verifikator',
        percentage: inProgressFindingsRate,
      },
      {
        id: 'OPEN',
        name: 'Temuan Terbuka',
        value: openFindingsCount,
        color: '#f59e0b', // amber-500
        desc: 'Menunggu tindakan sarana / revisi',
        percentage: openFindingsRate,
      },
    ].filter((item) => item.value > 0);
  }, [validatedFindingsCount, inProgressFindingsCount, openFindingsCount, validatedFindingsRate, inProgressFindingsRate, openFindingsRate]);

  // Facility Type Data
  const facilityTypeData = useMemo(() => {
    const map: Record<string, { type: string; shortName: string; tervalidasi: number; masihProses: number; total: number }> = {};

    inspections.forEach((ins) => {
      const type = ins.facility.type;
      let shortName: string = type;
      if (type === 'Pedagang Besar Farmasi (PBF)') shortName = 'PBF Farmasi';
      else if (type === 'Industri Pangan Olahan') shortName = 'Industri Pangan';
      else if (type === 'Rumah Sakit') shortName = 'Rumah Sakit';

      if (!map[type]) {
        map[type] = {
          type,
          shortName,
          tervalidasi: 0,
          masihProses: 0,
          total: 0,
        };
      }

      map[type].total += 1;
      if (ins.status === 'SELESAI_CLOSED' || ins.status === 'TERVALIDASI') {
        map[type].tervalidasi += 1;
      } else {
        map[type].masihProses += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [inspections]);

  // Tooltip helpers
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[200px]">
          <div className="font-bold text-slate-100 border-b border-slate-700 pb-1 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-800/60">
              Periode Sesi
            </span>
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 text-[11px]">{entry.name}:</span>
                </div>
                <span className="font-bold text-slate-100">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[190px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-slate-100">{data.name}</span>
          </div>
          <div className="text-[11px] text-slate-300 pl-5">
            <div>Jumlah: <strong className="text-white">{data.value} Butir</strong></div>
            <div>Porsi: <strong className="text-white">{data.percentage}%</strong> dari total temuan</div>
            <div className="text-[10px] text-slate-400 mt-1 italic">{data.desc}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // List of findings for the active drilldown modal
  const activeDrilldownFindings = useMemo(() => {
    if (!drilldownCategory) return [];
    if (drilldownCategory === 'OPEN') return classifiedFindings.open;
    if (drilldownCategory === 'IN_PROGRESS') return classifiedFindings.inProgress;
    if (drilldownCategory === 'VALIDATED') return classifiedFindings.validated;
    return [];
  }, [drilldownCategory, classifiedFindings]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP BAR: REAL-TIME TRACKING & SEARCH BY KODE UNIK / KODE CAPA */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight">
                  Pencarian & Pelacakan Progres CAPA Real-Time
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Masukkan Kode Unik (misal: <span className="font-mono text-emerald-300">CAPA-2026-SRN88</span> atau <span className="font-mono text-emerald-300">INS-2026-102</span>), Nomor Surat SRIKANDI, atau Nama Sarana
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 self-start md:self-auto">
            <span>Terhubung ke {totalSessions} Sesi Aktif</span>
            <span>•</span>
            <span>{totalFindings} Temuan Lapangan</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchActive(true);
              }}
              placeholder="Ketik Kode CAPA / Kode Unik / No. Surat / Nama Sarana..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 hover:border-emerald-500/60 focus:border-emerald-400 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchActive(false);
                }}
                className="absolute right-3 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick-Pick Codes Chips */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Pilih Cepat Kode:</span>
            {quickPickCodes.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setSearchQuery(item.code);
                  setIsSearchActive(true);
                }}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  searchQuery === item.code
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Lacak ${item.name}`}
              >
                {item.code}
              </button>
            ))}
          </div>
        </div>

        {/* Real-Time Search Results Panel */}
        {searchQuery.trim() && isSearchActive && (
          <div className="mt-4 pt-4 border-t border-slate-700/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Ditemukan {searchResults.length} Sesi CAPA yang Cocok
              </span>
              <button
                type="button"
                onClick={() => setIsSearchActive(false)}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Tutup Hasil Pencarian
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                Tidak ditemukan sesi pemeriksaan dengan kode atau kata kunci "<strong>{searchQuery}</strong>".
                <p className="text-[11px] text-slate-500 mt-1">
                  Pastikan format kode benar, misal: <span className="font-mono text-slate-300">CAPA-2026-SRN88</span> atau ketik nama sarana.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {searchResults.map((ins) => {
                  const badge = getStatusBadgeConfig(ins.status);
                  const sla = calculateRemainingDays(ins.srikandiLetter.deadlineDate);
                  const valCount = ins.findings.filter(
                    (f) => f.capa?.evaluationStatus === 'MEMADAI' || f.capa?.progressStatus === 'Sudah Selesai'
                  ).length;
                  const totalCount = ins.findings.length;
                  const percent = totalCount > 0 ? Math.round((valCount / totalCount) * 100) : 100;

                  return (
                    <div
                      key={ins.id}
                      className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-700/80 hover:border-emerald-500/80 transition-all flex flex-col justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {ins.capaCode}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm truncate">
                          {ins.facility.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{ins.facility.type}</span>
                          <span>•</span>
                          <span className="truncate">{ins.facility.address}</span>
                        </div>

                        {/* Surat Tindak Lanjut Info */}
                        <div className="text-[11px] text-slate-300 mt-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">No. Surat SRIKANDI:</span>
                            <span className="font-mono font-bold text-slate-200">{ins.srikandiLetter.letterNo}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Petugas PIC:</span>
                            <span className="font-semibold text-slate-200">{ins.leadAuditor}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Batas Waktu (SLA):</span>
                            <span className={`font-bold ${sla.isOverdue ? 'text-rose-400' : 'text-emerald-300'}`}>
                              {sla.text} ({formatIndonesianDate(ins.srikandiLetter.deadlineDate)})
                            </span>
                          </div>
                        </div>

                        {/* Findings Progress Bar */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Progres Verifikasi Temuan:</span>
                            <span className="font-bold text-emerald-300 font-mono">
                              {valCount}/{totalCount} Butir ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenTrackingModal) {
                              onOpenTrackingModal(ins.capaCode);
                            } else if (onSelectInspection) {
                              onSelectInspection(ins);
                            }
                          }}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lacak Progres Detail</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectInspection && onSelectInspection(ins)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                          title="Buka Sesi Pemeriksaan"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 CORE METRICS (HERO METRIC CARDS) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Metrik Kinerja & Status Temuan Real-Time
            </h4>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              📊 Akumulasi {totalFindings} Butir Temuan dari {totalSessions} Sarana
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View basis toggle: Akumulatif vs Rincian per Sarana */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMetricsViewMode('AGGREGATE')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  metricsViewMode === 'AGGREGATE'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Akumulatif (Semua Sarana)</span>
              </button>
              <button
                type="button"
                onClick={() => setMetricsViewMode('PER_SARANA')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  metricsViewMode === 'PER_SARANA'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Rincian per Sarana ({totalSessions})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calculation Basis Helper Box */}
        <div className="mb-3 px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Penjelasan Hitungan:</strong> 3 kartu pertama menghitung <strong>akumulasi butir temuan klausul</strong> dari seluruh {totalSessions} sarana yang diperiksa, sedangkan kartu ke-4 menghitung <strong>jumlah sarana/sesi audit</strong> yang telah selesai 100%.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Total Sesi: {totalSessions} Sarana • Total Temuan: {totalFindings} Butir
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* CARD 1: JUMLAH TEMUAN TERBUKA */}
          <div
            onClick={() => {
              onFilterChange('MENUNGGU_CAPA');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white hover:bg-slate-50/70 border-slate-200/90 hover:border-amber-300 shadow-2xs hover:shadow-md group relative overflow-hidden ${
              activeFilter === 'MENUNGGU_CAPA' ? 'ring-2 ring-amber-500 border-transparent shadow-md -translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrilldownCategory('OPEN');
                }}
                className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Rincian Butir ↗
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                {openFindingsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Butir Temuan</span>
              <span className="text-[10px] text-amber-800 font-medium ml-auto bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 tabular-nums">
                {facilitiesWithOpenCount} sarana
              </span>
            </div>

            <div className="text-xs font-bold text-slate-800 mt-1">
              Jumlah Temuan Terbuka (Open)
            </div>

            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {openKritis} Kritis
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {openMayor} Mayor
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {openMinor} Minor
              </span>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Menunggu Perbaikan Sarana</span>
              <span className="font-bold text-amber-700 font-mono tabular-nums">{openFindingsRate}% Total</span>
            </div>
          </div>

          {/* CARD 2: TEMUAN DALAM PROSES */}
          <div
            onClick={() => {
              onFilterChange('EVALUASI');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white hover:bg-slate-50/70 border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md group relative overflow-hidden ${
              activeFilter === 'EVALUASI' ? 'ring-2 ring-indigo-500 border-transparent shadow-md -translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Hourglass className="w-5 h-5" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrilldownCategory('IN_PROGRESS');
                }}
                className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Rincian Butir ↗
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                {inProgressFindingsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Butir Temuan</span>
              <span className="text-[10px] text-indigo-800 font-medium ml-auto bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60 tabular-nums">
                {facilitiesWithInProgressCount} sarana
              </span>
            </div>

            <div className="text-xs font-bold text-slate-800 mt-1">
              Temuan Dalam Proses Evaluasi
            </div>

            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {inProgKritis} Kritis
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {inProgMayor} Mayor
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {inProgMinor} Minor
              </span>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Ditelaah Verifikator Balai</span>
              <span className="font-bold text-indigo-700 font-mono tabular-nums">{inProgressFindingsRate}% Total</span>
            </div>
          </div>

          {/* CARD 3: TEMUAN YANG TERVALIDASI */}
          <div
            onClick={() => {
              onFilterChange('CLOSED');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white hover:bg-slate-50/70 border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md group relative overflow-hidden ${
              activeFilter === 'CLOSED' ? 'ring-2 ring-emerald-500 border-transparent shadow-md -translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrilldownCategory('VALIDATED');
                }}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Rincian Butir ↗
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                {validatedFindingsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Butir Temuan</span>
              <span className="text-[10px] text-emerald-800 font-medium ml-auto bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums">
                {facilitiesWithValidatedCount} sarana
              </span>
            </div>

            <div className="text-xs font-bold text-slate-800 mt-1">
              Temuan Tervalidasi (Memadai)
            </div>

            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {valKritis} Kritis
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {valMayor} Mayor
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {valMinor} Minor
              </span>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Memadai & Memenuhi Standar</span>
              <span className="font-bold text-emerald-700 font-mono tabular-nums">{validatedFindingsRate}% Selesai</span>
            </div>
          </div>

          {/* CARD 4: CAPA YANG SELESAI */}
          <div
            onClick={() => {
              onFilterChange('CLOSED');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white hover:bg-slate-50/70 border-slate-200/90 hover:border-teal-300 shadow-2xs hover:shadow-md group relative overflow-hidden ${
              activeFilter === 'CLOSED' ? 'ring-2 ring-teal-500 border-transparent shadow-md -translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg">
                Sesi Closed
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                {completedCapaCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">dari {totalSessions} Sesi</span>
              <span className="text-[10px] text-teal-800 font-medium ml-auto bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 tabular-nums">
                100% tuntas
              </span>
            </div>

            <div className="text-xs font-bold text-slate-800 mt-1">
              Sesi CAPA Ditutup Resmi
            </div>

            <div className="text-[11px] text-slate-500 mt-2">
              {completedCapaRate}% Tingkat Penyelesaian Seluruh Sesi
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status Tervalidasi</span>
              <span className="font-bold text-teal-700 font-mono tabular-nums">{complianceRate}% Patuh SLA</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OPTIONAL VIEW: RINCIAN BUTIR TEMUAN PER SARANA */}
        {/* ========================================================================= */}
        {metricsViewMode === 'PER_SARANA' && (
          <div className="mt-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h5 className="font-bold text-xs text-slate-800">
                  Rincian Butir Temuan per Sarana ({inspections.length} Sesi Terdata)
                </h5>
              </div>
              <span className="text-[11px] text-slate-500">
                Melihat pemisahan butir temuan secara individual per sarana yang diaudit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inspections.map((ins) => {
                const isSessionClosed = ins.status === 'SELESAI_CLOSED' || ins.status === 'TERVALIDASI';
                const total = ins.findings.length;
                
                let valCount = 0;
                let inProgCount = 0;
                let openCount = 0;

                ins.findings.forEach((f) => {
                  const isMemadai = f.capa?.evaluationStatus === 'MEMADAI' || f.capa?.progressStatus === 'Sudah Selesai';
                  if (isSessionClosed || isMemadai) {
                    valCount++;
                  } else {
                    const hasSubmitted = Boolean(f.capa?.submittedAt) || 
                      ins.status === 'CAPA_TERKIRIM' || 
                      ins.status === 'MASIH_EVALUASI' || 
                      f.capa?.progressStatus === 'Dalam Proses';
                    const isRevisionNeeded = f.capa?.evaluationStatus === 'REVISI' || 
                      f.capa?.evaluationStatus === 'BELUM_MEMADAI' || 
                      ins.status === 'PERLU_PERBAIKAN';

                    if (isRevisionNeeded) {
                      openCount++;
                    } else if (hasSubmitted) {
                      inProgCount++;
                    } else {
                      openCount++;
                    }
                  }
                });

                const badge = getStatusBadgeConfig(ins.status);
                const percent = total > 0 ? Math.round((valCount / total) * 100) : 100;

                return (
                  <div
                    key={ins.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {ins.capaCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-xs truncate">
                        {ins.facility.name}
                      </h5>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {ins.facility.type} • {ins.facility.address}
                      </p>

                      {/* Finding Breakdown Pills for this facility */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 font-medium">Temuan:</span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {openCount} Terbuka
                        </span>
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {inProgCount} Proses
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {valCount} Tervalidasi
                        </span>
                        <span className="text-slate-400 ml-auto font-mono text-[10px]">
                          Total: {total}
                        </span>
                      </div>

                      {/* Mini Progress */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>Progres Validasi Sarana ini:</span>
                          <span className="font-bold text-emerald-700">{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenEvaluation) {
                            onOpenEvaluation(ins);
                          } else if (onSelectInspection) {
                            onSelectInspection(ins);
                          }
                        }}
                        className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buka & Telaah Sarana</span>
                      </button>

                      {onOpenTrackingModal && (
                        <button
                          type="button"
                          onClick={() => onOpenTrackingModal(ins.capaCode)}
                          className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
                          title="Lacak detail progres CAPA"
                        >
                          Lacak Progres
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-Time Resolution Progress Ribbon */}
        <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Rasio Penyelesaian Temuan:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                {validatedFindingsRate}% Tervalidasi ({validatedFindingsCount})
              </span>
              <span className="text-slate-300">/</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                {inProgressFindingsRate}% Dalam Proses ({inProgressFindingsCount})
              </span>
              <span className="text-slate-300">/</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                {openFindingsRate}% Terbuka ({openFindingsCount})
              </span>
            </div>
          </div>

          {/* Visual Stacked Bar */}
          <div className="w-full sm:w-64 h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${validatedFindingsRate}%` }}
              title={`Tervalidasi: ${validatedFindingsCount} butir`}
            />
            <div
              className="bg-purple-500 h-full transition-all duration-300"
              style={{ width: `${inProgressFindingsRate}%` }}
              title={`Dalam Proses: ${inProgressFindingsCount} butir`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${openFindingsRate}%` }}
              title={`Terbuka: ${openFindingsCount} butir`}
            />
          </div>
        </div>
      </div>

      {/* SLA Alert banner if any overdue */}
      {overdueCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Peringatan Keterlambatan Tindak Lanjut:</span>{' '}
              Terdapat <strong>{overdueCount} sarana</strong> yang melewati batas waktu penyampaian CAPA (SLA 14 hari). Notifikasi pengingat otomatis telah disiapkan.
            </div>
          </div>
          <button
            onClick={() => onFilterChange('OVERDUE')}
            type="button"
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            Lihat Sarana Overdue
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RECHARTS ANALYTICAL DASHBOARD SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Analytics Header Toolbar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Visualisasi & Analitika Kinerja CAPA
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Recharts Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring tren temuan bulanan, rasio tervalidasi vs masih evaluasi, dan kepatuhan sarana.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* Unduh Laporan Aktivitas Audit Tahunan CSV */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-lg p-0.5">
              <select
                value={selectedExportYear}
                onChange={(e) => setSelectedExportYear(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-emerald-900 px-2 py-1 rounded focus:outline-none cursor-pointer"
                title="Pilih Tahun Laporan Audit"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="text-slate-900 bg-white">
                    Tahun {yr}
                  </option>
                ))}
                <option value="ALL" className="text-slate-900 bg-white">Semua Tahun</option>
              </select>

              <button
                type="button"
                onClick={() => handleDownloadCSV(selectedExportYear)}
                disabled={isExportingCsv}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="Unduh laporan aktivitas audit tahunan format CSV untuk pelaporan internal"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingCsv ? 'Menyiapkan...' : 'Unduh CSV Tahunan'}</span>
              </button>
            </div>

            {/* View Mode Toggle for Trend Chart */}
            <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium text-slate-700 border border-slate-300/80">
              <button
                type="button"
                onClick={() => setChartViewMode('STATUS_TREND')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  chartViewMode === 'STATUS_TREND'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Status CAPA Bulanan
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('FINDINGS_CATEGORY')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  chartViewMode === 'FINDINGS_CATEGORY'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kategori Temuan
              </button>
            </div>

            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isAnalyticsExpanded ? 'Ciutkan Analitika' : 'Bentangkan Analitika'}
            >
              {isAnalyticsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* CSV Export Success Alert */}
        {csvExportSuccess && (
          <div className="px-5 py-2.5 bg-emerald-100/90 border-b border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{csvExportSuccess}</span>
          </div>
        )}

        {/* Analytics Body */}
        {isAnalyticsExpanded && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Donut Chart of Findings Distribution */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-emerald-600" />
                      Distribusi Resolusi Temuan
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {totalFindings} Temuan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Proporsi temuan yang telah tervalidasi vs masih dalam proses evaluasi.
                  </p>

                  <div className="h-56 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={findingsPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {findingsPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomDonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Stat inside Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-extrabold text-slate-900 font-mono">
                        {validatedFindingsRate}%
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Selesai
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend summary pills */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-200 text-center">
                  <div className="bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-300/80">
                    <span className="text-[10px] text-emerald-800 block font-medium">Tervalidasi</span>
                    <strong className="text-xs text-emerald-950 font-mono">{validatedFindingsCount}</strong>
                  </div>
                  <div className="bg-purple-100/70 p-1.5 rounded-lg border border-purple-300/80">
                    <span className="text-[10px] text-purple-800 block font-medium">Dalam Proses</span>
                    <strong className="text-xs text-purple-950 font-mono">{inProgressFindingsCount}</strong>
                  </div>
                  <div className="bg-amber-100/70 p-1.5 rounded-lg border border-amber-300/80">
                    <span className="text-[10px] text-amber-800 block font-medium">Terbuka</span>
                    <strong className="text-xs text-amber-950 font-mono">{openFindingsCount}</strong>
                  </div>
                </div>
              </div>

              {/* Chart 2: Monthly Trend Chart (Area or Bar) */}
              <div className="lg:col-span-2 bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      {chartViewMode === 'STATUS_TREND'
                        ? 'Tren Resolusi Status CAPA per Bulan'
                        : 'Tren Jumlah & Tingkat Keparahan Temuan'}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Tahun 2026
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    {chartViewMode === 'STATUS_TREND'
                      ? 'Menampilkan progres sesi tervalidasi dibandingkan sesi yang masih memerlukan evaluasi.'
                      : 'Komposisi butir temuan Kritis, Mayor, dan Minor hasil pemeriksaan lapangan.'}
                  </p>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartViewMode === 'STATUS_TREND' ? (
                        <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#64748b" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                          <Tooltip content={<CustomTrendTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar dataKey="tervalidasi" name="Tervalidasi / Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="masihEvaluasi" name="Dalam Evaluasi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="menungguCapa" name="Menunggu CAPA" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="totalSesi" name="Total Sesi" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                      ) : (
                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#64748b" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                          <Tooltip content={<CustomTrendTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar dataKey="kritis" name="Kritis (Critical)" fill="#e11d48" stackId="a" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="mayor" name="Mayor (Major)" fill="#f97316" stackId="a" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="minor" name="Minor" fill="#eab308" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance by Commodity / Facility Type */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Kinerja Penyelesaian CAPA per Jenis Komoditi / Sarana
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {facilityTypeData.length} Kategori Sarana
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Perbandingan jumlah sesi yang telah tervalidasi tuntas dibandingkan yang masih berstatus proses per komoditi.
              </p>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facilityTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#64748b" />
                    <YAxis dataKey="shortName" type="category" tick={{ fontSize: 10 }} stroke="#64748b" width={110} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="tervalidasi" name="Tervalidasi / Selesai" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="masihProses" name="Masih Proses CAPA" fill="#f59e0b" stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DRILLDOWN: DAFTAR BUTIR TEMUAN SESUAI METRIK */}
      {/* ========================================================================= */}
      {drilldownCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {drilldownCategory === 'OPEN' && 'Daftar Butir: Temuan Terbuka (Open Findings)'}
                    {drilldownCategory === 'IN_PROGRESS' && 'Daftar Butir: Temuan Dalam Proses (In Progress)'}
                    {drilldownCategory === 'VALIDATED' && 'Daftar Butir: Temuan Tervalidasi (Validated)'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Total {activeDrilldownFindings.length} butir temuan tercatat pada kategori ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrilldownCategory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Table of Findings */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {activeDrilldownFindings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Tidak ada butir temuan pada kategori ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeDrilldownFindings.map(({ finding, session }, idx) => (
                    <div key={`${session.id}-${finding.id || idx}`} className="p-3.5 hover:bg-slate-50 transition-colors text-xs space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {finding.clause}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                finding.category === 'KRITIS'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : finding.category === 'MAYOR'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}
                            >
                              {finding.category}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {session.facility.name} ({session.facility.type})
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium leading-relaxed">
                            {finding.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 block">
                            Kode CAPA: <strong>{session.capaCode}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDrilldownCategory(null);
                              if (onSelectInspection) onSelectInspection(session);
                            }}
                            className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>Buka Sesi</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Detail Tindakan CAPA jika ada */}
                      {finding.capa && (finding.capa.correctiveAction || finding.capa.rootCauseAnalysis) && (
                        <div className="p-2.5 bg-slate-100/80 rounded-lg text-[11px] text-slate-700 space-y-1">
                          {finding.capa.rootCauseAnalysis && (
                            <div>
                              <strong className="text-slate-900">Akar Masalah:</strong> {finding.capa.rootCauseAnalysis}
                            </div>
                          )}
                          {finding.capa.correctiveAction && (
                            <div>
                              <strong className="text-slate-900">Tindakan Perbaikan (CAPA):</strong> {finding.capa.correctiveAction}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                            <span>PIC: <strong>{finding.capa.pic || session.facility.picName}</strong></span>
                            <span>Status Evaluasi: <strong>{finding.capa.evaluationStatus}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setDrilldownCategory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
