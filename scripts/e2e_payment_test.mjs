import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_SECRET = 'ce1cbaf1598a05c29cb316f2058b3ab793e8626ec44899e733868ff5a0649847';

async function runTests() {
  console.log('====================================================');
  console.log('    TEST SUITE : SASPAY & MOBILE MONEY INTEGRATION   ');
  console.log('====================================================\n');

  // Test 0: Test SasPay Gateway Connection
  console.log('--- TEST 0: Gateway Health Check ---');
  let res = await fetch(`${BASE_URL}/api/admin/saspme/test`, { method: 'POST' });
  let health = await res.json();
  console.log('Gateway Health:', health);
  if (!health.success) throw new Error('Gateway health check failed');

  // Check initial user balance
  const userId = 'user-e2e-test-' + Date.now();
  console.log(`\nTest user: ${userId}`);

  // Test 1: Payment creation for RDC (+243)
  console.log('\n--- TEST 1: Initiate Payment for RDC (+243 81 234 56 78) ---');
  res = await fetch(`${BASE_URL}/api/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: 'starter',
      customer_phone: '+243 81 234 56 78',
      payment_method: 'vodacom_mpesa',
      userId,
    })
  });
  const payment1 = await res.json();
  console.log('Initiate Response:', {
    success: payment1.success,
    ref: payment1.transactionReference,
    status: payment1.status,
    has_checkout_url: !!payment1.checkout_url,
    checkout_url: payment1.checkout_url,
    session_type: payment1.session_type,
    network: payment1.network,
    message: payment1.message,
  });

  const validInitialStatuses = ['PENDING', 'CHECKOUT_REQUIRED', 'PENDING_CUSTOMER_CONFIRMATION', 'PAYMENT_REQUEST_SENT'];
  if (!payment1.success || !validInitialStatuses.includes(payment1.status)) {
    throw new Error(`Test 1 Failed: Status should be one of ${validInitialStatuses.join(', ')}, got ${payment1.status}`);
  }

  // Test 2: Check status before confirmation (MUST NOT CREDIT)
  console.log('\n--- TEST 2: Status check during PENDING (Verification against premature crediting) ---');
  res = await fetch(`${BASE_URL}/api/payments/status/${payment1.transactionReference}`);
  const statusCheck1 = await res.json();
  console.log('Status Check 1:', {
    status: statusCheck1.payment?.status,
    pack_credited: statusCheck1.payment?.pack_credited,
    balance: statusCheck1.balance?.available_songs,
    verified: statusCheck1.verified,
  });
  if (statusCheck1.payment?.pack_credited === true) {
    throw new Error('Test 2 Failed: Pack was credited while still PENDING!');
  }
  const initialBalance = statusCheck1.balance?.available_songs;

  // Test 3: Webhook Confirmation with HMAC SHA256 Signature
  console.log('\n--- TEST 3: Webhook Confirmation with HMAC SHA256 Signature ---');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const webhookBodyObj = {
    event: 'transaction.success',
    data: {
      reference: payment1.transactionReference,
      status: 'SUCCESS',
      amount: payment1.amount,
      currency: payment1.currency,
      provider_transaction_id: payment1.provider_transaction_id,
      timestamp: new Date().toISOString(),
    }
  };
  const rawBody = JSON.stringify(webhookBodyObj);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  res = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-timestamp': timestamp,
    },
    body: rawBody,
  });
  const webhookRes = await res.json();
  console.log('Webhook Response:', webhookRes);
  if (!webhookRes.success) throw new Error('Test 3 Failed: Webhook processing failed');

  // Verify DB state after webhook: must be CONFIRMED and pack_credited === true
  res = await fetch(`${BASE_URL}/api/payments/status/${payment1.transactionReference}`);
  const statusCheck2 = await res.json();
  console.log('Status After Webhook:', {
    status: statusCheck2.payment?.status,
    pack_credited: statusCheck2.payment?.pack_credited,
    songs_credited: statusCheck2.payment?.songs_credited,
    new_balance: statusCheck2.balance?.available_songs,
    added: statusCheck2.balance?.available_songs - initialBalance,
  });
  if (statusCheck2.payment?.status !== 'CONFIRMED' || !statusCheck2.payment?.pack_credited) {
    throw new Error('Test 3 Failed: Payment was not marked CONFIRMED or credited in DB');
  }

  // Test 4: Idempotency Check - Duplicate Webhook Delivery
  console.log('\n--- TEST 4: Idempotency Check (Sending identical webhook again) ---');
  res = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-timestamp': timestamp,
    },
    body: rawBody,
  });
  const duplicateRes = await res.json();
  console.log('Duplicate Webhook Response:', duplicateRes);
  if (!duplicateRes.duplicate) {
    throw new Error('Test 4 Failed: Idempotency check did not catch duplicate!');
  }

  // Verify balance did NOT increase again
  res = await fetch(`${BASE_URL}/api/payments/status/${payment1.transactionReference}`);
  const statusCheck3 = await res.json();
  console.log('Balance after duplicate webhook:', statusCheck3.balance?.available_songs);
  if (statusCheck3.balance?.available_songs !== statusCheck2.balance?.available_songs) {
    throw new Error('Test 4 Failed: Double credit occurred on duplicate webhook!');
  }
  console.log('✓ Idempotency verified: Pack was credited exactly once.');

  // Test 5: Payment with Softpay Push (Côte d\'Ivoire MTN)
  console.log('\n--- TEST 5: Direct Softpay Push for Côte d\'Ivoire MTN (+225 05 01 23 45 67) ---');
  res = await fetch(`${BASE_URL}/api/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: 'starter',
      customer_phone: '+225 05 01 23 45 67',
      payment_method: 'mtn_momo',
      userId: userId + '-ci',
    })
  });
  const payment2 = await res.json();
  console.log('Initiate Softpay Response:', {
    success: payment2.success,
    ref: payment2.transactionReference,
    status: payment2.status,
    has_checkout_url: !!payment2.checkout_url,
    session_type: payment2.session_type,
    instructions: payment2.instructions,
    message: payment2.message,
  });

  console.log('\n====================================================');
  console.log('     TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !       ');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ ERREUR LORS DES TESTS :', err);
  process.exit(1);
});
