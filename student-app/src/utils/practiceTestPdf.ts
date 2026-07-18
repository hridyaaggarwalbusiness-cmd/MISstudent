import { jsPDF } from 'jspdf';
import { GeneratedPaper, PaperQuestion } from '@/types';
import { DIFFICULTY_LABEL, LANGUAGE_LABEL, PAPER_TYPE_LABEL } from '@data/practiceTestOptions';

type School = { name: string; address: string; phone: string };

const QUESTION_TYPE_LABEL: Record<PaperQuestion['type'], string> = {
  mcq: 'MCQ',
  fill_blank: 'Fill in the Blank',
  true_false: 'True / False',
  match_following: 'Match the Following',
  very_short: 'Very Short Answer',
  short: 'Short Answer',
  long: 'Long Answer',
  case_study: 'Case Study',
  assertion_reason: 'Assertion-Reason',
  numerical: 'Numerical',
};

// Mirrors the layout conventions of utils/receiptPdf.ts (same margins,
// multi-page ensureRoom() pattern, native jsPDF drawing instead of
// html2canvas) so every PDF this app produces feels like one family.
export function generatePracticeTestPdf(paper: GeneratedPaper, school: School): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 50;
  let y = 56;

  const indigo: [number, number, number] = [79, 70, 229];
  const gray: [number, number, number] = [100, 116, 139];
  const dark: [number, number, number] = [15, 23, 42];
  const lightBg: [number, number, number] = [248, 250, 252];

  function ensureRoom(needed: number) {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 56;
    }
  }

  function wrapped(text: string, maxWidth: number, fontSize: number, font: 'normal' | 'bold' | 'italic' = 'normal'): string[] {
    doc.setFont('helvetica', font);
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth) as string[];
  }

  // ---- Header ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...indigo);
  doc.text(school.name || 'MIS School', pageWidth / 2, y, { align: 'center' });

  doc.setFillColor(...indigo);
  doc.roundedRect(pageWidth - margin - 150, y - 20, 150, 20, 5, 5, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('AI-GENERATED PAPER', pageWidth - margin - 75, y - 6, { align: 'center' });

  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  const titleLines = wrapped(paper.title, contentWidth, 14, 'bold');
  titleLines.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 17;
  });

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // ---- Meta grid ----
  const metaItems: [string, string][] = [
    ['Class', paper.classLabel],
    ['Subject', paper.subject],
    ['Chapter / Topic', paper.chapterTopic],
    ['Paper Type', PAPER_TYPE_LABEL[paper.paperType]],
    ['Difficulty', DIFFICULTY_LABEL[paper.difficulty]],
    ['Language', LANGUAGE_LABEL[paper.language]],
    ['Time Allowed', paper.durationMinutes ? `${paper.durationMinutes} minutes` : 'Not specified'],
    ['Maximum Marks', String(paper.totalMarks)],
  ];
  const colWidth = contentWidth / 2;
  metaItems.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * colWidth;
    const rowY = y + row * 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text(label, x, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...dark);
    doc.text(value, x, rowY + 13);
  });
  y += Math.ceil(metaItems.length / 2) * 30 + 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // ---- General instructions ----
  if (paper.generalInstructions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...dark);
    doc.text('General Instructions:', margin, y);
    y += 15;
    paper.generalInstructions.forEach((line, i) => {
      const wrapped_ = wrapped(`${i + 1}. ${line}`, contentWidth - 10, 9.5, 'normal');
      ensureRoom(wrapped_.length * 12 + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...gray);
      wrapped_.forEach((l) => {
        doc.text(l, margin + 8, y);
        y += 12;
      });
    });
    y += 10;
  }

  // ---- Sections ----
  paper.sections.forEach((section) => {
    ensureRoom(40);
    doc.setFillColor(...indigo);
    doc.rect(margin, y, contentWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(section.title, margin + 10, y + 15);
    y += 22;

    if (section.instructions) {
      ensureRoom(16);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(section.instructions, margin + 4, y + 12);
      y += 20;
    } else {
      y += 8;
    }

    section.questions.forEach((q) => {
      ensureRoom(30);
      const marksLabel = `[${q.marks}]`;
      const questionWidth = contentWidth - 40;
      const qLines = wrapped(`Q${q.number}. ${q.text}`, questionWidth, 10, 'normal');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      qLines.forEach((line, i) => {
        ensureRoom(16);
        doc.text(line, margin + 4, y);
        if (i === 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(marksLabel, pageWidth - margin - 4, y, { align: 'right' });
          doc.setFont('helvetica', 'normal');
        }
        y += 14;
      });

      if (q.caseText) {
        ensureRoom(20);
        doc.setFillColor(...lightBg);
        const caseLines = wrapped(q.caseText, questionWidth - 16, 9, 'italic');
        const boxHeight = caseLines.length * 12 + 10;
        ensureRoom(boxHeight);
        doc.rect(margin + 4, y, contentWidth - 8, boxHeight, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...gray);
        let cy = y + 12;
        caseLines.forEach((line) => {
          doc.text(line, margin + 12, cy);
          cy += 12;
        });
        y += boxHeight + 8;
      }

      if (q.type === 'mcq' && q.options) {
        const labels = ['a', 'b', 'c', 'd'];
        q.options.forEach((opt, i) => {
          ensureRoom(14);
          const optLines = wrapped(`(${labels[i]}) ${opt}`, questionWidth - 12, 9.5, 'normal');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(...dark);
          optLines.forEach((line) => {
            doc.text(line, margin + 16, y);
            y += 13;
          });
        });
      }

      if (q.type === 'match_following' && q.matchPairs) {
        ensureRoom(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...gray);
        doc.text('Column A', margin + 16, y);
        doc.text('Column B', margin + contentWidth / 2, y);
        y += 13;
        q.matchPairs.forEach((pair, i) => {
          ensureRoom(14);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(...dark);
          doc.text(`${i + 1}. ${pair.left}`, margin + 16, y);
          doc.text(`${String.fromCharCode(97 + i)}. ${pair.right}`, margin + contentWidth / 2, y);
          y += 14;
        });
      }

      if (q.type === 'short' || q.type === 'long') {
        const lineCount = q.type === 'long' ? 3 : 1;
        for (let i = 0; i < lineCount; i++) {
          ensureRoom(16);
          doc.setDrawColor(203, 213, 225);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(margin + 16, y + 6, pageWidth - margin - 16, y + 6);
          doc.setLineDashPattern([], 0);
          y += 16;
        }
      }

      y += 8;
    });

    y += 6;
  });

  return doc;
}

export function downloadPracticeTestPdf(paper: GeneratedPaper, school: School) {
  const doc = generatePracticeTestPdf(paper, school);
  doc.save(`${paper.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}.pdf`);
}

export function viewPracticeTestPdf(paper: GeneratedPaper, school: School) {
  const doc = generatePracticeTestPdf(paper, school);
  doc.output('dataurlnewwindow');
}

// Web Share API can share files directly on browsers that support it; where
// it isn't available (or this isn't running on web) we fall back to a
// normal download so the action never silently does nothing.
export async function sharePracticeTestPdf(paper: GeneratedPaper, school: School) {
  const doc = generatePracticeTestPdf(paper, school);
  const fileName = `${paper.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}.pdf`;
  const blob = doc.output('blob');

  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { canShare?: (data: unknown) => boolean; share?: (data: unknown) => Promise<void> }) : undefined;
  if (nav?.share && nav.canShare) {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: paper.title });
        return;
      } catch {
        // user cancelled the share sheet, or it failed - fall through to download
      }
    }
  }
  doc.save(fileName);
}
