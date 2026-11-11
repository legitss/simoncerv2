import { 
  InspectionSession, 
  SystemNotification, 
  NotificationPreferences, 
  NotificationTriggerEvent,
  NotificationMessageTemplate 
} from '../types';

export type { NotificationPreferences, NotificationTriggerEvent, NotificationMessageTemplate };

const STORAGE_KEY = 'simoncer_notification_preferences_v1';

export const DEFAULT_NOTIFICATION_TEMPLATES: Record<NotificationTriggerEvent, {
  label: string;
  waContent: string;
  emailSubject: string;
  emailContent: string;
}> = {
  SURAT_TINDAK_LANJUT: {
    label: 'Surat Tindak Lanjut Hasil Pemeriksaan Baru',
    waContent: `📄 *[SIMONCER BPOM] SURAT TINDAK LANJUT PEMERIKSAAN RESMI TERBIT*

Yth. Pimpinan/PIC *{SARANA}*,

Surat Tindak Lanjut Hasil Pemeriksaan sarana Anda telah diterbitkan dengan Tanda Tangan Elektronik (TTE) SRIKANDI:
• *Nomor Surat:* {NO_SURAT}
• *Kode CAPA:* {KODE_CAPA}
• *Tanggal Surat:* {TANGGAL_SURAT}
• *Tenggat Waktu CAPA:* {DEADLINE}
• *Jumlah Temuan Wajib CAPA:* {JUMLAH_TEMUAN} Butir

📌 *Instruksi Penyampaian CAPA:*
Mohon segera menyusun formulir CAPA dan mengunggah dokumen bukti dukung perbaikan melalui tautan resmi:
🌐 {LINK}

📌 *Catatan Petugas:*
{CATATAN}

_BBPOM di Semarang - Jl Sukun Raya No 41 A Banyumanik Semarang_`,
    emailSubject: `[SIMONCER - RESMI] Surat Tindak Lanjut Hasil Pemeriksaan - {NO_SURAT} ({SARANA})`,
    emailContent: `Yth. Pimpinan dan Apoteker Penanggung Jawab {SARANA},

Bersama ini disampaikan bahwa Surat Tindak Lanjut Hasil Pemeriksaan telah selesai diproses dan ditandatangani secara elektronik (TTE SRIKANDI) oleh Kepala Balai Besar POM di Semarang.

INFORMASI SURAT & SESI PEMERIKSAAN:
• Nomor Naskah SRIKANDI: {NO_SURAT}
• Kode Unik CAPA: {KODE_CAPA}
• Tanggal Naskah: {TANGGAL_SURAT}
• Batas Akhir Penyerahan CAPA: {DEADLINE}
• Total Temuan: {JUMLAH_TEMUAN} Butir

CATATAN KHUSUS EVALUASI:
{CATATAN}

Dokumen resmi PDF bertanda tangan digital dan formulir pengisian CAPA dapat diakses melalui portal SIMONCER:
{LINK}

Salam Takzim,
Balai Besar POM di Semarang`,
  },

  CAPA_DITERIMA: {
    label: 'Penerimaan Tanggapan CAPA dari Sarana',
    waContent: `✅ *[SIMONCER BPOM] TANDA TERIMA PENYERAHAN DOKUMEN CAPA*

Yth. Pimpinan/PIC *{SARANA}*,

Tanggapan CAPA perbaikan sarana Anda telah *BERHASIL DITERIMA* oleh sistem SIMONCER BBPOM di Semarang:
• *Kode CAPA:* {KODE_CAPA}
• *Waktu Penyerahan:* {WAKTU}
• *Status Sesi:* {STATUS}
• *Evaluator Ditugaskan:* {PETUGAS}

Berkas perbaikan Anda beserta tautan repositori Google Drive saat ini sedang dalam proses evaluasi oleh tim evaluator Balai POM.

📌 *Catatan:*
{CATATAN}

🌐 Lacak Progres: {LINK}

_Terima kasih atas kepatuhan dan komitmen penjaminan mutu sarana Anda._`,
    emailSubject: `[SIMONCER - TANDA TERIMA] Penerimaan Tanggapan CAPA - {KODE_CAPA} ({SARANA})`,
    emailContent: `Yth. Bapak/Ibu PIC {SARANA},

Dokumen Tanggapan Corrective and Preventive Action (CAPA) yang Anda kirimkan untuk sesi {KODE_CAPA} telah berhasil diterima ke dalam basis data sistem SIMONCER BBPOM di Semarang.

RINGKASAN PENYERAHAN:
• Nomor Registrasi CAPA: {KODE_CAPA}
• Sarana: {SARANA}
• Status Baru: {STATUS}
• Petugas Pemeriksa: {PETUGAS}
• Tanggal Penyerahan: {WAKTU}

CATATAN KHUSUS:
{CATATAN}

Evaluator kami akan meneliti tindakan perbaikan (CA), tindakan pencegahan (PA), dan seluruh bukti dukung yang telah dilampirkan. Hasil evaluasi resmi akan diterbitkan melalui sistem ini:
{LINK}

Hormat kami,
Tim Evaluasi CAPA BBPOM Semarang`,
  },

  STATUS_EVALUASI_UPDATE: {
    label: 'Perubahan Status Evaluasi CAPA',
    waContent: `📋 *[SIMONCER BPOM] PEMBARUAN STATUS EVALUASI CAPA*

Yth. Pimpinan/PIC *{SARANA}*,

Status sesi evaluasi CAPA sarana Anda telah diperbarui oleh Tim Auditor:
• *Kode CAPA:* {KODE_CAPA}
• *No Surat SRIKANDI:* {NO_SURAT}
• *Status Baru:* *{STATUS}*
• *Evaluator:* {PETUGAS}

📌 *Catatan Evaluasi:*
{CATATAN}

Untuk melihat lembar evaluasi lengkap, catatan rekomendasi, atau surat pengantar penutupan CAPA:
🌐 {LINK}

_Balai Besar POM di Semarang_`,
    emailSubject: `[SIMONCER] Pembaruan Status CAPA {KODE_CAPA} - {SARANA}`,
    emailContent: `Yth. Pimpinan {SARANA},

Diberitahukan bahwa status evaluasi CAPA untuk sesi {KODE_CAPA} telah mengalami perubahan.

DETAIL PEMBARUAN:
• Sarana: {SARANA}
• Kode Sesi: {KODE_CAPA}
• Status Evaluasi: {STATUS}
• Evaluator Balai: {PETUGAS}

CATATAN KHUSUS EVALUASI:
{CATATAN}

Silakan unduh dokumen evaluasi resmi atau surat penutupan/evaluasi ulang pada portal SIMONCER:
{LINK}

Hormat kami,
Sistem SIMONCER BBPOM di Semarang`,
  },

  TEMUAN_STATUS_UPDATE: {
    label: 'Pembaruan Status Temuan Pemeriksaan',
    waContent: `🔔 *[SIMONCER BPOM] PEMBARUAN STATUS TEMUAN*

Yth. Pimpinan & Penanggung Jawab *{SARANA}*,

Terdapat pembaruan data/status butir temuan hasil pemeriksaan sarana Anda:
• *Kode CAPA:* {KODE_CAPA}
• *No Surat SRIKANDI:* {NO_SURAT}
• *Klausul:* {KLAUSUL}
• *Status Butir Baru:* {STATUS}

📌 *Catatan Petugas:*
{CATATAN}

Silakan pantau detail verifikasi dan matriks evaluasi pada portal SIMONCER:
🌐 {LINK}

_Balai Besar POM di Semarang - Layanan Sertifikasi & Inspeksi Terpadu_`,
    emailSubject: `[SIMONCER] Pembaruan Status Temuan - {KODE_CAPA} ({SARANA})`,
    emailContent: `Yth. Tim Penanggung Jawab {SARANA},

Melalui surat elektronik otomatis ini, Sistem Monitoring & Evaluasi CAPA Terintegrasi (SIMONCER) BBPOM di Semarang memberitahukan bahwa terdapat pembaruan status butir temuan ketidaksesuaian.

RINCIAN SESI:
• Sarana: {SARANA}
• Kode Sesi CAPA: {KODE_CAPA}
• Surat Tindak Lanjut: {NO_SURAT}
• Klausul Terkait: {KLAUSUL}
• Status Terkini: {STATUS}

CATATAN KHUSUS:
{CATATAN}

Silakan masuk ke portal SIMONCER untuk mengunduh lembar evaluasi atau meninjau verifikasi auditor secara lengkap:
{LINK}

Hormat kami,
BBPOM di Semarang - Subkelompok Substansi Pemeriksaan`,
  },

  REMINDER_DEADLINE: {
    label: 'Pengingat Tenggat Waktu (Deadline Alert)',
    waContent: `⏰ *[SIMONCER BPOM] PENGINGAT BATAS WAKTU (DEADLINE) CAPA*

Yth. Pimpinan/PIC *{SARANA}*,

Masa waktu penyampaian tindakan perbaikan (CAPA) sarana Anda mendekati batas akhir:
• *Kode CAPA:* {KODE_CAPA}
• *No Surat SRIKANDI:* {NO_SURAT}
• *Batas Akhir (Deadline):* *{DEADLINE}*

📌 *Peringatan Sistem:*
{CATATAN}

Mohon segera melengkapi matriks CAPA dan mengunggah bukti perbaikan fisik/SOP sebelum batas waktu berakhir:
🌐 {LINK}

_Balai Besar POM di Semarang_`,
    emailSubject: `[SIMONCER - PENTING] Pengingat Batas Waktu CAPA - {KODE_CAPA} ({SARANA})`,
    emailContent: `Yth. Pimpinan {SARANA},

Kami mengingatkan bahwa sesi pemeriksaan dengan Kode {KODE_CAPA} memiliki batas akhir penyampaian CAPA pada tanggal {DEADLINE}.

CATATAN:
{CATATAN}

Segera akses portal SIMONCER untuk menyelesaikan pengunggahan bukti perbaikan agar tidak melewati SLA yang ditetapkan:
{LINK}

Hormat kami,
Balai Besar POM di Semarang`,
  },
};

