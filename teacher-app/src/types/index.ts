export interface Teacher {
  id: string;
  name: string;
  photoUrl?: string | null;
  email: string;
  phone: string;
  subjects: string[];
  classIds: string[];
  isClassTeacherOf: string | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  section: string;
  classTeacherId: string;
  studentCount: number;
}

export interface Student {
  id: string;
  name: string;
  photoUrl?: string | null;
  classId: string;
  className: string;
  section: string;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: string;
  bloodGroup: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  house?: string;
  busRoute?: string;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface TimetablePeriod {
  id: string;
  classId: string;
  day: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  teacherId: string;
  room: string;
  isBreak?: boolean;
}

export type HomeworkStatus = 'pending' | 'submitted' | 'graded' | 'overdue';

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'doc' | 'link';
  url: string;
  sizeLabel?: string;
}

export interface HomeworkSubmission {
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

export interface Homework {
  id: string;
  classId: string;
  subject: string;
  title: string;
  instructions: string;
  teacherId: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  attachments: Attachment[];
}

export type ExamStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Exam {
  id: string;
  classId: string;
  name: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  syllabus?: string;
  status: ExamStatus;
}

export type NoticeCategory = 'general' | 'academic' | 'event' | 'holiday';

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  postedBy: string;
  postedByName: string;
  postedAt: string;
  targetClassIds: string[];
  attachments?: Attachment[];
  pinned?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'weekend' | 'future';

export interface AttendanceRecord {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  markedAt: string;
}

// One document per (student, exam) - a single subject's marks, since each
// Exam is already subject-specific. A student's "report card" for a term is
// assembled client-side by grouping all of their ExamResult docs sharing the
// same term.
export interface ExamResult {
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

export type MaterialType = 'note' | 'presentation' | 'worksheet' | 'question_bank' | 'video' | 'other';

export interface StudyMaterial {
  id: string;
  classId: string;
  title: string;
  description?: string;
  subject: string;
  type: MaterialType;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  attachment: Attachment;
  sizeLabel?: string;
  durationLabel?: string;
}

export type CalendarEventType =
  | 'holiday'
  | 'exam'
  | 'function'
  | 'sports'
  | 'meeting'
  | 'competition'
  | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: CalendarEventType;
  description?: string;
  location?: string;
}
