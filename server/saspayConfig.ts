/**
 * SITDOWORLD AI MUSIC - SASPAY.ME Manual Configuration & Storage Manager
 *
 * Exclusively handles manual configuration of SASPAY.ME from the admin interface.
 * - Stores credentials securely on server-side
 * - Strictly masks secrets when exposing to frontend
 * - Validates API connection against SASPAY.ME endpoints
 * - Never auto-generates or auto-replaces API keys
 */

import fs from 'fs';
import path from 'path';
import { saspayFetch } from './saspayLogger';

export interface SaspayStoredConfig {
  isActive: boolean;
  apiKey: string;
  secretKey: string;
  merchantId: string;
  baseUrl: string;
  webhookUrl: string;
  webhookSecret: string;
  environment: 'live' | 'sandbox';
  updatedAt: string;
  updatedBy: string;
}

export interface SaspayPublicConfig {
  isActive: boolean;
  isConfigured: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
  hasSecretKey: boolean;
  maskedSecretKey: string;
  merchantId: string;
  baseUrl: string;
  webhookUrl: string;
  hasWebhookSecret: boolean;
  maskedWebhookSecret: string;
  environment: 'live' | 'sandbox';
  updatedAt: string;
  updatedBy: string;
}

export function maskKey(value?: string, visible = 4): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length <= visible * 2) {
    return '••••••••••••••••';
  }
  const start = trimmed.slice(0, visible);
  const end = trimmed.slice(-visible);
  return `${start}••••••••${end}`;
}

const CONFIG_DIR = path.resolve(process.cwd(), 'server', 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'saspay_config.json');

class SaspayConfigManager {
  private config: SaspayStoredConfig;

  constructor() {
    this.config = this.loadInitialConfig();
  }

