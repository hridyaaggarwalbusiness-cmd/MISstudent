import { useState } from 'react';
import styles from './AttendanceColumnChart3D.module.css';

export interface Bar3DDatum {
  id: string;
  label: string;
  value: number;
  students: number;
}

const WIDTH = 760;
const HEIGHT = 320;
const PAD_LEFT = 42;
const PAD_RIGHT = 24;
const PAD_TOP = 46;
const PAD_BOTTOM = 46;
const DEPTH_X = 12;
const DEPTH_Y = 10;

// Color-codes each column by attendance health, the same thresholds used
// elsewhere in the app (AttendancePage's at-risk banding), so the chart
// carries meaning at a glance rather than just being a single flat color.
function toneFor(pct: number) {
  if (pct >= 90) return { top: '#6ee7b7', front: '#10b981', side: '#047857', topFace: '#d1fae5' };
  if (pct >= 75) return { top: '#fcd34d', front: '#f59e0b', side: '#b45309', topFace: '#fef3c7' };
  return { top: '#fda4af', front: '#f43f5e', side: '#be123c', topFace: '#ffe4e6' };
}

export function AttendanceColumnChart3D({ data }: { data: Bar3DDatum[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const chartWidth = WIDTH - PAD_LEFT - PAD_RIGHT - DEPTH_X;
  const chartHeight = HEIGHT - PAD_TOP - PAD_BOTTOM - DEPTH_Y;
  const baseline = HEIGHT - PAD_BOTTOM;
  const n = Math.max(data.length, 1);
  const slot = chartWidth / n;
  const barWidth = Math.min(48, slot * 0.5);

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg}>
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = baseline - (tick / 100) * chartHeight;
          return (
            <g key={tick}>
              <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} className={styles.gridLine} />
              <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" className={styles.axisLabel}>
                {tick}%
              </text>
            </g>
          );
        })}

        <polygon
          points={`${PAD_LEFT},${baseline} ${WIDTH - PAD_RIGHT - DEPTH_X},${baseline} ${WIDTH - PAD_RIGHT},${baseline - DEPTH_Y} ${PAD_LEFT + DEPTH_X},${baseline - DEPTH_Y}`}
          className={styles.floor}
        />

        {data.map((d, i) => {
          const x = PAD_LEFT + i * slot + (slot - barWidth) / 2;
          const barHeight = Math.max(3, (d.value / 100) * chartHeight);
          const yTop = baseline - barHeight;
          const tone = toneFor(d.value);
          const isHover = hover === d.id;
          const cx = x + barWidth / 2 + DEPTH_X / 2;
          const frontId = `attendance3d-front-${d.id}`;

          return (
            <g
              key={d.id}
              onMouseEnter={() => setHover(d.id)}
              onMouseLeave={() => setHover((h) => (h === d.id ? null : h))}
              className={styles.barGroup}
            >
              <rect x={x - 6} y={PAD_TOP} width={barWidth + DEPTH_X + 12} height={chartHeight + PAD_BOTTOM + DEPTH_Y} fill="transparent" />

              <defs>
                <linearGradient id={frontId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone.top} />
                  <stop offset="100%" stopColor={tone.front} />
                </linearGradient>
              </defs>

              <polygon
                points={`${x + barWidth},${yTop} ${x + barWidth + DEPTH_X},${yTop - DEPTH_Y} ${x + barWidth + DEPTH_X},${baseline - DEPTH_Y} ${x + barWidth},${baseline}`}
                fill={tone.side}
                opacity={isHover ? 1 : 0.9}
              />

              <polygon
                points={`${x},${yTop} ${x + barWidth},${yTop} ${x + barWidth + DEPTH_X},${yTop - DEPTH_Y} ${x + DEPTH_X},${yTop - DEPTH_Y}`}
                fill={tone.topFace}
                opacity={isHover ? 1 : 0.95}
              />

              <rect
                x={x}
                y={yTop}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={`url(#${frontId})`}
                className={isHover ? styles.barFrontHover : styles.barFront}
              />

              <text x={cx} y={yTop - DEPTH_Y - 10} textAnchor="middle" className={styles.valueLabel}>
                {d.value}%
              </text>

              <text x={cx} y={baseline + 20} textAnchor="middle" className={styles.axisLabel}>
                {d.label}
              </text>

              {isHover && (
                <g transform={`translate(${cx}, ${yTop - DEPTH_Y - 34})`}>
                  <rect x={-46} y={-20} width={92} height={24} rx={6} className={styles.tooltipBg} />
                  <text x={0} y={-4} textAnchor="middle" className={styles.tooltipText}>
                    {d.students} student{d.students === 1 ? '' : 's'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
