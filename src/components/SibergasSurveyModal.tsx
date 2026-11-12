import React from 'react';
import { InspectionSession, SibergasSurveyData } from '../types';
import { SibergasSurveyForm } from './SibergasSurveyForm';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SibergasSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionSession;
  onSaveSurvey?: (surveyData: SibergasSurveyData) => void;
  readOnly?: boolean;
  isFirstTimeCapaSubmission?: boolean;
}

export const SibergasSurveyModal: React.FC<SibergasSurveyModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onSaveSurvey,
  readOnly = false,
  isFirstTimeCapaSubmission = false,
}) => {
  if (!isOpen) return null;

  const handleComplete = (surveyData: SibergasSurveyData) => {
    if (onSaveSurvey) {
      onSaveSurvey(surveyData);
    }
  };

  const isFirstTime = isFirstTimeCapaSubmission || !inspection.sibergasSurvey?.completed;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-300 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bpom-hero-gradient text-[#1e3a5f] p-4 sm:p-5 flex items-center justify-between border-b border-blue-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#1e3a5f]">
                  {readOnly ? 'Hasil Survei Integritas Petugas' : 'Survei Integritas & Kepuasan (SIBERGAS)'}
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-500/50 font-bold">
                  {inspection.capaCode}
                </span>
                {isFirstTime && !readOnly && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/40 font-bold">
                    Prasyarat CAPA Pertama
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                {inspection.facility.name} • Balai Besar Pengawas Obat dan Makanan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-[#1e3a5f] rounded-xl hover:bg-[#e8f1fb] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {isFirstTime && !readOnly && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Langkah Wajib Sebelum Unggah CAPA Pertama:</strong>
                <span>
                  Sesuai ketentuan Zona Integritas (WBK/WBBM), sebelum mengisi formulir perbaikan CAPA untuk pertama kali, sarana diwajibkan mengisi 7 butir kuesioner integritas petugas pemeriksa berikut. Setelah disimpan, Anda akan langsung diarahkan ke formulir pengiriman CAPA. Jika di masa mendatang Anda mengirimkan CAPA kedua/perbaikan lanjutan, survei ini tidak akan muncul kembali.
                </span>
              </div>
            </div>
          )}

          <SibergasSurveyForm
            inspection={inspection}
            initialData={inspection.sibergasSurvey}
            readOnly={readOnly}
            onComplete={handleComplete}
            onCancel={onClose}
            submitButtonLabel={readOnly ? 'Tutup' : isFirstTime ? 'Simpan Jawaban & Lanjut ke Form CAPA →' : 'Simpan Perubahan Jawaban Survei'}
          />
        </div>
      </div>
    </div>
  );
};
