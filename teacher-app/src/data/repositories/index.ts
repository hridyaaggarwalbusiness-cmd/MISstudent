import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth } from '@/services/firebase';
import {
  Teacher,
  SchoolClass,
  Student,
  TimetablePeriod,
  Homework,
  HomeworkSubmission,
  Exam,
  Notice,
  StudyMaterial,
  CalendarEvent,
  ExamResult,
  AttendanceRecord,
  AttendanceStatus,
} from '@/types';

function withId<T>(d: { id: string; data: () => any }): T {
  return { id: d.id, ...d.data() } as T;
}

// Fields written with serverTimestamp() (Notice.postedAt, StudyMaterial.uploadedAt)
// come back from Firestore as Timestamp objects even though they're typed as
// `string` app-side. Normalize at the read boundary so nothing downstream
// has to know the difference.
function toIso(value: unknown): string {
  if (value && typeof value === 'object' && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return typeof value === 'string' ? value : new Date().toISOString();
}

export const repo = {
  auth: {
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => firebaseSignOut(auth),
    onChange: (cb: (user: User | null) => void): Unsubscribe => onAuthStateChanged(auth, cb),
  },

  teachers: {
    get: async (uid: string): Promise<Teacher | null> => {
      const snap = await getDoc(doc(db, 'teachers', uid));
      return snap.exists() ? withId<Teacher>(snap) : null;
    },
  },

  classes: {
    get: async (classId: string): Promise<SchoolClass | null> => {
      const snap = await getDoc(doc(db, 'classes', classId));
      return snap.exists() ? withId<SchoolClass>(snap) : null;
    },
    listStudents: async (classId: string): Promise<Student[]> => {
      const q = query(collection(db, 'students'), where('classId', '==', classId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => withId<Student>(d));
    },
  },

  timetable: {
    subscribeForClass: (classId: string, cb: (periods: TimetablePeriod[]) => void): Unsubscribe => {
      const q = query(collection(db, 'timetable'), where('classId', '==', classId));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<TimetablePeriod>(d))));
    },
    upsert: (period: TimetablePeriod) =>
      setDoc(doc(db, 'timetable', period.id), { ...period }, { merge: true }),
  },

  homework: {
    subscribeForClass: (classId: string, cb: (items: Homework[]) => void): Unsubscribe => {
      const q = query(
        collection(db, 'homework'),
        where('classId', '==', classId),
        orderBy('dueDate', 'asc'),
      );
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Homework>(d))));
    },
    create: (homework: Omit<Homework, 'id'>) =>
      addDoc(collection(db, 'homework'), { ...homework, createdAt: serverTimestamp() }),
    update: (id: string, changes: Partial<Homework>) => updateDoc(doc(db, 'homework', id), changes),
    remove: (id: string) => deleteDoc(doc(db, 'homework', id)),
    subscribeSubmissions: (
      homeworkId: string,
      cb: (subs: HomeworkSubmission[]) => void,
    ): Unsubscribe => {
      const q = collection(db, 'homework', homeworkId, 'submissions');
      return onSnapshot(q, (snap) =>
        cb(snap.docs.map((d) => ({ studentId: d.id, ...d.data() }) as HomeworkSubmission)),
      );
    },
    gradeSubmission: (
      homeworkId: string,
      studentId: string,
      grade: { grade: string; marks: number; maxMarks: number; comment: string },
    ) =>
      setDoc(
        doc(db, 'homework', homeworkId, 'submissions', studentId),
        { ...grade, status: 'graded', gradedAt: new Date().toISOString() },
        { merge: true },
      ),
  },

  attendance: {
    subscribeForClassDate: (
      classId: string,
      date: string,
      cb: (records: AttendanceRecord[]) => void,
    ): Unsubscribe => {
      const q = query(
        collection(db, 'attendance'),
        where('classId', '==', classId),
        where('date', '==', date),
      );
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as AttendanceRecord)));
    },
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
    },
  },

  exams: {
    subscribeForClass: (classId: string, cb: (items: Exam[]) => void): Unsubscribe => {
      const q = query(collection(db, 'exams'), where('classId', '==', classId), orderBy('date', 'asc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Exam>(d))));
    },
    create: (exam: Omit<Exam, 'id'>) => addDoc(collection(db, 'exams'), exam),
    update: (id: string, changes: Partial<Exam>) => updateDoc(doc(db, 'exams', id), changes),
    remove: (id: string) => deleteDoc(doc(db, 'exams', id)),
  },

  results: {
    subscribeForClass: (classId: string, cb: (items: ExamResult[]) => void): Unsubscribe => {
      const q = query(collection(db, 'results'), where('classId', '==', classId));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<ExamResult>(d))));
    },
    upsert: (result: ExamResult) => setDoc(doc(db, 'results', result.id), result, { merge: true }),
  },

  notices: {
    subscribeAll: (cb: (items: Notice[]) => void): Unsubscribe => {
      const q = query(collection(db, 'notices'), orderBy('postedAt', 'desc'));
      return onSnapshot(q, (snap) =>
        cb(snap.docs.map((d) => ({ ...withId<Notice>(d), postedAt: toIso(d.data().postedAt) }))),
      );
    },
    create: (notice: Omit<Notice, 'id'>) =>
      addDoc(collection(db, 'notices'), { ...notice, postedAt: serverTimestamp() }),
    remove: (id: string) => deleteDoc(doc(db, 'notices', id)),
  },

  materials: {
    subscribeForClass: (classId: string, cb: (items: StudyMaterial[]) => void): Unsubscribe => {
      const q = query(
        collection(db, 'studyMaterials'),
        where('classId', '==', classId),
        orderBy('uploadedAt', 'desc'),
      );
      return onSnapshot(q, (snap) =>
        cb(snap.docs.map((d) => ({ ...withId<StudyMaterial>(d), uploadedAt: toIso(d.data().uploadedAt) }))),
      );
    },
    create: (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) =>
      addDoc(collection(db, 'studyMaterials'), { ...material, uploadedAt: serverTimestamp() }),
    remove: (id: string) => deleteDoc(doc(db, 'studyMaterials', id)),
  },

  calendar: {
    subscribeAll: (cb: (items: CalendarEvent[]) => void): Unsubscribe => {
      const q = query(collection(db, 'calendarEvents'), orderBy('date', 'asc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<CalendarEvent>(d))));
    },
    list: (): Promise<CalendarEvent[]> =>
      new Promise((resolve) => {
        const unsub = repo.calendar.subscribeAll((items) => {
          resolve(items);
          unsub();
        });
      }),
  },

  // Firebase Storage isn't provisioned on this project, so attachments are
  // inlined as base64 data URLs directly on the Firestore document instead
  // of living in a bucket. Firestore caps documents at 1 MiB, so callers
  // must enforce MAX_ATTACHMENT_BYTES before calling this.
  storage: {
    upload: (blob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(blob);
      }),
  },
};

// Leaves headroom under Firestore's 1 MiB document limit once the ~33%
// base64 inflation and the rest of the document's fields are accounted for.
export const MAX_ATTACHMENT_BYTES = 700 * 1024;
