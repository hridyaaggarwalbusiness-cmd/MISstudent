export type Role = 'admin' | 'teacher' | 'student';

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
// (or -1 if left unmatched).
export interface AttemptAnswer {
  questionId: string;
  response: string;
  matchSelections?: number[];
}

export type GradingMethod = 'objective' | 'ai' | 'unanswered';

export interface QuestionResult {
  questionId: string;
  marksAwarded: number;
  maxMarks: number;
  method: GradingMethod;
  correct: boolean;
  studentAnswerText: string;
  correctAnswerText: string;
  feedback?: string;
}

export interface PaperAttemptResult {
  totalMarksAwarded: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  questionResults: QuestionResult[];
  gradedAt: string;
}

export interface SubjectiveAnswerToGrade {
  questionId: string;
  questionText: string;
  maxMarks: number;
  modelAnswer: string;
  studentAnswer: string;
}

export interface GradeAnswersRequest {
  request: PracticeTestRequest;
  answers: SubjectiveAnswerToGrade[];
}

export interface SubjectiveGrade {
  questionId: string;
  marksAwarded: number;
  feedback: string;
}
