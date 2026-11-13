import React, { useEffect, useMemo, useState } from 'react';
import { X as CloseIcon, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import { SHEET_TABS } from '../../utils/googleSheetSync';
import {
  BaselineTab,
  BaselineConflictError,
  DiffRow,
  TabDiff,
  applyDiff,
  computeDiff,
  fetchBaselineTab,
  initialImport,
  saveBaselineTab,
  sheetToTabData,
} from '../../utils/rekapBaseline';

export interface ImportItem {
  /** Nama sheet di file / sumber, untuk ditampilkan. */
  label: string;
  /** Tab tujuan ('' = abaikan). */
  tabKey: string;
  rows: string[][];
}

interface Props {
  sourceLabel: string; // mis. "File rekap.xlsx" atau "Google Spreadsheet"
  items: ImportItem[];
  userName: string;
  onClose: () => void;
  onSaved: (saved: BaselineTab[]) => void;
}

const KIND_META: Record<DiffRow['kind'], { label: string; cls: string }> = {
  NEW: { label: 'Baris baru', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CHANGED: { label: 'Berubah', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  CONFLICT: { label: 'Bentrok dengan editan SIMONCER', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  REMOVED: { label: 'Tidak ada lagi di file', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
};

const MAX_LIST = 200;

export const RekapImportModal: React.FC<Props> = ({ sourceLabel, items: initialItems, userName, onClose, onSaved }) => {
  const [items, setItems] = useState(initialItems);
  const [bases, setBases] = useState<Record<string, BaselineTab>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useFileFor, setUseFileFor] = useState<Record<string, Set<string>>>({});
  const [removeMissing, setRemoveMissing] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: string[]; failed: string[] } | null>(null);

  const chosenKeys = items.map((it) => it.tabKey).filter(Boolean);
  const duplicateKeys = chosenKeys.filter((k, i) => chosenKeys.indexOf(k) !== i);

  // Ambil baseline terbaru dari server untuk tiap tab tujuan
  useEffect(() => {
    const missing = Array.from(new Set(chosenKeys)).filter((k) => !bases[k]);
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(missing.map((k) => fetchBaselineTab(k)))
      .then((list) => {
        if (cancelled) return;
        setBases((prev) => {
          const next = { ...prev };
          list.forEach((b) => (next[b.tab] = b));
          return next;
        });
      })
      .catch((err) => !cancelled && setLoadError(err?.message || 'Gagal memuat baseline dari server.'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenKeys.join(',')]);

  const diffs = useMemo(
    () =>
      items.map((it) => {
        const tab = SHEET_TABS.find((t) => t.key === it.tabKey);
        const base = it.tabKey ? bases[it.tabKey] : undefined;
        if (!tab || !base) return null;
        const incoming = sheetToTabData(tab, it.rows);
        return { incoming, diff: computeDiff(tab, base, incoming), isInitial: base.version === 0 && base.records.length === 0 };
      }),
    [items, bases],
  );

  const toggleUseFile = (tabKey: string, rowKey: string) =>
    setUseFileFor((prev) => {
      const s = new Set(prev[tabKey] || []);
      if (s.has(rowKey)) s.delete(rowKey);
      else s.add(rowKey);
      return { ...prev, [tabKey]: s };
    });

  const hasWork = diffs.some((d) => {
    if (!d || !d.incoming.records.length) return false;
    if (d.isInitial) return true;
    const removed = d.diff.rows.filter((r) => r.kind === 'REMOVED').length;
    const others = d.diff.rows.length - removed;
    return others > 0 || (removed > 0 && !!removeMissing[d.diff.tab.key]) || d.diff.columnsAdded.length > 0;
  });

  const apply = async () => {
    setSaving(true);
    const ok: string[] = [];
    const failed: string[] = [];
    const saved: BaselineTab[] = [];
    for (const d of diffs) {
      if (!d || !d.incoming.records.length) continue;
      const { diff, isInitial } = d;
      const key = diff.tab.key;
      const removing = !!removeMissing[key];
      const counts = (k: DiffRow['kind']) => diff.rows.filter((r) => r.kind === k).length;
      const removedCount = counts('REMOVED');
      if (!isInitial && diff.rows.length - removedCount === 0 && !(removing && removedCount) && !diff.columnsAdded.length) continue;
      const next = isInitial
        ? initialImport(diff.incoming)
        : applyDiff(diff, { useFileFor: useFileFor[key] || new Set(), removeMissing: removing });
      const note = isInitial
        ? `Impor awal dari ${sourceLabel}: ${next.records.length} baris`
        : `Update dari ${sourceLabel}: +${counts('NEW')} baru, ${counts('CHANGED') + counts('CONFLICT')} berubah` +
          (removing && removedCount ? `, -${removedCount} dihapus` : '');
      try {
        saved.push(await saveBaselineTab(diff.base, { ...next, source: sourceLabel }, userName, note));
        ok.push(`${diff.tab.name}: ${note}`);
      } catch (err: any) {
        failed.push(
          `${diff.tab.name}: ${err instanceof BaselineConflictError ? `${err.message}${err.updatedBy ? ` (oleh ${err.updatedBy})` : ''}` : err?.message || 'Gagal menyimpan.'}`,
        );
      }
    }
    setSaving(false);
    setResult({ ok, failed });
    if (saved.length) onSaved(saved);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <p className="text-[11px] font-bold text-[#2e856e]">Perbarui Baseline Rekap</p>
            <h3 className="text-base font-extrabold text-[#243b55]">Pratinjau perubahan dari {sourceLabel}</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Periksa dulu perubahannya. Data baru disimpan setelah Anda menekan <strong>Terapkan</strong>.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Tutup">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loadError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {loadError}
            </div>
          )}
          {duplicateKeys.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              Ada lebih dari satu sheet yang diarahkan ke tab yang sama. Pilih "Abaikan" untuk salah satunya.
            </div>
          )}

          {result ? (
            <div className="space-y-2">
              {result.ok.map((m) => (
                <p key={m} className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {m}
                </p>
              ))}
              {result.failed.map((m) => (
                <p key={m} className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {m}
                </p>
              ))}
              {!result.ok.length && !result.failed.length && <p className="text-xs text-slate-600">Tidak ada perubahan yang perlu disimpan.</p>}
            </div>
          ) : (
            items.map((it, i) => {
              const d = diffs[i];
              const tabKey = it.tabKey;
              return (
                <section key={`${it.label}-${i}`} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">
                      Sheet <span className="text-[#243b55]">"{it.label}"</span> →
                    </span>
                    <select
                      value={tabKey}
                      onChange={(e) => setItems((prev) => prev.map((p, j) => (j === i ? { ...p, tabKey: e.target.value } : p)))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                    >
                      <option value="">— Abaikan sheet ini —</option>
                      {SHEET_TABS.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!tabKey ? (
                    <p className="text-xs text-slate-500">Sheet ini tidak diimpor.</p>
                  ) : !d ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membandingkan dengan baseline di server…
                    </p>
                  ) : !d.incoming.records.length ? (
                    <p className="text-xs font-bold text-rose-700">
                      Tidak ada baris data yang terbaca. Pastikan format sheet sama dengan spreadsheet rekap (ada baris judul yang kolom A-nya
                      "No", dan baris data diberi nomor).
                    </p>
                  ) : d.isInitial ? (
                    <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <strong>Impor awal:</strong> {d.incoming.records.length} baris dan {d.incoming.columns.length} kolom akan menjadi baseline
                      tab ini.
                    </p>
                  ) : (
                    <DiffDetails
                      diff={d.diff}
                      open={open}
                      setOpen={setOpen}
                      useFile={useFileFor[tabKey] || new Set()}
                      onToggleUseFile={(rowKey) => toggleUseFile(tabKey, rowKey)}
                      removeMissing={!!removeMissing[tabKey]}
                      onRemoveMissing={(v) => setRemoveMissing((prev) => ({ ...prev, [tabKey]: v }))}
                    />
                  )}
                </section>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          {result ? (
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold bpom-active-gradient text-white cursor-pointer">
              Selesai
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={saving || !hasWork || duplicateKeys.length > 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bpom-active-gradient text-white disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {saving ? 'Menyimpan…' : 'Terapkan'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DiffDetails: React.FC<{
  diff: TabDiff;
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  useFile: Set<string>;
  onToggleUseFile: (rowKey: string) => void;
  removeMissing: boolean;
  onRemoveMissing: (v: boolean) => void;
}> = ({ diff, open, setOpen, useFile, onToggleUseFile, removeMissing, onRemoveMissing }) => {
  const byKind = (k: DiffRow['kind']) => diff.rows.filter((r) => r.kind === k);
  const kinds: DiffRow['kind'][] = ['CONFLICT', 'NEW', 'CHANGED', 'REMOVED'];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
        {kinds.map((k) => (
          <span key={k} className={`px-2 py-1 rounded-lg border ${KIND_META[k].cls}`}>
            {KIND_META[k].label}: {byKind(k).length}
          </span>
        ))}
        <span className="px-2 py-1 rounded-lg border bg-slate-50 text-slate-700 border-slate-200">Tidak berubah: {diff.unchanged}</span>
        {diff.manualKept > 0 && (
          <span className="px-2 py-1 rounded-lg border bg-slate-50 text-slate-700 border-slate-200">
            Tambahan manual SIMONCER (tetap disimpan): {diff.manualKept}
          </span>
        )}
      </div>

      {(diff.columnsAdded.length > 0 || diff.columnsRemoved.length > 0) && (
        <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-0.5">
          {diff.columnsAdded.length > 0 && <p><strong>Kolom baru:</strong> {diff.columnsAdded.join(', ')}</p>}
          {diff.columnsRemoved.length > 0 && (
            <p>
              <strong>Kolom yang tidak ada di file (isinya akan hilang):</strong> {diff.columnsRemoved.join(', ')}
            </p>
          )}
        </div>
      )}

      {kinds.map((k) => {
        const rows = byKind(k);
        if (!rows.length) return null;
        const id = `${diff.tab.key}:${k}`;
        const isOpen = open[id] ?? k === 'CONFLICT';
        return (
          <div key={k} className="border border-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [id]: !isOpen }))}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-[#243b55] cursor-pointer"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {KIND_META[k].label} ({rows.length})
            </button>

            {k === 'REMOVED' && (
              <label className="flex items-start gap-2 px-3 pb-2 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" checked={removeMissing} onChange={(e) => onRemoveMissing(e.target.checked)} className="mt-0.5" />
                <span>
                  Hapus {rows.length} baris ini dari baseline. Kalau tidak dicentang, baris-baris ini tetap disimpan.
                </span>
              </label>
            )}
            {k === 'CONFLICT' && (
              <p className="px-3 pb-2 text-[11px] text-slate-600">
                Kolom-kolom ini sudah pernah diedit di SIMONCER, tapi nilainya di file berbeda. Secara bawaan <strong>editan SIMONCER
                dipertahankan</strong>. Centang "Pakai data file" untuk mengambil nilai dari file.
              </p>
            )}

            {isOpen && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100 max-h-80 overflow-y-auto">
                {rows.slice(0, MAX_LIST).map((r) => (
                  <li key={r.key} className="px-3 py-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900">{r.title}</p>
                      {k === 'CONFLICT' && (
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 shrink-0 cursor-pointer">
                          <input type="checkbox" checked={useFile.has(r.key)} onChange={() => onToggleUseFile(r.key)} />
                          Pakai data file
                        </label>
                      )}
                    </div>
                    {k === 'CONFLICT' &&
                      r.conflicts.map((c) => (
                        <p key={c.label} className="mt-1 text-[11px] text-slate-700">
                          <span className="font-bold">{c.label}:</span>{' '}
                          <span className={useFile.has(r.key) ? 'line-through text-slate-400' : 'text-[#243b55] font-bold'}>
                            SIMONCER "{c.before || '(kosong)'}"
                          </span>{' '}
                          vs{' '}
                          <span className={useFile.has(r.key) ? 'text-[#243b55] font-bold' : 'line-through text-slate-400'}>
                            file "{c.after || '(kosong)'}"
                          </span>
                        </p>
                      ))}
                    {r.changes.slice(0, 8).map((c) => (
                      <p key={c.label} className="mt-1 text-[11px] text-slate-600">
                        <span className="font-bold">{c.label}:</span> <span className="line-through text-slate-400">{c.before || '(kosong)'}</span>{' '}
                        → <span className="text-slate-900">{c.after || '(kosong)'}</span>
                      </p>
                    ))}
                    {r.changes.length > 8 && <p className="mt-1 text-[11px] text-slate-500">…dan {r.changes.length - 8} kolom lain</p>}
                  </li>
                ))}
                {rows.length > MAX_LIST && (
                  <li className="px-3 py-2 text-[11px] text-slate-500">…dan {rows.length - MAX_LIST} baris lain</li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RekapImportModal;
