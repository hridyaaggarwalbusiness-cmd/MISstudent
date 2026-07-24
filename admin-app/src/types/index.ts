export type Role = 'admin' | 'teacher' | 'student' | 'driver';

export interface SchoolProfile {
  name: string;
  address: string;
  phone: string;
}

export interface AppUser {
  id: string;
  role: Role;
  email: string;
  displayName: string;
  createdAt?: string;
}

export interface Teacher {
  id: string;
  name: string;
  photoUrl?: string | null;
  email: string;
  phone: string;
  subjects: string[];
  // Which class this teacher is the homeroom/class teacher of, if any - a
  // teacher can teach any class regardless, so this is the only class
  // relationship worth declaring up front.
  isClassTeacherOf: string | null;
  createdAt?: string;
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
  assignedBusId?: string;
  assignedStopId?: string;
  createdAt?: string;
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

// The school-wide row structure of the timetable grid - shared by every
// class. Break/recess rows are their own slot type so they never consume a
// period number (the sequence reads P1, P2, P3, Recess, P4, ... rather than
// recess becoming "period 4"). Each slot's time applies to every day of the
// week at once; editing it propagates to every already-saved cell for that
// period number across every class (see repo.periodSchedule.propagateTime).
export type PeriodSlotType = 'period' | 'break';

export interface PeriodSlot {
  id: string;
  type: PeriodSlotType;
  label: string;
  periodNumber?: number;
  startTime: string;
  endTime: string;
  order: number;
}

export interface PeriodSchedule {
  slots: PeriodSlot[];
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

// The official-template fields below are optional so existing plain notices
// (posted before the AI Notice Writer existed) keep working unchanged - a
// notice only renders through the official school template when noticeType
// is present.
export type NoticeType = 'holiday' | 'examination' | 'ptm' | 'event' | 'circular' | 'urgent' | 'general';
export type NoticeAudience = 'all' | 'classes' | 'teachers' | 'parents';
export type NoticePriority = 'normal' | 'important' | 'urgent';
export type NoticeTone = 'formal' | 'friendly' | 'enthusiastic' | 'urgent' | 'sympathetic';

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
  noticeType?: NoticeType;
  audience?: NoticeAudience;
  priority?: NoticePriority;
  noticeDate?: string;
  effectiveDate?: string;
  aiGenerated?: boolean;
  // Base64 JPEG data URLs of each rendered page, captured at publish time
  // from the exact same template used for the preview/PDF export. Storage
  // isn't provisioned on this project's Spark plan, so the rendered notice
  // is inlined here instead of uploaded to Cloud Storage. Absent on notices
  // published before this existed, or when the render was too large to fit
  // Firestore's 1 MiB document limit - both cases fall back to live
  // regeneration from title/body, which produces an identical result.
  pageImages?: string[];
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

export type AuditAction =
  | 'student_created'
  | 'student_removed'
  | 'teacher_created'
  | 'teacher_removed'
  | 'admin_created'
  | 'admin_removed'
  | 'driver_created'
  | 'driver_removed'
  | 'bus_created'
  | 'attendance_marked'
  | 'notice_posted'
  | 'exam_scheduled'
  | 'homework_posted'
  | 'class_created'
  | 'fee_payment_recorded';

export interface AuditLog {
  id: string;
  action: AuditAction;
  summary: string;
  actorName: string;
  actorId: string;
  at: string;
}

export type InstallmentId = '1' | '2';
export type TransportType = 'bus' | 'self';
export type FeePaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque';
export type FeeStatus = 'unpaid' | 'partial' | 'paid';

export interface FeeInstallmentDef {
  id: InstallmentId;
  label: string;
  period: string;
  dueDate: string;
  academicFee: number;
}

// One doc per class per academic session — the school-defined amounts that
// drive every automatic calculation on the fee screens.
export interface FeeStructure {
  classId: string;
  academicSession: string;
  transportFeeAmount: number;
  installments: FeeInstallmentDef[];
}

// One doc per (student, installment) — the student's current standing for
// that installment. Lazily created: a student with no doc yet is treated as
// unpaid, using the class FeeStructure's defaults (transport = bus).
export interface StudentFeeRecord {
  id: string;
  studentId: string;
  classId: string;
  academicSession: string;
  installmentId: InstallmentId;
  transportType: TransportType;
  academicFee: number;
  transportFee: number;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  dueDate: string;
  updatedAt: string;
}

// One immutable doc per payment transaction. Snapshots the student/fee
// details as they were at the moment of payment, so a previously issued
// receipt never changes even if the student's fee record changes later.
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

// ---- Live Bus Tracking ----

export type BusStatus = 'offline' | 'online' | 'trip_started' | 'trip_completed';
export type RouteType = 'morning' | 'afternoon';
export type GpsQuality = 'excellent' | 'good' | 'weak';

// A physical stop location, stored once and reused across whichever
// morning/afternoon routes actually pass through it.
export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: string;
}

// One entry in a route's ordered stop sequence - a join between a route and
// a stop, carrying the travel order.
export interface RouteStop {
  stopId: string;
  order: number;
}

// An ordered sequence of stops for one bus's morning or afternoon shift.
export interface BusRoute {
  id: string;
  name: string;
  busId: string;
  type: RouteType;
  stops: RouteStop[];
  createdAt: string;
}

export interface Bus {
  id: string;
  busNumber: string;
  vehicleRegistrationNumber: string;
  driverId: string | null;
  driverName: string;
  driverPhone: string;
  morningRouteId: string | null;
  afternoonRouteId: string | null;
  status: BusStatus;
  currentTripId: string | null;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  assignedBusId: string | null;
  fcmTokens?: string[];
}

// One Start Trip -> End Trip cycle.
export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  routeId: string;
  type: RouteType;
  status: 'active' | 'completed';
  startedAt: string;
  endedAt: string | null;
}

// The live GPS ping for a bus - lives in Realtime Database, not Firestore,
// because it's overwritten every 5-10s and RTDB (not Firestore's per-write
// billing/latency model) is built for that kind of churn.
export interface LiveLocation {
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: number;
  tripId: string;
  driverId: string;
}

export interface SchoolLocation {
  name: string;
  lat: number;
  lng: number;
}
