import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Unsubscribe, Timestamp } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isAfter,
  isWeekend,
  formatISO,
} from 'date-fns';
import { db, auth, rtdb } from '@services/firebase';
import {
  Student,
  TimetablePeriod,
  Homework,
  HomeworkStatus,
  Exam,
  Notice,
  NoticeCategory,
  AttendanceDay,
  AttendanceStatus,
  AttendanceSubjectSummary,
  ExamResult,
  SubjectMark,
  StudyMaterial,
  MaterialType,
  CalendarEvent,
  Attachment,
  FeePayment,
  SchoolProfile,
  NoticeType,
  NoticeAudience,
  NoticePriority,
  Bus,
  BusStop,
  BusRoute,
  Trip,
  LiveLocation,
  SchoolLocation,
  PeriodSchedule,
} from '@/types';

// ---- backend document shapes (mirror teacher-app/admin-app's real schema) ----

interface BackendTimetablePeriod extends TimetablePeriod {
  classId: string;
  teacherId: string;
}

interface BackendHomework {
  id: string;
  classId: string;
  subject: string;
  title: string;
  instructions: string;
  classWork?: string;
  teacherId: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  attachments: Attachment[];
}

interface BackendSubmission {
  studentId: string;
  submittedAt: string;
  attachments: Attachment[];
  note?: string;
  status: 'submitted' | 'graded';
  grade?: string;
  marks?: number;
  maxMarks?: number;
  comment?: string;
  gradedAt?: string;
}

interface BackendExam extends Exam {
  classId: string;
}

interface BackendNotice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  postedBy: string;
  postedByName: string;
  postedAt: Timestamp | string;
  targetClassIds: string[];
  attachments?: Attachment[];
  pinned?: boolean;
  noticeType?: NoticeType;
  audience?: NoticeAudience;
  priority?: NoticePriority;
  noticeDate?: string;
  effectiveDate?: string;
  pageImages?: string[];
}

interface BackendAttendanceRecord {
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  markedBy: string;
  markedAt: string;
}

interface BackendExamResult {
  id: string;
  studentId: string;
  classId: string;
  examId: string;
  examName: string;
  subject: string;
  term: string;
  date: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  teacherRemark?: string;
  gradedBy: string;
  gradedAt: string;
}

interface BackendStudyMaterial {
  id: string;
  classId: string;
  title: string;
  description?: string;
  subject: string;
  type: MaterialType;
  uploadedAt: Timestamp | string;
  uploadedBy: string;
  uploadedByName: string;
  attachment: Attachment;
  sizeLabel?: string;
  durationLabel?: string;
}

function withId<T>(d: { id: string; data: () => unknown }): T {
  return { id: d.id, ...(d.data() as object) } as T;
}

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return typeof value === 'string' ? value : new Date().toISOString();
}

function isoDate(d: Date): string {
  return formatISO(d, { representation: 'date' });
}

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

// Resolves a live subscription into a single one-shot value, for screens that
// only need "current data" rather than an ongoing listener.
function once<T>(subscribe: (cb: (value: T) => void) => Unsubscribe): Promise<T> {
  return new Promise((resolve) => {
    const unsub = subscribe((value) => {
      resolve(value);
      unsub();
    });
  });
}

