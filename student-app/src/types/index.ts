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
  assignedBusId?: string;
  assignedStopId?: string;
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

// The school-wide row structure of the timetable grid, admin-authored and
// shared by every class - see admin-app/src/types/index.ts for the full
// rationale. Break/recess rows are their own slot type so they never consume
// a period number (P1, P2, P3, Recess, P4, ... rather than recess becoming
// "period 4"). Read-only here; only admin-app writes it.
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

// Present only on notices authored via the Admin App's AI Notice Writer -
// these render through the official school template instead of a plain
// text card. Older notices simply omit these fields.
export type NoticeType = 'holiday' | 'examination' | 'ptm' | 'event' | 'circular' | 'urgent' | 'general';
export type NoticeAudience = 'all' | 'classes' | 'teachers' | 'parents';
export type NoticePriority = 'normal' | 'important' | 'urgent';

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
  noticeType?: NoticeType;
  audience?: NoticeAudience;
  priority?: NoticePriority;
  noticeDate?: string;
  effectiveDate?: string;
  // Base64 JPEG data URLs of each rendered page, captured by the admin app
  // at publish time from the exact same template used there. When present,
  // display should use these directly instead of regenerating from
  // title/body so the student always sees byte-identical output to what
  // was published.
  pageImages?: string[];
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
  | 'notice'
  | 'bus';

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

// ---- AI Practice Test Generator ----

export type PaperType =
  | 'practice_test'
  | 'unit_test'
  | 'half_yearly'
  | 'annual_exam'
  | 'mcq_practice'
  | 'revision_test';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type PaperLanguage = 'english' | 'hindi';

export type QuestionType =
  | 'mcq'
  | 'fill_blank'
  | 'true_false'
  | 'match_following'
  | 'very_short'
  | 'short'
  | 'long'
  | 'case_study'
  | 'assertion_reason'
  | 'numerical';

export interface PracticeTestRequest {
  classLabel: string;
  subject: string;
  topics: string[];
  paperType: PaperType;
  totalMarks: number;
  difficulty: Difficulty;
  language: PaperLanguage;
  durationMinutes?: number;
}

// A left/right pair for "Match the Following" questions.
export interface MatchPair {
  left: string;
  right: string;
}

export interface PaperQuestion {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  marks: number;
  options?: string[];
  matchPairs?: MatchPair[];
  caseText?: string;
  answer: string;
  explanation?: string;
}

export interface PaperSection {
  id: string;
  title: string;
  instructions?: string;
  questions: PaperQuestion[];
}

// Every generated paper is a purely derived artifact of one AI call - it's
// never partially persisted, so the whole thing is one self-contained value
// the result screen and PDF exporter both render from directly.
export interface GeneratedPaper {
  title: string;
  classLabel: string;
  subject: string;
  topics: string[];
  paperType: PaperType;
  totalMarks: number;
  difficulty: Difficulty;
  language: PaperLanguage;
  durationMinutes?: number;
  generalInstructions: string[];
  sections: PaperSection[];
  generatedAt: string;
}

export interface RegenerateQuestionRequest {
  request: PracticeTestRequest;
  existingQuestionTexts: string[];
  sectionTitle: string;
  questionType: QuestionType;
  marks: number;
}

// ---- AI Practice Test: attempting + grading ----

// One student response per question. `response` is the raw text/selection
// (option text for mcq/assertion_reason, "True"/"False", typed text for
// everything else). `matchSelections` is match_following-only: parallel to
// the question's matchPairs, matchSelections[i] is the index into
// matchPairs the student picked as the right-hand match for left item i
// (or -1 if left unmatched). `answerImage` is a data URL (e.g.
// "data:image/jpeg;base64,...") of a photographed/uploaded answer - lets a
// student submit a diagram or handwritten answer instead of typing, for any
// free-text question. When present it takes priority over `response` for
// grading (see gradePaper.ts).
export interface AttemptAnswer {
  questionId: string;
  response: string;
  matchSelections?: number[];
  answerImage?: string;
}

export type GradingMethod = 'objective' | 'ai' | 'unanswered';

export interface QuestionResult {
  questionId: string;
  marksAwarded: number;
  maxMarks: number;
  method: GradingMethod;
  correct: boolean;
  studentAnswerText: string;
  studentAnswerImage?: string;
  correctAnswerText: string;
  // Populated only for AI-graded (subjective) questions - the examiner's
  // concept-level breakdown of the score, not a text-match verdict.
  explanation?: string;
  missingConcepts?: string[];
  incorrectConcepts?: string[];
  suggestions?: string;
}

export interface PaperAttemptResult {
  totalMarksAwarded: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  questionResults: QuestionResult[];
  gradedAt: string;
}

// Deliberately excludes a "model answer" - the AI grades by understanding
// the question and the student's answer like a real examiner would, not by
// text-matching against a canned reference key (see promptBuilder.ts).
// `answerImage` (a data URL) is set instead of `studentAnswer` when the
// student photographed/uploaded their answer (e.g. a diagram) rather than
// typing it - the AI reads it directly as an image, not OCR'd text.
export interface SubjectiveAnswerToGrade {
  questionId: string;
  questionText: string;
  maxMarks: number;
  studentAnswer: string;
  answerImage?: string;
}

export interface GradeAnswersRequest {
  request: PracticeTestRequest;
  answers: SubjectiveAnswerToGrade[];
}

export interface SubjectiveGrade {
  questionId: string;
  marksAwarded: number;
  explanation: string;
  missingConcepts: string[];
  incorrectConcepts: string[];
  suggestions: string;
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
