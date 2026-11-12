import React, { useState, useMemo } from 'react';
import { InspectionSession, UserRole } from '../types';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Send, 
  ExternalLink, 
  Eye, 
  Building2, 
  UserCheck, 
  Calendar, 
  Download, 
  Check, 
  X as CloseIcon, 
  Table as TableIcon, 
  LayoutGrid,
  Award,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { formatIndonesianDate, formatIndonesianDateTime, getStatusBadgeConfig } from '../utils/date';

interface SibergasSurveyTableProps {
  inspections: InspectionSession[];
  currentRole: UserRole;
  onOpenSurveyModal: (inspection: InspectionSession, readOnly?: boolean) => void;
  onRequestSubmitCapa: (inspection: InspectionSession) => void;
  onSelectInspection: (inspection: InspectionSession) => void;
}

export const SibergasSurveyTable: React.FC<SibergasSurveyTableProps> = ({
  inspections,
  currentRole,
  onOpenSurveyModal,
  onRequestSubmitCapa,
  onSelectInspection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [surveyStatusFilter, setSurveyStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [commodityFilter, setCommodityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Metrics computation
  const totalCount = inspections.length;
  const completedSurveys = inspections.filter((i) => i.sibergasSurvey?.completed);
  const completedCount = completedSurveys.length;
  const pendingCount = totalCount - completedCount;
  const complianceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Question indicators stats among completed surveys
  const bebasGratifikasiCount = completedSurveys.filter(
    (i) => i.sibergasSurvey?.gratifikasi.includes('Tidak')
  ).length;
  const profesionalCount = completedSurveys.filter(
    (i) => i.sibergasSurvey?.profesional.includes('Ya')
  ).length;
  const simoncerMembantuCount = completedSurveys.filter(
    (i) => i.sibergasSurvey?.simoncerMembantu.includes('Ya')
  ).length;

  const commodities = useMemo(() => {
    const set = new Set<string>();
    inspections.forEach((i) => {
      if (i.facility.type) set.add(i.facility.type);
    });
    return Array.from(set);
  }, [inspections]);

  // Filtered list
  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      // Survey Status Filter
      if (surveyStatusFilter === 'COMPLETED' && !ins.sibergasSurvey?.completed) return false;
      if (surveyStatusFilter === 'PENDING' && ins.sibergasSurvey?.completed) return false;

      // Commodity Filter
      if (commodityFilter !== 'ALL' && ins.facility.type !== commodityFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const officer = ins.assignedOfficer?.name || ins.leadAuditor;
        const matchFacility = ins.facility.name.toLowerCase().includes(q);
        const matchCode = ins.capaCode.toLowerCase().includes(q);
        const matchLetter = ins.srikandiLetter.letterNo.toLowerCase().includes(q);
        const matchOfficer = officer.toLowerCase().includes(q);
        const matchFeedback = ins.sibergasSurvey?.saranaMasukan?.toLowerCase().includes(q);

        if (!matchFacility && !matchCode && !matchLetter && !matchOfficer && !matchFeedback) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, surveyStatusFilter, commodityFilter, searchQuery]);

  // CSV Export for survey table
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Nama Sarana',
      'Jenis Sarana',
      'Kode CAPA',
      'Nomor Surat SRIKANDI',
      'Petugas Pemeriksa',
      'Status Survei SIBERGAS',
      'Tanggal Survei',
      '1. Tunjukkan ID / Surat Tugas',
      '2. Bersikap Profesional & Sopan',
      '3. Bersikap Arogan',
      '4. Menerima Gratifikasi',
      '5. Praktik Pemerasan',
      '6. SIMONCER Membantu',
      '7. Saran / Masukan Sarana',
    ];

    const rows = filteredInspections.map((ins, index) => {
      const s = ins.sibergasSurvey;
      const officer = ins.assignedOfficer?.name || ins.leadAuditor;
      return [
        index + 1,
        `"${ins.facility.name.replace(/"/g, '""')}"`,
        `"${ins.facility.type.replace(/"/g, '""')}"`,
        `"${ins.capaCode}"`,
        `"${ins.srikandiLetter.letterNo.replace(/"/g, '""')}"`,
        `"${officer.replace(/"/g, '""')}"`,
        s?.completed ? 'Sudah Diisi (CAPA Pertama)' : 'Belum Diisi',
        s?.submittedAt ? s.submittedAt.split('T')[0] : '-',
        s ? `"${s.petugasIdCard.replace(/"/g, '""')}"` : '-',
        s ? `"${s.profesional.replace(/"/g, '""')}"` : '-',
        s ? `"${s.arogan.replace(/"/g, '""')}"` : '-',
        s ? `"${s.gratifikasi.replace(/"/g, '""')}"` : '-',
        s ? `"${s.pemerasan.replace(/"/g, '""')}"` : '-',
        s ? `"${s.simoncerMembantu.replace(/"/g, '""')}"` : '-',
        s?.saranaMasukan ? `"${s.saranaMasukan.replace(/"/g, '""')}"` : '-',
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Survei_Integritas_SIBERGAS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bpom-hero-gradient rounded-2xl p-6 sm:p-7 text-[#1e3a5f] border border-emerald-200 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Monitoring Zona Integritas • Integrasi SIBERGAS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e3a5f] tracking-tight">
              Tabel & Rekapitulasi Hasil Survei Integritas Petugas
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Pemantauan survei kepuasan dan integritas petugas pengawas yang diisi oleh sarana saat pertama kali menyerahkan dokumen tindak lanjut CAPA. Menjamin pengawasan yang bersih, bebas gratifikasi, dan profesional.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              title="Unduh seluruh rekap survei integritas evaluator dalam format CSV"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Ekspor ke CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Mini Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-200 text-xs">
          <div className="bg-white/90 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[10px] text-slate-600 font-bold uppercase block">Total Sesi CAPA</span>
            <div className="text-xl font-black text-[#1e3a5f] mt-0.5">{totalCount}</div>
            <span className="text-[10px] text-slate-600">Terdaftar di SIMONCER</span>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Survei Selesai</span>
            <div className="text-xl font-black text-emerald-800 mt-0.5">{completedCount} <span className="text-xs font-normal text-slate-600">({complianceRate}%)</span></div>
            <span className="text-[10px] text-emerald-700/90">Kepatuhan Survei CAPA</span>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[10px] text-teal-700 font-bold uppercase block">Bebas Gratifikasi</span>
            <div className="text-xl font-black text-teal-800 mt-0.5">
              {completedCount > 0 ? `${Math.round((bebasGratifikasiCount / completedCount) * 100)}%` : '100%'}
            </div>
            <span className="text-[10px] text-slate-600">{bebasGratifikasiCount} dari {completedCount} responden</span>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[10px] text-amber-700 font-bold uppercase block">Menunggu Pengisian</span>
            <div className="text-xl font-black text-amber-800 mt-0.5">{pendingCount}</div>
            <span className="text-[10px] text-slate-600">Wajib diisi saat CAPA 1</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama sarana, kode CAPA, nama petugas, atau kata dalam masukan..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 transition-all placeholder-slate-400"
            />
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Commodity Filter */}
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Komoditi</option>
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Data"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Rinci"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Export to CSV button for Evaluator */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Unduh laporan hasil survei integritas terfilter ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor ke CSV</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-500">Status Survei:</span>
          <button
            type="button"
            onClick={() => setSurveyStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              surveyStatusFilter === 'ALL'
                ? 'bg-white text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setSurveyStatusFilter('COMPLETED')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              surveyStatusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Mengisi Survei ({completedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSurveyStatusFilter('PENDING')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              surveyStatusFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Belum Mengisi Survei ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Sarana & Komoditi</th>
                  <th className="py-3.5 px-4">Kode CAPA & Status</th>
                  <th className="py-3.5 px-4">Petugas Pemeriksa</th>
                  <th className="py-3.5 px-4">Status Survei</th>
                  <th className="py-3.5 px-4">Hasil 6 Indikator Integritas</th>
                  <th className="py-3.5 px-4">Masukan Sarana</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <ShieldCheck className="w-8 h-8 text-slate-700 mx-auto" />
                        <p className="font-semibold text-slate-700">Tidak ada data pemeriksaan yang cocok</p>
                        <p className="text-[11px] text-slate-600">
                          Coba ubah kata kunci pencarian atau sesuaikan filter status survei.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map((ins, index) => {
                    const survey = ins.sibergasSurvey;
                    const statusConfig = getStatusBadgeConfig(ins.status);
                    const officer = ins.assignedOfficer?.name || ins.leadAuditor;

                    return (
                      <tr
                        key={ins.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600 font-bold">
                          {index + 1}
                        </td>

                        {/* Sarana & Komoditi */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <button
                            type="button"
                            onClick={() => onSelectInspection(ins)}
                            className="font-bold text-slate-900 hover:text-emerald-700 text-left transition-colors cursor-pointer block truncate"
                            title={ins.facility.name}
                          >
                            {ins.facility.name}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                              {ins.facility.type}
                            </span>
                            <span>•</span>
                            <span className="truncate">{ins.facility.picName}</span>
                          </div>
                        </td>

                        {/* Kode CAPA */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">
                            {ins.capaCode}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Petugas Pemeriksa */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate" title={officer}>
                            {officer}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Audit: {formatIndonesianDate(ins.inspectionDate)}
                          </div>
                        </td>

                        {/* Status Survei SIBERGAS */}
                        <td className="py-3.5 px-4">
                          {survey?.completed ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Terisi (CAPA 1)</span>
                              </span>
                              <div className="text-[10px] text-slate-600 font-mono mt-1">
                                {formatIndonesianDate(survey.submittedAt.split('T')[0])}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3" />
                                <span>Belum Mengisi</span>
                              </span>
                              <div className="text-[10px] text-slate-600 mt-1">
                                Wajib saat CAPA pertama
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Hasil 6 Indikator */}
                        <td className="py-3.5 px-4 min-w-[220px]">
                          {survey?.completed ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                {/* ID Card */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    survey.petugasIdCard.includes('Ya')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                  title={`1. Surat Tugas/ID: ${survey.petugasIdCard}`}
                                >
                                  ID: {survey.petugasIdCard.includes('Ya') ? 'Ya' : 'Tidak'}
                                </span>

                                {/* Profesional */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    survey.profesional.includes('Ya')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                  title={`2. Profesional & Sopan: ${survey.profesional}`}
                                >
                                  Sopan: {survey.profesional.includes('Ya') ? 'Ya' : 'Tidak'}
                                </span>

                                {/* Arogan */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    survey.arogan.includes('Tidak')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                  title={`3. Arogan: ${survey.arogan}`}
                                >
                                  Arogan: {survey.arogan.includes('Tidak') ? 'Tidak' : 'Ya'}
                                </span>

                                {/* Gratifikasi */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    survey.gratifikasi.includes('Tidak')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                  title={`4. Gratifikasi: ${survey.gratifikasi}`}
                                >
                                  Gratifikasi: {survey.gratifikasi.includes('Tidak') ? 'Tidak' : 'Ya'}
                                </span>

                                {/* Pemerasan */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    survey.pemerasan.includes('Tidak')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                  title={`5. Pemerasan: ${survey.pemerasan}`}
                                >
                                  Pemerasan: {survey.pemerasan.includes('Tidak') ? 'Tidak' : 'Ya'}
                                </span>

                                {/* Membantu */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    survey.simoncerMembantu.includes('Ya')
                                      ? 'bg-teal-100 text-teal-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                  title={`6. SIMONCER Membantu: ${survey.simoncerMembantu}`}
                                >
                                  Membantu: {survey.simoncerMembantu.includes('Ya') ? 'Ya' : 'Tidak'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">- Menunggu CAPA pertama -</span>
                          )}
                        </td>

                        {/* Masukan Sarana */}
                        <td className="py-3.5 px-4 max-w-xs">
                          {survey?.saranaMasukan ? (
                            <p
                              className="text-[11px] text-slate-700 line-clamp-2 italic"
                              title={survey.saranaMasukan}
                            >
                              "{survey.saranaMasukan}"
                            </p>
                          ) : (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          {survey?.completed ? (
                            <button
                              type="button"
                              onClick={() => onOpenSurveyModal(ins, true)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer border border-slate-300"
                              title="Buka rincian kuesioner survei lengkap"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Lihat Survei</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRequestSubmitCapa(ins)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-xs"
                              title="Sarana mengisi survei integritas dan mengirimkan CAPA pertama"
                            >
                              <Send className="w-3 h-3" />
                              <span>Isi & CAPA</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInspections.map((ins) => {
            const survey = ins.sibergasSurvey;
            const statusConfig = getStatusBadgeConfig(ins.status);
            const officer = ins.assignedOfficer?.name || ins.leadAuditor;

            return (
              <div
                key={ins.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {ins.capaCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{ins.facility.name}</h4>
                    <p className="text-[11px] text-slate-500">{ins.facility.type} • PIC: {ins.facility.picName}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Petugas Pemeriksa:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{officer}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-600">Status SIBERGAS:</span>
                      {survey?.completed ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terisi (CAPA 1)</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Menunggu CAPA 1</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Survey Highlights if completed */}
                  {survey?.completed ? (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-1.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                          Gratifikasi: <strong>{survey.gratifikasi.includes('Tidak') ? 'Bebas ✓' : 'Ada ✕'}</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                          Pemerasan: <strong>{survey.pemerasan.includes('Tidak') ? 'Bebas ✓' : 'Ada ✕'}</strong>
                        </div>
                      </div>
                      {survey.saranaMasukan && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200 line-clamp-2">
                          "{survey.saranaMasukan}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                      Sarana diwajibkan mengisi kuesioner survei integritas saat pertama kali mengirimkan berkas CAPA.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectInspection(ins)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Buka Dossier
                  </button>

                  {survey?.completed ? (
                    <button
                      type="button"
                      onClick={() => onOpenSurveyModal(ins, true)}
                      className="px-3 py-1.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hasil Survei</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRequestSubmitCapa(ins)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim CAPA 1</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
