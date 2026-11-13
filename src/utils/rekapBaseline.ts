// Baseline Rekap Pemeriksaan: data disimpan di server (PHP, dipakai bersama semua pengguna),
// bisa diedit langsung di SIMONCER, dan diperbarui lewat upload Excel/CSV atau tarik dari Google Spreadsheet.
// Saat upload ulang, data dibandingkan dulu (baris baru / berubah / bentrok dengan editan SIMONCER / hilang).

import {
  SHEET_TABS,
  SheetColumn,
  SheetRecord,
  SheetTabConfig,
  SheetTabData,
  buildTabData,
  findColumn,
  parseCsv,
} from './googleSheetSync';

export interface BaselineRecord extends SheetRecord {
  id: string;
  origin: 'IMPORT' | 'MANUAL';
  /** Kunci identitas saat terakhir diimpor (dipakai mencocokkan baris pada upload berikutnya). */
  sourceKey?: string;
  /** Label kolom yang pernah diubah langsung di SIMONCER (dilindungi saat upload ulang). */
  edited?: string[];
  editedAt?: string;
  editedBy?: string;
}

export interface BaselineHistoryEntry {
  at: string;
  by: string;
  note: string;
  version: number;
}

export interface BaselineTab {
  tab: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  source?: string;
  columns: SheetColumn[];
  records: BaselineRecord[];
  history?: BaselineHistoryEntry[];
}

export interface BaselineSummary {
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  recordCount: number;
}

// ---------------------------------------------------------------------------
// API server (public/api/rekap-baseline.php)
// ---------------------------------------------------------------------------

export class BaselineConflictError extends Error {
  constructor(message: string, public updatedBy?: string) {
    super(message);
    this.name = 'BaselineConflictError';
  }
}

function apiUrl(tab?: string): string {
  const url = new URL('api/rekap-baseline.php', document.baseURI);
  if (tab) url.searchParams.set('tab', tab);
  return url.toString();
}

async function readJson(res: Response): Promise<any> {
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    throw new Error(
      'Server penyimpanan baseline tidak tersedia. Buka SIMONCER lewat XAMPP (mis. https://192.168.1.25/simoncerv2/) agar data bisa disimpan.',
    );
  }
  const body = await res.json();
  if (!res.ok) {
    if (res.status === 409) throw new BaselineConflictError(body?.error || 'Data sudah diubah pengguna lain.', body?.updatedBy);
    throw new Error(body?.error || `Server mengembalikan HTTP ${res.status}.`);
  }
  return body;
}

export async function fetchBaselineSummary(signal?: AbortSignal): Promise<Record<string, BaselineSummary>> {
  const res = await fetch(apiUrl(), { signal, cache: 'no-store' });
  const body = await readJson(res);
  return body?.tabs || {};
}

export async function fetchBaselineTab(tabKey: string, signal?: AbortSignal): Promise<BaselineTab> {
  const res = await fetch(apiUrl(tabKey), { signal, cache: 'no-store' });
  const body = await readJson(res);
  return {
    tab: tabKey,
    version: Number(body?.version) || 0,
    updatedAt: body?.updatedAt,
    updatedBy: body?.updatedBy,
    source: body?.source,
    columns: Array.isArray(body?.columns) ? body.columns : [],
    records: Array.isArray(body?.records) ? body.records : [],
    history: Array.isArray(body?.history) ? body.history : [],
  };
}

export async function saveBaselineTab(
  base: BaselineTab,
  next: { columns: SheetColumn[]; records: BaselineRecord[]; source?: string },
  by: string,
  note: string,
): Promise<BaselineTab> {
  const res = await fetch(apiUrl(base.tab), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseVersion: base.version, by, note, data: { ...next, source: next.source ?? base.source ?? '' } }),
  });
  const body = await readJson(res);
  const saved: BaselineTab = {
    tab: base.tab,
    version: body.version,
    updatedAt: body.updatedAt,
    updatedBy: body.updatedBy,
    source: next.source ?? base.source,
    columns: next.columns,
    records: next.records,
    history: [{ at: body.updatedAt, by: body.updatedBy, note, version: body.version }, ...(base.history || [])].slice(0, 50),
  };
  writeCachedBaseline(saved);
  return saved;
}

export function emptyBaseline(tabKey: string): BaselineTab {
  return { tab: tabKey, version: 0, columns: [], records: [], history: [] };
}

const CACHE_PREFIX = 'simoncer_rekap_baseline_v1_';

export function readCachedBaseline(tabKey: string): BaselineTab | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + tabKey);
    return raw ? (JSON.parse(raw) as BaselineTab) : null;
  } catch {
    return null;
  }
}

export function writeCachedBaseline(data: BaselineTab): void {
  try {
    localStorage.setItem(CACHE_PREFIX + data.tab, JSON.stringify(data));
  } catch {
    // kuota penuh / mode privat — cache hanya pelengkap
  }
}

export function baselineToTabData(tab: SheetTabConfig, b: BaselineTab): SheetTabData {
  return { tab, columns: b.columns, records: b.records, fetchedAt: b.updatedAt || '' };
}

