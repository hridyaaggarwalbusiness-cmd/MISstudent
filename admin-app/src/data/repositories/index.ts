import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as secondarySignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getSecondaryAuth } from 'firebase/auth';
import { db, auth } from '@/services/firebase';
import { firebaseConfig } from '@/services/firebaseConfig';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  Teacher,
  SchoolClass,
  Student,
  TimetablePeriod,
  Homework,
  Exam,
  Notice,
  StudyMaterial,
  CalendarEvent,
  ExamResult,
  AttendanceRecord,
  AttendanceStatus,
  Role,
  AppUser,
  AuditAction,
  AuditLog,
} from '@/types';

function withId<T>(d: { id: string; data: () => unknown }): T {
  return { id: d.id, ...(d.data() as object) } as T;
}

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === 'string' ? value : new Date().toISOString();
}

// Fire-and-forget audit trail for the System Logs page. Never allowed to
// throw into a caller's mutation flow - a logging failure shouldn't roll
// back or surface as an error on the action it's describing.
function currentActor(): { actorId: string; actorName: string } {
  const profile = useAuthStore.getState().profile;
  return { actorId: profile?.id ?? 'system', actorName: profile?.displayName ?? 'System' };
}

function logAudit(action: AuditAction, summary: string): void {
  addDoc(collection(db, 'auditLogs'), {
    action,
    summary,
    ...currentActor(),
    at: serverTimestamp(),
  }).catch(() => {});
}

// Cloud Functions (and the Admin SDK they'd wrap) require the Blaze plan,
// which isn't enabled on this project. Creating a user with the client SDK
// on the *primary* app would sign the admin in as that new account and
// hijack their session, so instead we spin up a short-lived secondary
// Firebase App, create the account there (leaving the admin's own session
// on the primary app untouched), then tear the secondary app down.
async function createAuthAccountWithoutSignIn(
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getSecondaryAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    return credential.user.uid;
  } finally {
    await secondarySignOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

// teacher/student accounts get a matching profile doc in their own
// collection (teachers/{uid} or students/{uid}); admins only need the
// users/{uid} role doc, since every security rule's isAdmin() check reads
// straight from there.
const PROFILE_COLLECTION: Partial<Record<Role, string>> = { teacher: 'teachers', student: 'students' };

const AUDIT_ACTION_FOR_ROLE: Record<Role, { created: AuditAction; removed: AuditAction }> = {
  admin: { created: 'admin_created', removed: 'admin_removed' },
  teacher: { created: 'teacher_created', removed: 'teacher_removed' },
  student: { created: 'student_created', removed: 'student_removed' },
};

async function createSchoolUser(role: Role, payload: {
  email: string;
  password: string;
  displayName: string;
  profile: Record<string, unknown>;
}): Promise<string> {
  const uid = await createAuthAccountWithoutSignIn(payload.email, payload.password, payload.displayName);
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    role,
    email: payload.email,
    displayName: payload.displayName,
    createdAt: serverTimestamp(),
  });
  const profileCollection = PROFILE_COLLECTION[role];
  if (profileCollection) {
    await setDoc(doc(db, profileCollection, uid), {
      id: uid,
      ...payload.profile,
      createdAt: serverTimestamp(),
    });
  }
  logAudit(AUDIT_ACTION_FOR_ROLE[role].created, `${payload.displayName} added as ${role}`);
  return uid;
}

// The Auth credential itself can only be deleted server-side (Admin SDK /
// Cloud Functions), which needs Blaze. Revoking the Firestore profile is
// enough to fully cut off access: every security rule keys off these
// documents, so the account can no longer read or write anything once they're
// gone - it just leaves a harmless orphaned credential behind.
async function revokeSchoolUser(role: Role, uid: string): Promise<void> {
  const snap = await getDoc(doc(db, 'users', uid));
  const displayName = snap.exists() ? (snap.data().displayName as string) : uid;
  await deleteDoc(doc(db, 'users', uid));
  const profileCollection = PROFILE_COLLECTION[role];
  if (profileCollection) {
    await deleteDoc(doc(db, profileCollection, uid));
  }
  logAudit(AUDIT_ACTION_FOR_ROLE[role].removed, `${displayName} removed as ${role}`);
}

