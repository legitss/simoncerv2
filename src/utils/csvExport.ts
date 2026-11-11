import { InspectionSession } from '../types';
import { calculateRemainingDays, formatIndonesianDate } from './date';

/**
 * Checks whether an inspection session has unevaluated CAPA
 */
export function isCapaPendingEvaluation(inspection: InspectionSession): boolean {
  if (inspection.status === 'SELESAI_CLOSED' || inspection.status === 'TERVALIDASI') {
    return false;
  }
  // If status is CAPA_TERKIRIM (facility has uploaded CAPA), MASIH_EVALUASI, or EVALUASI_PETUGAS
  if (inspection.status === 'CAPA_TERKIRIM' || inspection.status === 'MASIH_EVALUASI' || inspection.status === 'EVALUASI_PETUGAS') {
    return true;
  }
  // If findings have pending evaluation
  const hasPendingItems = inspection.findings.some(
    (f) => !f.capa?.evaluationStatus || f.capa.evaluationStatus === 'PENDING'
  );
  if (!inspection.evaluationReport && hasPendingItems) {
    return true;
  }
  return false;
}

/**
 * Export annual audit activity report to CSV format for internal reporting
 */
export function exportAnnualAuditActivityCSV(
  inspections: InspectionSession[],
  filterYear?: string | number
): { success: boolean; filename: string; totalExported: number } {
  // Filter by year if specified
  const listToExport = inspections.filter((ins) => {
    if (!filterYear || filterYear === 'ALL') return true;
    const yearStr = String(filterYear);
    const insYear = (ins.inspectionDate || ins.createdAt).substring(0, 4);
    return insYear === yearStr;
  });

  const selectedYear = filterYear && filterYear !== 'ALL' ? String(filterYear) : 'Tahunan';

  // CSV Columns Header
  const headers = [
    'No',
    'Tahun Audit',
    'Kode CAPA',
    'Nama Sarana',
    'Jenis Sarana / Komoditi',
    'Nomor NIB / Izin',
    'Alamat Lengkap Sarana',
    'Nama PIC Sarana',
    'Kontak WhatsApp PIC',
    'Email Sarana',
    'Tanggal Pelaksanaan Audit',
    'Ruang Lingkup Pemeriksaan',
    'Nomor Surat SRIKANDI (TTE)',
    'Tanggal Terbit Surat',
    'Batas Waktu SLA (Deadline)',
    'Status Kepatuhan SLA',
    'Petugas Penanggung Jawab (Lead Auditor)',
    'NIP Petugas',
    'Jabatan Petugas',
    'Tim Auditor Balai',
    'Status Evaluasi Petugas',
    'Status Pemeriksaan Terakhir',
    'Total Temuan',
    'Temuan Kritis',
    'Temuan Mayor',
    'Temuan Minor',
    'Jumlah Berkas Bukti CAPA',
    'Nomor Berita Acara Evaluasi',
    'Tanggal Evaluasi Terakhir',
    'Kesimpulan Evaluasi'
  ];

  // Helper to escape CSV values
  const escapeCell = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""').replace(/\r\n/g, ' ').replace(/\n/g, ' ');
    return `"${str}"`;
  };

  const rows: string[][] = listToExport.map((item, index) => {
    const sla = calculateRemainingDays(item.srikandiLetter.deadlineDate);
    const kCount = item.findings.filter((f) => f.category === 'KRITIS').length;
    const mCount = item.findings.filter((f) => f.category === 'MAYOR').length;
    const nCount = item.findings.filter((f) => f.category === 'MINOR').length;
    const totalEvidence = item.findings.reduce((acc, f) => acc + (f.capa?.evidenceFiles?.length || 0), 0);
    const isPending = isCapaPendingEvaluation(item);

    const auditYear = (item.inspectionDate || item.createdAt).substring(0, 4);
    const officerName = item.assignedOfficer?.name || item.leadAuditor;
    const officerNip = item.assignedOfficer?.nip || '-';
    const officerPos = item.assignedOfficer?.position || 'Pengawas Farmasi & Makanan';
    const auditorTeamStr = item.auditorTeam?.join('; ') || officerName;

    const evaluationStatusLabel = isPending 
      ? 'Belum Dievaluasi (Perlu Telaah)' 
      : (item.status === 'SELESAI_CLOSED' || item.status === 'TERVALIDASI' ? 'Tervalidasi / Selesai' : 'Sudah Dievaluasi');

    const slaStatusText = item.status === 'SELESAI_CLOSED' || item.status === 'TERVALIDASI'
      ? 'Selesai Tepat Waktu'
      : (sla.isOverdue ? `Terlambat (${Math.abs(sla.days)} hari)` : `Dalam Batas Waktu (${sla.days} hari lagi)`);

    return [
      String(index + 1),
      auditYear,
      item.capaCode,
      item.facility.name,
      item.facility.type,
      item.facility.licenseNo,
      item.facility.address,
      item.facility.picName,
      item.facility.picPhone,
      item.facility.picEmail,
      item.inspectionDate || item.createdAt.substring(0, 10),
      item.inspectionScope,
      item.srikandiLetter.letterNo,
      item.srikandiLetter.issuedDate,
      item.srikandiLetter.deadlineDate,
      slaStatusText,
      officerName,
      officerNip,
      officerPos,
      auditorTeamStr,
      evaluationStatusLabel,
      item.status,
      String(item.findings.length),
      String(kCount),
      String(mCount),
      String(nCount),
      String(totalEvidence),
      item.evaluationReport?.reportNo || '-',
      item.evaluationReport?.evaluatedAt ? formatIndonesianDate(item.evaluationReport.evaluatedAt) : '-',
      item.evaluationReport?.overallConclusion || item.evaluationReport?.notes || '-'
    ];
  });

  // Construct CSV content with UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10).replace(/-/g, '');
  const filename = `Laporan_Aktivitas_Audit_${selectedYear}_SIMONCER_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    totalExported: listToExport.length,
  };
}
