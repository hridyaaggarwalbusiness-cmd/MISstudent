import { jsPDF } from 'jspdf';
import { INSTALLMENT_LABEL, PAYMENT_METHOD_LABEL, safeDate } from '@utils/feeLabels';
import { CombinedReceipt } from '@utils/combinedReceipt';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + twoDigits(n % 100) : ''}`;
}

// Mirrors admin-app's utils/receiptPdf.ts exactly (same layout, same
// number-to-words logic, same consolidated Part-by-Part breakdown) so the
// receipt a student downloads here is visually identical to the one the
// admin generates - there's no shared package between the two apps, so
// this is regenerated client-side from the same feePayments documents.
export function amountInWords(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return 'Zero Rupees Only';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return `${parts.join(' ')} Rupees Only`;
}

export function generateReceiptPdf(
  receipt: CombinedReceipt,
  school: { name: string; address: string; phone: string },
): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 60;
  let y = 56;

  const indigo: [number, number, number] = [79, 70, 229];
  const gray: [number, number, number] = [100, 116, 139];
  const dark: [number, number, number] = [15, 23, 42];
  const green: [number, number, number] = [16, 185, 129];
  const red: [number, number, number] = [225, 29, 72];

  function ensureRoom(needed: number) {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 56;
    }
  }

  // ---- Header ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...indigo);
  doc.text(school.name || 'MIS School', margin, y);

  doc.setFillColor(...indigo);
  doc.roundedRect(pageWidth - margin - 150, y - 22, 150, 22, 5, 5, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSOLIDATED RECEIPT', pageWidth - margin - 75, y - 7, { align: 'center' });

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  if (school.address) {
    doc.text(school.address, margin, y);
    y += 12;
  }
  if (school.phone) {
    doc.text(`Phone: ${school.phone}`, margin, y);
    y += 12;
  }

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // ---- Meta: student info (left) / receipt info (right) ----
  const colGap = 24;
  const colWidth = (contentWidth - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + colGap;
  const metaTop = y;
  const installmentLabel = INSTALLMENT_LABEL[receipt.installmentId] ?? receipt.installmentId;
  const lastPart = receipt.parts[receipt.parts.length - 1];

  function metaRow(x: number, rowY: number, label: string, value: string) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text(label, x, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...dark);
    doc.text(value, x, rowY + 13);
  }

  metaRow(leftX, metaTop, 'Student Name', receipt.studentName);
  metaRow(leftX, metaTop + 34, 'Admission No.', receipt.admissionNumber);
  metaRow(leftX, metaTop + 68, 'Class & Section', `${receipt.className} - ${receipt.section}`);

  metaRow(rightX, metaTop, 'Receipt No. (Latest)', receipt.receiptNo);
  metaRow(rightX, metaTop + 34, 'Installment', installmentLabel);
  metaRow(rightX, metaTop + 68, 'Last Payment On', safeDate(lastPart.paymentDate, 'd MMM yyyy'));

  y = metaTop + 68 + 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // ---- Fee details table ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(`Fee Details (${installmentLabel})`, margin, y);
  y += 14;

  const rowH = 26;
  doc.setFillColor(...indigo);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Particulars', margin + 10, y + 15);
  doc.text('Amount (INR)', pageWidth - margin - 10, y + 15, { align: 'right' });
  y += 22;

  const feeRows: [string, number][] = [
    ['Academics Fee', receipt.academicFee],
    ['Transport Fee', receipt.transportFee],
  ];
  doc.setFont('helvetica', 'normal');
  feeRows.forEach(([label, amount], i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.text(label, margin + 10, y + 17);
    doc.text(amount.toLocaleString('en-IN'), pageWidth - margin - 10, y + 17, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
    y += rowH;
  });

  y += 10;
  function totalRow(label: string, value: string, color: [number, number, number], bold = true) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...dark);
    doc.text(label, margin + 10, y);
    doc.setTextColor(...color);
    doc.text(value, pageWidth - margin - 10, y, { align: 'right' });
    y += 20;
  }

  totalRow(`Total Amount (${installmentLabel})`, `Rs. ${receipt.totalFee.toLocaleString('en-IN')}`, dark);
  totalRow('Total Paid Till Date', `Rs. ${receipt.totalPaid.toLocaleString('en-IN')}`, green);
  totalRow('Balance Amount', `Rs. ${receipt.balance.toLocaleString('en-IN')}`, receipt.balance > 0 ? red : green);

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // ---- Payment breakdown table ----
  ensureRoom(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  const paymentWord = receipt.parts.length === 1 ? 'Payment' : 'Payments';
  doc.text(`Payment Breakdown (${receipt.parts.length} ${paymentWord})`, margin, y);
  y += 14;

  const partCols = [
    { label: 'Part', w: 0.14 },
    { label: 'Date', w: 0.2 },
    { label: 'Mode', w: 0.2 },
    { label: 'Receipt No.', w: 0.28 },
    { label: 'Amount (INR)', w: 0.18, align: 'right' as const },
  ];

  function drawPartsHeader() {
    doc.setFillColor(...indigo);
    doc.rect(margin, y, contentWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let x = margin + 8;
    partCols.forEach((c) => {
      const w = c.w * contentWidth;
      if (c.align === 'right') doc.text(c.label, x + w - 8, y + 15, { align: 'right' });
      else doc.text(c.label, x, y + 15);
      x += w;
    });
    y += 22;
  }

  drawPartsHeader();
  doc.setFont('helvetica', 'normal');
  receipt.parts.forEach((part, i) => {
    ensureRoom(rowH + 4);
    if (y === 56) drawPartsHeader();
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setTextColor(...dark);
    doc.setFontSize(9.5);
    let x = margin + 8;
    const values = [
      `Part ${part.seq}`,
      safeDate(part.paymentDate, 'd MMM yyyy'),
      PAYMENT_METHOD_LABEL[part.paymentMethod] ?? part.paymentMethod,
      part.receiptNo,
      part.amount.toLocaleString('en-IN'),
    ];
    partCols.forEach((c, ci) => {
      const w = c.w * contentWidth;
      if (c.align === 'right') doc.text(values[ci], x + w - 8, y + 17, { align: 'right' });
      else doc.text(values[ci], x, y + 17);
      x += w;
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
    y += rowH;
  });

  y += 20;
  ensureRoom(80);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...gray);
  doc.text(`Amount in Words (Total Paid): ${amountInWords(receipt.totalPaid)}`, margin, y);
  y += 40;

  ensureRoom(70);
  doc.setDrawColor(15, 23, 42);
  doc.line(margin, y, margin + 140, y);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Received By (Admin)', margin, y + 12);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...indigo);
  doc.text('Thank you for your payment!', pageWidth / 2, y + 30, { align: 'center' });

  if (receipt.balance <= 0) {
    doc.setDrawColor(...green);
    doc.setTextColor(...green);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.saveGraphicsState?.();
    doc.text('PAID', pageWidth - margin - 90, y - 60, { angle: 15 });
    doc.restoreGraphicsState?.();
  }

  return doc;
}

export function downloadReceiptPdf(receipt: CombinedReceipt, school: { name: string; address: string; phone: string }) {
  const doc = generateReceiptPdf(receipt, school);
  doc.save(`${receipt.receiptNo.replace(/\//g, '-')}.pdf`);
}

export function viewReceiptPdf(receipt: CombinedReceipt, school: { name: string; address: string; phone: string }) {
  const doc = generateReceiptPdf(receipt, school);
  doc.output('dataurlnewwindow');
}
