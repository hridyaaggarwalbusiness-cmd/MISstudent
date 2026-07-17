import { useMemo, useState } from 'react';
import { eachDayOfInterval, endOfMonth, format, isAfter, isWeekend, startOfMonth } from 'date-fns';
import { Download, BarChart3, CheckCircle2, NotebookPen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { useToast } from '@/components/ui/Toast';
import type { AttendanceRecord, CalendarEvent, Exam, ExamResult, Homework, SchoolClass, Student } from '@/types';
import styles from './ReportsPage.module.css';

function schoolDaysInMonth(monthDate: Date, holidayDates: Set<string>): string[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const today = new Date();
  return eachDayOfInterval({ start, end })
    .filter((d) => !isWeekend(d) && !isAfter(d, today))
    .map((d) => format(d, 'yyyy-MM-dd'))
    .filter((iso) => !holidayDates.has(iso));
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { show } = useToast();
  const [monthDate] = useState(new Date());
  const { data: classes, loading: classesLoading } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: students } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: attendance, loading: attendanceLoading } = useCollection<AttendanceRecord>((cb) =>
    repo.attendance.subscribeAll(cb),
  );
  const { data: events } = useCollection<CalendarEvent>((cb) => repo.calendar.subscribeAll(cb));
  const { data: results, loading: resultsLoading } = useCollection<ExamResult>((cb) => repo.results.subscribeAll(cb));
  const { data: exams } = useCollection<Exam>((cb) => repo.exams.subscribeAll(cb));
  const { data: homework, loading: homeworkLoading } = useCollection<Homework>((cb) => repo.homework.subscribeAll(cb));

  const holidayDates = useMemo(() => {
    const set = new Set<string>();
    events
      .filter((e) => e.type === 'holiday')
      .forEach((e) => {
        eachDayOfInterval({ start: new Date(e.date), end: new Date(e.endDate || e.date) }).forEach((d) =>
          set.add(format(d, 'yyyy-MM-dd')),
        );
      });
    return set;
  }, [events]);

  const schoolDays = useMemo(() => schoolDaysInMonth(monthDate, holidayDates), [monthDate, holidayDates]);
  const monthKey = format(monthDate, 'yyyy-MM');

  const attendanceByClass = useMemo(() => {
    return classes.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id);
      const monthRecords = attendance.filter((r) => r.classId === c.id && r.date.startsWith(monthKey));
      let presentDays = 0;
      const totalDays = classStudents.length * schoolDays.length;
      classStudents.forEach((s) => {
        schoolDays.forEach((day) => {
          const record = monthRecords.find((r) => r.studentId === s.id && r.date === day);
          const status = record?.status ?? 'present';
          if (status === 'present' || status === 'late') presentDays++;
        });
      });
      const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;
      return { class: c, pct, students: classStudents.length };
    });
  }, [classes, students, attendance, schoolDays, monthKey]);

  const resultsByExam = useMemo(() => {
    const byExam = new Map<string, ExamResult[]>();
    results.forEach((r) => {
      const list = byExam.get(r.examId) ?? [];
      list.push(r);
      byExam.set(r.examId, list);
    });
    return Array.from(byExam.entries()).map(([examId, rows]) => {
      const exam = exams.find((e) => e.id === examId);
      const pcts = rows.map((r) => (r.marksObtained / r.maxMarks) * 100);
      const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
      return {
        examId,
        name: exam?.name ?? rows[0]?.examName ?? examId,
        subject: exam?.subject ?? rows[0]?.subject ?? '',
        count: rows.length,
        avg: Math.round(avg * 10) / 10,
        highest: Math.round(Math.max(...pcts) * 10) / 10,
        lowest: Math.round(Math.min(...pcts) * 10) / 10,
      };
    });
  }, [results, exams]);

  const homeworkByClass = useMemo(() => {
    return classes.map((c) => ({
      class: c,
      count: homework.filter((h) => h.classId === c.id).length,
    }));
  }, [classes, homework]);

  const loading = classesLoading || attendanceLoading || resultsLoading || homeworkLoading;

  function exportAttendance() {
    downloadCsv(
      `attendance-report-${monthKey}.csv`,
      ['Class', 'Section', 'Students', 'Attendance %'],
      attendanceByClass.map((r) => [r.class.name, r.class.section, r.students, r.pct]),
    );
    show('Attendance report exported');
  }

  function exportResults() {
    downloadCsv(
      'exam-results-report.csv',
      ['Exam', 'Subject', 'Results Recorded', 'Average %', 'Highest %', 'Lowest %'],
      resultsByExam.map((r) => [r.name, r.subject, r.count, r.avg, r.highest, r.lowest]),
    );
    show('Results report exported');
  }

  function exportHomework() {
    downloadCsv(
      `homework-report-${monthKey}.csv`,
      ['Class', 'Section', 'Assignments Posted'],
      homeworkByClass.map((r) => [r.class.name, r.class.section, r.count]),
    );
    show('Homework report exported');
  }

  return (
    <div>
      <PageHeader title="Reports" description={`Aggregated reports for ${format(monthDate, 'MMMM yyyy')}`} />

      <div className={styles.grid}>
        <Card>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <CheckCircle2 size={16} /> Attendance by Class
            </span>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportAttendance} disabled={!attendanceByClass.length}>
              Export CSV
            </Button>
          </div>
          {loading ? (
            <SkeletonRows count={4} />
          ) : attendanceByClass.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={28} />} title="No classes yet" compact />
          ) : (
            <Table
              rowKey={(r) => r.class.id}
              rows={attendanceByClass}
              columns={[
                { key: 'class', header: 'Class', render: (r) => `${r.class.name} - ${r.class.section}` },
                { key: 'students', header: 'Students', render: (r) => r.students },
                { key: 'pct', header: 'Attendance %', render: (r) => `${r.pct}%` },
              ]}
            />
          )}
        </Card>

        <Card>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <BarChart3 size={16} /> Exam Results
            </span>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportResults} disabled={!resultsByExam.length}>
              Export CSV
            </Button>
          </div>
          {loading ? (
            <SkeletonRows count={4} />
          ) : resultsByExam.length === 0 ? (
            <EmptyState icon={<BarChart3 size={28} />} title="No results recorded yet" compact />
          ) : (
            <Table
              rowKey={(r) => r.examId}
              rows={resultsByExam}
              columns={[
                { key: 'name', header: 'Exam', render: (r) => `${r.name} · ${r.subject}` },
                { key: 'count', header: 'Results', render: (r) => r.count },
                { key: 'avg', header: 'Average', render: (r) => `${r.avg}%` },
                { key: 'highest', header: 'Highest', render: (r) => `${r.highest}%` },
                { key: 'lowest', header: 'Lowest', render: (r) => `${r.lowest}%` },
              ]}
            />
          )}
        </Card>

        <Card>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <NotebookPen size={16} /> Homework Volume
            </span>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportHomework} disabled={!homeworkByClass.length}>
              Export CSV
            </Button>
          </div>
          {loading ? (
            <SkeletonRows count={4} />
          ) : homeworkByClass.length === 0 ? (
            <EmptyState icon={<NotebookPen size={28} />} title="No classes yet" compact />
          ) : (
            <Table
              rowKey={(r) => r.class.id}
              rows={homeworkByClass}
              columns={[
                { key: 'class', header: 'Class', render: (r) => `${r.class.name} - ${r.class.section}` },
                { key: 'count', header: 'Assignments Posted', render: (r) => r.count },
              ]}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
