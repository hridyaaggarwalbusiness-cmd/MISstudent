// One-time (idempotent) seed: creates real Firebase Auth accounts + matching
// Firestore documents for a starter school with three classes, a full
// teaching staff, students, weekly timetables, homework, exams + results,
// notices, study materials, calendar events, and several weeks of
// attendance history - so all three apps (student/teacher/admin) have rich,
// realistic data to work with from day one. Safe to re-run - uses
// deterministic ids and upserts throughout.

import { getAccessToken, api, step, logResult, toFirestoreFields } from './lib/gcp.mjs';

const PROJECT_ID = 'mis-student-6yhtxk';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DEFAULT_PASSWORD = 'MisStudent@2026';

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function isoDateTime(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

// Deterministic pseudo-random in [0, 1) so re-running the script always
// produces the same attendance/marks pattern instead of drifting each run.
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function lastNWeekdays(n) {
  const days = [];
  let offset = 0;
  while (days.length < n) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.unshift(d.toISOString().slice(0, 10));
    offset++;
  }
  return days;
}

async function upsertDoc(call, collection, id, fields) {
  const res = await call(
    'PATCH',
    `${FIRESTORE_BASE}/${collection}/${id}?currentDocument.exists=false`,
    { fields: toFirestoreFields(fields) },
  );
  if (res.ok) return logResult(`create ${collection}/${id}`, res);
  const updateRes = await call('PATCH', `${FIRESTORE_BASE}/${collection}/${id}`, {
    fields: toFirestoreFields(fields),
  });
  return logResult(`update ${collection}/${id}`, updateRes);
}

async function createAuthUser(call, { uid, email, password, displayName }) {
  const res = await call(
    'POST',
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
    { localId: uid, email, password, displayName, emailVerified: true },
  );
  if (res.ok) {
    logResult(`auth user ${email}`, res);
    return true;
  }
  if (res.json?.error?.message?.includes('DUPLICATE')) {
    console.log(`auth user ${email}: already exists`);
    return true;
  }
  logResult(`auth user ${email}`, res);
  return false;
}

// Runs a batch of async jobs with limited concurrency, to keep the REST API
// happy without waiting on hundreds of fully-sequential round trips.
async function runPool(items, worker, concurrency = 8) {
  const queue = [...items];
  async function runner() {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner));
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science'];

const teachers = [
  { uid: 'teacher-arvind', name: 'Mr. Arvind Rao', email: 'arvind.rao@misstudent.edu', subjects: ['Mathematics'] },
  { uid: 'teacher-priya', name: 'Ms. Priya Nair', email: 'priya.nair@misstudent.edu', subjects: ['English'] },
  { uid: 'teacher-sunita', name: 'Dr. Sunita Verma', email: 'sunita.verma@misstudent.edu', subjects: ['Science'] },
  { uid: 'teacher-karan', name: 'Mr. Karan Mehta', email: 'karan.mehta@misstudent.edu', subjects: ['Social Studies'] },
  { uid: 'teacher-anjali', name: 'Mrs. Anjali Gupta', email: 'anjali.gupta@misstudent.edu', subjects: ['Hindi'] },
  { uid: 'teacher-rohit', name: 'Mr. Rohit Malhotra', email: 'rohit.malhotra@misstudent.edu', subjects: ['Computer Science'] },
];
const subjectTeacher = Object.fromEntries(teachers.map((t) => [t.subjects[0], t]));

