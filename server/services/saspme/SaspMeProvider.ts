/**
 * SITDOWORLD AI MUSIC - SASP.ME / SASPAY Payment Integration Provider
 *
 * Provides connection management, health check, transaction routing,
 * and secure webhook processing for Mobile Money (M-Pesa, Orange Money, MTN, Wave).
 * Driven exclusively by manual configuration in SaspayConfigManager.
 */

import { saspayService, SaspayInitiateRequest, SaspayInitiateResponse, SaspayWebhookPayload } from '../../saspay';
import { saspayConfigManager, SaspayPublicConfig } from '../../saspayConfig';

export interface SaspMeConfig {
  apiKey: string;
  baseUrl: string;
  isConnected: boolean;
  webhookUrl: string;
}

export class SaspMeProvider {
  public async connect(): Promise<{ success: boolean; message: string }> {
    saspayConfigManager.updateConfig({ isActive: true });
    const cfg = saspayConfigManager.getConfig();
    return {
      success: true,
      message: `Passerelle SASP.ME activée (${cfg.baseUrl})`,
    };
  }

  public async disconnect(): Promise<{ success: boolean; message: string }> {
    saspayConfigManager.updateConfig({ isActive: false });
    return {
      success: true,
      message: 'Passerelle SASP.ME désactivée',
    };
  }

  public async healthCheck(): Promise<{
    success: boolean;
    latencyMs: number;
    status: string;
    message: string;
    details?: any;
  }> {
    const testResult = await saspayConfigManager.testConnection();
    return {
      success: testResult.success,
      latencyMs: testResult.latencyMs,
      status: testResult.success ? 'active' : 'error',
      message: testResult.message,
      details: testResult.details,
    };
  }

  public getConfiguration(): SaspMeConfig {
    const pub = saspayConfigManager.getPublicConfig();
    return {
      apiKey: pub.maskedApiKey || pub.maskedSecretKey || 'Non configurée',
      baseUrl: pub.baseUrl,
      isConnected: pub.isActive && pub.isConfigured,
      webhookUrl: pub.webhookUrl,
    };
  }

  public async createTransaction(params: SaspayInitiateRequest): Promise<SaspayInitiateResponse> {
    return saspayService.createTransaction(params);
  }

  public processWebhook(
    payload: SaspayWebhookPayload,
    headerSignature?: string
  ): { success: boolean; message: string; duplicate?: boolean } {
    return saspayService.processWebhook(
      payload,
      headerSignature ? { 'x-saspay-signature': headerSignature } : undefined
    );
  }
}

export const saspMeProvider = new SaspMeProvider();
