import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Search,
  AlertCircle,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  CloudDownload,
  Pencil,
  Plus,
  Database,
} from 'lucide-react';
import {
  SHEET_TABS,
  SheetTabConfig,
  SheetTabData,
  SheetRecord,
  fetchSheetRows,
  findColumn,
  sheetEditUrl,
} from '../utils/googleSheetSync';
import {
  BaselineRecord,
  BaselineTab,
  BaselineConflictError,
  baselineToTabData,
  fetchBaselineTab,
  guessTabForSheet,
  newRecordId,
  readCachedBaseline,
  readWorkbookFile,
  saveBaselineTab,
  writeCachedBaseline,
} from '../utils/rekapBaseline';
import { RekapImportModal, ImportItem } from './rekap/RekapImportModal';
import { RekapRecordEditModal } from './rekap/RekapRecordEditModal';

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PAGE_SIZE = 25;

type Kesimpulan = 'MK' | 'TMK' | '';

function classifyKesimpulan(value: string): Kesimpulan {
  const v = value.toUpperCase();
  if (/\bTMK\b/.test(v)) return 'TMK';
  if (/\bMK\b/.test(v)) return 'MK';
  return '';
}

function formatSyncTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d) + ' WIB';
}

interface ColumnMap {
  no?: number;
  bulan?: number;
  nama?: number;
  alamat?: number;
  kota?: number;
  jenis?: number;
  periksa?: number;
  kesimpulan?: number;
  tindakLanjut?: number;
  petugas?: number;
  // Lintas sektor
  nomorSurat?: number;
  tanggal?: number;
  kepada?: number;
  perihal?: number;
  responTgl?: number;
}

