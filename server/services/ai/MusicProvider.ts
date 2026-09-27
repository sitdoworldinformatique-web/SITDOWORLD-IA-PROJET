/**
 * SITDOWORLD AI MUSIC - Music Provider Architecture
 *
 * Clearly separates:
 * A. Lyrics generation (via Gemini)
 * B. Musical structure & harmonic analysis (BPM, Key, Scale via Gemini)
 * C. Studio prompt engineering (Instruments, arrangement, mixing notes via Gemini)
 * D. Audio/music generation pipeline (Dedicated Music Provider)
 *
 * IMPORTANT: Gemini generates lyrics, harmony, and structural prompts.
 * Audio synthesis is delegated to a dedicated music provider or falls back
 * transparently with explicit notification ("MUSIC PROVIDER NOT CONFIGURED").
 */

import { geminiProvider } from './GeminiProvider';
import { loadConfig } from '../../config';

export interface GenerateSongParams {
  lyrics?: string;
  style: string;
  language?: string;
  voice?: 'male' | 'female' | 'duet' | 'instrumental';
  duration?: number;
  mood?: string;
  instruments?: string[];
  prompt: string;
  userId?: string;
}

export interface GeneratedSongResult {
  success: boolean;
  audioUrl: string;
  audioBase64?: string;
  mimeType?: string;
  title: string;
  lyrics: string;
  style: string;
  bpm: number;
  key: string;
  duration: number;
  providerUsed: string;
  modelUsed: string;
  isAudioSynthesized: boolean;
  notice?: string;
  error?: string;
}

export interface IMusicProvider {
  name: string;
  isConfigured(): boolean;
  generateSong(params: GenerateSongParams): Promise<GeneratedSongResult>;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string; error?: string }>;
}

// In-memory audio stream store for generated tracks
export const generatedAudioStore = new Map<string, { buffer: Buffer; mimeType: string }>();



/**
 * External Dedicated Music Provider
 * Supports Suno, Udio, Stable Audio or custom REST audio endpoints.
 * When MUSIC_API_KEY and MUSIC_API_URL are set, dispatches audio generation.
 */
export class ExternalMusicProvider implements IMusicProvider {
  public name: string;
  private apiUrl?: string;
  private apiKey?: string;
  private model: string;

  constructor() {
    const config = loadConfig();
    this.name = `External Audio Provider (${config.musicProvider})`;
    this.apiUrl = config.musicApiUrl;
    this.apiKey = config.musicApiKey;
    this.model = config.musicModel || 'default-audio-model';
  }

  public isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey);
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string; error?: string }> {
    if (!this.apiUrl || !this.apiKey) {
      return {
        success: false,
        latencyMs: 0,
        message: 'MUSIC PROVIDER NOT CONFIGURED',
        error: 'Aucune clé MUSIC_API_KEY ou URL MUSIC_API_URL configurée.',
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.apiUrl}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      return {
        success: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok
          ? `Moteur musical externe connecté (${this.model})`
          : 'MUSIC PROVIDER NOT CONFIGURED',
        error: res.ok ? undefined : `Fournisseur audio inaccessible (HTTP ${res.status} sur ${this.apiUrl})`,
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'MUSIC PROVIDER NOT CONFIGURED (Échec connexion)',
        error: err.message,
      };
    }
  }

  public async generateSong(params: GenerateSongParams): Promise<GeneratedSongResult> {
    const config = loadConfig();
    const modelToUse = config.musicModel || this.model;

    // STEP A: Lyrics generation via Gemini
    let lyrics = params.lyrics;
    let title = `${params.style} Anthem`;

    if (!lyrics) {
      const lyricsResult = await geminiProvider.generateLyrics({
        theme: params.prompt,
        genre: params.style,
        mood: params.mood,
        language: params.language,
      });
      lyrics = lyricsResult.lyrics;
      title = lyricsResult.title;
    }

    // STEP B: Musical structure (BPM & Key) via Gemini
    const promptEnhance = await geminiProvider.enhancePrompt({
      prompt: params.prompt,
      genre: params.style,
      mood: params.mood,
      language: params.language,
    });

    const bpm = promptEnhance.suggestedBpm;
    const key = promptEnhance.suggestedKey;
    const enhancedPrompt = promptEnhance.enhancedPrompt;

    // STEP C: Studio prompt formulation
    const fullAudioPrompt = `Studio production: ${params.style}. Mood: ${params.mood || 'Vibrant'}. Instruments: ${(
      params.instruments || ['Synth', 'Bass', 'Drums']
    ).join(', ')}. Details: ${enhancedPrompt}`;

    // STEP D: Dedicated Audio Provider synthesis
    if (this.apiUrl && this.apiKey) {
      try {
        const response = await fetch(`${this.apiUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            prompt: fullAudioPrompt,
            lyrics,
            title,
            bpm,
            key,
            style: params.style,
            duration: params.duration || 180,
            model: modelToUse,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioUrl) {
            return {
              success: true,
              audioUrl: data.audioUrl,
              title,
              lyrics,
              style: params.style,
              bpm,
              key,
              duration: params.duration || 180,
              providerUsed: this.name,
              modelUsed: modelToUse,
              isAudioSynthesized: true,
            };
          }
        }
      } catch (err: any) {
        console.warn('Erreur appel fournisseur audio externe:', err.message);
      }
    }

    throw new Error(
      'MUSIC_PROVIDER_UNAVAILABLE : Impossible de synthétiser le fichier audio. Vérifiez la configuration du fournisseur SunoAPI.'
    );
  }
}

/**
 * Default / Fallback Music Provider
 * Used when no external audio synthesis backend is configured.
 * Clearly states MUSIC PROVIDER NOT CONFIGURED while ensuring all SaaS features
 * (paroles, BPM, harmonisation, prompt engineering) remain 100% operational.
 */
export class UnconfiguredMusicProvider implements IMusicProvider {
  public name = 'MUSIC PROVIDER NOT CONFIGURED';

  public isConfigured(): boolean {
    return false;
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string; error?: string }> {
    return {
      success: false,
      latencyMs: 0,
      message: 'MUSIC PROVIDER NOT CONFIGURED',
      error: 'Aucun fournisseur de synthèse audio configuré (Variables MUSIC_API_KEY et MUSIC_API_URL vides).',
    };
  }

  public async generateSong(params: GenerateSongParams): Promise<GeneratedSongResult> {
    throw new Error(
      'MUSIC_PROVIDER_NOT_CONFIGURED: Aucun fournisseur de synthèse audio n\'est actif. Veuillez configurer SUNOR_API_KEY ou SUNO_API_KEY.'
    );
  }
}