const classes = [
  {
    id: 'grade8-a',
    name: 'Grade 8',
    section: 'A',
    classTeacherUid: 'teacher-anjali',
    house: 'Griffin House',
    busRoute: 'Route 3 - Riverside Loop',
    students: [
      { uid: 'student-kabir', name: 'Kabir Malhotra', rollNumber: '1', admissionNumber: 'MIS-2022-0501' },
      { uid: 'student-tara', name: 'Tara Bhatt', rollNumber: '2', admissionNumber: 'MIS-2022-0502' },
      { uid: 'student-ishaan', name: 'Ishaan Chawla', rollNumber: '3', admissionNumber: 'MIS-2022-0503' },
      { uid: 'student-myra', name: 'Myra Desai', rollNumber: '4', admissionNumber: 'MIS-2022-0504' },
      { uid: 'student-devansh', name: 'Devansh Kulkarni', rollNumber: '5', admissionNumber: 'MIS-2022-0505' },
    ],
  },
  {
    id: 'grade9-b',
    name: 'Grade 9',
    section: 'B',
    classTeacherUid: 'teacher-arvind',
    house: 'Falcon House',
    busRoute: 'Route 7 - Sector 12 Loop',
    students: [
      { uid: 'student-ananya', name: 'Ananya Sharma', rollNumber: '1', admissionNumber: 'MIS-2021-0342' },
      { uid: 'student-rahul', name: 'Rahul Kapoor', rollNumber: '2', admissionNumber: 'MIS-2021-0343' },
      { uid: 'student-diya', name: 'Diya Patel', rollNumber: '3', admissionNumber: 'MIS-2021-0344' },
      { uid: 'student-arjun', name: 'Arjun Singh', rollNumber: '4', admissionNumber: 'MIS-2021-0345' },
      { uid: 'student-meera', name: 'Meera Iyer', rollNumber: '5', admissionNumber: 'MIS-2021-0346' },
      { uid: 'student-vikrant', name: 'Vikrant Joshi', rollNumber: '6', admissionNumber: 'MIS-2021-0347' },
    ],
  },
  {
    id: 'grade10-a',
    name: 'Grade 10',
    section: 'A',
    classTeacherUid: 'teacher-sunita',
    house: 'Phoenix House',
    busRoute: 'Route 1 - City Center Loop',
    students: [
      { uid: 'student-aarav', name: 'Aarav Khanna', rollNumber: '1', admissionNumber: 'MIS-2020-0201' },
      { uid: 'student-sara', name: 'Sara Fernandes', rollNumber: '2', admissionNumber: 'MIS-2020-0202' },
      { uid: 'student-yuvraj', name: 'Yuvraj Thakur', rollNumber: '3', admissionNumber: 'MIS-2020-0203' },
      { uid: 'student-naina', name: 'Naina Reddy', rollNumber: '4', admissionNumber: 'MIS-2020-0204' },
      { uid: 'student-omkar', name: 'Omkar Pillai', rollNumber: '5', admissionNumber: 'MIS-2020-0205' },
    ],
  },
];

