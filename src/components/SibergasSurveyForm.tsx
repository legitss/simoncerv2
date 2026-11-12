import React, { useState } from 'react';
import { InspectionSession, SibergasSurveyData } from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  UserCheck, 
  Calendar, 
  FileText, 
  Award, 
  Info,
  Check,
  MessageSquare
} from 'lucide-react';
import { formatIndonesianDate } from '../utils/date';

interface SibergasSurveyFormProps {
  inspection: InspectionSession;
  initialData?: SibergasSurveyData;
  readOnly?: boolean;
  onComplete?: (surveyData: SibergasSurveyData) => void;
  onCancel?: () => void;
  submitButtonLabel?: string;
}

export const SURVEY_QUESTIONS = [
  {
    id: 'petugasIdCard',
    number: 1,
    question: 'Apakah petugas menunjukkan Surat Tugas atau memakai ID pada saat melaksanakan kegiatan?',
    required: true,
    options: [
      {
        value: 'Ya, Petugas menunjukkan Surat Tugas/ID card',
        label: 'Ya, Petugas menunjukkan Surat Tugas/ID card',
        positive: true,
      },
      {
        value: 'Tidak, Petugas tidak menunjukkan Surat Tugas/ID card',
        label: 'Tidak, Petugas tidak menunjukkan Surat Tugas/ID card',
        positive: false,
      },
    ],
  },
  {
    id: 'profesional',
    number: 2,
    question: 'Apakah petugas bersikap profesional dalam melaksanakan tugas?',
    required: true,
    options: [
      {
        value: 'Ya, Petugas berperilaku sopan',
        label: 'Ya, Petugas berperilaku sopan',
        positive: true,
      },
      {
        value: 'Tidak, Petugas berperilaku tidak sopan',
        label: 'Tidak, Petugas berperilaku tidak sopan',
        positive: false,
      },
    ],
  },
  {
    id: 'arogan',
    number: 3,
    question: 'Apakah petugas bersikap arogan dalam melaksanakan tugas?',
    required: true,
    options: [
      {
        value: 'Ya, Petugas bersikap arogan',
        label: 'Ya, Petugas bersikap arogan',
        positive: false,
      },
      {
        value: 'Tidak, Petugas tidak bersikap arogan',
        label: 'Tidak, Petugas tidak bersikap arogan',
        positive: true,
      },
    ],
  },
  {
    id: 'gratifikasi',
    number: 4,
    question: 'Apakah petugas meminta/menerima imbalan uang/barang/gratifikasi dalam melaksanakan tugas?',
    required: true,
    options: [
      {
        value: 'Ya, Petugas menerima gratifikasi',
        label: 'Ya, Petugas menerima gratifikasi',
        positive: false,
      },
      {
        value: 'Tidak, Petugas tidak menerima gratifikasi',
        label: 'Tidak, Petugas tidak menerima gratifikasi',
        positive: true,
      },
    ],
  },
  {
    id: 'pemerasan',
    number: 5,
    question: 'Apakah petugas melakukan praktik pemerasan dalam melaksanakan tugas?',
    required: true,
    options: [
      {
        value: 'Ya, Petugas melakukan praktik pemerasan',
        label: 'Ya, Petugas melakukan praktik pemerasan',
        positive: false,
      },
      {
        value: 'Tidak, Petugas tidak melakukan praktik pemerasan',
        label: 'Tidak, Petugas tidak melakukan praktik pemerasan',
        positive: true,
      },
    ],
  },
  {
    id: 'simoncerMembantu',
    number: 6,
    question: 'Apakah aplikasi SIMONCER membantu proses pengiriman CAPA?',
    required: true,
    options: [
      {
        value: 'Ya, Membantu',
        label: 'Ya, Membantu',
        positive: true,
      },
      {
        value: 'Tidak, Tidak Membantu',
        label: 'Tidak, Tidak Membantu',
        positive: false,
      },
    ],
  },
];

