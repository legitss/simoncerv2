export type WhatsAppProvider = 'FONNTE' | 'WASSENGER' | 'WABA_META' | 'CUSTOM_WEBHOOK';

export interface WhatsAppGatewayConfig {
  provider: WhatsAppProvider;
  enabled: boolean;
  apiKey: string;           // Token Fonnte / API Key
  apiUrl: string;           // Endpoint API
  countryCode: string;      // Default '62'
  senderName: string;       // Nama Pengirim, cth: BBPOM di Semarang
  senderNumber: string;     // Nomor WhatsApp Perangkat Resmi BBPOM Pengirim (cth: 0812-7788-9911)
  notifyOnSrikandiLetter: boolean; // Notifikasi surat tindak lanjut ke sarana
  notifyOnCapaSubmitted: boolean;  // Notifikasi saat sarana submit CAPA ke petugas evaluator
  notifyOnCapaEvaluated: boolean;  // Notifikasi saat CAPA dievaluasi/diterima ke sarana & petugas
}

const STORAGE_KEY = 'simoncer_wa_gateway_config_v1';

export const DEFAULT_GATEWAY_CONFIG: WhatsAppGatewayConfig = {
  provider: 'FONNTE',
  enabled: true,
  apiKey: 'q1yphTjbBXCSEheNXksr', // Token Fonnte yang diberikan oleh user
  apiUrl: 'https://api.fonnte.com/send',
  countryCode: '62',
  senderName: 'BBPOM di Semarang (SIMONCER)',
  senderNumber: '0812-7788-9911',
  notifyOnSrikandiLetter: true,
  notifyOnCapaSubmitted: true,
  notifyOnCapaEvaluated: true,
};

export const PROVIDER_PRESETS: Record<
  WhatsAppProvider,
  { name: string; defaultUrl: string; placeholderToken: string; guideText: string }
> = {
  FONNTE: {
    name: 'Fonnte (Indonesia WA Gateway - Aktif)',
    defaultUrl: 'https://api.fonnte.com/send',
    placeholderToken: 'q1yphTjbBXCSEheNXksr',
    guideText: 'Menggunakan API Fonnte Indonesia. Token didapat dari dashboard fonnte.com. Mendukung pengiriman pesan instan, format tebal, dan tanda terima.',
  },
  WASSENGER: {
    name: 'Wassenger (Global Multi-Device API)',
    defaultUrl: 'https://api.wassenger.com/v1/messages',
    placeholderToken: 'Masukkan API Key Wassenger...',
    guideText: 'Layanan WhatsApp API internasional Wassenger. Membutuhkan API Key dari wassenger.com.',
  },
  WABA_META: {
    name: 'WhatsApp Business Cloud API (Meta Official)',
    defaultUrl: 'https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages',
    placeholderToken: 'Masukkan Meta System User Access Token...',
    guideText: 'WhatsApp Business API resmi dari Meta for Developers. Memerlukan Phone Number ID dan WABA Token.',
  },
  CUSTOM_WEBHOOK: {
    name: 'Custom Webhook / REST Gateway Lainnya',
    defaultUrl: 'https://your-domain.com/api/send-wa',
    placeholderToken: 'Bearer / Token / API Secret...',
    guideText: 'Gunakan server WhatsApp gateway internal Anda sendiri (Baileys / WA-Web.js / Node API). Sistem akan mengirim payload JSON { to, message }.',
  },
};

export function getGatewayConfig(): WhatsAppGatewayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const apiKey = (parsed.apiKey && parsed.apiKey.trim()) 
        ? parsed.apiKey 
        : DEFAULT_GATEWAY_CONFIG.apiKey;
      return {
        ...DEFAULT_GATEWAY_CONFIG,
        ...parsed,
        apiKey,
      };
    }
  } catch (err) {
    console.error('Failed to load WA gateway config', err);
  }
  return { ...DEFAULT_GATEWAY_CONFIG };
}

export function saveGatewayConfig(config: WhatsAppGatewayConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('simoncer-wa-config-updated'));
  } catch (err) {
    console.error('Failed to save WA gateway config', err);
  }
}

export function cleanPhoneNumber(raw: string, countryCode: string = '62'): string {
  let cleaned = raw.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.substring(1);
  } else if (!cleaned.startsWith(countryCode) && cleaned.length >= 8) {
    cleaned = countryCode + cleaned;
  }
  return cleaned;
}

