import { QrCode } from 'lucide-react';
import { amountInWords } from '@/utils/receiptPdf';
import { INSTALLMENT_LABEL, PAYMENT_METHOD_LABEL, safeDate } from '@/utils/feeLabels';
import type { FeePayment } from '@/types';
import styles from './ReceiptView.module.css';

export function ReceiptView({
  payment,
  school,
}: {
  payment: FeePayment;
  school: { name: string; address: string; phone: string };
}) {
  const installmentLabel = INSTALLMENT_LABEL[payment.installmentId] ?? `Installment ${payment.installmentId}`;
  const isPaidOff = payment.balanceAfter <= 0;

  return (
    <div className={styles.receipt} id="receipt-print-area">
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>MS</div>
          <div>
            <div className={styles.schoolName}>{school.name || 'MIS School'}</div>
            {school.address && <div className={styles.schoolMeta}>{school.address}</div>}
            {school.phone && <div className={styles.schoolMeta}>Phone: {school.phone}</div>}
          </div>
        </div>
        <span className={styles.originalBadge}>ORIGINAL RECEIPT</span>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <MetaRow label="Student Name" value={payment.studentName} />
          <MetaRow label="Admission No." value={payment.admissionNumber} />
          <MetaRow label="Class & Section" value={`${payment.className} - ${payment.section}`} />
        </div>
        <div className={styles.metaRight}>
          <MetaRow label="Receipt No." value={payment.receiptNo} />
          <MetaRow label="Payment ID" value={payment.paymentRef} />
          <MetaRow label="Date & Time" value={safeDate(payment.createdAt, 'd MMM yyyy, h:mm a')} />
          <MetaRow label="Payment Mode" value={PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod} />
        </div>
      </div>

      <div className={styles.sectionTitle}>Fee Details ({installmentLabel})</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Particulars</th>
            <th className={styles.amountCol}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className={styles.feeName}>Academics Fee</div>
              <div className={styles.feeSub}>Tuition, Development, Library, Lab, etc.</div>
            </td>
            <td className={styles.amountCol}>{payment.academicFee.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>
              <div className={styles.feeName}>Transport Fee</div>
              <div className={styles.feeSub}>{payment.transportFee > 0 ? 'School Bus Charges' : 'Self Transport — not applicable'}</div>
            </td>
            <td className={styles.amountCol}>{payment.transportFee.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.totals}>
        <TotalRow label={`Total Amount (${installmentLabel})`} value={payment.totalFee} />
        <TotalRow label="Amount Paid (this payment)" value={payment.amount} tone="success" />
        <TotalRow label="Total Paid Till Date" value={payment.totalPaidAfter} />
        <TotalRow label="Balance Amount" value={payment.balanceAfter} tone={payment.balanceAfter > 0 ? 'danger' : 'success'} emphasis />
      </div>

      <div className={styles.wordsRow}>Amount in Words: {amountInWords(payment.amount)}</div>

      <div className={styles.detailsRow}>
        <span>Payment Method: <strong>{PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod}</strong></span>
        {payment.transactionRef && <span>Reference No.: <strong>{payment.transactionRef}</strong></span>}
      </div>
      <div className={styles.detailsRow}>
        <span>Collected By: <strong>{payment.collectedByName}</strong></span>
        {payment.remarks && <span>Remarks: <strong>{payment.remarks}</strong></span>}
      </div>

      <div className={styles.footer}>
        <div className={styles.signatureBlock}>
          <div className={styles.signatureLine} />
          <div className={styles.signatureLabel}>Received By (Admin)</div>
        </div>
        <div className={styles.seal}>
          <div className={styles.sealRing}>
            <span>{(school.name || 'MIS SCHOOL').toUpperCase()}</span>
          </div>
        </div>
        <div className={styles.qr}>
          <div className={styles.qrBox}>
            <QrCode size={56} />
          </div>
          <span className={styles.qrLabel}>Scan to Verify</span>
        </div>
      </div>

      <div className={styles.thanks}>Thank you for your payment!</div>

      {isPaidOff && (
        <div className={styles.paidStamp} aria-hidden>
          PAID
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}

function TotalRow({
  label,
  value,
  tone,
  emphasis,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'danger';
  emphasis?: boolean;
}) {
  return (
    <div className={[styles.totalRow, emphasis && styles.totalRowEmphasis].filter(Boolean).join(' ')}>
      <span>{label}</span>
      <span className={tone ? styles[`tone_${tone}`] : undefined}>₹{value.toLocaleString('en-IN')}</span>
    </div>
  );
}
