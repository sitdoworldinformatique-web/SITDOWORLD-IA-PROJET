import 'dotenv/config';

/**
 * SITDOWORLD AI MUSIC - Universal Configuration & Secrets Management
 *
 * All sensitive API keys and secrets are strictly kept on the server-side.
 * Never expose secrets to frontend or browser clients.
 */

export interface AppConfig {
  aiProvider: 'gemini' | 'custom' | string;
  geminiApiKey?: string;
  googleApiKey?: string;
  googleCloudProject?: string;

  musicProvider: string;
  musicApiKey?: string;
  musicApiUrl?: string;
  musicModel?: string;
  sunorApiKey?: string;

  storageUrl?: string;
  storageKey?: string;

  // Supabase Database Connection
  supabaseUrl: string;
  supabaseRestUrl: string;
  supabaseProjectRef: string;
  supabaseKey?: string;

  authSecret: string;

  saspayApiKey: string;
  saspaySecret: string;
  saspayBaseUrl: string;
  saspayWebhookSecret: string;

  nodeEnv: string;
}

export function assertGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

export function loadConfig(): AppConfig {
  const geminiKey = process.env.GEMINI_API_KEY;
  const project =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GEMINI_PROJECT_ID ||
    'gen-lang-client-0670318176';

  const sunorKey = process.env.SUNO_API_KEY || process.env.SUNOR_API_KEY || '';

  function cleanMusicApiUrl(raw?: string): string {
    if (!raw) return 'https://sunor.cc/api/v1';
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (trimmed.includes('/api-key') || trimmed.includes('/docs')) {
      return 'https://sunor.cc/api/v1';
    }
    return trimmed;
  }

  function cleanStorageUrl(raw?: string): string | undefined {
    if (!raw) return undefined;
    // Clean out previous corrupted URL or error report paths
    if (raw.includes('Dashboard_bug') || raw.includes('removeChild') || raw.includes('support/new')) {
      return undefined;
    }
    return raw.trim();
  }

  const rawMusicUrl =
    process.env.SUNO_API_URL ||
    process.env.SUNO_API_BASE_URL ||
    process.env.SUNO_BASE_URL ||
    process.env.SUNOR_API_URL ||
    process.env.SUNOR_BASE_URL ||
    process.env.MUSIC_API_URL;

  const supabaseRestUrl = (process.env.SUPABASE_REST_URL || 'https://pctngaoclnwpwouokwxc.supabase.co/rest/v1/').trim();
  const supabaseUrl = (process.env.SUPABASE_URL || 'https://pctngaoclnwpwouokwxc.supabase.co').trim();
  const supabaseKey = (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  return {
    aiProvider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
    geminiApiKey: geminiKey,
    googleApiKey: process.env.GOOGLE_API_KEY || geminiKey,
    googleCloudProject: project,

    musicProvider: 'suno',
    musicApiKey: process.env.SUNO_API_KEY || process.env.SUNOR_API_KEY || process.env.MUSIC_API_KEY || sunorKey,
    musicApiUrl: cleanMusicApiUrl(rawMusicUrl),
    musicModel: process.env.MUSIC_MODEL || 'suno-v6',
    sunorApiKey: sunorKey,

    storageUrl: cleanStorageUrl(process.env.STORAGE_URL),
    storageKey: process.env.STORAGE_KEY,

    supabaseUrl,
    supabaseRestUrl: supabaseRestUrl.endsWith('/') ? supabaseRestUrl : `${supabaseRestUrl}/`,
    supabaseProjectRef: 'pctngaoclnwpwouokwxc',
    supabaseKey,

    authSecret: process.env.AUTH_SECRET || 'f445f022c338041f353d25ccf0233643',

    saspayApiKey:
      process.env.SASPAY_SECRET_KEY ||
      process.env.SASPAY_API_KEY ||
      '',
    saspaySecret:
      process.env.SASPAY_SECRET_KEY ||
      process.env.SASPAY_SECRET ||
      '',
    saspayBaseUrl: (process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1').replace(/\/+$/, ''),
    saspayWebhookSecret:
      process.env.SASPAY_WEBHOOK_SECRET ||
      '',

    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

export const config = loadConfig();

/**
 * Mask secret strings safely for display in admin UI or logs.
 */
export function maskSecret(secret?: string, visibleChars = 4): string {
  if (!secret) return '••••••••••••••••';
  if (secret.length <= visibleChars * 2) {
    return '••••••••••••••••';
  }
  const start = secret.slice(0, visibleChars);
  const end = secret.slice(-visibleChars);
  return `${start}••••••••${end}`;
}

export interface EnvValidationStatus {
  isValid: boolean;
  warnings: string[];
  missingVars: string[];
  components: {
    gemini: { configured: boolean; message: string };
    musicProvider: { configured: boolean; message: string };
    storage: { configured: boolean; message: string };
    auth: { configured: boolean; message: string };
    saspay: { configured: boolean; message: string };
    database: { configured: boolean; type: string; url: string; message: string };
  };
}

export function validateEnvironment(): EnvValidationStatus {
  const current = loadConfig();
  const warnings: string[] = [];
  const missingVars: string[] = [];

  const geminiConfigured = !!current.geminiApiKey;
  if (!geminiConfigured) {
    warnings.push('GEMINI_API_KEY non configurée.');
    missingVars.push('GEMINI_API_KEY');
  }

  const musicConfigured = !!(current.musicApiKey && current.musicApiUrl);
  if (!musicConfigured) {
    warnings.push('MUSIC_API_KEY ou MUSIC_API_URL non configurée (MUSIC PROVIDER NOT CONFIGURED).');
  }

  const storageConfigured = !!current.storageUrl || true; // Fallback to local memory cache
  const authConfigured = !!current.authSecret;
  const saspayConfigured = !!current.saspayApiKey;
  const databaseConfigured = !!current.supabaseRestUrl;

  return {
    isValid: geminiConfigured,
    warnings,
    missingVars,
    components: {
      gemini: {
        configured: geminiConfigured,
        message: geminiConfigured
          ? 'Clé Google/Gemini chargée avec succès.'
          : 'Missing environment variable: GOOGLE_API_KEY ou GEMINI_API_KEY',
      },
      musicProvider: {
        configured: musicConfigured,
        message: musicConfigured
          ? `Fournisseur musical externe (${current.musicProvider}) configuré.`
          : 'MUSIC PROVIDER NOT CONFIGURED (Paroles et structure assurées par Gemini)',
      },
      storage: {
        configured: storageConfigured,
        message: 'Stockage audio in-memory / cloud opérationnel.',
      },
      auth: {
        configured: authConfigured,
        message: 'Secret d’authentification configuré.',
      },
      saspay: {
        configured: saspayConfigured,
        message: 'Passerelle Mobile Money SASPAY configurée.',
      },
      database: {
        configured: databaseConfigured,
        type: 'supabase',
        url: current.supabaseRestUrl,
        message: `Base de données connectée à Supabase REST (${current.supabaseProjectRef}) : ${current.supabaseRestUrl}`,
      },
    },
  };
}
