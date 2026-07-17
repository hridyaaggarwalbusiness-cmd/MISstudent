import { useNavigate } from 'react-router-dom';
import { UserPlus, GraduationCap, School, ClipboardCheck, Megaphone, FlaskConical } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import styles from './AppLayout.module.css';

interface QuickActionModalProps {
  open: boolean;
  onClose: () => void;
}

const ACTIONS = [
  { key: 'student', icon: UserPlus, label: 'Add Student', to: '/students', color: 'var(--color-primary)' },
  { key: 'teacher', icon: GraduationCap, label: 'Add Teacher', to: '/teachers', color: 'var(--color-info-strong)' },
  { key: 'class', icon: School, label: 'Add Class', to: '/classes', color: 'var(--color-violet)' },
  { key: 'attendance', icon: ClipboardCheck, label: 'Mark Attendance', to: '/attendance', color: 'var(--color-success-strong)' },
  { key: 'notice', icon: Megaphone, label: 'Post Notice', to: '/notices', color: 'var(--color-danger-strong)' },
  { key: 'exam', icon: FlaskConical, label: 'Schedule Exam', to: '/exams', color: 'var(--color-warning-strong)' },
];

export function QuickActionModal({ open, onClose }: QuickActionModalProps) {
  const navigate = useNavigate();

  function go(to: string) {
    onClose();
    navigate(to, { state: { openCreate: true } });
  }

  return (
    <Modal open={open} title="Quick Action" onClose={onClose} width={520}>
      <div className={styles.quickGrid}>
        {ACTIONS.map((a) => (
          <button key={a.key} className={styles.quickTile} onClick={() => go(a.to)}>
            <span className={styles.quickTileIcon} style={{ color: a.color, background: `color-mix(in srgb, ${a.color} 14%, transparent)` }}>
              <a.icon size={20} />
            </span>
            <span className={styles.quickTileLabel}>{a.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
