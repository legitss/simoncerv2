import { FindingCategory, InspectionSession } from '../types';

export interface SaranaFormConfig {
  facilityType: InspectionSession['facility']['type'];
  formName: string;
  formCode: string;
  regulationStandard: string;
  description: string;
  formNumber: number;
  matrixStandardName: string;
  aspects: string[];
  defaultClauses: Array<{
    clause: string;
    category: FindingCategory;
    description: string;
    initialEvidenceDescription: string;
  }>;
}

export const SARANA_CAPA_FORMS: Record<InspectionSession['facility']['type'], SaranaFormConfig> = {
  // 1. INDUSTRI FARMASI - Form 3
  'Industri Farmasi': {
    facilityType: 'Industri Farmasi',
    formName: 'Form 3: CAPA Inspeksi Sarana CPOB / CPOTB',
    formCode: 'FORM-CAPA-CPOB-2024',
    formNumber: 3,
    matrixStandardName: 'Standar CPOB / CPOTB Terkini (Form 3)',
    regulationStandard: 'Peraturan Badan POM No. 34 Tahun 2018 & Pedoman CPOB Edisi Terkini',
    description: 'Format CAPA industri farmasi berbasis manajemen risiko mutu (ICH Q9/Q10), mencakup fasilitas steril, validasi proses, sistem tata udara (HVAC), dan catatan bets.',
    aspects: [
      'Sistem Manajemen Mutu Industri Farmasi',
      'Personalia & Kualifikasi Petugas Produksi/QA/QC',
      'Bangunan, Fasilitas, & Sistem Tata Udara (HVAC)',
      'Peralatan, Kualifikasi, & Validasi Pembersihan',
      'Sanitasi & Higiene Area Bersih',
      'Produksi & Pengendalian Kontaminasi Silang',
      'Pengawasan Mutu (QC) & Uji Stabilitas',
      'Inspeksi Diri, Audit Mutu, & Penanganan Deviasi'
    ],
    defaultClauses: [
      {
        clause: 'CPOB 2024 Bab 3 Butir 3.14 - Kualifikasi dan Validasi Sistem Tata Udara (HVAC)',
        category: 'KRITIS',
        description: 'Sistem tata udara dan filter HEPA pada Ruang Produksi Steril Kelas B belum dilakukan uji integritas kebocoran (DOP/PAO Test) berkala dalam kurun waktu 12 bulan terakhir.',
        initialEvidenceDescription: 'Logbook kualifikasi fasilitas steril dan rekaman manometer ruang nomor B-02.'
      },
      {
        clause: 'CPOB 2024 Bab 5 Butir 5.23 - Pengendalian Kontaminasi Silang pada Tahap Pencampuran Granulasi',
        category: 'MAYOR',
        description: 'SOP Pembersihan Mesin Fluid Bed Dryer No. SOP-PRD-019 belum mencantumkan batas waktu tunggu bersih (dirty hold time) yang telah divalidasi.',
        initialEvidenceDescription: 'Dokumen validasi pembersihan No. VP-FBD-2024.'
      },
      {
        clause: 'CPOB 2024 Bab 7 Butir 7.15 - Dokumentasi Catatan Pengolahan Bets (Batch Record)',
        category: 'MINOR',
        description: 'Terdapat coretan koreksi penimbangan bahan tambahan pada Batch Record tanpa disertai paraf dan tanggal oleh operator penimbang.',
        initialEvidenceDescription: 'Fotokopi Catatan Pengolahan Bets lembar ke-3.'
      }
    ]
  },

  // 2. PEDAGANG BESAR FARMASI (PBF) - Form 7
  'Pedagang Besar Farmasi (PBF)': {
    facilityType: 'Pedagang Besar Farmasi (PBF)',
    formName: 'Form 7: Matriks CAPA Pedagang Besar Farmasi (CDOB)',
    formCode: 'FORM-CAPA-CDOB-2024',
    formNumber: 7,
    matrixStandardName: 'Standar CDOB Pedagang Besar Farmasi (Form 7)',
    regulationStandard: 'Peraturan Badan POM No. 6 Tahun 2020 & PerBPOM No. 9 Tahun 2019',
    description: 'Format CAPA PBF berfokus pada integritas rantai distribusi, monitoring suhu gudang & cold chain, sistem karantina, recall, dan kualifikasi pemasok/pelanggan.',
    aspects: [
      'Manajemen Mutu & Integritas Dokumen Distribusi',
      'Organisasi, Manajemen, & APJ PBF',
      'Bangunan, Penyimpanan, & Pemetaan Suhu Gudang',
      'Operasional Pengadaan, Penerimaan, & Penyaluran',
      'Pengelolaan Rantai Dingin (Cold Chain Management / CCP)',
      'Keluhan, Obat Kembalian, & Dugaan Obat Palsu',
      'Penarikan Kembali Obat (Mock Recall Simulation)',
      'Transportasi & Validasi Kontainer Pengiriman'
    ],
    defaultClauses: [
      {
        clause: 'CDOB 2024 Bab 9 Butir 9.4 - Pemantauan dan Pemetaan Suhu Ruang Dingin (Chiller)',
        category: 'MAYOR',
        description: 'Sensor suhu data logger digital pada Chiller Vaksin belum dikalibrasi ulang oleh laboratorium kalibrasi terakreditasi KAN sejak jatuh tempo.',
        initialEvidenceDescription: 'Stiker kalibrasi fisik pada unit data logger Chiller tertera tanggal kedaluwarsa.'
      },
      {
        clause: 'CDOB 2024 Bab 4 Butir 4.12 - Prosedur Penarikan Kembali Obat (Recall Management)',
        category: 'MINOR',
        description: 'Simulasi uji penarikan obat (mock recall) tahun berjalan belum dilaksanakan sesuai jadwal tahunan yang tertuang dalam SOP.',
        initialEvidenceDescription: 'Logbook pelaksanaan mock recall tahunan sarana.'
      },
      {
        clause: 'CDOB 2024 Bab 5 Butir 5.8 - Kualifikasi Pemasok dan Pelanggan',
        category: 'MAYOR',
        description: 'Terdapat transaksi penyaluran obat keras kepada sarana yang masa berlaku izin operasionalnya telah kedaluwarsa tanpa pembaruan verifikasi berkas.',
        initialEvidenceDescription: 'Faktur penjualan dan arsip salinan izin sarana pembeli.'
      }
    ]
  },

  // 3. GUDANG FARMASI KESEHATAN - Form 6
  'Gudang Farmasi Kesehatan': {
    facilityType: 'Gudang Farmasi Kesehatan',
    formName: 'Form 6: Matriks CAPA Gudang Farmasi Kesehatan',
    formCode: 'FORM-CAPA-GFK-2024',
    formNumber: 6,
    matrixStandardName: 'Standar Gudang Farmasi Kesehatan (Form 6)',
    regulationStandard: 'Standar CDOB & Pengelolaan Obat Publik Dinas Kesehatan',
    description: 'Format CAPA instalasi gudang farmasi dinas kesehatan/pemerintah, berfokus pada tata kelola buffer stock obat program, vaksin imunisasi, dan kartu persediaan.',
    aspects: [
      'Penyimpanan Vaksin & Cold Chain Monitoring',
      'Tata Kelola Obat Program Pemerintah & Buffer Stock',
      'Pengendalian Suhu & Kelembaban Gudang Sentral',
      'Pengendalian Kadaluwarsa (FEFO / FIFO)',
      'Distribusi ke Puskesmas & Fasyankes Pembantu'
    ],
    defaultClauses: [
      {
        clause: 'Standar CDOB Bab 3 - Pengendalian Suhu & Kalibrasi Chiller Gudang Farmasi',
        category: 'MAYOR',
        description: 'Termometer digital pada cold room penyimpanan vaksin program rutin daerah belum memiliki rekaman kalibrasi eksternal berkala tahunan.',
        initialEvidenceDescription: 'Logbook pemantauan suhu cold room unit 01.'
      },
      {
        clause: 'Standar Pengelolaan Obat Publik - Kartu Stok dan Penataan FEFO',
        category: 'MINOR',
        description: 'Penataan kardus obat program TB belum dilengkapi kartu kendali stok fisik yang tersinkronisasi dengan kartu stok elektronik.',
        initialEvidenceDescription: 'Foto rak penyimpanan obat program TB.'
      }
    ]
  },

  // 4. INDUSTRI KOSMETIK GOLONGAN A - Form 2
  'Industri Kosmetik Golongan A': {
    facilityType: 'Industri Kosmetik Golongan A',
    formName: 'Form 2: CAPA Inspeksi Sarana Industri Kosmetik Golongan A',
    formCode: 'FORM-CAPA-CPKB-A-2024',
    formNumber: 2,
    matrixStandardName: 'Standar CPKB Industri Kosmetik Golongan A (Form 2)',
    regulationStandard: 'Peraturan Badan POM No. 31 Tahun 2020 tentang Penerapan CPKB',
    description: 'Format CAPA industri kosmetika golongan A (bentuk sediaan lengkap/steril/aerosol), mencakup pemisahan tindakan perbaikan dan pencegahan serta gap analysis.',
    aspects: [
      'Sistem Manajemen Mutu Industri Kosmetik',
      'Personil Penanggung Jawab Teknis (Apoteker)',
      'Higiene Sanitasi Ruang Pengolahan & Pengemasan',
      'Kualifikasi Mesin Homogenizer & Mixer Kosmetik',
      'Pengujian Mutu Mikrobiologi & Logam Berat Kosmetik',
      'Pengendalian Bahan Baku Berbahaya (Merkuri, Hidrokuinon, Timbal)'
    ],
    defaultClauses: [
      {
        clause: 'CPKB Bab 4 Butir 4.3 - Sanitasi dan Higiene Ruang Pengolahan Sediaan Kosmetika',
        category: 'MAYOR',
        description: 'Terdapat endapan sisa emulsi krim pada celah kran pengeluaran tangki mixer yang belum dibersihkan secara tuntas setelah proses produksi selesai.',
        initialEvidenceDescription: 'Foto fisik katup keluaran mixer emulsi No. M-03.'
      },
      {
        clause: 'CPKB Bab 6 Butir 6.1 - Pengujian Mutu Mikrobiologi Bahan Baku Kosmetik',
        category: 'MAYOR',
        description: 'Laboratorium QC belum melakukan uji angka lempeng total (ALT) pada bahan baku ekstrak herbal sebelum dirilis untuk proses formulasi.',
        initialEvidenceDescription: 'Sertifikat analisis internal bahan baku ekstrak lidah buaya bets EB-99.'
      }
    ]
  },

  // 5. INDUSTRI KOSMETIKA - Form 4
  'Industri Kosmetika': {
    facilityType: 'Industri Kosmetika',
    formName: 'Form 4: Pelaporan CAPA Hasil Inspeksi Industri Kosmetika',
    formCode: 'FORM-CAPA-CPKB-UMUM-2024',
    formNumber: 4,
    matrixStandardName: 'Standar Pelaporan CPKB Industri Kosmetika (Form 4)',
    regulationStandard: 'Pedoman CPKB Badan POM & Keputusan Kepala Badan POM',
    description: 'Format pelaporan CAPA sarana industri kosmetika dengan klasifikasi temuan mayor/minor dan tindakan perbaikan-pencegahan terpadu.',
    aspects: [
      'Bangunan & Fasilitas Produksi Kosmetika',
      'Peralatan Produksi & Pengemasan',
      'Sanitasi & Higiene Karyawan',
      'Pengawasan Mutu dan Dokumentasi Pelaporan',
      'Penanganan Keluhan dan Penarikan Produk Kosmetik'
    ],
    defaultClauses: [
      {
        clause: 'CPKB Bab 3 Butir 3.5 - Tata Letak dan Pemisahan Ruang Bersih',
        category: 'MAYOR',
        description: 'Pintu antara ruang penimbangan bahan baku kosmetik dengan koridor umum tidak memiliki mekanisme penutup otomatis (self-closing door).',
        initialEvidenceDescription: 'Dokumentasi foto pintu ruang timbang bahan baku.'
      },
      {
        clause: 'CPKB Bab 8 Butir 8.2 - Retensi Sampel Produk Jadi Kosmetik',
        category: 'MINOR',
        description: 'Penyimpanan pertinggal sampel kosmetik lotion tidak diberi label nomor bets dan tanggal kedaluwarsa yang mudah dibaca.',
        initialEvidenceDescription: 'Foto lemari penyimpanan sampel pertinggal.'
      }
    ]
  },

  // 6. SARANA PRODUKSI PANGAN - Form 5
  'Sarana Produksi Pangan': {
    facilityType: 'Sarana Produksi Pangan',
    formName: 'Form 5: Evaluasi CAPA Inspeksi Sarana Produksi Pangan (CPPOB)',
    formCode: 'FORM-CAPA-CPPOB-PROD-2024',
    formNumber: 5,
    matrixStandardName: 'Standar CPPOB Sarana Produksi Pangan (Form 5)',
    regulationStandard: 'Peraturan Badan POM No. 22 Tahun 2021 tentang Penerapan CPPOB',
    description: 'Format evaluasi CAPA sarana pengolahan dan produksi pangan industri rumah tangga / MD, mencakup gap analysis dan hasil evaluasi pemeriksa.',
    aspects: [
      'Lokasi, Desain, & Konstruksi Bangunan Pabrik Pangan',
      'Higiene Personil & Fasilitas Sanitasi Karyawan',
      'Pengendalian Hama Terpadu (Pest Control)',
      'Pengawasan Titik Kendali Kritis (CCP)',
      'Penggunaan Bahan Tambahan Pangan (BTP) Sesuai Batas Aman',
      'Label & Izin Edar BPOM MD'
    ],
    defaultClauses: [
      {
        clause: 'CPPOB Bab 4 Butir 4.6 - Pengendalian Hama dan Serangga di Ruang Produksi',
        category: 'MAYOR',
        description: 'Pintu akses area pengolahan utama tidak tertutup rapat dan insect killer dalam kondisi mati sehingga berpotensi masuknya serangga.',
        initialEvidenceDescription: 'Foto pintu akses ruang produksi dan unit insect killer IK-03.'
      },
      {
        clause: 'CPPOB Bab 6 Butir 6.3 - Pengendalian Suhu Penyimpanan Bahan Baku Sensitif',
        category: 'MINOR',
        description: 'Gudang penyimpanan bahan tambahan pangan suhunya tercatat 31°C melampaui anjuran produsen (maksimum 25°C).',
        initialEvidenceDescription: 'Termohigrometer gudang bahan baku kering.'
      }
    ]
  },

  // 7. INDUSTRI PANGAN OLAHAN - Form 5
  'Industri Pangan Olahan': {
    facilityType: 'Industri Pangan Olahan',
    formName: 'Form 5: Evaluasi CAPA Inspeksi Industri Pangan Olahan (CPPOB)',
    formCode: 'FORM-CAPA-CPPOB-2024',
    formNumber: 5,
    matrixStandardName: 'Standar CPPOB Industri Pangan Olahan (Form 5)',
    regulationStandard: 'Peraturan Badan POM No. 22 Tahun 2021 tentang CPPOB',
    description: 'Format CAPA industri pangan olahan berfokus pada higiene sanitasi, pengendalian bahaya biologis/kimiawi/fisik (HACCP), penanganan bahan baku, dan pelabelan nomor izin edar BPOM MD.',
    aspects: [
      'Lokasi, Desain, & Konstruksi Bangunan Pabrik',
      'Higiene Personil & Fasilitas Sanitasi Karyawan',
      'Pengendalian Hama Terpadu (Integrated Pest Management)',
      'Pengawasan Proses Pengolahan & Titik Kendali Kritis (CCP)',
      'Spesifikasi Bahan Baku, Bahan Tambahan Pangan (BTP), & Air Proses',
      'Pelabelan, Nomor Izin Edar MD, & Penarikan Produk Pangan'
    ],
    defaultClauses: [
      {
        clause: 'CPPOB Bab 4 Butir 4.6 - Pengendalian Hama dan Serangga di Ruang Produksi',
        category: 'MAYOR',
        description: 'Pintu akses area pengolahan utama tidak tertutup rapat dan insect killer dalam kondisi mati sehingga berpotensi masuknya serangga ke area pengolahan terbuka.',
        initialEvidenceDescription: 'Foto pintu akses ruang produksi dan insect killer nomor IK-03.'
      },
      {
        clause: 'CPPOB Bab 6 Butir 6.3 - Pengendalian Suhu Penyimpanan Bahan Baku Sensitif',
        category: 'MINOR',
        description: 'Gudang penyimpanan bahan tambahan pangan (perisa & pengemulsi) suhunya tercatat 31°C melampaui anjuran produsen (maksimum 25°C).',
        initialEvidenceDescription: 'Termohigrometer gudang bahan baku kering.'
      }
    ]
  },

  // 8. SARANA DISTRIBUSI - Form 1
  'Sarana Distribusi': {
    facilityType: 'Sarana Distribusi',
    formName: 'Form 1: Evaluasi CAPA Inspeksi Sarana Distribusi',
    formCode: 'FORM-CAPA-DIST-2024',
    formNumber: 1,
    matrixStandardName: 'Standar Sarana Distribusi & Peredaran (Form 1)',
    regulationStandard: 'Standar Peredaran Produk & Pengawasan Distribusi Badan POM',
    description: 'Format evaluasi CAPA sarana distribusi umum, distributor pangan, atau distributor kosmetik non-PBF, berfokus pada gap analysis tata letak dan hasil verifikasi pemeriksa.',
    aspects: [
      'Kelayakan Tempat Penyimpanan & Palet Gudang',
      'Pemisahan Produk Kadaluwarsa / Rusak',
      'Pencatatan Kartu Persediaan Barang Masuk & Keluar',
      'Legalitas & Nomor Izin Edar Produk yang Disalurkan',
      'Sanitasi & Kebersihan Sarana Distribusi'
    ],
    defaultClauses: [
      {
        clause: 'Standar Sarana Distribusi Butir 2.4 - Penataan Palet dan Jarak dari Dinding',
        category: 'MAYOR',
        description: 'Penumpukan produk pangan kemasan menempel langsung pada dinding gudang dan tidak menggunakan palet dasar yang memadai.',
        initialEvidenceDescription: 'Foto tumpukan kardus produk di gudang blok barat.'
      },
      {
        clause: 'Standar Sarana Distribusi Butir 3.1 - Area Khusus Produk Retur / Kedaluwarsa',
        category: 'MINOR',
        description: 'Area penyimpanan produk rusak/kedaluwarsa belum diberi pembatas fisik dan penanda identitas yang jelas.',
        initialEvidenceDescription: 'Foto sudut gudang penampungan produk rusak.'
      }
    ]
  },

  // 9. APOTEK - Form 8
  'Apotek': {
    facilityType: 'Apotek',
    formName: 'Form 8: Tindakan Perbaikan dan Pencegahan (TPP/CAPA) Sarana Pelayanan Kefarmasian - Apotek',
    formCode: 'FORM-CAPA-TPP-APT-2024',
    formNumber: 8,
    matrixStandardName: 'Standar TPP/CAPA Pelayanan Kefarmasian (Form 8)',
    regulationStandard: 'Permenkes No. 73 Tahun 2016 & Permenkes No. 3 Tahun 2015',
    description: 'Format TPP/CAPA sarana apotek sehubungan dengan hasil pemeriksaan Badan POM. Memuat klausul Temuan, Kriteria, Persyaratan, GAP Analysis, Dampak, TPP/CAPA, Batas Waktu, PIC, dan Bukti Perbaikan.',
    aspects: [
      'Pengelolaan Narkotika, Psikotropika, & Prekursor Farmasi (NPP)',
      'Penyimpanan Obat & Lemari Khusus Kunci Ganda',
      'Pelaporan SIPNAP Bulanan Tepat Waktu',
      'Pelayanan Resep Dokter & Pengarsipan Resep',
      'Pelayanan Farmasi Klinis, PIO, & Konseling',
      'Sumber Daya Manusia (SIPA Apoteker & SIPTTK)'
    ],
    defaultClauses: [
      {
        clause: 'Permenkes No. 3/2015 Pasal 26 - Lemari Khusus Penyimpanan Narkotika Kunci Ganda',
        category: 'MAYOR',
        description: 'Lemari khusus penyimpanan sediaan narkotika kunci ganda (double lock) salah satu anak kuncinya masih tertinggal menempel di lubang kunci saat APJ tidak berada di tempat.',
        initialEvidenceDescription: 'Foto lemari narkotika dengan kunci terpasang di ruang peracikan.'
      },
      {
        clause: 'Permenkes No. 3/2015 Pasal 43 - Kepatuhan Pelaporan SIPNAP Bulanan',
        category: 'MINOR',
        description: 'Laporan SIPNAP bulan sebelumnya belum disampaikan ke sistem online Kemenkes/BPOM melampaui batas waktu tanggal 10 bulan berjalan.',
        initialEvidenceDescription: 'Tangkapan layar rekap pelaporan SIPNAP akun Apotek.'
      },
      {
        clause: 'Permenkes No. 73/2016 - Pengarsipan dan Pemusnahan Resep',
        category: 'MINOR',
        description: 'Resep obat mengandung prekursor belum dipisahkan secara rapi dan tidak disusun urut berdasarkan tanggal penerimaan resep.',
        initialEvidenceDescription: 'Bundel resep obat ruang peracikan.'
      }
    ]
  },

  // 10. RUMAH SAKIT - Form 8
  'Rumah Sakit': {
    facilityType: 'Rumah Sakit',
    formName: 'Form 8: Tindakan Perbaikan dan Pencegahan (TPP/CAPA) Instalasi Farmasi Rumah Sakit',
    formCode: 'FORM-CAPA-TPP-RS-2024',
    formNumber: 8,
    matrixStandardName: 'Standar TPP/CAPA Pelayanan Kefarmasian RS (Form 8)',
    regulationStandard: 'Permenkes No. 72 Tahun 2016 & Standar Akreditasi Kemenkes (STARKES)',
    description: 'Format TPP/CAPA instalasi farmasi RS berorientasi keselamatan pasien, penataan obat High Alert & LASA/NORUM, troli emergensi, sterilitas pencampuran, dan depo farmasi.',
    aspects: [
      'Penyimpanan & Pelabelan Obat High Alert Medication',
      'Pengendalian Obat LASA (Look-Alike Sound-Alike) / NORUM',
      'Pengelolaan Troli Emergensi (Segel, Buku Kendali, & Expire Date)',
      'Penanganan Sediaan Sitostatika & Aseptic Dispensing',
      'Sistem Distribusi Unit Dose Dispensing (UDD)',
      'Rekonsiliasi Obat Pasien Rawat Inap'
    ],
    defaultClauses: [
      {
        clause: 'Permenkes No. 72/2016 - Standar Penyimpanan Obat High Alert Medication',
        category: 'MAYOR',
        description: 'Obat Konsentrat Elektrolit Pekat (KCl 7.46%) di Troli Emergensi Ruang Tindakan bersanding dengan injeksi biasa tanpa label stiker penanda khusus High Alert warna merah.',
        initialEvidenceDescription: 'Foto troli emergensi ruang perawatan lantai 2.'
      },
      {
        clause: 'Permenkes No. 72/2016 - Pemantauan Suhu Cold Chain Farmasi RS',
        category: 'MAYOR',
        description: 'Kulkas penyimpanan produk biologis dan insulin belum dilengkapi grafik pemantauan suhu harian dua kali sehari (pagi dan sore).',
        initialEvidenceDescription: 'Lembar ceklis pemantauan suhu kulkas depo rawat jalan.'
      },
      {
        clause: 'STARKES Standar PKPO - Kualifikasi dan Pelatihan Tenaga Teknis Kefarmasian',
        category: 'MINOR',
        description: 'Sebagian staf teknis kefarmasian belum memiliki bukti sertifikat pelatihan penanganan obat sitostatika dan kewaspadaan tinggi.',
        initialEvidenceDescription: 'Berkas rekapitulasi file kredensial tenaga farmasi.'
      }
    ]
  },

  // 11. KLINIK - Form 8
  'Klinik': {
    facilityType: 'Klinik',
    formName: 'Form 8: Tindakan Perbaikan dan Pencegahan (TPP/CAPA) Ruang Farmasi Klinik',
    formCode: 'FORM-CAPA-TPP-KLINIK-2024',
    formNumber: 8,
    matrixStandardName: 'Standar TPP/CAPA Ruang Farmasi Klinik (Form 8)',
    regulationStandard: 'Permenkes No. 14 Tahun 2021 & Standar Pelayanan Farmasi Klinik',
    description: 'Format TPP/CAPA ruang farmasi klinik, mencakup perizinan sarana, penanggung jawab teknis, pengelolaan obat emergensi tindakan, dan kelengkapan etiket obat.',
    aspects: [
      'Legalitas & SIP Penanggung Jawab Farmasi Klinik',
      'Penyimpanan Obat & Vaksin Imunisasi (Jika Ada)',
      'Kotak Emergensi Tindakan Medis',
      'Penyerahan Obat, Etiket, & KIE Pasien',
      'Pencatatan Kartu Stok dan Tanggal Kedaluwarsa'
    ],
    defaultClauses: [
      {
        clause: 'Permenkes No. 14/2021 - Pengelolaan Obat Emergensi Ruang Tindakan Klinik',
        category: 'MAYOR',
        description: 'Ditemukan 2 ampul injeksi Epinefrin pada kotak emergensi ruang tindakan yang telah melewati batas kedaluwarsa (expired date).',
        initialEvidenceDescription: 'Foto ampul obat emergensi di ruang tindakan klinik.'
      },
      {
        clause: 'Permenkes No. 14/2021 - Kelengkapan Etiket dan Label Penyerahan Obat',
        category: 'MINOR',
        description: 'Etiket obat racikan puyer anak belum memuat informasi tanggal peracikan dan batas waktu penggunaan (Beyond Use Date / BUD).',
        initialEvidenceDescription: 'Contoh etiket obat ruang farmasi klinik.'
      }
    ]
  },

  // 12. PUSKESMAS - Form 9 (Fasyankes Tingkat Pertama)
  'Puskesmas': {
    facilityType: 'Puskesmas',
    formName: 'Form 9: Matriks CAPA Pelayanan Kefarmasian Puskesmas (Fasyankes)',
    formCode: 'FORM-CAPA-PKM-2024',
    formNumber: 9,
    matrixStandardName: 'Standar Pelayanan Kefarmasian di Puskesmas (Form 9)',
    regulationStandard: 'Permenkes No. 74 Tahun 2016 jo. Permenkes No. 26 Tahun 2020 & Pedoman Pengawasan BBPOM',
    description: 'Format CAPA instalasi/ruang farmasi Puskesmas, mencakup kartu stok obat, lemari khusus psikotropika, penyimpanan vaksin cold chain (CCP), dan pelayanan resep.',
    aspects: [
      'Legalitas, SIPA Apoteker Penanggung Jawab, & TTK Puskesmas',
      'Pengelolaan Kartu Stok Manual & Elektronik Obat Program/Reguler',
      'Penyimpanan Khusus Obat Psikotropika & Narkotika',
      'Penyimpanan & Distribusi Cold Chain Product (CCP) / Vaksin',
      'Kalibrasi Termometer & Monitoring Suhu Chiller / Kulkas Obat',
      'Pelayanan Resep, Penyerahan Obat, Etiket, & Informasi Pasien'
    ],
    defaultClauses: [
      {
        clause: 'Permenkes No. 74/2016 Bab 3 - Pencatatan Kartu Stok Obat Fisik dan Elektronik',
        category: 'MAYOR',
        description: 'Kartu stok obat sebagian belum update dan terdapat selisih antara pencatatan kartu manual dengan stok fisik obat.',
        initialEvidenceDescription: 'Dokumen kartu stok manual dan fisik obat di ruang farmasi puskesmas.'
      },
      {
        clause: 'Permenkes No. 74/2016 Bab 3 - Penyimpanan & Pemeliharaan Cold Chain Vaksin (CCP)',
        category: 'MAYOR',
        description: 'Termometer kulkas penyimpanan vaksin dalam kondisi rusak dan belum tersedia grafik monitoring suhu harian secara rutin.',
        initialEvidenceDescription: 'Foto lemari es pendingin vaksin puskesmas.'
      },
      {
        clause: 'Permenkes No. 74/2016 Bab 3 - Pemisahan Lemari Penyimpanan Obat Psikotropika',
        category: 'MAYOR',
        description: 'Lemari khusus penyimpanan obat psikotropika masih digunakan bersama untuk menyimpan obat non-psikotropika.',
        initialEvidenceDescription: 'Foto lemari penyimpanan obat psikotropika.'
      }
    ]
  }
};

export function getSaranaFormConfig(type: InspectionSession['facility']['type']): SaranaFormConfig {
  return SARANA_CAPA_FORMS[type] || SARANA_CAPA_FORMS['Industri Farmasi'];
}
