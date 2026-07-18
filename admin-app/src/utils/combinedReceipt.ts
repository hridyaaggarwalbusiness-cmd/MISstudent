import type { FeePayment, FeePaymentMethod, FeeStatus, InstallmentId } from '@/types';

export interface ReceiptPart {
  seq: number;
  amount: number;
  paymentDate: string;
  paymentMethod: FeePaymentMethod;
  transactionRef?: string;
  receiptNo: string;
  collectedByName: string;
  remarks?: string;
  createdAt: string;
}

// One receipt per (student, installment), not per payment - every partial
// payment made toward that installment shows up as a numbered "Part" on the
// same document, so a student who paid in three instalments gets one
// consolidated receipt instead of three separate ones. Built entirely from
// the already-fetched, immutable feePayments records - no extra doc needed.
export interface CombinedReceipt {
  studentId: string;
  classId: string;
  academicSession: string;
  installmentId: InstallmentId;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  academicFee: number;
  transportFee: number;
  totalFee: number;
  totalPaid: number;
  balance: number;
  status: FeeStatus;
  receiptNo: string;
  generatedAt: string;
  parts: ReceiptPart[];
}

export function buildCombinedReceipt(payments: FeePayment[]): CombinedReceipt | null {
  if (payments.length === 0) return null;
  const sorted = [...payments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = sorted[sorted.length - 1];
  return {
    studentId: latest.studentId,
    classId: latest.classId,
    academicSession: latest.academicSession,
    installmentId: latest.installmentId,
    studentName: latest.studentName,
    admissionNumber: latest.admissionNumber,
    className: latest.className,
    section: latest.section,
    academicFee: latest.academicFee,
    transportFee: latest.transportFee,
    totalFee: latest.totalFee,
    totalPaid: latest.totalPaidAfter,
    balance: latest.balanceAfter,
    status: latest.statusAfter,
    receiptNo: latest.receiptNo,
    generatedAt: latest.createdAt,
    parts: sorted.map((p, i) => ({
      seq: i + 1,
      amount: p.amount,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      transactionRef: p.transactionRef,
      receiptNo: p.receiptNo,
      collectedByName: p.collectedByName,
      remarks: p.remarks,
      createdAt: p.createdAt,
    })),
  };
}
