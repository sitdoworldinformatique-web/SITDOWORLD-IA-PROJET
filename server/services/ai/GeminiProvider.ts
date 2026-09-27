import { GoogleGenAI } from '@google/genai';
import { loadConfig } from '../../config';

export const GEMINI_MODEL = 'gemini-3.8-flash';
export const LYRIA_PRO_MODEL = 'lyria-3-pro-preview';
export const LYRIA_CLIP_MODEL = 'lyria-3-clip-preview';

export class GeminiProvider {
  private client: GoogleGenAI | null = null;
  private currentApiKey: string | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      this.client = null;
      this.currentApiKey = null;
      return null;
    }

    if (this.client && this.currentApiKey === apiKey) {
      return this.client;
    }

    try {
      this.client = new GoogleGenAI({ apiKey });
      this.currentApiKey = apiKey;
      return this.client;
    } catch (err) {
      console.warn('Erreur initialisation GoogleGenAI:', err);
      this.client = null;
      return null;
    }
  }

  public getClient(): GoogleGenAI | null {
    return this.initClient();
  }

  public isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  /**
   * Test connection to Gemini API
   */
  public async testConnection(): Promise<{
    success: boolean;
    latencyMs: number;
    model: string;
    sampleReply?: string;
    error?: string;
  }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        latencyMs: 0,
        model: GEMINI_MODEL,
        error: 'Missing environment variable: GEMINI_API_KEY (ou GOOGLE_API_KEY)',
      };
    }

    const start = Date.now();
    try {
      let usedModel = GEMINI_MODEL;
      let response;
      try {
        response = await client.models.generateContent({
          model: GEMINI_MODEL,
          contents: 'Réponds simplement: OK',
          config: {
            temperature: 0.1,
            maxOutputTokens: 20,
          },
        });
      } catch (firstErr: any) {
        if (firstErr?.message?.includes('503') || firstErr?.message?.includes('high demand') || firstErr?.message?.includes('UNAVAILABLE')) {
          usedModel = 'gemini-2.5-flash';
          response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Réponds simplement: OK',
            config: {
              temperature: 0.1,
              maxOutputTokens: 20,
            },
          });
        } else {
          throw firstErr;
        }
      }

      return {
        success: true,
        latencyMs: Date.now() - start,
        model: usedModel,
        sampleReply: response.text?.trim() || 'Connexion opérationnelle.',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        model: GEMINI_MODEL,
        error: err.message || 'Erreur lors du test de l’API Gemini.',
      };
    }
  }

  /**
   * Generate studio lyrics with verse/chorus structure
   */
  public async generateLyrics(params: {
    theme: string;
    genre: string;
    mood?: string;
    language?: string;
    structures?: string[];
  }): Promise<{ title: string; lyrics: string }> {
    const client = this.getClient();
    const lang = params.language || 'Français';
    const genre = params.genre || 'Afrobeat';

    if (!client) {
      return {
        title: `${genre} Rêve`,
        lyrics: `[Intro]\nSITDOWORLD IA MUSIC\n\n[Couplet 1]\nUne mélodie s'élève dans la nuit\nChaque note donne vie à nos envies\n\n[Refrain]\n${params.theme.slice(0, 60)}\nNos émotions chantent à l'infini\nC'est la magie qui nous unit\n\n[Outro]\nSitdoworld, écoute la vibration...`,
      };
    }

    try {
      const structuresText =
        params.structures && params.structures.length > 0
          ? params.structures.join(', ')
          : 'Intro, Couplet 1, Refrain, Couplet 2, Pont, Refrain, Outro';

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Tu es un parolier et topliner de renommée mondiale pour "SITDOWORLD IA MUSIC".
Rédige des paroles complètes, rythmées et adaptées au genre:
Thème: "${params.theme}"
Genre: ${genre}
Mood: ${params.mood || 'Inspirant'}
Langue: ${lang}
Structure: ${structuresText}

Réponds STRICTEMENT en JSON valide:
{
  "title": "Titre fort et accrocheur",
  "lyrics": "[Intro]\\n...\\n\\n[Couplet 1]\\n...\\n\\n[Refrain]\\n..."
}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        title: parsed.title || `${genre} Story`,
        lyrics: parsed.lyrics || '',
      };
    } catch (err) {
      console.warn('Gemini generateLyrics fallback:', err);
      return {
        title: `${genre} Inspiration`,
        lyrics: `[Intro]\nSITDOWORLD IA MUSIC\n\n[Couplet 1]\nDans le vent doux du matin\nJe trace la route de mon destin\n\n[Refrain]\n${params.theme.slice(0, 60)}\nOn avance ensemble vers la lumière\nNos mélodies traversent les frontières`,
      };
    }
  }

  /**
   * Enhance raw music prompt into a studio description
   */
  public async enhancePrompt(params: {
    prompt: string;
    genre?: string;
    mood?: string;
    language?: string;
  }): Promise<{
    enhancedPrompt: string;
    suggestedBpm: number;
    suggestedKey: string;
    tags: string[];
  }> {
    const client = this.getClient();
    const fallbackBpm = params.genre === 'Amapiano' ? 113 : params.genre === 'Afrobeat' ? 104 : 120;
    const fallbackKey = 'F# Minor';

    if (!client) {
      return {
        enhancedPrompt: `${params.genre || 'Afrobeat'} moderne, arrangements riches, ${params.prompt}, production studio professionnelle.`,
        suggestedBpm: fallbackBpm,
        suggestedKey: fallbackKey,
        tags: [params.genre || 'Afrobeat', params.mood || 'Vibrant', 'Studio'],
      };
    }

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Enrichis cette idée musicale en prompt de production studio précis (instruments, textures, groove, ambiance, mixage):
Idée: "${params.prompt}"
Genre: ${params.genre || 'Afrobeat'}
Mood: ${params.mood || 'Énergique'}
Langue: ${params.language || 'Français'}

Réponds STRICTEMENT en JSON valide:
{
  "enhancedPrompt": "Description studio ultra-détaillée",
  "suggestedBpm": 108,
  "suggestedKey": "G Minor",
  "tags": ["Afrobeat", "Log Drum", "Kora", "Modern Pop"]
}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        enhancedPrompt: parsed.enhancedPrompt || params.prompt,
        suggestedBpm: Number(parsed.suggestedBpm) || fallbackBpm,
        suggestedKey: parsed.suggestedKey || fallbackKey,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [params.genre || 'Afrobeat'],
      };
    } catch (err) {
      return {
        enhancedPrompt: `${params.genre || 'Afrobeat'} studio vibe, ${params.prompt}, sonorités soignées, mix radio moderne.`,
        suggestedBpm: fallbackBpm,
        suggestedKey: fallbackKey,
        tags: [params.genre || 'Afrobeat', 'Studio Quality'],
      };
    }
  }
}

export const geminiProvider = new GeminiProvider();
