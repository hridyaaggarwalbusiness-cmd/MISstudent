import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
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
  Role,
  AppUser,
} from '@/types';

function withId<T>(d: { id: string; data: () => unknown }): T {
  return { id: d.id, ...(d.data() as object) } as T;
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
  });
  const profileCollection = PROFILE_COLLECTION[role];
  if (profileCollection) {
    await setDoc(doc(db, profileCollection, uid), {
      id: uid,
      ...payload.profile,
    });
  }
  return uid;
}

// The Auth credential itself can only be deleted server-side (Admin SDK /
// Cloud Functions), which needs Blaze. Revoking the Firestore profile is
// enough to fully cut off access: every security rule keys off these
// documents, so the account can no longer read or write anything once they're
// gone - it just leaves a harmless orphaned credential behind.
async function revokeSchoolUser(role: Role, uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
  const profileCollection = PROFILE_COLLECTION[role];
  if (profileCollection) {
    await deleteDoc(doc(db, profileCollection, uid));
  }
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
    upsert: (item: SchoolClass) => setDoc(doc(db, 'classes', item.id), item, { merge: true }),
    remove: (id: string) => deleteDoc(doc(db, 'classes', id)),
  },

  admins: {
    subscribeAll: (cb: (items: AppUser[]) => void): Unsubscribe => {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<AppUser>(d))));
    },
    create: (payload: { email: string; password: string; displayName: string }) =>
      createSchoolUser('admin', { ...payload, profile: {} }),
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
    upsert: (exam: Exam) => setDoc(doc(db, 'exams', exam.id || cryptoId()), exam, { merge: true }),
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
    upsert: (notice: Notice) =>
      setDoc(doc(db, 'notices', notice.id || cryptoId()), { ...notice, postedAt: serverTimestamp() }, { merge: true }),
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