export interface SendWaResult {
  success: boolean;
  message: string;
  responseRaw?: any;
  provider: WhatsAppProvider;
  targetPhone: string;
}

/**
 * Sends a real WhatsApp message using the active provider (Fonnte by default)
 */
export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
  configOverride?: Partial<WhatsAppGatewayConfig>
): Promise<SendWaResult> {
  const config = { ...getGatewayConfig(), ...configOverride };

  if (!config.enabled) {
    return {
      success: false,
      message: 'WhatsApp Gateway sedang dinonaktifkan dalam Pengaturan.',
      provider: config.provider,
      targetPhone,
    };
  }

  if (!config.apiKey || !config.apiKey.trim()) {
    return {
      success: false,
      message: 'API Token WhatsApp Gateway belum diatur.',
      provider: config.provider,
      targetPhone,
    };
  }

  const cleanTarget = cleanPhoneNumber(targetPhone, config.countryCode);
  if (!cleanTarget || cleanTarget.length < 8) {
    return {
      success: false,
      message: `Nomor telepon tujuan tidak valid: ${targetPhone}`,
      provider: config.provider,
      targetPhone,
    };
  }

  try {
    // 1. Primary Route: Server-Side Proxy (/api/send-whatsapp) to prevent Browser CORS restrictions
    if (typeof window !== 'undefined') {
      try {
        const proxyResponse = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetPhone: cleanTarget,
            message,
            provider: config.provider,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl,
            countryCode: config.countryCode,
            senderName: config.senderName,
          }),
        });

        if (proxyResponse.ok) {
          const result = await proxyResponse.json();
          if (result && typeof result.success === 'boolean') {
            return result as SendWaResult;
          }
        }
      } catch (proxyErr: any) {
        console.warn('[WhatsApp Gateway Proxy Notice]', proxyErr?.message || proxyErr);
      }
    }

    // 2. Direct Fallback if proxy unavailable (e.g., pure static standalone client)
    if (config.provider === 'FONNTE') {
      const formData = new FormData();
      formData.append('target', cleanTarget);
      formData.append('message', message);
      formData.append('countryCode', config.countryCode || '62');

      const response = await fetch(config.apiUrl || 'https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: config.apiKey.trim(),
        },
        body: formData,
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          message: responseData?.reason || responseData?.message || `Gagal mengirim (HTTP ${response.status})`,
          responseRaw: responseData,
          provider: 'FONNTE',
          targetPhone: cleanTarget,
        };
      }

      if (responseData && (responseData.status === true || responseData.status === 'true' || responseData.id)) {
        return {
          success: true,
          message: `Pesan WhatsApp Fonnte berhasil dikirim ke +${cleanTarget}!`,
          responseRaw: responseData,
          provider: 'FONNTE',
          targetPhone: cleanTarget,
        };
      } else {
        const errorReason = responseData?.reason || responseData?.message || 'Nomor tidak terdaftar atau token Fonnte salah.';
        return {
          success: false,
          message: `Fonnte: ${errorReason}`,
          responseRaw: responseData,
          provider: 'FONNTE',
          targetPhone: cleanTarget,
        };
      }
    }

    if (config.provider === 'WASSENGER') {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Token: config.apiKey.trim(),
        },
        body: JSON.stringify({
          phone: `+${cleanTarget}`,
          message,
        }),
      });
      const data = await response.json().catch(() => null);
      return {
        success: response.ok,
        message: response.ok ? 'Pesan terkirim via Wassenger' : data?.message || 'Gagal via Wassenger',
        responseRaw: data,
        provider: 'WASSENGER',
        targetPhone: cleanTarget,
      };
    }

    if (config.provider === 'WABA_META') {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTarget,
          type: 'text',
          text: { body: message },
        }),
      });
      const data = await response.json().catch(() => null);
      return {
        success: response.ok,
        message: response.ok ? 'Pesan terkirim via WABA Meta' : data?.error?.message || 'Gagal via Meta WABA',
        responseRaw: data,
        provider: 'WABA_META',
        targetPhone: cleanTarget,
      };
    }

    if (config.provider === 'CUSTOM_WEBHOOK') {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: config.apiKey.trim().startsWith('Bearer ')
            ? config.apiKey.trim()
            : `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          to: cleanTarget,
          phone: cleanTarget,
          message,
          timestamp: new Date().toISOString(),
          sender: config.senderName,
        }),
      });
      const data = await response.json().catch(() => null);
      return {
        success: response.ok,
        message: response.ok ? 'Pesan webhook berhasil diteruskan' : 'Gagal mengirim ke custom webhook',
        responseRaw: data,
        provider: 'CUSTOM_WEBHOOK',
        targetPhone: cleanTarget,
      };
    }

    return {
      success: false,
      message: `Penyedia WhatsApp ${config.provider} tidak dikenali.`,
      provider: config.provider,
      targetPhone: cleanTarget,
    };
  } catch (error: any) {
    console.warn('[WhatsApp Gateway Dispatch Warning]', error?.message || error);
    return {
      success: false,
      message: `Koneksi gateway gagal: ${error?.message || 'Periksa jaringan internet dan token API'}`,
      provider: config.provider,
      targetPhone: cleanTarget,
    };
  }
}

/**
 * 1. NOTIFIKASI SURAT TINDAK LANJUT KE SARANA
 * Dipanggil saat Surat SRIKANDI TTE diterbitkan / dikirimkan ke Sarana.
 */
export async function sendSrikandiLetterNotification(inspection: {
  capaCode: string;
  facility: { name: string; picName: string; picPhone: string };
  srikandiLetter: { letterNo: string; deadlineDate: string; deadlineDays: number; signerName: string; signerPosition: string; issuedDate?: string };
  assignedOfficer?: { name: string; phone?: string };
  leadAuditor: string;
  findings: any[];
}): Promise<SendWaResult> {
  const config = getGatewayConfig();
  if (!config.enabled || !config.notifyOnSrikandiLetter) {
    return { success: false, message: 'Notifikasi Surat Tindak Lanjut dinonaktifkan di pengaturan.', provider: config.provider, targetPhone: inspection.facility.picPhone };
  }

  const trackingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(inspection.capaCode)}`
    : `https://simoncer.id/track?code=${encodeURIComponent(inspection.capaCode)}`;

  const officer = inspection.assignedOfficer?.name || inspection.leadAuditor;

  const message = `*PEMBERITAHUAN RESMI - BBPOM DI SEMARANG*
*Sistem Monitoring Evaluasi CAPA Terintegrasi (SIMONCER)*

Yth. Pimpinan / Penanggung Jawab
*${inspection.facility.name}*
d/a: Sdr. ${inspection.facility.picName}

Dengan hormat,
Diberitahukan bahwa *Surat Tindak Lanjut Hasil Pemeriksaan* telah diterbitkan secara resmi melalui aplikasi SRIKANDI dan ditandatangani secara elektronik (TTE BSrE) oleh Kepala Balai:

📋 *Detail Surat Pemeriksaan:*
• *Nomor Surat:* ${inspection.srikandiLetter.letterNo}
• *Penandatangan:* ${inspection.srikandiLetter.signerName} (${inspection.srikandiLetter.signerPosition})
• *Kode Unik CAPA:* *${inspection.capaCode}*
• *Jumlah Temuan:* ${inspection.findings.length} klausul regulasi
• *Batas Tindak Lanjut (SLA):* *${inspection.srikandiLetter.deadlineDate}* (${inspection.srikandiLetter.deadlineDays} hari kerja sejak surat diterima)
• *Petugas Evaluator PIC:* ${officer}

📲 *Aksi Pelaku Usaha / Sarana:*
Silakan klik tautan di bawah ini untuk melihat rincian temuan dan mengunggah dokumen perbaikan CAPA secara langsung tanpa membuat akun:
${trackingLink}

Terima kasih atas kerja samanya dalam menjaga kepatuhan dan mutu kefarmasian / pangan.
_BBPOM di Semarang - Melayani dengan Integritas_`;

  return sendWhatsAppMessage(inspection.facility.picPhone, message);
}

