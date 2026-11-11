import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionSession, FindingItem } from '../types';
import { formatIndonesianDate, calculateRemainingDays } from './date';
import { getCommodityMatrixConfig, CommodityMatrixColumn } from './commodityMatrix';

/**
 * Helper to get clean cell text matching the official commodity matrix form
 */
function getCellTextForColumn(
  col: CommodityMatrixColumn,
  finding: FindingItem,
  idx: number,
  inspection: InspectionSession
): string {
  const capa = finding.capa;

  switch (col.id) {
    case 'no':
      return `${idx + 1}`;

    case 'finding':
      let findingText = `${finding.clause}\n\n${finding.description}`;
      if (finding.initialEvidenceDescription) {
        findingText += `\n(Observasi: ${finding.initialEvidenceDescription})`;
      }
      return findingText;

    case 'classification':
      return `[${finding.category}]`;

    case 'requirement':
      return capa.requirement || finding.clause || '-';

    case 'currentCondition':
      return capa.currentCondition || finding.description || '-';

    case 'gapAnalysis':
      return capa.gapAnalysis || 'Belum diisi sarana';

    case 'rootCause':
      return capa.rootCauseAnalysis || 'Belum diisi sarana';

    case 'impact':
      return capa.impact || 'Belum diisi sarana';

    case 'capa':
      return `Tindakan Perbaikan (CA):\n${capa.correctiveAction || '-'}\n\nTindakan Pencegahan (PA):\n${capa.preventiveAction || '-'}`;

    case 'capaCombined':
      return `Tindakan Perbaikan (CA):\n${capa.correctiveAction || '-'}\n\nTindakan Pencegahan (PA):\n${capa.preventiveAction || '-'}`;

    case 'deadlineStatus':
      const dDate = capa.targetCompletionDate
        ? formatIndonesianDate(capa.targetCompletionDate)
        : inspection.srikandiLetter.deadlineDate;
      const dStat =
        capa.progressStatus ||
        (capa.evaluationStatus === 'MEMADAI' ? 'Sudah Selesai' : 'Dalam Proses');
      return `${dDate}\nStatus: ${dStat}`;

    case 'deadline':
      return capa.targetCompletionDate
        ? formatIndonesianDate(capa.targetCompletionDate)
        : inspection.srikandiLetter.deadlineDate;

    case 'status':
      return (
        capa.progressStatus ||
        (capa.evaluationStatus === 'MEMADAI' ? 'Sudah Selesai' : 'Dalam Proses')
      );

    case 'pic':
      return capa.pic || inspection.facility.picName;

    case 'evidence':
      const docNo = capa.evidenceDocNumber ? `No. Dok: ${capa.evidenceDocNumber}\n` : '';
      const driveLink = capa.evidenceDriveUrl ? `Drive: ${capa.evidenceDriveUrl}\n` : '';
      const files =
        capa.evidenceFiles && capa.evidenceFiles.length > 0
          ? capa.evidenceFiles.map((f) => `• ${f.name}`).join('\n')
          : (capa.evidenceDriveUrl ? 'Tautan Cloud Drive Terlampir' : 'Belum ada berkas terlampir');
      return `${docNo}${driveLink}${files}`;

    case 'evaluationResult':
      return `Status: ${capa.evaluationStatus || 'PENDING'}${
        capa.evaluatorNotes ? '\nCatatan Balai:\n' + capa.evaluatorNotes : ''
      }`;

    default:
      return '-';
  }
}

/**
 * 1. GENERATE OFFICIAL SUMMARY REPORT PDF (Laporan Rekap & Matriks Komoditi Lengkap)
 * Using Landscape orientation to ensure all official commodity columns fit perfectly.
 */
