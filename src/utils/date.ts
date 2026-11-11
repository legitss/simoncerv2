import { InspectionStatus, FindingCategory } from '../types';

export function formatIndonesianDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatIndonesianDateTime(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' WIB';
  } catch {
    return dateString;
  }
}

// Daftar Hari Libur Nasional Indonesia (Format: YYYY-MM-DD)
// Meliputi hari libur resmi yang ditetapkan pemerintah untuk penentuan hari kerja
const INDONESIAN_HOLIDAYS: Set<string> = new Set([
  // 2026
  '2026-01-01', // Tahun Baru Masehi
  '2026-01-16', // Isra Miraj Nabi Muhammad SAW
  '2026-02-17', // Tahun Baru Imlek 2577
  '2026-03-19', // Hari Suci Nyepi Tahun Baru Saka 1948
  '2026-03-20', // Hari Raya Idul Fitri 1447 H (Hari 1)
  '2026-03-21', // Hari Raya Idul Fitri 1447 H (Hari 2)
  '2026-03-23', // Cuti Bersama Idul Fitri
  '2026-03-24', // Cuti Bersama Idul Fitri
  '2026-04-03', // Wafat Yesus Kristus
  '2026-05-01', // Hari Buruh Internasional
  '2026-05-14', // Kenaikan Yesus Kristus
  '2026-05-31', // Hari Raya Waisak 2570
  '2026-06-01', // Hari Lahir Pancasila
  '2026-06-17', // Hari Raya Idul Adha 1447 H
  '2026-07-07', // Tahun Baru Islam 1448 H
  '2026-08-17', // Hari Kemerdekaan RI (HUT RI ke-81)
  '2026-08-25', // Maulid Nabi Muhammad SAW
  '2026-12-25', // Hari Raya Natal
  '2026-12-26', // Cuti Bersama Natal
]);

/**
 * Mengecek apakah tanggal tertentu jatuh pada akhir pekan (Sabtu atau Minggu)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Minggu, 6 = Sabtu
}

/**
 * Mengecek apakah tanggal tertentu jatuh pada hari libur nasional Indonesia
 */
export function isIndonesianHoliday(date: Date): boolean {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;
  return INDONESIAN_HOLIDAYS.has(dateKey);
}

/**
 * Mengecek apakah tanggal tertentu merupakan Hari Kerja (Senin–Jumat, bukan hari libur nasional)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isIndonesianHoliday(date);
}

/**
 * Menambahkan sejumlah Hari Kerja (Business Days) dari tanggal acuan
 * Menghitung hari kerja berikutnya dan melompati Sabtu, Minggu, serta Libur Nasional
 * Digunakan untuk menghitung SLA penyerahan CAPA (misal 14 hari kerja)
 */
export function addBusinessDays(startDateInput: string | Date, workingDays: number): string {
  const current = new Date(startDateInput);
  if (isNaN(current.getTime())) return new Date().toISOString().split('T')[0];

  let added = 0;
  // Hitungan hari kerja dimulai pada hari kerja berikutnya setelah tanggal penerimaan surat
  while (added < workingDays) {
    current.setDate(current.getDate() + 1);
    if (isBusinessDay(current)) {
      added++;
    }
  }

  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Menghitung jumlah Hari Kerja antara dua tanggal (inklusif/eksklusif)
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start.getTime() > end.getTime()) return 0;

  let count = 0;
  const current = new Date(start);
  while (current.getTime() <= end.getTime()) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Menghitung mundur sisa waktu / SLA penyerahan CAPA
 * STANDAR BBPOM SEMARANG:
 * 1. Dihitung dalam HARI KERJA (Senin–Jumat, mengecualikan Sabtu, Minggu, dan Libur Nasional).
 * 2. Dimulai sejak tanggal pertama kali sarana menerima surat tindak lanjut.
 */