/**
 * 1.a NOTIFIKASI SURAT HASIL PEMERIKSAAN MK (TIDAK PERLU KIRIM CAPA)
 * Mengirim notifikasi WhatsApp bahwa pemeriksaan selesai & memenuhi ketentuan, tanpa form/kewajiban CAPA.
 */
export async function sendSrikandiMkLetterNotification(inspection: {
  facility: { name: string; picName: string; picPhone: string };
  srikandiLetter: { letterNo: string; issuedDate: string; signerName: string; signerPosition: string };
  leadAuditor: string;
}): Promise<SendWaResult> {
  const config = getGatewayConfig();
  if (!config.enabled || !config.notifyOnSrikandiLetter) {
    return { 
      success: false, 
      message: 'Notifikasi Surat dinonaktifkan di pengaturan.', 
      provider: config.provider, 
      targetPhone: inspection.facility.picPhone 
    };
  }

  const message = `*PEMBERITAHUAN RESMI - BBPOM DI SEMARANG*
*Sistem Informasi Monitoring Evaluasi Terintegrasi (SIMONCER)*

Yth. Pimpinan / Penanggung Jawab
*${inspection.facility.name}*
d/a: Sdr. ${inspection.facility.picName}

Dengan hormat,
Diberitahukan bahwa *Surat Hasil Pemeriksaan Sarana* telah diterbitkan secara resmi melalui aplikasi SRIKANDI dan telah ditandatangani secara elektronik (TTE BSrE) oleh Kepala Balai:

📋 *Detail Surat Pemeriksaan:*
• *Nomor Surat:* ${inspection.srikandiLetter.letterNo}
• *Tanggal Terbit:* ${inspection.srikandiLetter.issuedDate}
• *Penandatangan:* ${inspection.srikandiLetter.signerName} (${inspection.srikandiLetter.signerPosition})
• *Kesimpulan:* *MEMENUHI KETENTUAN (MK)*

💡 *Catatan:*
Berdasarkan hasil pemeriksaan setempat, sarana dinyatakan *MEMENUHI KETENTUAN REGULASI* dan *TIDAK ADA KEWAJIBAN MENGIRIMKAN CAPA*. Dokumen naskah dinas resmi dari SRIKANDI dapat disimpan sebagai arsip kepatuhan sarana Anda.

Terima kasih atas komitmen dan konsistensi Anda dalam menjaga mutu, keamanan, dan standar regulasi.
_BBPOM di Semarang - Melayani dengan Integritas_`;

  return sendWhatsAppMessage(inspection.facility.picPhone, message);
}

