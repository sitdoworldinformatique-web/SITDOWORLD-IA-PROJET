import fs from 'fs';

const key = 'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg';

async function main() {
  const res = await fetch('https://api.saspay.me/api/v1/pricing/my-rates/', {
    headers: {
      'Authorization': 'Bearer ' + key,
      'Accept': 'application/json'
    }
  });
  const data = await res.json();
  fs.writeFileSync('scripts/rates.json', JSON.stringify(data, null, 2));
  console.log('Total items in rates:', data.data?.length);

  const payinAvailable = data.data.filter(r => r.payin?.available);
  console.log('Payin available networks count:', payinAvailable.length);

  console.log('\n--- PAYIN AVAILABLE NETWORKS ---');
  for (const r of payinAvailable) {
    console.log(`[${r.country_code}] ${r.country_name} | Network: ${r.network_code} (${r.network_name}) | Currency: ${r.currency} | OTP Req: ${r.payin.otp_required}`);
    if (r.payin.otp_required) {
      console.log(`    OTP Instructions: ${r.payin.otp_instructions}`);
    }
    console.log(`    Tiers: min=${r.payin.tiers?.[0]?.min_amount} max=${r.payin.tiers?.[0]?.max_amount} fee=${r.payin.tiers?.[0]?.percent}%`);
  }
}

main().catch(console.error);
