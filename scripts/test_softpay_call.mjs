const key = 'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg';

async function testSoftpayCall() {
  console.log('Testing softpay payload with USD:');
  const payload1 = {
    amount: "2.50",
    currency: "USD",
    country: "CD",
    description: "Test Pack 20 chansons",
    customer: {
      email: "test@example.com",
      first_name: "Test",
      last_name: "Client",
      phone: "+243812345678"
    },
    network: "orange_cd"
  };

  const res1 = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload1)
  });
  console.log('USD Response HTTP:', res1.status);
  const data1 = await res1.json().catch(() => ({}));
  console.log('USD Response body:', JSON.stringify(data1, null, 2));

  console.log('\nTesting softpay payload with local currency (CDF):');
  const payload2 = {
    amount: "7000.00",
    currency: "CDF",
    country: "CD",
    description: "Test Pack 20 chansons CDF",
    customer: {
      email: "test@example.com",
      first_name: "Test",
      last_name: "Client",
      phone: "+243812345678"
    },
    network: "orange_cd"
  };

  const res2 = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload2)
  });
  console.log('CDF Response HTTP:', res2.status);
  const data2 = await res2.json().catch(() => ({}));
  console.log('CDF Response body:', JSON.stringify(data2, null, 2));
}

testSoftpayCall();
