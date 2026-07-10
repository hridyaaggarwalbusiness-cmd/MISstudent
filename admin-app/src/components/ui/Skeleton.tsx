import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonRows({ count = 5, height = 52 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} radius="var(--radius-md)" />
      ))}
    </div>
  );
}
