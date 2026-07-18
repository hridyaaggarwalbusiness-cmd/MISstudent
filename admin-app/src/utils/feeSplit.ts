import type { FeeStatus } from '@/types';

export interface FeeLineSplit {
  amount: number;
  paid: number;
  balance: number;
  status: FeeStatus;
}

function statusFor(amount: number, paid: number): FeeStatus {
  if (amount <= 0) return 'paid';
  if (paid >= amount) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

// The system tracks a single lump `amountPaid` against the installment
// total - it isn't sub-allocated by fee type. To show a per-line Paid /
// Balance (matching the fee table design), we allocate deterministically -
// transport first, since it's the smaller fixed charge, then whatever's
// left to academics - so the two lines always add back up to the one
// stored total without a second field to keep in sync.
export function splitFeeLines(
  academicFee: number,
  transportFee: number,
  amountPaid: number,
): { academic: FeeLineSplit; transport: FeeLineSplit } {
  const transportPaid = Math.min(transportFee, amountPaid);
  const academicPaid = Math.min(academicFee, Math.max(0, amountPaid - transportFee));
  return {
    transport: {
      amount: transportFee,
      paid: transportPaid,
      balance: transportFee - transportPaid,
      status: statusFor(transportFee, transportPaid),
    },
    academic: {
      amount: academicFee,
      paid: academicPaid,
      balance: academicFee - academicPaid,
      status: statusFor(academicFee, academicPaid),
    },
  };
}
