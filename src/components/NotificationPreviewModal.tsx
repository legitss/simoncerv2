import React, { useState } from 'react';
import { InspectionSession, SystemNotification } from '../types';
import { 
  X, 
  MessageSquare, 
  Mail, 
  Send, 
  Check, 
  CheckCheck, 
  Copy, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Building2,
  PhoneCall
} from 'lucide-react';
import { formatIndonesianDateTime } from '../utils/date';

interface NotificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  onSendCustomNotification?: (channel: 'WHATSAPP' | 'EMAIL', content: string) => void;
}

export const NotificationPreviewModal: React.FC<NotificationPreviewModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onSendCustomNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'WHATSAPP' | 'EMAIL' | 'LOG'>('WHATSAPP');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Find the latest WhatsApp and Email notifications or build standard template
  const waNotif = inspection.notifications.find((n) => n.channel === 'WHATSAPP') || {
    id: 'DEMO-WA',
    channel: 'WHATSAPP' as const,
    recipient: `${inspection.facility.picPhone} (${inspection.facility.picName})`,
    subject: `[SIMONCER] Pemberitahuan Status Pemeriksaan - Kode: ${inspection.capaCode}`,
    content: `*PEMBERITAHUAN RESMI SIMONCER*\n\nYth. Pimpinan/PIC ${inspection.facility.name},\n\nStatus Sesi Pemeriksaan ${inspection.capaCode}:\n• No Surat SRIKANDI: ${inspection.srikandiLetter.letterNo}\n• Status Saat Ini: *${inspection.status}*\n• Batas Waktu CAPA: ${inspection.srikandiLetter.deadlineDate}\n\nSilakan akses portal SIMONCER untuk memantau atau mengunggah bukti perbaikan:\nhttps://simoncer.id/track?code=${inspection.capaCode}\n\nTerima kasih atas kerja samanya dalam menjaga kepatuhan mutu.`,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED' as const,
    triggerEvent: 'SURAT_TINDAK_LANJUT' as const,
  };

  const emailNotif = inspection.notifications.find((n) => n.channel === 'EMAIL') || {
    id: 'DEMO-EMAIL',
    channel: 'EMAIL' as const,
    recipient: inspection.facility.picEmail,
    subject: `[SIMONCER - RESMI] Pemberitahuan Status CAPA ${inspection.capaCode} - ${inspection.facility.name}`,
    content: `Yth. Bapak/Ibu ${inspection.facility.picName} (${inspection.facility.name}),\n\nMelalui sistem SIMONCER (Sistem Monitoring & Evaluasi CAPA Terintegrasi), kami memberitahukan perkembangan tindak lanjut hasil audit/pemeriksaan sarana Anda.\n\nNomor Surat SRIKANDI: ${inspection.srikandiLetter.letterNo}\nKode Unik CAPA: ${inspection.capaCode}\nStatus Saat Ini: ${inspection.status}\n\nMohon pastikan seluruh tindakan perbaikan (Corrective) dan pencegahan (Preventive) serta berkas pendukung telah diunggah sesuai jadwal yang ditentukan.\n\nSalam hormat,\nTim Evaluator SIMONCER`,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED' as const,
    triggerEvent: 'SURAT_TINDAK_LANJUT' as const,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-300 overflow-hidden transform transition-all animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-white text-[#1e3a5f] p-5 flex items-center justify-between border-b border-blue-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Notifikasi Otomatis Terintegrasi
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">
                  Real-time
                </span>
              </h3>
              <p className="text-xs text-slate-600">
                Pemberitahuan resmi langsung ke PIC Sarana ({inspection.facility.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('WHATSAPP')}
            type="button"
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg transition-all ${
              activeTab === 'WHATSAPP'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Kanal WhatsApp ({inspection.facility.picPhone})</span>
          </button>
          <button
            onClick={() => setActiveTab('EMAIL')}
            type="button"
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg transition-all ${
              activeTab === 'EMAIL'
                ? 'bg-white text-blue-800 border-t-2 border-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Kanal Email ({inspection.facility.picEmail})</span>
          </button>
          <button
            onClick={() => setActiveTab('LOG')}
            type="button"
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg transition-all ${
              activeTab === 'LOG'
                ? 'bg-white text-slate-900 border-t-2 border-blue-200/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Riwayat Pengiriman ({inspection.notifications.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 bg-slate-50 max-h-[65vh] overflow-y-auto">
          {activeTab === 'WHATSAPP' && (
            <div className="space-y-4">
              {/* WhatsApp UI Simulation Box */}
              <div className="rounded-2xl border border-emerald-200 overflow-hidden shadow-sm bg-[#efeae2] relative">
                {/* Chat Header */}
                <div className="bg-[#2e8b75] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs text-white">
                      SIM
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>SIMONCER Auto-Notification</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      </div>
                      <div className="text-[10px] text-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                        Official Verified Government Bot
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-mono">
                    Tujuan: {inspection.facility.picPhone}
                  </span>
                </div>

                {/* Chat Bubble Area */}
                <div className="p-4 space-y-3 min-h-[220px]">
                  <div className="max-w-[88%] bg-white rounded-lg rounded-tl-none p-3 shadow-xs border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans relative">
                    <div className="whitespace-pre-line break-words">
                      {waNotif.content}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-600">
                      <span>{formatIndonesianDateTime(waNotif.sentAt)}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Footer Info */}
                <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Status: Terkirim & Dibaca oleh Penerima</span>
                  <button
                    onClick={() => copyToClipboard(waNotif.content)}
                    type="button"
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Tersalin!' : 'Salin Pesan WA'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Pemberitahuan Otomatis Terhubung
                </p>
                <p className="text-[11px] text-emerald-700 leading-normal">
                  Sistem otomatis menembakkan notifikasi WhatsApp setiap kali Surat SRIKANDI terbit, Sarana mengunggah CAPA, atau saat Evaluator memperbarui status hasil telaah.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'EMAIL' && (
            <div className="space-y-4">
              {/* Email UI Simulation Box */}
              <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
                {/* Email Header */}
                <div className="bg-slate-100 p-4 border-b border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 w-16">Dari:</span>
                    <span className="font-mono text-slate-800 flex-1">
                      simoncer-noreply@pom.go.id (Sistem Monitoring CAPA)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 w-16">Kepada:</span>
                    <span className="font-mono text-slate-800 flex-1">
                      {inspection.facility.picEmail} ({inspection.facility.picName})
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-slate-500 w-16">Subjek:</span>
                    <span className="font-bold text-slate-900 flex-1">
                      {emailNotif.subject}
                    </span>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="p-6 space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
                  <div className="p-3 bg-white text-[#1e3a5f] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <span className="font-bold">SIMONCER NOTIFIKASI DINAS</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-700">
                      ID: {inspection.capaCode}
                    </span>
                  </div>

                  <div className="whitespace-pre-line text-slate-700">
                    {emailNotif.content}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Email otomatis yang digenerate oleh sistem SIMONCER.</span>
                    <button
                      onClick={() => copyToClipboard(emailNotif.content)}
                      type="button"
                      className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Tersalin!' : 'Salin Teks Email'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LOG' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Log Riwayat Notifikasi Terkirim ({inspection.notifications.length} Pesan)
              </h4>

              {inspection.notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs">
                  Belum ada log notifikasi yang tercatat.
                </div>
              ) : (
                inspection.notifications.map((notif, idx) => (
                  <div
                    key={notif.id || idx}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            notif.channel === 'WHATSAPP'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {notif.channel === 'WHATSAPP' ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </span>
                        <span className="font-bold text-slate-900">
                          {notif.channel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {notif.triggerEvent}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {formatIndonesianDateTime(notif.sentAt)}
                      </span>
                    </div>

                    <p className="text-slate-600 font-medium truncate">
                      Penerima: <span className="font-mono text-slate-800">{notif.recipient}</span>
                    </p>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-[11px] max-h-24 overflow-y-auto whitespace-pre-line">
                      {notif.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
