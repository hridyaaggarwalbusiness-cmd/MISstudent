import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // error is surfaced via the store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logoMark}>MS</div>
        <div className={styles.heading}>
          <span className={styles.title}>MIS-Student Admin</span>
          <span className={styles.subtitle}>Sign in to manage your school</span>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <TextField
            label="Email"
            type="email"
            placeholder="admin@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={submitting} size="lg">
            Sign in
          </Button>
        </form>
        <span className={styles.footnote}>Access restricted to authorized school administrators.</span>
      </div>
    </div>
  );
}
