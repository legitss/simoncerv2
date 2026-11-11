import React, { useState } from 'react';
import { AuthAccount } from '../types';
import { 
  X, 
  UserCheck, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
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

  const handleQuickDemoLogin = (demoUsername: string, demoPass: string) => {
    setUsername(demoUsername);
    setPassword(demoPass);
    const result = authenticate(demoUsername, demoPass);
    if (result.success && result.account) {
      onLoginSuccess(result.account);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0b1437] to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-slate-700">
              <img
                src="/assets/aistudio/logo-simoncer_467003a7.webp"
                alt="Logo SIMONCER"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Portal Petugas & Pengawas
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-600/40 font-bold">
                  BBPOM
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Masuk ke dashboard internal verifikasi & evaluasi CAPA
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Quick 1-Click Demo Logins */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1 text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pilih Cepat Akun Demo (1-Klik Masuk):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Admin Demo */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin123')}
                className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-500 text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">👨‍💼</span>
                  <span className="font-extrabold text-[11px] text-slate-900 group-hover:text-blue-700">
                    SUPERADMIN
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Operator Tata Usaha</span>
              </button>

              {/* Evaluator Demo */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bambang', 'petugas123')}
                className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">👨‍🔬</span>
                  <span className="font-extrabold text-[11px] text-slate-900 group-hover:text-emerald-700">
                    EVALUATOR
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">apt. Bambang (CPOB)</span>
              </button>

              {/* Supervisor Demo */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('supervisor', 'super123')}
                className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-300 hover:border-purple-500 text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">🎖️</span>
                  <span className="font-extrabold text-[11px] text-slate-900 group-hover:text-purple-700">
                    SUPERVISOR
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Kepala Balai</span>
              </button>
            </div>
          </div>

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
                Username / NIP Petugas
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, bambang, atau supervisor"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 transition-colors"
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
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl text-xs text-slate-900 transition-colors"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <span>Masuk ke Dashboard Internal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Superadmin Note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Informasi Akses:</strong> Pembuatan akun baru tidak dibuka untuk publik. Akun petugas dan evaluator baru dikelola dan diterbitkan secara terpusat oleh <strong>Superadmin</strong> melalui Menu Pengaturan Superadmin.
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
