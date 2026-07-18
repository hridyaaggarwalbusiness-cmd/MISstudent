export type Role = 'admin' | 'teacher' | 'student';

export interface AppUser {
  id: string;
  role: Role;
  email: string;
  displayName: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  photoUrl?: string | null;
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
  day: DayOfWeek;
  periodNumber: number;
  startTime: string; // HH:mm
  endTime: string;
  subject: string;
  teacher: string;
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

export interface Homework {
  id: string;
  subject: string;
  title: string;
  instructions: string;
  classWork?: string;
  assignedDate: string; // ISO date
  dueDate: string; // ISO date
  teacher: string;
  status: HomeworkStatus;
  attachments: Attachment[];
  submission?: {
    submittedAt: string;
    attachments: Attachment[];
    note?: string;
  };
  remarks?: {
    grade?: string;
    marks?: number;
    maxMarks?: number;
    comment: string;
    gradedAt: string;
  };
}

export type ExamStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Exam {
  id: string;
  name: string;
  subject: string;
  date: string; // ISO date
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
  postedAt: string; // ISO date
  postedBy: string;
  isRead: boolean;
  attachments?: Attachment[];
  pinned?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'weekend' | 'future';

export interface AttendanceDay {
  date: string; // ISO date
  status: AttendanceStatus;
  periods?: { subject: string; status: AttendanceStatus }[];
}

export interface AttendanceSubjectSummary {
  subject: string;
  present: number;
  total: number;
}

export interface SubjectMark {
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
}

export interface ExamResult {
  id: string;
  examName: string;
  term: string;
  date: string;
  subjects: SubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank?: number;
  outOf?: number;
  teacherRemark?: string;
}

export type MaterialType = 'note' | 'presentation' | 'worksheet' | 'question_bank' | 'video' | 'other';

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  subject: string;
  type: MaterialType;
  uploadedAt: string;
  uploadedBy: string;
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
  date: string; // ISO date
  endDate?: string;
  type: CalendarEventType;
  description?: string;
  location?: string;
}

export type NotificationType =
  | 'homework'
  | 'exam'
  | 'material'
  | 'attendance'
  | 'result'
  | 'notice';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  refId?: string;
}

export type InstallmentId = '1' | '2';
export type FeePaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque';
export type FeeStatus = 'unpaid' | 'partial' | 'paid';

// Read-only mirror of admin-app's FeePayment - the receipt shown here is
// regenerated client-side from this same record, so it always matches the
// one the admin produced.
export interface FeePayment {
  id: string;
  studentId: string;
  classId: string;
  academicSession: string;
  installmentId: InstallmentId;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  academicFee: number;
  transportFee: number;
  totalFee: number;
  amount: number;
  totalPaidAfter: number;
  balanceAfter: number;
  statusAfter: FeeStatus;
  paymentMethod: FeePaymentMethod;
  transactionRef?: string;
  paymentDate: string;
  collectedBy: string;
  collectedByName: string;
  remarks?: string;
  receiptNo: string;
  paymentRef: string;
  createdAt: string;
}
