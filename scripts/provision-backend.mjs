import { getAccessToken, api, step, logResult } from './lib/gcp.mjs';
import { writeFileSync } from 'node:fs';

const PROJECT_ID = 'mis-student-6yhtxk';

async function main() {
  const refreshToken = process.env.FIREBASE_TOKEN;
  if (!refreshToken) throw new Error('FIREBASE_TOKEN env var is required');

  step('Exchanging Firebase CI token for an access token');
  const accessToken = await getAccessToken(refreshToken);
  console.log('Got access token (length):', accessToken.length);
  const call = api(accessToken);

  step('Enabling required Google Cloud APIs');
  const apisToEnable = [
    'identitytoolkit.googleapis.com',
    'firestore.googleapis.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    'firebase.googleapis.com',
  ];
  for (const apiName of apisToEnable) {
    const res = await call(
      'POST',
      `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/${apiName}:enable`,
      {},
    );
    logResult(`enable ${apiName}`, res);
  }

  step('Creating Firestore database (Native mode) if missing');
  const listDb = await call(
    'GET',
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases`,
  );
  logResult('list databases', listDb);
  const hasDefault = listDb.ok && (listDb.json.databases || []).some((d) => d.name?.endsWith('/databases/(default)'));
  let firestoreReady = hasDefault;
  if (!hasDefault) {
    const createDb = await call(
      'POST',
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases?databaseId=(default)`,
      { type: 'FIRESTORE_NATIVE', locationId: 'nam5' },
    );
    logResult('create default Firestore database', createDb);
    firestoreReady = createDb.ok;
  } else {
    console.log('Default Firestore database already exists.');
  }

  step('Enabling Email/Password sign-in provider');
  let authConfig = await call('GET', `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`);
  logResult('get auth config', authConfig);
  if (!authConfig.ok) {
    console.log('Auth config missing - retrying a couple times in case of API propagation delay...');
    for (let attempt = 1; attempt <= 2 && !authConfig.ok; attempt++) {
      await new Promise((r) => setTimeout(r, 8000));
      authConfig = await call('GET', `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`);
      logResult(`get auth config (retry ${attempt})`, authConfig);
    }
  }

  if (authConfig.ok) {
    const patchAuth = await call(
      'PATCH',
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email`,
      { signIn: { email: { enabled: true, passwordRequired: true } } },
    );
    logResult('enable email/password auth', patchAuth);
  } else {
    console.log(
      'BLOCKED: Firebase Auth config could not be initialized. This project needs the Blaze ' +
        '(pay-as-you-go) plan linked before Authentication can be enabled via API - this is a Google ' +
        'requirement for API-driven setup on a project that was never opened in the Firebase console. ' +
        'Blaze keeps the same free quotas as Spark; it only requires a payment method on file. ' +
        'Action needed: console.firebase.google.com -> mis-student-6yhtxk -> Upgrade to Blaze, then re-run this workflow.',
    );
  }

  step('Ensuring default Cloud Storage bucket exists');
  let storageBucket = `${PROJECT_ID}.firebasestorage.app`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const addBucket = await call(
      'POST',
      `https://firebasestorage.googleapis.com/v1beta/projects/${PROJECT_ID}/defaultBucket:addFirebase`,
      {},
    );
    logResult(`link default storage bucket (attempt ${attempt})`, addBucket);
    const getBucket = await call(
      'GET',
      `https://firebasestorage.googleapis.com/v1beta/projects/${PROJECT_ID}/defaultBucket`,
    );
    logResult(`get default storage bucket (attempt ${attempt})`, getBucket);
    if (getBucket.ok) {
      storageBucket = getBucket.json.name?.split('/').pop() ?? storageBucket;
      break;
    }
    if (attempt < 3) {
      console.log('Storage API may still be propagating, waiting 10s before retry...');
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
  console.log('Storage bucket:', storageBucket);

  step('Finding or creating a Web App registration');
  const listApps = await call(
    'GET',
    `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps`,
  );
  logResult('list web apps', listApps);
  let webApp = listApps.ok ? (listApps.json.apps || [])[0] : null;

  if (!webApp) {
    const createApp = await call(
      'POST',
      `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps`,
      { displayName: 'MIS Student Shared Web Config' },
    );
    logResult('create web app', createApp);
    if (!createApp.ok) throw new Error('Could not create web app');

    // This is a long-running operation; poll until done.
    const opName = createApp.json.name;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const opRes = await call('GET', `https://firebase.googleapis.com/v1beta1/${opName}`);
      if (opRes.ok && opRes.json.done) {
        webApp = opRes.json.response;
        break;
      }
      console.log(`Waiting for web app creation operation... (${i + 1}/15)`);
    }
    if (!webApp) throw new Error('Timed out waiting for web app creation');
  } else {
    console.log('Using existing web app:', webApp.appId);
  }

  step('Fetching Web App SDK config');
  const configRes = await call('GET', `https://firebase.googleapis.com/v1beta1/${webApp.name}/config`);
  logResult('get web app config', configRes);
  if (!configRes.ok) throw new Error('Could not fetch web app config');

  const sdkConfig = configRes.json;
  console.log('SDK config:', JSON.stringify(sdkConfig, null, 2));

  writeFileSync(
    'firebase-web-config.json',
    JSON.stringify(
      {
        apiKey: sdkConfig.apiKey,
        authDomain: sdkConfig.authDomain,
        projectId: sdkConfig.projectId,
        storageBucket: sdkConfig.storageBucket ?? storageBucket,
        messagingSenderId: sdkConfig.messagingSenderId,
        appId: sdkConfig.appId,
      },
      null,
      2,
    ),
  );
  console.log('\nWrote firebase-web-config.json');

  step('Summary');
  console.log('Firestore:', firestoreReady ? 'ready' : 'NOT ready');
  console.log('Auth (email/password):', authConfig.ok ? 'ready' : 'BLOCKED - needs Blaze plan');
  console.log('Storage bucket:', storageBucket);
}

main().catch((err) => {
  console.error('PROVISIONING FAILED:', err);
  process.exit(1);
});