export async function generateInspectionSummaryPDF(inspection: InspectionSession): Promise<void> {
  const matrixConfig = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // 1. Kop Surat Resmi BBPOM di Semarang
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BADAN PENGAWAS OBAT DAN MAKANAN REPUBLIK INDONESIA', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl Sukun Raya No 41 A Banyumanik Semarang | Telp: (024) 7612305 | Email: bbpom_semarang@pom.go.id', pageWidth / 2, 20, { align: 'center' });

  // Double horizontal divider line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(margin, 22.5, pageWidth - margin, 22.5);
  doc.setLineWidth(0.25);
  doc.line(margin, 23.5, pageWidth - margin, 23.5);

  // 2. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN REKAPITULASI EVALUASI & MATRIKS TINDAK LANJUT CAPA', pageWidth / 2, 29, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text(`FORMAT STANDAR RESMI: ${matrixConfig.title}`, pageWidth / 2, 33, { align: 'center' });

  // 3. Meta Information Box
  const sla = calculateRemainingDays(inspection.srikandiLetter.deadlineDate);

  autoTable(doc, {
    startY: 36,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42, textColor: [71, 85, 105] },
      1: { cellWidth: 92 },
      2: { fontStyle: 'bold', cellWidth: 42, textColor: [71, 85, 105] },
      3: { cellWidth: 96 },
    },
    body: [
      [
        'Kode Unik CAPA',
        `: ${inspection.capaCode}`,
        'Status Sesi Evaluasi',
        `: ${inspection.status.replace(/_/g, ' ')}`,
      ],
      [
        'Surat SRIKANDI (TTE)',
        `: ${inspection.srikandiLetter.letterNo}`,
        'Tanggal Surat Srikandi',
        `: ${formatIndonesianDate(inspection.srikandiLetter.issuedDate)}`,
      ],
      [
        'Nama Sarana / Fasilitas',
        `: ${inspection.facility.name}`,
        'Jenis Fasilitas / Komoditi',
        `: ${inspection.facility.type} (${matrixConfig.codeStandard})`,
      ],
      [
        'Nomor Izin / NIB',
        `: ${inspection.facility.licenseNo}`,
        'PIC / APJ Sarana',
        `: ${inspection.facility.picName} (${inspection.facility.picPhone})`,
      ],
      [
        'Alamat Fasilitas',
        `: ${inspection.facility.address}`,
        'Batas Tindak Lanjut (SLA)',
        `: ${formatIndonesianDate(inspection.srikandiLetter.deadlineDate)} (${sla.text})`,
      ],
      [
        'Petugas / Lead Auditor BBPOM',
        `: ${inspection.assignedOfficer?.name || inspection.leadAuditor}`,
        'Tanggal Pemeriksaan',
        `: ${formatIndonesianDate(inspection.inspectionDate)}`,
      ],
    ],
  });

  let currentY = (doc as any).lastAutoTable.finalY + 3;

  // 4. Statistics Banner
  const totalFindings = inspection.findings.length;
  const countKritis = inspection.findings.filter((f) => f.category === 'KRITIS').length;
  const countMayor = inspection.findings.filter((f) => f.category === 'MAYOR').length;
  const countMinor = inspection.findings.filter((f) => f.category === 'MINOR').length;
  const countAccepted = inspection.findings.filter((f) => f.capa.evaluationStatus === 'MEMADAI').length;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 7.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Statistik Temuan: ${totalFindings} Butir  |  Kritis: ${countKritis}  |  Mayor: ${countMayor}  |  Minor: ${countMinor}  |  Evaluasi Memadai (Diterima): ${countAccepted}/${totalFindings}`,
    margin + 3,
    currentY + 5
  );

  currentY += 10.5;

  // 5. OFFICIAL COMMODITY MATRIX TABLE SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`A. MATRIKS TINDAK LANJUT PERBAIKAN (CAPA) - FORMULIR KOMODITI: ${matrixConfig.title}`, margin, currentY);

  // Build columns dynamically from matrixConfig
  const headColumns: string[] = [];
  const activeCols = [...matrixConfig.columns];

  // If evaluationResult is not in columns, add it as the final column so evaluator notes are clearly visible
  if (!activeCols.some((c) => c.id === 'evaluationResult')) {
    activeCols.push({
      id: 'evaluationResult',
      label: 'Evaluasi & Catatan Balai',
    });
  }

  activeCols.forEach((col) => {
    headColumns.push(col.label);
  });

  const matrixBodyRows = inspection.findings.map((f, idx) => {
    return activeCols.map((col) => getCellTextForColumn(col, f, idx, inspection));
  });

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: margin, right: margin },
    head: [headColumns],
    body: matrixBodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      valign: 'top',
    },
    styles: {
      overflow: 'linebreak',
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check if new page is needed for Conclusion & Signatures
  if (currentY + 45 > pageHeight) {
    doc.addPage();
    currentY = 18;
  }

  // 6. Evaluator Conclusion Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('B. KESIMPULAN EVALUASI & TINDAK LANJUT TIM PEMERIKSA BALAI', margin, currentY);

  const evalReport = inspection.evaluationReport;
  const conclusions =
    evalReport?.overallConclusion ||
    evalReport?.notes ||
    (inspection.status === 'TERVALIDASI' || inspection.status === 'SELESAI_CLOSED'
      ? 'Seluruh perbaikan dan bukti pencegahan telah diverifikasi oleh tim evaluator BBPOM di Semarang dan dinyatakan MEMENUHI SYARAT (Memadai / Tervalidasi).'
      : inspection.status === 'PERLU_PERBAIKAN'
      ? 'Terdapat butir CAPA yang belum memadai. Sarana diminta melengkapi bukti perbaikan lanjutan.'
      : 'Dokumen CAPA sarana sedang dalam proses telaah dan uji sampling bukti oleh tim evaluator.');

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    body: [
      [
        'Nomor Berita Acara Evaluasi',
        `: ${evalReport?.reportNo || 'BA-EVAL-' + inspection.capaCode}`,
        'Tanggal Evaluasi',
        `: ${evalReport?.evaluatedAt ? formatIndonesianDate(evalReport.evaluatedAt) : formatIndonesianDate(new Date().toISOString())}`,
      ],
      [
        'Catatan / Rekomendasi Balai',
        `: ${conclusions}`,
        'Status Akhir Sesi',
        `: ${inspection.status.replace(/_/g, ' ')}`,
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check page break for Signatures
  if (currentY + 35 > pageHeight) {
    doc.addPage();
    currentY = 18;
  }

  // 7. Official Signatures
  const leftX = margin + 25;
  const rightX = pageWidth - margin - 85;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(matrixConfig.signatureLeft || 'Pihak Sarana / Penanggung Jawab,', leftX, currentY);
  doc.text(inspection.facility.name, leftX, currentY + 3.5);

  doc.text('Semarang, ' + formatIndonesianDate(new Date().toISOString()), rightX, currentY);
  doc.text(matrixConfig.signatureRight || 'Ketua Tim Pemeriksa BBPOM di Semarang,', rightX, currentY + 3.5);

  const signGapY = currentY + 20;
  doc.setFont('helvetica', 'bold');
  doc.text(inspection.facility.picName, leftX, signGapY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`NIB / Izin: ${inspection.facility.licenseNo}`, leftX, signGapY + 3);

  const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;
  const officerNip = inspection.assignedOfficer?.nip ? `NIP. ${inspection.assignedOfficer.nip}` : 'Pengawas Farmasi & Makanan';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(officerName, rightX, signGapY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(officerNip, rightX, signGapY + 3);

  const fileName = `Laporan_Resmi_CAPA_${inspection.capaCode}_${inspection.facility.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * 2. GENERATE LAMPIRAN MATRIKS CAPA TERBENTUK (PDF RESMI UNTUK LAMPIRAN SRIKANDI)
 * This is the exact official matrix attachment that the evaluator/officer downloads 
 * to attach to SRIKANDI for electronic signature (TTE).
 */
export async function generateCommodityMatrixAttachmentPDF(inspection: InspectionSession): Promise<void> {
  const matrixConfig = getCommodityMatrixConfig(
    inspection.facility.type,
    inspection.facility.name,
    inspection.inspectionScope
  );

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // 1. Kop Resmi BBPOM
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('BADAN PENGAWAS OBAT DAN MAKANAN REPUBLIK INDONESIA', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl Sukun Raya No 41 A Banyumanik Semarang | Telp: (024) 7612305', pageWidth / 2, 20, { align: 'center' });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, 22.5, pageWidth - margin, 22.5);
  doc.setLineWidth(0.2);
  doc.line(margin, 23.3, pageWidth - margin, 23.3);

  // 2. Title Section (Lampiran Dokumen Pengantar TTE SRIKANDI)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('LAMPIRAN NASKAH DINAS EVALUASI CAPA / SURAT PENGANTAR SRIKANDI TTE', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(matrixConfig.title, pageWidth / 2, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Acuan Regulasi: ${matrixConfig.codeStandard} • Kode Unik CAPA: ${inspection.capaCode} • Surat SRIKANDI: ${inspection.srikandiLetter.letterNo}`,
    pageWidth / 2,
    37.5,
    { align: 'center' }
  );

  // 3. Metadata Header Fields (sesuai format formulir resmi PDF BPOM)
  autoTable(doc, {
    startY: 40,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1, textColor: [15, 23, 42] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 46, textColor: [71, 85, 105] },
      1: { cellWidth: 90 },
      2: { fontStyle: 'bold', cellWidth: 46, textColor: [71, 85, 105] },
      3: { cellWidth: 90 },
    },
    body: [
      [
        matrixConfig.headerFields[0]?.label || 'Nama Sarana',
        `: ${inspection.facility.name}`,
        matrixConfig.headerFields[2]?.label || 'Tujuan Pemeriksaan',
        `: ${inspection.inspectionScope}`,
      ],
      [
        matrixConfig.headerFields[1]?.label || 'Alamat Sarana',
        `: ${inspection.facility.address}`,
        matrixConfig.headerFields[3]?.label || 'Tanggal Pemeriksaan',
        `: ${formatIndonesianDate(inspection.inspectionDate)}`,
      ],
      [
        'Nomor Izin / NIB',
        `: ${inspection.facility.licenseNo}`,
        'Surat SRIKANDI (TTE Asal)',
        `: ${inspection.srikandiLetter.letterNo}`,
      ],
    ],
  });

  let currentY = (doc as any).lastAutoTable.finalY + 3;

  // 4. THE OFFICIAL COMMODITY MATRIX TABLE
  const activeCols = [...matrixConfig.columns];
  if (!activeCols.some((c) => c.id === 'evaluationResult')) {
    activeCols.push({
      id: 'evaluationResult',
      label: 'Evaluasi & Catatan Balai',
    });
  }

  const headColumns = activeCols.map((c) => c.label);
  const bodyRows = inspection.findings.map((f, idx) => {
    return activeCols.map((c) => getCellTextForColumn(c, f, idx, inspection));
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [headColumns],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      valign: 'top',
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 5. Notes / Petunjuk Pengisian Resmi
  if (matrixConfig.notes && matrixConfig.notes.length > 0) {
    if (currentY + 25 > pageHeight) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Catatan & Ketentuan Standar Formulir:', margin, currentY);
    currentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);

    matrixConfig.notes.slice(0, 5).forEach((note) => {
      doc.text(note, margin, currentY);
      currentY += 2.8;
    });
    currentY += 3;
  }

  // 6. Signature Blocks
  if (currentY + 32 > pageHeight) {
    doc.addPage();
    currentY = 18;
  }

  const leftX = margin + 25;
  const rightX = pageWidth - margin - 85;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(matrixConfig.signatureLeft, leftX, currentY);
  doc.text(inspection.facility.name, leftX, currentY + 3.5);

  doc.text('Semarang, ' + formatIndonesianDate(new Date().toISOString()), rightX, currentY);
  doc.text(matrixConfig.signatureRight, rightX, currentY + 3.5);

  const signGapY = currentY + 18;
  doc.setFont('helvetica', 'bold');
  doc.text(inspection.facility.picName, leftX, signGapY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`NIB / Izin: ${inspection.facility.licenseNo}`, leftX, signGapY + 3);

  const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;
  const officerNip = inspection.assignedOfficer?.nip ? `NIP. ${inspection.assignedOfficer.nip}` : 'Pengawas Farmasi & Makanan';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(officerName, rightX, signGapY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(officerNip, rightX, signGapY + 3);

  const fileName = `Lampiran_Matriks_CAPA_${inspection.capaCode}_${inspection.facility.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * 3. GENERATE SURAT PENGANTAR HASIL EVALUASI CAPA (NOTA DINAS TTE SRIKANDI)
 * Official cover letter (Nota Dinas / Surat Pengantar) used to accompany 
 * the Matriks CAPA when submitting to SRIKANDI for electronic signature.
 * Automatically adapts content based on Open vs Close findings count.
 */
export async function generateSrikandiCoverLetterPDF(
  inspection: InspectionSession,
  stageCycle: number = 1
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  const totalFindings = inspection.findings.length;
  const totalClosed = inspection.findings.filter((f) => f.capa.evaluationStatus === 'MEMADAI').length;
  const totalOpen = inspection.findings.filter((f) => f.capa.evaluationStatus !== 'MEMADAI').length;
  const isClosed = totalOpen === 0 && totalFindings > 0;

  // Kop Dinas Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('BADAN PENGAWAS OBAT DAN MAKANAN', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG', pageWidth / 2, 23, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl Sukun Raya No 41 A Banyumanik Semarang | Telp: (024) 7612305', pageWidth / 2, 27.5, { align: 'center' });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, 30.5, pageWidth - margin, 30.5);
  doc.setLineWidth(0.3);
  doc.line(margin, 31.5, pageWidth - margin, 31.5);

  // Title: Adapt based on Open vs Close findings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const letterTitle = isClosed
    ? 'NOTA DINAS PENGANTAR PERSETUJUAN & PENUTUPAN CAPA (SELESAI / CLOSED)'
    : `NOTA DINAS PENGANTAR HASIL EVALUASI CAPA (PERMINTAAN PERBAIKAN TAHAP KE-${stageCycle})`;
  doc.text(letterTitle, pageWidth / 2, 40, { align: 'center' });

  const coverLetterNo =
    inspection.srikandiWorkflow?.signedDocumentNo ||
    inspection.srikandiWorkflow?.coverLetterNo ||
    `PW.01.02.3.33.09.26.${inspection.capaCode.replace('CAPA-', '')}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nomor: ${coverLetterNo}`, pageWidth / 2, 45, { align: 'center' });

  const halText =
    inspection.srikandiWorkflow?.signedDocumentSubject
      ? `: ${inspection.srikandiWorkflow.signedDocumentSubject}`
      : isClosed
      ? `: Penyampaian Hasil Evaluasi & Rekomendasi Penutupan Resmi CAPA Sarana ${inspection.facility.name} (${inspection.capaCode})`
      : `: Penyampaian Hasil Evaluasi CAPA Tahap ke-${stageCycle} & Permintaan Perbaikan Lanjutan Sarana ${inspection.facility.name} (${inspection.capaCode})`;

  // Letter Metadata Table
  autoTable(doc, {
    startY: 52,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 140 },
    },
    body: [
      ['Yth.', ': Kepala Balai Besar Pengawas Obat dan Makanan di Semarang'],
      ['Dari', `: Tim Evaluator / Pemeriksa Sarana (${inspection.assignedOfficer?.name || inspection.leadAuditor})`],
      ['Tanggal', `: ${formatIndonesianDate(new Date().toISOString())}`],
      ['Sifat', ': Biasa / Segera'],
      ['Lampiran', ': 1 (satu) Berkas Matriks CAPA Komoditi Terbentuk'],
      ['Hal', halText],
    ],
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Body Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const introText =
    `Sehubungan dengan hasil pemeriksaan sarana ${inspection.facility.type} atas ${inspection.facility.name} ` +
    `yang beralamat di ${inspection.facility.address}, serta surat tindak lanjut terdahulu Nomor: ${inspection.srikandiLetter.letterNo}, ` +
    `bersama ini kami sampaikan laporan dan matriks hasil evaluasi Corrective and Preventive Action (CAPA) yang telah dibentuk ` +
    `melalui Sistem Monitoring & Evaluasi CAPA Terintegrasi (SIMONCER).`;

  const lines = doc.splitTextToSize(introText, pageWidth - margin * 2);
  doc.text(lines, margin, currentY);
  currentY += lines.length * 5 + 4;

  const pointsText = isClosed
    ? [
        `1. Sarana telah menyampaikan dokumen pemenuhan CAPA untuk seluruh ${totalFindings} butir temuan ketidaksesuaian.`,
        `2. Tim Evaluator telah melakukan telaah administratif dan teknis, dengan hasil SELURUH ${totalFindings} BUTIR TELAH MEMENUHI PERSYARATAN (CLOSE / 100% TUNTAS).`,
        `3. Status rekomendasi akhir sesi adalah: SELESAI / CLOSED (Tuntas - Bebas Temuan Open).`,
        `4. Matriks lengkap pemenuhan tindakan perbaikan dan bukti dukung terlampir sebagai dasar pertimbangan penutupan resmi.`,
      ]
    : [
        `1. Sarana telah menyampaikan dokumen perbaikan CAPA untuk ${totalFindings} butir temuan ketidaksesuaian.`,
        `2. Tim Evaluator telah melakukan verifikasi berkas dengan hasil: ${totalClosed} butir disetujui (Close), namun MASIH TERDAPAT ${totalOpen} BUTIR BERSTATUS OPEN (Belum Memadai / Perlu Revisi).`,
        `3. Status rekomendasi sesi ini adalah: PERLU PERBAIKAN (Evaluasi Ulang Tahap ke-${stageCycle}).`,
        `4. Sarana diwajibkan melengkapi kekurangan bukti dukung untuk ${totalOpen} butir temuan Open tersebut melalui portal SIMONCER sebelum batas waktu yang ditentukan.`,
      ];

  pointsText.forEach((p) => {
    const plines = doc.splitTextToSize(p, pageWidth - margin * 2);
    doc.text(plines, margin, currentY);
    currentY += plines.length * 4.8;
  });

  currentY += 4;
  const closingText = isClosed
    ? `Demikian naskah dinas dan lampiran matriks CAPA ini kami susun untuk dimohonkan perkenan penandatanganan secara elektronik (TTE) ` +
      `Surat Persetujuan & Penutupan CAPA melalui aplikasi SRIKANDI (srikandi.arsip.go.id). Atas arahan dan perkenan Bapak/Ibu Kepala Balai, kami ucapkan terima kasih.`
    : `Demikian naskah dinas pengantar evaluasi ulang dan lampiran matriks CAPA ini kami susun untuk dimohonkan perkenan penandatanganan secara elektronik (TTE) ` +
      `melalui aplikasi SRIKANDI (srikandi.arsip.go.id) untuk kemudian disampaikan kepada sarana. Atas arahan dan perkenan Bapak/Ibu Kepala Balai, kami ucapkan terima kasih.`;

  const clines = doc.splitTextToSize(closingText, pageWidth - margin * 2);
  doc.text(clines, margin, currentY);
  currentY += clines.length * 5 + 16;

  // Sign-off
  const signX = pageWidth - margin - 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Ketua Tim Evaluator BBPOM di Semarang,', signX, currentY);

  currentY += 22;
  const officerName = inspection.assignedOfficer?.name || inspection.leadAuditor;
  const officerNip = inspection.assignedOfficer?.nip ? `NIP. ${inspection.assignedOfficer.nip}` : 'Pengawas Farmasi & Makanan';

  doc.text(officerName, signX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(officerNip, signX, currentY + 3.5);

  const fileName = isClosed
    ? `Surat_Pengantar_Penutupan_CAPA_Closed_${inspection.capaCode}.pdf`
    : `Surat_Pengantar_Evaluasi_Ulang_Tahap_${stageCycle}_${inspection.capaCode}.pdf`;
  doc.save(fileName);
}

/**
 * 4. GENERATE LEMBAR HASIL EVALUASI CAPA RESMI (LAMPIRAN NASKAH DINAS SRIKANDI)
 * Digunakan oleh Petugas/Evaluator setelah selesai mengevaluasi dokumen CAPA,
 * diunduh untuk dimasukkan ke aplikasi SRIKANDI oleh Admin sebagai lampiran naskah dinas resmi.
 */
export async function generateCapaEvaluationReportPDF(
  inspection: InspectionSession,
  evalData?: {
    reportNo?: string;
    evaluatorName?: string;
    evaluatorNip?: string;
    conclusion?: string;
    finalStatus?: string;
    stageCycle?: number;
  }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // 1. Kop Surat Resmi BBPOM di Semarang
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('BADAN PENGAWAS OBAT DAN MAKANAN REPUBLIK INDONESIA', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl Sukun Raya No 41 A Banyumanik Semarang | Telp: (024) 7612305 | Email: bbpom_semarang@pom.go.id', pageWidth / 2, 20, { align: 'center' });

  // Divider lines
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.65);
  doc.line(margin, 22.5, pageWidth - margin, 22.5);
  doc.setLineWidth(0.2);
  doc.line(margin, 23.3, pageWidth - margin, 23.3);

  // 2. Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BERITA ACARA & LEMBAR HASIL TELAAH EVALUASI CAPA', pageWidth / 2, 29, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 116, 144);
  doc.text('LAMPIRAN PENDUKUNG PENGAJUAN SURAT PENGANTAR NASKAH DINAS PADA APLIKASI SRIKANDI', pageWidth / 2, 33.5, { align: 'center' });

  // 3. Meta Information Box
  const totalFindings = inspection.findings.length;
  const totalClosed = inspection.findings.filter((f) => f.capa.evaluationStatus === 'MEMADAI').length;
  const totalOpen = inspection.findings.filter((f) => f.capa.evaluationStatus !== 'MEMADAI').length;
  const isClosed = totalOpen === 0;

  const reportNo = evalData?.reportNo || inspection.evaluationReport?.reportNo || `BA-EVAL/CAPA/2026/${inspection.capaCode.replace('CAPA-', '')}`;
  const evaluatorName = evalData?.evaluatorName || inspection.evaluationReport?.evaluatorName || inspection.assignedOfficer?.name || inspection.leadAuditor;
  const evaluatorNip = evalData?.evaluatorNip || inspection.evaluationReport?.evaluatorNip || inspection.assignedOfficer?.nip || '-';
  const stageCycle = evalData?.stageCycle || (inspection.srikandiWorkflow?.srikandiDocuments?.length ? inspection.srikandiWorkflow.srikandiDocuments.length + 1 : 1);

  autoTable(doc, {
    startY: 37,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42, textColor: [71, 85, 105] },
      1: { cellWidth: 92 },
      2: { fontStyle: 'bold', cellWidth: 42, textColor: [71, 85, 105] },
      3: { cellWidth: 96 },
    },
    body: [
      [
        'Nomor Berita Acara',
        `: ${reportNo}`,
        'Siklus / Tahap Evaluasi',
        `: Evaluasi CAPA Tahap ke-${stageCycle}`,
      ],
      [
        'Kode Unik Sesi CAPA',
        `: ${inspection.capaCode}`,
        'Status Rekomendasi Sesi',
        `: ${isClosed ? 'MEMADAI (CLOSE / 100% TUNTAS)' : `PERLU PERBAIKAN (${totalOpen} Butir Open)`}`,
      ],
      [
        'Nama Sarana / Fasilitas',
        `: ${inspection.facility.name}`,
        'Jenis Fasilitas / Komoditi',
        `: ${inspection.facility.type}`,
      ],
      [
        'Alamat Sarana',
        `: ${inspection.facility.address}`,
        'Surat SRIKANDI (Awal)',
        `: ${inspection.srikandiLetter.letterNo} (${formatIndonesianDate(inspection.srikandiLetter.issuedDate)})`,
      ],
      [
        'Petugas Evaluator BBPOM',
        `: ${evaluatorName} (NIP. ${evaluatorNip})`,
        'Rekapitulasi Butir Temuan',
        `: Total ${totalFindings} Butir | ${totalClosed} Close (Disetujui) | ${totalOpen} Open (Perlu Revisi)`,
      ],
    ],
  });

  let currentY = (doc as any).lastAutoTable.finalY + 3;

  // 4. Tabel Rincian Evaluasi Setiap Butir Temuan
  const tableHeaders = [
    'No',
    'Klausul & Kategori',
    'Deskripsi Temuan Lapangan',
    'Tindakan Perbaikan (CA) & Pencegahan (PA)',
    'Bukti Dukung Sarana',
    'Status Evaluasi',
    'Catatan / Rekomendasi Evaluator',
  ];

  const tableRows = inspection.findings.map((f, idx) => {
    const capa = f.capa;
    const isItemClosed = capa.evaluationStatus === 'MEMADAI';
    const statusLabel = isItemClosed ? 'MEMADAI\n(CLOSE)' : 'BELUM MEMADAI\n(OPEN / REVISI)';

    let evidenceStr = '';
    if (capa.evidenceFiles && capa.evidenceFiles.length > 0) {
      evidenceStr = capa.evidenceFiles.map((ef) => `• ${ef.name}`).join('\n');
    }
    if (capa.evidenceDriveUrl) {
      evidenceStr = (evidenceStr ? evidenceStr + '\n' : '') + `Cloud: ${capa.evidenceDriveUrl}`;
    }
    if (!evidenceStr) evidenceStr = 'Belum ada bukti dilampirkan';

    const capaActions = `CA: ${capa.correctiveAction || '-'}\n\nPA: ${capa.preventiveAction || '-'}`;
    const evalNotes = capa.evaluatorNotes || (isItemClosed ? 'Tindakan dan bukti dinilai memadai.' : 'Perlu melengkapi bukti perbaikan lanjutan.');

    return [
      `${idx + 1}`,
      `${f.clause}\n[${f.category}]`,
      f.description,
      capaActions,
      evidenceStr,
      statusLabel,
      evalNotes,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      valign: 'top',
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 54 },
      3: { cellWidth: 54 },
      4: { cellWidth: 38 },
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 58 },
    },
    didParseCell: (data) => {
      // Highlight Status Column
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw || '');
        if (text.includes('MEMADAI\n(CLOSE)')) {
          data.cell.styles.fillColor = [236, 253, 245];
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.fillColor = [254, 242, 242];
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Check page overflow for conclusion and signatures
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin + 5;
  }

  // 5. Kesimpulan & Rekomendasi Naskah Dinas SRIKANDI Box
  const conclusionText = evalData?.conclusion || inspection.evaluationReport?.overallConclusion || (
    isClosed
      ? `Seluruh ${totalFindings} butir temuan telah dievaluasi dan dinyatakan MEMADAI (Closed). Sesi CAPA diusulkan untuk DITUTUP RESMI.`
      : `Terdapat ${totalOpen} butir temuan yang masih berstatus OPEN (Belum Memadai). Sarana diwajibkan melakukan revisi/perbaikan bukti lanjutan.`
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      fillColor: isClosed ? [240, 253, 250] : [255, 251, 235],
      lineColor: isClosed ? [45, 212, 191] : [251, 191, 36],
      lineWidth: 0.3,
    },
    body: [
      [
        `KESIMPULAN EVALUATOR & REKOMENDASI PENGAJUAN NASKAH DINAS SRIKANDI:\n${conclusionText}\n\n` +
        `Rekomendasi Naskah Dinas untuk Admin: ${isClosed ? 'Diusulkan Penerbitan Surat Pengantar Persetujuan & Penutupan CAPA Resmi (TTE Kepala Balai).' : `Diusulkan Penerbitan Surat Pengantar Hasil Evaluasi Ulang Tahap ke-${stageCycle} (TTE Kepala Balai).`}`
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = margin + 5;
  }

  // 6. Sign-off Box
  const signColWidth = (pageWidth - margin * 2) / 2;
  const leftX = margin;
  const rightX = margin + signColWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Mengetahui / Mengesahkan,', leftX, currentY);
  doc.text('Semarang, ' + formatIndonesianDate(new Date().toISOString()), rightX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Kepala Balai Besar POM di Semarang', leftX, currentY + 4);
  doc.text('Petugas Evaluator CAPA BBPOM,', rightX, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('[Ditandatangani secara elektronik di SRIKANDI]', leftX, currentY + 16);
  doc.text('[Tervalidasi pada SIMONCER]', rightX, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Dr. apt. Hendrawan Kusuma, M.Si', leftX, currentY + 21);
  doc.text(evaluatorName, rightX, currentY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. 197405121999031002', leftX, currentY + 24.5);
  doc.text(evaluatorNip && evaluatorNip !== '-' ? `NIP. ${evaluatorNip}` : 'Pengawas Farmasi & Makanan', rightX, currentY + 24.5);

  const cleanFileName = `Berita_Acara_Hasil_Evaluasi_CAPA_${inspection.capaCode}_Tahap${stageCycle}.pdf`;
  doc.save(cleanFileName);
}
