// Cloud Functions require the Blaze plan (Cloud Build + Artifact Registry),
// which isn't enabled on this project, so these aren't deployed by default -
// the admin app instead creates/revokes accounts client-side via a secondary
// Firebase App (see admin-app/src/data/repositories/index.ts). Deploy this
// codebase once Blaze is active to get real Auth-account deletion (the
// client-side path can only revoke Firestore access, not the credential
// itself) via `firebase deploy --only functions` or the functions-deploy.yml
// workflow.
//
// generatePracticeTestPaper/regeneratePracticeTestQuestion below are the
// same story: a fully-working, more secure alternative to student-app's
// current Gemini-from-the-browser path (services/ai/geminiProvider.ts),
// kept ready for when Blaze is enabled. To switch the app to it, deploy
// this codebase and change the one export in
// student-app/src/services/ai/index.ts back to `cloudFunctionPaperProvider`
// - no other code changes needed.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

export { generatePracticeTestPaper, regeneratePracticeTestQuestion } from './practiceTest';

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
