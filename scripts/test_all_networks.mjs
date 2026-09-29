const key = 'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg';

async function testAll() {
  const networksToTest = [
    { country: 'CD', net: 'vodacom_cd', curr: 'CDF', amount: '7000.00', phone: '+243812345678' },
    { country: 'CD', net: 'airtel_cd', curr: 'CDF', amount: '7000.00', phone: '+243992345678' },
    { country: 'CI', net: 'mtn_ci', curr: 'XOF', amount: '2000.00', phone: '+2250501234567' },
    { country: 'CI', net: 'wave_ci', curr: 'XOF', amount: '2000.00', phone: '+2250701234567' },
    { country: 'BJ', net: 'mtn_bj', curr: 'XOF', amount: '2000.00', phone: '+22997505050' },
    { country: 'SN', net: 'orange_sn', curr: 'XOF', amount: '2000.00', phone: '+221770123456' },
  ];

  console.log('--- Testing softpay for multiple networks ---');
  for (const n of networksToTest) {
    try {
      const res = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: n.amount,
          currency: n.curr,
          country: n.country,
          description: `Test payment ${n.net}`,
          customer: {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'Client',
            phone: n.phone
          },
          network: n.net
        })
      });
      const data = await res.json().catch(() => ({}));
      console.log(`[${n.country}] ${n.net} -> HTTP ${res.status}:`, JSON.stringify(data));
    } catch(e) {
      console.error(n.net, 'error:', e.message);
    }
  }

  console.log('\n--- Testing checkout-sessions endpoint ---');
  try {
    const res = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: "5.00",
        currency: "USD",
        description: "Pack 50 chansons",
        customer_email: "test@example.com",
        customer_name: "Test Client",
        customer_phone: "+243812345678",
        return_url: "https://example.com/pricing"
      })
    });
    const data = await res.json().catch(() => ({}));
    console.log('Checkout session USD -> HTTP', res.status, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Checkout session error:', e);
  }

  console.log('\n--- Testing checkout-sessions endpoint with XOF ---');
  try {
    const res = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: "3000.00",
        currency: "XOF",
        country: "CI",
        description: "Pack 50 chansons",
        customer_email: "test@example.com",
        customer_name: "Test Client",
        customer_phone: "+2250701234567",
        return_url: "https://example.com/pricing"
      })
    });
    const data = await res.json().catch(() => ({}));
    console.log('Checkout session XOF -> HTTP', res.status, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Checkout session error:', e);
  }
}

testAll();