const periodTimes = [
  ['08:00', '08:45'], ['08:45', '09:30'], ['09:30', '10:15'], ['10:15', '10:35'],
  ['10:35', '11:20'], ['11:20', '12:05'], ['12:05', '12:50'],
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
// Non-recess period slots (period 4 is always recess).
const SLOT_TO_PERIOD = [1, 2, 3, 5, 6, 7];
const ROOMS = { Science: 'Lab 3', 'Computer Science': 'Computer Lab' };

async function main() {
  const refreshToken = process.env.FIREBASE_TOKEN;
  if (!refreshToken) throw new Error('FIREBASE_TOKEN env var is required');
  const accessToken = await getAccessToken(refreshToken);
  const call = api(accessToken);

  step('Creating school settings');
  await upsertDoc(call, 'settings', 'school', {
    name: 'MIS School',
    address: '221 Ridgeview Avenue, New Delhi, India',
    phone: '+91 11 4000 5000',
  });

  step('Creating admin accounts');
  const admins = [
    { uid: 'admin-001', email: 'admin@misstudent.edu', name: 'School Admin', createdAt: isoDateTime(-400) },
    { uid: 'admin-ops', email: 'ops@misstudent.edu', name: 'Karan Malhotra', createdAt: isoDateTime(-30) },
  ];
  for (const a of admins) {
    await createAuthUser(call, { uid: a.uid, email: a.email, password: DEFAULT_PASSWORD, displayName: a.name });
    await upsertDoc(call, 'users', a.uid, { role: 'admin', email: a.email, displayName: a.name, createdAt: a.createdAt });
  }

  step('Creating classes');
  for (const c of classes) {
    await upsertDoc(call, 'classes', c.id, {
      name: c.name,
      section: c.section,
      classTeacherId: c.classTeacherUid,
      studentCount: c.students.length,
    });
  }

  step('Creating teacher auth accounts + profiles');
  const classIds = classes.map((c) => c.id);
  for (let ti = 0; ti < teachers.length; ti++) {
    const t = teachers[ti];
    await createAuthUser(call, { uid: t.uid, email: t.email, password: DEFAULT_PASSWORD, displayName: t.name });
    await upsertDoc(call, 'users', t.uid, { role: 'teacher', email: t.email, displayName: t.name, createdAt: isoDateTime(-300 + ti * 5) });
    const inchargeOf = classes.find((c) => c.classTeacherUid === t.uid);
    await upsertDoc(call, 'teachers', t.uid, {
      name: t.name,
      email: t.email,
      phone: `+91 90000 000${String(ti).padStart(2, '0')}`,
      subjects: t.subjects,
      classIds,
      isClassTeacherOf: inchargeOf ? inchargeOf.id : null,
      createdAt: isoDateTime(-300 + ti * 5),
    });
  }

  step('Creating student auth accounts + profiles');
  let globalStudentIndex = 0;
  for (const c of classes) {
    for (const s of c.students) {
      const email = `${s.uid.replace('student-', '')}@misstudent.edu`;
      const surname = s.name.split(' ').slice(-1)[0];
      // Two freshly-admitted students (for the admin dashboard's "N new
      // this week" delta) - everyone else has an older admission date.
      const createdAt = globalStudentIndex < 2 ? isoDateTime(-(globalStudentIndex + 1)) : isoDateTime(-(200 + globalStudentIndex * 3));
      await createAuthUser(call, { uid: s.uid, email, password: DEFAULT_PASSWORD, displayName: s.name });
      await upsertDoc(call, 'users', s.uid, { role: 'student', email, displayName: s.name, createdAt });
      await upsertDoc(call, 'students', s.uid, {
        name: s.name,
        photoUrl: null,
        classId: c.id,
        className: c.name,
        section: c.section,
        rollNumber: s.rollNumber,
        admissionNumber: s.admissionNumber,
        dateOfBirth: `20${10 + (globalStudentIndex % 6)}-0${1 + (globalStudentIndex % 9)}-14`,
        bloodGroup: ['O+', 'A+', 'B+', 'AB+', 'O-'][globalStudentIndex % 5],
        gender: globalStudentIndex % 2 === 0 ? 'Female' : 'Male',
        email,
        phone: `+91 98765 ${String(10000 + globalStudentIndex).slice(-5)}`,
        address: 'New Delhi, India',
        fatherName: `${surname}'s Father`,
        motherName: `${surname}'s Mother`,
        guardianPhone: '+91 98765 11111',
        emergencyContactName: `${surname}'s Father`,
        emergencyContactPhone: '+91 98765 11111',
        emergencyContactRelation: 'Father',
        house: c.house,
        busRoute: c.busRoute,
        createdAt,
      });
      globalStudentIndex++;
    }
  }

  step('Creating weekly timetables (rotated per class to avoid teacher clashes)');
  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci];
    for (const day of DAYS) {
      for (let slot = 0; slot < SLOT_TO_PERIOD.length; slot++) {
        const periodNumber = SLOT_TO_PERIOD[slot];
        const [startTime, endTime] = periodTimes[periodNumber - 1];
        const id = `${c.id}-${day}-${periodNumber}`;
        const subjectIdx = (slot + DAY_INDEX[day] + ci * 2) % SUBJECTS.length;
        const subject = SUBJECTS[subjectIdx];
        const teacher = subjectTeacher[subject];
        await upsertDoc(call, 'timetable', id, {
          classId: c.id, day, periodNumber, startTime, endTime,
          subject, teacher: teacher.name, teacherId: teacher.uid,
          room: ROOMS[subject] ?? `Room ${200 + ci}`,
          isBreak: false,
        });
      }
      // Recess, period 4, same for every class.
      const [startTime, endTime] = periodTimes[3];
      await upsertDoc(call, 'timetable', `${c.id}-${day}-4`, {
        classId: c.id, day, periodNumber: 4, startTime, endTime,
        subject: 'Recess', teacher: '', teacherId: '', room: '', isBreak: true,
      });
    }
  }

  step('Creating homework across classes and subjects');
  const homeworkTemplates = [
    { subject: 'Mathematics', title: 'Quadratic Equations — Practice Set 4', body: 'Solve all 15 problems from Chapter 4, Exercise 4.3. Show complete step-by-step working.' },
    { subject: 'English', title: 'Essay: "A Journey I Will Never Forget"', body: 'Write a descriptive essay of 400-500 words with vivid sensory detail.' },
    { subject: 'Science', title: 'Lab Report: States of Matter', body: 'Write up your observations from this week\'s states-of-matter experiment.' },
    { subject: 'Social Studies', title: 'Map Work: Rivers of India', body: 'Label all major rivers and their tributaries on the provided outline map.' },
  ];
  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci];
    for (let hi = 0; hi < homeworkTemplates.length; hi++) {
      const tpl = homeworkTemplates[hi];
      const teacher = subjectTeacher[tpl.subject];
      const id = `hw-${c.id}-${hi}`;
      await upsertDoc(call, 'homework', id, {
        classId: c.id, subject: tpl.subject, title: tpl.title, instructions: tpl.body,
        teacherId: teacher.uid, teacherName: teacher.name,
        assignedDate: isoDate(-3 - hi), dueDate: isoDate(4 - hi * 2),
        attachments: [],
      });
    }
  }

  step('Creating exams (past, for results, and upcoming)');
  const examSpecs = [
    { key: 'unit1', name: 'Unit Test 1', subject: 'Mathematics', date: -18, maxMarks: 50, status: 'completed' },
    { key: 'unit2', name: 'Unit Test 2', subject: 'Science', date: -8, maxMarks: 50, status: 'completed' },
    { key: 'midterm', name: 'Mid Term Examination', subject: 'English', date: 10, maxMarks: 100, status: 'upcoming' },
  ];
  const examDocs = [];
  for (const c of classes) {
    for (const spec of examSpecs) {
      const id = `exam-${c.id}-${spec.key}`;
      await upsertDoc(call, 'exams', id, {
        classId: c.id, name: spec.name, subject: spec.subject,
        date: isoDate(spec.date), startTime: '09:00', endTime: '11:00',
        room: 'Exam Hall A', syllabus: 'As per the term syllabus', status: spec.status,
      });
      examDocs.push({ id, classId: c.id, ...spec });
    }
  }

  step('Creating exam results for completed exams');
  const gradedTeacher = teachers[0];
  const resultJobs = [];
  for (const exam of examDocs) {
    if (exam.status !== 'completed') continue;
    const c = classes.find((cl) => cl.id === exam.classId);
    c.students.forEach((s, si) => {
      resultJobs.push({ exam, c, s, si });
    });
  }
  await runPool(resultJobs, async ({ exam, c, s, si }) => {
    const teacher = subjectTeacher[exam.subject] ?? gradedTeacher;
    const pct = 0.55 + pseudoRandom(si * 17 + exam.date) * 0.4;
    const marksObtained = Math.round(exam.maxMarks * pct);
    const grade = pct >= 0.9 ? 'A+' : pct >= 0.8 ? 'A' : pct >= 0.7 ? 'B' : pct >= 0.6 ? 'C' : 'D';
    const id = `result-${exam.id}-${s.uid}`;
    await upsertDoc(call, 'results', id, {
      studentId: s.uid, classId: c.id, examId: exam.id, examName: exam.name,
      subject: exam.subject, term: 'Term 1', date: isoDate(exam.date),
      marksObtained, maxMarks: exam.maxMarks, grade,
      gradedBy: teacher.uid, gradedAt: isoDateTime(exam.date + 2),
    });
  });

  step('Creating attendance history (last 20 school days)');
  const schoolDays = lastNWeekdays(20);
  const attendanceJobs = [];
  let studentSeed = 0;
  for (const c of classes) {
    c.students.forEach((s, si) => {
      const isAtRisk = si === c.students.length - 1; // one deliberately at-risk student per class
      schoolDays.forEach((date, di) => {
        attendanceJobs.push({ c, s, date, seed: studentSeed, di, isAtRisk });
      });
      studentSeed++;
    });
  }
  await runPool(attendanceJobs, async ({ c, s, date, seed, di, isAtRisk }) => {
    const r = pseudoRandom(seed * 31 + di * 7);
    let status = 'present';
    if (isAtRisk) {
      if (r < 0.35) status = 'absent';
      else if (r < 0.45) status = 'late';
    } else {
      if (r < 0.06) status = 'absent';
      else if (r < 0.11) status = 'late';
      else if (r < 0.13) status = 'leave';
    }
    const markedBy = c.classTeacherUid;
    await upsertDoc(call, 'attendance', `${s.uid}_${date}`, {
      studentId: s.uid, classId: c.id, date, status,
      markedBy, markedAt: `${date}T09:00:00.000Z`,
    });
  }, 12);

  step('Creating notices');
  const notices = [
    { id: 'notice-sports-day', title: 'Annual Sports Day — 15th of Next Month', body: 'The school Annual Sports Day will be held on the school grounds. All students must report by 7:30 AM in house colors.', category: 'event', pinned: true, postedAt: -5 },
    { id: 'notice-ptm', title: 'Parent-Teacher Meeting Rescheduled', body: 'The PTM originally scheduled for this Friday has been moved to next Monday at 10 AM in the main hall.', category: 'academic', pinned: true, postedAt: -2 },
    { id: 'notice-diwali', title: 'Diwali Holiday Announcement', body: 'The school will remain closed for Diwali from the 1st to the 5th of next month. Classes resume on the 6th.', category: 'holiday', pinned: false, postedAt: -10 },
    { id: 'notice-uniform', title: 'Winter Uniform Guidelines', body: 'Starting next Monday, all students are required to wear the winter uniform. Please refer to the handbook for details.', category: 'general', pinned: false, postedAt: -14 },
  ];
  for (const n of notices) {
    await upsertDoc(call, 'notices', n.id, {
      title: n.title, body: n.body, category: n.category,
      postedBy: 'admin-001', postedByName: 'School Admin',
      postedAt: isoDateTime(n.postedAt), targetClassIds: [], attachments: [], pinned: n.pinned,
    });
  }

  step('Creating calendar events');
  const events = [
    { id: 'cal-sports-day', title: 'Annual Sports Day', date: 20, type: 'sports', location: 'School Grounds', description: 'Track & field events and house competitions.' },
    { id: 'cal-midterm', title: 'Mid Term Exams Begin', date: 10, type: 'exam', description: 'Mid-term examinations begin for all classes.' },
    { id: 'cal-diwali', title: 'Diwali Break', date: 30, endDate: 34, type: 'holiday', description: 'School closed for Diwali.' },
    { id: 'cal-staff-meeting', title: 'Staff Meeting', date: 3, type: 'meeting', location: 'Staff Room' },
    { id: 'cal-science-fair', title: 'Inter-School Science Fair', date: 25, type: 'competition', location: 'Auditorium' },
    { id: 'cal-annual-day', title: 'Annual Day Function', date: 45, type: 'function', location: 'School Auditorium' },
  ];
  for (const e of events) {
    await upsertDoc(call, 'calendarEvents', e.id, {
      title: e.title, date: isoDate(e.date), type: e.type,
      ...(e.endDate ? { endDate: isoDate(e.endDate) } : {}),
      ...(e.location ? { location: e.location } : {}),
      ...(e.description ? { description: e.description } : {}),
    });
  }

  step('Creating study materials');
  const materials = [
    { id: 'mat-quadratic-notes', classId: 'grade9-b', title: 'Quadratic Equations — Complete Notes', subject: 'Mathematics', type: 'note', uploadedBy: 'teacher-arvind', uploadedByName: 'Mr. Arvind Rao' },
    { id: 'mat-grammar-worksheet', classId: 'grade8-a', title: 'Grammar Worksheet — Tenses', subject: 'English', type: 'worksheet', uploadedBy: 'teacher-priya', uploadedByName: 'Ms. Priya Nair' },
    { id: 'mat-states-matter-ppt', classId: 'grade10-a', title: 'States of Matter — Presentation', subject: 'Science', type: 'presentation', uploadedBy: 'teacher-sunita', uploadedByName: 'Dr. Sunita Verma' },
  ];
  for (const m of materials) {
    await upsertDoc(call, 'studyMaterials', m.id, {
      classId: m.classId, title: m.title, subject: m.subject, type: m.type,
      uploadedBy: m.uploadedBy, uploadedByName: m.uploadedByName,
      uploadedAt: isoDateTime(-6),
      attachment: { id: `${m.id}-file`, name: `${m.id}.pdf`, type: 'pdf', url: '', sizeLabel: '340 KB' },
      sizeLabel: '340 KB',
    });
  }

  step('Creating fee structures, payment history and receipts');
  const ACADEMIC_SESSION = '2026-27';
  const feeConfigByClass = {
    'grade8-a': { academicFee: 20000, transportFeeAmount: 6000 },
    'grade9-b': { academicFee: 23000, transportFeeAmount: 7000 },
    'grade10-a': { academicFee: 25000, transportFeeAmount: 8000 },
  };
  const FEE_INSTALLMENTS = [
    { id: '1', label: '1st Installment', period: 'April - September 2026', dueDate: '2026-06-15' },
    { id: '2', label: '2nd Installment', period: 'October 2026 - March 2027', dueDate: '2026-12-15' },
  ];

  for (const c of classes) {
    const cfg = feeConfigByClass[c.id];
    await upsertDoc(call, 'feeStructures', c.id, {
      classId: c.id,
      academicSession: ACADEMIC_SESSION,
      transportFeeAmount: cfg.transportFeeAmount,
      installments: FEE_INSTALLMENTS.map((inst) => ({ ...inst, academicFee: cfg.academicFee })),
    });
  }

  // Deterministic per-student scenario: a realistic spread of paid/partial/
  // unpaid for the (already-due) 1st installment, a few early payers on the
  // (not-yet-due) 2nd, one self-transport student per class, and one
  // multi-payment history for the very first seeded student.
  let receiptSeq = 0;
  let feeSeed = 0;
  for (const c of classes) {
    const cfg = feeConfigByClass[c.id];
    for (let si = 0; si < c.students.length; si++) {
      const s = c.students[si];
      const isAtRisk = si === c.students.length - 1;
      const transportType = si % 5 === 4 ? 'self' : 'bus';
      const transportFee = transportType === 'bus' ? cfg.transportFeeAmount : 0;
      const seed = feeSeed;

      for (const inst of FEE_INSTALLMENTS) {
        const totalFee = cfg.academicFee + transportFee;
        const r = pseudoRandom(seed * 13 + inst.id.charCodeAt(0) * 41);
        let scenario;
        if (inst.id === '1') {
          if (isAtRisk) scenario = 'unpaid';
          else if (r < 0.5) scenario = 'paid';
          else if (r < 0.8) scenario = 'partial';
          else scenario = 'unpaid';
        } else {
          scenario = r < 0.15 ? 'partial' : 'unpaid';
        }

        // A student who owes nothing yet and rides the default School Bus
        // needs no document at all - the app's lazy-materialization
        // defaults already describe them correctly.
        if (scenario === 'unpaid' && transportType === 'bus') continue;

        let paidSoFar = 0;
        if (scenario !== 'unpaid') {
          const isTwoPayments = scenario === 'partial' && seed === 0 && inst.id === '1';
          const targetPaid =
            scenario === 'paid' ? totalFee : Math.round(totalFee * (0.35 + pseudoRandom(seed * 7 + 3) * 0.3));
          const paymentAmounts = isTwoPayments
            ? [Math.round(targetPaid * 0.5), targetPaid - Math.round(targetPaid * 0.5)]
            : [targetPaid];
          const paymentMethods = ['cash', 'upi', 'bank_transfer', 'card'];

          for (let pi = 0; pi < paymentAmounts.length; pi++) {
            const amount = paymentAmounts[pi];
            paidSoFar += amount;
            const balanceAfter = Math.max(0, totalFee - paidSoFar);
            const statusAfter = balanceAfter <= 0 ? 'paid' : 'partial';
            receiptSeq++;
            const receiptNo = `RCP/${ACADEMIC_SESSION}/${String(receiptSeq).padStart(6, '0')}`;
            const paymentRef = `PAY/2026/${10000 + receiptSeq}`;
            const daysAgo = 10 + Math.round(pseudoRandom(seed * 19 + pi * 5 + inst.id.charCodeAt(0)) * 40);
            const paymentMethod = paymentMethods[(seed + pi) % paymentMethods.length];

            await upsertDoc(call, 'feePayments', `seed-${s.uid}-inst${inst.id}-pay${pi + 1}`, {
              studentId: s.uid, classId: c.id, academicSession: ACADEMIC_SESSION, installmentId: inst.id,
              studentName: s.name, admissionNumber: s.admissionNumber, className: c.name, section: c.section,
              academicFee: cfg.academicFee, transportFee, totalFee,
              amount, totalPaidAfter: paidSoFar, balanceAfter, statusAfter,
              paymentMethod, transactionRef: paymentMethod === 'cash' ? '' : `TXN${1000000 + receiptSeq}`,
              paymentDate: isoDate(-daysAgo),
              collectedBy: 'admin-001', collectedByName: 'School Admin',
              remarks: isTwoPayments && pi === 0 ? 'Partial payment' : '',
              receiptNo, paymentRef, createdAt: isoDateTime(-daysAgo),
            });
          }
        }

        await upsertDoc(call, 'studentFeeRecords', `${s.uid}_${inst.id}`, {
          studentId: s.uid, classId: c.id, academicSession: ACADEMIC_SESSION, installmentId: inst.id,
          transportType, academicFee: cfg.academicFee, transportFee, totalFee,
          amountPaid: paidSoFar, balance: Math.max(0, totalFee - paidSoFar),
          status: paidSoFar >= totalFee ? 'paid' : paidSoFar > 0 ? 'partial' : 'unpaid',
          dueDate: inst.dueDate, updatedAt: isoDateTime(-1),
        });
      }
      feeSeed++;
    }
  }
  // So the live app's transactional receipt counter continues right after
  // the last seeded receipt number instead of colliding with it.
  await upsertDoc(call, 'counters', `feeReceipt_${ACADEMIC_SESSION}`, { seq: receiptSeq });

  step('Creating a few starter audit log entries');
  const auditSeeds = [
    { id: 'audit-seed-1', action: 'notice_posted', summary: 'Notice posted: Parent-Teacher Meeting Rescheduled', at: -2 },
    { id: 'audit-seed-2', action: 'attendance_marked', summary: `Attendance marked for ${classes.reduce((n, c) => n + c.students.length, 0)} student(s)`, at: -1 },
    { id: 'audit-seed-3', action: 'exam_scheduled', summary: 'Mid Term Examination scheduled', at: -7 },
  ];
  for (const a of auditSeeds) {
    await upsertDoc(call, 'auditLogs', a.id, {
      action: a.action, summary: a.summary, actorId: 'admin-001', actorName: 'School Admin', at: isoDateTime(a.at),
    });
  }

  console.log('\nSeeding complete.');
  console.log(`Default password for all seeded accounts: ${DEFAULT_PASSWORD}`);
  console.log('Admin logins:', admins.map((a) => a.email).join(', '));
  console.log('Teacher logins:', teachers.map((t) => t.email).join(', '));
  console.log(
    'Student logins:',
    classes.flatMap((c) => c.students.map((s) => `${s.uid.replace('student-', '')}@misstudent.edu`)).join(', '),
  );
}

main().catch((err) => {
  console.error('SEEDING FAILED:', err);
  process.exit(1);
});
