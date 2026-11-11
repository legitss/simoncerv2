export type FindingCategory = 'KRITIS' | 'MAYOR' | 'MINOR';

export type InspectionStatus =
  | 'DRAFT'
  | 'SURAT_TERBIT'
  | 'MENUNGGU_CAPA'
  | 'CAPA_TERKIRIM'
  | 'MASIH_EVALUASI'
  | 'EVALUASI_PETUGAS'
  | 'PERLU_PERBAIKAN'
  | 'TERVALIDASI'
  | 'SELESAI_CLOSED';

export type CapaItemEvaluation = 'PENDING' | 'MEMADAI' | 'BELUM_MEMADAI' | 'REVISI';

export interface EvidenceFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  driveUrl?: string;
  uploadedAt: string;
  category: 'Foto Bukti' | 'SOP Terkoreksi' | 'Sertifikat Kalibrasi' | 'Laporan Pelatihan' | 'Berita Acara' | 'Link Google Drive' | 'Lainnya';
}

export interface FindingItem {
  id: string;
  clause: string; // e.g., "CPOB 2024 Bab 3 Butir 3.12"
  category: FindingCategory;
  description: string;
  initialEvidenceDescription?: string;
  initialPhotos?: string[];
  capa: {
    rootCauseAnalysis: string; // Analisis Akar Masalah (5-Why / Ishikawa / GAP Analysis)
    correctiveAction: string;  // Tindakan Perbaikan (Corrective Action)
    preventiveAction: string;  // Tindakan Pencegahan (Preventive Action)
    pic: string;               // Penanggung Jawab
    targetCompletionDate: string;
    submittedAt?: string;
    evidenceFiles: EvidenceFile[];
    evidenceDriveUrl?: string; // Tautan Google Drive / Cloud Storage untuk bukti dukung perbaikan yang banyak
    evaluatorNotes?: string;
    evaluationStatus: CapaItemEvaluation;
    requirement?: string;      // Persyaratan regulasi (CPOB/CPOTB/CDOB/CPKB/CPPOB)
    currentCondition?: string; // Kondisi saat ini di sarana
    gapAnalysis?: string;      // Analisis Kesenjangan (GAP Analysis)
    progressStatus?: string;   // Status: "Sudah Selesai" | "Dalam Proses"
    evidenceDocNumber?: string;// Bukti Perbaikan / Nomor dokumen SOP/Change Control
    impact?: string;           // Dampak / Akibat apabila tidak sesuai dengan persyaratan (Khusus Matriks TPP/CAPA)
  };
}

export interface SrikandiLetter {
  letterNo: string;        // e.g. "SRK/TL-WAS/2026/0419"
  subject: string;         // e.g. "Penyampaian Hasil Pemeriksaan dan Permintaan Tindak Lanjut (CAPA)"
  issuedDate: string;      // Tanggal Surat SRIKANDI
  sentDate?: string;       // Tanggal surat pertama kali dikirimkan ke sarana
  receivedDate?: string;   // Tanggal pertama kali sarana menerima surat (titik awal hitung mundur SLA BBPOM Semarang)
  deadlineDays: number;    // Jumlah hari SLA (e.g. 14, 20, atau 30 hari kerja)
  deadlineDate: string;    // Tanggal batas akhir pengiriman CAPA (dihitung dalam hari kerja)
  dayType?: 'HARI_KERJA' | 'HARI_KALENDER'; // Standar BBPOM Semarang: HARI_KERJA (Senin-Jumat, mengecualikan libur)
  signerName: string;      // Pejabat Penandatangan
  signerPosition: string;  // Jabatan Penandatangan
  signerNip: string;
  tteId: string;           // BSrE Sertifikat Digital ID
  tteTimestamp: string;
  tteQrCodeContent: string;
  isVerifiedTTE: boolean;
  documentFileUrl?: string;
}

export interface EvaluationReport {
  reportNo: string;
  evaluatorName: string;
  evaluatorNip?: string;
  evaluatedAt: string;
  overallConclusion: string;
  finalStatus: 'TERVALIDASI' | 'MASIH_EVALUASI' | 'SELESAI_CLOSED' | 'PERLU_PERBAIKAN';
  uploadedDocumentName?: string;
  uploadedDocumentSize?: string;
  notes: string;
  supervisorApproval?: {
    supervisorName: string;
    supervisorNip?: string;
    approvedAt: string;
    notes: string;
    isApproved: boolean;
  };
}

export interface SrikandiDocumentItem {
  id: string;
  type: 'SURAT_PEMERIKSAAN_AWAL' | 'SURAT_PENGANTAR_EVALUASI' | 'SURAT_PENUTUPAN_CAPA';
  letterNo: string;
  title: string;
  issuedDate: string;
  signerName: string;
  tteBsreId: string;
  documentFileName?: string;
  uploadedAt: string;
  uploadedBy: string;
  isVerifiedTTE: boolean;
  notes?: string;
}

