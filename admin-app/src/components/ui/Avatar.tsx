import styles from './Avatar.module.css';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initialsOf(name || '?')}
    </div>
  );
}
