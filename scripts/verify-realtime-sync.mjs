// Proves the core "teacher posts homework -> student sees it live" promise
// end-to-end against the real Firebase project: signs in as a real seeded
// teacher and a real seeded student in two independent app instances, has
// the teacher create a homework document, and asserts the student's live
// onSnapshot listener (the same mechanism the student app uses) picks it up
// without any polling or manual refresh. Cleans up the test document after.
//
// Runs in CI (not the sandboxed dev environment) since it needs real network
// access to Firebase.

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyByvK3sAsxbzXGmXWVs3GFObGZEtCpC4Mg',
  authDomain: 'mis-student-6yhtxk.firebaseapp.com',
  projectId: 'mis-student-6yhtxk',
  storageBucket: 'mis-student-6yhtxk.firebasestorage.app',
  messagingSenderId: '199745552461',
  appId: '1:199745552461:web:b3d1a829f1eb451b595c04',
};

const PASSWORD = 'MisStudent@2026';
const CLASS_ID = 'grade9-b';
const TEST_HOMEWORK_ID = `realtime-check-${Date.now()}`;
const TEST_TITLE = `Realtime Sync Check ${new Date().toISOString()}`;
const TIMEOUT_MS = 20000;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

async function main() {
  console.log('=== Real-time cross-app sync verification ===');

  const teacherApp = initializeApp(firebaseConfig, 'teacher-check');
  const studentApp = initializeApp(firebaseConfig, 'student-check');
  const teacherAuth = getAuth(teacherApp);
  const studentAuth = getAuth(studentApp);
  const teacherDb = getFirestore(teacherApp);
  const studentDb = getFirestore(studentApp);

  console.log('Signing in as teacher-arvind@misstudent.edu...');
  await signInWithEmailAndPassword(teacherAuth, 'arvind.rao@misstudent.edu', PASSWORD);
  console.log('Signing in as student ananya@misstudent.edu...');
  await signInWithEmailAndPassword(studentAuth, 'ananya@misstudent.edu', PASSWORD);

  console.log('Student subscribing to homework for class', CLASS_ID, '...');
  const seenIds = new Set();
  let resolveSeen;
  const seenPromise = new Promise((resolve) => {
    resolveSeen = resolve;
  });

  const q = query(collection(studentDb, 'homework'), where('classId', '==', CLASS_ID));
  const unsub = onSnapshot(q, (snap) => {
    snap.docs.forEach((d) => seenIds.add(d.id));
    if (seenIds.has(TEST_HOMEWORK_ID)) resolveSeen();
  });

  // Give the listener a moment to attach and receive its initial snapshot
  // before the teacher writes, so we know we're seeing a live update and
  // not just an initial fetch that happened to include it.
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Teacher creating homework doc', TEST_HOMEWORK_ID, '...');
  await setDoc(doc(teacherDb, 'homework', TEST_HOMEWORK_ID), {
    classId: CLASS_ID,
    subject: 'Mathematics',
    title: TEST_TITLE,
    instructions: 'Automated real-time sync verification - safe to ignore/delete.',
    teacherId: 'teacher-arvind',
    teacherName: 'Mr. Arvind Rao',
    assignedDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    attachments: [],
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Student did not observe the new homework within ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
  );

  try {
    await Promise.race([seenPromise, timeout]);
    console.log('PASS: Student live listener observed the teacher-created homework document.');
  } catch (e) {
    unsub();
    await deleteDoc(doc(teacherDb, 'homework', TEST_HOMEWORK_ID)).catch(() => {});
    fail(e.message);
    return;
  }

  unsub();
  console.log('Cleaning up test homework document...');
  await deleteDoc(doc(teacherDb, 'homework', TEST_HOMEWORK_ID));
  console.log('=== Verification complete: real-time cross-app sync confirmed ===');
  process.exit(0);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