  private loadInitialConfig(): SaspayStoredConfig {
    // 1. Try loading from persistent file
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            isActive: Boolean(parsed.isActive),
            apiKey: parsed.apiKey || '',
            secretKey: parsed.secretKey || '',
            merchantId: parsed.merchantId || '',
            baseUrl: parsed.baseUrl || 'https://api.saspay.me/api/v1',
            webhookUrl: parsed.webhookUrl || '',
            webhookSecret: parsed.webhookSecret || '',
            environment: parsed.environment === 'sandbox' ? 'sandbox' : 'live',
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            updatedBy: parsed.updatedBy || 'Administrateur',
          };
        }
      }
    } catch (err) {
      console.warn('[SASPAY_CONFIG] Impossible de lire le fichier de configuration existant:', err);
    }

    // 2. Fallback to environment variables IF explicitly set by user, otherwise unconfigured
    const envKey = process.env.SASPAY_API_KEY || '';
    const envSecret = process.env.SASPAY_SECRET_KEY || process.env.SASPAY_SECRET || '';
    const envMerchant = process.env.SASPAY_MERCHANT_ID || '';
    const envBaseUrl = process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1';
    const envWebhookSecret = process.env.SASPAY_WEBHOOK_SECRET || '';

    const isEnvProvided = Boolean(envKey.trim() || envSecret.trim());

    return {
      isActive: isEnvProvided, // only active if explicitly set in env, else inactive
      apiKey: envKey.trim(),
      secretKey: envSecret.trim(),
      merchantId: envMerchant.trim(),
      baseUrl: envBaseUrl.trim().replace(/\/+$/, ''),
      webhookUrl: '',
      webhookSecret: envWebhookSecret.trim(),
      environment: 'live',
      updatedAt: new Date().toISOString(),
      updatedBy: isEnvProvided ? 'Variables d’environnement (.env)' : 'Non configuré',
    };
  }

  private persistConfig(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SASPAY_CONFIG] Erreur écriture configuration:', err);
    }
  }

  public getConfig(): SaspayStoredConfig {
    return { ...this.config };
  }

  public getPublicConfig(serverHost?: string): SaspayPublicConfig {
    const isConfigured = Boolean(
      (this.config.apiKey && this.config.apiKey.trim().length > 0) ||
      (this.config.secretKey && this.config.secretKey.trim().length > 0)
    );

    // Compute standard webhook URL if not manually defined
    let webhookUrl = this.config.webhookUrl;
    if (!webhookUrl && serverHost) {
      const protocol = serverHost.includes('localhost') ? 'http' : 'https';
      webhookUrl = `${protocol}://${serverHost}/api/payments/webhook`;
    }

    return {
      isActive: this.config.isActive,
      isConfigured,
      hasApiKey: Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0),
      maskedApiKey: maskKey(this.config.apiKey),
      hasSecretKey: Boolean(this.config.secretKey && this.config.secretKey.trim().length > 0),
      maskedSecretKey: maskKey(this.config.secretKey),
      merchantId: this.config.merchantId,
      baseUrl: this.config.baseUrl || 'https://api.saspay.me/api/v1',
      webhookUrl: webhookUrl || '/api/payments/webhook',
      hasWebhookSecret: Boolean(this.config.webhookSecret && this.config.webhookSecret.trim().length > 0),
      maskedWebhookSecret: maskKey(this.config.webhookSecret),
      environment: this.config.environment,
      updatedAt: this.config.updatedAt,
      updatedBy: this.config.updatedBy,
    };
  }

  public updateConfig(
    updates: Partial<SaspayStoredConfig>,
    updatedBy: string = 'Administrateur SaaS'
  ): SaspayPublicConfig {
    const current = this.config;

    // Handle apiKey update: only update if provided and not a mask pattern
    let newApiKey = current.apiKey;
    if (typeof updates.apiKey === 'string') {
      const trimmed = updates.apiKey.trim();
      if (trimmed.length > 0 && !trimmed.includes('••••')) {
        newApiKey = trimmed;
      }
    }

    // Handle secretKey update: only update if provided and not a mask pattern
    let newSecretKey = current.secretKey;
    if (typeof updates.secretKey === 'string') {
      const trimmed = updates.secretKey.trim();
      if (trimmed.length > 0 && !trimmed.includes('••••')) {
        newSecretKey = trimmed;
      }
    }

    // Handle webhookSecret update
    let newWebhookSecret = current.webhookSecret;
    if (typeof updates.webhookSecret === 'string') {
      const trimmed = updates.webhookSecret.trim();
      if (trimmed.length > 0 && !trimmed.includes('••••')) {
        newWebhookSecret = trimmed;
      }
    }

    this.config = {
      ...current,
      isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : current.isActive,
      apiKey: newApiKey,
      secretKey: newSecretKey,
      merchantId: typeof updates.merchantId === 'string' ? updates.merchantId.trim() : current.merchantId,
      baseUrl: (updates.baseUrl || current.baseUrl || 'https://api.saspay.me/api/v1').trim().replace(/\/+$/, ''),
      webhookUrl: typeof updates.webhookUrl === 'string' ? updates.webhookUrl.trim() : current.webhookUrl,
      webhookSecret: newWebhookSecret,
      environment: updates.environment === 'sandbox' ? 'sandbox' : 'live',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    this.persistConfig();
    return this.getPublicConfig();
  }

  /**
   * Tests the connection to the SASPAY.ME API with either saved or pending config.
   */
  public async testConnection(override?: {
    apiKey?: string;
    secretKey?: string;
    baseUrl?: string;
  }): Promise<{
    success: boolean;
    httpStatus?: number;
    latencyMs: number;
    message: string;
    details?: any;
    error?: string;
  }> {
    const apiKey = (override?.apiKey && !override.apiKey.includes('••••'))
      ? override.apiKey.trim()
      : this.config.apiKey;

    const secretKey = (override?.secretKey && !override.secretKey.includes('••••'))
      ? override.secretKey.trim()
      : this.config.secretKey;

    const activeToken = secretKey || apiKey;
    const baseUrl = (override?.baseUrl || this.config.baseUrl || 'https://api.saspay.me/api/v1').trim().replace(/\/+$/, '');

    const start = Date.now();

    if (!activeToken) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Impossible de tester : aucune clé API ou clé secrète n’a été renseignée. Saisissez votre clé avant de tester.',
        error: 'CREDENTIALS_MISSING',
      };
    }

    try {
      // SASPAY networks/status probe
      const endpoint = `${baseUrl}/networks/?page_size=1`;
      const res = await saspayFetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(9000),
        label: 'admin_manual_test_connection',
      });

      const latencyMs = Date.now() - start;
      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText.slice(0, 200) };
      }

      if (res.ok) {
        return {
          success: true,
          httpStatus: res.status,
          latencyMs,
          message: `Connexion à l’API SASPAY.ME réussie avec succès (HTTP ${res.status} OK en ${latencyMs}ms). Vos clés d'accès sont valides et reconnues par SASPAY.`,
          details: responseJson,
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          httpStatus: res.status,
          latencyMs,
          message: `Échec d'authentification SASPAY (HTTP ${res.status}) : La clé API ou Clé Secrète renseignée n'est pas reconnue ou a expiré. Veuillez vérifier votre clé sur votre tableau de bord SASPAY.ME.`,
          error: 'AUTHENTICATION_FAILED',
          details: responseJson,
        };
      } else if (res.status === 404) {
        return {
          success: false,
          httpStatus: res.status,
          latencyMs,
          message: `Endpoint introuvable (HTTP 404) : Vérifiez l'URL de base de l'API (${baseUrl}).`,
          error: 'ENDPOINT_NOT_FOUND',
          details: responseJson,
        };
      } else {
        return {
          success: false,
          httpStatus: res.status,
          latencyMs,
          message: `Réponse inattendue de SASPAY (HTTP ${res.status}) : ${responseJson?.detail || responseJson?.message || 'Erreur serveur distant'}.`,
          error: `HTTP_${res.status}`,
          details: responseJson,
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const isTimeout = err.name === 'TimeoutError' || err.message?.includes('aborted');
      return {
        success: false,
        latencyMs,
        message: isTimeout
          ? `Le serveur SASPAY.ME n’a pas répondu dans le délai imparti (${latencyMs}ms). Vérifiez l'URL de l'API et votre connexion internet.`
          : `Erreur réseau lors de la tentative de contact avec SASPAY.ME : ${err.message}`,
        error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      };
    }
  }
}

export const saspayConfigManager = new SaspayConfigManager();
