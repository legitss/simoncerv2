// Sinkronisasi data Rekap Pemeriksaan dari Google Spreadsheet (read-only).
// Spreadsheet harus dibagikan "Siapa saja yang memiliki link dapat melihat".
// Data diambil langsung dari browser via endpoint ekspor CSV Google (CORS diizinkan),
// sehingga berfungsi baik saat dijalankan lewat server Node (port 3000) maupun dist/ di Apache.

export const GOOGLE_SHEET_ID = '1IspaOi9s-A1sNXtATS6mpVhMTFHQFN0A4UZu8uKi0QQ';

export interface SheetTabConfig {
  key: string;
  name: string;
  gid: string;
  kind: 'SARANA' | 'LINTAS_SEKTOR';
}

export const SHEET_TABS: SheetTabConfig[] = [
  { key: '2026-produksi', name: '2026 Produksi', gid: '844525682', kind: 'SARANA' },
  { key: '2026-distribusi', name: '2026 Distribusi', gid: '350739225', kind: 'SARANA' },
  { key: 'lintas-sektor-2026', name: 'Lintas Sektor 2026', gid: '1425595613', kind: 'LINTAS_SEKTOR' },
  { key: '2025-produksi', name: '2025 Produksi', gid: '380839854', kind: 'SARANA' },
  { key: '2025-distribusi', name: '2025 Distribusi', gid: '965406821', kind: 'SARANA' },
];

export interface SheetColumn {
  index: number;
  label: string; // label lengkap (termasuk grup), mis. "CAPA 1 — No. Surat"
  header: string; // judul kolom asli
}

export interface SheetRecord {
  rowNumber: number; // nomor baris di spreadsheet (1-based)
  group: string; // kelompok sarana (IF, PIRT, MD, DSK, Apotek, ...) dari baris pemisah di spreadsheet
  cells: string[];
}

export interface SheetTabData {
  tab: SheetTabConfig;
  columns: SheetColumn[];
  records: SheetRecord[];
  fetchedAt: string;
}

export function sheetEditUrl(gid?: string): string {
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit${gid ? `#gid=${gid}` : ''}`;
}

function csvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${gid}`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

const clean = (s: string | undefined) => (s || '').replace(/\s+/g, ' ').trim();

/**
 * Header di spreadsheet bertingkat: baris grup (mis. "CAPA 1", "EVAL CAPA I") di atas
 * baris judul ("No", "Nama Sarana", ...), kadang diikuti baris sub-judul.
 * Fungsi ini mencari baris judul (kolom A diawali "No"), lalu menyusun label tiap kolom.
 */
export function buildTabData(tab: SheetTabConfig, rows: string[][]): SheetTabData {
  const headerIdx = rows.findIndex((r) => /^no\b/i.test(clean(r[0])));
  const fetchedAt = new Date().toISOString();
  if (headerIdx < 0) {
    return { tab, columns: [], records: [], fetchedAt };
  }

  const header = rows[headerIdx];
  const groupRow = headerIdx > 0 ? rows[headerIdx - 1] : [];
  // Hanya tab Lintas Sektor yang punya baris sub-judul (Respon / Jawaban → No. Surat, Tanggal, ...)
  const subRow = tab.kind === 'LINTAS_SEKTOR' && rows[headerIdx + 1] && !clean(rows[headerIdx + 1][0]) ? rows[headerIdx + 1] : [];
  const width = Math.max(header.length, groupRow.length, subRow.length);
  const isNumericLabel = (s: string) => /^[\d.,%]+$/.test(s);

  const columns: SheetColumn[] = [];
  let currentGroup = '';
  let currentSubParent = '';
  for (let i = 0; i < width; i++) {
    const g = clean(groupRow[i]);
    if (g) currentGroup = g;
    const h = clean(header[i]);
    const s = clean(subRow[i]);
    let own = '';
    let parent = currentGroup;
    if (s && !isNumericLabel(s)) {
      if (h) currentSubParent = h;
      own = s;
      parent = currentSubParent;
    } else if (h && !isNumericLabel(h)) {
      own = h;
      if (subRow.length) currentSubParent = '';
    }
    // Abaikan kolom angka rekap (mis. "195", "81.82%") dan kolom tanpa judul
    if (!own) continue;
    const showParent = !!parent && (i > 20 || subRow.length > 0) && !own.toLowerCase().includes(parent.toLowerCase());
    columns.push({ index: i, header: own, label: showParent ? `${parent} — ${own}` : own });
  }

  const records: SheetRecord[] = [];
  let currentSection = '';
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const cells = rows[r];
    const section = detectSectionRow(cells);
    if (section) {
      currentSection = section;
      continue;
    }
    if (!/^\d+$/.test(clean(cells[0]))) continue;
    // Baris bernomor tetapi kosong (template) dilewati
    const filled = cells.slice(1).filter((c) => clean(c)).length;
    if (filled < 2) continue;
    records.push({ rowNumber: r + 1, group: currentSection, cells: cells.map((c) => (c || '').trim()) });
  }

  return { tab, columns, records, fetchedAt };
}

/**
 * Baris pemisah kelompok, mis. ",PIRT,PIRT,PIRT,..." atau ",UKOT/IOT/UMOT,UKOT,UKOT,...":
 * kolom A kosong dan kolom B..I berisi label yang sama berulang.
 */
function detectSectionRow(cells: string[]): string {
  if (clean(cells[0])) return '';
  const label = clean(cells[1]);
  if (!label || label.length > 40) return '';
  const rest = cells.slice(2, 9).map(clean).filter(Boolean);
  if (rest.length < 4) return '';
  const distinct = new Set(rest.map((v) => v.toUpperCase()));
  return distinct.size <= 2 ? label : '';
}

export async function fetchSheetTab(tab: SheetTabConfig, signal?: AbortSignal): Promise<SheetTabData> {
  return buildTabData(tab, await fetchSheetRows(tab, signal));
}

/** Ambil isi mentah satu tab Google Spreadsheet (baris × kolom). */
export async function fetchSheetRows(tab: SheetTabConfig, signal?: AbortSignal): Promise<string[][]> {
  const res = await fetch(`${csvUrl(tab.gid)}&_=${Date.now()}`, { signal, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Gagal mengambil tab "${tab.name}" (HTTP ${res.status}). Pastikan spreadsheet dibagikan "Siapa saja yang memiliki link".`);
  }
  const text = await res.text();
  if (/^\s*<!doctype html|<html/i.test(text)) {
    throw new Error(`Tab "${tab.name}" tidak dapat diakses. Pastikan spreadsheet dibagikan "Siapa saja yang memiliki link".`);
  }
  return parseCsv(text);
}

/** Cari indeks kolom berdasarkan pola judul (kemunculan pertama). */
export function findColumn(columns: SheetColumn[], pattern: RegExp): number | undefined {
  return columns.find((c) => pattern.test(c.header))?.index;
}

const CACHE_PREFIX = 'simoncer_gsheet_cache_v2_';

export function readCachedTab(tab: SheetTabConfig): SheetTabData | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + tab.gid);
    return raw ? (JSON.parse(raw) as SheetTabData) : null;
  } catch {
    return null;
  }
}

export function writeCachedTab(data: SheetTabData): void {
  try {
    localStorage.setItem(CACHE_PREFIX + data.tab.gid, JSON.stringify(data));
  } catch {
    // kuota penuh / mode privat — abaikan, cache hanya pelengkap
  }
}
