import React, { useState, useEffect } from 'react';
import { OfficerUser } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  UserCheck, 
  Phone, 
  Mail, 
  Briefcase, 
  Search, 
  RotateCcw,
  ShieldCheck,
  Save,
  MessageSquare,
  Key,
  Sparkles
} from 'lucide-react';
import { 
  getStoredOfficers, 
  saveStoredOfficers, 
  addOfficer, 
  updateOfficer, 
  deleteOfficer,
  DEFAULT_OFFICERS 
} from '../data/officers';
import { syncAllAccountsAndOfficers } from '../utils/auth';

interface OfficerDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOfficer?: (officer: OfficerUser) => void;
}

export const OfficerDirectoryModal: React.FC<OfficerDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectOfficer,
}) => {
  const [officers, setOfficers] = useState<OfficerUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nip: '',
    position: '',
    phone: '+62 8',
    email: '',
  });

  const [formError, setFormError] = useState('');

  const loadOfficers = () => {
    syncAllAccountsAndOfficers();
    setOfficers(getStoredOfficers());
  };

  useEffect(() => {
    if (isOpen) {
      loadOfficers();
      setIsAdding(false);
      setEditingId(null);
      setFormError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setFormData({
      name: '',
      nip: '',
      position: 'Pengawas Farmasi & Makanan / Evaluator CAPA',
      phone: '+62 8',
      email: '',
    });
    setEditingId(null);
    setIsAdding(true);
    setFormError('');
  };

  const handleStartEdit = (officer: OfficerUser) => {
    setFormData({
      name: officer.name,
      nip: officer.nip,
      position: officer.position,
      phone: officer.phone,
      email: officer.email,
    });
    setEditingId(officer.id);
    setIsAdding(true);
    setFormError('');
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama lengkap & gelar petugas wajib diisi!');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim() === '+62 8') {
      setFormError('Nomor WhatsApp aktif wajib diisi untuk pengiriman notifikasi penugasan!');
      return;
    }

    if (editingId) {
      const updated = updateOfficer(editingId, {
        name: formData.name.trim(),
        nip: formData.nip.trim(),
        position: formData.position.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
      if (updated && onSelectOfficer) {
        onSelectOfficer(updated);
      }
    } else {
      const created = addOfficer({
        name: formData.name.trim(),
        nip: formData.nip.trim(),
        position: formData.position.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
      if (onSelectOfficer) {
        onSelectOfficer(created);
      }
    }

    loadOfficers();
    setIsAdding(false);
    setEditingId(null);
    setFormError('');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus "${name}" dari daftar petugas resmi?`)) {
      deleteOfficer(id);
      loadOfficers();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan daftar petugas ke standar awal Balai Besar POM?')) {
      saveStoredOfficers([...DEFAULT_OFFICERS]);
      loadOfficers();
    }
  };

  const filteredOfficers = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.nip.includes(searchTerm) ||
      o.phone.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bpom-hero-gradient text-[#1e3a5f] flex items-center justify-between border-b border-blue-200/80">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Pengaturan Daftar Nama Petugas & Evaluator PIC</span>
                <span className="text-[10px] font-mono bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40">
                  {officers.length} Petugas Terdaftar
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Nama yang ada di daftar ini akan otomatis muncul pada dropdown pilihan penugasan dan siap menerima notifikasi WhatsApp resmi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama, NIP, jabatan, atau nomor WA..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Kembalikan ke susunan petugas bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Standar</span>
            </button>

            {!isAdding && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Petugas Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Informative Sync Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-b border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-emerald-950 font-medium">
              <strong>Sinkronisasi 2 Arah Aktif:</strong> Setiap petugas di direktori ini <strong>otomatis dibuatkan akun login</strong> ke sistem SIMONCER (Password bawaan: <code className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold text-slate-900">petugas123</code>). Cukup input satu kali saja!
            </p>
          </div>
        </div>

        {/* Form Container (When Adding or Editing) */}
        {isAdding && (
          <div className="p-4 sm:p-5 bg-emerald-50/70 border-b border-emerald-200 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>{editingId ? 'Edit Data Petugas / Evaluator' : 'Tambah Petugas / Evaluator Baru ke Daftar'}</span>
              </h4>
              <span className="text-[11px] text-emerald-800 font-semibold">
                * Wajib diisi untuk notifikasi WhatsApp otomatis
              </span>
            </div>

            {formError && (
              <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-lg text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: apt. Dwi Handoko, M.Farm"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NIP Petugas (18 Digit)
                </label>
                <input
                  type="text"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="198504122008011003"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-600">Notif WA</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Jabatan / Posisi Penugasan di Balai
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Contoh: Pengawas Farmasi & Makanan Ahli Muda / Tim Evaluasi CAPA"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Kedinasan Petugas
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="dwi.handoko@pom.go.id"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan ke Daftar Nama Petugas'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Officers Directory List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 bg-slate-50 flex-1 text-xs">
          {filteredOfficers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-600">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="font-semibold text-slate-600">Tidak ada petugas yang cocok dengan kata kunci "{searchTerm}"</p>
              <button
                type="button"
                onClick={handleStartAdd}
                className="mt-3 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Petugas Baru Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredOfficers.map((officer) => (
                <div
                  key={officer.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs text-emerald-950">
                          {officer.name}
                        </h4>
                        {officer.nip && (
                          <span className="text-[10px] font-mono text-slate-500 block">
                            NIP. {officer.nip}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {officer.id}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                      <p className="leading-snug text-slate-700">
                        <strong>Jabatan:</strong> {officer.position}
                      </p>

                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          {officer.phone}
                        </span>

                        {officer.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                            <Mail className="w-3 h-3 text-slate-600" />
                            {officer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Login Credentials & Status */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-indigo-50 text-indigo-900 border border-indigo-200/80 px-2 py-0.5 rounded-md font-bold">
                      <Key className="w-3 h-3 text-indigo-600" />
                      Akun Login: <span className="text-indigo-700">{officer.username || officer.name.toLowerCase().replace(/apt\.|dr\.|dra\.|m\.si|m\.farm|s\.si|s\.farm|m\.sc|m\.biomed/g, '').replace(/[^a-z0-9]/g, '').slice(0, 12)}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> Siap Ditugaskan
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(officer)}
                        className="px-2 py-1 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit data petugas"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(officer.id, officer.name)}
                        className="p-1 text-slate-600 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Hapus petugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {onSelectOfficer && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectOfficer(officer);
                          onClose();
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Pilih Petugas Ini</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 hidden sm:inline">
            Semua petugas yang ditambahkan tersimpan permanen dan langsung tersedia di menu penugasan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-lg text-xs font-bold ml-auto cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
