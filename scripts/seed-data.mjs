// One-time seed: creates real Firebase Auth accounts + matching Firestore
// documents for a starter school (one class, a few teachers/students,
// a weekly timetable, and a handful of homework/notices/exam/result/
// material/calendar records) so all three apps have real data to work
// with from day one. Safe to re-run - uses deterministic ids and upserts.

import { getAccessToken, api, step, logResult, toFirestoreFields } from './lib/gcp.mjs';

const PROJECT_ID = 'mis-student-6yhtxk';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function isoToday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function upsertDoc(call, collection, id, fields) {
  const res = await call(
    'PATCH',
    `${FIRESTORE_BASE}/${collection}/${id}?currentDocument.exists=false`,
    { fields: toFirestoreFields(fields) },
  );
  if (res.ok) return logResult(`create ${collection}/${id}`, res);
  // Already exists - update instead.
  const updateRes = await call('PATCH', `${FIRESTORE_BASE}/${collection}/${id}`, {
    fields: toFirestoreFields(fields),
  });
  return logResult(`update ${collection}/${id}`, updateRes);
}

async function upsertSubDoc(call, parentPath, subcollection, id, fields) {
  const url = `${FIRESTORE_BASE}/${parentPath}/${subcollection}/${id}`;
  const res = await call('PATCH', url, { fields: toFirestoreFields(fields) });
  return logResult(`upsert ${parentPath}/${subcollection}/${id}`, res);
}

