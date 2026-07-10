import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

async function assertIsAdmin(uid: string | undefined) {
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const snap = await getFirestore().collection('users').doc(uid).get();
  if (snap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }
}

interface CreateUserPayload {
  role: 'teacher' | 'student';
  email: string;
  password: string;
  displayName: string;
  profile: Record<string, unknown>;
}

export const createSchoolUser = onCall<CreateUserPayload>(async (request) => {
  await assertIsAdmin(request.auth?.uid);
  const { role, email, password, displayName, profile } = request.data;

  if (!email || !password || !displayName || (role !== 'teacher' && role !== 'student')) {
    throw new HttpsError('invalid-argument', 'Missing or invalid fields.');
  }

  const auth = getAuth();
  const db = getFirestore();

  const userRecord = await auth.createUser({ email, password, displayName, emailVerified: true });
  const uid = userRecord.uid;

  const batch = db.batch();
  batch.set(db.collection('users').doc(uid), { role, email, displayName });
  batch.set(db.collection(role === 'teacher' ? 'teachers' : 'students').doc(uid), profile);
  await batch.commit();

  return { uid };
});

interface DeleteUserPayload {
  uid: string;
  role: 'teacher' | 'student';
}

export const deleteSchoolUser = onCall<DeleteUserPayload>(async (request) => {
  await assertIsAdmin(request.auth?.uid);
  const { uid, role } = request.data;
  if (!uid || (role !== 'teacher' && role !== 'student')) {
    throw new HttpsError('invalid-argument', 'Missing or invalid fields.');
  }

  const db = getFirestore();
  await getAuth().deleteUser(uid).catch(() => {
    // user may already be gone from Auth - continue cleaning up Firestore regardless
  });

  const batch = db.batch();
  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection(role === 'teacher' ? 'teachers' : 'students').doc(uid));
  await batch.commit();

  return { ok: true };
});
