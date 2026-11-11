import React, { useState } from 'react';
import { InspectionSession, UserRole, FindingCategory, AuthAccount } from '../types';
import { 
  Building2, 
  Clock, 
  Search, 
  Filter, 
  FileText, 
  Send, 
  FileCheck2, 
  MessageSquare, 
  Copy, 
  Check, 
  Eye, 
  ShieldCheck, 
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
  Sparkles,
  Download,
  UserCheck,
  Flame,
  Table
} from 'lucide-react';
import { 
  formatIndonesianDate, 
  calculateRemainingDays, 
  getStatusBadgeConfig,
  getCategoryBadge 
} from '../utils/date';
import { isCapaPendingEvaluation } from '../utils/csvExport';

interface InspectionListProps {
  inspections: InspectionSession[];
  currentRole: UserRole;
  currentUser?: AuthAccount | null;
  isOfficerFiltered?: boolean;
  onToggleOfficerFilter?: () => void;
  totalUnfilteredCount?: number;
  onSelectInspection: (inspection: InspectionSession) => void;
  onOpenSrikandiLetter: (inspection: InspectionSession) => void;
  onOpenSubmitCapa: (inspection: InspectionSession) => void;
  onOpenEvaluation: (inspection: InspectionSession) => void;
  onOpenNotificationPreview: (inspection: InspectionSession) => void;
  onOpenSrikandiWorkflow?: (inspection: InspectionSession) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  hideOfficerBanner?: boolean;
}