async function createAuthUser(call, apiKey, { uid, email, password, displayName }) {
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

const CLASS_ID = 'grade9-b';

const teachers = [
  { uid: 'teacher-arvind', name: 'Mr. Arvind Rao', email: 'arvind.rao@misstudent.edu', subjects: ['Mathematics'] },
  { uid: 'teacher-priya', name: 'Ms. Priya Nair', email: 'priya.nair@misstudent.edu', subjects: ['English'] },
  { uid: 'teacher-sunita', name: 'Dr. Sunita Verma', email: 'sunita.verma@misstudent.edu', subjects: ['Science'] },
  { uid: 'teacher-karan', name: 'Mr. Karan Mehta', email: 'karan.mehta@misstudent.edu', subjects: ['Social Studies'] },
  { uid: 'teacher-anjali', name: 'Mrs. Anjali Gupta', email: 'anjali.gupta@misstudent.edu', subjects: ['Hindi'] },
  { uid: 'teacher-rohit', name: 'Mr. Rohit Malhotra', email: 'rohit.malhotra@misstudent.edu', subjects: ['Computer Science'] },
];

const students = [
  { uid: 'student-ananya', name: 'Ananya Sharma', rollNumber: '1', admissionNumber: 'MIS-2021-0342' },
  { uid: 'student-rahul', name: 'Rahul Kapoor', rollNumber: '2', admissionNumber: 'MIS-2021-0343' },
  { uid: 'student-diya', name: 'Diya Patel', rollNumber: '3', admissionNumber: 'MIS-2021-0344' },
  { uid: 'student-arjun', name: 'Arjun Singh', rollNumber: '4', admissionNumber: 'MIS-2021-0345' },
  { uid: 'student-meera', name: 'Meera Iyer', rollNumber: '5', admissionNumber: 'MIS-2021-0346' },
  { uid: 'student-vikrant', name: 'Vikrant Joshi', rollNumber: '6', admissionNumber: 'MIS-2021-0347' },
];

const DEFAULT_PASSWORD = 'MisStudent@2026';

const weeklyPattern = {
  Mon: ['Mathematics', 'English', 'Science', null, 'Social Studies', 'Hindi', 'Computer Science'],
  Tue: ['Science', 'Mathematics', 'Computer Science', null, 'English', 'Hindi', 'Social Studies'],
  Wed: ['Hindi', 'Social Studies', 'Mathematics', null, 'Science', 'English', 'Computer Science'],
  Thu: ['English', 'Science', 'Social Studies', null, 'Mathematics', 'Computer Science', 'Hindi'],
  Fri: ['Mathematics', 'Hindi', 'English', null, 'Science', 'Social Studies', 'Computer Science'],
};
const periodTimes = [
  ['08:00', '08:45'], ['08:45', '09:30'], ['09:30', '10:15'], ['10:15', '10:35'],
  ['10:35', '11:20'], ['11:20', '12:05'], ['12:05', '12:50'],
];
const subjectTeacher = Object.fromEntries(teachers.map((t) => [t.subjects[0], t]));

async function main() {
  const refreshToken = process.env.FIREBASE_TOKEN;
  if (!refreshToken) throw new Error('FIREBASE_TOKEN env var is required');
  const accessToken = await getAccessToken(refreshToken);
  const call = api(accessToken);

  step('Creating class');
  await upsertDoc(call, 'classes', CLASS_ID, {
    name: 'Grade 9',
    section: 'B',
    classTeacherId: 'teacher-arvind',
    studentCount: students.length,
  });

  step('Creating teacher auth accounts + profiles');
  for (const t of teachers) {
    await createAuthUser(call, null, {
      uid: t.uid,
      email: t.email,
      password: DEFAULT_PASSWORD,
      displayName: t.name,
    });
    await upsertDoc(call, 'users', t.uid, { role: 'teacher', email: t.email, displayName: t.name });
    await upsertDoc(call, 'teachers', t.uid, {
      name: t.name,
      email: t.email,
      phone: '+91 90000 00000',
      subjects: t.subjects,
      classIds: [CLASS_ID],
      isClassTeacherOf: t.uid === 'teacher-arvind' ? CLASS_ID : null,
    });
  }

  step('Creating student auth accounts + profiles');
  for (const s of students) {
    await createAuthUser(call, null, {
      uid: s.uid,
      email: `${s.uid.replace('student-', '')}@misstudent.edu`,
      password: DEFAULT_PASSWORD,
      displayName: s.name,
    });
    const email = `${s.uid.replace('student-', '')}@misstudent.edu`;
    await upsertDoc(call, 'users', s.uid, { role: 'student', email, displayName: s.name });
    await upsertDoc(call, 'students', s.uid, {
      name: s.name,
      photoUrl: null,
      classId: CLASS_ID,
      className: 'Grade 9',
      section: 'B',
      rollNumber: s.rollNumber,
      admissionNumber: s.admissionNumber,
      dateOfBirth: '2011-03-14',
      bloodGroup: 'B+',
      gender: 'Not specified',
      email,
      phone: '+91 98765 00000',
      address: 'New Delhi, India',
      fatherName: `${s.name.split(' ')[1]}'s Father`,
      motherName: `${s.name.split(' ')[1]}'s Mother`,
      guardianPhone: '+91 98765 11111',
      emergencyContactName: `${s.name.split(' ')[1]}'s Father`,
      emergencyContactPhone: '+91 98765 11111',
      emergencyContactRelation: 'Father',
      house: 'Falcon House',
      busRoute: 'Route 7 - Sector 12 Loop',
    });
  }

  step('Creating admin auth account');
  await createAuthUser(call, null, {
    uid: 'admin-001',
    email: 'admin@misstudent.edu',
    password: DEFAULT_PASSWORD,
    displayName: 'School Admin',
  });
  await upsertDoc(call, 'users', 'admin-001', {
    role: 'admin',
    email: 'admin@misstudent.edu',
    displayName: 'School Admin',
  });

  step('Creating weekly timetable');
  for (const [day, subjects] of Object.entries(weeklyPattern)) {
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const [startTime, endTime] = periodTimes[i];
      const id = `${CLASS_ID}-${day}-${i + 1}`;
      if (!subject) {
        await upsertDoc(call, 'timetable', id, {
          classId: CLASS_ID, day, periodNumber: i + 1, startTime, endTime,
          subject: 'Recess', teacher: '', teacherId: '', room: '', isBreak: true,
        });
        continue;
      }
      const teacher = subjectTeacher[subject];
      await upsertDoc(call, 'timetable', id, {
        classId: CLASS_ID, day, periodNumber: i + 1, startTime, endTime,
        subject, teacher: teacher.name, teacherId: teacher.uid,
        room: subject === 'Science' ? 'Lab 3' : subject === 'Computer Science' ? 'Computer Lab' : 'Room 204',
        isBreak: false,
      });
    }
  }

  step('Creating sample homework');
  await upsertDoc(call, 'homework', 'hw-quadratic', {
    classId: CLASS_ID, subject: 'Mathematics', title: 'Quadratic Equations — Practice Set 4',
    instructions: 'Solve all 15 problems from Chapter 4, Exercise 4.3. Show complete step-by-step working.',
    teacherId: 'teacher-arvind', teacherName: 'Mr. Arvind Rao',
    assignedDate: isoToday(-2), dueDate: isoToday(1), status: 'pending', attachments: [],
    createdAt: new Date(),
  });
  await upsertDoc(call, 'homework', 'hw-essay', {
    classId: CLASS_ID, subject: 'English', title: 'Essay: "A Journey I Will Never Forget"',
    instructions: 'Write a descriptive essay of 400-500 words with vivid sensory detail.',
    teacherId: 'teacher-priya', teacherName: 'Ms. Priya Nair',
    assignedDate: isoToday(-1), dueDate: isoToday(3), status: 'pending', attachments: [],
    createdAt: new Date(),
  });

  step('Creating sample exam');
  await upsertDoc(call, 'exams', 'exam-midterm-math', {
    classId: CLASS_ID, name: 'Mid-Term Examination', subject: 'Mathematics',
    date: isoToday(5), startTime: '09:00', endTime: '11:00', room: 'Exam Hall A',
    syllabus: 'Chapters 1-6', status: 'upcoming',
  });

  step('Creating sample notice');
  await upsertDoc(call, 'notices', 'notice-sports-day', {
    title: 'Annual Sports Day — 15th of Next Month',
    body: 'The school Annual Sports Day will be held on the school grounds. All students must report by 7:30 AM in house colors.',
    category: 'event', postedBy: 'Principal Office', postedByName: 'Principal Office',
    postedAt: new Date(), targetClassIds: [], attachments: [], readBy: [], pinned: true,
  });

  step('Creating sample calendar event');
  await upsertDoc(call, 'calendarEvents', 'cal-sports-day', {
    title: 'Annual Sports Day', date: isoToday(20), type: 'sports',
    location: 'School Grounds', description: 'Track & field events and house competitions.',
    createdBy: 'admin-001',
  });

  step('Creating sample study material');
  await upsertDoc(call, 'studyMaterials', 'mat-quadratic-notes', {
    classId: CLASS_ID, title: 'Quadratic Equations — Complete Notes', subject: 'Mathematics',
    type: 'note', uploadedBy: 'teacher-arvind', uploadedByName: 'Mr. Arvind Rao',
    uploadedAt: new Date(), attachment: { name: 'quadratic-notes.pdf', type: 'pdf', url: '' },
  });

  console.log('\nSeeding complete.');
  console.log(`Default password for all seeded accounts: ${DEFAULT_PASSWORD}`);
  console.log('Admin login: admin@misstudent.edu');
  console.log('Teacher logins:', teachers.map((t) => t.email).join(', '));
  console.log('Student logins:', students.map((s) => `${s.uid.replace('student-', '')}@misstudent.edu`).join(', '));
}

main().catch((err) => {
  console.error('SEEDING FAILED:', err);
  process.exit(1);
});
