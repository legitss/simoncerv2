import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Globe, 
  Smartphone, 
  ShieldCheck, 
  Settings2, 
  Sparkles, 
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  WhatsAppGatewayConfig, 
  WhatsAppProvider, 
  getGatewayConfig, 
  saveGatewayConfig, 
  sendWhatsAppMessage, 
  DEFAULT_GATEWAY_CONFIG, 
  PROVIDER_PRESETS 
} from '../utils/whatsappGateway';

interface WhatsAppGatewaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppGatewaySettingsModal: React.FC<WhatsAppGatewaySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<WhatsAppGatewayConfig>(getGatewayConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test send state
  const [testPhone, setTestPhone] = useState('081277889911');
  const [testMessage, setTestMessage] = useState(
    'Halo, ini adalah pesan uji coba integrasi WhatsApp Gateway Fonnte pada aplikasi SIMONCER Balai Besar POM di Semarang. Sistem notifikasi berjalan lancar! ✅'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getGatewayConfig());
      setSaveSuccess(false);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: WhatsAppProvider) => {
    const preset = PROVIDER_PRESETS[provider];
    setConfig((prev) => ({
      ...prev,
      provider,
      apiUrl: preset.defaultUrl,
      apiKey: provider === 'FONNTE' ? DEFAULT_GATEWAY_CONFIG.apiKey : prev.apiKey,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGatewayConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan konfigurasi gateway ke pengaturan bawaan Fonnte BBPOM?')) {
      setConfig({ ...DEFAULT_GATEWAY_CONFIG });
      saveGatewayConfig({ ...DEFAULT_GATEWAY_CONFIG });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTestSend = async () => {
    if (!testPhone.trim()) {
      alert('Masukkan nomor WhatsApp tujuan uji coba!');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const result = await sendWhatsAppMessage(testPhone, testMessage, config);

    setIsTesting(false);
    setTestResult({
      success: result.success,
      message: result.message,
      details: result.responseRaw ? JSON.stringify(result.responseRaw, null, 2) : undefined,
    });
  };

  const currentPreset = PROVIDER_PRESETS[config.provider];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0a1e1b] to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Pengaturan WhatsApp Gateway
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {config.provider}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Konfigurasi penyedia layanan WhatsApp API (Fonnte) untuk notifikasi otomatis SIMONCER
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengaturan WhatsApp Gateway berhasil disimpan dan aktif secara real-time!</span>
            </div>
          )}

          {/* Master Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Status Gateway WhatsApp</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {config.enabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </h4>
              <p className="text-slate-500 text-xs">
                Jika diaktifkan, sistem akan otomatis mengirimkan pesan WhatsApp ke nomor sarana dan petugas.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 1. Provider Selection Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Pilih Penyedia Layanan WhatsApp (Provider Switcher)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(PROVIDER_PRESETS) as WhatsAppProvider[]).map((provKey) => {
                const p = PROVIDER_PRESETS[provKey];
                const isSelected = config.provider === provKey;
                return (
                  <button
                    key={provKey}
                    type="button"
                    onClick={() => handleProviderChange(provKey)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Smartphone className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        {provKey}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 block">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1">
              {currentPreset.guideText}
            </p>
          </div>

          {/* 2. Credentials & Parameters Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Kredensial & Parameter Koneksi API</span>
              </h4>

              {/* API Token / Key */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  API Token / Secret Key ({config.provider}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder={currentPreset.placeholderToken}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                {config.provider === 'FONNTE' && (
                  <span className="text-[10px] text-emerald-700 mt-1 block">
                    ✓ Terisi Token Fonnte resmi Anda: <code className="font-bold">q1yphTjbBXCSEheNXksr</code>
                  </span>
                )}
              </div>

              {/* Endpoint URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    API Endpoint URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      required
                      value={config.apiUrl}
                      onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kode Negara (Country Code)
                  </label>
                  <input
                    type="text"
                    value={config.countryCode}
                    onChange={(e) => setConfig({ ...config, countryCode: e.target.value })}
                    placeholder="62"
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Identitas Instansi Pengirim
                </label>
                <input
                  type="text"
                  value={config.senderName}
                  onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                  placeholder="BBPOM di Semarang (SIMONCER)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            {/* 3. Event Triggers */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-emerald-600" />
                <span>Pemicu Notifikasi Otomatis (Event Triggers)</span>
              </h4>

              <div className="space-y-2.5">
                {/* 1. Srikandi to Sarana */}
                <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={config.notifyOnSrikandiLetter}
                    onChange={(e) => setConfig({ ...config, notifyOnSrikandiLetter: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      1. Notifikasi Surat Tindak Lanjut ke Sarana
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mengirimkan nomor surat SRIKANDI (TTE BSrE), batas waktu SLA 14 hari, dan link tracking mandiri ke nomor PIC Sarana saat surat terbit.
                    </span>
                  </div>
                </label>

                {/* 2. Capa submitted to evaluator & sarana */}
                <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={config.notifyOnCapaSubmitted}
                    onChange={(e) => setConfig({ ...config, notifyOnCapaSubmitted: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      2. Notifikasi Penyerahan CAPA ke Petugas Evaluator PIC
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mengirimkan notifikasi ke nomor WhatsApp Petugas Evaluator ketika sarana mengunggah dokumen CAPA, serta memberikan tanda terima ke sarana.
                    </span>
                  </div>
                </label>

                {/* 3. Capa evaluated to sarana & evaluator */}
                <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={config.notifyOnCapaEvaluated}
                    onChange={(e) => setConfig({ ...config, notifyOnCapaEvaluated: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      3. Notifikasi Status Evaluasi / Validasi CAPA (Diterima / Revisi)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mengirimkan hasil penilaian, nomor Berita Acara, dan catatan evaluator ke WhatsApp sarana saat evaluasi selesai disimpan.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button Row */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset ke Bawaan Fonnte</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pengaturan Gateway</span>
              </button>
            </div>
          </form>

          {/* 4. Live Test Send Tool */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Uji Coba Pengiriman Pesan WhatsApp (Live Test)</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Provider: {config.provider}
              </span>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              Tes langsung koneksi token Fonnte dengan mengirimkan pesan simulasi ke nomor ponsel Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Tujuan
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="0812xxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Teks Pesan Uji Coba
                </label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleTestSend}
                disabled={isTesting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim ke Fonnte...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kirim Pesan Uji Coba Sekarang</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Box */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.details && (
                  <pre className="p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto max-h-32">
                    {testResult.details}
                  </pre>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 hidden sm:inline">
            SIMONCER WhatsApp Gateway Service • BBPOM di Semarang
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer ml-auto"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