export const substituteNotificationVariables = (
  text: string,
  vars: {
    facilityName?: string;
    capaCode?: string;
    letterNo?: string;
    findingClause?: string;
    newStatus?: string;
    findingDescription?: string;
    note?: string;
    deadline?: string;
    issuedDate?: string;
    totalFindings?: string | number;
    officerName?: string;
    timeString?: string;
    trackingUrl?: string;
  }
): string => {
  if (!text) return '';
  return text
    .replace(/{SARANA}/g, vars.facilityName || 'PT Kimia Farma Trading & Distribution')
    .replace(/{KODE_CAPA}/g, vars.capaCode || 'CAPA-2026-PBF02')
    .replace(/{NO_SURAT}/g, vars.letterNo || 'B-PW.01.02.41A.11.26.8872')
    .replace(/{KLAUSUL}/g, vars.findingClause || 'CDOB 2024 Bab 9 Butir 9.1')
    .replace(/{STATUS}/g, vars.newStatus || 'EVALUASI_PETUGAS')
    .replace(/{DESKRIPSI}/g, vars.findingDescription || 'Observasi temuan hasil audit')
    .replace(/{CATATAN}/g, vars.note || 'Mohon pantau sistem SIMONCER secara berkala untuk kepatuhan mutu.')
    .replace(/{DEADLINE}/g, vars.deadline || '30 Hari Kerja')
    .replace(/{TANGGAL_SURAT}/g, vars.issuedDate || '04 November 2026')
    .replace(/{JUMLAH_TEMUAN}/g, String(vars.totalFindings || 1))
    .replace(/{PETUGAS}/g, vars.officerName || 'apt. Eko Prasetyo, M.Farm')
    .replace(/{WAKTU}/g, vars.timeString || new Date().toLocaleString('id-ID'))
    .replace(/{LINK}/g, vars.trackingUrl || `https://simoncer.id/track?code=${vars.capaCode || 'CAPA-2026-PBF02'}`);
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    whatsapp: true,
    email: true,
  },
  recipients: {
    saranaPhone: '+62 813-1122-3344',
    saranaEmail: 'qa@kimiafarma-semarang.co.id',
    officerPhone: '+62 811-2233-4455',
    officerEmail: 'eko.prasetyo@pom.go.id',
  },
  triggers: {
    findingStatusUpdate: true,      // 1. Pembaruan status temuan
    newFollowUpLetter: true,        // 2. Surat tindak lanjut baru
    capaSubmissionReceived: true,   // 3. Penerimaan tanggapan CAPA
    capaStatusChange: true,         // 4. Perubahan status CAPA
    deadlineReminder: true,         // 5. Pengingat batas waktu
  },
  templates: {
    SURAT_TINDAK_LANJUT: {
      waContent: DEFAULT_NOTIFICATION_TEMPLATES.SURAT_TINDAK_LANJUT.waContent,
      emailSubject: DEFAULT_NOTIFICATION_TEMPLATES.SURAT_TINDAK_LANJUT.emailSubject,
      emailContent: DEFAULT_NOTIFICATION_TEMPLATES.SURAT_TINDAK_LANJUT.emailContent,
    },
    CAPA_DITERIMA: {
      waContent: DEFAULT_NOTIFICATION_TEMPLATES.CAPA_DITERIMA.waContent,
      emailSubject: DEFAULT_NOTIFICATION_TEMPLATES.CAPA_DITERIMA.emailSubject,
      emailContent: DEFAULT_NOTIFICATION_TEMPLATES.CAPA_DITERIMA.emailContent,
    },
    STATUS_EVALUASI_UPDATE: {
      waContent: DEFAULT_NOTIFICATION_TEMPLATES.STATUS_EVALUASI_UPDATE.waContent,
      emailSubject: DEFAULT_NOTIFICATION_TEMPLATES.STATUS_EVALUASI_UPDATE.emailSubject,
      emailContent: DEFAULT_NOTIFICATION_TEMPLATES.STATUS_EVALUASI_UPDATE.emailContent,
    },
    TEMUAN_STATUS_UPDATE: {
      waContent: DEFAULT_NOTIFICATION_TEMPLATES.TEMUAN_STATUS_UPDATE.waContent,
      emailSubject: DEFAULT_NOTIFICATION_TEMPLATES.TEMUAN_STATUS_UPDATE.emailSubject,
      emailContent: DEFAULT_NOTIFICATION_TEMPLATES.TEMUAN_STATUS_UPDATE.emailContent,
    },
    REMINDER_DEADLINE: {
      waContent: DEFAULT_NOTIFICATION_TEMPLATES.REMINDER_DEADLINE.waContent,
      emailSubject: DEFAULT_NOTIFICATION_TEMPLATES.REMINDER_DEADLINE.emailSubject,
      emailContent: DEFAULT_NOTIFICATION_TEMPLATES.REMINDER_DEADLINE.emailContent,
    },
  },
  customNote: 'Mohon pantau sistem SIMONCER secara berkala untuk kepatuhan tindak lanjut inspeksi BPOM.',
  autoDispatch: true,
  emailSmtpServer: 'mail.pom.go.id (TLS/SSL Port 465)',
  emailSenderEmail: 'simoncer@pom.go.id',
  emailSenderName: 'SIMONCER - Balai Besar POM di Semarang',
  waGatewayEndpoint: 'https://gateway.pom.go.id/api/v2/send-message',
};

