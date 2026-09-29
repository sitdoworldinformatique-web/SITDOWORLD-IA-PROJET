import {
  redactString,
  redactHeaders,
  redactSensitiveData,
  redactUrl,
  saspayFetch,
  getRecentSaspayOutgoingLogs,
} from '../server/saspayLogger.js';

console.log('==================================================');
console.log('   TEST DE RÉDACTION ET LOGGING SORTANT SASPAY    ');
console.log('==================================================');

// 1. Test header redaction
const rawHeaders = {
  'Authorization': 'Bearer sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg',
  'Content-Type': 'application/json',
  'X-API-KEY': 'sk_live_secret1234567890abcdef',
  'Idempotency-Key': 'idem-test-123',
};

const safeHeaders = redactHeaders(rawHeaders);
console.log('--> Safe Headers:', JSON.stringify(safeHeaders, null, 2));

const authLeaked = safeHeaders['Authorization'].includes('CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg');
const apiKeyLeaked = safeHeaders['X-API-KEY'].includes('secret1234567890abcdef');

console.log('TEST 1 - Headers Authorization caviardé ?', !authLeaked ? 'OUI (VALIDÉ)' : 'NON (ÉCHEC)');
console.log('TEST 2 - Headers X-API-KEY caviardé ?', !apiKeyLeaked ? 'OUI (VALIDÉ)' : 'NON (ÉCHEC)');

// 2. Test payload redaction
const rawPayload = {
  amount: '14000.00',
  currency: 'CDF',
  api_key: 'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg',
  secret: 'ce1cbaf1598a05c29cb316f2058b3ab793e8626ec44899e733868ff5a0649847',
  customer: {
    first_name: 'Jean',
    phone: '+243890123456',
    pin: '1234',
  },
  note: 'Contact with sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg embedded',
};

const safePayload = redactSensitiveData(rawPayload);
console.log('--> Safe Payload:', JSON.stringify(safePayload, null, 2));

const payloadKeyLeaked = JSON.stringify(safePayload).includes('CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg');
const pinLeaked = safePayload.customer.pin === '1234';

console.log('TEST 3 - Payload clé secrète caviardée ?', !payloadKeyLeaked ? 'OUI (VALIDÉ)' : 'NON (ÉCHEC)');
console.log('TEST 4 - Payload PIN caviardé ?', !pinLeaked ? 'OUI (VALIDÉ)' : 'NON (ÉCHEC)');

// 3. Test URL redaction
const rawUrl = 'https://api.saspay.me/api/v1/payments/?api_key=sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg&status=active';
const safeUrl = redactUrl(rawUrl);
console.log('--> Safe URL:', safeUrl);
const urlLeaked = safeUrl.includes('CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg');
console.log('TEST 5 - URL paramètre secret caviardé ?', !urlLeaked ? 'OUI (VALIDÉ)' : 'NON (ÉCHEC)');

// 4. Test saspayFetch call against Saspay API
console.log('\n--- Test appel HTTP sortant via saspayFetch ---');
try {
  const res = await saspayFetch('https://api.saspay.me/api/v1/networks/?page_size=1', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg',
      'Accept': 'application/json',
    },
    label: 'test_networks_query',
    transactionReference: 'TEST-LOG-001',
  });

  console.log('saspayFetch HTTP Status:', res.status);
  const data = await res.json();
  console.log('Caller received parsed JSON without issue:', !!data);

  const logs = getRecentSaspayOutgoingLogs(5);
  console.log(`Buffer contient ${logs.length} logs.`);
  const lastLog = logs[logs.length - 1];
  console.log('Dernier log enregistré dans le buffer:');
  console.log('- Request URL:', lastLog.request.url);
  console.log('- Request Headers:', lastLog.request.headers);
  console.log('- Response Status:', lastLog.response?.status);
  console.log('- Response Body preview:', lastLog.response?.rawBody?.substring(0, 80));

  const logString = JSON.stringify(lastLog);
  const hasSecretInLogs = logString.includes('sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg');
  console.log('TEST 6 - Aucune fuite de clé secrète dans le buffer de logs ?', !hasSecretInLogs ? 'OUI (VALIDÉ)' : 'NON (ÉCHEC)');
} catch (e) {
  console.error('Erreur test saspayFetch:', e.message);
}

console.log('==================================================');
console.log('               FIN DES TESTS LOGGING              ');
console.log('==================================================');
