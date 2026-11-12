import React, { useState, useEffect } from 'react';
import { AuthAccount, UserRole } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  RotateCcw, 
  Check, 
  Phone, 
  Mail, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { getStoredAccounts, saveStoredAccounts, registerAccount, deleteAccount, DEFAULT_ACCOUNTS } from '../utils/auth';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthAccount | null;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'PETUGAS_EVALUATOR' as 'ADMIN' | 'PETUGAS_EVALUATOR' | 'SUPERVISOR',
    nip: '',
    position: 'Pengawas Farmasi & Makanan / Evaluator CAPA',
    phone: '+62 8',
    email: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setAccounts(getStoredAccounts());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsAdding(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setFormData({
      username: '',
      password: 'password123',
      name: '',
      role: 'PETUGAS_EVALUATOR',
      nip: '',
      position: 'Pengawas Farmasi & Makanan / Evaluator CAPA',
      phone: '+62 8',
      email: '',
    });
    setIsAdding(true);
    setErrorMsg('');
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim() || !formData.password) {
      setErrorMsg('Username dan kata sandi wajib diisi!');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap dan gelar wajib diisi!');
      return;
    }

    const res = registerAccount({
      username: formData.username.trim().toLowerCase(),
      password: formData.password,
      name: formData.name.trim(),
      role: formData.role,
      nip: formData.nip.trim(),
      position: formData.position.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    });

    if (res.success) {
      loadData();
      setIsAdding(false);
    } else {
      setErrorMsg(res.message || 'Gagal menambahkan akun.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (currentUser?.id === id) {
      alert('Anda tidak dapat menghapus akun yang sedang aktif digunakan saat ini!');
      return;
    }
    if (window.confirm(`Hapus akun "${name}" secara permanen?`)) {
      deleteAccount(id);
      loadData();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan daftar akun ke konfigurasi bawaan BBPOM?')) {
      saveStoredAccounts([...DEFAULT_ACCOUNTS]);
      loadData();
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.nip && a.nip.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bpom-hero-gradient text-[#1e3a5f] flex items-center justify-between border-b border-blue-200/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-700 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#1e3a5f]">
                  Manajemen Akun Internal BBPOM
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-800/80 text-indigo-800 border border-indigo-600/40">
                  {accounts.length} Akun Terdaftar
                </span>
              </div>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                Kelola hak akses untuk Administrator, Petugas Evaluator, dan Supervisor
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
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama, username, NIP, atau peran..."
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Standar</span>
            </button>

            {!isAdding && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Akun Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Account Form */}
        {isAdding && (
          <div className="p-5 bg-indigo-50/70 border-b border-indigo-200 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Formulir Pembuatan Akun Baru</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Peran / Hak Akses <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-900"
                >
                  <option value="PETUGAS_EVALUATOR">👨‍🔬 Petugas / Evaluator</option>
                  <option value="SUPERVISOR">🎖️ Supervisor (Kepala Balai / Koordinator)</option>
                  <option value="ADMIN">👨‍💼 Administrator Tata Usaha</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Username Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="Contoh: hendrawan_super"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 digit..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Dr. apt. Hendrawan Kusuma, M.Si"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
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
                  placeholder="197405121999031002"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
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
                  placeholder="Contoh: Kepala Balai Besar Pengawas Obat dan Makanan (Supervisor)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Akun Baru</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List of Accounts */}
        <div className="p-5 overflow-y-auto space-y-3 bg-slate-50 flex-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAccounts.map((acc) => {
              const isSelf = currentUser?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelf
                      ? 'bg-indigo-50/60 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1 rounded-xl bg-slate-100 border border-slate-200">
                          {acc.avatar || (acc.role === 'SUPERVISOR' ? '🎖️' : acc.role === 'ADMIN' ? '👨‍💼' : '👨‍🔬')}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {isSelf && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                                Akun Anda
                              </span>
                            )}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            @{acc.username} {acc.nip && `• NIP. ${acc.nip}`}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          acc.role === 'SUPERVISOR'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : acc.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                      <p>
                        <strong className="text-slate-700">Jabatan:</strong> {acc.position}
                      </p>
                      <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
                        {acc.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {acc.phone}
                          </span>
                        )}
                        {acc.email && (
                          <span className="flex items-center gap-1 truncate max-w-[170px]">
                            <Mail className="w-3 h-3 text-slate-600" />
                            {acc.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-mono">
                      ID: {acc.id}
                    </span>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDelete(acc.id, acc.name)}
                        className="p-1 text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                        title="Hapus akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Akun yang dibuat tersimpan secara lokal dan langsung dapat digunakan untuk login.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-xl text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
