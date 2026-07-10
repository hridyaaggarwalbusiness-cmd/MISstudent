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
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, app } from '@/services/firebase';
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
} from '@/types';

const functions = getFunctions(app);

function withId<T>(d: { id: string; data: () => unknown }): T {
  return { id: d.id, ...(d.data() as object) } as T;
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

  teachers: {
    subscribeAll: (cb: (items: Teacher[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'teachers'), (snap) => cb(snap.docs.map((d) => withId<Teacher>(d)))),
    update: (id: string, changes: Partial<Teacher>) => updateDoc(doc(db, 'teachers', id), changes),
    create: (payload: {
      email: string;
      password: string;
      displayName: string;
      profile: Omit<Teacher, 'id'>;
    }) => httpsCallable(functions, 'createSchoolUser')({ role: 'teacher', ...payload }),
    remove: (id: string) => httpsCallable(functions, 'deleteSchoolUser')({ uid: id, role: 'teacher' }),
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
    }) => httpsCallable(functions, 'createSchoolUser')({ role: 'student', ...payload }),
    remove: (id: string) => httpsCallable(functions, 'deleteSchoolUser')({ uid: id, role: 'student' }),
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

  storage: {
    upload: async (path: string, blob: Blob): Promise<string> => {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    },
  },
};

// Fetch-once helper (not a live subscription) for cases like populating a
// dropdown once rather than keeping a listener open.
export async function fetchOnce<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => withId<T>(d));
}

function cryptoId(): string {
  return doc(collection(db, '_ids')).id;
}