export const repo = {
  auth: {
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => firebaseSignOut(auth),
    onChange: (cb: (user: User | null) => void): Unsubscribe => onAuthStateChanged(auth, cb),
  },

  student: {
    subscribe: (uid: string, cb: (student: Student | null) => void): Unsubscribe =>
      onSnapshot(doc(db, 'students', uid), (snap) => cb(snap.exists() ? withId<Student>(snap) : null)),
    get: (uid: string) => once<Student | null>((cb) => repo.student.subscribe(uid, cb)),
    // Students may only touch this narrow set of contact fields on their own
    // doc — enforced again server-side by firestore.rules.
    updateContact: (
      uid: string,
      fields: Partial<
        Pick<Student, 'phone' | 'address' | 'emergencyContactName' | 'emergencyContactPhone' | 'emergencyContactRelation'>
      >,
    ) => updateDoc(doc(db, 'students', uid), fields),
  },

  timetable: {
    subscribeForClass: (classId: string, cb: (items: TimetablePeriod[]) => void): Unsubscribe => {
      const q = query(collection(db, 'timetable'), where('classId', '==', classId));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<BackendTimetablePeriod>(d))));
    },
    getAll: (classId: string) => once<TimetablePeriod[]>((cb) => repo.timetable.subscribeForClass(classId, cb)),
  },

  // The school-wide period/break row structure - read-only here, only
  // admin-app writes it.
  periodSchedule: {
    subscribe: (cb: (schedule: PeriodSchedule) => void): Unsubscribe =>
      onSnapshot(doc(db, 'settings', 'periodSchedule'), (snap) =>
        cb(snap.exists() ? (snap.data() as PeriodSchedule) : { slots: [] }),
      ),
  },

  homework: {
    // Combines the class's homework with this student's own submission doc
    // for each item (submissions live in a subcollection keyed by studentId),
    // so a teacher grading a submission or posting new homework shows up here
    // live without the student needing to refresh.
    subscribeForStudent: (classId: string, studentId: string, cb: (items: Homework[]) => void): Unsubscribe => {
      const submissionUnsubs = new Map<string, Unsubscribe>();
      const submissions = new Map<string, BackendSubmission | null>();
      let latest: BackendHomework[] = [];

      function emit() {
        const today = isoDate(new Date());
        const mapped: Homework[] = latest.map((hw) => {
          const sub = submissions.get(hw.id) ?? null;
          let status: HomeworkStatus = 'pending';
          if (sub?.status === 'graded') status = 'graded';
          else if (sub?.status === 'submitted') status = 'submitted';
          else if (hw.dueDate < today) status = 'overdue';
          return {
            id: hw.id,
            subject: hw.subject,
            title: hw.title,
            instructions: hw.instructions,
            classWork: hw.classWork,
            assignedDate: hw.assignedDate,
            dueDate: hw.dueDate,
            teacher: hw.teacherName,
            status,
            attachments: hw.attachments ?? [],
            submission: sub
              ? { submittedAt: sub.submittedAt, attachments: sub.attachments ?? [], note: sub.note }
              : undefined,
            remarks:
              sub?.status === 'graded'
                ? {
                    grade: sub.grade,
                    marks: sub.marks,
                    maxMarks: sub.maxMarks,
                    comment: sub.comment ?? '',
                    gradedAt: sub.gradedAt ?? sub.submittedAt,
                  }
                : undefined,
          };
        });
        cb(mapped);
      }

      const q = query(collection(db, 'homework'), where('classId', '==', classId), orderBy('dueDate', 'asc'));
      const unsubList = onSnapshot(q, (snap) => {
        latest = snap.docs.map((d) => withId<BackendHomework>(d));
        const currentIds = new Set(latest.map((h) => h.id));

        for (const [id, unsub] of submissionUnsubs) {
          if (!currentIds.has(id)) {
            unsub();
            submissionUnsubs.delete(id);
            submissions.delete(id);
          }
        }

        for (const hw of latest) {
          if (!submissionUnsubs.has(hw.id)) {
            const subUnsub = onSnapshot(doc(db, 'homework', hw.id, 'submissions', studentId), (subSnap) => {
              submissions.set(hw.id, subSnap.exists() ? (subSnap.data() as BackendSubmission) : null);
              emit();
            });
            submissionUnsubs.set(hw.id, subUnsub);
          }
        }
        emit();
      });

      return () => {
        unsubList();
        for (const unsub of submissionUnsubs.values()) unsub();
        submissionUnsubs.clear();
      };
    },

    submit: async (
      homeworkId: string,
      studentId: string,
      payload: { attachments: Attachment[]; note?: string },
    ): Promise<void> => {
      const inlined: Attachment[] = [];
      for (const attachment of payload.attachments) {
        if (attachment.url.startsWith('data:')) {
          inlined.push(attachment);
          continue;
        }
        const dataUrl = await fileUriToDataUrl(attachment.url);
        const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
        if (approxBytes > MAX_ATTACHMENT_BYTES) {
          throw new Error(
            `"${attachment.name}" is too large to submit (max ${Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB — cloud storage isn't enabled on this project, so attachments are stored inline).`,
          );
        }
        inlined.push({ ...attachment, url: dataUrl });
      }
      await setDoc(
        doc(db, 'homework', homeworkId, 'submissions', studentId),
        {
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          attachments: inlined,
          note: payload.note ?? null,
        },
        { merge: true },
      );
    },
  },

  exams: {
    subscribeForClass: (classId: string, cb: (items: Exam[]) => void): Unsubscribe => {
      const q = query(collection(db, 'exams'), where('classId', '==', classId), orderBy('date', 'asc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<BackendExam>(d))));
    },
    list: (classId: string) => once<Exam[]>((cb) => repo.exams.subscribeForClass(classId, cb)),
  },

  notices: {
    subscribeForClass: (classId: string, cb: (items: Notice[]) => void): Unsubscribe => {
      const q = query(collection(db, 'notices'), orderBy('postedAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const all = snap.docs.map((d) => withId<BackendNotice>(d));
        const mine = all.filter(
          (n) => n.audience !== 'teachers' && (!n.targetClassIds?.length || n.targetClassIds.includes(classId)),
        );
        cb(
          mine.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            category: n.category,
            postedAt: toIso(n.postedAt),
            postedBy: n.postedByName,
            isRead: false,
            attachments: n.attachments,
            pinned: n.pinned,
            noticeType: n.noticeType,
            audience: n.audience,
            priority: n.priority,
            noticeDate: n.noticeDate,
            effectiveDate: n.effectiveDate,
            pageImages: n.pageImages,
          })),
        );
      });
    },
  },

  attendance: {
    getMonth: async (studentId: string, monthDate: Date): Promise<AttendanceDay[]> => {
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const startIso = isoDate(start);
      const endIso = isoDate(end);

      const [recordsSnap, holidaysSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'attendance'),
            where('studentId', '==', studentId),
            where('date', '>=', startIso),
            where('date', '<=', endIso),
          ),
        ),
        getDocs(query(collection(db, 'calendarEvents'), where('type', '==', 'holiday'))),
      ]);

      const recordsByDate = new Map<string, BackendAttendanceRecord>();
      recordsSnap.docs.forEach((d) => {
        const data = d.data() as BackendAttendanceRecord;
        recordsByDate.set(data.date, data);
      });

      const holidayDates = new Set<string>();
      holidaysSnap.docs.forEach((d) => {
        const data = d.data() as CalendarEvent;
        let cursor = new Date(data.date);
        const last = new Date(data.endDate || data.date);
        while (cursor <= last) {
          const iso = isoDate(cursor);
          if (iso >= startIso && iso <= endIso) holidayDates.add(iso);
          cursor = addDaysPlain(cursor, 1);
        }
      });

      const today = new Date();
      return eachDayOfInterval({ start, end }).map((d): AttendanceDay => {
        const iso = isoDate(d);
        if (isAfter(d, today)) return { date: iso, status: 'future' };
        const record = recordsByDate.get(iso);
        if (record) return { date: iso, status: record.status };
        if (holidayDates.has(iso)) return { date: iso, status: 'holiday' };
        if (isWeekend(d)) return { date: iso, status: 'weekend' };
        // No record for a past school day means nobody marked it — assumed
        // present, same rule as an unchanged row on the teacher's save.
        return { date: iso, status: 'present' };
      });
    },
    getCurrentMonth: (studentId: string) => repo.attendance.getMonth(studentId, new Date()),
    // Per-subject/period attendance isn't tracked in the backend schema yet
    // (only one present/absent/late/leave mark per day), so this returns an
    // honest empty list rather than fabricating numbers.
    getSubjectSummary: async (): Promise<AttendanceSubjectSummary[]> => [],
  },

  results: {
    list: async (studentId: string): Promise<ExamResult[]> => {
      const snap = await getDocs(query(collection(db, 'results'), where('studentId', '==', studentId)));
      const flat = snap.docs.map((d) => withId<BackendExamResult>(d));
      const byExam = new Map<string, BackendExamResult[]>();
      flat.forEach((r) => {
        const list = byExam.get(r.examId) ?? [];
        list.push(r);
        byExam.set(r.examId, list);
      });

      const results: ExamResult[] = [];
      for (const [examId, rows] of byExam) {
        const subjects: SubjectMark[] = rows.map((r) => ({
          subject: r.subject,
          marksObtained: r.marksObtained,
          maxMarks: r.maxMarks,
          grade: r.grade,
        }));
        const totalObtained = rows.reduce((s, r) => s + r.marksObtained, 0);
        const totalMax = rows.reduce((s, r) => s + r.maxMarks, 0);
        const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
        results.push({
          id: examId,
          examName: rows[0].examName,
          term: rows[0].term,
          date: rows[0].date,
          subjects,
          totalObtained,
          totalMax,
          percentage,
          grade: gradeFor(percentage),
          teacherRemark: rows.find((r) => r.teacherRemark)?.teacherRemark,
        });
      }
      return results.sort((a, b) => a.date.localeCompare(b.date));
    },
  },

  materials: {
    subscribeForClass: (classId: string, cb: (items: StudyMaterial[]) => void): Unsubscribe => {
      const q = query(collection(db, 'studyMaterials'), where('classId', '==', classId), orderBy('uploadedAt', 'desc'));
      return onSnapshot(q, (snap) =>
        cb(
          snap.docs.map((d) => {
            const data = withId<BackendStudyMaterial>(d);
            return {
              id: data.id,
              title: data.title,
              description: data.description,
              subject: data.subject,
              type: data.type,
              uploadedAt: toIso(data.uploadedAt),
              uploadedBy: data.uploadedByName,
              attachment: data.attachment,
              sizeLabel: data.sizeLabel,
              durationLabel: data.durationLabel,
            };
          }),
        ),
      );
    },
    list: (classId: string) => once<StudyMaterial[]>((cb) => repo.materials.subscribeForClass(classId, cb)),
  },

  calendar: {
    subscribeAll: (cb: (items: CalendarEvent[]) => void): Unsubscribe => {
      const q = query(collection(db, 'calendarEvents'), orderBy('date', 'asc'));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<CalendarEvent>(d))));
    },
    list: () => once<CalendarEvent[]>((cb) => repo.calendar.subscribeAll(cb)),
  },

  // Read-only for students - every receipt the admin generates shows up
  // here live, the moment it's written, via the same onSnapshot listener
  // (no polling, no manual sync step).
  feePayments: {
    subscribeForStudent: (studentId: string, cb: (items: FeePayment[]) => void): Unsubscribe => {
      const q = query(collection(db, 'feePayments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) =>
        cb(snap.docs.map((d) => ({ ...withId<FeePayment>(d), createdAt: toIso(d.data().createdAt) }))),
      );
    },
    list: (studentId: string) => once<FeePayment[]>((cb) => repo.feePayments.subscribeForStudent(studentId, cb)),
  },

  school: {
    subscribe: (cb: (school: SchoolProfile | null) => void): Unsubscribe =>
      onSnapshot(doc(db, 'settings', 'school'), (snap) => cb(snap.exists() ? (snap.data() as SchoolProfile) : null)),
  },

  // ---- Live Bus Tracking ----

  buses: {
    subscribe: (busId: string, cb: (bus: Bus | null) => void): Unsubscribe =>
      onSnapshot(doc(db, 'buses', busId), (snap) => cb(snap.exists() ? withId<Bus>(snap) : null)),
    get: (busId: string) => once<Bus | null>((cb) => repo.buses.subscribe(busId, cb)),
  },

  busStops: {
    subscribeAll: (cb: (items: BusStop[]) => void): Unsubscribe =>
      onSnapshot(collection(db, 'busStops'), (snap) => cb(snap.docs.map((d) => withId<BusStop>(d)))),
    list: () => once<BusStop[]>((cb) => repo.busStops.subscribeAll(cb)),
  },

  routes: {
    subscribe: (routeId: string, cb: (route: BusRoute | null) => void): Unsubscribe =>
      onSnapshot(doc(db, 'routes', routeId), (snap) => cb(snap.exists() ? withId<BusRoute>(snap) : null)),
    get: (routeId: string) => once<BusRoute | null>((cb) => repo.routes.subscribe(routeId, cb)),
  },

  trips: {
    // The one "active" trip document for a bus, if any is currently running.
    subscribeActiveForBus: (busId: string, cb: (trip: Trip | null) => void): Unsubscribe => {
      const q = query(collection(db, 'trips'), where('busId', '==', busId), where('status', '==', 'active'));
      return onSnapshot(q, (snap) => cb(snap.empty ? null : withId<Trip>(snap.docs[0])));
    },
  },

  // Realtime Database, not Firestore — see LiveLocation's doc comment in
  // src/types/index.ts for why.
  liveLocation: {
    subscribe: (busId: string, cb: (loc: LiveLocation | null) => void): Unsubscribe =>
      onValue(ref(rtdb, `liveLocations/${busId}`), (snap) => cb(snap.exists() ? (snap.val() as LiveLocation) : null)),
  },

  schoolLocation: {
    subscribe: (cb: (loc: SchoolLocation | null) => void): Unsubscribe =>
      onSnapshot(doc(db, 'settings', 'schoolLocation'), (snap) =>
        cb(snap.exists() ? (snap.data() as SchoolLocation) : null),
      ),
  },

  // Realtime Database presence node the driver app maintains via
  // onDisconnect() — see driver-app's location service.
  driverStatus: {
    subscribe: (driverId: string, cb: (online: boolean) => void): Unsubscribe =>
      onValue(ref(rtdb, `driverStatus/${driverId}`), (snap) => cb(!!snap.val()?.online)),
  },
};

// Leaves headroom under Firestore's 1 MiB document limit once the ~33%
// base64 inflation and the rest of the document's fields are accounted for.
export const MAX_ATTACHMENT_BYTES = 700 * 1024;

async function fileUriToDataUrl(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

function addDaysPlain(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
