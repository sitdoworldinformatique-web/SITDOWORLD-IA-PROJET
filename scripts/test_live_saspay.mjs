const key = 'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg';

async function testAuth() {
  console.log('Testing with key:', key.slice(0, 10) + '...' + key.slice(-4));
  
  const endpoints = [
    'https://api.saspay.me/api/v1/pricing/my-rates/',
    'https://api.saspay.me/api/v1/networks/',
    'https://api.saspay.me/api/v1/webhooks/'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'Authorization': 'Bearer ' + key,
          'Accept': 'application/json'
        }
      });
      console.log(ep, '-> HTTP', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('Result:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(ep, 'error:', e.message);
    }
  }
}
testAuth();