export const repo = {
  auth: {
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => firebaseSignOut(auth),
    onChange: (cb: (user: User | null) => void): Unsubscribe => onAuthStateChanged(auth, cb),
  },

  classes: {
    subscribeAll: (cb: (items: SchoolClass[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'classes'), (snap) => cb(snap.docs.map((d) => withId<SchoolClass>(d)))),
    upsert: async (item: SchoolClass, isNew = false) => {
      await setDoc(doc(db, 'classes', item.id), item, { merge: true });
      if (isNew) logAudit('class_created', `Class ${item.name} - ${item.section} created`);
    },
    remove: (id: string) => deleteDoc(doc(db, 'classes', id)),
  },

  admins: {
    subscribeAll: (cb: (items: AppUser[]) => void): Unsubscribe => {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<AppUser>(d))));
    },
    create: (payload: { email: string; password: string; displayName: string }) =>
      createSchoolUser('admin', { ...payload, profile: {} }),
    update: (id: string, changes: Partial<Pick<AppUser, 'displayName'>>) => updateDoc(doc(db, 'users', id), changes),
    remove: (id: string) => revokeSchoolUser('admin', id),
  },

  teachers: {
    subscribeAll: (cb: (items: Teacher[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'teachers'), (snap) => cb(snap.docs.map((d) => withId<Teacher>(d)))),
    update: (id: string, changes: Partial<Teacher>) => updateDoc(doc(db, 'teachers', id), changes),
    create: (payload: {
      email: string;
      password: string;
      displayName: string;
      profile: Omit<Teacher, 'id'>;
    }) => createSchoolUser('teacher', payload),
    remove: (id: string) => revokeSchoolUser('teacher', id),
  },

  students: {
    subscribeAll: (cb: (items: Student[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'students'), (snap) => cb(snap.docs.map((d) => withId<Student>(d)))),
    subscribeForClass: (classId: string, cb: (items: Student[]) => void): Unsubscribe => {
      const q = query(collection(db, 'students'), where('classId', '==', classId));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Student>(d))));
    },
    update: (id: string, changes: Partial<Student>) => updateDoc(doc(db, 'students', id), changes),
    create: (payload: {
      email: string;
      password: string;
      displayName: string;
      profile: Omit<Student, 'id'>;
    }) => createSchoolUser('student', payload),
    remove: (id: string) => revokeSchoolUser('student', id),
  },

  timetable: {
    subscribeForClass: (classId: string, cb: (items: TimetablePeriod[]) => void): Unsubscribe => {
      const q = query(collection(db, 'timetable'), where('classId', '==', classId));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<TimetablePeriod>(d))));
    },
    upsert: (period: TimetablePeriod) => setDoc(doc(db, 'timetable', period.id), period, { merge: true }),
    remove: (id: string) => deleteDoc(doc(db, 'timetable', id)),
  },

  homework: {
    subscribeAll: (cb: (items: Homework[]) => void): Unsubscribe => {
      const q = query(collection(db, 'homework'), orderBy('dueDate', 'desc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Homework>(d))));
    },
    remove: (id: string) => deleteDoc(doc(db, 'homework', id)),
  },

  exams: {
    subscribeAll: (cb: (items: Exam[]) => void): Unsubscribe => {
      const q = query(collection(db, 'exams'), orderBy('date', 'asc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Exam>(d))));
    },
    upsert: (exam: Exam) => {
      const isNew = !exam.id;
      const write = setDoc(doc(db, 'exams', exam.id || cryptoId()), exam, { merge: true });
      if (isNew) write.then(() => logAudit('exam_scheduled', `${exam.name} (${exam.subject}) scheduled`));
      return write;
    },
    remove: (id: string) => deleteDoc(doc(db, 'exams', id)),
  },

  results: {
    subscribeAll: (cb: (items: ExamResult[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'results'), (snap) => cb(snap.docs.map((d) => withId<ExamResult>(d)))),
  },

  notices: {
    subscribeAll: (cb: (items: Notice[]) => void): Unsubscribe => {
      const q = query(collection(db, 'notices'), orderBy('postedAt', 'desc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Notice>(d))));
    },
    upsert: (notice: Notice) => {
      const isNew = !notice.id;
      const write = setDoc(
        doc(db, 'notices', notice.id || cryptoId()),
        { ...notice, postedAt: serverTimestamp() },
        { merge: true },
      );
      if (isNew) write.then(() => logAudit('notice_posted', `Notice posted: ${notice.title}`));
      return write;
    },
    remove: (id: string) => deleteDoc(doc(db, 'notices', id)),
  },

  materials: {
    subscribeAll: (cb: (items: StudyMaterial[]) => void): Unsubscribe => {
      const q = query(collection(db, 'studyMaterials'), orderBy('uploadedAt', 'desc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<StudyMaterial>(d))));
    },
    create: (payload: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => {
      const id = cryptoId();
      return setDoc(doc(db, 'studyMaterials', id), { ...payload, id, uploadedAt: serverTimestamp() });
    },
    remove: (id: string) => deleteDoc(doc(db, 'studyMaterials', id)),
  },

  calendar: {
    subscribeAll: (cb: (items: CalendarEvent[]) => void): Unsubscribe => {
      const q = query(collection(db, 'calendarEvents'), orderBy('date', 'asc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<CalendarEvent>(d))));
    },
    upsert: (event: CalendarEvent) =>
      setDoc(doc(db, 'calendarEvents', event.id || cryptoId()), event, { merge: true }),
    remove: (id: string) => deleteDoc(doc(db, 'calendarEvents', id)),
  },

  attendance: {
    subscribeForClassMonth: (
      classId: string,
      cb: (items: AttendanceRecord[]) => void,
    ): Unsubscribe => {
      const q = query(collection(db, 'attendance'), where('classId', '==', classId));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as AttendanceRecord)));
    },
    // Whole-school records, for the Dashboard trend chart and Reports page -
    // both need to aggregate across every class at once rather than one at
    // a time like the per-class month view above.
    subscribeAll: (cb: (items: AttendanceRecord[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'attendance'), (snap) => cb(snap.docs.map((d) => d.data() as AttendanceRecord))),
    // Unlike teacher-app, admin can mark attendance for any class — not just
    // one they're the incharge teacher of.
    markBulk: async (
      classId: string,
      date: string,
      records: { studentId: string; status: AttendanceStatus }[],
      markedBy: string,
    ) => {
      await Promise.all(
        records.map((r) =>
          setDoc(doc(db, 'attendance', `${r.studentId}_${date}`), {
            studentId: r.studentId,
            classId,
            date,
            status: r.status,
            markedBy,
            markedAt: new Date().toISOString(),
          }),
        ),
      );
      logAudit('attendance_marked', `Attendance marked for ${records.length} student(s) on ${date}`);
    },
  },

  school: {
    subscribe: (cb: (school: { name: string; address: string; phone: string } | null) => void): Unsubscribe => {
      return onSnapshot(doc(db, 'settings', 'school'), (snap) =>
        cb(snap.exists() ? (snap.data() as { name: string; address: string; phone: string }) : null),
      );
    },
    update: (changes: { name: string; address: string; phone: string }) =>
      setDoc(doc(db, 'settings', 'school'), changes, { merge: true }),
  },

  auditLogs: {
    subscribeRecent: (cb: (items: AuditLog[]) => void, max = 30): Unsubscribe => {
      const q = query(collection(db, 'auditLogs'), orderBy('at', 'desc'), fsLimit(max));
      return onSnapshot(q, (snap) =>
        cb(snap.docs.map((d) => ({ ...withId<AuditLog>(d), at: toIso(d.data().at) }))),
      );
    },
  },

  // Firebase Storage isn't provisioned on this project, so file attachments
  // are inlined as base64 data URLs directly on the Firestore document
  // instead of living in a bucket. Firestore caps documents at 1 MiB, so
  // callers must enforce MAX_ATTACHMENT_BYTES before calling this.
  storage: {
    upload: (file: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(file);
      }),
  },
};

// Leaves headroom under Firestore's 1 MiB document limit once the ~33%
// base64 inflation and the rest of the document's fields are accounted for.
export const MAX_ATTACHMENT_BYTES = 700 * 1024;

// Fetch-once helper (not a live subscription) for cases like populating a
// dropdown once rather than keeping a listener open.
export async function fetchOnce<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => withId<T>(d));
}

function cryptoId(): string {
  return doc(collection(db, '_ids')).id;
}
