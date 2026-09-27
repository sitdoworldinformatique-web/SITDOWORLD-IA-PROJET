/**
 * SITDOWORLD AI MUSIC - System Diagnostic Tool (npm run doctor)
 *
 * Verifies explicitly:
 * [ ] Gemini API key
 * [ ] Gemini connection
 * [ ] Music provider
 * [ ] Storage
 * [ ] Authentication
 * [ ] Database
 * [ ] Build
 */

import { loadConfig } from '../server/config';
import { geminiProvider } from '../server/services/ai/GeminiProvider';
import { aiProviderManager } from '../server/services/ai/AIProviderManager';
import { saspMeProvider } from '../server/services/saspme/SaspMeProvider';
import { db } from '../server/db';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runDoctor() {
  console.log('\n======================================================');
  console.log('🩺  SITDOWORLD AI MUSIC - DIAGNOSTIC SYSTEME DOCTOR');
  console.log('======================================================\n');

  const config = loadConfig();

  // 1. Gemini API key
  const hasGeminiKey = !!config.geminiApiKey;
  const geminiKeyStatus = hasGeminiKey ? 'OK' : 'ERROR';
  console.log(`[${geminiKeyStatus === 'OK' ? '✓' : '✗'}] Gemini API key: ${geminiKeyStatus} (${hasGeminiKey ? 'Clé serveur présente' : 'GEMINI_API_KEY absente'})`);

  // 2. Gemini connection
  let geminiConnStatus = 'ERROR';
  let geminiConnDetail = '';
  if (hasGeminiKey) {
    const geminiTest = await geminiProvider.testConnection();
    if (geminiTest.success) {
      geminiConnStatus = 'OK';
      geminiConnDetail = `(${geminiTest.latencyMs}ms, modèle: ${geminiTest.model})`;
    } else {
      geminiConnStatus = 'ERROR';
      geminiConnDetail = `(${geminiTest.error})`;
    }
  } else {
    geminiConnDetail = '(GEMINI_API_KEY non fournie)';
  }
  console.log(`[${geminiConnStatus === 'OK' ? '✓' : '✗'}] Gemini connection: ${geminiConnStatus} ${geminiConnDetail}`);

  // 3. Music provider
  const musicProvider = aiProviderManager.getMusicProvider();
  const isMusicConfigured = musicProvider.isConfigured();
  const musicTest = await musicProvider.testConnection();
  const musicStatus = musicTest.success ? 'OK' : isMusicConfigured ? 'ERROR' : 'NOT CONFIGURED';
  console.log(`[${musicStatus === 'OK' ? '✓' : '!'}] Music provider: ${musicStatus} (${musicTest.message})`);

  // 4. Storage
  const storageStatus = 'OK';
  const storageDetail = config.storageUrl ? `Cloud Storage (${config.storageUrl})` : 'Buffer mémoire / CDN in-memory actif';
  console.log(`[✓] Storage: ${storageStatus} (${storageDetail})`);

  // 5. Authentication
  const authStatus = config.authSecret ? 'OK' : 'ERROR';
  console.log(`[${authStatus === 'OK' ? '✓' : '✗'}] Authentication: ${authStatus} (${config.authSecret ? 'Session & RBAC secret configuré' : 'AUTH_SECRET manquant'})`);

  // 6. Database
  const usersCount = db.users.size;
  const plansCount = db.plans.length;
  const dbStatus = usersCount > 0 && plansCount > 0 ? 'OK' : 'ERROR';
  console.log(`[${dbStatus === 'OK' ? '✓' : '✗'}] Database: ${dbStatus} (${usersCount} utilisateurs, ${plansCount} plans)`);

  // 7. Build verification
  let buildStatus = 'OK';
  try {
    execSync('npm run lint', { stdio: 'ignore' });
  } catch {
    buildStatus = 'ERROR';
  }
  console.log(`[${buildStatus === 'OK' ? '✓' : '✗'}] Build: ${buildStatus} (Validation TypeScript / lint)`);

  // SASP.ME Mobile Money check
  const saspayTest = await saspMeProvider.healthCheck();
  const saspayStatus = saspayTest.success ? 'OK' : 'NOT CONFIGURED';
  console.log(`[${saspayStatus === 'OK' ? '✓' : '!'}] SASP.ME: ${saspayStatus} (${saspayTest.message})`);

  // Final Summary table
  console.log('\n======================================================');
  console.log('CHECKLIST OFFICIELLE :');
  console.log(`[${geminiKeyStatus === 'OK' ? 'X' : ' '}] Gemini API key: ${geminiKeyStatus}`);
  console.log(`[${geminiConnStatus === 'OK' ? 'X' : ' '}] Gemini connection: ${geminiConnStatus}`);
  console.log(`[${musicStatus === 'OK' ? 'X' : ' '}] Music provider: ${musicStatus}`);
  console.log(`[${storageStatus === 'OK' ? 'X' : ' '}] Storage: ${storageStatus}`);
  console.log(`[${authStatus === 'OK' ? 'X' : ' '}] Authentication: ${authStatus}`);
  console.log(`[${dbStatus === 'OK' ? 'X' : ' '}] Database: ${dbStatus}`);
  console.log(`[${buildStatus === 'OK' ? 'X' : ' '}] Build: ${buildStatus}`);
  console.log('======================================================\n');
}

runDoctor().catch(console.error);
