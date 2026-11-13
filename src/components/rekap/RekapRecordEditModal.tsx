import React, { useMemo, useState } from 'react';
import { X as CloseIcon, Save, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { SheetColumn } from '../../utils/googleSheetSync';
import { BaselineRecord } from '../../utils/rekapBaseline';

interface Props {
  tabName: string;
  columns: SheetColumn[];
  /** null = tambah baris baru */
  record: BaselineRecord | null;
  groups: string[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (values: { group: string; cells: Record<number, string> }) => void;
  onDelete?: () => void;
}

export const RekapRecordEditModal: React.FC<Props> = ({ tabName, columns, record, groups, saving, error, onClose, onSave, onDelete }) => {
  const [group, setGroup] = useState(record?.group || groups[0] || '');
  const [values, setValues] = useState<Record<number, string>>(() => {
    const v: Record<number, string> = {};
    columns.forEach((c) => (v[c.index] = record?.cells[c.index] || ''));
    return v;
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const edited = useMemo(() => new Set(record?.edited || []), [record]);
  const hasContent = Object.values(values).some((v) => v.trim());

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center p-4" onClick={saving ? undefined : onClose}>
      <form
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ group, cells: values });
        }}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <p className="text-[11px] font-bold text-[#2e856e]">{tabName}</p>
            <h3 className="text-base font-extrabold text-[#243b55]">{record ? 'Edit Data Pemeriksaan' : 'Tambah Data Pemeriksaan'}</h3>
            {record?.editedBy && (
              <p className="text-[11px] text-slate-500">
                Terakhir diedit di SIMONCER oleh {record.editedBy}
                {record.editedAt ? ` (${new Date(record.editedAt).toLocaleString('id-ID')})` : ''}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Tutup">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {groups.length > 0 && (
            <label className="block text-xs">
              <span className="font-bold text-slate-600">Kelompok Sarana</span>
              <input
                list="rekap-groups"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white"
              />
              <datalist id="rekap-groups">
                {groups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
          )}
          {columns.map((c) => {
            const long = (values[c.index] || '').length > 60 || /temuan|keterangan|uraian|alamat|perihal|catatan/i.test(c.header);
            return (
              <label key={c.index} className="block text-xs">
                <span className="font-bold text-slate-600">
                  {c.label}
                  {edited.has(c.label) && <span className="ml-1.5 text-[10px] font-bold text-amber-700">(diedit di SIMONCER)</span>}
                </span>
                {long ? (
                  <textarea
                    rows={3}
                    value={values[c.index]}
                    onChange={(e) => setValues((p) => ({ ...p, [c.index]: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white"
                  />
                ) : (
                  <input
                    value={values[c.index]}
                    onChange={(e) => setValues((p) => ({ ...p, [c.index]: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white"
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {onDelete &&
              (confirmDelete ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-rose-700">Hapus baris ini?</span>
                  <button type="button" onClick={onDelete} disabled={saving} className="px-3 py-1.5 rounded-lg font-bold bg-rose-600 text-white cursor-pointer">
                    Ya, hapus
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg font-bold border border-slate-200 cursor-pointer">
                    Tidak
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !hasContent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bpom-active-gradient text-white disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RekapRecordEditModal;