/**
 * 1.b NOTIFIKASI PENUGASAN PETUGAS / EVALUATOR PIC
 * Mengirim notifikasi WhatsApp resmi ke Petugas Evaluator saat surat diterbitkan.
 */
export async function sendOfficerAssignmentNotification(inspection: {
  capaCode: string;
  facility: { name: string; type: string };
  srikandiLetter: { letterNo: string; deadlineDate: string; deadlineDays: number };
  assignedOfficer?: { name: string; phone?: string; nip?: string };
  leadAuditor: string;
  findings: any[];
}): Promise<SendWaResult> {
  const config = getGatewayConfig();
  const officerPhone = inspection.assignedOfficer?.phone || '+6281277889911';
  const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;

  if (!config.enabled || !config.notifyOnSrikandiLetter) {
    return { 
      success: false, 
      message: 'Notifikasi penugasan dinonaktifkan di pengaturan.', 
      provider: config.provider, 
      targetPhone: officerPhone 
    };
  }

  const trackingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(inspection.capaCode)}`
    : `https://simoncer.id/track?code=${encodeURIComponent(inspection.capaCode)}`;

  const message = `*PENUGASAN RESMI EVALUASI CAPA (SIMONCER)*
*BBPOM DI SEMARANG*

Yth. *${officerName}*${inspection.assignedOfficer?.nip ? ` (NIP: ${inspection.assignedOfficer.nip})` : ''},

Admin Balai telah menugaskan Anda sebagai *Petugas / Evaluator PIC* untuk verifikasi & evaluasi berkas tindak lanjut CAPA sarana:
• *Sarana:* *${inspection.facility.name}* (${inspection.facility.type})
• *No. Surat SRIKANDI:* ${inspection.srikandiLetter.letterNo}
• *Kode Unik CAPA:* *${inspection.capaCode}*
• *Batas Waktu CAPA (SLA):* *${inspection.srikandiLetter.deadlineDate}* (${inspection.srikandiLetter.deadlineDays} hari kerja sejak surat diterima sarana)
• *Jumlah Temuan:* ${inspection.findings.length} butir klausul

Mohon kesediaan Anda masuk ke Portal Petugas SIMONCER untuk memantau berkas perbaikan dan memberikan hasil evaluasi:
${trackingLink}

_Terima kasih atas dedikasi dan profesionalitas Anda._`;

  return sendWhatsAppMessage(officerPhone, message);
}