export function newRecordId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Membaca file Excel / CSV
// ---------------------------------------------------------------------------

export interface WorkbookSheet {
  name: string;
  rows: string[][];
}

export async function readWorkbookFile(file: File): Promise<WorkbookSheet[]> {
  if (/\.csv$/i.test(file.name)) {
    return [{ name: file.name.replace(/\.csv$/i, ''), rows: parseCsv(await file.text()) }];
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  return wb.SheetNames.map((name) => ({
    name,
    // raw:false → teks sesuai tampilan sel (tanggal, persen), sama seperti ekspor CSV Google
    rows: XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, raw: false, defval: '', blankrows: true }).map(
      (r) => r.map((c) => (c == null ? '' : String(c))),
    ),
  }));
}

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Tebak tab SIMONCER untuk nama sheet di file (mis. "2026 Produksi" → 2026-produksi). */
export function guessTabForSheet(sheetName: string): SheetTabConfig | undefined {
  const n = normName(sheetName);
  return SHEET_TABS.find((t) => normName(t.name) === n) || SHEET_TABS.find((t) => n.includes(normName(t.name)));
}

export function sheetToTabData(tab: SheetTabConfig, rows: string[][]): SheetTabData {
  return buildTabData(tab, rows);
}

// ---------------------------------------------------------------------------
// Identitas baris & perbandingan
// ---------------------------------------------------------------------------

const norm = (s: string | undefined) => (s || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

function identityIndexes(kind: SheetTabConfig['kind'], columns: SheetColumn[]): number[] {
  const pick = (patterns: RegExp[]) => patterns.map((p) => findColumn(columns, p)).filter((i): i is number => i !== undefined);
  return kind === 'LINTAS_SEKTOR'
    ? pick([/^nomor surat/i, /^tanggal$/i, /^perihal/i])
    : pick([/^nama sarana/i, /^kota/i, /^tanggal periksa mulai/i]);
}

/** Kunci identitas tiap baris; baris kembar diberi akhiran #2, #3, ... sesuai urutan. */
function identityKeys(kind: SheetTabConfig['kind'], columns: SheetColumn[], records: SheetRecord[]): string[] {
  const idx = identityIndexes(kind, columns);
  const all = columns.filter((c) => !/^no$/i.test(c.header)).map((c) => c.index);
  const seen = new Map<string, number>();
  return records.map((r) => {
    let base = idx.map((i) => norm(r.cells[i])).join('|');
    if (!base.replace(/\|/g, '')) base = 'ALL:' + all.map((i) => norm(r.cells[i])).join('|');
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}#${n}`;
  });
}

const valueByLabel = (columns: SheetColumn[], r: SheetRecord, label: string): string => {
  const col = columns.find((c) => c.label === label);
  return col ? (r.cells[col.index] || '').trim() : '';
};

export interface CellChange {
  label: string;
  before: string;
  after: string;
}

export interface DiffRow {
  kind: 'NEW' | 'CHANGED' | 'CONFLICT' | 'REMOVED';
  key: string;
  title: string;
  incoming?: SheetRecord;
  local?: BaselineRecord;
  /** Perubahan yang otomatis diterapkan (kolom yang tidak diedit di SIMONCER). */
  changes: CellChange[];
  /** Kolom yang diedit di SIMONCER DAN berbeda di file. before = nilai SIMONCER, after = nilai file. */
  conflicts: CellChange[];
}

export interface TabDiff {
  tab: SheetTabConfig;
  base: BaselineTab;
  incoming: SheetTabData;
  rows: DiffRow[];
  unchanged: number;
  manualKept: number;
  columnsAdded: string[];
  columnsRemoved: string[];
}

function rowTitle(tab: SheetTabConfig, columns: SheetColumn[], r: SheetRecord): string {
  const idx = identityIndexes(tab.kind, columns);
  const parts = idx.map((i) => (r.cells[i] || '').trim()).filter(Boolean);
  return parts.length ? parts.join(' • ') : `Baris ${r.rowNumber}`;
}

/** Pasangkan tiap baris file dengan baris baseline (lewat kunci impor terakhir, atau kunci isi saat ini). */
function matchRecords(tab: SheetTabConfig, base: BaselineTab, incoming: SheetTabData): { key: string; local?: BaselineRecord }[] {
  const inKeys = identityKeys(tab.kind, incoming.columns, incoming.records);
  const localCurrentKeys = identityKeys(tab.kind, base.columns, base.records);
  const localByKey = new Map<string, BaselineRecord>();
  base.records.forEach((r, i) => {
    const k = r.sourceKey || localCurrentKeys[i];
    if (!localByKey.has(k)) localByKey.set(k, r);
  });
  const used = new Set<string>();
  return inKeys.map((key) => {
    const local = localByKey.get(key);
    if (!local || used.has(local.id)) return { key };
    used.add(local.id);
    return { key, local };
  });
}

