import { useEffect, useState } from 'react';
import { School, UserCircle, Bell } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/FormField';
import { Switch } from '@/components/ui/Switch';
import { PageHeader } from '@/pages/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { SchoolProfile } from '@/types';
import styles from './SettingsPage.module.css';

const PREFS_KEY = 'mis-admin:notification-prefs';

function loadPrefs(): { email: boolean; push: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { email: true, push: true };
  } catch {
    return { email: true, push: true };
  }
}

export function SettingsPage() {
  const { profile } = useAuthStore();
  const { show } = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [school, setSchool] = useState<SchoolProfile>({ name: '', address: '', phone: '' });
  const [savingSchool, setSavingSchool] = useState(false);

  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => repo.school.subscribe((s) => s && setSchool(s)), []);
  useEffect(() => setDisplayName(profile?.displayName ?? ''), [profile?.displayName]);

  async function saveProfile() {
    if (!profile) return;
    setSavingProfile(true);
    try {
      await repo.admins.update(profile.id, { displayName: displayName.trim() || profile.displayName });
      show('Profile updated');
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveSchool() {
    setSavingSchool(true);
    try {
      await repo.school.update(school);
      show('School profile updated');
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setSavingSchool(false);
    }
  }

  function updatePrefs(next: Partial<typeof prefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, school profile and notification preferences" />

      <div className={styles.grid}>
        <Card>
          <div className={styles.cardTitle}>
            <UserCircle size={16} /> Admin Account
          </div>
          <div className={styles.form}>
            <TextField label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <TextField label="Email" value={profile?.email ?? ''} disabled />
            <Button onClick={saveProfile} loading={savingProfile} className={styles.saveBtn}>
              Save Profile
            </Button>
          </div>
        </Card>

        <Card>
          <div className={styles.cardTitle}>
            <School size={16} /> School Profile
          </div>
          <div className={styles.form}>
            <TextField label="School Name" value={school.name} onChange={(e) => setSchool((s) => ({ ...s, name: e.target.value }))} />
            <TextField label="Address" value={school.address} onChange={(e) => setSchool((s) => ({ ...s, address: e.target.value }))} />
            <TextField label="Contact Phone" value={school.phone} onChange={(e) => setSchool((s) => ({ ...s, phone: e.target.value }))} />
            <Button onClick={saveSchool} loading={savingSchool} className={styles.saveBtn}>
              Save School Profile
            </Button>
          </div>
        </Card>

        <Card>
          <div className={styles.cardTitle}>
            <Bell size={16} /> Notification Preferences
          </div>
          <div className={styles.prefRow}>
            <Switch checked={prefs.push} onChange={(v) => updatePrefs({ push: v })} label="In-app push notifications" />
          </div>
          <div className={styles.prefRow}>
            <div className={styles.prefRowMain}>
              <Switch checked={prefs.email} onChange={(v) => updatePrefs({ email: v })} label="Email digest for notices & alerts" />
            </div>
            <Badge label="Coming soon" tone="neutral" />
          </div>
          <p className={styles.prefNote}>
            Preferences are saved now; actual email/SMS delivery requires a paid Firebase plan (Cloud Functions) and
            isn't wired up on this project yet.
          </p>
        </Card>
      </div>
    </div>
  );
}
