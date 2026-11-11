import { FindingItem, InspectionSession } from '../types';

export type CommodityType = 
  | 'PBF_CDOB'            // 1. Pedagang Besar Farmasi (CDOB) - Form 7
  | 'GUDANG_FARMASI'      // 2. Gudang Farmasi Kesehatan (CDOB) - Form 6
  | 'CPOB_CPOTB'          // 3. Sarana CPOTB / CPOB (Obat / Obat Tradisional) - Form 3
  | 'KOSMETIK_A'          // 4. Industri Kosmetik Golongan A - Form 2
  | 'KOSMETIKA'           // 5. Industri Kosmetika (Pelaporan Umum CPKB) - Form 4
  | 'PANGAN_PRODUKSI'     // 6. Sarana Produksi Pangan (CPPOB) - Form 5
  | 'DISTRIBUSI'          // 7. Sarana Distribusi - Form 1
  | 'PELAYANAN_KEFARMASIAN'; // 8. Sarana Pelayanan Kefarmasian (Apotek / Klinik / RS - TPP/CAPA) - Form 8

export interface CommodityMatrixColumn {
  id: string;
  label: string;
  subColumns?: { id: string; label: string }[];
  width?: string;
  description?: string;
}

export interface CommodityMatrixConfig {
  id: CommodityType;
  title: string;
  codeStandard: string;
  facilityTypeLabel: string;
  headerFields: { label: string; valueKey: string }[];
  columns: CommodityMatrixColumn[];
  notes: string[];
  signatureLeft: string;
  signatureRight: string;
  sampleGuidance: string;
}

