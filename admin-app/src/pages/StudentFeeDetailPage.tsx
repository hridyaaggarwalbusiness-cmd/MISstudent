import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Bus,
  Car,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  History,
  Printer,
  Receipt,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table } from '@/components/ui/Table';
import { TextField, SelectField, TextAreaField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/pages/PageHeader';
import { ReceiptView } from '@/components/fees/ReceiptView';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/useAuthStore';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { downloadReceiptPdf, printReceiptPdf } from '@/utils/receiptPdf';
import { buildCombinedReceipt } from '@/utils/combinedReceipt';
import { CURRENT_ACADEMIC_SESSION } from '@/utils/academicSession';
import { splitFeeLines } from '@/utils/feeSplit';
import { FEE_STATUS_LABEL, FEE_STATUS_TONE, INSTALLMENT_LABEL, PAYMENT_METHOD_LABEL } from '@/utils/feeLabels';
import type {
  FeePayment,
  FeePaymentMethod,
  FeeStatus,
  FeeStructure,
  InstallmentId,
  Student,
  StudentFeeRecord,
  TransportType,
} from '@/types';
import styles from './StudentFeeDetailPage.module.css';

const PAYMENT_METHOD_OPTIONS: FeePaymentMethod[] = ['cash', 'upi', 'bank_transfer', 'card', 'cheque'];
const INSTALLMENT_IDS: InstallmentId[] = ['1', '2'];

export function StudentFeeDetailPage() {
  const { studentId = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { show } = useToast();
  const adminName = useAuthStore((s) => s.profile?.displayName ?? 'Admin');

  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [structure, setStructure] = useState<FeeStructure | null>(null);
  const [school, setSchool] = useState({ name: 'MIS School', address: '', phone: '' });
  const [installmentId, setInstallmentId] = useState<InstallmentId>(() =>
    searchParams.get('installment') === '2' ? '2' : '1',
  );
  const [record, setRecord] = useState<StudentFeeRecord | null | undefined>(undefined);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [transportType, setTransportType] = useState<TransportType>('bus');

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => repo.students.subscribeOne(studentId, setStudent), [studentId]);
  useEffect(() => repo.school.subscribe((s) => s && setSchool(s)), []);

  useEffect(() => {
    if (!student) {
      setStructure(null);
      return;
    }
    return repo.fees.subscribeStructure(student.classId, setStructure);
  }, [student?.classId]);

  useEffect(() => {
    if (!studentId) return;
    setRecord(undefined);
    return repo.fees.subscribeStudentRecord(studentId, installmentId, setRecord);
  }, [studentId, installmentId]);

  useEffect(() => {
    if (!studentId) return;
    return repo.fees.subscribePaymentsForStudent(studentId, setPayments);
  }, [studentId]);

  useEffect(() => {
    setTransportType(record?.transportType ?? 'bus');
  }, [record]);

  useEffect(() => {
    setFormError('');
  }, [installmentId]);

  const installmentDef = useMemo(
    () => structure?.installments.find((i) => i.id === installmentId),
    [structure, installmentId],
  );

  const academicSession = structure?.academicSession ?? CURRENT_ACADEMIC_SESSION;
  const academicFee = record?.academicFee ?? installmentDef?.academicFee ?? 0;
  const transportFeeAmount = structure?.transportFeeAmount ?? 0;
  const transportFee = transportType === 'bus' ? transportFeeAmount : 0;
  const totalFee = academicFee + transportFee;
  const amountPaid = record?.amountPaid ?? 0;
  const balance = Math.max(0, totalFee - amountPaid);
  const status: FeeStatus = record?.status ?? (amountPaid > 0 ? 'partial' : 'unpaid');
  const dueDate = record?.dueDate ?? installmentDef?.dueDate ?? '';

  const paymentsForInstallment = useMemo(
    () => payments.filter((p) => p.installmentId === installmentId),
    [payments, installmentId],
  );
  const combinedReceipt = useMemo(() => buildCombinedReceipt(paymentsForInstallment), [paymentsForInstallment]);
  const feeSplit = useMemo(() => splitFeeLines(academicFee, transportFee, amountPaid), [academicFee, transportFee, amountPaid]);

  const loading = student === undefined || record === undefined;

  async function handleTransportChange(next: TransportType) {
    if (!student || next === transportType) return;
    const previous = transportType;
    setTransportType(next);
    try {
      await repo.fees.setTransportType({
        studentId: student.id,
        classId: student.classId,
        academicSession,
        installmentId,
        transportType: next,
        academicFee,
        transportFeeAmount,
        dueDate,
        currentAmountPaid: amountPaid,
      });
      show(next === 'bus' ? 'School Bus transport applied' : 'Self Transport applied — transport fee zeroed');
    } catch (e) {
      setTransportType(previous);
      show(getErrorMessage(e), 'error');
    }
  }

  async function handleRecordPayment() {
    if (!student) return;
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setFormError('Enter a valid payment amount.');
      return;
    }
    if (amt > balance) {
      setFormError(`Amount can't exceed the remaining balance of ₹${balance.toLocaleString('en-IN')}.`);
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await repo.fees.recordPayment({
        studentId: student.id,
        classId: student.classId,
        academicSession,
        installmentId,
        studentName: student.name,
        admissionNumber: student.admissionNumber,
        className: student.className,
        section: student.section,
        transportType,
        academicFee,
        transportFee,
        totalFee,
        previousPaid: amountPaid,
        amount: amt,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        paymentDate,
        remarks: remarks.trim() || undefined,
        dueDate,
      });
      setAmount('');
      setTransactionRef('');
      setRemarks('');
      show('Payment recorded and receipt generated');
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={student?.name ?? 'Student Fee Details'}
        description={student ? `${student.admissionNumber} · ${student.className} - ${student.section}` : ''}
        toolbar={
          <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate('/fees')}>
            Back to Fees
          </Button>
        }
      />

      <div className={styles.installmentTabs} role="tablist" aria-label="Installment">
        {INSTALLMENT_IDS.map((id) => {
          const def = structure?.installments.find((i) => i.id === id);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={installmentId === id}
              className={[styles.installmentTab, installmentId === id && styles.installmentTabActive].filter(Boolean).join(' ')}
              onClick={() => setInstallmentId(id)}
            >
              {def?.label ?? INSTALLMENT_LABEL[id]}
              {def?.period && <span className={styles.installmentPeriod}>{def.period}</span>}
            </button>
          );
        })}
      </div>

      {student === undefined ? (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      ) : student === null ? (
        <Card>
          <EmptyState icon={<Wallet size={32} />} title="Student not found" />
        </Card>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <Card>
              <div className={styles.sectionTitle}>
                <Wallet size={16} /> Fee Breakdown — {installmentDef?.label ?? INSTALLMENT_LABEL[installmentId]}
              </div>

              {loading ? (
                <SkeletonRows count={3} />
              ) : (
                <>
                  <div className={styles.transportRow}>
                    <span className={styles.transportLabel}>Transport Type</span>
                    <div className={styles.transportToggle} role="tablist" aria-label="Transport type">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={transportType === 'bus'}
                        className={[styles.transportOption, transportType === 'bus' && styles.transportOptionActive].filter(Boolean).join(' ')}
                        onClick={() => handleTransportChange('bus')}
                      >
                        <Bus size={15} /> School Bus
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={transportType === 'self'}
                        className={[styles.transportOption, transportType === 'self' && styles.transportOptionActive].filter(Boolean).join(' ')}
                        onClick={() => handleTransportChange('self')}
                      >
                        <Car size={15} /> Self Transport
                      </button>
                    </div>
                  </div>
                  <p className={styles.autoNote}>
                    Calculated automatically — Self Transport zeroes the transport charge and updates the total instantly.
                  </p>

                  <table className={styles.feeDetailsTable}>
                    <thead>
                      <tr>
                        <th>Fee Type</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className={styles.feeTypeCell}>
                            <span className={styles.feeTypeIcon}>
                              <UserRound size={16} />
                            </span>
                            <div>
                              <div className={styles.feeTypeName}>Academics Fee</div>
                              <div className={styles.feeTypeSub}>Tuition, Development, Library, Lab, etc.</div>
                            </div>
                          </div>
                        </td>
                        <td>₹{feeSplit.academic.amount.toLocaleString('en-IN')}</td>
                        <td className={styles.tone_success}>₹{feeSplit.academic.paid.toLocaleString('en-IN')}</td>
                        <td className={feeSplit.academic.balance > 0 ? styles.tone_danger : styles.tone_success}>
                          ₹{feeSplit.academic.balance.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <Badge label={FEE_STATUS_LABEL[feeSplit.academic.status]} tone={FEE_STATUS_TONE[feeSplit.academic.status]} />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className={styles.feeTypeCell}>
                            <span className={styles.feeTypeIcon}>
                              <Bus size={16} />
                            </span>
                            <div>
                              <div className={styles.feeTypeName}>Transport Fee</div>
                              <div className={styles.feeTypeSub}>
                                {transportType === 'bus' ? 'School Bus Charges' : 'Self Transport — not applicable'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>₹{feeSplit.transport.amount.toLocaleString('en-IN')}</td>
                        <td className={styles.tone_success}>₹{feeSplit.transport.paid.toLocaleString('en-IN')}</td>
                        <td className={feeSplit.transport.balance > 0 ? styles.tone_danger : styles.tone_success}>
                          ₹{feeSplit.transport.balance.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <Badge label={FEE_STATUS_LABEL[feeSplit.transport.status]} tone={FEE_STATUS_TONE[feeSplit.transport.status]} />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className={styles.totalForInstallment}>
                    <span className={styles.totalForInstallmentLabel}>
                      Total for {installmentDef?.label ?? INSTALLMENT_LABEL[installmentId]}
                    </span>
                    <div className={styles.totalForInstallmentRow}>
                      <div className={styles.totalForInstallmentItem}>
                        <span className={styles.feeLabel}>Total Amount</span>
                        <span className={styles.feeValue}>₹{totalFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={styles.totalForInstallmentItem}>
                        <span className={styles.feeLabel}>Total Paid</span>
                        <span className={[styles.feeValue, styles.tone_success].join(' ')}>₹{amountPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={styles.totalForInstallmentItem}>
                        <span className={styles.feeLabel}>Total Balance</span>
                        <span className={[styles.feeValue, balance > 0 ? styles.tone_danger : styles.tone_success].join(' ')}>
                          ₹{balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.balanceRow}>
                    <div className={styles.balanceItem}>
                      <span className={styles.feeLabel}>Due Date</span>
                      <span className={styles.balanceValue}>
                        {(() => {
                          try {
                            return dueDate ? format(parseISO(dueDate), 'd MMM yyyy') : '—';
                          } catch {
                            return dueDate || '—';
                          }
                        })()}
                      </span>
                    </div>
                    <div className={styles.balanceItem}>
                      <span className={styles.feeLabel}>Payment Status</span>
                      <Badge label={FEE_STATUS_LABEL[status]} tone={FEE_STATUS_TONE[status]} />
                    </div>
                  </div>
                </>
              )}
            </Card>

            <Card>
              <div className={styles.sectionTitle}>
                <CreditCard size={16} /> Record a Payment
              </div>
              {formError && (
                <div style={{ marginBottom: 12 }}>
                  <ErrorBanner message={formError} />
                </div>
              )}
              {!loading && balance <= 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={28} />}
                  title="Installment fully paid"
                  description="No balance remaining for this installment."
                  compact
                />
              ) : (
                <>
                  <div className={styles.formGrid}>
                    <TextField
                      label="Amount to Collect"
                      type="number"
                      min={1}
                      max={balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      hint={`Balance: ₹${balance.toLocaleString('en-IN')}`}
                    />
                    <TextField
                      label="Payment Date"
                      type="date"
                      value={paymentDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                    <SelectField
                      label="Payment Method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as FeePaymentMethod)}
                    >
                      {PAYMENT_METHOD_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {PAYMENT_METHOD_LABEL[m]}
                        </option>
                      ))}
                    </SelectField>
                    <TextField
                      label="Transaction / Reference No."
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="Optional"
                    />
                    <TextField label="Collected By" value={adminName} disabled />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <TextAreaField
                        label="Remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Optional note"
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button onClick={handleRecordPayment} loading={saving} icon={<Receipt size={16} />} className={styles.recordBtn}>
                    Record Payment
                  </Button>
                </>
              )}
            </Card>

            <Card padded={false}>
              <div className={styles.historyHeader}>
                <History size={16} /> Payment History — {installmentDef?.label ?? INSTALLMENT_LABEL[installmentId]}
              </div>
              {paymentsForInstallment.length === 0 ? (
                <div style={{ padding: 20 }}>
                  <EmptyState icon={<History size={28} />} title="No payments yet" compact />
                </div>
              ) : (
                <Table
                  columns={[
                    {
                      key: 'seq',
                      header: 'Part',
                      render: (p: FeePayment) => `Part ${combinedReceipt?.parts.find((part) => part.receiptNo === p.receiptNo)?.seq ?? ''}`,
                    },
                    { key: 'date', header: 'Date', render: (p: FeePayment) => p.paymentDate },
                    { key: 'receipt', header: 'Receipt No.', render: (p: FeePayment) => p.receiptNo },
                    { key: 'method', header: 'Payment Mode', render: (p: FeePayment) => PAYMENT_METHOD_LABEL[p.paymentMethod] },
                    { key: 'amount', header: 'Amount Paid', render: (p: FeePayment) => `₹${p.amount.toLocaleString('en-IN')}` },
                    { key: 'remarks', header: 'Remarks', render: (p: FeePayment) => p.remarks || '—' },
                  ]}
                  rows={paymentsForInstallment}
                  rowKey={(p) => p.id}
                />
              )}
            </Card>
          </div>

          <div className={styles.sidebar}>
            <Card>
              <div className={styles.studentCard}>
                <Avatar name={student.name} size={56} />
                <div className={styles.studentNameRow}>
                  <span className={styles.studentName}>{student.name}</span>
                  <Badge label="Active" tone="success" />
                </div>
                <div className={styles.studentDetailGrid}>
                  <div>
                    <span className={styles.feeLabel}>Admission No.</span>
                    <span className={styles.studentMeta}>{student.admissionNumber}</span>
                  </div>
                  <div>
                    <span className={styles.feeLabel}>Roll No.</span>
                    <span className={styles.studentMeta}>{student.rollNumber}</span>
                  </div>
                  <div>
                    <span className={styles.feeLabel}>Class & Section</span>
                    <span className={styles.studentMeta}>
                      {student.className} - {student.section}
                    </span>
                  </div>
                  <div>
                    <span className={styles.feeLabel}>Father's Name</span>
                    <span className={styles.studentMeta}>{student.fatherName || '—'}</span>
                  </div>
                  <div>
                    <span className={styles.feeLabel}>Mobile</span>
                    <span className={styles.studentMeta}>{student.guardianPhone || student.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className={styles.sectionTitle}>
                <Receipt size={16} /> Receipt Preview
              </div>
              {combinedReceipt ? (
                <>
                  <div className={styles.receiptSummary}>
                    <div className={styles.receiptSummaryRow}>
                      <span className={styles.feeLabel}>Receipt No. (Latest)</span>
                      <span className={styles.studentMeta}>{combinedReceipt.receiptNo}</span>
                    </div>
                    <div className={styles.receiptSummaryRow}>
                      <span className={styles.feeLabel}>Total Paid</span>
                      <span className={styles.studentMeta}>₹{combinedReceipt.totalPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={styles.receiptSummaryRow}>
                      <span className={styles.feeLabel}>Payments</span>
                      <span className={styles.studentMeta}>{combinedReceipt.parts.length}</span>
                    </div>
                    <div className={styles.receiptSummaryRow}>
                      <span className={styles.feeLabel}>Status</span>
                      <Badge label={FEE_STATUS_LABEL[combinedReceipt.status]} tone={FEE_STATUS_TONE[combinedReceipt.status]} />
                    </div>
                  </div>
                  <Button icon={<Eye size={14} />} onClick={() => setReceiptModalOpen(true)} className={styles.recordBtn}>
                    View Full Receipt
                  </Button>
                  <div className={styles.receiptActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={() => downloadReceiptPdf(combinedReceipt, school)}
                    >
                      Download
                    </Button>
                    <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => printReceiptPdf(combinedReceipt, school)}>
                      Print
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState icon={<Receipt size={28} />} title="No receipt yet" description="Record a payment to generate one." compact />
              )}
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={receiptModalOpen && !!combinedReceipt}
        title={`Receipt Preview${combinedReceipt ? ` · ${combinedReceipt.receiptNo}` : ''}`}
        onClose={() => setReceiptModalOpen(false)}
        width={680}
        footer={
          combinedReceipt && (
            <>
              <Button variant="outline" icon={<Printer size={16} />} onClick={() => printReceiptPdf(combinedReceipt, school)}>
                Print Receipt
              </Button>
              <Button icon={<Download size={16} />} onClick={() => downloadReceiptPdf(combinedReceipt, school)}>
                Download PDF
              </Button>
            </>
          )
        }
      >
        {combinedReceipt && <ReceiptView receipt={combinedReceipt} school={school} />}
      </Modal>
    </div>
  );
}