function buildColumnMap(data: SheetTabData): ColumnMap {
  const c = data.columns;
  if (data.tab.kind === 'LINTAS_SEKTOR') {
    return {
      no: findColumn(c, /^no\b/i),
      nomorSurat: findColumn(c, /^nomor surat/i),
      tanggal: findColumn(c, /^tanggal$/i),
      kepada: findColumn(c, /^kepada/i),
      perihal: findColumn(c, /^perihal/i),
      responTgl: findColumn(c, /^tgl terima/i),
    };
  }
  return {
    no: findColumn(c, /^no$/i),
    bulan: findColumn(c, /^bulan/i),
    nama: findColumn(c, /^nama sarana/i),
    alamat: findColumn(c, /^alamat/i),
    kota: findColumn(c, /^kota/i),
    jenis: findColumn(c, /^jenis/i),
    periksa: findColumn(c, /^tanggal periksa mulai/i),
    kesimpulan: findColumn(c, /kesimpulan \(hasil balai\)/i),
    tindakLanjut: findColumn(c, /^tindak lanjut \(/i),
    petugas: findColumn(c, /^petugas$/i),
  };
}

const cell = (r: SheetRecord, idx?: number) => (idx === undefined ? '' : r.cells[idx] || '');
const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

/** Satu sarana beserta seluruh riwayat pemeriksaannya (urut sesuai spreadsheet). */
interface SaranaRekap {
  key: string;
  nama: string;
  alamat: string;
  kota: string;
  jenis: string;
  records: SheetRecord[];
  latest: SheetRecord;
}

function saranaKey(r: SheetRecord, col: ColumnMap): string {
  const nama = cell(r, col.nama);
  const kota = cell(r, col.kota).replace(/\s+/g, ' ').trim();
  // Sarana dengan nama sama di kota berbeda dianggap sarana berbeda
  return nama ? `${normalize(nama)}|${normalize(kota)}` : `baris-${(r as BaselineRecord).id ?? r.rowNumber}`;
}

function groupBySarana(records: SheetRecord[], col: ColumnMap): SaranaRekap[] {
  const map = new Map<string, SaranaRekap>();
  records.forEach((r) => {
    const nama = cell(r, col.nama);
    const kota = cell(r, col.kota).replace(/\s+/g, ' ').trim();
    const key = saranaKey(r, col);
    const existing = map.get(key);
    if (existing) {
      existing.records.push(r);
      existing.latest = r;
      if (!existing.alamat) existing.alamat = cell(r, col.alamat);
      if (!existing.jenis) existing.jenis = cell(r, col.jenis);
    } else {
      map.set(key, {
        key,
        nama,
        alamat: cell(r, col.alamat),
        kota,
        jenis: cell(r, col.jenis),
        records: [r],
        latest: r,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    if (!a.nama) return 1;
    if (!b.nama) return -1;
    return a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' });
  });
}

const KesimpulanBadge: React.FC<{ value: string }> = ({ value }) => {
  if (!value) return <span className="text-slate-400">-</span>;
  const k = classifyKesimpulan(value);
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
        k === 'TMK'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : k === 'MK'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      {value}
    </span>
  );
};

interface SpreadsheetRekapViewProps {
  /** Boleh edit / tambah / hapus / upload baseline */
  canEdit: boolean;
  /** Nama pengguna untuk riwayat perubahan */
  userName: string;
}

export const SpreadsheetRekapView: React.FC<SpreadsheetRekapViewProps> = ({ canEdit, userName }) => {
  const [activeKey, setActiveKey] = useState<string>(SHEET_TABS[0].key);
  const [baselines, setBaselines] = useState<Record<string, BaselineTab>>(() => {
    const initial: Record<string, BaselineTab> = {};
    SHEET_TABS.forEach((t) => {
      const cached = readCachedBaseline(t.key);
      if (cached) initial[t.key] = cached;
    });
    return initial;
  });
  const [importState, setImportState] = useState<{ sourceLabel: string; items: ImportItem[] } | null>(null);
  const [preparing, setPreparing] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ record: BaselineRecord | null } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kotaFilter, setKotaFilter] = useState('');
  const [saranaFilter, setSaranaFilter] = useState('');
  // 'PEMERIKSAAN' = tabel per pemeriksaan, 'SARANA' = daftar sarana (aktif saat kartu Sarana diklik)
  const [viewMode, setViewMode] = useState<'PEMERIKSAAN' | 'SARANA'>('PEMERIKSAAN');
  const [kesimpulanFilter, setKesimpulanFilter] = useState<'' | 'MK' | 'TMK' | 'KOSONG'>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{ title: string; records: BaselineRecord[] } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeTab = SHEET_TABS.find((t) => t.key === activeKey) as SheetTabConfig;
  const baseline = baselines[activeKey];
  const data: SheetTabData | undefined = useMemo(
    () => (baseline && baseline.version > 0 ? baselineToTabData(activeTab, baseline) : undefined),
    [baseline, activeTab],
  );

  const storeBaseline = useCallback((b: BaselineTab) => {
    setBaselines((prev) => ({ ...prev, [b.tab]: b }));
    writeCachedBaseline(b);
  }, []);

  const sync = useCallback(async (tab: SheetTabConfig) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoadingKey(tab.key);
    setError(null);
    try {
      storeBaseline(await fetchBaselineTab(tab.key, ctrl.signal));
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Gagal memuat data baseline dari server.');
    } finally {
      if (abortRef.current === ctrl) setLoadingKey(null);
    }
  }, [storeBaseline]);

  // ---- Upload Excel/CSV & tarik dari Google Spreadsheet -------------------
  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPreparing('Membaca file…');
    setError(null);
    try {
      const sheets = await readWorkbookFile(file);
      const isCsv = /\.csv$/i.test(file.name);
      const items: ImportItem[] = sheets
        .filter((s) => s.rows.some((r) => r.some((c) => c.trim())))
        .map((s) => ({ label: s.name, rows: s.rows, tabKey: isCsv ? activeKey : guessTabForSheet(s.name)?.key || '' }));
      if (!items.length) throw new Error('File kosong atau tidak ada sheet yang berisi data.');
      setImportState({ sourceLabel: `file "${file.name}"`, items });
    } catch (err: any) {
      setError(err?.message || 'File tidak dapat dibaca. Gunakan format .xlsx, .xls, atau .csv.');
    } finally {
      setPreparing(null);
    }
  };

  const pullFromGoogle = async (tabs: SheetTabConfig[]) => {
    setPreparing('Mengambil data dari Google Spreadsheet…');
    setError(null);
    try {
      const rows = await Promise.all(tabs.map((t) => fetchSheetRows(t)));
      setImportState({
        sourceLabel: 'Google Spreadsheet',
        items: tabs.map((t, i) => ({ label: t.name, tabKey: t.key, rows: rows[i] })),
      });
    } catch (err: any) {
      setError(err?.message || 'Gagal mengambil data dari Google Spreadsheet. Periksa koneksi internet.');
    } finally {
      setPreparing(null);
    }
  };

  // ---- Edit / tambah / hapus satu baris ----------------------------------
  const groups = useMemo(() => {
    const set = new Set<string>();
    baseline?.records.forEach((r) => r.group && set.add(r.group));
    return Array.from(set);
  }, [baseline]);

  const persistRecords = async (records: BaselineRecord[], note: string): Promise<boolean> => {
    if (!baseline) return false;
    setEditSaving(true);
    setEditError(null);
    try {
      storeBaseline(await saveBaselineTab(baseline, { columns: baseline.columns, records }, userName, note));
      return true;
    } catch (err: any) {
      if (err instanceof BaselineConflictError) {
        setEditError(`${err.message}${err.updatedBy ? ` (diubah oleh ${err.updatedBy})` : ''} Data terbaru sudah dimuat; silakan ulangi.`);
        sync(activeTab);
      } else {
        setEditError(err?.message || 'Gagal menyimpan ke server.');
      }
      return false;
    } finally {
      setEditSaving(false);
    }
  };

  // Dipanggil dari event handler (setelah render), jadi aman memakai colMap/isSarana yang dideklarasikan di bawah
  const recordTitle = (cells: string[]) => {
    const at = (i?: number) => (i === undefined ? '' : cells[i] || '');
    return (isSarana ? at(colMap.nama) : at(colMap.perihal) || at(colMap.nomorSurat)) || '(tanpa judul)';
  };

  const saveRecord = async (values: { group: string; cells: Record<number, string> }) => {
    if (!baseline || !editing) return;
    const before = editing.record;
    const cells = before ? before.cells.slice() : [];
    const changed: string[] = [];
    baseline.columns.forEach((c) => {
      const v = (values.cells[c.index] ?? '').trim();
      if ((cells[c.index] || '').trim() !== v) changed.push(c.label);
      cells[c.index] = v;
    });
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
    const now = new Date().toISOString();
    let records: BaselineRecord[];
    let saved: BaselineRecord;
    if (before) {
      if (!changed.length && values.group === before.group) {
        setEditing(null);
        return;
      }
      saved = {
        ...before,
        group: values.group,
        cells,
        edited: Array.from(new Set([...(before.edited || []), ...changed])),
        editedAt: now,
        editedBy: userName,
      };
      records = baseline.records.map((r) => (r.id === before.id ? saved : r));
    } else {
      saved = {
        id: newRecordId(),
        origin: 'MANUAL',
        rowNumber: 0,
        group: values.group,
        cells,
        edited: changed,
        editedAt: now,
        editedBy: userName,
      };
      records = baseline.records.slice();
      let insertAt = -1;
      records.forEach((r, i) => r.group === values.group && (insertAt = i));
      records.splice(insertAt >= 0 ? insertAt + 1 : records.length, 0, saved);
    }
    const ok = await persistRecords(records, `${before ? 'Edit' : 'Tambah'} baris: ${recordTitle(cells)}`);
    if (!ok) return;
    setEditing(null);
    setSelected((s) => (s && before ? { ...s, records: s.records.map((r) => (r.id === saved.id ? saved : r)) } : s));
  };

  const deleteRecord = async () => {
    const target = editing?.record;
    if (!baseline || !target) return;
    const ok = await persistRecords(
      baseline.records.filter((r) => r.id !== target.id),
      `Hapus baris: ${recordTitle(target.cells)}`,
    );
    if (!ok) return;
    setEditing(null);
    setSelected((s) => {
      if (!s) return s;
      const rest = s.records.filter((r) => r.id !== target.id);
      return rest.length ? { ...s, records: rest } : null;
    });
  };

  // Muat baseline saat tab dibuka + cek perubahan tiap 5 menit selama halaman terlihat
  useEffect(() => {
    sync(activeTab);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') sync(activeTab);
    }, AUTO_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [activeTab, sync]);

  useEffect(() => {
    setPage(1);
  }, [activeKey, search, kotaFilter, saranaFilter, kesimpulanFilter, viewMode]);

  useEffect(() => {
    setKotaFilter('');
    setSaranaFilter('');
    setViewMode('PEMERIKSAAN');
    setKesimpulanFilter('');
    setSearch('');
  }, [activeKey]);

  const colMap: ColumnMap = useMemo(() => (data ? buildColumnMap(data) : {}), [data]);
  const isSarana = activeTab.kind === 'SARANA';

  const kotaOptions = useMemo(() => {
    if (!data || colMap.kota === undefined) return [];
    const set = new Set<string>();
    data.records.forEach((r) => {
      const k = cell(r, colMap.kota).replace(/\s+/g, ' ').trim();
      if (k) set.add(k);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [data, colMap]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.records.filter((r) => {
      if (q && !r.cells.some((c) => c.toLowerCase().includes(q))) return false;
      if (saranaFilter && saranaKey(r, colMap) !== saranaFilter) return false;
      if (kotaFilter && cell(r, colMap.kota).replace(/\s+/g, ' ').trim() !== kotaFilter) return false;
      if (kesimpulanFilter) {
        const k = classifyKesimpulan(cell(r, colMap.kesimpulan));
        if (kesimpulanFilter === 'KOSONG' ? k !== '' : k !== kesimpulanFilter) return false;
      }
      return true;
    });
  }, [data, search, kotaFilter, saranaFilter, kesimpulanFilter, colMap]);

  // Daftar seluruh sarana (A–Z)
  const allSarana = useMemo(
    () => (isSarana && data ? groupBySarana(data.records, colMap) : []),
    [isSarana, data, colMap],
  );
  const saranaOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSarana.filter((sr) => {
      if (kotaFilter && sr.kota !== kotaFilter) return false;
      if (q && !`${sr.nama} ${sr.alamat} ${sr.kota}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allSarana, search, kotaFilter]);
  const activeSarana = allSarana.find((sr) => sr.key === saranaFilter);
  const saranaMode = isSarana && viewMode === 'SARANA';

  // Klik kartu statistik: kartu Sarana mengubah pencarian menjadi per sarana
  const selectCard = (f: '' | 'MK' | 'TMK' | 'KOSONG' | 'SARANA') => {
    setSearch('');
    if (f === 'SARANA') {
      setViewMode('SARANA');
      setSaranaFilter('');
      setKesimpulanFilter('');
    } else {
      setViewMode('PEMERIKSAAN');
      setKesimpulanFilter(f);
    }
  };

  const openSarana = (key: string) => {
    setSaranaFilter(key);
    setSearch('');
    setKesimpulanFilter('');
    setViewMode('PEMERIKSAAN');
  };

  const stats = useMemo(() => {
    const recs = data?.records || [];
    let mk = 0;
    let tmk = 0;
    recs.forEach((r) => {
      const k = classifyKesimpulan(cell(r, colMap.kesimpulan));
      if (k === 'MK') mk++;
      else if (k === 'TMK') tmk++;
    });
    return { total: recs.length, mk, tmk, kosong: recs.length - mk - tmk };
  }, [data, colMap]);

  const totalRows = saranaMode ? saranaOptions.length : filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const isLoading = loadingKey === activeKey;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#2e856e]/10 text-[#2e856e] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#243b55]">Rekap Pemeriksaan (Baseline)</h2>
            <p className="text-xs text-slate-600">
              {canEdit
                ? 'Data baseline tersimpan di server SIMONCER. Edit langsung di sini, atau perbarui dengan upload Excel/CSV atau tarik dari Google Spreadsheet.'
                : 'Data baseline tersimpan di server SIMONCER dan dipakai bersama semua pengguna.'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Terakhir diperbarui: <strong className="text-slate-700">{formatSyncTime(baseline?.updatedAt)}</strong>
              {baseline?.updatedBy && <span>oleh <strong className="text-slate-700">{baseline.updatedBy}</strong></span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canEdit && (
            <>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChosen} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!preparing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bpom-active-gradient text-white shadow-sm disabled:opacity-60 cursor-pointer"
                title="Upload file Excel (.xlsx) atau CSV dengan format yang sama seperti spreadsheet rekap"
              >
                <Upload className="w-4 h-4" />
                Upload Excel/CSV
              </button>
              <button
                type="button"
                onClick={() => pullFromGoogle(SHEET_TABS)}
                disabled={!!preparing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#243b55] hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                title="Ambil data terbaru dari Google Spreadsheet, lalu tampilkan perbandingannya sebelum disimpan"
              >
                <CloudDownload className="w-4 h-4" />
                Tarik dari Google Sheet
              </button>
              {data && (
                <button
                  type="button"
                  onClick={() => {
                    setEditError(null);
                    setEditing({ record: null });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#243b55] hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Data
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => sync(activeTab)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#243b55] hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            title="Muat ulang data dari server"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
          <a
            href={sheetEditUrl(activeTab.gid)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#243b55] hover:bg-slate-50"
            title="Buka Google Spreadsheet sumber"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {preparing && (
        <p className="text-xs font-bold text-[#243b55] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {preparing}
        </p>
      )}

      {/* Tab sheet */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SHEET_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveKey(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap shrink-0 cursor-pointer transition-all ${
              t.key === activeKey
                ? 'bpom-active-gradient text-white font-extrabold shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-[#243b55] font-bold'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{error}</p>
            {data && <p className="mt-0.5">Menampilkan salinan data terakhir di perangkat ini ({formatSyncTime(data.fetchedAt)}).</p>}
          </div>
        </div>
      )}

      {/* Statistik */}
      {isSarana && data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Pemeriksaan', value: stats.total, icon: FileSpreadsheet, cls: 'text-[#243b55] bg-[#2c4c70]/10', f: '' as const },
            { label: 'Sarana', value: allSarana.length, icon: Building2, cls: 'text-sky-700 bg-sky-50', f: 'SARANA' as const },
            { label: 'MK', value: stats.mk, icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50', f: 'MK' as const },
            { label: 'TMK', value: stats.tmk, icon: XCircle, cls: 'text-rose-700 bg-rose-50', f: 'TMK' as const },
            { label: 'Belum Ada Kesimpulan', value: stats.kosong, icon: Clock, cls: 'text-amber-700 bg-amber-50', f: 'KOSONG' as const },
          ].map((c) => {
            const active = c.f === 'SARANA' ? saranaMode : !saranaMode && kesimpulanFilter === c.f;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => selectCard(c.f)}
                className={`p-4 bg-white rounded-2xl border text-left cursor-pointer transition-all ${
                  active ? 'border-[#2e856e] ring-2 ring-[#2e856e]/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center ${c.cls}`}>
                  <c.icon className="w-4 h-4" />
                </span>
                <p className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">{c.value}</p>
                <p className="text-[11px] font-bold text-slate-600">{c.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              saranaMode
                ? 'Cari nama sarana…'
                : isSarana
                  ? 'Cari nama sarana, alamat, petugas, temuan…'
                  : 'Cari nomor surat, tujuan, perihal…'
            }
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2e856e]/30"
          />
        </div>
        {isSarana && (
          <>
            <select
              value={kotaFilter}
              onChange={(e) => setKotaFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white"
            >
              <option value="">Semua Kota/Kab</option>
              {kotaOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {!saranaMode && (
            <select
              value={kesimpulanFilter}
              onChange={(e) => setKesimpulanFilter(e.target.value as typeof kesimpulanFilter)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white"
            >
              <option value="">Semua Kesimpulan</option>
              <option value="MK">MK</option>
              <option value="TMK">TMK</option>
              <option value="KOSONG">Belum ada kesimpulan</option>
            </select>
            )}
          </>
        )}
      </div>

      {/* Sarana yang sedang dipilih */}
      {isSarana && !saranaMode && activeSarana && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600">Menampilkan pemeriksaan sarana:</span>
          <button
            type="button"
            onClick={() => setSaranaFilter('')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#2e856e]/10 text-[#2e856e] border border-[#2e856e]/30 cursor-pointer"
            title="Hapus filter sarana"
          >
            <span className="truncate max-w-[260px]">{activeSarana.nama || '(Tanpa nama sarana)'}</span>
            <CloseIcon className="w-3.5 h-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => selectCard('SARANA')}
            className="font-bold text-[#243b55] underline underline-offset-2 cursor-pointer"
          >
            Pilih sarana lain
          </button>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {!data ? (
          <div className="p-10 text-center text-sm text-slate-500 space-y-3">
            {isLoading && !baseline ? (
              <p>Memuat data baseline dari server…</p>
            ) : (
              <>
                <Database className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">Baseline tab "{activeTab.name}" belum ada.</p>
                {canEdit ? (
                  <>
                    <p className="text-xs">Impor sekali dari Google Spreadsheet atau upload file Excel/CSV untuk membuat baseline.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => pullFromGoogle(SHEET_TABS)}
                        disabled={!!preparing}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bpom-active-gradient text-white disabled:opacity-60 cursor-pointer"
                      >
                        <CloudDownload className="w-4 h-4" /> Impor semua tab dari Google Sheet
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!!preparing}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#243b55] hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" /> Upload Excel/CSV
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs">Hubungi Admin untuk mengimpor data rekap.</p>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[#243b55] text-left">
                  {saranaMode ? (
                    <tr>
                      <th className="px-3 py-2.5 font-extrabold">No</th>
                      <th className="px-3 py-2.5 font-extrabold min-w-[240px]">Nama Sarana</th>
                      <th className="px-3 py-2.5 font-extrabold">Kota/Kab</th>
                      <th className="px-3 py-2.5 font-extrabold">Jenis</th>
                      <th className="px-3 py-2.5 font-extrabold text-center">Jml Periksa</th>
                      <th className="px-3 py-2.5 font-extrabold">Kesimpulan</th>
                    </tr>
                  ) : isSarana ? (
                    <tr>
                      <th className="px-3 py-2.5 font-extrabold">No</th>
                      <th className="px-3 py-2.5 font-extrabold">Bulan</th>
                      <th className="px-3 py-2.5 font-extrabold min-w-[220px]">Sarana</th>
                      <th className="px-3 py-2.5 font-extrabold">Kota/Kab</th>
                      <th className="px-3 py-2.5 font-extrabold">Jenis</th>
                      <th className="px-3 py-2.5 font-extrabold">Tgl Periksa</th>
                      <th className="px-3 py-2.5 font-extrabold">Kesimpulan</th>
                      <th className="px-3 py-2.5 font-extrabold">Tindak Lanjut</th>
                      <th className="px-3 py-2.5 font-extrabold">Petugas</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2.5 font-extrabold">No</th>
                      <th className="px-3 py-2.5 font-extrabold">Nomor Surat</th>
                      <th className="px-3 py-2.5 font-extrabold">Tanggal</th>
                      <th className="px-3 py-2.5 font-extrabold">Kepada</th>
                      <th className="px-3 py-2.5 font-extrabold min-w-[240px]">Perihal</th>
                      <th className="px-3 py-2.5 font-extrabold">Respon Diterima</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {totalRows === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                        Tidak ada data yang cocok dengan filter.
                      </td>
                    </tr>
                  )}

                  {saranaMode &&
                    saranaOptions.slice(pageStart, pageStart + PAGE_SIZE).map((sr, i) => (
                      <tr
                        key={sr.key}
                        onClick={() => openSarana(sr.key)}
                        className="hover:bg-slate-50 cursor-pointer align-top"
                        title="Lihat seluruh pemeriksaan sarana ini"
                      >
                        <td className="px-3 py-2 font-mono">{pageStart + i + 1}</td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-slate-900">{sr.nama || '(Tanpa nama sarana)'}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{sr.alamat}</p>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{sr.kota || '-'}</td>
                        <td className="px-3 py-2">{sr.jenis || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block text-[11px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums ${
                              sr.records.length > 1 ? 'bg-[#2c4c70]/10 text-[#243b55]' : 'text-slate-500'
                            }`}
                          >
                            {sr.records.length}×
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {sr.records.map((r) => (
                              <KesimpulanBadge key={(r as BaselineRecord).id ?? r.rowNumber} value={cell(r, colMap.kesimpulan)} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {isSarana && !saranaMode &&
                    filteredRecords.slice(pageStart, pageStart + PAGE_SIZE).map((r, i) => (
                      <tr
                        key={(r as BaselineRecord).id ?? r.rowNumber}
                        onClick={() => setSelected({ title: cell(r, colMap.nama) || '(Tanpa nama sarana)', records: [r as BaselineRecord] })}
                        className="hover:bg-slate-50 cursor-pointer align-top"
                      >
                        <td className="px-3 py-2 font-mono">{pageStart + i + 1}</td>
                        <td className="px-3 py-2">{cell(r, colMap.bulan) || '-'}</td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-slate-900">
                            {cell(r, colMap.nama) || '-'}
                            <EditedMark r={r as BaselineRecord} />
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{cell(r, colMap.alamat)}</p>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{cell(r, colMap.kota) || '-'}</td>
                        <td className="px-3 py-2">{cell(r, colMap.jenis) || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{cell(r, colMap.periksa) || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <KesimpulanBadge value={cell(r, colMap.kesimpulan)} />
                        </td>
                        <td className="px-3 py-2">{cell(r, colMap.tindakLanjut) || '-'}</td>
                        <td className="px-3 py-2">{cell(r, colMap.petugas) || '-'}</td>
                      </tr>
                    ))}

                  {!isSarana &&
                    filteredRecords.slice(pageStart, pageStart + PAGE_SIZE).map((r, i) => {
                      const respon = cell(r, colMap.responTgl);
                      return (
                        <tr
                          key={(r as BaselineRecord).id ?? r.rowNumber}
                          onClick={() =>
                            setSelected({ title: cell(r, colMap.perihal) || cell(r, colMap.nomorSurat) || 'Detail', records: [r as BaselineRecord] })
                          }
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-3 py-2 font-mono">{pageStart + i + 1}</td>
                          <td className="px-3 py-2 font-mono text-[11px]">{cell(r, colMap.nomorSurat) || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{cell(r, colMap.tanggal) || '-'}</td>
                          <td className="px-3 py-2">{cell(r, colMap.kepada) || '-'}</td>
                          <td className="px-3 py-2">
                            {cell(r, colMap.perihal) || '-'}
                            <EditedMark r={r as BaselineRecord} />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {respon ? (
                              <span className="text-emerald-700 font-bold">{respon}</span>
                            ) : (
                              <span className="text-amber-700 font-bold">Belum ada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Paginasi */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-600">
              <span>
                {totalRows === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, totalRows)} dari{' '}
                <strong>{totalRows}</strong> {saranaMode ? 'sarana' : 'baris'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 tabular-nums">{page} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail sarana / baris */}
      {selected && data && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-[#2e856e]">
                  {activeTab.name}
                  {selected.records.length === 1 &&
                    (selected.records[0].rowNumber > 0 ? ` • Baris ${selected.records[0].rowNumber} spreadsheet` : ' • Ditambahkan di SIMONCER')}
                </p>
                <h3 className="text-base font-extrabold text-[#243b55]">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                aria-label="Tutup"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-5">
              {selected.records.map((r, idx) => (
                <section key={(r as BaselineRecord).id ?? r.rowNumber}>
                  {(selected.records.length > 1 || canEdit) && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-100">
                      <h4 className="text-xs font-extrabold text-[#243b55]">
                        {selected.records.length > 1 ? (
                          <>
                            Pemeriksaan ke-{idx + 1}
                            <span className="font-normal text-slate-500"> • {cell(r, colMap.periksa) || cell(r, colMap.bulan)}</span>
                          </>
                        ) : (
                          'Detail data'
                        )}
                        <EditedMark r={r} />
                      </h4>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditError(null);
                            setEditing({ record: r });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#243b55] border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </div>
                  )}
                  <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 text-xs">
                    {data.columns
                      .filter((c) => c.index !== colMap.no && (r.cells[c.index] || '').trim())
                      .map((c) => (
                        <React.Fragment key={c.index}>
                          <dt className="font-bold text-slate-500">{c.label}</dt>
                          <dd className="text-slate-900 whitespace-pre-wrap break-words">{r.cells[c.index]}</dd>
                        </React.Fragment>
                      ))}
                  </dl>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {editing && baseline && (
        <RekapRecordEditModal
          tabName={activeTab.name}
          columns={baseline.columns}
          record={editing.record}
          groups={groups}
          saving={editSaving}
          error={editError}
          onClose={() => setEditing(null)}
          onSave={saveRecord}
          onDelete={editing.record ? deleteRecord : undefined}
        />
      )}

      {importState && (
        <RekapImportModal
          sourceLabel={importState.sourceLabel}
          items={importState.items}
          userName={userName}
          onClose={() => setImportState(null)}
          onSaved={(saved) => saved.forEach(storeBaseline)}
        />
      )}
    </div>
  );
};

const EditedMark: React.FC<{ r: BaselineRecord }> = ({ r }) =>
  r.origin === 'MANUAL' ? (
    <span className="ml-1.5 align-middle text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
      Tambahan
    </span>
  ) : r.edited?.length ? (
    <span
      className="ml-1.5 align-middle text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
      title={`Diedit di SIMONCER: ${r.edited.join(', ')}`}
    >
      Diedit
    </span>
  ) : null;

export default SpreadsheetRekapView;