export const getNotificationPreferences = (): NotificationPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      channels: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels, ...(parsed.channels || {}) },
      recipients: { ...DEFAULT_NOTIFICATION_PREFERENCES.recipients, ...(parsed.recipients || {}) },
      triggers: { ...DEFAULT_NOTIFICATION_PREFERENCES.triggers, ...(parsed.triggers || {}) },
      templates: { ...DEFAULT_NOTIFICATION_PREFERENCES.templates, ...(parsed.templates || {}) },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

export const saveNotificationPreferences = (prefs: NotificationPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save notification preferences', e);
  }
};

// Notification Payload Generator
export interface DispatchPayload {
  triggerEvent: NotificationTriggerEvent;
  inspection: InspectionSession;
  additionalDetails?: {
    findingClause?: string;
    findingDescription?: string;
    newStatus?: string;
    letterNo?: string;
    customNote?: string;
  };
}

export const generateNotificationContents = (payload: DispatchPayload, prefs: NotificationPreferences) => {
  const { triggerEvent, inspection, additionalDetails } = payload;
  const facility = inspection.facility;
  const letterNo = additionalDetails?.letterNo || inspection.srikandiLetter?.letterNo || 'B-PW.01.02.41A.11.26.8872';
  const capaCode = inspection.capaCode;
  const note = additionalDetails?.customNote || prefs.customNote;

  const templateConfig = prefs.templates?.[triggerEvent] || DEFAULT_NOTIFICATION_TEMPLATES[triggerEvent] || DEFAULT_NOTIFICATION_TEMPLATES.STATUS_EVALUASI_UPDATE;
  const eventLabel = DEFAULT_NOTIFICATION_TEMPLATES[triggerEvent]?.label || 'Pemberitahuan Sistem SIMONCER';

  const variables = {
    facilityName: facility.name,
    capaCode,
    letterNo,
    findingClause: additionalDetails?.findingClause || (inspection.findings[0]?.clause),
    newStatus: additionalDetails?.newStatus || inspection.status,
    findingDescription: additionalDetails?.findingDescription || (inspection.findings[0]?.description),
    note,
    deadline: inspection.srikandiLetter?.deadlineDate || '30 Hari Kerja',
    issuedDate: inspection.srikandiLetter?.issuedDate || 'Hari ini',
    totalFindings: inspection.findings.length,
    officerName: inspection.assignedOfficer?.name || inspection.leadAuditor || 'Tim Evaluator Balai',
    timeString: new Date().toLocaleString('id-ID'),
    trackingUrl: `https://simoncer.id/track?code=${capaCode}`,
  };

  const waContent = substituteNotificationVariables(templateConfig.waContent, variables);
  const emailSubject = substituteNotificationVariables(templateConfig.emailSubject, variables);
  const emailContent = substituteNotificationVariables(templateConfig.emailContent, variables);

  return {
    eventLabel,
    emailSubject,
    emailContent,
    waContent,
  };
};

