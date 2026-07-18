import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isBefore, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Bus,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  PercentCircle,
  Plus,
  Receipt,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Table, tableStyles } from '@/components/ui/Table';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatStrip } from '@/components/ui/StatStrip';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { RowActionMenu } from '@/components/fees/RowActionMenu';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { downloadCsv } from '@/utils/csv';
import { downloadReceiptPdf, viewReceiptPdf } from '@/utils/receiptPdf';
import { buildCombinedReceipt } from '@/utils/combinedReceipt';
import type { CombinedReceipt } from '@/utils/combinedReceipt';
import { splitFeeLines } from '@/utils/feeSplit';
import { FEE_STATUS_LABEL, FEE_STATUS_TONE, INSTALLMENT_LABEL, PAYMENT_METHOD_LABEL } from '@/utils/feeLabels';
import type {
  FeePayment,
  FeeStatus,
  FeeStructure,
  InstallmentId,
  SchoolClass,
  Student,
  StudentFeeRecord,
} from '@/types';
import styles from './FeesPage.module.css';

type InstallmentFilter = 'all' | InstallmentId;
type StatusFilter = 'all' | FeeStatus;

interface FeeRow {
  student: Student;
  installmentId: InstallmentId;
  academicFee: number;
  transportFee: number;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  dueDate: string;
}