export interface CapaStageFindingSnapshot {
  findingId: string;
  clause: string;
  category: FindingCategory;
  description: string;
  rootCauseAnalysis?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  evidenceFilesCount: number;
  evaluatorNotes?: string;
  evaluationStatus: CapaItemEvaluation;
}

export interface CapaStageCluster {
  stageNumber: number; // 1 for CAPA 1, 2 for CAPA 2, 3 for CAPA 3
  stageLabel: string;  // e.g. "Sesi CAPA 1" | "Sesi CAPA 2"
  title: string;       // e.g. "Evaluasi CAPA Tahap ke-1"
  status: 'DRAFT' | 'DALAM_EVALUASI' | 'MENUNGGU_SURAT_PENGANTAR' | 'SURAT_DIUNGGAH' | 'TERKIRIM_KE_SARANA';
  isComplete: boolean; // True jika evaluasi selesai dan surat pengantar TTE sudah diunggah
  evaluatedAt?: string;
  evaluatorName?: string;
  evaluatorNip?: string;
  overallConclusion?: string;
  
  // Surat Pengantar SRIKANDI (TTE BSrE) untuk sesi ini
  coverLetter?: {
    letterNo: string;
    letterDate: string;
    subject: string;
    fileName?: string;
    fileSize?: string;
    tteBsreId?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    isUploaded: boolean;
  };

  // Butir evaluasi pada siklus ini
  findingsSnapshot?: CapaStageFindingSnapshot[];
  totalFindings: number;
  closedCount: number;
  openCount: number;

  // Notifikasi Pengiriman ke Sarana
  notification?: {
    isSent: boolean;
    sentAt?: string;
    sentBy?: string;
    recipientPhone?: string;
    recipientEmail?: string;
    notes?: string;
  };
}

export interface SrikandiTteWorkflow {
  // Flag apakah sarana wajib kirim CAPA (ada temuan) atau Memenuhi Ketentuan (MK, hanya WA)
  requiresCapa?: boolean; // default: true
  
  // 1. Berkas Surat Hasil Pemeriksaan (Awal) dari SRIKANDI
  initialLetterUploadedAt?: string;
  initialLetterFileName?: string;

  // 2. Matriks CAPA Terbentuk
  matrixSavedAt?: string;
  matrixSavedBy?: string;
  matrixDocumentName?: string;
  isMatrixSaved?: boolean;
  
  // 3. Surat Pengantar & Pengajuan ke SRIKANDI
  coverLetterNo?: string;
  coverLetterDate?: string;
  coverLetterPerihal?: string;
  srikandiSubmissionDate?: string;
  srikandiDraftNo?: string; // Nomor Agenda / Draft Naskah SRIKANDI
  srikandiStatus?: 'DRAFT' | 'PENGAJUAN_TTE' | 'PROSES_TTE' | 'SUDAH_TTE' | 'DITOLAK';
  
  // 4. Admin Unduh & Upload Hasil TTE dari SRIKANDI
  signedDocumentNo?: string;
  signedDocumentDate?: string;
  signedDocumentSubject?: string;
  signedDocumentUrl?: string;
  signedDocumentName?: string;
  signedByAdminAt?: string;
  adminName?: string;
  tteBsreId?: string;
  
  // 5. Update Informasi ke Sarana
  saranaNotifiedAt?: string;
  saranaNotifiedBy?: string;
  notificationChannels?: ('WHATSAPP' | 'EMAIL')[];
  notificationNotes?: string;

  // Integrasi Evaluator -> Admin Cover Letter
  needsAdminCoverLetter?: boolean; // True jika evaluasi selesai dan menunggu admin mengunggah surat pengantar evaluasi dari SRIKANDI
  evaluationCompletedAt?: string;
  evaluationCompletedBy?: string;
  evaluationDocumentName?: string;

  // Daftar berkas surat dinas SRIKANDI yang terhubung
  srikandiDocuments?: SrikandiDocumentItem[];

  // Kluster sesi tahapan CAPA terpadu (Sesi CAPA 1, Sesi CAPA 2, dst.)
  stageClusters?: CapaStageCluster[];
  activeStageNumber?: number;
}

export type NotificationTriggerEvent =
  | 'SURAT_TINDAK_LANJUT'
  | 'CAPA_DITERIMA'
  | 'STATUS_EVALUASI_UPDATE'
  | 'TEMUAN_STATUS_UPDATE'
  | 'REMINDER_DEADLINE';

export interface SystemNotification {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL';
  recipient: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'DELIVERED' | 'READ' | 'PENDING';
  triggerEvent: NotificationTriggerEvent;
  meta?: {
    inspectionId?: string;
    capaCode?: string;
    facilityName?: string;
    letterNo?: string;
    findingClause?: string;
  };
}

