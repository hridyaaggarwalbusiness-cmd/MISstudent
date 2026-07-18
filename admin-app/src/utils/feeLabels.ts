import { format, parseISO } from 'date-fns';
import type { FeePaymentMethod, FeeStatus, InstallmentId } from '@/types';

export const INSTALLMENT_LABEL: Record<InstallmentId, string> = {
  '1': '1st Installment',
  '2': '2nd Installment',
};

export const PAYMENT_METHOD_LABEL: Record<FeePaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cheque: 'Cheque',
};

export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
};

export const FEE_STATUS_TONE: Record<FeeStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'danger',
};

export function safeDate(iso: string, fmt: string): string {
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
}
