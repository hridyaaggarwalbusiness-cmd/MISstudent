import { jsPDF } from 'jspdf';
import { INSTALLMENT_LABEL, safeDate } from '@/utils/feeLabels';
import type { FeePayment } from '@/types';

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

// Small, dependency-free number-to-words for Indian currency phrasing
// (lakh/crore), since the receipt spells out the amount for audit purposes.
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
  payment: FeePayment,
  school: { name: string; address: string; phone: string },
): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let y = 56;

  const indigo: [number, number, number] = [79, 70, 229];
  const gray: [number, number, number] = [100, 116, 139];
  const dark: [number, number, number] = [15, 23, 42];
  const green: [number, number, number] = [16, 185, 129];
  const red: [number, number, number] = [225, 29, 72];

  // ---- Header ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...indigo);
  doc.text(school.name || 'MIS School', margin, y);

  doc.setFillColor(...indigo);
  doc.roundedRect(pageWidth - margin - 120, y - 22, 120, 22, 5, 5, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ORIGINAL RECEIPT', pageWidth - margin - 60, y - 7, { align: 'center' });

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

  metaRow(leftX, metaTop, 'Student Name', payment.studentName);
  metaRow(leftX, metaTop + 34, 'Admission No.', payment.admissionNumber);
  metaRow(leftX, metaTop + 68, 'Class & Section', `${payment.className} - ${payment.section}`);

  metaRow(rightX, metaTop, 'Receipt No.', payment.receiptNo);
  metaRow(rightX, metaTop + 34, 'Payment ID', payment.paymentRef);
  metaRow(rightX, metaTop + 68, 'Date & Time', safeDate(payment.createdAt, 'd MMM yyyy, h:mm a'));

  y = metaTop + 68 + 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // ---- Fee details table ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(`Fee Details (${INSTALLMENT_LABEL[payment.installmentId] ?? payment.installmentId})`, margin, y);
  y += 14;

  const rowH = 26;
  doc.setFillColor(...indigo);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text('Particulars', margin + 10, y + 15);
  doc.text('Amount (INR)', pageWidth - margin - 10, y + 15, { align: 'right' });
  y += 22;

  const rows: [string, number][] = [
    ['Academics Fee', payment.academicFee],
    ['Transport Fee', payment.transportFee],
  ];
  doc.setFont('helvetica', 'normal');
  rows.forEach(([label, amount], i) => {
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

  totalRow(`Total Amount (${INSTALLMENT_LABEL[payment.installmentId] ?? ''})`, `Rs. ${payment.totalFee.toLocaleString('en-IN')}`, dark);
  totalRow('Amount Paid (this payment)', `Rs. ${payment.amount.toLocaleString('en-IN')}`, green);
  totalRow('Total Paid Till Date', `Rs. ${payment.totalPaidAfter.toLocaleString('en-IN')}`, dark);
  totalRow('Balance Amount', `Rs. ${payment.balanceAfter.toLocaleString('en-IN')}`, payment.balanceAfter > 0 ? red : green);

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...gray);
  doc.text(`Amount in Words: ${amountInWords(payment.amount)}`, margin, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Payment Method: ${payment.paymentMethod.replace('_', ' ').toUpperCase()}`, margin, y);
  if (payment.transactionRef) {
    doc.text(`Reference No.: ${payment.transactionRef}`, rightX, y);
  }
  y += 16;
  doc.text(`Collected By: ${payment.collectedByName}`, margin, y);
  if (payment.remarks) {
    doc.text(`Remarks: ${payment.remarks}`, rightX, y);
  }
  y += 40;

  doc.setDrawColor(15, 23, 42);
  doc.line(margin, y, margin + 140, y);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Received By (Admin)', margin, y + 12);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...indigo);
  doc.text('Thank you for your payment!', pageWidth / 2, y + 30, { align: 'center' });

  if (payment.balanceAfter <= 0) {
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

export function downloadReceiptPdf(payment: FeePayment, school: { name: string; address: string; phone: string }) {
  const doc = generateReceiptPdf(payment, school);
  doc.save(`${payment.receiptNo.replace(/\//g, '-')}.pdf`);
}

export function viewReceiptPdf(payment: FeePayment, school: { name: string; address: string; phone: string }) {
  const doc = generateReceiptPdf(payment, school);
  window.open(doc.output('bloburl'), '_blank');
}

export function printReceiptPdf(payment: FeePayment, school: { name: string; address: string; phone: string }) {
  const doc = generateReceiptPdf(payment, school);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
