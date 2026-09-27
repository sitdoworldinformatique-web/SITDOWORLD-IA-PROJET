/**
 * SITDOWORLD AI MUSIC - AI Provider Manager
 *
 * Centralized registry and coordinator for:
 * - GeminiProvider (Text, Lyrics, Harmonic analysis, Studio prompt engineering)
 * - MusicProvider (Dedicated Audio Synthesis engine or Unconfigured fallback)
 * - ProviderHealthCheck
 */

import { geminiProvider, GeminiProvider } from './GeminiProvider';
import {
  IMusicProvider,
  ExternalMusicProvider,
  UnconfiguredMusicProvider,
  GenerateSongParams,
  GeneratedSongResult,
} from './MusicProvider';
import { sunorMusicProvider, SunorMusicProvider } from './SunorMusicProvider';
import { ProviderHealthCheck, SystemHealthReport } from './ProviderHealthCheck';
import { loadConfig, maskSecret } from '../../config';

export class AIProviderManager {
  private static instance: AIProviderManager | null = null;
  private musicProviderInstance: IMusicProvider | null = null;

  public static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  public getGemini(): GeminiProvider {
    return geminiProvider;
  }

  public getMusicProvider(): IMusicProvider {
    // SunoAPI is the PRIMARY music provider
    if (sunorMusicProvider.isConfigured()) {
      return sunorMusicProvider;
    }

    const config = loadConfig();
    const hasExternalAudio = !!(config.musicApiKey && config.musicApiUrl);

    if (hasExternalAudio) {
      if (!this.musicProviderInstance || !(this.musicProviderInstance instanceof ExternalMusicProvider)) {
        this.musicProviderInstance = new ExternalMusicProvider();
      }
      return this.musicProviderInstance;
    }

    if (!this.musicProviderInstance || !(this.musicProviderInstance instanceof UnconfiguredMusicProvider)) {
      this.musicProviderInstance = new UnconfiguredMusicProvider();
    }
    return this.musicProviderInstance;
  }


  public async generateFullSong(params: GenerateSongParams): Promise<GeneratedSongResult> {
    const provider = this.getMusicProvider();
    return provider.generateSong(params);
  }

  public async getHealthReport(): Promise<SystemHealthReport> {
    return ProviderHealthCheck.runFullHealthCheck();
  }

  public getSafeConfiguration(): {
    aiProvider: string;
    gemini: {
      configured: boolean;
      maskedKey: string;
      project: string;
      model: string;
    };
    music: {
      provider: string;
      apiUrl: string;
      maskedKey: string;
      model: string;
      configured: boolean;
    };
    storage: {
      type: string;
      configured: boolean;
    };
    saspay: {
      configured: boolean;
      maskedKey: string;
      baseUrl: string;
    };
  } {
    const config = loadConfig();
    const isMusicConfigured = !!(config.musicApiKey && config.musicApiUrl);

    return {
      aiProvider: config.aiProvider,
      gemini: {
        configured: !!config.geminiApiKey,
        maskedKey: maskSecret(config.geminiApiKey),
        project: config.googleCloudProject || 'gen-lang-client-0670318176',
        model: 'gemini-3.8-flash',
      },
      music: {
        provider: isMusicConfigured ? config.musicProvider : 'MUSIC PROVIDER NOT CONFIGURED',
        apiUrl: config.musicApiUrl || '',
        maskedKey: maskSecret(config.musicApiKey),
        model: config.musicModel || 'default-audio-model',
        configured: isMusicConfigured,
      },
      storage: {
        type: config.storageUrl ? 'Cloud Storage' : 'In-Memory Stream Buffer',
        configured: true,
      },
      saspay: {
        configured: !!config.saspayApiKey,
        maskedKey: maskSecret(config.saspayApiKey),
        baseUrl: config.saspayBaseUrl,
      },
    };
  }
}

export const aiProviderManager = AIProviderManager.getInstance();
