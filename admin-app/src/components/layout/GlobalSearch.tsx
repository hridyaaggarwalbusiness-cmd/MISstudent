import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, GraduationCap, School } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { SchoolClass, Student, Teacher } from '@/types';
import styles from './AppLayout.module.css';

interface Result {
  key: string;
  icon: typeof Users;
  title: string;
  subtitle: string;
  onSelect: () => void;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const { data: students } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: teachers } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results: Result[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];
    students
      .filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.includes(q) || s.admissionNumber.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((s) =>
        out.push({
          key: `s-${s.id}`,
          icon: Users,
          title: s.name,
          subtitle: `Student · ${s.className} - ${s.section} · Roll ${s.rollNumber}`,
          onSelect: () => navigate(`/students?q=${encodeURIComponent(s.name)}`),
        }),
      );
    teachers
      .filter((t) => t.name.toLowerCase().includes(q) || t.subjects.some((sub) => sub.toLowerCase().includes(q)))
      .slice(0, 5)
      .forEach((t) =>
        out.push({
          key: `t-${t.id}`,
          icon: GraduationCap,
          title: t.name,
          subtitle: `Teacher · ${t.subjects.join(', ')}`,
          onSelect: () => navigate(`/teachers?q=${encodeURIComponent(t.name)}`),
        }),
      );
    classes
      .filter((c) => `${c.name} ${c.section}`.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((c) =>
        out.push({
          key: `c-${c.id}`,
          icon: School,
          title: `${c.name} - ${c.section}`,
          subtitle: 'Class',
          onSelect: () => navigate('/classes'),
        }),
      );
    return out.slice(0, 8);
  }, [query, students, teachers, classes, navigate]);

  function select(r: Result) {
    r.onSelect();
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className={styles.searchWrap}>
      <Search size={16} className={styles.searchIcon} />
      <input
        ref={inputRef}
        className={styles.searchInput}
        placeholder="Search anything..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) select(results[0]);
        }}
      />
      <span className={styles.searchKbd}>⌘K</span>
      {open && query.trim() && (
        <>
          <div className={styles.searchOverlay} onClick={() => setOpen(false)} />
          <div className={styles.searchResults}>
            {results.length === 0 ? (
              <div className={styles.searchEmpty}>No matches for "{query}"</div>
            ) : (
              results.map((r) => (
                <button key={r.key} className={styles.searchResultRow} onMouseDown={() => select(r)}>
                  <span className={styles.searchResultIcon}>
                    <r.icon size={15} />
                  </span>
                  <span className={styles.searchResultBody}>
                    <span className={styles.searchResultTitle}>{r.title}</span>
                    <span className={styles.searchResultSubtitle}>{r.subtitle}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