export function computeDiff(tab: SheetTabConfig, base: BaselineTab, incoming: SheetTabData): TabDiff {
  const matches = matchRecords(tab, base, incoming);
  const baseLabels = new Set(base.columns.map((c) => c.label));
  const inLabels = new Set(incoming.columns.map((c) => c.label));
  const rows: DiffRow[] = [];
  const matched = new Set<string>();
  let unchanged = 0;

  incoming.records.forEach((rec, i) => {
    const { key, local } = matches[i];
    if (!local) {
      rows.push({ kind: 'NEW', key, title: rowTitle(tab, incoming.columns, rec), incoming: rec, changes: [], conflicts: [] });
      return;
    }
    matched.add(local.id);
    const edited = new Set(local.edited || []);
    const changes: CellChange[] = [];
    const conflicts: CellChange[] = [];
    incoming.columns.forEach((c) => {
      if (/^no$/i.test(c.header)) return; // nomor urut boleh berubah
      const after = (rec.cells[c.index] || '').trim();
      const before = baseLabels.has(c.label) ? valueByLabel(base.columns, local, c.label) : '';
      if (after === before) return;
      (edited.has(c.label) ? conflicts : changes).push({ label: c.label, before, after });
    });
    if (!changes.length && !conflicts.length) {
      unchanged++;
      return;
    }
    rows.push({
      kind: conflicts.length ? 'CONFLICT' : 'CHANGED',
      key,
      title: rowTitle(tab, incoming.columns, rec),
      incoming: rec,
      local,
      changes,
      conflicts,
    });
  });

  let manualKept = 0;
  base.records.forEach((r) => {
    if (matched.has(r.id)) return;
    if (r.origin === 'MANUAL') {
      manualKept++;
      return;
    }
    rows.push({ kind: 'REMOVED', key: r.id, title: rowTitle(tab, base.columns, r), local: r, changes: [], conflicts: [] });
  });

  return {
    tab,
    base,
    incoming,
    rows,
    unchanged,
    manualKept,
    columnsAdded: base.columns.length ? incoming.columns.filter((c) => !baseLabels.has(c.label)).map((c) => c.label) : [],
    columnsRemoved: base.columns.filter((c) => !inLabels.has(c.label)).map((c) => c.label),
  };
}

export interface ApplyOptions {
  /** Kunci baris CONFLICT yang memakai nilai dari file (selain itu editan SIMONCER dipertahankan). */
  useFileFor: Set<string>;
  /** Hapus baris hasil impor yang tidak ada lagi di file. */
  removeMissing: boolean;
}

/** Pindahkan isi sel baris lama ke susunan kolom baru (dicocokkan lewat label kolom). */
function remapCells(from: SheetColumn[], to: SheetColumn[], r: SheetRecord): string[] {
  const cells: string[] = [];
  to.forEach((c) => {
    cells[c.index] = valueByLabel(from, r, c.label);
  });
  for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
  return cells;
}

export function applyDiff(diff: TabDiff, opts: ApplyOptions): { columns: SheetColumn[]; records: BaselineRecord[] } {
  const { base, incoming, tab } = diff;
  const columns = incoming.columns;
  const matches = matchRecords(tab, base, incoming);
  const rowByKey = new Map(diff.rows.filter((r) => r.incoming).map((r) => [r.key, r]));
  const keptLocals = new Set<string>();
  const records: BaselineRecord[] = [];

  incoming.records.forEach((rec, i) => {
    const { key, local } = matches[i];
    const cells = rec.cells.slice();
    if (!local) {
      records.push({ id: newRecordId(), origin: 'IMPORT', rowNumber: rec.rowNumber, group: rec.group, cells, sourceKey: key });
      return;
    }
    keptLocals.add(local.id);
    let edited = local.edited || [];
    const d = rowByKey.get(key);
    if (d?.kind === 'CONFLICT' && opts.useFileFor.has(key)) {
      const taken = new Set(d.conflicts.map((c) => c.label));
      edited = edited.filter((l) => !taken.has(l));
    }
    // Kolom yang diedit di SIMONCER (dan tidak dipilih "pakai file") tetap memakai nilai SIMONCER
    edited.forEach((label) => {
      const col = columns.find((c) => c.label === label);
      if (col) cells[col.index] = valueByLabel(base.columns, local, label);
    });
    records.push({
      ...local,
      rowNumber: rec.rowNumber,
      group: rec.group,
      cells,
      sourceKey: key,
      edited: edited.length ? edited : undefined,
    });
  });

  base.records.forEach((r) => {
    if (keptLocals.has(r.id)) return;
    if (r.origin === 'IMPORT' && opts.removeMissing) return;
    records.push({ ...r, cells: remapCells(base.columns, columns, r) });
  });

  return { columns, records };
}

/** Impor pertama (tab masih kosong): semua baris menjadi baseline. */
export function initialImport(incoming: SheetTabData): { columns: SheetColumn[]; records: BaselineRecord[] } {
  const keys = identityKeys(incoming.tab.kind, incoming.columns, incoming.records);
  return {
    columns: incoming.columns,
    records: incoming.records.map((r, i) => ({ ...r, cells: r.cells.slice(), id: newRecordId(), origin: 'IMPORT', sourceKey: keys[i] })),
  };
}
