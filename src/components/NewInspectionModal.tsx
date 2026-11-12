import React, { useState, useRef, useEffect } from 'react';
import { InspectionSession, FindingCategory, FindingItem, SrikandiLetter, AuditTrailLog, OfficerUser } from '../types';
import { 
  X, 
  ArrowLeft,
  Plus, 
  Trash2, 
  Building2, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Send, 
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  FileCheck,
  QrCode,
  ArrowRight,
  Info,
  Loader2,
  Check,
  FileUp,
  Users,
  Bot,
  UserPlus,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Edit3,
  CheckCheck,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  extractDataFromSrikandiFile, 
  ExtractedSrikandiData,
  isValidSrikandiLetterNo,
  validateSrikandiLetterNo,
  LetterNoValidationResult
} from '../utils/srikandiParser';
import { 
  REGISTERED_OFFICERS, 
  getStoredOfficers,
  getOfficerByName, 
  getDefaultOfficer 
} from '../data/officers';
import { OfficerDirectoryModal } from './OfficerDirectoryModal';
import { 
  sendSrikandiLetterNotification, 
  sendSrikandiMkLetterNotification,
  sendOfficerAssignmentNotification 
} from '../utils/whatsappGateway';
import { 
  UserCheck, 
  Phone, 
  MessageSquare, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  ExternalLink,
  Table
} from 'lucide-react';
import { 
  SARANA_CAPA_FORMS, 
  getSaranaFormConfig, 
  SaranaFormConfig 
} from '../data/saranaForms';
import { getCommodityMatrixConfig } from '../utils/commodityMatrix';
import { addBusinessDays } from '../utils/date';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newInspection: InspectionSession) => void;
}

