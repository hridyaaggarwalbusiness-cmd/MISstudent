import { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isWeekend,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { ChevronDown } from 'lucide-react';
import type { AttendanceRecord, Student } from '@/types';
import styles from './AttendanceTrendChart.module.css';

type Range = 'week' | 'month' | 'year';

const RANGE_LABEL: Record<Range, string> = { week: 'This Week', month: 'This Month', year: 'This Year' };

interface Point {
  label: string;
  pct: number;
}

function pctForDay(day: Date, students: Student[], records: AttendanceRecord[]): number | null {
  if (students.length === 0) return null;
  const iso = format(day, 'yyyy-MM-dd');
  let present = 0;
  students.forEach((s) => {
    const rec = records.find((r) => r.studentId === s.id && r.date === iso);
    const status = rec?.status ?? 'present';
    if (status === 'present' || status === 'late') present++;
  });
  return Math.round((present / students.length) * 1000) / 10;
}

function schoolDaysBack(count: number, holidays: Set<string>): Date[] {
  const days: Date[] = [];
  let cursor = new Date();
  while (days.length < count) {
    if (!isWeekend(cursor) && !holidays.has(format(cursor, 'yyyy-MM-dd'))) days.unshift(new Date(cursor));
    cursor = subDays(cursor, 1);
  }
  return days;
}

export function AttendanceTrendChart({
  students,
  records,
  holidays,
}: {
  students: Student[];
  records: AttendanceRecord[];
  holidays: Set<string>;
}) {
  const [range, setRange] = useState<Range>('week');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const points: Point[] = useMemo(() => {
    if (range === 'week') {
      return schoolDaysBack(6, holidays).map((d) => ({
        label: format(d, 'EEE'),
        pct: pctForDay(d, students, records) ?? 0,
      }));
    }
    if (range === 'month') {
      const today = new Date();
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      const days = eachDayOfInterval({ start, end }).filter(
        (d) => !isWeekend(d) && !isAfter(d, today) && !holidays.has(format(d, 'yyyy-MM-dd')),
      );
      const weeks: Date[][] = [];
      days.forEach((d) => {
        const weekIdx = Math.floor((d.getDate() - 1) / 7);
        weeks[weekIdx] = weeks[weekIdx] ?? [];
        weeks[weekIdx].push(d);
      });
      return weeks
        .filter(Boolean)
        .map((week, i) => {
          const vals = week.map((d) => pctForDay(d, students, records) ?? 0);
          return { label: `Wk ${i + 1}`, pct: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 };
        });
    }
    // year: average per month for the last 12 months
    const months = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), 11 - i));
    return months.map((m) => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const today = new Date();
      const days = eachDayOfInterval({ start, end }).filter(
        (d) => !isWeekend(d) && !isAfter(d, today) && !holidays.has(format(d, 'yyyy-MM-dd')),
      );
      if (days.length === 0) return { label: format(m, 'MMM'), pct: 0 };
      const vals = days.map((d) => pctForDay(d, students, records) ?? 0);
      return { label: format(m, 'MMM'), pct: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 };
    });
  }, [range, students, records, holidays]);

  const width = 640;
  const height = 200;
  const padding = 28;
  const maxPct = 100;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? padding + (i / (points.length - 1)) * (width - padding * 2) : width / 2;
    const y = height - padding - (p.pct / maxPct) * (height - padding * 2);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${height - padding} L ${coords[0]?.x ?? 0} ${height - padding} Z`;

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.title}>Attendance Overview</span>
        <div className={styles.rangeWrap}>
          <button className={styles.rangeBtn} onClick={() => setMenuOpen((v) => !v)}>
            {RANGE_LABEL[range]} <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <>
              <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
              <div className={styles.rangeMenu}>
                {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                  <button
                    key={r}
                    className={styles.rangeMenuItem}
                    onClick={() => {
                      setRange(r);
                      setMenuOpen(false);
                    }}
                  >
                    {RANGE_LABEL[r]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - padding - (tick / 100) * (height - padding * 2);
          return (
            <g key={tick}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className={styles.gridLine} />
              <text x={4} y={y + 3} className={styles.axisLabel}>
                {tick}%
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#attendanceFill)" />
        <path d={linePath} className={styles.line} />
        {coords.map((c, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))}>
            <rect x={c.x - (width / points.length) / 2} y={0} width={width / points.length} height={height} fill="transparent" />
            <circle cx={c.x} cy={c.y} r={hover === i ? 5 : 3.5} className={styles.dot} />
            <text x={c.x} y={height - 6} textAnchor="middle" className={styles.axisLabel}>
              {c.label}
            </text>
            {hover === i && (
              <g transform={`translate(${c.x}, ${c.y - 14})`}>
                <rect x={-24} y={-20} width={48} height={22} rx={6} className={styles.tooltipBg} />
                <text x={0} y={-4} textAnchor="middle" className={styles.tooltipText}>
                  {c.pct}%
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