/**
 * 2. NOTIFIKASI SAAT CAPA DIKIRIM OLEH SARANA
 * Mengirim notifikasi ke Petugas Evaluator PIC bahwa berkas CAPA sudah masuk dan siap dievaluasi,
 * serta mengirim tanda terima ke nomor PIC Sarana.
 */
export async function sendCapaSubmittedNotification(inspection: {
  capaCode: string;
  facility: { name: string; picName: string; picPhone: string };
  srikandiLetter: { letterNo: string };
  assignedOfficer?: { name: string; phone?: string };
  leadAuditor: string;
}, totalEvidenceFiles: number): Promise<{ toOfficer: SendWaResult; toSarana: SendWaResult }> {
  const config = getGatewayConfig();

  const trackingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(inspection.capaCode)}`
    : `https://simoncer.id/track?code=${encodeURIComponent(inspection.capaCode)}`;

  const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;
  const officerPhone = inspection.assignedOfficer?.phone || '+6281277889911';

  // Pesan 1: Ke Petugas / Evaluator PIC (CAPA TELAH DITERIMA)
  const officerMessage = `*NOTIFIKASI DOKUMEN: BERKAS CAPA TELAH DITERIMA*
*SIMONCER - BBPOM DI SEMARANG*

Yth. *${officerName}* (Petugas / Evaluator PIC),

Diberitahukan bahwa berkas perbaikan CAPA dari Sarana binaan Anda telah *RESMI DITERIMA* di sistem SIMONCER dan siap untuk ditelaah:

🏢 *Detail Sarana:*
• *Nama Sarana:* *${inspection.facility.name}*
• *Kode Unik CAPA:* *${inspection.capaCode}*
• *No. Surat SRIKANDI:* ${inspection.srikandiLetter.letterNo}
• *PIC Sarana:* ${inspection.facility.picName} (${inspection.facility.picPhone})
• *Berkas Bukti Terlampir:* ${totalEvidenceFiles} berkas dokumen
• *Status Sesi:* *EVALUASI_PETUGAS (Menunggu Telaah)*

Silakan masuk ke *Portal Petugas SIMONCER* untuk melakukan evaluasi butir temuan dan menerbitkan hasil verifikasi:
${trackingLink}

_Terima kasih atas dedikasi dan profesionalitas Anda._`;

  // Pesan 2: Tanda Terima ke Sarana (CAPA TELAH DIKIRIM)
  const saranaMessage = `*PEMBERITAHUAN RESMI: LAPORAN CAPA TELAH DIKIRIMKAN*
*SIMONCER - BBPOM DI SEMARANG*

Yth. Manajemen *${inspection.facility.name}*,
d/a: ${inspection.facility.picName}

Laporan Corrective and Preventive Action (CAPA) Anda untuk Kode Sesi: *${inspection.capaCode}* telah *BERHASIL DIKIRIMKAN* ke Balai Besar POM di Semarang dengan total ${totalEvidenceFiles} berkas bukti dukung pada ${new Date().toLocaleDateString('id-ID')} pukul ${new Date().toLocaleTimeString('id-ID')} WIB.

📋 *Status Sesi Saat Ini:*
*EVALUASI_PETUGAS* (Menunggu Telaah & Verifikasi Petugas Evaluator: *${officerName}*)

Tanda terima digital penyerahan telah tersimpan di sistem. Anda dapat memantau perkembangan evaluasi secara langsung melalui tautan:
${trackingLink}

_Terima kasih atas kepatuhan regulasi dan komitmen perbaikan fasilitas Anda._`;

  let toOfficer: SendWaResult = { success: false, message: 'Notifikasi dinonaktifkan', provider: config.provider, targetPhone: officerPhone };
  let toSarana: SendWaResult = { success: false, message: 'Notifikasi dinonaktifkan', provider: config.provider, targetPhone: inspection.facility.picPhone };

  if (config.enabled && config.notifyOnCapaSubmitted) {
    try {
      toOfficer = await sendWhatsAppMessage(officerPhone, officerMessage);
    } catch (e: any) {
      console.warn('[Notify Officer Error caught]', e?.message || e);
    }
    try {
      toSarana = await sendWhatsAppMessage(inspection.facility.picPhone, saranaMessage);
    } catch (e: any) {
      console.warn('[Notify Sarana Error caught]', e?.message || e);
    }
  }

  return { toOfficer, toSarana };
}