export interface NotificationMessageTemplate {
  waContent: string;
  emailSubject: string;
  emailContent: string;
}

export interface NotificationPreferences {
  channels: {
    whatsapp: boolean;
    email: boolean;
  };
  recipients: {
    saranaPhone: string;
    saranaEmail: string;
    officerPhone: string;
    officerEmail: string;
  };
  triggers: {
    findingStatusUpdate: boolean;      // Pembaruan status temuan
    newFollowUpLetter: boolean;        // Surat tindak lanjut baru
    capaSubmissionReceived: boolean;   // Penerimaan tanggapan CAPA
    capaStatusChange: boolean;         // Perubahan status CAPA
    deadlineReminder: boolean;         // Pengingat tenggat waktu
  };
  templates?: Partial<Record<NotificationTriggerEvent, NotificationMessageTemplate>>;
  customNote: string;
  autoDispatch: boolean;
  emailSmtpServer?: string;
  emailSenderEmail?: string;
  emailSenderName?: string;
  waGatewayEndpoint?: string;
}

export interface OfficerUser {
  id: string;
  name: string;
  nip: string;
  position: string;
  phone: string;
  email: string;
  username?: string;
  hasLoginAccount?: boolean;
}

export interface AuthAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'ADMIN' | 'PETUGAS_EVALUATOR' | 'SUPERVISOR';
  nip?: string;
  position?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  createdAt: string;
}

export interface SibergasSurveyData {
  completed: boolean;
  submittedAt: string;
  petugasIdCard: string; // "Ya, Petugas menunjukkan Surat Tugas/ID card" | "Tidak, Petugas tidak menunjukkan Surat Tugas/ID card"
  profesional: string;   // "Ya, Petugas berperilaku sopan" | "Tidak, Petugas berperilaku tidak sopan"
  arogan: string;        // "Ya, Petugas bersikap arogan" | "Tidak, Petugas tidak bersikap arogan"
  gratifikasi: string;   // "Ya, Petugas menerima gratifikasi" | "Tidak, Petugas tidak menerima gratifikasi"
  pemerasan: string;     // "Ya, Petugas melakukan praktik pemerasan" | "Tidak, Petugas tidak melakukan praktik pemerasan"
  simoncerMembantu: string; // "Ya, Membantu" | "Tidak, Tidak Membantu"
  saranaMasukan: string; // Sarana / Masukan masukan teks
}

export interface AuditTrailLog {
  id: string;
  action: string;
  actor: string;
  role: 'Petugas / Evaluator' | 'Petugas' | 'Sarana' | 'Evaluator' | 'Admin' | 'Supervisor' | 'Sistem';
  timestamp: string;
  details: string;
  badgeType?: 'info' | 'success' | 'warning' | 'purple' | 'danger';
}

export type InspectionConclusionCategory = 
  | 'PEMBINAAN'
  | 'CLOSED_AUDIT'
  | 'PERINGATAN'
  | 'PERINGATAN_KERAS'
  | 'PENGHENTIAN_SEMENTARA'
  | 'TINDAK_LANJUT_CAPA'
  | 'LAINNYA';

export interface InspectionSession {
  id: string;
  capaCode: string; // Unique CAPA code, e.g. "CAPA-2026-SRN01"
  facility: {
    name: string;
    type: 
      | 'Industri Farmasi' 
      | 'Pedagang Besar Farmasi (PBF)' 
      | 'Gudang Farmasi Kesehatan'
      | 'Industri Kosmetik Golongan A'
      | 'Industri Kosmetika'
      | 'Sarana Produksi Pangan'
      | 'Industri Pangan Olahan'
      | 'Sarana Distribusi'
      | 'Apotek' 
      | 'Rumah Sakit' 
      | 'Klinik'
      | 'Puskesmas';
    licenseNo: string;
    address: string;
    picName: string;
    picPhone: string;
    picEmail: string;
  };
  inspectionDate: string;
  inspectionStartDate?: string;
  inspectionEndDate?: string;
  inspectionDurationDays?: number;
  leadAuditor: string;
  assignedOfficer?: OfficerUser;
  auditorTeam: string[];
  teamMembers?: OfficerUser[];
  inspectionScope: string;
  conclusionCategory?: InspectionConclusionCategory;
  conclusionCategoryLabel?: string;
  status: InspectionStatus;
  requiresCapa?: boolean; // True jika wajib kirim CAPA (ada temuan), false jika Memenuhi Ketentuan (hanya info WA)
  findings: FindingItem[];
  srikandiLetter: SrikandiLetter;
  sibergasSurvey?: SibergasSurveyData;
  evaluationReport?: EvaluationReport;
  srikandiWorkflow?: SrikandiTteWorkflow;
  notifications: SystemNotification[];
  auditTrail: AuditTrailLog[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'PETUGAS_EVALUATOR' | 'SUPERVISOR' | 'SARANA';
