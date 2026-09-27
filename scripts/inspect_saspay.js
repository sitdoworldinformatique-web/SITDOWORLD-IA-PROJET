import fetch from 'node-fetch';

async function inspectJs() {
  try {
    const res = await fetch('https://saspay.me/assets/index-D2LyHRHT.js');
    const text = await res.text();
    console.log('JS size:', text.length);

    const urls = [...new Set(text.match(/https?:\/\/[^\s"'`<>]+/g) || [])];
    console.log('URLs:', urls);

    // Look for api endpoints
    const regex = /['"`](\/[a-zA-Z0-9_\-\/]+)['"`]/g;
    const paths = new Set();
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[1].includes('pay') || m[1].includes('v1') || m[1].includes('api') || m[1].includes('doc')) {
        paths.add(m[1]);
      }
    }
    console.log('Paths:', [...paths]);

    // Search for code blocks or curl snippets in the docs
    const curlMatches = text.match(/curl[^\n\r"']+/gi) || [];
    console.log('Curl snippets:', curlMatches.slice(0, 10));

    // Look for snippet around "api.saspay" or "Authorization" or "sk_live"
    const idx = text.indexOf('api.saspay');
    if (idx !== -1) {
      console.log('Context around api.saspay:\n', text.substring(Math.max(0, idx - 200), idx + 400));
    }

    const idx2 = text.indexOf('Authorization');
    if (idx2 !== -1) {
      console.log('Context around Authorization:\n', text.substring(Math.max(0, idx2 - 100), idx2 + 400));
    }
  } catch (e) {
    console.error(e);
  }
}
inspectJs();
