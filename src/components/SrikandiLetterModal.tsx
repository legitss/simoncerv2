import React from 'react';
import { InspectionSession } from '../types';
import { 
  X, 
  ArrowLeft,
  Printer, 
  Send, 
  QrCode, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle2,
  Mail,
  MessageCircle
} from 'lucide-react';
import { formatIndonesianDate, calculateRemainingDays } from '../utils/date';

interface SrikandiLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  onTriggerNotify: (channel: 'WHATSAPP' | 'EMAIL') => void;
}

export const SrikandiLetterModal: React.FC<SrikandiLetterModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onTriggerNotify,
}) => {
  if (!isOpen) return null;

  const letter = inspection.srikandiLetter;
  const sla = calculateRemainingDays(letter.deadlineDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-100">
      <div className="bg-white flex flex-col w-full h-full overflow-hidden">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-white text-[#1e3a5f] px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-blue-200/80 shrink-0">
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
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-sm font-bold">Dokumen Surat Tindak Lanjut SRIKANDI TTE</span>
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#e8f1fb] text-slate-700 border border-blue-200">
                Terverifikasi BSrE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerNotify('WHATSAPP')}
              type="button"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kirim ulang notifikasi WhatsApp resmi"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim WA</span>
            </button>
            <button
              onClick={() => onTriggerNotify('EMAIL')}
              type="button"
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kirim ulang notifikasi Email dinas"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim Email</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-[#e8f1fb] hover:bg-[#d0e2f5] text-[#1e3a5f] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Surat</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-600 hover:text-[#1e3a5f] rounded-lg hover:bg-[#e8f1fb] transition-colors cursor-pointer"
              title="Tutup Halaman (Kembali ke Beranda)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container - Formatted as Official Indonesian Government Letter */}
        <div className="p-6 sm:p-12 text-slate-900 bg-slate-100 flex-1 overflow-y-auto font-serif flex justify-center">
          <div className="bg-white max-w-4xl w-full p-8 sm:p-12 shadow-sm border border-slate-200 rounded-xl my-2">
          
          {/* Official Letterhead (Kop Surat Instansi) */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center font-sans">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center p-1 font-bold text-[11px] text-center leading-tight">
                GARUDA
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900">
                  BADAN PENGAWAS OBAT DAN MAKANAN RI
                </h1>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                  DEPUTI BIDANG PENGAWASAN OBAT DAN KEFARMASIAN
                </h2>
                <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                  Jl. Percetakan Negara No. 23, Jakarta Pusat 10560 | Telp: (021) 4244691 | Email: was.simoncer@pom.go.id
                </p>
              </div>
            </div>
          </div>

          {/* Letter Meta */}
          <div className="font-sans text-xs sm:text-sm space-y-1 mb-6">
            <div className="flex justify-between items-start">
              <table className="w-auto">
                <tbody>
                  <tr>
                    <td className="w-20 font-semibold text-slate-700 py-0.5">Nomor</td>
                    <td className="w-4 text-center">:</td>
                    <td className="font-bold font-mono text-slate-900">{letter.letterNo}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 py-0.5">Sifat</td>
                    <td className="text-center">:</td>
                    <td className="font-medium text-slate-900">Segera (Penting)</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 py-0.5">Lampiran</td>
                    <td className="text-center">:</td>
                    <td className="font-medium text-slate-900">1 (satu) Berkas Lembar Hasil Temuan</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 py-0.5">Perihal</td>
                    <td className="text-center">:</td>
                    <td className="font-bold text-slate-900">
                      {letter.subject}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="text-right text-slate-800 font-medium">
                Jakarta, {formatIndonesianDate(letter.issuedDate)}
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="font-sans text-xs sm:text-sm mb-6 space-y-1">
            <p className="text-slate-700">Kepada Yth.</p>
            <p className="font-bold text-slate-900">{inspection.facility.picName}</p>
            <p className="font-bold text-slate-900">{inspection.facility.name}</p>
            <p className="text-slate-600 max-w-md">{inspection.facility.address}</p>
          </div>

          {/* Body Paragraphs */}
          <div className="font-serif text-xs sm:text-sm leading-relaxed space-y-3 text-slate-800 text-justify mb-6">
            <p>
              Sehubungan dengan telah dilaksanakannya kegiatan pemeriksaan rutin pengawasan fasilitas kefarmasian pada tanggal <strong>{formatIndonesianDate(inspection.inspectionDate)}</strong> dengan ruang lingkup: <em>"{inspection.inspectionScope}"</em>, bersama ini kami sampaikan resume temuan ketidaksesuaian yang memerlukan tindakan perbaikan dan pencegahan (CAPA).
            </p>
            <p>
              Adapun rincian temuan hasil pemeriksaan yang wajib ditindaklanjuti secara komprehensif adalah sebagai berikut:
            </p>
          </div>

          {/* Findings Table */}
          <div className="font-sans mb-6 overflow-x-auto">
            <table className="w-full text-xs border border-slate-400">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                <tr>
                  <th className="p-2 border-r border-slate-400 w-10 text-center">No</th>
                  <th className="p-2 border-r border-slate-400 w-24 text-center">Kategori</th>
                  <th className="p-2 border-r border-slate-400 w-52 text-left">Klausul Regulasi</th>
                  <th className="p-2 text-left">Deskripsi Temuan Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {inspection.findings.map((finding, idx) => (
                  <tr key={finding.id} className="align-top">
                    <td className="p-2.5 text-center font-bold border-r border-slate-300">{idx + 1}</td>
                    <td className="p-2.5 text-center border-r border-slate-300">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          finding.category === 'KRITIS'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : finding.category === 'MAYOR'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {finding.category}
                      </span>
                    </td>
                    <td className="p-2.5 font-semibold text-slate-800 border-r border-slate-300">
                      {finding.clause}
                    </td>
                    <td className="p-2.5 text-slate-700 leading-normal">
                      {finding.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Requirements & Deadline SLA */}
          <div className="font-serif text-xs sm:text-sm leading-relaxed space-y-3 text-slate-800 text-justify mb-8">
            <p>
              Berdasarkan peraturan perundang-undangan yang berlaku, Saudara diwajibkan untuk menyusun dokumen <strong>Corrective and Preventive Action (CAPA)</strong> yang memuat analisis akar masalah (root cause analysis), tindakan perbaikan langsung, serta tindakan pencegahan agar temuan serupa tidak berulang, disertai dengan bukti-bukti pendukung yang sah (foto perbaikan, dokumen SOP yang telah direvisi, sertifikat kalibrasi, dsb).
            </p>
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg font-sans text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <Clock className="w-4 h-4 text-amber-700" />
                Instruksi Pengunggahan & Batas Waktu Tindak Lanjut:
              </div>
              <p className="text-amber-800">
                Laporan CAPA wajib disampaikan melalui portal aplikasi <strong>SIMONCER</strong> menggunakan Kode Unik Pelacakan: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-400">{inspection.capaCode}</strong> paling lambat tanggal <strong>{formatIndonesianDate(letter.deadlineDate)}</strong> ({letter.deadlineDays} hari kerja terhitung sejak tanggal surat tindak lanjut pertama kali diterima oleh sarana).
              </p>
            </div>
            <p>
              Demikian surat tindak lanjut ini disampaikan untuk dilaksanakan dengan penuh tanggung jawab demi menjamin mutu, keamanan, dan kepatuhan fasilitas.
            </p>
          </div>

          {/* SRIKANDI TTE Signature Block (Electronic Signature Certificate BSrE) */}
          <div className="font-sans flex justify-end mt-8 break-inside-avoid">
            <div className="w-80 p-4 border border-slate-300 rounded-xl bg-slate-50 text-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <span className="font-bold text-[11px] text-slate-800 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Sertifikat TTE Resmi (BSrE)
                </span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  TERVERIFIKASI
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white rounded border border-slate-300 shrink-0 text-center">
                  <QrCode className="w-16 h-16 text-slate-900 mx-auto" />
                  <span className="text-[8px] font-mono text-slate-500 block mt-0.5">SRIKANDI RI</span>
                </div>

                <div className="space-y-1 text-slate-700 text-[11px]">
                  <p className="font-semibold text-slate-900 leading-tight">
                    {letter.signerPosition}
                  </p>
                  <p className="font-bold text-emerald-800">
                    {letter.signerName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    NIP. {letter.signerNip}
                  </p>
                  <p className="text-[9px] text-slate-600 font-mono truncate">
                    ID: {letter.tteId}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[9px] text-slate-500 text-center leading-tight">
                Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Sertifikasi Elektronik (BSrE), BSSN.
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Footer info in modal */}
        <div className="no-print bg-slate-100 px-6 py-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Kode Pelacakan:</span>
            <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-300">
              {inspection.capaCode}
            </span>
          </div>
          <div className="text-slate-500">
            Terhubung otomatis dengan Notifikasi WhatsApp & Email SIMONCER
          </div>
        </div>
      </div>
    </div>
  );
};
