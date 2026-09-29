import fs from 'fs';

async function main() {
  const res = await fetch('https://saspay.me/assets/index-CQEo5md4.js');
  const text = await res.text();
  fs.writeFileSync('scripts/saspay_bundle.js', text);
  console.log('Saved bundle, size:', text.length);

  // Search for curl or API documentation in text
  const curlMatches = text.match(/curl\s+[^`"'\n\r]+/gi) || [];
  console.log('CURL matches count:', curlMatches.length);
  for (const c of curlMatches) {
    console.log('CURL:', c);
  }

  // Search for http / https endpoints
  const urls = [...new Set(text.match(/https?:\/\/[^\s"'`<>]+/g) || [])];
  console.log('URLs:', urls);

  // Search for keywords
  const keywords = ['endpoint', 'Authorization', 'Bearer', 'sk_live', 'softpay', 'initiate', 'charge', 'push', 'pay/', 'payment', 'api/v1', 'webhook'];
  for (const kw of keywords) {
    let pos = 0;
    let occurrences = 0;
    while ((pos = text.indexOf(kw, pos)) !== -1) {
      occurrences++;
      if (occurrences <= 3) {
        console.log(`[KW: ${kw}]`, text.substring(Math.max(0, pos - 150), Math.min(text.length, pos + 250)).replace(/\n/g, ' '));
      }
      pos += kw.length;
    }
    console.log(`Total '${kw}':`, occurrences);
  }
}

main().catch(console.error);