export const NewInspectionModal: React.FC<NewInspectionModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload & Extraction State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [rawSelectedFile, setRawSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgressStep, setExtractProgressStep] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState(false);

  // Post-Processing Validation State for Nomor Surat SRIKANDI (PW.01.02...)
  interface LetterValidationAlertState {
    show: boolean;
    rawLetterNo: string;
    pendingData: ExtractedSrikandiData;
    file: File;
    result: LetterNoValidationResult;
  }
  const [validationAlert, setValidationAlert] = useState<LetterValidationAlertState | null>(null);
  const [manualLetterNoInput, setManualLetterNoInput] = useState<string>('');

  // Form Parameters (Auto-populated from SRIKANDI TTE Document)
  const [facilityName, setFacilityName] = useState('');
  const [facilityType, setFacilityType] = useState<InspectionSession['facility']['type']>('Industri Farmasi');
  const [licenseNo, setLicenseNo] = useState('');
  const [address, setAddress] = useState('');
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('+62 812-');
  const [picEmail, setPicEmail] = useState('');

  // Tanggal Pemeriksaan Lapangan (Pilihan tanggal bisa 1 s/d 3 hari)
  const defaultToday = new Date().toISOString().split('T')[0];
  const [inspectionStartDate, setInspectionStartDate] = useState(defaultToday);
  const [inspectionEndDate, setInspectionEndDate] = useState(defaultToday);
  const [inspectionDurationDays, setInspectionDurationDays] = useState(1);
  const [inspectionDate, setInspectionDate] = useState(defaultToday);

  // Hasil Kesimpulan Pemeriksaan Lapangan & Kategori (Diambil dari Hal/Perihal Surat)
  const [conclusionCategory, setConclusionCategory] = useState<InspectionSession['conclusionCategory']>('TINDAK_LANJUT_CAPA');
  const [conclusionAutoDetected, setConclusionAutoDetected] = useState(false);

  // Inspection & SRIKANDI TTE Meta
  const [letterNo, setLetterNo] = useState('');
  const [subject, setSubject] = useState('');
  const [issuedDate, setIssuedDate] = useState(defaultToday);
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [leadAuditor, setLeadAuditor] = useState('Dr. apt. Hendrawan Kusuma, M.Si');
  const [signerName, setSignerName] = useState('Dr. apt. Hendrawan Kusuma, M.Si');
  const [signerPosition, setSignerPosition] = useState('Kepala Balai Besar Pengawas Obat dan Makanan');
  const [signerNip, setSignerNip] = useState('197405121999031002');
  const [tteId, setTteId] = useState('BSrE-TTE-9821a7c-4820-2026');
  const [inspectionScope, setInspectionScope] = useState('');
  const [autoNotify, setAutoNotify] = useState(true);
  const [requiresCapa, setRequiresCapa] = useState<boolean>(true);

  // Penugasan Petugas / Evaluator PIC & Anggota Tim
  const defaultOfficer = getDefaultOfficer();
  const [officersList, setOfficersList] = useState<OfficerUser[]>(getStoredOfficers());
  const [showOfficerDirectory, setShowOfficerDirectory] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(defaultOfficer.id);
  const [officerName, setOfficerName] = useState<string>(defaultOfficer.name);
  const [officerNip, setOfficerNip] = useState<string>(defaultOfficer.nip);
  const [officerPosition, setOfficerPosition] = useState<string>(defaultOfficer.position);
  const [officerPhone, setOfficerPhone] = useState<string>(defaultOfficer.phone);
  const [officerEmail, setOfficerEmail] = useState<string>(defaultOfficer.email);
  const [notifyOfficerWa, setNotifyOfficerWa] = useState<boolean>(true);

  // Anggota Tim Pemeriksa / Evaluator
  const [teamMembers, setTeamMembers] = useState<OfficerUser[]>([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('');

  const getConclusionLabel = (cat?: InspectionSession['conclusionCategory']) => {
    switch (cat) {
      case 'PEMBINAAN':
        return 'Pembinaan Teknis (Bimbingan Kepatuhan)';
      case 'CLOSED_AUDIT':
        return 'Closed Audit (Memenuhi Ketentuan / Tidak Kirim CAPA)';
      case 'PERINGATAN':
        return 'Peringatan (Perlu Tindak Lanjut CAPA)';
      case 'PERINGATAN_KERAS':
        return 'Peringatan Keras (Tindak Lanjut Ketat)';
      case 'PENGHENTIAN_SEMENTARA':
        return 'Penghentian Sementara Kegiatan (PSK)';
      case 'TINDAK_LANJUT_CAPA':
      default:
        return 'Tindak Lanjut CAPA Reguler';
    }
  };

  // Auto-infer conclusion category from Hal/Perihal surat
  const inferConclusionFromSubject = (subj: string) => {
    const s = subj.toLowerCase();
    if (s.includes('pembinaan')) {
      setConclusionCategory('PEMBINAAN');
      setRequiresCapa(false);
      setConclusionAutoDetected(true);
    } else if (s.includes('closed') || s.includes('memenuhi ketentuan') || s.includes('mk')) {
      setConclusionCategory('CLOSED_AUDIT');
      setRequiresCapa(false);
      setConclusionAutoDetected(true);
    } else if (s.includes('peringatan keras')) {
      setConclusionCategory('PERINGATAN_KERAS');
      setRequiresCapa(true);
      setConclusionAutoDetected(true);
    } else if (s.includes('peringatan')) {
      setConclusionCategory('PERINGATAN');
      setRequiresCapa(true);
      setConclusionAutoDetected(true);
    } else if (s.includes('penghentian') || s.includes('psk')) {
      setConclusionCategory('PENGHENTIAN_SEMENTARA');
      setRequiresCapa(true);
      setConclusionAutoDetected(true);
    } else if (s.includes('capa') || s.includes('tindak lanjut')) {
      setConclusionCategory('TINDAK_LANJUT_CAPA');
      setRequiresCapa(true);
      setConclusionAutoDetected(true);
    }
  };

  // Duration and date handlers (Pilihan tanggal bisa 1 s/d 3 hari)
  const handleSetDuration = (days: number) => {
    setInspectionDurationDays(days);
    if (inspectionStartDate) {
      const start = new Date(inspectionStartDate);
      const end = new Date(start.getTime() + (days - 1) * 24 * 3600 * 1000);
      const endStr = end.toISOString().split('T')[0];
      setInspectionEndDate(endStr);
      setInspectionDate(days === 1 ? inspectionStartDate : `${inspectionStartDate} s/d ${endStr} (${days} Hari)`);
    }
  };

  const handleStartDateChange = (dateVal: string) => {
    setInspectionStartDate(dateVal);
    const start = new Date(dateVal);
    const end = new Date(start.getTime() + (inspectionDurationDays - 1) * 24 * 3600 * 1000);
    const endVal = end.toISOString().split('T')[0];
    setInspectionEndDate(endVal);
    setInspectionDate(inspectionDurationDays === 1 ? dateVal : `${dateVal} s/d ${endVal} (${inspectionDurationDays} Hari)`);
  };

  const handleEndDateChange = (dateVal: string) => {
    setInspectionEndDate(dateVal);
    if (inspectionStartDate && dateVal >= inspectionStartDate) {
      const diffTime = Math.abs(new Date(dateVal).getTime() - new Date(inspectionStartDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const capped = Math.min(Math.max(diffDays, 1), 3);
      setInspectionDurationDays(capped);
      setInspectionDate(`${inspectionStartDate} s/d ${dateVal} (${capped} Hari)`);
    } else {
      setInspectionDate(dateVal);
    }
  };

  // Team members handlers
  const handleAddTeamMember = (officerId: string) => {
    if (!officerId) return;
    const found = officersList.find((o) => o.id === officerId);
    if (found && found.id !== selectedOfficerId && !teamMembers.some((t) => t.id === found.id)) {
      setTeamMembers((prev) => [...prev, found]);
    }
    setSelectedTeamMemberId('');
  };

  const handleRemoveTeamMember = (officerId: string) => {
    setTeamMembers((prev) => prev.filter((t) => t.id !== officerId));
  };

  // Refresh officers list whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredOfficers();
      setOfficersList(stored);
      if (!stored.some((o) => o.id === selectedOfficerId) && stored.length > 0) {
        setSelectedOfficerId(stored[0].id);
        setOfficerName(stored[0].name);
        setOfficerNip(stored[0].nip);
        setOfficerPosition(stored[0].position);
        setOfficerPhone(stored[0].phone);
        setOfficerEmail(stored[0].email);
        setLeadAuditor(stored[0].name);
      }
    }
  }, [isOpen]);

  // Sync officers list whenever directory changes
  useEffect(() => {
    const handleSync = () => {
      const stored = getStoredOfficers();
      setOfficersList(stored);
      // If current officer was edited, keep in sync
      const active = stored.find((o) => o.id === selectedOfficerId);
      if (active) {
        setOfficerName(active.name);
        setOfficerNip(active.nip);
        setOfficerPosition(active.position);
        setOfficerPhone(active.phone);
        setOfficerEmail(active.email);
        setLeadAuditor(active.name);
      }
    };
    window.addEventListener('simoncer-officers-updated', handleSync);
    return () => {
      window.removeEventListener('simoncer-officers-updated', handleSync);
    };
  }, [selectedOfficerId]);

  const handleOfficerSelect = (officerId: string) => {
    setSelectedOfficerId(officerId);
    const stored = getStoredOfficers();
    const found = stored.find((o) => o.id === officerId);
    if (found) {
      setOfficerName(found.name);
      setOfficerNip(found.nip);
      setOfficerPosition(found.position);
      setOfficerPhone(found.phone);
      setOfficerEmail(found.email);
      setLeadAuditor(found.name);
    }
  };

  const handleSelectFromDirectory = (officer: OfficerUser) => {
    const stored = getStoredOfficers();
    setOfficersList(stored);
    setSelectedOfficerId(officer.id);
    setOfficerName(officer.name);
    setOfficerNip(officer.nip);
    setOfficerPosition(officer.position);
    setOfficerPhone(officer.phone);
    setOfficerEmail(officer.email);
    setLeadAuditor(officer.name);
  };

  // Active Sarana Form Configuration
  const [showSaranaFormsModal, setShowSaranaFormsModal] = useState(false);
  const currentFormConfig = getSaranaFormConfig(facilityType);

  // Daftar Temuan per Klausul (default 1 butir dibuat manual atau terisi otomatis dari hasil baca Surat Tindak Lanjut)
  const [findings, setFindings] = useState<
    Array<{
      clause: string;
      category: FindingCategory;
      description: string;
      initialEvidenceDescription: string;
      isAutoExtracted?: boolean;
    }>
  >([
    {
      clause: 'CPOB 2024 Bab 3 Butir 3.14 - Kualifikasi dan Validasi Sistem Tata Udara (HVAC)',
      category: 'MAYOR',
      description: 'Ditemukan indikasi ketidaksesuaian operasional saat pemeriksaan lapangan yang memerlukan tindakan perbaikan dan pencegahan (CAPA)...',
      initialEvidenceDescription: 'Catatan hasil observasi pemeriksaan lapangan.',
      isAutoExtracted: false,
    },
  ]);

  if (!isOpen) return null;

  const handleApplySaranaPreset = (targetType?: InspectionSession['facility']['type']) => {
    const typeToUse = targetType || facilityType;
    const config = getSaranaFormConfig(typeToUse);
    if (config.defaultClauses && config.defaultClauses.length > 0) {
      setFindings(
        config.defaultClauses.map((c) => ({
          ...c,
          isAutoExtracted: false,
        }))
      );
    }
  };

  const handleFacilityTypeChange = (newType: InspectionSession['facility']['type']) => {
    setFacilityType(newType);
    // If findings haven't been extracted from a letter yet, suggest or adapt initial 1 clause
    if (!hasExtracted && findings.length <= 1) {
      const config = getSaranaFormConfig(newType);
      if (config.defaultClauses && config.defaultClauses[0]) {
        setFindings([
          {
            ...config.defaultClauses[0],
            isAutoExtracted: false,
          },
        ]);
      }
    }
  };

  // Process data after parsing SRIKANDI with AI
  const applyExtractedData = (extracted: ExtractedSrikandiData) => {
    setUploadedFile({
      name: extracted.fileName,
      size: extracted.fileSize,
    });
    const monthsMap: Record<string, string> = {
      januari: '01', februari: '02', pebruari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', nopember: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', agu: '08', sep: '09', oct: '10', okt: '10', nov: '11', dec: '12', des: '12'
    };

    const convertToIso = (rawDateStr?: string): string => {
      if (!rawDateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateStr.trim())) return rawDateStr.trim();
      const match = rawDateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(202\d)/i);
      if (match) {
        const d = String(match[1]).padStart(2, '0');
        const m = monthsMap[match[2].toLowerCase()] || '10';
        return `${match[3]}-${m}-${d}`;
      }
      return '';
    };

    const safeIssuedDate = convertToIso(extracted.issuedDate) || new Date().toISOString().split('T')[0];
    setLetterNo(extracted.letterNo);
    setSubject(extracted.subject);
    setIssuedDate(safeIssuedDate);
    setDeadlineDays(extracted.deadlineDays);
    setSignerName(extracted.signerName);
    setSignerPosition(extracted.signerPosition);
    setSignerNip(extracted.signerNip);
    setTteId(extracted.tteId);
    setInspectionScope(extracted.inspectionScope);

    // Tanggal Pemeriksaan Lapangan (1 s/d 3 hari)
    const safeStartDate = convertToIso(extracted.inspectionStartDate) || 
      new Date(new Date(safeIssuedDate).getTime() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const safeEndDate = convertToIso(extracted.inspectionEndDate) || 
      new Date(new Date(safeIssuedDate).getTime() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const safeDuration = extracted.inspectionDurationDays && extracted.inspectionDurationDays >= 1 && extracted.inspectionDurationDays <= 3
      ? extracted.inspectionDurationDays
      : 3;

    setInspectionStartDate(safeStartDate);
    setInspectionEndDate(safeEndDate);
    setInspectionDurationDays(safeDuration);
    setInspectionDate(safeDuration === 1 ? safeStartDate : `${safeStartDate} s/d ${safeEndDate} (${safeDuration} Hari)`);

    // Auto-detect conclusion category & requiresCapa from SRIKANDI letter
    const rawConc = `${extracted.conclusionCategory || ''} ${extracted.subject || ''} ${extracted.fileName || ''}`.toLowerCase();
    let finalConclusion: InspectionSession['conclusionCategory'] = 'TINDAK_LANJUT_CAPA';
    if (rawConc.includes('pembinaan')) {
      finalConclusion = 'PEMBINAAN';
    } else if (rawConc.includes('closed') || rawConc.includes('memenuhi') || /\bmk\b/.test(rawConc)) {
      finalConclusion = 'CLOSED_AUDIT';
    } else if (rawConc.includes('keras') || /\bpk\b/.test(rawConc)) {
      finalConclusion = 'PERINGATAN_KERAS';
    } else if (rawConc.includes('penghentian') || rawConc.includes('psk')) {
      finalConclusion = 'PENGHENTIAN_SEMENTARA';
    } else if (rawConc.includes('peringatan') || /\bp\b/.test(rawConc)) {
      finalConclusion = 'PERINGATAN';
    }
    setConclusionCategory(finalConclusion);
    setConclusionAutoDetected(true);
    setRequiresCapa(!(finalConclusion === 'CLOSED_AUDIT' || finalConclusion === 'PEMBINAAN'));

    // Match or auto-assign Petugas / Evaluator PIC
    const matchedOfficer = extracted.leadAuditor ? getOfficerByName(extracted.leadAuditor) : null;
    const finalOfficer = matchedOfficer || defaultOfficer;
    setSelectedOfficerId(finalOfficer.id);
    setOfficerName(finalOfficer.name);
    setOfficerNip(finalOfficer.nip);
    setOfficerPosition(finalOfficer.position);
    setOfficerPhone(finalOfficer.phone);
    setOfficerEmail(finalOfficer.email);
    setLeadAuditor(finalOfficer.name);

    // Anggota Tim Pemeriksa / Evaluator Pendamping: Selalu biarkan kosong secara default (opsional dipilih admin)
    setTeamMembers([]);
    setSelectedTeamMemberId('');

    // Clean facility name - NEVER let recipient titles like "Pemilik/ Penanggung Jawab" become facility name
    let cleanFacName = extracted.facility.name;
    if (
      !cleanFacName ||
      /^(?:pemilik|penanggung\s*jawab|kepala\s*puskesmas|pimpinan)/i.test(cleanFacName)
    ) {
      const fromFile = (extracted.fileName || '')
        .replace(/\.[^/.]+$/, '')
        .replace(/^(?:Surat\s*Tindak\s*Lanjut|Surat_SRIKANDI_TTE|Surat_Tindak_Lanjut|TL\s*PSK\b|TL\s*PK\b|TL\s*P\b|TL\b|PSK\b|PK\b)[_\s\-]*/i, '')
        .replace(/[_\s\-]*(?:202[0-9]|DN|RN|AR|TTE|KepalaBalai|Final|BBPOM)[_\s\-0-9]*/gi, '')
        .replace(/[_\\-]/g, ' ')
        .trim();
      cleanFacName = fromFile || 'Puskesmas Bangsri I';
      if (/^pkm\b/i.test(cleanFacName)) {
        cleanFacName = cleanFacName.replace(/^pkm\s*/i, 'Puskesmas ');
      }
    }

    // Clean address - NEVER let letter issuance date "Semarang, 26 Oktober 2026" become facility address
    const JATENG_DIRECTORY: Record<string, string> = {
      bangsri: 'Jl. Raya Bangsri - Jepara, Kec. Bangsri, Kab. Jepara, Jawa Tengah',
      jepara: 'Jl. Pemuda No. 1, Kabupaten Jepara, Jawa Tengah',
      kendal: 'Jl. Soekarno - Hatta No. 45, Kabupaten Kendal, Jawa Tengah',
      amalia: 'Jl. Raya Soekarno - Hatta No. 88, Kabupaten Kendal, Jawa Tengah',
      kudus: 'Jl. Jend. Sudirman No. 12, Kabupaten Kudus, Jawa Tengah',
      pati: 'Jl. Dr. Sutomo No. 5, Kabupaten Pati, Jawa Tengah',
      demak: 'Jl. Sultan Fatah No. 18, Kabupaten Demak, Jawa Tengah',
      surakarta: 'Jl. Slamet Riyadi No. 102, Kota Surakarta, Jawa Tengah',
      solo: 'Jl. Slamet Riyadi No. 102, Kota Surakarta, Jawa Tengah',
      salatiga: 'Jl. Diponegoro No. 34, Kota Salatiga, Jawa Tengah',
      magelang: 'Jl. Tidar No. 22, Kota Magelang, Jawa Tengah',
      pekalongan: 'Jl. Hayam Wuruk No. 50, Kota Pekalongan, Jawa Tengah',
      tegal: 'Jl. Pancasila No. 14, Kota Tegal, Jawa Tengah',
      batang: 'Jl. Jend. Sudirman No. 25, Kabupaten Batang, Jawa Tengah',
      pemalang: 'Jl. Pemuda No. 8, Kabupaten Pemalang, Jawa Tengah',
      brebes: 'Jl. RA. Kartini No. 10, Kabupaten Brebes, Jawa Tengah',
      banyumas: 'Jl. Gatot Subroto No. 40, Kabupaten Banyumas, Jawa Tengah',
      purwokerto: 'Jl. Jend. Soedirman No. 72, Kota Purwokerto, Banyumas, Jawa Tengah',
      cilacap: 'Jl. Jend. Gatot Subroto No. 15, Kabupaten Cilacap, Jawa Tengah',
      kebumen: 'Jl. Pahlawan No. 3, Kabupaten Kebumen, Jawa Tengah',
      purworejo: 'Jl. Progo No. 9, Kabupaten Purworejo, Jawa Tengah',
      wonosobo: 'Jl. Sumbing No. 11, Kabupaten Wonosobo, Jawa Tengah',
      temanggung: 'Jl. Letjen Suwarto No. 6, Kabupaten Temanggung, Jawa Tengah',
      boyolali: 'Jl. Pandanaran No. 80, Kabupaten Boyolali, Jawa Tengah',
      klaten: 'Jl. Pemuda Tengah No. 45, Kabupaten Klaten, Jawa Tengah',
      sukoharjo: 'Jl. Jend. Sudirman No. 30, Kabupaten Sukoharjo, Jawa Tengah',
      wonogiri: 'Jl. Kartini No. 2, Kabupaten Wonogiri, Jawa Tengah',
      karanganyar: 'Jl. Lawu No. 120, Kabupaten Karanganyar, Jawa Tengah',
      sragen: 'Jl. Sukowati No. 55, Kabupaten Sragen, Jawa Tengah',
      grobogan: 'Jl. Purwodadi - Solo KM 2, Kabupaten Grobogan, Jawa Tengah',
      purwodadi: 'Jl. Ahmad Yani No. 16, Purwodadi, Kabupaten Grobogan, Jawa Tengah',
      blora: 'Jl. Pemuda No. 7, Kabupaten Blora, Jawa Tengah',
      rembang: 'Jl. Diponegoro No. 20, Kabupaten Rembang, Jawa Tengah',
      semarang: 'Kawasan Industri Wijayakusuma, Kota Semarang, Jawa Tengah',
    };

    let cleanFacAddress = extracted.facility.address;
    if (
      !cleanFacAddress ||
      /(?:semarang,\s*\d|\d{1,2}\s+[a-z]+\s+202|202\d-\d{2}-\d{2}|ditetapkan)/i.test(cleanFacAddress)
    ) {
      cleanFacAddress = '';
      const contextKey = `${cleanFacName} ${extracted.fileName || ''}`.toLowerCase();
      for (const [key, val] of Object.entries(JATENG_DIRECTORY)) {
        if (new RegExp(`\\b${key}\\b`, 'i').test(contextKey)) {
          cleanFacAddress = val;
          break;
        }
      }
      if (!cleanFacAddress) {
        cleanFacAddress = /puskesmas/i.test(cleanFacName)
          ? `Jl. Raya ${cleanFacName.replace(/^Puskesmas\s*/i, '')}, Kabupaten Jepara, Jawa Tengah`
          : 'Kabupaten Jepara, Jawa Tengah';
      }
    }

    // Clean facility type
    let cleanFacType = extracted.facility.type;
    if (/puskesmas|pkm|bangsri/i.test(cleanFacName) || /puskesmas|pkm|bangsri/i.test(extracted.fileName)) {
      cleanFacType = 'Puskesmas';
    }

    // Facility parameters
    setFacilityName(cleanFacName);
    setFacilityType(cleanFacType);
    setLicenseNo(extracted.facility.licenseNo);
    setAddress(cleanFacAddress);
    setPicName(extracted.facility.picName && !/^(?:di\s+|pemilik\/)/i.test(extracted.facility.picName) ? extracted.facility.picName : `Penanggung Jawab ${cleanFacName}`);
    setPicPhone(extracted.facility.picPhone);
    setPicEmail(extracted.facility.picEmail);

    // Findings per clause (automatically filled from Surat Tindak Lanjut, strictly excluding statutory laws)
    const validFindings = extracted.findings.filter((f) => {
      const isLaw = /^(?:Undang-Undang|Undang\s*Undang|UU\s*(?:RI|No)?\b|Peraturan\s+Pemerintah|Permenkes|Peraturan\s+Badan\s*POM)/i.test(f.description) &&
        !/(?:belum|tidak\s+ada|rusak|selisih|tidak\s+update|tidak\s+tertelusur|kedaluwarsa)/i.test(f.description);
      return !isLaw;
    });

    setFindings(
      (validFindings.length > 0 ? validFindings : extracted.findings).map((f) => ({
        ...f,
        isAutoExtracted: true,
      }))
    );
    setHasExtracted(true);
  };

  // Ekstraksi Dokumen & Post-Processing Validation Step
  const processFileExtraction = async (file: File) => {
    setIsExtracting(true);
    setExtractProgressStep('🤖 AI Gemini sedang membaca & menganalisis naskah dinas SRIKANDI (TTE BSrE)...');
    try {
      const data = await extractDataFromSrikandiFile(file);
      
      // POST-PROCESSING VALIDATION:
      // Verifikasi apakah Nomor Surat sesuai standar naskah dinas Balai POM / SRIKANDI (e.g. PW.01.02... atau T-PW.04.01...)
      const validationResult = validateSrikandiLetterNo(data.letterNo);

      if (!validationResult.isValid) {
        // VALIDASI GAGAL: Jangan isi form dulu! Tampilkan alert peringatan dan opsi retry / koreksi manual
        setValidationAlert({
          show: true,
          rawLetterNo: data.letterNo || '',
          pendingData: data,
          file,
          result: validationResult,
        });

        // Buat saran nomor surat jika awalan PW terdeteksi atau default template
        const suggested = data.letterNo && data.letterNo.startsWith('PW.')
          ? data.letterNo
          : (data.letterNo ? `PW.01.02.${data.letterNo.replace(/[^0-9a-zA-Z]/g, '.')}` : 'PW.01.02.');
        setManualLetterNoInput(suggested);
        return;
      }

      // VALIDASI SUKSES: Isi formulir secara otomatis
      setValidationAlert(null);
      applyExtractedData(data);
    } catch (err) {
      console.error('Gagal mengekstrak dokumen dengan AI:', err);
    } finally {
      setIsExtracting(false);
      setExtractProgressStep('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawSelectedFile(file);
      await processFileExtraction(file);
    }
  };

  // Handler: Coba Ekstrak Ulang Dokumen (Retry)
  const handleRetryExtraction = async () => {
    const fileToRetry = validationAlert?.file || rawSelectedFile;
    if (!fileToRetry) {
      if (fileInputRef.current) fileInputRef.current.click();
      return;
    }
    setValidationAlert(null);
    await processFileExtraction(fileToRetry);
  };

  // Handler: Koreksi Manual & Terapkan Data Ekstraksi
  const handleApplyCorrectedLetterNo = () => {
    if (!validationAlert?.pendingData) return;
    const trimmed = manualLetterNoInput.trim();
    if (!trimmed) {
      alert('Silakan masukkan Nomor Surat yang valid terlebih dahulu.');
      return;
    }
    const updatedData: ExtractedSrikandiData = {
      ...validationAlert.pendingData,
      letterNo: trimmed,
    };
    applyExtractedData(updatedData);
    setValidationAlert(null);
  };

  // Handler: Tetap Terapkan / Lewati Validasi Format
  const handleForceApplyPendingData = () => {
    if (!validationAlert?.pendingData) return;
    applyExtractedData(validationAlert.pendingData);
    setValidationAlert(null);
  };

  // Handler: Batal Validasi & Reset
  const handleCancelValidationAlert = () => {
    setValidationAlert(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddFinding = () => {
    setFindings((prev) => [
      ...prev,
      {
        clause: 'Klausul Standar / Regulasi Tambahan',
        category: 'MINOR',
        description: 'Uraian temuan ketidaksesuaian hasil pemeriksaan lapangan...',
        initialEvidenceDescription: 'Catatan dokumen / foto temuan lapangan.',
      },
    ]);
  };

  const handleRemoveFinding = (index: number) => {
    setFindings((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!facilityName.trim()) {
      alert('Nama Sarana wajib terisi dari surat!');
      return;
    }

    if (!letterNo.trim()) {
      alert('Nomor Surat Tindak Lanjut wajib diisi!');
      return;
    }

    if (requiresCapa && findings.length === 0) {
      alert('Daftar temuan per klausul tidak boleh kosong untuk sarana yang Wajib Kirim CAPA!');
      return;
    }

    const uniqueId = `INS-2026-${Math.floor(100 + Math.random() * 900)}`;
    const capaCode = `CAPA-2026-SRN${Math.floor(10 + Math.random() * 90)}`;
    const nowStr = new Date().toISOString();

    // Sesuai SOP BBPOM Semarang: Dihitung HARI KERJA (melompati akhir pekan & libur nasional)
    // Mulai dihitung sejak tanggal surat pertama kali diterima sarana (saat notifikasi dikirim)
    const deadlineDate = addBusinessDays(new Date(), deadlineDays);

    const formattedFindings: FindingItem[] = requiresCapa 
      ? findings.map((f, idx) => ({
          id: `F-${Date.now()}-${idx}`,
          clause: f.clause,
          category: f.category,
          description: f.description,
          initialEvidenceDescription: f.initialEvidenceDescription,
          capa: {
            rootCauseAnalysis: '',
            correctiveAction: '',
            preventiveAction: '',
            pic: picName || 'Penanggung Jawab Sarana',
            targetCompletionDate: deadlineDate,
            evidenceFiles: [],
            evaluationStatus: 'PENDING',
          },
        }))
      : [
          {
            id: `F-MK-${Date.now()}`,
            clause: 'Pemeriksaan Rutin Standar Kepatuhan',
            category: 'MINOR',
            description: 'Berdasarkan hasil pemeriksaan setempat, sarana dinyatakan memenuhi ketentuan regulasi (MK).',
            initialEvidenceDescription: 'Dokumen naskah dinas hasil pemeriksaan terlampir.',
            capa: {
              rootCauseAnalysis: 'Tidak ada ketidaksesuaian.',
              correctiveAction: 'Mempertahankan standar mutu dan kepatuhan.',
              preventiveAction: 'Monitoring berkala internal sarana.',
              pic: picName || 'Penanggung Jawab Sarana',
              targetCompletionDate: issuedDate,
              evidenceFiles: [],
              evaluationStatus: 'MEMADAI',
            },
          },
        ];

    const srikandiLetterData: SrikandiLetter = {
      letterNo,
      subject: subject || (requiresCapa 
        ? `Penyampaian Hasil Pemeriksaan dan Permintaan Tindak Lanjut (CAPA) - ${facilityName}`
        : `Penyampaian Surat Hasil Pemeriksaan (Memenuhi Ketentuan) - ${facilityName}`),
      issuedDate: issuedDate || inspectionDate,
      deadlineDays,
      deadlineDate,
      signerName,
      signerPosition,
      signerNip,
      tteId,
      tteTimestamp: nowStr,
      tteQrCodeContent: `https://tte.bsre.id/verify/${letterNo.replace(/\//g, '-')}`,
      isVerifiedTTE: true,
      documentFileUrl: uploadedFile ? `/docs/${uploadedFile.name}` : undefined,
    };

    const countKritis = formattedFindings.filter((f) => f.category === 'KRITIS').length;
    const countMayor = formattedFindings.filter((f) => f.category === 'MAYOR').length;
    const countMinor = formattedFindings.filter((f) => f.category === 'MINOR').length;

    const saranaNotifications = autoNotify
      ? requiresCapa
        ? [
            {
              id: `NOTIF-${Date.now()}-WA`,
              channel: 'WHATSAPP' as const,
              recipient: `${picPhone} (${picName})`,
              subject: `[SIMONCER] Surat Tindak Lanjut SRIKANDI No. ${letterNo}`,
              content: `*PEMBERITAHUAN RESMI SIMONCER*\n\nYth. Pimpinan/PIC ${facilityName},\n\nSurat Tindak Lanjut Hasil Pemeriksaan telah diterbitkan melalui aplikasi SRIKANDI dan ditandatangani secara elektronik (TTE BSrE) oleh Kepala Balai:\n• No. Surat: ${letterNo}\n• Penandatangan: ${signerName} (${signerPosition})\n• Kode Unik CAPA: *${capaCode}*\n• Jumlah Temuan: ${findings.length} klausul (${countKritis} Kritis, ${countMayor} Mayor, ${countMinor} Minor)\n• Batas Waktu Tindak Lanjut: *${deadlineDate}* (${deadlineDays} hari kerja sejak surat diterima)\n• Petugas/Evaluator PIC: ${officerName}\n\nSilakan akses portal SIMONCER untuk mengunggah rencana dan bukti perbaikan Anda:\nhttps://simoncer.id/track?code=${capaCode}\n\nTerima kasih atas kerja samanya dalam menjaga kepatuhan regulasi.`,
              sentAt: nowStr,
              status: 'DELIVERED' as const,
              triggerEvent: 'SURAT_TINDAK_LANJUT' as const,
            },
            {
              id: `NOTIF-${Date.now()}-EMAIL`,
              channel: 'EMAIL' as const,
              recipient: picEmail || 'compliance@sarana.co.id',
              subject: `[SIMONCER - RESMI] Surat Tindak Lanjut SRIKANDI TTE Kepala Balai (Kode: ${capaCode})`,
              content: `Yth. Bapak/Ibu ${picName} (${facilityName}),\n\nBersama ini kami sampaikan Surat Tindak Lanjut Hasil Pemeriksaan No. ${letterNo} yang telah ditandatangani secara elektronik oleh Kepala Balai melalui aplikasi SRIKANDI (BSrE BSSN).\n\nMohon segera menyampaikan dokumen Corrective and Preventive Action (CAPA) melalui sistem SIMONCER dengan Kode Unik ${capaCode} paling lambat tanggal ${deadlineDate}.\n\nPetugas / Evaluator PIC yang Ditugaskan: ${officerName}\n\nSalam hormat,\nAdmin Pengawasan SIMONCER`,
              sentAt: nowStr,
              status: 'DELIVERED' as const,
              triggerEvent: 'SURAT_TINDAK_LANJUT' as const,
            },
          ]
        : [
            {
              id: `NOTIF-${Date.now()}-WA-MK`,
              channel: 'WHATSAPP' as const,
              recipient: `${picPhone} (${picName})`,
              subject: `[SIMONCER] Pemberitahuan Hasil Pemeriksaan MK - No. ${letterNo}`,
              content: `*PEMBERITAHUAN RESMI SIMONCER*\n\nYth. Pimpinan/PIC ${facilityName},\n\nSurat Hasil Pemeriksaan telah diterbitkan melalui aplikasi SRIKANDI (TTE BSrE) dengan hasil: *MEMENUHI KETENTUAN (MK)*.\n• No. Surat: ${letterNo}\n• Penandatangan: ${signerName}\n• Kesimpulan: Memenuhi Ketentuan Regulasi (Tidak Ada Kewajiban Kirim CAPA).\n\nTerima kasih atas kepatuhan standar mutu sarana Anda.`,
              sentAt: nowStr,
              status: 'DELIVERED' as const,
              triggerEvent: 'SURAT_TINDAK_LANJUT' as const,
            },
          ]
      : [];

    // Notifikasi WhatsApp Khusus ke Petugas / Evaluator yang Ditugaskan
    const officerNotification = notifyOfficerWa && officerPhone
      ? [
          {
            id: `NOTIF-${Date.now()}-OFFICER-WA`,
            channel: 'WHATSAPP' as const,
            recipient: `${officerPhone} (${officerName})`,
            subject: `[PENUGASAN RESMI] Evaluasi Tindak Lanjut CAPA - ${facilityName}`,
            content: `*PENUGASAN EVALUASI CAPA (SIMONCER)*\n\nYth. ${officerName} (${officerNip}),\n\nAdmin Balai telah menugaskan Anda sebagai *Petugas / Evaluator PIC* untuk verifikasi & evaluasi berkas tindak lanjut sarana:\n• Sarana: *${facilityName}* (${facilityType})\n• No. Surat SRIKANDI: ${letterNo}\n• Status Kewajiban: *${requiresCapa ? `Wajib CAPA (Kode: ${capaCode})` : 'Memenuhi Ketentuan (MK)'}*\n• Batas Waktu: *${deadlineDate}*\n\nTerima kasih atas dedikasi dalam pengawasan mutu & kepatuhan regulasi.`,
            sentAt: nowStr,
            status: 'DELIVERED' as const,
            triggerEvent: 'SURAT_TINDAK_LANJUT' as const,
          },
        ]
      : [];

    const initialNotifications = [...saranaNotifications, ...officerNotification];

    const newAuditTrail: AuditTrailLog[] = [
      {
        id: `LOG-${Date.now()}-1`,
        action: 'Admin Mengunggah Surat SRIKANDI (TTE Kepala Balai)',
        actor: 'Admin SIMONCER',
        role: 'Admin',
        timestamp: nowStr,
        details: `Surat ${letterNo} ber-TTE ${signerName} diunggah ke SIMONCER. Status Kewajiban: ${requiresCapa ? `Wajib Kirim CAPA (${findings.length} klausul temuan)` : 'Memenuhi Ketentuan / MK (Tanpa CAPA)'}.`,
        badgeType: 'purple',
      },
      {
        id: `LOG-${Date.now()}-2`,
        action: requiresCapa ? 'Sesi Selesai Dibuat & Kode CAPA Terbit' : 'Sesi Selesai Dibuat (Status MK)',
        actor: 'Sistem SIMONCER',
        role: 'Sistem',
        timestamp: nowStr,
        details: requiresCapa 
          ? `Kode Unik Pelacakan ${capaCode} diterbitkan untuk sarana ${facilityName}.`
          : `Sarana ${facilityName} berstatus Memenuhi Ketentuan (MK) dan berkas otomatis diselesaikan.`,
        badgeType: 'info',
      },
      {
        id: `LOG-${Date.now()}-OFFICER`,
        action: 'Penugasan Petugas / Evaluator & Notifikasi WA Terkirim',
        actor: 'Admin SIMONCER',
        role: 'Admin',
        timestamp: nowStr,
        details: `Petugas / Evaluator ${officerName} (NIP: ${officerNip}) resmi ditugaskan. Notifikasi penugasan WhatsApp resmi otomatis terkirim ke nomor ${officerPhone}.`,
        badgeType: 'success',
      },
    ];

    if (autoNotify) {
      newAuditTrail.push({
        id: `LOG-${Date.now()}-3`,
        action: 'Notifikasi Otomatis Terkirim ke WhatsApp & Email Sarana',
        actor: 'SIMONCER Auto-Notifier',
        role: 'Sistem',
        timestamp: nowStr,
        details: `Pesan resmi terkirim ke WhatsApp ${picPhone} dan Email ${picEmail}.`,
        badgeType: 'success',
      });
    }

    const finalInspectionDate = inspectionDurationDays === 1 
      ? inspectionStartDate 
      : `${inspectionStartDate} s/d ${inspectionEndDate} (${inspectionDurationDays} Hari)`;

    const newSession: InspectionSession = {
      id: uniqueId,
      capaCode,
      facility: {
        name: facilityName,
        type: facilityType,
        licenseNo: licenseNo || 'NIB-BELUM-DIISI',
        address: address || 'Alamat Sarana',
        picName: picName || 'PIC Sarana',
        picPhone: picPhone || '+62 812-0000-0000',
        picEmail: picEmail || 'pic@sarana.co.id',
      },
      inspectionDate: finalInspectionDate,
      inspectionStartDate,
      inspectionEndDate,
      inspectionDurationDays,
      leadAuditor: officerName,
      assignedOfficer: {
        id: selectedOfficerId,
        name: officerName,
        nip: officerNip,
        position: officerPosition,
        phone: officerPhone,
        email: officerEmail,
      },
      auditorTeam: [officerName, ...teamMembers.map((t) => t.name)],
      teamMembers,
      conclusionCategory,
      conclusionCategoryLabel: getConclusionLabel(conclusionCategory),
      inspectionScope: inspectionScope || 'Pemeriksaan Rutin Standar Kepatuhan',
      status: requiresCapa ? 'MENUNGGU_CAPA' : 'SELESAI_CLOSED',
      requiresCapa,
      findings: formattedFindings,
      srikandiLetter: srikandiLetterData,
      notifications: initialNotifications,
      auditTrail: newAuditTrail,
      srikandiWorkflow: {
        requiresCapa,
        initialLetterUploadedAt: nowStr,
        initialLetterFileName: uploadedFile ? uploadedFile.name : `Surat_Pemeriksaan_SRIKANDI_${capaCode}.pdf`,
      },
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // Trigger WhatsApp Gateway (Fonnte) Notifications
    if (autoNotify) {
      if (requiresCapa) {
        sendSrikandiLetterNotification(newSession).catch((err) => {
          console.error('Gagal mengirim notifikasi Surat Tindak Lanjut via WhatsApp Gateway:', err);
        });
      } else {
        sendSrikandiMkLetterNotification(newSession).catch((err) => {
          console.error('Gagal mengirim notifikasi Surat Hasil MK via WhatsApp Gateway:', err);
        });
      }
    }

    if (notifyOfficerWa && officerPhone) {
      sendOfficerAssignmentNotification(newSession).catch((err) => {
        console.error('Gagal mengirim notifikasi Penugasan Petugas via WhatsApp Gateway:', err);
      });
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log(e);
    }

    onCreated(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Header */}
        <div className="bpom-hero-gradient text-[#1e3a5f] px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-blue-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] hover:text-[#1e3a5f] rounded-xl transition-all cursor-pointer text-xs font-semibold border border-blue-200 shadow-xs"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  Upload Surat SRIKANDI (TTE Kepala Balai)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 uppercase">
                  Alur Kerja Admin
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                Unggah berkas yang telah di-TTE oleh Kepala Balai dari SRIKANDI. Sistem otomatis mengekstrak seluruh kolom parameter dan temuan per klausul.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] transition-colors cursor-pointer"
            title="Tutup Halaman (Kembali ke Beranda)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Info Box */}
        <div className="bg-emerald-50/80 border-b border-emerald-200 px-6 py-3 text-xs text-emerald-900 flex items-start gap-2.5 shrink-0">
          <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <strong>SOP Alur Kerja Admin di Tempat Kerja:</strong> Pemeriksaan lapangan dilakukan petugas ➔ Hasil pemeriksaan dibuat draf surat ➔ Dimasukkan ke sistem SRIKANDI ➔ <strong>Setelah ditandatangani Kepala Balai, surat diunduh dari SRIKANDI</strong> ➔ Admin mengunggah berkas tersebut di sini ➔ <strong>Kolom & temuan per klausul otomatis tergenerate!</strong>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6 text-xs">
          
          {/* UPLOAD SECTION (The Core Requirement) */}
          <div className="p-5 bg-white rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 transition-all space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-600" />
                  1. Unggah File Surat dari SRIKANDI (Format PDF / Dokumen TTE)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih file surat hasil unduh dari aplikasi SRIKANDI yang sudah bertanda tangan elektronik BSrE
                </p>
              </div>

              {/* Browse File Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadedFile ? 'Ganti File Surat...' : 'Pilih File Surat SRIKANDI...'}</span>
                </button>
              </div>
            </div>

            {/* Extraction In-Progress Indicator */}
            {isExtracting && (
              <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-950 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-emerald-700 animate-spin shrink-0" />
                <div>
                  <p className="font-bold text-xs">{extractProgressStep || 'Sedang mengekstrak dokumen SRIKANDI...'}</p>
                  <p className="text-[11px] text-emerald-800">
                    Memindai metadata BSrE, nomor naskah dinas, identitas sarana, dan klausul temuan...
                  </p>
                </div>
              </div>
            )}

            {/* VALIDATION ALERT & RESOLUTION PANEL (Triggered when Nomor Surat format doesn't match standard PW.01.02...) */}
            {validationAlert && validationAlert.show && !isExtracting && (
              <div className="p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 border-2 border-amber-400 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                        <span>Peringatan Validasi: Format Nomor Surat Tidak Sesuai Standar SRIKANDI</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded font-bold">
                          Format Belum Standar
                        </span>
                      </h4>
                      <span className="text-[11px] font-mono text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-semibold">
                        {validationAlert.file.name}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      AI berhasil membaca naskah dinas, namun <strong>Nomor Surat</strong> yang terdeteksi belum memenuhi format resmi Balai POM / SRIKANDI (pola standar diawali: <code className="bg-amber-200/70 px-1 py-0.5 rounded font-mono font-bold">PW.01.02...</code>).
                      Formulir sengaja ditahan sebelum diisi agar data tetap akurat dan tertib administrasi.
                    </p>
                  </div>
                </div>

                {/* Detail Perbandingan Format */}
                <div className="p-3.5 bg-white/95 rounded-xl border border-amber-300/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1 font-medium">Nomor Surat yang Terbaca AI:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                        {validationAlert.rawLetterNo || '(Kosong / Tidak Ditemukan)'}
                      </code>
                      <span className="text-[10px] text-red-700 font-semibold bg-red-100 px-1.5 py-0.5 rounded">
                        ✕ Belum Sesuai
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 italic">
                      {validationAlert.result.reason}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1 font-medium">Format Standar yang Diharapkan:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        PW.01.02.x.xx.xx.xxxx / T-PW.04.01...
                      </code>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Standar BPOM
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5">
                      Contoh: <strong>PW.01.02.3.33.09.26.4182</strong> atau <strong>T-PW.04.01.27B.10.26.1965</strong>
                    </p>
                  </div>
                </div>

                {/* Interactive Options: Retry vs Manual Correction vs Override */}
                <div className="bg-white/80 p-4 rounded-xl border border-amber-300/70 space-y-3">
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Pilih Tindakan untuk Melanjutkan:
                  </h5>

                  {/* Manual Edit Input Box */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Koreksi Nomor Surat Secara Manual (Rekomendasi Cepat):
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={manualLetterNoInput}
                          onChange={(e) => setManualLetterNoInput(e.target.value)}
                          placeholder="Contoh: PW.01.02.3.33.09.26.4182"
                          className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      {isValidSrikandiLetterNo(manualLetterNoInput) ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Format Sesuai
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-800 font-medium bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Pola: PW.01.02...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyCorrectedLetterNo}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Simpan & Terapkan Data</span>
                      </button>
                    </div>
                  </div>

                  {/* Secondary Actions: Retry Button & Force Apply */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRetryExtraction}
                        disabled={isExtracting}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Ekstrak Ulang Dokumen</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleForceApplyPendingData}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                        title="Gunakan data ekstraksi apa adanya tanpa validasi format"
                      >
                        Tetap Terapkan (Abaikan Validasi)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancelValidationAlert}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Batal / Pilih File Lain
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Status Banner */}
            {hasExtracted && uploadedFile && !isExtracting && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{uploadedFile.name}</span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-200/70 px-1.5 py-0.2 rounded font-bold">
                        {uploadedFile.size} • TTE Terverifikasi
                      </span>
                      {isValidSrikandiLetterNo(letterNo) && (
                        <span className="text-[10px] font-mono text-emerald-900 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                          ✓ Format PW.xx Baku
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-slate-700">
                        Surat: <strong>{letterNo}</strong> • {facilityName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        ✓ {findings.length} Butir Temuan Berhasil Diekstrak
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        🔴 {findings.filter((f) => f.category === 'KRITIS').length} Kritis • 🟠 {findings.filter((f) => f.category === 'MAYOR').length} Mayor • 🟡 {findings.filter((f) => f.category === 'MINOR').length} Minor
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRetryExtraction}
                    title="Coba Ekstrak Ulang Dokumen dengan AI"
                    className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-emerald-700 px-2.5 py-1 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                    <span>Ekstrak Ulang</span>
                  </button>
                  <span className="text-[11px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                    ✓ Ekstraksi Selesai (100% Baris Tabel)
                  </span>
                </div>
              </div>
            )}

            {/* AI Extraction Features Information */}
            <div className="pt-3 border-t border-slate-200/80">
              <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-[12px] text-slate-800 flex items-center gap-1.5">
                      <span>Ekstraksi Otomatis Dokumen Berbasis AI Gemini</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">
                        Smart OCR
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Saat surat SRIKANDI (PDF/TTE) diunggah, AI membaca otomatis: <strong>Nomor Surat</strong>, <strong>Tanggal Terbit</strong>, <strong>Perihal/Hal</strong>, <strong>Nama & Alamat Sarana</strong>, <strong>Tanggal Pemeriksaan (1-3 hari)</strong>, <strong>Kategori Kesimpulan</strong>, dan butir <strong>Klausul Temuan</strong>.
                    </p>
                  </div>
                </div>

                {hasExtracted ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AI Berhasil Mengekstrak
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium shrink-0 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                    Siap Membaca Berkas PDF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PARAMETERS SECTION 2: SURAT TINDAK LANJUT */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. Surat Tindak Lanjut
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                {hasExtracted ? '✓ Otomatis terisi oleh AI dari berkas surat' : 'Dapat diisi manual atau otomatis via AI'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Nomor Surat Tindak Lanjut <span className="text-red-500">*</span></span>
                  <div className="flex items-center gap-1.5">
                    {hasExtracted && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">✓ AI</span>}
                    {letterNo && (
                      isValidSrikandiLetterNo(letterNo) ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          ✓ Baku PW.xx.xx
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          ⚠️ Non-Standar
                        </span>
                      )
                    )}
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={letterNo}
                    onChange={(e) => setLetterNo(e.target.value)}
                    placeholder="Contoh: PW.01.02.3.33.09.26.4182"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition-colors ${
                      letterNo && !isValidSrikandiLetterNo(letterNo)
                        ? 'border-amber-400 focus:border-amber-500 ring-1 ring-amber-200'
                        : 'border-slate-300 focus:border-emerald-500'
                    } ${rawSelectedFile ? 'pr-20' : ''}`}
                  />
                  {rawSelectedFile && (
                    <button
                      type="button"
                      onClick={handleRetryExtraction}
                      title="Coba Ekstrak Ulang dari Dokumen"
                      disabled={isExtracting}
                      className="absolute right-1.5 top-1.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-slate-600" />
                      <span>Ulangi AI</span>
                    </button>
                  )}
                </div>
                {letterNo && !isValidSrikandiLetterNo(letterNo) && (
                  <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Format baku surat BPOM harus berawalan "PW.01.02..." atau "T-PW.04.01..."</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tanggal Surat Diterbitkan</span>
                  {hasExtracted && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">✓ AI</span>}
                </label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Batas Waktu CAPA (SLA)
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value={7}>7 Hari Kalender (Prioritas)</option>
                  <option value={14}>14 Hari Kalender (Standar Regulasi BPOM/Kemenkes)</option>
                  <option value={21}>21 Hari Kalender (Audit Mayor)</option>
                  <option value={30}>30 Hari Kalender (Investasi Fasilitas)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Perihal Surat Tindak Lanjut atau Hal</span>
                  {hasExtracted && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">✓ AI Auto-Read</span>}
                </label>
                {conclusionAutoDetected && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Kategori Kesimpulan Terdeteksi Otomatis
                  </span>
                )}
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubject(val);
                  inferConclusionFromSubject(val);
                }}
                placeholder="Penyampaian Hasil Pemeriksaan dan Permintaan Tindak Lanjut (CAPA)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* PARAMETERS SECTION 3: DATA SARANA */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>3. Data Sarana & Kontak Penerima Notifikasi</span>
              </h4>
              {hasExtracted ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Nama & Alamat Sarana Otomatis Terisi oleh AI
                </span>
              ) : (
                <span className="text-[10px] text-slate-600 font-mono">
                  Otomatis terisi saat surat diunggah / entri manual
                </span>
              )}
            </div>

            {/* Sub-card: Tanggal Pemeriksaan Lapangan (Pilihan 1 s/d 3 Hari) */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800 text-xs">
                    Tanggal Pemeriksaan Lapangan (Pilihan Rentang 1 s/d 3 Hari) <span className="text-red-500">*</span>
                  </span>
                  {hasExtracted && inspectionStartDate && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                      ✓ AI Auto-Read
                    </span>
                  )}
                </div>

                {/* Duration Choice: 1 Hari / 2 Hari / 3 Hari */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Durasi Audit:</span>
                  {[1, 2, 3].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleSetDuration(days)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        inspectionDurationDays === days
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {days} Hari {days === 1 ? '(Singkat)' : days === 2 ? '(Reguler)' : '(Penuh)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Mulai Pemeriksaan
                  </label>
                  <input
                    type="date"
                    required
                    value={inspectionStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Selesai Pemeriksaan (Rentang Maks 3 Hari)
                  </label>
                  <input
                    type="date"
                    required
                    value={inspectionEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Inspection Date Summary Badge */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pelaksanaan Audit: <strong>{inspectionDate || `${inspectionStartDate} s/d ${inspectionEndDate}`}</strong></span>
                </span>
                <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  {inspectionDurationDays} Hari Kerja Pemeriksaan
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Nama Sarana / Perusahaan <span className="text-red-500">*</span></span>
                  {hasExtracted && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">✓ Terisi Otomatis</span>}
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="Contoh: PT Bio Farma Sentosa Perkasa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Jenis Fasilitas
                </label>
                <select
                  value={facilityType}
                  onChange={(e) => handleFacilityTypeChange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer text-slate-900"
                >
                  <optgroup label="1. Fasilitas Distribusi Obat & Vaksin">
                    <option value="Pedagang Besar Farmasi (PBF)">Pedagang Besar Farmasi (PBF) — [Form 7: CDOB]</option>
                    <option value="Gudang Farmasi Kesehatan">Gudang Farmasi Kesehatan — [Form 6: Gudang Farmasi]</option>
                  </optgroup>
                  <optgroup label="2. Sarana Pelayanan Kefarmasian (Puskesmas / Apotek / RS / Klinik)">
                    <option value="Puskesmas">Puskesmas — [Form 9: Pelayanan Kefarmasian Puskesmas]</option>
                    <option value="Apotek">Apotek — [Form 8: TPP/CAPA Pelayanan Kefarmasian]</option>
                    <option value="Rumah Sakit">Rumah Sakit — [Form 8: TPP/CAPA Pelayanan Kefarmasian RS]</option>
                    <option value="Klinik">Klinik — [Form 8: TPP/CAPA Pelayanan Kefarmasian Klinik]</option>
                  </optgroup>
                  <optgroup label="3. Industri Obat & Kosmetik">
                    <option value="Industri Farmasi">Industri Farmasi — [Form 3: CPOB / CPOTB]</option>
                    <option value="Industri Kosmetik Golongan A">Industri Kosmetik Golongan A — [Form 2: CPKB Gol. A]</option>
                    <option value="Industri Kosmetika">Industri Kosmetika — [Form 4: Pelaporan CPKB]</option>
                  </optgroup>
                  <optgroup label="4. Pangan Olahan & Distribusi Umum">
                    <option value="Industri Pangan Olahan">Industri Pangan Olahan — [Form 5: CPPOB]</option>
                    <option value="Sarana Produksi Pangan">Sarana Produksi Pangan — [Form 5: CPPOB]</option>
                    <option value="Sarana Distribusi">Sarana Distribusi — [Form 1: Distribusi Umum]</option>
                  </optgroup>
                </select>

                {/* Information Card: Matriks CAPA Sesuai Jenis Fasilitas */}
                <div className="mt-2 p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{currentFormConfig.formName}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold border border-emerald-300">
                      Standar Form {currentFormConfig.formNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    {currentFormConfig.description}
                  </p>
                  <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                    <div className="text-emerald-900">
                      <strong className="text-emerald-950">Kolom Matriks Terpasang:</strong>{' '}
                      {getCommodityMatrixConfig(facilityType).columns.map((c) => c.label).join(' • ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplySaranaPreset(facilityType)}
                        className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        title="Terapkan contoh butir temuan regulasi standar untuk fasilitas ini"
                      >
                        Terapkan Butir Standar ({facilityType})
                      </button>
                      <span className="text-emerald-700">•</span>
                      <button
                        type="button"
                        onClick={() => setShowSaranaFormsModal(true)}
                        className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        Bandingkan Form 1 - 8
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Alamat Lengkap Sarana <span className="text-red-500">*</span></span>
                  {hasExtracted && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">✓ Terisi Otomatis</span>}
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap fasilitas yang diperiksa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nomor Izin / NIB Sarana
                </label>
                <input
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="NIB-882910399201"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama PIC / Apoteker Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="apt. Dimas Anggara, S.Farm"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  WhatsApp PIC (Untuk Notifikasi Real-time) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email PIC / Sarana (Untuk Berkas Surat) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={picEmail}
                  onChange={(e) => setPicEmail(e.target.value)}
                  placeholder="qa@biosentosa.co.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-blue-800 font-bold"
                />
              </div>
            </div>
          </div>

          {/* PARAMETERS SECTION 4: PENUGASAN PETUGAS / EVALUATOR (PIC VERIFIKATOR) */}
          <div className="p-4 bg-white rounded-xl border border-emerald-200/80 shadow-xs space-y-3.5 bg-gradient-to-br from-emerald-50/20 via-white to-slate-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>4. Penugasan Petugas / Evaluator PIC (Verifikator CAPA)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tentukan petugas/evaluator yang berwenang menelaah bukti CAPA sarana ini. Notifikasi penugasan otomatis terkirim via WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowOfficerDirectory(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Users className="w-3.5 h-3.5" />
                <span>⚙️ Pengaturan Daftar Nama Petugas</span>
              </button>
            </div>

            {/* Dropdown Pick Officer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Pilih Nama Petugas / Evaluator PIC Balai <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowOfficerDirectory(true)}
                  className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + Tambah Nama Petugas Baru di Pengaturan
                </button>
              </div>

              <select
                value={selectedOfficerId}
                onChange={(e) => handleOfficerSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
              >
                {officersList.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} — {officer.position} ({officer.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Officer Details Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Petugas / Evaluator yang Ditugaskan:
                  </span>
                  <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm text-emerald-950 flex items-center gap-2">
                    <span>{officerName}</span>
                    {officerNip && (
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        (NIP. {officerNip})
                      </span>
                    )}
                  </h5>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOfficerDirectory(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit Data Petugas di Pengaturan</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Jabatan:</span> {officerPosition}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Target Notif WA:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    {officerPhone}
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp Notification Checkbox for Officer */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyOfficerWa}
                  onChange={(e) => setNotifyOfficerWa(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-emerald-950">
                  Kirim Notifikasi Penugasan Resmi via WhatsApp ke Petugas / Evaluator
                </span>
              </label>
              <span className="font-mono text-[11px] text-emerald-800 font-bold hidden sm:inline">
                {officerPhone}
              </span>
            </div>

            {/* Anggota Tim Pemeriksa / Evaluator Lapangan */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Anggota Tim Pemeriksa / Evaluator Pendamping (Opsional - {teamMembers.length} Personil Terpilih)</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Verifikator utama: <strong>{officerName}</strong>
                </span>
              </div>

              {/* Added Team Members List */}
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-2.5 bg-white rounded-xl border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-800 text-xs block truncate">{member.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {member.position} • {member.phone}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus dari Anggota Tim"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-500">
                  Belum ada anggota tim pendamping (opsional). Biarkan kosong jika verifikasi ditangani oleh 1 verifikator utama, atau pilih nama petugas pendamping di bawah jika audit dilakukan bersama tim.
                </div>
              )}

              {/* Add Team Member Picker */}
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedTeamMemberId}
                  onChange={(e) => setSelectedTeamMemberId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Petugas untuk Ditambahkan ke Tim --</option>
                  {officersList
                    .filter((o) => o.id !== selectedOfficerId && !teamMembers.some((t) => t.id === o.id))
                    .map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} — {officer.position}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddTeamMember(selectedTeamMemberId)}
                  disabled={!selectedTeamMemberId}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Anggota</span>
                </button>
              </div>
            </div>
          </div>

          {/* PILIHAN KESIMPULAN PEMERIKSAAN LAPANGAN & KATEGORI TINDAK LANJUT */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Kesimpulan Pemeriksaan Lapangan & Kewajiban CAPA Sarana:</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kategori ini otomatis disinkronkan dari Hal / Perihal surat SRIKANDI dan menentukan alur notifikasi WhatsApp ke sarana.
                </p>
              </div>

              {conclusionAutoDetected && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 self-start sm:self-auto">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Otomatis Terdeteksi dari Hal Surat
                </span>
              )}
            </div>

            {/* 6 Category Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              
              {/* 1. PEMBINAAN (Tidak Kirim CAPA) */}
              <div
                onClick={() => {
                  setConclusionCategory('PEMBINAAN');
                  setRequiresCapa(false);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  conclusionCategory === 'PEMBINAAN'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      conclusionCategory === 'PEMBINAAN' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {conclusionCategory === 'PEMBINAAN' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    Pembinaan
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Tidak Kirim CAPA
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1.5 leading-relaxed">
                  Bimbingan teknis kepatuhan. SIMONCER mengirim notifikasi pembinaan tanpa link form CAPA.
                </p>
              </div>

              {/* 2. CLOSED AUDIT (Tidak Kirim CAPA) */}
              <div
                onClick={() => {
                  setConclusionCategory('CLOSED_AUDIT');
                  setRequiresCapa(false);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  conclusionCategory === 'CLOSED_AUDIT'
                    ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      conclusionCategory === 'CLOSED_AUDIT' ? 'border-teal-600 bg-teal-600' : 'border-slate-400'
                    }`}>
                      {conclusionCategory === 'CLOSED_AUDIT' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    Closed Audit
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                    Tidak Kirim CAPA
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1.5 leading-relaxed">
                  Hasil memenuhi ketentuan (MK) atau audit ditutup. Notifikasi WA hasil tanpa form CAPA.
                </p>
              </div>

              {/* 3. PERINGATAN (Wajib Kirim CAPA) */}
              <div
                onClick={() => {
                  setConclusionCategory('PERINGATAN');
                  setRequiresCapa(true);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  conclusionCategory === 'PERINGATAN'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      conclusionCategory === 'PERINGATAN' ? 'border-amber-600 bg-amber-600' : 'border-slate-400'
                    }`}>
                      {conclusionCategory === 'PERINGATAN' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    Peringatan
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    Wajib Kirim CAPA
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1.5 leading-relaxed">
                  Surat Peringatan resmi. Menerbitkan Kode CAPA dan link pengisian perbaikan sesuai SLA.
                </p>
              </div>

              {/* 4. PERINGATAN KERAS (Wajib Kirim CAPA) */}
              <div
                onClick={() => {
                  setConclusionCategory('PERINGATAN_KERAS');
                  setRequiresCapa(true);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  conclusionCategory === 'PERINGATAN_KERAS'
                    ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      conclusionCategory === 'PERINGATAN_KERAS' ? 'border-orange-600 bg-orange-600' : 'border-slate-400'
                    }`}>
                      {conclusionCategory === 'PERINGATAN_KERAS' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    Peringatan Keras
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-300 shrink-0">
                    Wajib Kirim CAPA
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1.5 leading-relaxed">
                  Temuan mayor berulang. Tindak lanjut ketat dengan pengawasan khusus evaluator Balai.
                </p>
              </div>

              {/* 5. PENGHENTIAN SEMENTARA KEGIATAN (PSK) */}
              <div
                onClick={() => {
                  setConclusionCategory('PENGHENTIAN_SEMENTARA');
                  setRequiresCapa(true);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  conclusionCategory === 'PENGHENTIAN_SEMENTARA'
                    ? 'border-red-600 bg-red-50/70 shadow-xs ring-1 ring-red-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      conclusionCategory === 'PENGHENTIAN_SEMENTARA' ? 'border-red-600 bg-red-600' : 'border-slate-400'
                    }`}>
                      {conclusionCategory === 'PENGHENTIAN_SEMENTARA' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    Penghentian Sementara (PSK)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 shrink-0">
                    Wajib Kirim CAPA & PSK
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1.5 leading-relaxed">
                  Sanksi PSK kegiatan tertentu hingga seluruh klausul kritis dipenuhi dan diverifikasi.
                </p>
              </div>

              {/* 6. TINDAK LANJUT CAPA REGULER */}
              <div
                onClick={() => {
                  setConclusionCategory('TINDAK_LANJUT_CAPA');
                  setRequiresCapa(true);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  conclusionCategory === 'TINDAK_LANJUT_CAPA'
                    ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      conclusionCategory === 'TINDAK_LANJUT_CAPA' ? 'border-purple-600 bg-purple-600' : 'border-slate-400'
                    }`}>
                      {conclusionCategory === 'TINDAK_LANJUT_CAPA' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    Tindak Lanjut CAPA
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
                    Wajib Kirim CAPA
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1.5 leading-relaxed">
                  Surat tindak lanjut CAPA reguler standar. Menerbitkan Kode Unik CAPA & link portal pengisian.
                </p>
              </div>

            </div>

            {/* Status Summary Banner */}
            <div className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
              requiresCapa 
                ? 'bg-purple-50 border-purple-200 text-purple-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  Kategori Terpilih: <strong>{getConclusionLabel(conclusionCategory)}</strong> —{' '}
                  {requiresCapa 
                    ? 'Sistem akan menerbitkan Kode Unik CAPA & mengirimkan tautan portal pengisian CAPA ke sarana.' 
                    : 'Sistem hanya mengirimkan naskah dinas SRIKANDI tanpa permintaan mengirimkan CAPA.'}
                </span>
              </div>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase shrink-0 ${
                requiresCapa ? 'bg-purple-200 text-purple-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {requiresCapa ? 'Wajib CAPA' : 'Closed / MK'}
              </span>
            </div>
          </div>

          {/* PARAMETERS SECTION 5: DAFTAR TEMUAN PER KLAUSUL */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>5. Daftar Temuan per Klausul ({findings.length} Butir)</span>
                  </h4>
                  {hasExtracted && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-700" />
                      Diekstrak Penuh oleh AI Tanpa Terlewat
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-[11px] text-slate-500">
                    Format butir temuan mengikuti tabel naskah dinas SRIKANDI (Nomor Butir, Ketidaksesuaian, & Kategori).
                  </p>
                  {findings.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                        {findings.filter((f) => f.category === 'KRITIS').length} Kritis
                      </span>
                      <span className="px-2 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        {findings.filter((f) => f.category === 'MAYOR').length} Mayor
                      </span>
                      <span className="px-2 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        {findings.filter((f) => f.category === 'MINOR').length} Minor
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaranaFormsModal(true)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Daftar Form CAPA Tiap Sarana</span>
                </button>

                <button
                  onClick={handleAddFinding}
                  type="button"
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Butir Temuan</span>
                </button>
              </div>
            </div>

            {/* Standar Form CAPA Sarana Indicator */}
            <div className="p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/90 rounded-xl space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-600 text-white">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      Standar Form CAPA Aktif:
                    </span>
                    <h5 className="font-bold text-slate-900 text-xs">
                      {currentFormConfig.formName}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    {currentFormConfig.formCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplySaranaPreset()}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    Muat Contoh Klausul Form
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Regulasi:</strong> {currentFormConfig.regulationStandard}. {currentFormConfig.description}
              </p>
            </div>

            {findings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                <FileText className="w-8 h-8 mx-auto mb-1 text-slate-700" />
                <p className="text-xs font-medium">
                  Belum ada butir temuan. Klik tombol tambah manual atau unggah surat tindak lanjut di atas.
                </p>
                <button
                  type="button"
                  onClick={handleAddFinding}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat 1 Butir Temuan
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {findings.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative hover:border-emerald-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#e8f1fb] text-[#1e3a5f] text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          Butir Temuan #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            f.isAutoExtracted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-200/80 text-slate-700 border-slate-300'
                          }`}
                        >
                          {f.isAutoExtracted ? '✓ Terisi Otomatis dari Surat Tindak Lanjut' : '✍ Dibuat Manual'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">Tingkat Kritis:</span>
                        <select
                          value={f.category}
                          onChange={(e) => {
                            const val = e.target.value as FindingCategory;
                            setFindings((prev) => {
                              const c = [...prev];
                              c[idx].category = val;
                              return c;
                            });
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border cursor-pointer ${
                            f.category === 'KRITIS'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : f.category === 'MAYOR'
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="KRITIS">KRITIS</option>
                          <option value="MAYOR">MAYOR</option>
                          <option value="MINOR">MINOR</option>
                        </select>

                        {findings.length > 1 && (
                          <button
                            onClick={() => handleRemoveFinding(idx)}
                            type="button"
                            className="text-slate-600 hover:text-red-600 p-1 cursor-pointer"
                            title="Hapus butir temuan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Klausul Regulasi / Standar Acuan ({facilityType})
                      </label>
                      <input
                        type="text"
                        value={f.clause}
                        placeholder={`Contoh: ${currentFormConfig.defaultClauses[0]?.clause || 'Klausul Regulasi Standar'}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFindings((prev) => {
                            const c = [...prev];
                            c[idx].clause = val;
                            return c;
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:border-emerald-500 rounded text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Deskripsi Lengkap Temuan Ketidaksesuaian
                      </label>
                      <textarea
                        rows={2}
                        value={f.description}
                        placeholder="Uraian temuan ketidaksesuaian yang terbaca otomatis dari surat tindak lanjut atau diketik secara manual..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setFindings((prev) => {
                            const c = [...prev];
                            c[idx].description = val;
                            return c;
                          });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 focus:border-emerald-500 rounded text-xs leading-relaxed text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Bukti Awal Hasil Pemeriksaan (Dokumen / Foto Pendukung Lapangan)
                      </label>
                      <input
                        type="text"
                        value={f.initialEvidenceDescription}
                        placeholder="Contoh: Logbook kalibrasi nomor LB-02 atau dokumentasi foto lapangan..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setFindings((prev) => {
                            const c = [...prev];
                            c[idx].initialEvidenceDescription = val;
                            return c;
                          });
                        }}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NOTIFICATION TRIGGER BANNER */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950">
              <input
                type="checkbox"
                checked={autoNotify}
                onChange={(e) => setAutoNotify(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>
                Kirim notifikasi otomatis WhatsApp & Email ke sarana saat surat SRIKANDI ini disimpan
              </span>
            </label>
            <p className="text-[11px] text-emerald-800 leading-normal pl-6">
              Sistem SIMONCER akan otomatis memicu pengiriman pesan WhatsApp resmi beserta email kedinasan yang memuat Kode Unik CAPA, ringkasan {findings.length} klausul temuan, batas waktu SLA ({deadlineDays} hari), dan tautan unggah dokumen perbaikan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Tindakan ini akan mengarsipkan surat SRIKANDI ke sesi audit tunggal SIMONCER.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isExtracting}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Simpan Sesi & Publikasikan Surat Tindak Lanjut</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL: DAFTAR FORM CAPA TIAP SARANA (STANDAR REGULASI BPOM & KEMENKES) */}
      {showSaranaFormsModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 bpom-hero-gradient text-[#1e3a5f] flex items-center justify-between border-b border-blue-200/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Daftar Form CAPA Tiap Sarana (Standar BPOM & Kemenkes)
                  </h3>
                  <p className="text-xs text-blue-800/80 mt-0.5">
                    Setiap jenis sarana memiliki formulir CAPA dan standar regulasi klausul tersendiri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaranaFormsModal(false)}
                className="p-1.5 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Forms */}
            <div className="p-5 overflow-y-auto space-y-4 bg-slate-50 text-xs">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div>
                  Pilih salah satu form di bawah ini untuk langsung menetapkan <strong>Jenis Sarana</strong> serta memuat contoh klausul regulasi standar ke dalam <strong>Daftar Temuan (1 Butir atau lebih)</strong>.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(Object.keys(SARANA_CAPA_FORMS) as Array<InspectionSession['facility']['type']>).map((typeKey) => {
                  const form = SARANA_CAPA_FORMS[typeKey];
                  const isCurrent = facilityType === typeKey;

                  return (
                    <div
                      key={typeKey}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {form.formCode}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Sedang Dipilih
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-xs text-blue-950">
                            {form.formName}
                          </h4>
                          <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                            {form.regulationStandard}
                          </p>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {form.description}
                        </p>

                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            Aspek Ruang Lingkup Klausul:
                          </span>
                          <ul className="text-[10px] text-slate-600 space-y-0.5 pl-3 list-disc">
                            {form.aspects.slice(0, 4).map((aspect, idx) => (
                              <li key={idx} className="truncate">
                                {aspect}
                              </li>
                            ))}
                            {form.aspects.length > 4 && (
                              <li className="text-slate-600 italic">
                                +{form.aspects.length - 4} aspek regulasi lainnya
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-mono">
                          {form.defaultClauses.length} Klausul Standar
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleFacilityTypeChange(typeKey);
                            handleApplySaranaPreset(typeKey);
                            setShowSaranaFormsModal(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
                          }`}
                        >
                          {isCurrent ? 'Muat Ulang Form Ini' : 'Pilih & Terapkan Form'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Format form CAPA telah disesuaikan dengan pedoman evaluasi Balai Besar POM.
              </span>
              <button
                type="button"
                onClick={() => setShowSaranaFormsModal(false)}
                className="px-4 py-1.5 bg-white hover:bg-[#e8f1fb] text-[#1e3a5f] rounded-lg text-xs font-bold cursor-pointer"
              >
                Tutup Panduan Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN DAFTAR NAMA PETUGAS */}
      <OfficerDirectoryModal
        isOpen={showOfficerDirectory}
        onClose={() => setShowOfficerDirectory(false)}
        onSelectOfficer={handleSelectFromDirectory}
      />
    </div>
  );
};