export function calculateRemainingDays(
  deadlineDateStr: string,
  options?: { useWorkingDays?: boolean; startDateStr?: string }
): {
  days: number;
  isOverdue: boolean;
  text: string;
  isWorkingDays: boolean;
} {
  const isWorkingDays = options?.useWorkingDays !== false; // Default: true (Hari Kerja)
  if (!deadlineDateStr) {
    return { days: 0, isOverdue: false, text: '-', isWorkingDays };
  }

  const deadline = new Date(deadlineDateStr);
  if (isNaN(deadline.getTime())) {
    return { days: 0, isOverdue: false, text: '-', isWorkingDays };
  }

  const now = new Date();
  deadline.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);

  const deadlineMidnight = new Date(deadline);
  deadlineMidnight.setHours(0, 0, 0, 0);

  // Jika menggunakan perhitungan Hari Kerja (Standar BBPOM Semarang)
  if (isWorkingDays) {
    if (now.getTime() === deadlineMidnight.getTime()) {
      return {
        days: 0,
        isOverdue: false,
        text: 'Batas Hari Ini (Hari Kerja Terakhir)',
        isWorkingDays: true,
      };
    }

    if (now.getTime() < deadlineMidnight.getTime()) {
      // Masih ada waktu: Hitung hari kerja dari besok s/d batas waktu (inklusif)
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      const remainingWorkDays = countBusinessDays(nextDay, deadlineMidnight);
      
      // Jika hari ini adalah hari kerja dan remainingWorkDays 0 (misal weekend di antaranya)
      const totalWorkDaysLeft = isBusinessDay(now) ? remainingWorkDays + 1 : remainingWorkDays;

      if (totalWorkDaysLeft <= 1) {
        return {
          days: totalWorkDaysLeft,
          isOverdue: false,
          text: totalWorkDaysLeft === 0 ? 'Batas Hari Ini' : 'Sisa 1 Hari Kerja',
          isWorkingDays: true,
        };
      }

      return {
        days: totalWorkDaysLeft,
        isOverdue: false,
        text: `Sisa ${totalWorkDaysLeft} Hari Kerja`,
        isWorkingDays: true,
      };
    } else {
      // Terlambat: Hitung berapa hari kerja yang telah terlewat sejak deadline
      const nextDayAfterDeadline = new Date(deadlineMidnight);
      nextDayAfterDeadline.setDate(nextDayAfterDeadline.getDate() + 1);
      const overdueWorkDays = countBusinessDays(nextDayAfterDeadline, now);
      const count = overdueWorkDays > 0 ? overdueWorkDays : 1;

      return {
        days: count,
        isOverdue: true,
        text: `Terlambat ${count} Hari Kerja`,
        isWorkingDays: true,
      };
    }
  }

  // Fallback: Hari Kalender (jika diminta spesifik)
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      isOverdue: true,
      text: `Terlambat ${Math.abs(diffDays)} Hari`,
      isWorkingDays: false,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      text: 'Batas Hari Ini',
      isWorkingDays: false,
    };
  } else {
    return {
      days: diffDays,
      isOverdue: false,
      text: `Sisa ${diffDays} Hari`,
      isWorkingDays: false,
    };
  }
}

export function getStatusBadgeConfig(status: InspectionStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft Pemeriksaan',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      };
    case 'SURAT_TERBIT':
      return {
        label: 'Surat SRIKANDI Terbit',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'MENUNGGU_CAPA':
      return {
        label: 'Menunggu CAPA Sarana',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'CAPA_TERKIRIM':
    case 'EVALUASI_PETUGAS':
      return {
        label: 'Evaluasi Petugas (CAPA Diterima)',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-300',
        dot: 'bg-indigo-600',
      };
    case 'MASIH_EVALUASI':
      return {
        label: 'Masih Evaluasi (In Review)',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'PERLU_PERBAIKAN':
      return {
        label: 'Perlu Perbaikan / Revisi CAPA',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'TERVALIDASI':
      return {
        label: 'Tervalidasi (CAPA Disetujui)',
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
      };
    case 'SELESAI_CLOSED':
      return {
        label: 'Selesai / Closed (Tuntas)',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
      };
  }
}

export function getCategoryBadge(category: FindingCategory): {
  label: string;
  bg: string;
  text: string;
  badge: string;
  border: string;
} {
  switch (category) {
    case 'KRITIS':
      return {
        label: 'Kritis',
        bg: 'bg-red-500',
        text: 'text-white',
        badge: 'bg-red-100 text-red-700 border-red-300 font-bold',
        border: 'border-red-300',
      };
    case 'MAYOR':
      return {
        label: 'Mayor',
        bg: 'bg-orange-500',
        text: 'text-white',
        badge: 'bg-orange-100 text-orange-700 border-orange-300 font-semibold',
        border: 'border-orange-300',
      };
    case 'MINOR':
      return {
        label: 'Minor',
        bg: 'bg-amber-500',
        text: 'text-white',
        badge: 'bg-amber-100 text-amber-700 border-amber-300',
        border: 'border-amber-300',
      };
  }
}