/**
 * 3. NOTIFIKASI SAAT CAPA DITERIMA / SELESAI DIEVALUASI
 * Mengirim notifikasi hasil evaluasi ke PIC Sarana dan notifikasi konfirmasi ke Petugas/Supervisor.
 */
export async function sendCapaEvaluatedNotification(
  inspection: {
    capaCode: string;
    facility: { name: string; picName: string; picPhone: string };
    status: string;
    assignedOfficer?: { name: string; phone?: string };
    leadAuditor: string;
  },
  evaluation: {
    reportNo: string;
    evaluatorName: string;
    finalStatus: string;
    notes: string;
  }
): Promise<{ toSarana: SendWaResult; toOfficer: SendWaResult }> {
  const config = getGatewayConfig();

  const trackingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(inspection.capaCode)}`
    : `https://simoncer.id/track?code=${encodeURIComponent(inspection.capaCode)}`;

  const isAccepted = evaluation.finalStatus === 'TERVALIDASI' || evaluation.finalStatus === 'SELESAI_CLOSED';
  const statusHeadline = isAccepted
    ? '✅ *MEMENUHI SYARAT (CAPA DITERIMA / CLOSED)*'
    : evaluation.finalStatus === 'PERLU_PERBAIKAN'
    ? '⚠️ *PERLU PERBAIKAN / REVISI LANJUTAN*'
    : '⏳ *SEDANG DALAM TAHAP EVALUASI*';

  // Pesan untuk Sarana
  const saranaMessage = `*HASIL EVALUASI TINDAK LANJUT CAPA*
*SIMONCER - BBPOM DI SEMARANG*

Yth. Pimpinan / PIC *${inspection.facility.name}*,

Tim Petugas / Evaluator BBPOM di Semarang telah menyelesaikan evaluasi terhadap dokumen CAPA Kode: *${inspection.capaCode}*.

📊 *Hasil Evaluasi Resmi:*
• *Status Akhir:* ${statusHeadline}
• *No. Berita Acara:* ${evaluation.reportNo}
• *Evaluator PIC:* ${evaluation.evaluatorName}

📝 *Catatan & Rekomendasi Evaluator:*
"${evaluation.notes}"

Silakan buka portal SIMONCER untuk mengunduh Lembar Hasil Evaluasi resmi (PDF) atau melihat tindak lanjut yang diperlukan:
${trackingLink}

Terima kasih atas kerja samanya dalam pengawasan mutu obat dan makanan.
_BBPOM di Semarang_`;

  // Pesan konfirmasi ke Evaluator / Supervisor
  const officerPhone = inspection.assignedOfficer?.phone || '+6281277889911';
  const officerMessage = `*KONFIRMASI STATUS EVALUASI CAPA*
*SIMONCER - BBPOM DI SEMARANG*

Halo *${evaluation.evaluatorName}*,

Berita Acara Evaluasi No: *${evaluation.reportNo}* untuk sarana *${inspection.facility.name}* (Kode: *${inspection.capaCode}*) telah berhasil disimpan ke sistem dengan status: *${evaluation.finalStatus}*.

Notifikasi pembaruan otomatis telah dikirimkan ke WhatsApp PIC Sarana (+${cleanPhoneNumber(inspection.facility.picPhone)}).

Tautan Berkas Sesi:
${trackingLink}`;

  let toSarana: SendWaResult = { success: false, message: 'Notifikasi dinonaktifkan', provider: config.provider, targetPhone: inspection.facility.picPhone };
  let toOfficer: SendWaResult = { success: false, message: 'Notifikasi dinonaktifkan', provider: config.provider, targetPhone: officerPhone };

  if (config.enabled && config.notifyOnCapaEvaluated) {
    try {
      toSarana = await sendWhatsAppMessage(inspection.facility.picPhone, saranaMessage);
    } catch (e: any) {
      console.warn('[Notify Sarana Evaluated caught]', e?.message || e);
    }
    try {
      toOfficer = await sendWhatsAppMessage(officerPhone, officerMessage);
    } catch (e: any) {
      console.warn('[Notify Officer Evaluated caught]', e?.message || e);
    }
  }

  return { toSarana, toOfficer };
}
