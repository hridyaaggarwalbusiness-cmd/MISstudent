import { QrCode } from 'lucide-react';
import { amountInWords } from '@/utils/receiptPdf';
import { INSTALLMENT_LABEL, PAYMENT_METHOD_LABEL, safeDate } from '@/utils/feeLabels';
import type { CombinedReceipt } from '@/utils/combinedReceipt';
import styles from './ReceiptView.module.css';

export function ReceiptView({
  receipt,
  school,
}: {
  receipt: CombinedReceipt;
  school: { name: string; address: string; phone: string };
}) {
  const installmentLabel = INSTALLMENT_LABEL[receipt.installmentId] ?? `Installment ${receipt.installmentId}`;
  const isPaidOff = receipt.balance <= 0;
  const lastPart = receipt.parts[receipt.parts.length - 1];

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
        <span className={styles.originalBadge}>CONSOLIDATED RECEIPT</span>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <MetaRow label="Student Name" value={receipt.studentName} />
          <MetaRow label="Admission No." value={receipt.admissionNumber} />
          <MetaRow label="Class & Section" value={`${receipt.className} - ${receipt.section}`} />
        </div>
        <div className={styles.metaRight}>
          <MetaRow label="Receipt No. (Latest)" value={receipt.receiptNo} />
          <MetaRow label="Installment" value={installmentLabel} />
          <MetaRow label="Last Payment On" value={safeDate(lastPart.paymentDate, 'd MMM yyyy')} />
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
            <td className={styles.amountCol}>{receipt.academicFee.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>
              <div className={styles.feeName}>Transport Fee</div>
              <div className={styles.feeSub}>{receipt.transportFee > 0 ? 'School Bus Charges' : 'Self Transport — not applicable'}</div>
            </td>
            <td className={styles.amountCol}>{receipt.transportFee.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.totals}>
        <TotalRow label={`Total Amount (${installmentLabel})`} value={receipt.totalFee} />
        <TotalRow label="Total Paid Till Date" value={receipt.totalPaid} tone="success" />
        <TotalRow label="Balance Amount" value={receipt.balance} tone={receipt.balance > 0 ? 'danger' : 'success'} emphasis />
      </div>

      <div className={styles.sectionTitle}>Payment Breakdown ({receipt.parts.length} {receipt.parts.length === 1 ? 'Payment' : 'Payments'})</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Part</th>
            <th>Date</th>
            <th>Mode</th>
            <th>Receipt No.</th>
            <th className={styles.amountCol}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {receipt.parts.map((part) => (
            <tr key={part.receiptNo}>
              <td>Part {part.seq}</td>
              <td>{safeDate(part.paymentDate, 'd MMM yyyy')}</td>
              <td>{PAYMENT_METHOD_LABEL[part.paymentMethod] ?? part.paymentMethod}</td>
              <td>{part.receiptNo}</td>
              <td className={styles.amountCol}>{part.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.wordsRow}>Amount in Words (Total Paid): {amountInWords(receipt.totalPaid)}</div>

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