function isOverdueDate(iso: string, ref: Date): boolean {
  if (!iso) return false;
  try {
    return isBefore(parseISO(iso), ref);
  } catch {
    return false;
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
}

export function FeesPage() {
  const navigate = useNavigate();
  const { show } = useToast();

  const { data: students, loading: studentsLoading } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: structures } = useCollection<FeeStructure>((cb) => repo.fees.subscribeAllStructures(cb));
  const { data: records } = useCollection<StudentFeeRecord>((cb) => repo.fees.subscribeAllStudentRecords(cb));
  const { data: payments } = useCollection<FeePayment>((cb) => repo.fees.subscribeAllPayments(cb, 500));
  const [school, setSchool] = useState({ name: 'MIS School', address: '', phone: '' });

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [installmentFilter, setInstallmentFilter] = useState<InstallmentFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [historyPayments, setHistoryPayments] = useState<FeePayment[]>([]);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [addPaymentQuery, setAddPaymentQuery] = useState('');

  useEffect(() => repo.school.subscribe((s) => s && setSchool(s)), []);

  useEffect(() => {
    if (!historyStudent) {
      setHistoryPayments([]);
      return;
    }
    return repo.fees.subscribePaymentsForStudent(historyStudent.id, setHistoryPayments);
  }, [historyStudent]);

  const historyByInstallment = useMemo(() => {
    const groups = new Map<InstallmentId, FeePayment[]>();
    historyPayments.forEach((p) => {
      const list = groups.get(p.installmentId) ?? [];
      list.push(p);
      groups.set(p.installmentId, list);
    });
    return (['1', '2'] as InstallmentId[])
      .map((id) => ({ id, receipt: buildCombinedReceipt(groups.get(id) ?? []) }))
      .filter((g): g is { id: InstallmentId; receipt: CombinedReceipt } => g.receipt !== null);
  }, [historyPayments]);

  const structuresByClass = useMemo(() => new Map(structures.map((s) => [s.classId, s])), [structures]);
  const recordsByKey = useMemo(() => new Map(records.map((r) => [`${r.studentId}_${r.installmentId}`, r])), [records]);

  function effectiveFee(student: Student, installmentId: InstallmentId): Omit<FeeRow, 'student' | 'installmentId'> {
    const structure = structuresByClass.get(student.classId);
    const installmentDef = structure?.installments.find((i) => i.id === installmentId);
    const record = recordsByKey.get(`${student.id}_${installmentId}`);
    const academicFee = record?.academicFee ?? installmentDef?.academicFee ?? 0;
    const transportFee = record?.transportFee ?? structure?.transportFeeAmount ?? 0;
    const totalFee = record?.totalFee ?? academicFee + transportFee;
    const amountPaid = record?.amountPaid ?? 0;
    const balance = record?.balance ?? Math.max(0, totalFee - amountPaid);
    const status: FeeStatus = record?.status ?? 'unpaid';
    const dueDate = record?.dueDate ?? installmentDef?.dueDate ?? '';
    return { academicFee, transportFee, totalFee, amountPaid, balance, status, dueDate };
  }

  const globalRows = useMemo<FeeRow[]>(
    () =>
      students.flatMap((student) =>
        (['1', '2'] as InstallmentId[]).map((installmentId) => ({
          student,
          installmentId,
          ...effectiveFee(student, installmentId),
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, structuresByClass, recordsByKey],
  );

  const today = useMemo(() => new Date(), []);
  const isOverdueRow = (row: FeeRow) => row.balance > 0 && isOverdueDate(row.dueDate, today);

  const totalStudents = students.length;
  const totalCollected = globalRows.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalExpected = globalRows.reduce((sum, r) => sum + r.totalFee, 0);
  const totalPending = globalRows.reduce((sum, r) => sum + r.balance, 0);
  const academicCollected = globalRows.reduce(
    (sum, r) => sum + (r.totalFee > 0 ? (r.academicFee / r.totalFee) * r.amountPaid : 0),
    0,
  );
  const transportCollected = Math.max(0, totalCollected - academicCollected);
  const overdueRows = globalRows.filter(isOverdueRow);
  const overdueStudentCount = new Set(overdueRows.map((r) => r.student.id)).size;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 1000) / 10 : 0;
  const todayIso = format(today, 'yyyy-MM-dd');
  const todaysCollection = payments.filter((p) => p.paymentDate === todayIso).reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { icon: <Users size={18} />, label: 'Total Students', value: totalStudents, tone: 'primary' as const },
    {
      icon: <Wallet size={18} />,
      label: 'Total Fee Collected',
      value: `₹${totalCollected.toLocaleString('en-IN')}`,
      tone: 'success' as const,
    },
    {
      icon: <Clock size={18} />,
      label: 'Pending Collection',
      value: `₹${totalPending.toLocaleString('en-IN')}`,
      tone: 'warning' as const,
    },
    {
      icon: <UserRound size={18} />,
      label: 'Academic Fee Collected',
      value: `₹${Math.round(academicCollected).toLocaleString('en-IN')}`,
      tone: 'info' as const,
    },
    {
      icon: <Bus size={18} />,
      label: 'Transport Fee Collected',
      value: `₹${Math.round(transportCollected).toLocaleString('en-IN')}`,
      tone: 'violet' as const,
    },
    {
      icon: <AlertTriangle size={18} />,
      label: 'Overdue Students',
      value: overdueStudentCount,
      tone: overdueStudentCount > 0 ? ('danger' as const) : ('success' as const),
    },
    {
      icon: <PercentCircle size={18} />,
      label: 'Collection Progress',
      value: `${collectionRate}%`,
      tone: 'primary' as const,
    },
  ];

  const filteredRows = useMemo(() => {
    return globalRows.filter((row) => {
      if (installmentFilter !== 'all' && row.installmentId !== installmentFilter) return false;
      if (classFilter && row.student.classId !== classFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (overdueOnly && !isOverdueRow(row)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!row.student.name.toLowerCase().includes(q) && !row.student.admissionNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalRows, installmentFilter, classFilter, statusFilter, overdueOnly, search]);

  function rowKey(row: FeeRow) {
    return `${row.student.id}_${row.installmentId}`;
  }

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === filteredRows.length && filteredRows.length > 0 ? new Set() : new Set(filteredRows.map(rowKey))));
  }

  function paymentsFor(studentId: string, installmentId: InstallmentId): FeePayment[] {
    return payments.filter((p) => p.studentId === studentId && p.installmentId === installmentId);
  }

  function goToDetail(row: FeeRow) {
    navigate(`/fees/${row.student.id}?installment=${row.installmentId}`);
  }

  function handleDownloadReceipt(row: FeeRow) {
    const receipt = buildCombinedReceipt(paymentsFor(row.student.id, row.installmentId));
    if (!receipt) {
      show('No payment recorded yet for this installment', 'info');
      return;
    }
    downloadReceiptPdf(receipt, school);
  }

  function handleBulkGenerateReceipts() {
    const rows = filteredRows.filter((r) => selected.has(rowKey(r)));
    let generated = 0;
    rows.forEach((row) => {
      const receipt = buildCombinedReceipt(paymentsFor(row.student.id, row.installmentId));
      if (receipt) {
        downloadReceiptPdf(receipt, school);
        generated++;
      }
    });
    show(
      generated > 0 ? `Downloaded ${generated} receipt(s)` : 'No payments recorded yet for the selected rows',
      generated > 0 ? 'success' : 'info',
    );
  }

  function handleExportExcel() {
    const rows = selected.size > 0 ? filteredRows.filter((r) => selected.has(rowKey(r))) : filteredRows;
    downloadCsv(
      `fee-collection-${todayIso}.csv`,
      [
        'Student',
        'Admission No.',
        'Class',
        'Installment',
        'Academic Fee',
        'Transport Fee',
        'Total Fee',
        'Amount Paid',
        'Balance',
        'Due Date',
        'Status',
      ],
      rows.map((r) => [
        r.student.name,
        r.student.admissionNumber,
        `${r.student.className} - ${r.student.section}`,
        INSTALLMENT_LABEL[r.installmentId],
        r.academicFee,
        r.transportFee,
        r.totalFee,
        r.amountPaid,
        r.balance,
        r.dueDate,
        FEE_STATUS_LABEL[r.status],
      ]),
    );
    show('Fee collection exported');
  }

  const installmentSummary = (['1', '2'] as InstallmentId[]).map((id) => {
    const rows = globalRows.filter((r) => r.installmentId === id);
    const paid = rows.filter((r) => r.status === 'paid').length;
    const partial = rows.filter((r) => r.status === 'partial').length;
    const unpaid = rows.filter((r) => r.status === 'unpaid').length;
    const collected = rows.reduce((sum, r) => sum + r.amountPaid, 0);
    const expected = rows.reduce((sum, r) => sum + r.totalFee, 0);
    const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;
    return { id, label: INSTALLMENT_LABEL[id], paid, partial, unpaid, collected, expected, pct };
  });

  const todaysActivity = payments.slice(0, 8);
  const loading = studentsLoading;

  const infoBarStructure = classFilter ? structuresByClass.get(classFilter) : structures[0];
  const infoBarInstallment =
    installmentFilter !== 'all' ? infoBarStructure?.installments.find((i) => i.id === installmentFilter) : undefined;
  const infoBarTotal = infoBarInstallment ? infoBarInstallment.academicFee + (infoBarStructure?.transportFeeAmount ?? 0) : 0;
  const infoBarOverdue = infoBarInstallment ? isOverdueDate(infoBarInstallment.dueDate, today) : false;

  const addPaymentMatches = addPaymentQuery
    ? students.filter((s) => {
        const q = addPaymentQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q);
      })
    : students;

  return (
    <div>
      <PageHeader
        title="Fees Overview"
        description="Track collections, dues and receipts across every student"
        toolbar={
          <Button icon={<Plus size={16} />} onClick={() => setAddPaymentOpen(true)}>
            Add Payment
          </Button>
        }
      />

      <StatStrip items={stats} />

      <div className={styles.summaryRow}>
        <Card>
          <div className={styles.sectionTitle}>
            <Receipt size={16} /> Today's Activity
          </div>
          <div className={styles.todayTotal}>₹{todaysCollection.toLocaleString('en-IN')} collected today</div>
          {todaysActivity.length === 0 ? (
            <EmptyState icon={<Receipt size={24} />} title="No payments yet" compact />
          ) : (
            <div className={styles.activityList}>
              {todaysActivity.map((p) => (
                <button key={p.id} className={styles.activityItem} onClick={() => navigate(`/fees/${p.studentId}?installment=${p.installmentId}`)}>
                  <Avatar name={p.studentName} size={30} />
                  <div className={styles.activityBody}>
                    <span className={styles.activityName}>{p.studentName}</span>
                    <span className={styles.activityMeta}>
                      {INSTALLMENT_LABEL[p.installmentId]} · {PAYMENT_METHOD_LABEL[p.paymentMethod]}
                    </span>
                  </div>
                  <span className={styles.activityAmount}>₹{p.amount.toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className={styles.sectionTitle}>
            <Wallet size={16} /> Installment Summary
          </div>
          {installmentSummary.map((s) => (
            <div key={s.id} className={styles.installmentSummaryRow}>
              <div className={styles.installmentSummaryHead}>
                <span className={styles.installmentSummaryLabel}>{s.label}</span>
                <span className={styles.installmentSummaryPct}>{s.pct}%</span>
              </div>
              <ProgressBar value={s.pct} color={s.pct >= 100 ? 'var(--color-success)' : 'var(--color-primary)'} />
              <div className={styles.installmentSummaryBreakdown}>
                <Badge label={`${s.paid} Paid`} tone="success" />
                <Badge label={`${s.partial} Partial`} tone="warning" />
                <Badge label={`${s.unpaid} Unpaid`} tone="danger" />
              </div>
            </div>
          ))}
          <div className={styles.installmentSummaryTotal}>
            <span>Total (Both Installments)</span>
            <div className={styles.installmentSummaryTotalRow}>
              <span>₹{installmentSummary.reduce((s, i) => s + i.expected, 0).toLocaleString('en-IN')} Total Due</span>
              <span>₹{installmentSummary.reduce((s, i) => s + i.collected, 0).toLocaleString('en-IN')} Collected</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className={styles.filterRow}>
          <input
            className={pageHeaderStyles.search}
            placeholder="Search name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={pageHeaderStyles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
          <select
            className={pageHeaderStyles.select}
            value={installmentFilter}
            onChange={(e) => setInstallmentFilter(e.target.value as InstallmentFilter)}
          >
            <option value="all">Both Installments</option>
            <option value="1">1st Installment</option>
            <option value="2">2nd Installment</option>
          </select>
          <select
            className={pageHeaderStyles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button
            type="button"
            className={[styles.overdueChip, overdueOnly && styles.overdueChipActive].filter(Boolean).join(' ')}
            onClick={() => setOverdueOnly((v) => !v)}
          >
            <AlertTriangle size={13} /> Overdue only
          </button>
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} disabled={filteredRows.length === 0}>
            {selected.size === filteredRows.length && filteredRows.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button variant="outline" icon={<FileSpreadsheet size={16} />} onClick={handleExportExcel} className={styles.exportBtn}>
            Export Excel
          </Button>
        </div>
      </Card>

      {infoBarInstallment && (
        <Card>
          <div className={styles.infoBar}>
            <div className={styles.infoBarItem}>
              <span className={styles.infoBarLabel}>Installment</span>
              <span className={styles.infoBarValue}>{infoBarInstallment.label}</span>
            </div>
            <div className={styles.infoBarItem}>
              <span className={styles.infoBarLabel}>Due Date</span>
              <span className={styles.infoBarValue}>{formatDate(infoBarInstallment.dueDate)}</span>
            </div>
            <div className={styles.infoBarItem}>
              <span className={styles.infoBarLabel}>Status</span>
              <Badge label={infoBarOverdue ? 'Overdue' : 'Upcoming'} tone={infoBarOverdue ? 'danger' : 'info'} />
            </div>
            <div className={styles.infoBarItem}>
              <span className={styles.infoBarLabel}>Standard Amount</span>
              <span className={styles.infoBarValue}>₹{infoBarTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.main}>
        <Card padded={false}>
            {loading ? (
              <div style={{ padding: 20 }}>
                <SkeletonRows count={6} />
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState icon={<Wallet size={32} />} title="No matching students" description="Adjust your filters to see fee records." />
            ) : (
              <div className={styles.feeTableWrap}>
                <table className={styles.feeTable}>
                  <thead>
                    <tr>
                      <th rowSpan={2} className={styles.checkboxCol}>
                        <input
                          type="checkbox"
                          checked={selected.size === filteredRows.length && filteredRows.length > 0}
                          onChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th rowSpan={2}>Student</th>
                      <th rowSpan={2}>Class / Roll No.</th>
                      <th colSpan={3} className={styles.groupHeadTransport}>
                        Transport Fee (₹)
                      </th>
                      <th colSpan={3} className={styles.groupHeadAcademic}>
                        Academics Fee (₹)
                      </th>
                      <th colSpan={3} className={styles.groupHeadTotal}>
                        Total (₹)
                      </th>
                      <th rowSpan={2}>Status</th>
                      <th rowSpan={2}>Installment</th>
                      <th rowSpan={2} className={styles.actionsCol}>
                        Actions
                      </th>
                    </tr>
                    <tr>
                      <th className={styles.subHead}>Amount</th>
                      <th className={styles.subHead}>Paid</th>
                      <th className={styles.subHead}>Balance</th>
                      <th className={styles.subHead}>Amount</th>
                      <th className={styles.subHead}>Paid</th>
                      <th className={styles.subHead}>Balance</th>
                      <th className={styles.subHead}>Total</th>
                      <th className={styles.subHead}>Paid</th>
                      <th className={styles.subHead}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const split = splitFeeLines(row.academicFee, row.transportFee, row.amountPaid);
                      const key = rowKey(row);
                      return (
                        <tr key={key}>
                          <td className={styles.checkboxCol}>
                            <input
                              type="checkbox"
                              checked={selected.has(key)}
                              onChange={() => toggleSelected(key)}
                              aria-label={`Select ${row.student.name}`}
                            />
                          </td>
                          <td>
                            <div className={styles.studentCell}>
                              <Avatar name={row.student.name} />
                              <div>
                                <div className={styles.studentName}>{row.student.name}</div>
                                <div className={styles.studentSub}>{row.student.admissionNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.studentName}>
                              {row.student.className} - {row.student.section}
                            </div>
                            <div className={styles.studentSub}>Roll {row.student.rollNumber}</div>
                          </td>
                          <td>₹{split.transport.amount.toLocaleString('en-IN')}</td>
                          <td>₹{split.transport.paid.toLocaleString('en-IN')}</td>
                          <td className={split.transport.balance > 0 ? styles.tone_danger : styles.tone_success}>
                            ₹{split.transport.balance.toLocaleString('en-IN')}
                          </td>
                          <td>₹{split.academic.amount.toLocaleString('en-IN')}</td>
                          <td>₹{split.academic.paid.toLocaleString('en-IN')}</td>
                          <td className={split.academic.balance > 0 ? styles.tone_danger : styles.tone_success}>
                            ₹{split.academic.balance.toLocaleString('en-IN')}
                          </td>
                          <td>₹{row.totalFee.toLocaleString('en-IN')}</td>
                          <td>₹{row.amountPaid.toLocaleString('en-IN')}</td>
                          <td className={row.balance > 0 ? styles.tone_danger : styles.tone_success}>
                            ₹{row.balance.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <Badge label={FEE_STATUS_LABEL[row.status]} tone={FEE_STATUS_TONE[row.status]} />
                          </td>
                          <td>
                            <Badge label={INSTALLMENT_LABEL[row.installmentId]} tone="neutral" />
                          </td>
                          <td className={styles.actionsCol}>
                            <RowActionMenu
                              onViewDetails={() => goToDetail(row)}
                              onUpdatePayment={() => goToDetail(row)}
                              onDownloadReceipt={() => handleDownloadReceipt(row)}
                              onPaymentHistory={() => setHistoryStudent(row.student)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
      </div>

      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.size} selected</span>
          <Button variant="secondary" size="sm" icon={<Receipt size={14} />} onClick={handleBulkGenerateReceipts}>
            Generate Receipts
          </Button>
          <Button variant="secondary" size="sm" icon={<FileSpreadsheet size={14} />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setSelected(new Set())} style={{ color: '#fff' }}>
            Clear
          </Button>
        </div>
      )}

      <Modal
        open={!!historyStudent}
        title={`Payment History${historyStudent ? ` · ${historyStudent.name}` : ''}`}
        onClose={() => setHistoryStudent(null)}
        width={760}
      >
        {historyByInstallment.length === 0 ? (
          <EmptyState icon={<History size={28} />} title="No payments yet" compact />
        ) : (
          <div className={styles.historyGroups}>
            {historyByInstallment.map(({ id, receipt }) => (
              <div key={id} className={styles.historyGroup}>
                <div className={styles.historyGroupHead}>
                  <div>
                    <span className={styles.historyGroupTitle}>{INSTALLMENT_LABEL[id]}</span>
                    <Badge label={FEE_STATUS_LABEL[receipt.status]} tone={FEE_STATUS_TONE[receipt.status]} />
                  </div>
                  <div className={tableStyles.actions}>
                    <IconButton icon={Eye} onClick={() => viewReceiptPdf(receipt, school)} aria-label="View receipt" />
                    <IconButton icon={Download} onClick={() => downloadReceiptPdf(receipt, school)} aria-label="Download receipt" />
                  </div>
                </div>
                <Table
                  rowKey={(p) => p.receiptNo}
                  rows={receipt.parts}
                  columns={[
                    { key: 'seq', header: 'Part', render: (p) => `Part ${p.seq}` },
                    { key: 'date', header: 'Date', render: (p) => formatDate(p.paymentDate) },
                    { key: 'method', header: 'Payment Mode', render: (p) => PAYMENT_METHOD_LABEL[p.paymentMethod] },
                    { key: 'receipt', header: 'Receipt No.', render: (p) => p.receiptNo },
                    { key: 'amount', header: 'Amount Paid', render: (p) => `₹${p.amount.toLocaleString('en-IN')}` },
                  ]}
                />
                <div className={styles.historyGroupTotal}>
                  <span>Total Paid: ₹{receipt.totalPaid.toLocaleString('en-IN')}</span>
                  <span>Balance: ₹{receipt.balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={addPaymentOpen}
        title="Add Payment"
        onClose={() => {
          setAddPaymentOpen(false);
          setAddPaymentQuery('');
        }}
        width={480}
      >
        <input
          className={pageHeaderStyles.search}
          style={{ width: '100%', marginBottom: 12 }}
          placeholder="Search student by name or admission no..."
          value={addPaymentQuery}
          onChange={(e) => setAddPaymentQuery(e.target.value)}
          autoFocus
        />
        <div className={styles.addPaymentList}>
          {addPaymentMatches.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="No students found" compact />
          ) : (
            addPaymentMatches.slice(0, 30).map((s) => (
              <button
                key={s.id}
                className={styles.addPaymentRow}
                onClick={() => {
                  setAddPaymentOpen(false);
                  setAddPaymentQuery('');
                  navigate(`/fees/${s.id}`);
                }}
              >
                <Avatar name={s.name} size={32} />
                <div className={styles.activityBody}>
                  <span className={styles.activityName}>{s.name}</span>
                  <span className={styles.activityMeta}>
                    {s.admissionNumber} · {s.className} - {s.section}
                  </span>
                </div>
                <ChevronRight size={16} />
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
