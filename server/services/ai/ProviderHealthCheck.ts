import { geminiProvider } from './GeminiProvider';
import { aiProviderManager } from './AIProviderManager';
import { loadConfig, maskSecret } from '../../config';
import { supabaseService } from '../supabase';

export interface ComponentHealth {
  status: 'ok' | 'degraded' | 'not_configured' | 'error';
  configured: boolean;
  latencyMs?: number;
  message: string;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  server: 'ok';
  gemini: 'ok' | 'not_configured' | 'error';
  musicProvider: 'ok' | 'not_configured' | 'error';
  database: 'ok' | 'not_configured' | 'error';
  storage: 'ok';
  authentication: 'ok';
  saspay: 'ok' | 'not_configured';
  timestamp: string;
  environment: string;
  components: {
    gemini: ComponentHealth;
    musicProvider: ComponentHealth;
    database: ComponentHealth;
    storage: ComponentHealth;
    authentication: ComponentHealth;
    saspay: ComponentHealth;
  };
}

export class ProviderHealthCheck {
  public static async runFullHealthCheck(): Promise<SystemHealthReport> {
    const config = loadConfig();

    // 1. Check Gemini
    let geminiHealth: ComponentHealth = {
      status: 'not_configured',
      configured: false,
      message: 'GEMINI_API_KEY ou GOOGLE_API_KEY non configurée.',
    };

    if (config.geminiApiKey) {
      try {
        const geminiTest = await geminiProvider.testConnection();
        geminiHealth = {
          status: geminiTest.success ? 'ok' : 'error',
          configured: true,
          latencyMs: geminiTest.latencyMs,
          message: geminiTest.success
            ? 'Connexion Gemini API opérationnelle'
            : (geminiTest.error || 'Erreur Gemini API'),
          details: {
            model: geminiTest.model,
            project: config.googleCloudProject,
          },
        };
      } catch (err: any) {
        geminiHealth = {
          status: 'error',
          configured: true,
          message: err.message,
        };
      }
    }

    // 2. Check Music Provider
    const activeMusicProvider = aiProviderManager.getMusicProvider();
    const isMusicConfigured = activeMusicProvider.isConfigured();

    let musicHealth: ComponentHealth = {
      status: 'not_configured',
      configured: isMusicConfigured,
      message: 'MUSIC PROVIDER NOT CONFIGURED',
      details: {
        providerName: activeMusicProvider.name,
        model: config.musicModel,
      },
    };

    try {
      const musicTest = await activeMusicProvider.testConnection();
      musicHealth = {
        status: musicTest.success ? 'ok' : 'not_configured',
        configured: isMusicConfigured,
        latencyMs: musicTest.latencyMs,
        message: musicTest.message,
        details: {
          providerName: activeMusicProvider.name,
          model: config.musicModel,
          error: musicTest.error,
        },
      };
    } catch (err: any) {
      musicHealth = {
        status: 'error',
        configured: false,
        message: err.message,
      };
    }

    // 3. Storage
    const storageHealth: ComponentHealth = {
      status: 'ok',
      configured: !!config.storageUrl,
      message: config.storageUrl
        ? 'Stockage Cloud Storage connecté'
        : 'Stockage Buffer mémoire & CDN actif (Pas de STORAGE_URL)',
      details: {
        storageType: config.storageUrl ? 'Cloud Storage' : 'In-Memory Stream Buffer',
      },
    };

    // 4. Supabase Database
    const dbStatus = supabaseService.getStatus();
    const databaseHealth: ComponentHealth = {
      status: dbStatus.connected ? 'ok' : 'not_configured',
      configured: dbStatus.connected,
      message: dbStatus.message,
      details: {
        type: dbStatus.type,
        restUrl: dbStatus.restUrl,
        projectRef: dbStatus.projectRef,
        status: dbStatus.status,
      },
    };

    // 5. Authentication
    const authHealth: ComponentHealth = {
      status: 'ok',
      configured: !!config.authSecret,
      message: 'Service d’authentification et RBAC actif',
    };

    // 6. SASPAY Gateway
    const saspayConfigured = !!config.saspayApiKey;
    const saspayHealth: ComponentHealth = {
      status: saspayConfigured ? 'ok' : 'not_configured',
      configured: saspayConfigured,
      message: saspayConfigured
        ? 'Passerelle Mobile Money SASPAY connectée'
        : 'Clé API SASPAY non configurée',
      details: {
        baseUrl: config.saspayBaseUrl,
        maskedKey: maskSecret(config.saspayApiKey),
      },
    };

    return {
      server: 'ok',
      gemini: geminiHealth.status === 'ok' ? 'ok' : geminiHealth.configured ? 'error' : 'not_configured',
      musicProvider: musicHealth.status === 'ok' ? 'ok' : 'not_configured',
      database: dbStatus.connected ? 'ok' : 'not_configured',
      storage: 'ok',
      authentication: 'ok',
      saspay: saspayConfigured ? 'ok' : 'not_configured',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      components: {
        gemini: geminiHealth,
        musicProvider: musicHealth,
        database: databaseHealth,
        storage: storageHealth,
        authentication: authHealth,
        saspay: saspayHealth,
      },
    };
  }
}
