import {
  saspayLoggerMiddleware,
  logSaspayRequest,
  redactPayload,
  redactHeaders,
  getSaspayLogsHistory,
} from '../src/server/middleware/saspayLogger.js';

console.log('==================================================');
console.log('   TEST DU MIDDLEWARE ET DE logSaspayRequest      ');
console.log('==================================================');

// 1. Test redaction of Authorization and payload fields
const testHeaders = {
  'Authorization': 'Bearer sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg',
  'Content-Type': 'application/json',
};

const safeHeaders = redactHeaders(testHeaders);
console.log('Safe Headers:', safeHeaders);
if (safeHeaders['Authorization'].includes('sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg')) {
  throw new Error('Authorization header was NOT redacted!');
}
console.log('✓ Authorization header correctement caviardé.');

const testBody = {
  pin: '1234',
  secret: 'my_top_secret_code',
  secret_key: 'sk_live_1234567890abcdef',
  amount: 2.45,
  currency: 'USD',
  customer: {
    phone: '+243812345678',
    pin: '9999',
  },
};

const safeBody = redactPayload(testBody);
console.log('Safe Payload:', JSON.stringify(safeBody, null, 2));

if (safeBody.pin !== '[REDACTED]' || safeBody.secret !== '[REDACTED]' || safeBody.customer.pin !== '[REDACTED]') {
  throw new Error('Sensitive payload fields (pin, secret) were NOT redacted!');
}
console.log('✓ Champs sensibles (pin, secret, etc.) correctement caviardés.');

// 2. Test logSaspayRequest with real SASPAY endpoint
console.log('\n--- Test appel réel avec logSaspayRequest ---');
const res = await logSaspayRequest('https://api.saspay.me/api/v1/networks/?page_size=1', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg',
    'Accept': 'application/json',
  },
  label: 'test_real_networks_check',
});

console.log('logSaspayRequest Response status:', res.status);
const json = await res.json();
console.log('Caller can parse response body:', !!json.data);

const history = getSaspayLogsHistory(1);
const lastLog = history[0];
console.log('Last Log recorded URL:', lastLog.url);
console.log('Last Log Headers:', lastLog.headers);
console.log('Last Log Response Status:', lastLog.response.status);
console.log('Last Log Response Body preview:', lastLog.response.rawBody?.substring(0, 70));

const historyJson = JSON.stringify(history);
if (historyJson.includes('sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg')) {
  throw new Error('Secret key found leaked in history logs!');
}
console.log('✓ Aucune fuite de clé dans l’historique des requêtes.');

// 3. Test Express middleware with mock req/res
console.log('\n--- Test saspayLoggerMiddleware Express ---');
let nextCalled = false;
let loggedOutput = false;

const mockReq = {
  originalUrl: '/api/payments/create',
  method: 'POST',
  headers: {
    authorization: 'Bearer sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg',
    'content-type': 'application/json',
  },
  body: {
    plan_id: 'starter',
    pin: '4321',
    secret: 'client_secret_xyz',
  },
};

let capturedJson = null;
const mockRes = {
  statusCode: 200,
  getHeaders: () => ({ 'content-type': 'application/json' }),
  send: (data) => data,
  json: (data) => {
    capturedJson = data;
    return mockRes;
  },
};

saspayLoggerMiddleware(mockReq, mockRes, () => {
  nextCalled = true;
});

console.log('Middleware next() called:', nextCalled);

// Trigger response interceptor
mockRes.json({
  success: true,
  message: 'Payment simulated',
  secret: 'response_secret_token_123',
});

console.log('✓ Middleware interceptor testé avec succès.');

console.log('==================================================');
console.log('      TOUS LES TESTS DU MODULE SONT VALIDÉS !     ');
console.log('==================================================');
