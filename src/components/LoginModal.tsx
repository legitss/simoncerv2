import React, { useState } from 'react';
import { AuthAccount } from '../types';
import { 
  X, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { authenticate } from '../utils/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: AuthAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password) {
      setLoginError('Nama pengguna/NIP dan kata sandi wajib diisi!');
      return;
    }

    const result = authenticate(username, password);
    if (result.success && result.account) {
      onLoginSuccess(result.account);
      onClose();
    } else {
      setLoginError(result.message || 'Login gagal. Periksa kembali username dan kata sandi Anda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        
        {/* Header — Soft Navy-Teal BPOM */}
        <div className="bpom-header-navy text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-teal-300/50">
              <img
                src="/assets/aistudio/logo-simoncer_467003a7.webp"
                alt="Logo SIMONCER"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Login Internal Balai POM
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-teal-100 border border-white/25 font-bold">
                  BBPOM
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Khusus Petugas, Evaluator, dan Supervisor BBPOM Semarang
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Form Login */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / NIP Pegawai
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username atau NIP..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f0f6fc] border border-blue-200 focus:border-[#2b4c7e] focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 transition-colors focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f0f6fc] border border-blue-200 focus:border-[#2b4c7e] focus:bg-white rounded-xl text-xs text-slate-900 transition-colors focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#2e8b75] hover:bg-[#24705e] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Masuk ke Dashboard Internal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Info Note */}
          <div className="p-3 bg-[#f0f6fc] border border-blue-200/80 rounded-xl text-[11px] text-[#233d63] flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-[#2b4c7e] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Akses Terbatas:</strong> Halaman ini khusus pegawai internal BBPOM di Semarang. Pelaku usaha / perusahaan cukup menggunakan kolom <strong>Kode Unik CAPA</strong> di halaman utama tanpa perlu login.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Sistem Monitoring Evaluasi CAPA Terintegrasi (SIMONCER) • BBPOM di Semarang
        </div>
      </div>
    </div>
  );
};
