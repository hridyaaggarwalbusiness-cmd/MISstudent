import { useEffect, useRef, useState } from 'react';
import { CreditCard, Download, Eye, History, MoreVertical } from 'lucide-react';
import styles from './RowActionMenu.module.css';

interface RowActionMenuProps {
  onViewDetails: () => void;
  onUpdatePayment: () => void;
  onDownloadReceipt: () => void;
  onPaymentHistory: () => void;
}

export function RowActionMenu({ onViewDetails, onUpdatePayment, onDownloadReceipt, onPaymentHistory }: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function pick(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button type="button" className={styles.trigger} onClick={() => setOpen((v) => !v)} aria-label="Row actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button type="button" className={styles.item} onClick={() => pick(onViewDetails)}>
            <Eye size={14} /> View Details
          </button>
          <button type="button" className={styles.item} onClick={() => pick(onUpdatePayment)}>
            <CreditCard size={14} /> Update Payment
          </button>
          <button type="button" className={styles.item} onClick={() => pick(onDownloadReceipt)}>
            <Download size={14} /> Download Receipt
          </button>
          <button type="button" className={styles.item} onClick={() => pick(onPaymentHistory)}>
            <History size={14} /> Payment History
          </button>
        </div>
      )}
    </div>
  );
}