// Dispatch helper that creates both WhatsApp and Email SystemNotification objects
export const createAutomaticNotifications = (
  payload: DispatchPayload,
  preferences?: NotificationPreferences
): SystemNotification[] => {
  const prefs = preferences || getNotificationPreferences();
  const { triggerEvent, inspection } = payload;
  const facility = inspection.facility;

  // Check if trigger is enabled
  let isTriggerActive = true;
  if (triggerEvent === 'TEMUAN_STATUS_UPDATE' && !prefs.triggers.findingStatusUpdate) isTriggerActive = false;
  if (triggerEvent === 'SURAT_TINDAK_LANJUT' && !prefs.triggers.newFollowUpLetter) isTriggerActive = false;
  if (triggerEvent === 'CAPA_DITERIMA' && !prefs.triggers.capaSubmissionReceived) isTriggerActive = false;
  if (triggerEvent === 'STATUS_EVALUASI_UPDATE' && !prefs.triggers.capaStatusChange) isTriggerActive = false;
  if (triggerEvent === 'REMINDER_DEADLINE' && !prefs.triggers.deadlineReminder) isTriggerActive = false;

  if (!isTriggerActive) return [];

  const contents = generateNotificationContents(payload, prefs);
  const now = new Date().toISOString();
  const newNotifications: SystemNotification[] = [];

  // WhatsApp Notification
  if (prefs.channels.whatsapp) {
    newNotifications.push({
      id: `NOTIF-WA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel: 'WHATSAPP',
      recipient: `${prefs.recipients.saranaPhone || facility.picPhone} (${facility.picName})`,
      subject: contents.emailSubject,
      content: contents.waContent,
      sentAt: now,
      status: 'DELIVERED',
      triggerEvent,
      meta: {
        inspectionId: inspection.id,
        capaCode: inspection.capaCode,
        facilityName: facility.name,
        letterNo: inspection.srikandiLetter?.letterNo,
      },
    });
  }

  // Email Notification
  if (prefs.channels.email) {
    newNotifications.push({
      id: `NOTIF-EM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel: 'EMAIL',
      recipient: prefs.recipients.saranaEmail || facility.picEmail,
      subject: contents.emailSubject,
      content: contents.emailContent,
      sentAt: now,
      status: 'DELIVERED',
      triggerEvent,
      meta: {
        inspectionId: inspection.id,
        capaCode: inspection.capaCode,
        facilityName: facility.name,
        letterNo: inspection.srikandiLetter?.letterNo,
      },
    });
  }

  return newNotifications;
};