export const COMMODITY_CONFIGS: Record<CommodityType, CommodityMatrixConfig> = {
  // 1. PEDAGANG BESAR FARMASI (CDOB) - Sesuai Lampiran PDF Halaman 7
  PBF_CDOB: {
    id: 'PBF_CDOB',
    title: 'MATRIKS CAPA PEDAGANG BESAR FARMASI (PBF)',
    codeStandard: 'Standar CDOB (Cara Distribusi Obat yang Baik)',
    facilityTypeLabel: 'Pedagang Besar Farmasi (PBF)',
    headerFields: [
      { label: 'Nama Pedagang Besar Farmasi', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Pemeriksaan', valueKey: 'inspectionScope' },
      { label: 'Tanggal Pemeriksaan', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No.', width: 'w-10' },
      { id: 'finding', label: 'Temuan', width: 'w-64' },
      { id: 'requirement', label: 'Persyaratan', width: 'w-48', description: 'Persyaratan CDOB dan kebijakan mutu perusahaan' },
      { id: 'rootCause', label: 'Root Cause Analysis', width: 'w-48', description: 'Akar penyebab ketidaksesuaian/GAP' },
      { 
        id: 'capa', 
        label: 'CAPA', 
        subColumns: [
          { id: 'ca', label: 'CA (Tindakan Perbaikan)' },
          { id: 'pa', label: 'PA (Tindakan Pencegahan)' }
        ],
        width: 'w-72'
      },
      { id: 'deadlineStatus', label: 'Batas Waktu Penyelesaian – Status', width: 'w-36', description: 'Reasonable, "sudah selesai" / "dalam proses"' },
      { id: 'pic', label: 'Penanggung Jawab', width: 'w-36', description: 'Personil penanggung jawab implementasi' },
      { id: 'evidence', label: 'Bukti Perbaikan', width: 'w-40', description: 'Nomor dokumen bukti / change control' },
    ],
    notes: [
      '1. Diisi identitas PBF dan hal terkait pemeriksaan.',
      '2. Diisi temuan sesuai dengan Surat Tindak Lanjut Hasil Pemeriksaan.',
      '3. Diisi persyaratan CDOB dan persyaratan lain termasuk persyaratan internal misal kebijakan mutu perusahaan, prosedur tetap.',
      '4. Diisi akar penyebab dari ketidaksesuaian yang terjadi atau penyebab adanya GAP antara persyaratan dengan kondisi saat ini di PBF.',
      '5. CAPA perlu dijelaskan secara terperinci langkah-langkah tindakan perbaikan (CA) dan tindakan pencegahan (PA). Jika tidak ada tindakan pencegahan, jelaskan justifikasinya.',
      '6. Batas waktu penyelesaian yang reasonable dan diisi untuk tiap langkah.',
      '7. Status diisi dengan "sudah selesai" atau "dalam proses".',
      '8. Diisi personil yang bertanggung jawab atas implementasi CAPA yang dilakukan.',
      '9. Diisi dengan nomor dokumen yang merupakan bukti perbaikan, termasuk dokumen terkait pengendalian perubahan, bila perbaikan memerlukan pengendalian perubahan.',
    ],
    signatureLeft: 'Penanggung Jawab PBF (Apoteker)',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Isi Root Cause Analysis dengan 5-Why, pilah CA (perbaikan langsung) dan PA (pencegahan sistemik), sertakan No. SOP/Logbook pada Bukti Perbaikan.',
  },

  // 2. GUDANG FARMASI KESEHATAN (CDOB) - Sesuai Lampiran PDF Halaman 6
  GUDANG_FARMASI: {
    id: 'GUDANG_FARMASI',
    title: 'MATRIKS CAPA GUDANG FARMASI KESEHATAN',
    codeStandard: 'Standar CDOB / Pelayanan Kefarmasian',
    facilityTypeLabel: 'Gudang Farmasi Kesehatan / Instalasi Farmasi',
    headerFields: [
      { label: 'Nama Gudang Farmasi Kesehatan', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Pemeriksaan', valueKey: 'inspectionScope' },
      { label: 'Tanggal Pemeriksaan', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No.', width: 'w-10' },
      { id: 'finding', label: 'Temuan', width: 'w-64' },
      { id: 'requirement', label: 'Persyaratan', width: 'w-48', description: 'Persyaratan CDOB / Prosedur Mutu' },
      { id: 'rootCause', label: 'Root Cause Analysis', width: 'w-48', description: 'Penyebab adanya GAP kondisi saat ini' },
      { 
        id: 'capa', 
        label: 'CAPA', 
        subColumns: [
          { id: 'ca', label: 'CA' },
          { id: 'pa', label: 'PA' }
        ],
        width: 'w-72'
      },
      { id: 'deadlineStatus', label: 'Batas Waktu Penyelesaian – Status', width: 'w-36' },
      { id: 'pic', label: 'Penanggung Jawab', width: 'w-36' },
      { id: 'evidence', label: 'Bukti Perbaikan', width: 'w-40', description: 'Nomor berkas / dokumen pendukung' },
    ],
    notes: [
      '1. Diisi identitas Gudang Farmasi Kesehatan dan hal terkait pemeriksaan.',
      '2. Diisi temuan sesuai dengan Surat Tindak Lanjut Hasil Pemeriksaan.',
      '3. Diisi persyaratan CDOB dan persyaratan lain termasuk persyaratan internal misal kebijakan mutu perusahaan, prosedur tetap.',
      '4. Diisi akar penyebab dari ketidaksesuaian yang terjadi atau penyebab adanya GAP antara persyaratan dengan kondisi saat ini di Gudang Farmasi Kesehatan.',
      '5. CAPA perlu dijelaskan secara terperinci langkah-langkah tindakan perbaikan (CA) dan tindakan pencegahan (PA). Jika tidak ada tindakan pencegahan, jelaskan justifikasinya.',
      '6. Batas waktu penyelesaian yang reasonable dan diisi untuk tiap langkah.',
      '7. Status diisi dengan "sudah selesai" atau "dalam proses".',
      '8. Diisi personil yang bertanggung jawab atas implementasi CAPA yang dilakukan.',
      '9. Diisi dengan nomor dokumen yang merupakan bukti perbaikan, termasuk dokumen terkait pengendalian perubahan, bila perbaikan memerlukan pengendalian perubahan.',
    ],
    signatureLeft: 'Kepala Gudang Farmasi Kesehatan',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Pastikan pencatatan nomor kartu stok, logbook suhu chiller, dan bukti kalibrasi dilampirkan.',
  },

  // 3. SARANA OBAT / OBAT TRADISIONAL (CPOTB / CPOB) - Sesuai Lampiran PDF Halaman 3
  CPOB_CPOTB: {
    id: 'CPOB_CPOTB',
    title: 'CAPA INSPEKSI SARANA CPOTB / CPOB',
    codeStandard: 'Pedoman CPOB / CPOTB Terkini',
    facilityTypeLabel: 'Industri Farmasi / Industri Obat Tradisional',
    headerFields: [
      { label: 'Nama Sarana', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Inspeksi', valueKey: 'inspectionScope' },
      { label: 'Tanggal Inspeksi', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No', width: 'w-10' },
      { id: 'finding', label: 'Temuan', width: 'w-56' },
      { id: 'classification', label: 'Klasifikasi Temuan', width: 'w-28', description: 'Kritis / Mayor / Minor' },
      { id: 'requirement', label: 'Persyaratan', width: 'w-44', description: 'Klausul butir pedoman CPOTB/CPOB' },
      { id: 'currentCondition', label: 'Kondisi Saat Ini', width: 'w-44', description: 'Fakta lapangan yang diobservasi' },
      { id: 'gapAnalysis', label: 'GAP Analysis', width: 'w-44', description: 'Kesenjangan kondisi vs syarat' },
      { id: 'capa', label: 'CAPA', width: 'w-64', description: 'Langkah tindakan perbaikan dan pencegahan' },
      { id: 'pic', label: 'Penanggung Jawab', width: 'w-32' },
      { id: 'status', label: 'Status', width: 'w-28', description: 'Sudah selesai / dalam proses' },
      { id: 'deadline', label: 'Batas Waktu Penyelesaian', width: 'w-32' },
      { id: 'evidence', label: 'Bukti Perbaikan', width: 'w-40', description: 'Nomor dokumen & berkas terlampir' },
    ],
    notes: [
      '1. Diisi dengan persyaratan yang harus dipenuhi sesuai Pedoman CPOTB/CPOB yang berlaku.',
      '2. CAPA perlu dijelaskan secara terperinci langkah-langkah tindakan perbaikan dan tindakan pencegahan.',
      '3. Status diisi dengan sudah selesai atau dalam proses. Bila dalam proses, batas waktu penyelesaian diisi.',
      '4. Batas waktu penyelesaian yang reasonable.',
    ],
    signatureLeft: 'Manajer Pemastian Mutu (QA Manager)',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Lengkapi dengan deviasi investigasi, protokol kualifikasi HVAC/Mesin, dan rekaman batch tertaut.',
  },

  // 4. INDUSTRI KOSMETIK GOLONGAN A - Sesuai Lampiran PDF Halaman 2
  KOSMETIK_A: {
    id: 'KOSMETIK_A',
    title: 'CAPA HASIL INSPEKSI SARANA INDUSTRI KOSMETIK GOLONGAN A',
    codeStandard: 'Pedoman CPKB (Cara Pembuatan Kosmetika yang Baik)',
    facilityTypeLabel: 'Industri Kosmetik Golongan A',
    headerFields: [
      { label: 'Nama Sarana Produksi Kosmetik', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Pemeriksaan', valueKey: 'inspectionScope' },
      { label: 'Tanggal Pemeriksaan', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No.', width: 'w-10' },
      { id: 'finding', label: 'Temuan', width: 'w-60' },
      { id: 'classification', label: 'Klasifikasi Temuan', width: 'w-28' },
      { id: 'requirement', label: 'Persyaratan', width: 'w-44', description: 'Klausul butir CPKB' },
      { id: 'gapAnalysis', label: 'GAP Analysis', width: 'w-48', description: 'Analisis gap standar dan operasional' },
      { 
        id: 'capa', 
        label: 'CAPA', 
        subColumns: [
          { id: 'ca', label: 'Tindakan Perbaikan' },
          { id: 'pa', label: 'Tindakan Pencegahan' }
        ],
        width: 'w-72'
      },
      { id: 'deadline', label: 'Batas Waktu Penyelesaian', width: 'w-36' },
      { id: 'status', label: 'Status (diisi oleh Industri)', width: 'w-32', description: 'Selesai / Dalam Proses' },
    ],
    notes: [
      '1. Diisi sesuai temuan pada Surat Tindak Lanjut Inspeksi CPKB Golongan A.',
      '2. Rincikan pemisahan Tindakan Perbaikan fisik dan Tindakan Pencegahan administratif.',
      '3. Lampirkan dokumen SOP pembersihan, foto fisik, dan sertifikat pelatihan personil terkait.',
    ],
    signatureLeft: 'Pimpinan / Penanggung Jawab Teknis Kosmetik',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Tindakan perbaikan harus memuat perbaikan instrumen/ruang, sedangkan pencegahan memuat revisi SOP & pelatihan.',
  },

  // 5. INDUSTRI KOSMETIKA (PELAPORAN UMUM) - Sesuai Lampiran PDF Halaman 4
  KOSMETIKA: {
    id: 'KOSMETIKA',
    title: 'PELAPORAN CAPA HASIL INSPEKSI INDUSTRI KOSMETIKA',
    codeStandard: 'Standar CPKB & Regulasi Kosmetika',
    facilityTypeLabel: 'Industri Kosmetika',
    headerFields: [
      { label: 'Nama Industri Kosmetika', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tanggal Inspeksi', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No (1)', width: 'w-10' },
      { id: 'finding', label: 'Temuan (2)', width: 'w-64' },
      { id: 'classification', label: 'Klasifikasi Temuan (3)', width: 'w-32', description: 'Mayor / Minor' },
      { id: 'requirement', label: 'Persyaratan (4)', width: 'w-48', description: 'Sesuai CPKB/peraturan yang berlaku' },
      { id: 'capaCombined', label: 'Tindakan Perbaikan dan Pencegahan (5)', width: 'w-72', description: 'Dengan melampirkan bukti/data dukung' },
      { id: 'deadline', label: 'Batas Waktu Penyelesaian (6)', width: 'w-36', description: 'Komitmen perusahaan' },
      { id: 'status', label: 'Status (diisi oleh Industri Kosmetik) (7)', width: 'w-36', description: 'Sudah diselesaikan / masih dalam proses' },
    ],
    notes: [
      '1 = Diisi sesuai dengan urutan nomor temuan.',
      '2 = Diisi dengan temuan hasil pemeriksaan.',
      '3 = Diisi dengan klasifikasi temuan hasil pemeriksaan (Mayor/Minor), dimana: Temuan Mayor merupakan temuan yang berupa kekurangan yang disebabkan oleh ketidaktersediaan suatu sistem dan/atau penerapan yang tidak tepat dari sistem tersebut sehingga mempengaruhi kualitas produk sesuai tujuan penggunaannya. Temuan Minor merupakan kekurangan yang tidak akan mempengaruhi kualitas produk sesuai tujuan penggunaannya.',
      '4 = Diisi dengan persyaratan sesuai CPKB / peraturan yang berlaku.',
      '5 = Diisi dengan tindakan yang telah dilakukan oleh perusahaan untuk memperbaiki temuan dan mencegah agar temuan tidak terulang kembali dengan melampirkan bukti/data dukung.',
      '6 = Diisi dengan batas waktu sebagai komitmen perusahaan dalam menyelesaikan temuan.',
      '7 = Diisi dengan status apakah CAPA sudah diselesaikan oleh industri atau masih dalam proses. Bila dalam proses, diisi batas waktu penyelesaian.',
    ],
    signatureLeft: 'Penanggung Jawab Teknis Industri Kosmetika',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Sertakan nomor klausul CPKB butir 4 dan pastikan butir 5 merinci tindakan yang telah tuntas dilaksanakan.',
  },

  // 6. SARANA PRODUKSI PANGAN (CPPOB) - Sesuai Lampiran PDF Halaman 5
  PANGAN_PRODUKSI: {
    id: 'PANGAN_PRODUKSI',
    title: 'EVALUASI CAPA INSPEKSI SARANA PRODUKSI PANGAN',
    codeStandard: 'Standar CPPOB (Cara Produksi Pangan Olahan yang Baik)',
    facilityTypeLabel: 'Sarana Produksi Pangan / Industri Pangan Olahan',
    headerFields: [
      { label: 'Nama Sarana Produksi Pangan', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Pemeriksaan', valueKey: 'inspectionScope' },
      { label: 'Tanggal Pemeriksaan', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No.', width: 'w-10' },
      { id: 'finding', label: 'Temuan', width: 'w-64' },
      { id: 'classification', label: 'Klasifikasi Temuan', width: 'w-32', description: 'Kritis / Mayor / Minor' },
      { id: 'gapAnalysis', label: 'GAP Analysis', width: 'w-56', description: 'Analisis gap hygiene sanitasi & HACCP' },
      { id: 'capaCombined', label: 'CAPA', width: 'w-72', description: 'Rencana & realisasi perbaikan' },
      { id: 'deadline', label: 'Waktu Penyelesaian', width: 'w-36' },
      { id: 'evaluationResult', label: 'Hasil Evaluasi (diisi pemeriksa)', width: 'w-48', description: 'Memadai / Perlu Perbaikan' },
    ],
    notes: [
      '1. Diisi identitas sarana produksi pangan olahan sesuai izin edar / NIB.',
      '2. Rincikan gap hygiene sanitasi, pengendalian suhu, dan titik kritis (CCP).',
      '3. Kolom "Hasil Evaluasi" diisi oleh Petugas Pemeriksa BBPOM saat penelaahan berkas.',
    ],
    signatureLeft: 'Perwakilan Sarana Produksi Pangan',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Lampirkan foto fisik kebersihan ruang produksi, kalibrasi termometer, dan sertifikat pest control.',
  },

  // 7. SARANA DISTRIBUSI - Sesuai Lampiran PDF Halaman 1
  DISTRIBUSI: {
    id: 'DISTRIBUSI',
    title: 'EVALUASI CAPA INSPEKSI SARANA DISTRIBUSI',
    codeStandard: 'Standar Distribusi dan Peredaran Produk',
    facilityTypeLabel: 'Sarana Distribusi (Pangan / Umum / Apotek / Fasyankes)',
    headerFields: [
      { label: 'Nama Sarana Distribusi', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Pemeriksaan', valueKey: 'inspectionScope' },
      { label: 'Tanggal Pemeriksaan', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No.', width: 'w-10' },
      { id: 'finding', label: 'Temuan', width: 'w-64' },
      { id: 'classification', label: 'Klasifikasi Temuan', width: 'w-32', description: 'Kritis / Mayor / Minor' },
      { id: 'gapAnalysis', label: 'GAP Analysis', width: 'w-56', description: 'Analisis gap tata letak & administrasi' },
      { id: 'capaCombined', label: 'CAPA', width: 'w-72', description: 'Tindakan perbaikan dan pencegahan' },
      { id: 'deadline', label: 'Waktu Penyelesaian', width: 'w-36' },
      { id: 'evaluationResult', label: 'Hasil Evaluasi (diisi pemeriksa)', width: 'w-48', description: 'Memadai / Belum Memadai' },
    ],
    notes: [
      '1. Diisi identitas sarana distribusi dan hal terkait pemeriksaan.',
      '2. Temuan diklasifikasikan sesuai pedoman teknis peredaran.',
      '3. Kolom "Hasil Evaluasi" diverifikasi oleh Petugas/Evaluator BBPOM di Semarang.',
    ],
    signatureLeft: 'Perwakilan Sarana Distribusi',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Lengkapi bukti penataan palet, pemisahan produk kadaluwarsa, dan pencatatan kartu persediaan.',
  },

  // 8. SARANA PELAYANAN KEFARMASIAN (APOTEK / KLINIK / RS) - Sesuai Lampiran PDF Halaman 8
  PELAYANAN_KEFARMASIAN: {
    id: 'PELAYANAN_KEFARMASIAN',
    title: 'TINDAKAN PERBAIKAN DAN PENCEGAHAN / CORRECTIVE AND PREVENTIVE ACTION (TPP/CAPA) SEHUBUNGAN DENGAN HASIL PEMERIKSAAN BADAN POM',
    codeStandard: 'Standar Pelayanan Kefarmasian & Regulasi Badan POM',
    facilityTypeLabel: 'Sarana Pelayanan Kefarmasian (Apotek / Rumah Sakit / Klinik)',
    headerFields: [
      { label: 'Nama Sarana', valueKey: 'facilityName' },
      { label: 'Alamat', valueKey: 'address' },
      { label: 'Tujuan Pemeriksaan', valueKey: 'inspectionScope' },
      { label: 'Tanggal Pemeriksaan', valueKey: 'inspectionDate' },
    ],
    columns: [
      { id: 'no', label: 'No', width: 'w-10', description: '1 - seterusnya' },
      { id: 'finding', label: 'Temuan dan Observasi', width: 'w-56', description: 'Temuan hasil pemeriksaan oleh Badan POM' },
      { id: 'classification', label: 'Kriteria', width: 'w-24', description: 'Kriteria pelanggaran (minor/mayor/kritikal)' },
      { id: 'requirement', label: 'Persyaratan', width: 'w-44', description: 'Peraturan perundang-undangan atau pedoman yang dilanggar' },
      { id: 'gapAnalysis', label: 'GAP Analysis', width: 'w-44', description: 'Ketidaksesuaian dengan persyaratan' },
      { id: 'impact', label: 'Dampak', width: 'w-44', description: 'Akibat yang ditimbulkan apabila tidak sesuai dengan persyaratan' },
      { id: 'capaCombined', label: 'TPP/CAPA (Corrective Action Preventif Action)', width: 'w-64', description: 'Rencana tindakan perbaikan dan pencegahan' },
      { id: 'deadline', label: 'Batas Waktu Penyelesaian', width: 'w-32', description: 'Batas waktu penyelesaian' },
      { id: 'pic', label: 'Personil Penanggung Jawab', width: 'w-36', description: 'Personil penanggung jawab sesuai Job Description' },
      { id: 'evidence', label: 'Bukti Perbaikan', width: 'w-44', description: 'Bukti telah dilaksanakannya perbaikan (dokumen/foto/SOP)' },
    ],
    notes: [
      '1 - seterusnya: Diisi sesuai dengan urutan nomor temuan hasil pemeriksaan oleh Badan POM.',
      'Kriteria: Diisi dengan kriteria pelanggaran (minor / mayor / kritikal).',
      'Persyaratan: Diisi dengan peraturan perundang-undangan atau pedoman yang dilanggar.',
      'GAP Analysis: Diisi dengan ketidaksesuaian kondisi sarana dengan persyaratan yang berlaku.',
      'Dampak: Diisi dengan akibat atau risiko yang ditimbulkan apabila tidak sesuai dengan persyaratan.',
      'TPP/CAPA: Diisi dengan rencana tindakan perbaikan dan pencegahan terperinci.',
      'Batas Waktu Penyelesaian: Diisi dengan batas waktu komitmen penyelesaian.',
      'Personil Penanggung Jawab: Diisi dengan personil yang bertanggung jawab sesuai dengan Job Description.',
      'Bukti Perbaikan: Diisi dengan bukti telah dilaksanakannya perbaikan. Bukti perbaikan harus dilampirkan (Bisa berupa dokumen atau foto). Jika perbaikan dilakukan dengan pembuatan SOP maka dokumen harus dilampirkan.',
    ],
    signatureLeft: 'Apoteker Penanggung Jawab / Pemilik Sarana',
    signatureRight: 'Ketua Tim Pemeriksa BBPOM di Semarang',
    sampleGuidance: 'Isi lengkap kolom Dampak dan lampirkan bukti foto lemari NPP berkunci ganda, kartu stok, serta revisi SOP.',
  },
};

/**
 * Determine the exact commodity type from inspection session or facility type
 */
export function getCommodityType(facilityType: string, facilityName?: string, scope?: string): CommodityType {
  const fType = (facilityType || '').toLowerCase();
  const fName = (facilityName || '').toLowerCase();
  const fScope = (scope || '').toLowerCase();

  // 1. PBF / Pedagang Besar Farmasi - Form 7
  if (fType === 'pedagang besar farmasi (pbf)' || fType.includes('pedagang besar farmasi') || fType.includes('pbf') || fName.includes('pbf ') || fScope.includes('pbf')) {
    return 'PBF_CDOB';
  }

  // 2. Gudang Farmasi Kesehatan - Form 6
  if (fType.includes('gudang farmasi') || fName.includes('gudang farmasi')) {
    return 'GUDANG_FARMASI';
  }

  // 3. Kosmetik Golongan A - Form 2
  if (fType.includes('kosmetik golongan a') || fName.includes('kosmetik golongan a') || fScope.includes('golongan a')) {
    return 'KOSMETIK_A';
  }

  // 4. Industri Kosmetika umum / Golongan B - Form 4
  if (fType === 'industri kosmetika' || fType.includes('kosmetika') || fType.includes('kosmetik') || fName.includes('kosmetik') || fScope.includes('cpkb')) {
    return 'KOSMETIKA';
  }

  // 5. Sarana Produksi Pangan / Industri Pangan Olahan - Form 5
  if (fType.includes('pangan') || fName.includes('pangan') || fScope.includes('cppob') || fScope.includes('pangan')) {
    return 'PANGAN_PRODUKSI';
  }

  // 6. Sarana Distribusi - Form 1
  if (fType === 'sarana distribusi' || (fType.includes('distribusi') && !fType.includes('pedagang besar farmasi') && !fType.includes('pbf'))) {
    return 'DISTRIBUSI';
  }

  // 7. Apotek / Klinik / Rumah Sakit / Puskesmas / Sarana Pelayanan Kefarmasian - Form 8
  if (fType.includes('puskesmas') || fType.includes('apotek') || fType.includes('klinik') || fType.includes('rumah sakit') || fType.includes('pelayanan kefarmasian') || fName.includes('puskesmas') || fName.includes('pkm')) {
    return 'PELAYANAN_KEFARMASIAN';
  }

  // 8. Industri Farmasi (CPOB) & Obat Tradisional (CPOTB) - Form 3
  if (fType.includes('farmasi') || fType.includes('obat tradisional') || fType.includes('cpotb') || fScope.includes('cpob') || fScope.includes('cpotb')) {
    return 'CPOB_CPOTB';
  }

  // Default fallback
  return 'CPOB_CPOTB';
}

/**
 * Get config helper
 */
export function getCommodityMatrixConfig(facilityType: string, facilityName?: string, scope?: string): CommodityMatrixConfig {
  const comType = getCommodityType(facilityType, facilityName, scope);
  return COMMODITY_CONFIGS[comType];
}