export const SibergasSurveyForm: React.FC<SibergasSurveyFormProps> = ({
  inspection,
  initialData,
  readOnly = false,
  onComplete,
  onCancel,
  submitButtonLabel = 'Simpan & Lanjutkan ke Pengisian CAPA',
}) => {
  const [formData, setFormData] = useState<SibergasSurveyData>({
    completed: initialData?.completed ?? false,
    submittedAt: initialData?.submittedAt ?? '',
    petugasIdCard: initialData?.petugasIdCard ?? '',
    profesional: initialData?.profesional ?? '',
    arogan: initialData?.arogan ?? '',
    gratifikasi: initialData?.gratifikasi ?? '',
    pemerasan: initialData?.pemerasan ?? '',
    simoncerMembantu: initialData?.simoncerMembantu ?? '',
    saranaMasukan: initialData?.saranaMasukan ?? '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submittedError, setSubmittedError] = useState(false);

  const handleSelectOption = (questionId: keyof SibergasSurveyData, value: string) => {
    if (readOnly) return;
    setFormData((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setValidationErrors((prev) => prev.filter((id) => id !== questionId));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    setFormData((prev) => ({
      ...prev,
      saranaMasukan: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    const errors: string[] = [];
    SURVEY_QUESTIONS.forEach((q) => {
      const val = formData[q.id as keyof SibergasSurveyData];
      if (q.required && (!val || typeof val !== 'string' || !val.trim())) {
        errors.push(q.id);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSubmittedError(true);
      return;
    }

    const completedSurvey: SibergasSurveyData = {
      ...formData,
      completed: true,
      submittedAt: formData.submittedAt || new Date().toISOString(),
    };

    if (onComplete) {
      onComplete(completedSurvey);
    }
  };

  const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SIBERGAS Hero Header */}
      <div className="bpom-hero-gradient text-[#1e3a5f] p-5 rounded-2xl border border-emerald-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-md font-black shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#1e3a5f]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 tracking-wide uppercase">
                  Integrasi SIBERGAS
                </span>
                <span className="text-[10px] text-slate-600">
                  Zona Integritas WBK / WBBM
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#1e3a5f] tracking-tight mt-0.5">
                Survei Kepuasan & Integritas Petugas
              </h2>
            </div>
          </div>

          {readOnly && formData.submittedAt && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 text-xs flex items-center gap-1.5 font-medium self-start sm:self-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Telah Diisi: {formatIndonesianDate(formData.submittedAt.split('T')[0])}</span>
            </div>
          )}
        </div>

        {/* Survey Instructions */}
        <div className="mt-4 pt-3 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2 bg-white/85 p-2.5 rounded-xl border border-blue-200/80">
            <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Sarana Diperiksa:</span>
              <span className="font-semibold text-[#1e3a5f]">{inspection.facility.name}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-white/85 p-2.5 rounded-xl border border-blue-200/80">
            <UserCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Petugas Pemeriksa:</span>
              <span className="font-semibold text-[#1e3a5f]">{officerName}</span>
              {inspection.auditorTeam && inspection.auditorTeam.length > 0 && (
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Tim: {inspection.auditorTeam.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="mt-3 bg-emerald-50 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Pemberitahuan Wajib:</strong> Sesuai SOP Pelayanan Balai POM, sebelum mengirimkan dokumen tindak lanjut (CAPA) untuk pertama kali, sarana/pelaku usaha wajib mengisi survei integritas ini. Penilaian Anda dijamin <strong>kerahasiaannya</strong> dan tidak mempengaruhi hasil evaluasi teknis CAPA.
            </p>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {submittedError && validationErrors.length > 0 && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Mohon lengkapi seluruh pertanyaan survei bertanda bintang (*):</p>
            <p className="text-red-700 mt-0.5">
              Terdapat {validationErrors.length} pertanyaan yang belum Anda pilih jawabannya.
            </p>
          </div>
        </div>
      )}

      {/* Questions 1 - 6 */}
      <div className="space-y-4">
        {SURVEY_QUESTIONS.map((q) => {
          const isError = validationErrors.includes(q.id);
          const currentValue = formData[q.id as keyof SibergasSurveyData] as string;

          return (
            <div
              key={q.id}
              className={`p-4 bg-white rounded-2xl border transition-all ${
                isError
                  ? 'border-red-400 ring-2 ring-red-100 shadow-sm'
                  : currentValue
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {q.number}
                </span>
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {q.question} {q.required && <span className="text-red-600 font-bold">*</span>}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-8">
                {q.options.map((opt) => {
                  const isSelected = currentValue === opt.value;

                  return (
                    <label
                      key={opt.value}
                      onClick={() => handleSelectOption(q.id as keyof SibergasSurveyData, opt.value)}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        readOnly ? 'cursor-default' : 'hover:border-emerald-400 hover:bg-emerald-50/50'
                      } ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={isSelected}
                        disabled={readOnly}
                        onChange={() => {}}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="leading-snug">{opt.label}</span>
                    </label>
                  );
                })}
              </div>

              {isError && (
                <p className="text-[11px] text-red-600 font-medium pl-8 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pertanyaan ini wajib dijawab
                </p>
              )}
            </div>
          );
        })}

        {/* Question 7: Sarana / Masukan */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-start gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              7
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                Sarana / Masukan:
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Berikan masukan, saran, atau catatan lainnya untuk peningkatan kualitas pengawasan dan sistem SIMONCER.
              </p>
            </div>
          </div>

          <div className="pl-8 mt-2">
            <textarea
              rows={3}
              value={formData.saranaMasukan}
              onChange={handleTextChange}
              disabled={readOnly}
              placeholder={readOnly ? '(Tidak ada saran/masukan tambahan)' : 'Tuliskan saran atau masukan Anda di sini (opsional)...'}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all text-slate-800 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Data survei akan otomatis tersimpan dalam berkas audit sesi CAPA ini.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitButtonLabel}</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