export const InspectionList: React.FC<InspectionListProps> = ({
  inspections,
  currentRole,
  currentUser,
  isOfficerFiltered,
  onToggleOfficerFilter,
  totalUnfilteredCount,
  onSelectInspection,
  onOpenSrikandiLetter,
  onOpenSubmitCapa,
  onOpenEvaluation,
  onOpenNotificationPreview,
  onOpenSrikandiWorkflow,
  activeFilter,
  onFilterChange,
  hideOfficerBanner = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | FindingCategory>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Total unevaluated count among displayed inspections
  const unevaluatedCount = inspections.filter(isCapaPendingEvaluation).length;

  // Total sessions evaluated and waiting for Admin to upload SRIKANDI cover letter
  const pendingAdminCoverLetterCount = inspections.filter(
    (ins) => ins.srikandiWorkflow?.needsAdminCoverLetter === true
  ).length;

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Filter items
  const filteredInspections = inspections.filter((item) => {
    // 1. Text search: real-time filtering by facility name, CAPA code, or assigned officer
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const facilityNameMatch = item.facility.name.toLowerCase().includes(q);
      const capaCodeMatch = item.capaCode.toLowerCase().includes(q);
      const assignedOfficerMatch =
        (Boolean(item.assignedOfficer?.name) && item.assignedOfficer!.name.toLowerCase().includes(q)) ||
        (Boolean(item.assignedOfficer?.nip) && item.assignedOfficer!.nip.toLowerCase().includes(q)) ||
        (Boolean(item.leadAuditor) && item.leadAuditor.toLowerCase().includes(q));
      const srikandiMatch = item.srikandiLetter.letterNo.toLowerCase().includes(q);
      const licenseMatch = item.facility.licenseNo.toLowerCase().includes(q);
      const findingsMatch = item.findings.some(
        (f) =>
          f.clause.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );

      if (!facilityNameMatch && !capaCodeMatch && !assignedOfficerMatch && !srikandiMatch && !licenseMatch && !findingsMatch) {
        return false;
      }
    }

    // 2. Active status filter
    if (activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN') {
      if (!item.srikandiWorkflow?.needsAdminCoverLetter) return false;
    } else if (activeFilter === 'BELUM_DIEVALUASI') {
      if (!isCapaPendingEvaluation(item)) return false;
    } else if (activeFilter === 'MENUNGGU_CAPA') {
      if (item.status !== 'MENUNGGU_CAPA' && item.status !== 'SURAT_TERBIT')
        return false;
    } else if (activeFilter === 'EVALUASI') {
      if (item.status !== 'CAPA_TERKIRIM' && item.status !== 'MASIH_EVALUASI')
        return false;
    } else if (activeFilter === 'PERLU_PERBAIKAN') {
      if (item.status !== 'PERLU_PERBAIKAN') return false;
    } else if (activeFilter === 'CLOSED') {
      if (item.status !== 'SELESAI_CLOSED' && item.status !== 'TERVALIDASI')
        return false;
    } else if (activeFilter === 'OVERDUE') {
      if (item.status === 'SELESAI_CLOSED' || item.status === 'TERVALIDASI')
        return false;
      const sla = calculateRemainingDays(item.srikandiLetter.deadlineDate);
      if (!sla.isOverdue) return false;
    }

    // 3. Facility type
    if (facilityTypeFilter !== 'ALL' && item.facility.type !== facilityTypeFilter) {
      return false;
    }

    // 4. Category filter
    if (categoryFilter !== 'ALL') {
      const hasCat = item.findings.some((f) => f.category === categoryFilter);
      if (!hasCat) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Officer / Evaluator Specific Context Banner */}
      {!hideOfficerBanner && currentRole === 'PETUGAS_EVALUATOR' && currentUser && (
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white">
                  Portal Tugas Evaluator: {currentUser.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  NIP. {currentUser.nip || '-'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isOfficerFiltered !== false 
                  ? 'Menampilkan daftar CAPA di mana Anda ditunjuk sebagai Penanggung Jawab / Lead Auditor PIC.'
                  : 'Menampilkan seluruh CAPA se-Balai Besar POM.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            {unevaluatedCount > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange(activeFilter === 'BELUM_DIEVALUASI' ? 'ALL' : 'BELUM_DIEVALUASI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  activeFilter === 'BELUM_DIEVALUASI'
                    ? 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{unevaluatedCount} Belum Dievaluasi</span>
              </button>
            )}

            {onToggleOfficerFilter && (
              <button
                type="button"
                onClick={onToggleOfficerFilter}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Beralih antara menampilkan hanya penugasan Anda atau semua data balai"
              >
                {isOfficerFiltered !== false ? 'Lihat Semua CAPA Balai' : 'Hanya Penugasan Saya'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Admin Specific SRIKANDI Action Alert Banner */}
      {(currentRole === 'ADMIN' || currentRole === 'SUPERVISOR') && pendingAdminCoverLetterCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-blue-400/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white">
                  Pemberitahuan Tugas Admin: {pendingAdminCoverLetterCount} Sesi Menunggu Surat Pengantar SRIKANDI
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold shadow-xs animate-pulse">
                  Perlu Unggah Naskah TTE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Petugas/Evaluator telah menyelesaikan telaah evaluasi CAPA. Admin perlu mengunggah Surat Pengantar ber-TTE dari SRIKANDI agar hasil evaluasi dapat resmi dikirimkan ke Sarana.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onFilterChange(activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN' ? 'ALL' : 'PERLU_SURAT_PENGANTAR_ADMIN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN'
                  ? 'bg-amber-400 text-slate-950 font-extrabold ring-2 ring-amber-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
              }`}
            >
              {activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN' ? 'Tampilkan Semua Sesi' : `Tampilkan ${pendingAdminCoverLetterCount} Sesi Perlu Surat`}
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box with real-time filter by facility name, CAPA code, or assigned officer */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama sarana, kode CAPA, atau nama petugas evaluator..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
            
            {searchQuery && (
              <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {filteredInspections.length} hasil
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  type="button"
                  title="Hapus kata kunci pencarian"
                  className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Quick Filter: Perlu Surat Pengantar SRIKANDI (Admin) */}
          {pendingAdminCoverLetterCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange(activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN' ? 'ALL' : 'PERLU_SURAT_PENGANTAR_ADMIN')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-extrabold ring-2 ring-blue-300'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
              }`}
            >
              <FileCheck2 className={`w-3.5 h-3.5 ${activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN' ? 'text-white' : 'text-blue-700'}`} />
              <span>Perlu Surat SRIKANDI ({pendingAdminCoverLetterCount})</span>
            </button>
          )}

          {/* Quick Filter: Belum Dievaluasi */}
          <button
            type="button"
            onClick={() => onFilterChange(activeFilter === 'BELUM_DIEVALUASI' ? 'ALL' : 'BELUM_DIEVALUASI')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              activeFilter === 'BELUM_DIEVALUASI'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-extrabold'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeFilter === 'BELUM_DIEVALUASI' ? 'text-slate-950' : 'text-amber-600'}`} />
            <span>Belum Dievaluasi ({unevaluatedCount})</span>
          </button>

          {/* Facility Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={facilityTypeFilter}
              onChange={(e) => setFacilityTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:border-emerald-500"
            >
              <option value="ALL">Semua Jenis Sarana</option>
              <option value="Industri Farmasi">Industri Farmasi</option>
              <option value="Pedagang Besar Farmasi (PBF)">PBF</option>
              <option value="Apotek">Apotek</option>
              <option value="Rumah Sakit">Rumah Sakit</option>
              <option value="Klinik">Klinik</option>
              <option value="Industri Pangan Olahan">Industri Pangan Olahan</option>
            </select>

            {/* Finding Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:border-emerald-500"
            >
              <option value="ALL">Semua Temuan</option>
              <option value="KRITIS">Ada Temuan Kritis</option>
              <option value="MAYOR">Ada Temuan Mayor</option>
              <option value="MINOR">Ada Temuan Minor</option>
            </select>

            {/* View Switcher */}
            <div className="hidden sm:flex border border-slate-300 rounded-xl overflow-hidden bg-slate-100 p-0.5">
              <button
                onClick={() => setViewMode('GRID')}
                type="button"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Grid Card"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                type="button"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel Detail"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        <div className="flex items-center justify-between text-xs pt-1 text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Menampilkan <strong>{filteredInspections.length}</strong> dari <strong>{inspections.length}</strong> sesi pemeriksaan
            </span>
            {searchQuery && (
              <span className="font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Search className="w-3 h-3 text-emerald-700" />
                <span>Pencarian: &quot;{searchQuery}&quot;</span>
                <button
                  onClick={() => setSearchQuery('')}
                  type="button"
                  className="hover:text-emerald-950 font-bold ml-0.5 cursor-pointer"
                  title="Hapus filter pencarian"
                >
                  ✕
                </button>
              </span>
            )}
            {activeFilter !== 'ALL' && (
              <span className="font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span>Filter Status: {
                  activeFilter === 'BELUM_DIEVALUASI' 
                    ? 'Belum Dievaluasi' 
                    : activeFilter === 'PERLU_SURAT_PENGANTAR_ADMIN' 
                    ? 'Perlu Surat Pengantar SRIKANDI (Admin)' 
                    : activeFilter
                }</span>
                <button
                  onClick={() => onFilterChange('ALL')}
                  type="button"
                  className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                  title="Hapus filter status"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {(searchQuery || facilityTypeFilter !== 'ALL' || categoryFilter !== 'ALL' || activeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFacilityTypeFilter('ALL');
                setCategoryFilter('ALL');
                onFilterChange('ALL');
              }}
              type="button"
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredInspections.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            Tidak Ada Sesi Pemeriksaan yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? `Tidak ditemukan sesi pemeriksaan dengan kata kunci "${searchQuery}". Coba periksa kembali ejaan nama sarana, kode CAPA, atau nama petugas evaluator.`
              : 'Coba sesuaikan kata kunci pencarian atau ubah filter status di bagian atas.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Hapus Pencarian
            </button>
          )}
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInspections.map((inspection) => {
            const statusBadge = getStatusBadgeConfig(inspection.status);
            const sla = calculateRemainingDays(inspection.srikandiLetter.deadlineDate);
            const kCount = inspection.findings.filter((f) => f.category === 'KRITIS').length;
            const mCount = inspection.findings.filter((f) => f.category === 'MAYOR').length;
            const nCount = inspection.findings.filter((f) => f.category === 'MINOR').length;
            const totalFiles = inspection.findings.reduce((acc, f) => acc + f.capa.evidenceFiles.length, 0);
            const isPending = isCapaPendingEvaluation(inspection);

            return (
              <div
                key={inspection.id}
                onClick={() => onSelectInspection(inspection)}
                className={`bg-white rounded-2xl border p-5 space-y-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isPending 
                    ? 'border-amber-300 ring-1 ring-amber-200/70 hover:border-amber-400' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Bar inside Card */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    {/* Unique CAPA Code Chip with Copy */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {inspection.capaCode}
                      </span>
                      <button
                        onClick={(e) => handleCopyCode(e, inspection.capaCode)}
                        type="button"
                        title="Salin kode unik CAPA"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        {copiedCode === inspection.capaCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Status Pill & Distinct Unevaluated Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {inspection.srikandiWorkflow?.needsAdminCoverLetter && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs animate-pulse">
                          <FileCheck2 className="w-3 h-3 text-blue-700 shrink-0" />
                          <span>Perlu Surat SRIKANDI</span>
                        </span>
                      )}

                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Belum Dievaluasi</span>
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Facility Name & Scope */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {inspection.facility.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{inspection.facility.type}</span>
                      <span>•</span>
                      <span className="font-mono truncate">{inspection.facility.licenseNo}</span>
                    </p>
                  </div>

                  {/* Highlight for Admin: Sesi Evaluasi Selesai, Menunggu Surat Pengantar SRIKANDI */}
                  {inspection.srikandiWorkflow?.needsAdminCoverLetter && (currentRole === 'ADMIN' || currentRole === 'SUPERVISOR') && (
                    <div className="mt-2.5 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-300 text-[11px] flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-blue-900 font-semibold truncate">
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-700 shrink-0 animate-pulse" />
                        <span className="truncate">Perlu Surat Pengantar Admin</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenSrikandiWorkflow) {
                            onOpenSrikandiWorkflow(inspection);
                          } else {
                            onSelectInspection(inspection);
                          }
                        }}
                        type="button"
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shadow-2xs cursor-pointer shrink-0"
                      >
                        Unggah Surat TTE
                      </button>
                    </div>
                  )}

                  {/* Highlight for Unevaluated CAPA that is submitted */}
                  {isPending && (inspection.status === 'CAPA_TERKIRIM' || inspection.status === 'MASIH_EVALUASI') && (
                    <div className="mt-2.5 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-300 text-[11px] flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold truncate">
                        <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-bounce" />
                        <span className="truncate">Perlu Telaah Evaluator</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEvaluation(inspection);
                        }}
                        type="button"
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shadow-2xs cursor-pointer shrink-0"
                      >
                        Mulai Telaah
                      </button>
                    </div>
                  )}

                  {/* SRIKANDI Letter Info */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Surat SRIKANDI:</span>
                      <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {inspection.srikandiLetter.letterNo}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Batas Waktu (SLA):</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          inspection.status === 'SELESAI_CLOSED'
                            ? 'text-emerald-700'
                            : sla.isOverdue
                            ? 'text-rose-600 font-bold'
                            : 'text-amber-700'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {inspection.status === 'SELESAI_CLOSED' ? 'Selesai Tuntas' : sla.text}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Petugas / Evaluator PIC */}
                  <div className="mt-2.5 px-2.5 py-1.5 bg-emerald-50/70 rounded-lg border border-emerald-200/80 text-[11px] flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-emerald-950 shrink-0">Petugas/Evaluator:</span>
                      <span className="font-medium text-slate-800 truncate" title={inspection.assignedOfficer?.name || inspection.leadAuditor}>
                        {inspection.assignedOfficer?.name || inspection.leadAuditor}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold shrink-0 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-0.5">
                      <MessageSquare className="w-2.5 h-2.5 text-emerald-700" />
                      WA PIC
                    </span>
                  </div>

                  {/* Findings breakdown badges */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {kCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded text-[10px] font-mono tabular-nums">
                          {kCount} Kritis
                        </span>
                      )}
                      {mCount > 0 && (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 font-bold rounded text-[10px] font-mono tabular-nums">
                          {mCount} Mayor
                        </span>
                      )}
                      {nCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded text-[10px] font-mono tabular-nums">
                          {nCount} Minor
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {totalFiles} Berkas Bukti
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons inside card */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSrikandiLetter(inspection);
                      }}
                      type="button"
                      title="Lihat Surat SRIKANDI TTE"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNotificationPreview(inspection);
                      }}
                      type="button"
                      title="Log Notifikasi WhatsApp & Email"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(inspection.status === 'MENUNGGU_CAPA' ||
                      inspection.status === 'PERLU_PERBAIKAN') && (
                      currentRole === 'SARANA' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSubmitCapa(inspection);
                          }}
                          type="button"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim CAPA</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu Sarana</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSubmitCapa(inspection);
                            }}
                            type="button"
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                            title="Pratinjau berkas sarana (Hanya Baca)"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Pratinjau</span>
                          </button>
                        </div>
                      )
                    )}

                    {(inspection.status === 'CAPA_TERKIRIM' ||
                      inspection.status === 'MASIH_EVALUASI') && (
                      currentRole !== 'SARANA' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEvaluation(inspection);
                          }}
                          type="button"
                          className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Telaah berkas perbaikan CAPA dan perbarui status evaluasi"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>Evaluasi CAPA</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <span>Sedang Dievaluasi</span>
                        </span>
                      )
                    )}

                    {/* Button for Admin to upload SRIKANDI cover letter if needsAdminCoverLetter */}
                    {inspection.srikandiWorkflow?.needsAdminCoverLetter && (currentRole === 'ADMIN' || currentRole === 'SUPERVISOR') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenSrikandiWorkflow) {
                            onOpenSrikandiWorkflow(inspection);
                          } else {
                            onSelectInspection(inspection);
                          }
                        }}
                        type="button"
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Buka alur pengunggahan Surat Pengantar TTE SRIKANDI"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>Unggah Surat SRIKANDI</span>
                      </button>
                    )}

                    <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 flex items-center">
                      <span>Buka</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Kode CAPA</th>
                  <th className="p-3.5">Nama Sarana & Izin</th>
                  <th className="p-3.5">Petugas / Evaluator PIC</th>
                  <th className="p-3.5">Surat SRIKANDI (TTE)</th>
                  <th className="p-3.5">Status Pemeriksaan</th>
                  <th className="p-3.5">Batas SLA</th>
                  <th className="p-3.5">Temuan</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInspections.map((inspection) => {
                  const statusBadge = getStatusBadgeConfig(inspection.status);
                  const sla = calculateRemainingDays(inspection.srikandiLetter.deadlineDate);
                  const isPending = isCapaPendingEvaluation(inspection);

                  return (
                    <tr
                      key={inspection.id}
                      onClick={() => onSelectInspection(inspection)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-emerald-800">
                        {inspection.capaCode}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {inspection.facility.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inspection.facility.type} • {inspection.facility.licenseNo}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {inspection.assignedOfficer?.name || inspection.leadAuditor}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>{inspection.assignedOfficer?.phone || '+62 812-7788-9911'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {inspection.srikandiLetter.letterNo}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                            {statusBadge.label}
                          </span>
                          {inspection.srikandiWorkflow?.needsAdminCoverLetter && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs animate-pulse">
                                <FileCheck2 className="w-3 h-3 text-blue-700 shrink-0" />
                                <span>Perlu Surat SRIKANDI</span>
                              </span>
                            </div>
                          )}
                          {isPending && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Belum Dievaluasi</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            sla.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold">{inspection.findings.length} butir</span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {inspection.srikandiWorkflow?.needsAdminCoverLetter && (currentRole === 'ADMIN' || currentRole === 'SUPERVISOR') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenSrikandiWorkflow) {
                                  onOpenSrikandiWorkflow(inspection);
                                } else {
                                  onSelectInspection(inspection);
                                }
                              }}
                              type="button"
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Unggah Surat Pengantar TTE SRIKANDI untuk dikirim ke Sarana"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>Unggah Surat</span>
                            </button>
                          )}
                          {isPending && currentRole !== 'SARANA' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEvaluation(inspection);
                              }}
                              type="button"
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Telaah berkas CAPA sarana"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>Evaluasi</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSubmitCapa(inspection);
                            }}
                            type="button"
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Buka Matriks CAPA Komoditi Halaman Penuh (Bukan Pop-up)"
                          >
                            <Table className="w-3 h-3 text-emerald-600" />
                            <span>Matriks</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInspection(inspection);
                            }}
                            type="button"
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
