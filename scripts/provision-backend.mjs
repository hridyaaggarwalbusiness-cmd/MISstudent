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
  if (!hasDefault) {
    const createDb = await call(
      'POST',
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases?databaseId=(default)`,
      { type: 'FIRESTORE_NATIVE', locationId: 'nam5' },
    );
    logResult('create default Firestore database', createDb);
  } else {
    console.log('Default Firestore database already exists.');
  }

  step('Enabling Email/Password sign-in provider');
  const authConfig = await call(
    'PATCH',
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email`,
    { signIn: { email: { enabled: true, passwordRequired: true } } },
  );
  logResult('enable email/password auth', authConfig);

  step('Ensuring default Cloud Storage bucket exists');
  const addBucket = await call(
    'POST',
    `https://firebasestorage.googleapis.com/v1beta/projects/${PROJECT_ID}/defaultBucket:addFirebase`,
    {},
  );
  logResult('link default storage bucket', addBucket);
  const getBucket = await call(
    'GET',
    `https://firebasestorage.googleapis.com/v1beta/projects/${PROJECT_ID}/defaultBucket`,
  );
  logResult('get default storage bucket', getBucket);
  const storageBucket = getBucket.ok ? getBucket.json.name?.split('/').pop() : `${PROJECT_ID}.appspot.com`;
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
}

main().catch((err) => {
  console.error('PROVISIONING FAILED:', err);
  process.exit(1);
});
