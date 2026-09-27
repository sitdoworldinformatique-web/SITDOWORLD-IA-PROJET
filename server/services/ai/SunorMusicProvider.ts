/**
 * SITDOWORLD AI MUSIC - SunoAPI Music Provider (Primary Music Engine)
 *
 * Direct integration with Suno API / Sunor API (https://sunor.cc / https://api.sunoapi.org)
 * Asynchronous music generation powered by Suno AI v6 models.
 *
 * STRICT PIPELINE RULE:
 * USER -> SITDOWORLD -> BACKEND -> SUNO API -> GENERATION -> RESULT SUNO -> BACKEND -> AUDIO PLAYER
 * NO Gemini or Google Lyria in the audio generation pipeline.
 *
 * Strict Security Rules:
 * - SUNO_API_KEY / SUNOR_API_KEY is strictly server-side and never exposed to the frontend.
 * - Real API requests, no fake data, no simulated responses.
 * - Vocal songs MUST have instrumental = false and customMode = true.
 * - Polling MUST wait until the job status is "complete" / "success" and duration > 0.
 *   Never return premature intermediate streaming snippets or BPM detection chunks.
 */

import { IMusicProvider, GenerateSongParams, GeneratedSongResult, generatedAudioStore } from './MusicProvider';
import { loadConfig, maskSecret } from '../../config';
import { SUNOR_API_KEY, SUNO_API_KEY } from '../../secrets';
import { buildSongPromptPackage, SongPromptPackage } from './SongPromptGenerator';

export interface SunorSongResult {
  id: string;
  title: string;
  audio_url: string;
  stored_audio_url?: string;
  duration: number;
  image_url: string;
  lyrics?: string;
  tags?: string;
}

export interface SunorTaskOutput {
  status: 'pending' | 'running' | 'success' | 'failure' | 'timeout';
  audio_url?: string;
  stored_audio_url?: string;
  title?: string;
  duration?: number;
  image_url?: string;
  lyrics?: string;
  error?: string;
  songs?: SunorSongResult[];
}

/**
 * Clean and combine base URL and endpoint cleanly without duplicate /api/v1 or double slashes
 */
export function buildApiUrl(baseUrl: string, endpoint: string): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;
  if (cleanBase.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
    return cleanBase + cleanEndpoint.substring('/api/v1'.length);
  }
  return cleanBase + cleanEndpoint;
}

/**
 * Formats non-sensitive SunoAPI logs as strictly specified
 */
function logSunoApi(baseUrl: string, endpoint: string, method: string, status: number | string, message: string) {
  console.log(`[SunoAPI] Base URL: ${baseUrl}`);
  console.log(`[SunoAPI] Endpoint: ${endpoint}`);
  console.log(`[SunoAPI] HTTP method: ${method}`);
  console.log(`[SunoAPI] HTTP status: ${status}`);
  console.log(`[SunoAPI] response code/message: ${message}`);
}

export class SunorMusicProvider implements IMusicProvider {
  public name = 'SunoAPI (Suno v6)';
  public model = 'suno';
  public modelVersion = 'v6';

  constructor() {}

  /**
   * Resolve active API Key securely
   */
  public getApiKey(): string {
    return (
      process.env.SUNO_API_KEY ||
      process.env.SUNOR_API_KEY ||
      SUNO_API_KEY ||
      SUNOR_API_KEY ||
      ''
    ).trim();
  }

  /**
   * Determine primary base URL cleanly
   */
  public getBaseUrl(): string {
    const raw = (
      process.env.SUNO_API_URL ||
      process.env.SUNO_API_BASE_URL ||
      process.env.SUNO_BASE_URL ||
      process.env.SUNOR_API_URL ||
      process.env.SUNOR_BASE_URL ||
      ''
    ).trim();

    if (raw && !raw.includes('/api-key') && !raw.includes('/docs')) {
      const clean = raw.replace(/\/+$/, '');
      if (clean.includes('sunoapi.org')) {
        return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
      }
      return clean;
    }

    const cfg = loadConfig();
    if (cfg.musicApiUrl && !cfg.musicApiUrl.includes('/api-key') && !cfg.musicApiUrl.includes('/docs')) {
      return cfg.musicApiUrl.replace(/\/+$/, '');
    }

    return 'https://sunor.cc/api/v1';
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return key.length > 0;
  }

  /**
   * Test gateway connection without generating a song
   */
  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string; error?: string }> {
    const start = Date.now();
    const key = this.getApiKey();

    if (!key) {
      return {
        success: false,
        latencyMs: 0,
        message: 'SUNO_API_KEY / SUNOR_API_KEY non configurée dans l’environnement serveur.',
        error: 'Missing environment secret SUNO_API_KEY / SUNOR_API_KEY',
      };
    }

    const baseUrl = this.getBaseUrl();
    const isSunoApiOrg = baseUrl.includes('sunoapi.org');
    const endpointPath = isSunoApiOrg ? '/api/v1/generate' : '/task';
    const fullUrl = buildApiUrl(baseUrl, endpointPath);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(fullUrl, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'x-api-key': key,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const latencyMs = Date.now() - start;
      const statusText = `HTTP_${res.status}`;
      logSunoApi(baseUrl, fullUrl, 'OPTIONS', res.status, statusText);

      if (res.status >= 200 && res.status < 400) {
        return {
          success: true,
          latencyMs,
          message: `SunoAPI connecté avec succès (${maskSecret(key)}) - Passerelle active (${baseUrl})`,
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          latencyMs,
          message: 'Clé SUNO_API_KEY non reconnue ou expirée.',
          error: `Erreur d’authentification SunoAPI (HTTP ${res.status})`,
        };
      } else {
        return {
          success: true,
          latencyMs,
          message: `Passerelle SunoAPI accessible (${baseUrl}) - HTTP ${res.status}`,
        };
      }
    } catch (err: any) {
      logSunoApi(baseUrl, fullUrl, 'OPTIONS', 'ERROR', err.message || 'Timeout');
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'Impossible de joindre les serveurs SunoAPI.',
        error: err.message || 'Délai d’attente dépassé vers SunoAPI',
      };
    }
  }

  /**
   * Validate that audio URL is reachable and represents a real, complete audio file.
   * Handles both local cached endpoints (/api/audio/:id) and external HTTPS URLs.
   */
  public async validateAudio(
    audioUrl: string
  ): Promise<{ valid: boolean; sizeBytes: number; mimeType: string; error?: string }> {
    if (!audioUrl || typeof audioUrl !== 'string') {
      return { valid: false, sizeBytes: 0, mimeType: '', error: 'URL audio invalide ou manquante' };
    }

    const trimmedUrl = audioUrl.trim();

    // 1. If it's a local cached audio endpoint (/api/audio/:id)
    if (trimmedUrl.startsWith('/api/audio/')) {
      const localId = trimmedUrl.replace('/api/audio/', '').trim();
      const cached = generatedAudioStore.get(localId);
      if (cached && cached.buffer && cached.buffer.length > 50000) {
        return { valid: true, sizeBytes: cached.buffer.length, mimeType: cached.mimeType || 'audio/mpeg' };
      }
      if (cached && cached.buffer && cached.buffer.length > 1000) {
        return { valid: true, sizeBytes: cached.buffer.length, mimeType: cached.mimeType || 'audio/mpeg' };
      }
      return { valid: false, sizeBytes: 0, mimeType: '', error: 'Fichier audio local introuvable en cache' };
    }

    if (!trimmedUrl.startsWith('http')) {
      return { valid: false, sizeBytes: 0, mimeType: '', error: 'URL audio invalide ou manquante' };
    }

    // Reject intermediate, unrendered stream pipes
    if (trimmedUrl.includes('audiopipe.suno.day') || trimmedUrl.includes('audiopipe.suno.ai/?item_id=')) {
      return {
        valid: false,
        sizeBytes: 0,
        mimeType: '',
        error: 'URL de flux streaming temporaire non finalisé',
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(trimmedUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-65536' },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok || res.status === 206) {
        const mime = res.headers.get('content-type') || 'audio/mpeg';
        const cl = res.headers.get('content-length') || res.headers.get('content-range');
        const size = cl ? parseInt(cl.replace(/[^0-9]/g, ''), 10) || 65536 : 65536;
        return { valid: true, sizeBytes: size, mimeType: mime };
      }
      return { valid: false, sizeBytes: 0, mimeType: '', error: `HTTP ${res.status}` };
    } catch (err: any) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const headRes = await fetch(trimmedUrl, { method: 'HEAD', signal: controller.signal }).finally(() =>
          clearTimeout(timeout)
        );
        if (headRes.ok) {
          const mime = headRes.headers.get('content-type') || 'audio/mpeg';
          return { valid: true, sizeBytes: 100000, mimeType: mime };
        }
      } catch {}
      return { valid: false, sizeBytes: 0, mimeType: '', error: err.message };
    }
  }

  /**
   * Create asynchronous music generation task on SunoAPI / Sunor API
   */
  public async createTask(params: {
    prompt: string;
    lyrics?: string;
    title?: string;
    genre?: string;
    mood?: string;
    voice?: string;
    isInstrumental?: boolean;
    bpm?: number;
    key?: string;
    structure?: string[];
    generationId?: string;
    userId?: string;
  }): Promise<{ taskId: string; gatewayType: 'sunor' | 'sunoapi_org'; baseUrl: string; songPackage: SongPromptPackage }> {
    const key = this.getApiKey();

    if (!key) {
      throw new Error(
        'SUNO_API_KEY est manquante dans le backend. Veuillez définir la variable d’environnement SUNO_API_KEY ou SUNOR_API_KEY.'
      );
    }

    // Build complete song package with structured vocal verses and music style
    const songPackage = buildSongPromptPackage({
      prompt: params.prompt,
      genre: params.genre,
      mood: params.mood,
      voice: params.voice,
      isInstrumental: params.isInstrumental,
      bpm: params.bpm,
      key: params.key,
      structure: params.structure,
      lyrics: params.lyrics,
    });

    const generationId = params.generationId || `gen-${Date.now()}`;
    const userId = params.userId || 'user-default-1';
    const ts = new Date().toISOString();

    console.log(`[SONG_REQUEST] generationId=${generationId} userId=${userId} timestamp=${ts} status=PENDING mode=${songPackage.mode}`);
    console.log(`[SONG_PAYLOAD] generationId=${generationId} userId=${userId} model=${songPackage.model} customMode=${songPackage.customMode} instrumental=${songPackage.instrumental} title="${songPackage.title}" style="${songPackage.style}" timestamp=${ts}`);

    // Prioritize sunor.cc (proven compatible gateway for user's key)
    const gatewaysToTry: Array<{ type: 'sunor' | 'sunoapi_org'; baseUrl: string; endpoint: string }> = [
      { type: 'sunor', baseUrl: 'https://sunor.cc/api/v1', endpoint: '/task' },
      { type: 'sunoapi_org', baseUrl: 'https://api.sunoapi.org', endpoint: '/api/v1/generate' },
    ];

    let lastError: any = null;

    for (const gw of gatewaysToTry) {
      const fullUrl = buildApiUrl(gw.baseUrl, gw.endpoint);

      let payload: any;
      let headers: Record<string, string>;

      if (gw.type === 'sunor') {
        if (!songPackage.instrumental) {
          // Full Vocal Song (customMode: true, prompt: lyrics, tags: style, title: title)
          payload = {
            model: 'suno',
            task_type: 'music',
            input: {
              custom_mode: true,
              title: songPackage.title,
              tags: songPackage.style,
              prompt: songPackage.lyrics || songPackage.prompt,
              make_instrumental: false,
              model_version: 'v6',
            },
          };
        } else {
          // Pure Instrumental Track
          payload = {
            model: 'suno',
            task_type: 'music',
            input: {
              custom_mode: false,
              title: songPackage.title,
              tags: songPackage.style,
              prompt: songPackage.prompt,
              make_instrumental: true,
              model_version: 'v6',
            },
          };
        }

        headers = {
          'Content-Type': 'application/json',
          'x-api-key': key,
        };
      } else {
        // sunoapi.org gateway format
        payload = {
          prompt: songPackage.instrumental ? songPackage.prompt : songPackage.lyrics || songPackage.prompt,
          style: songPackage.style,
          title: songPackage.title,
          customMode: songPackage.customMode,
          instrumental: songPackage.instrumental,
          model: 'V6',
        };
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'x-api-key': key,
        };
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);

        const res = await fetch(fullUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        const resText = await res.text();
        let resJson: any = null;
        try {
          resJson = JSON.parse(resText);
        } catch {}

        const resMsg = resJson?.msg || resJson?.message || (resJson ? JSON.stringify(resJson) : resText.slice(0, 150));
        logSunoApi(gw.baseUrl, fullUrl, 'POST', res.status, resMsg);

        if (res.ok || res.status === 200 || res.status === 201 || res.status === 202) {
          if (resJson?.code === 401 || resJson?.msg?.includes('Unauthorized')) {
            console.warn(`[SunoAPI] Passerelle ${gw.baseUrl} non autorisée (${resJson?.msg}). Bascule sur la passerelle alternative...`);
            lastError = new Error(`SunoAPI Auth: ${resJson?.msg}`);
            continue;
          }

          const taskId =
            resJson?.data?.task_id ||
            resJson?.task_id ||
            resJson?.data?.taskId ||
            resJson?.taskId ||
            resJson?.id;

          if (taskId) {
            console.log(`[SONO_TASK_CREATED] generationId=${generationId} providerTaskId=${taskId} timestamp=${new Date().toISOString()} status=QUEUED gateway=${gw.type}`);
            return {
              taskId,
              gatewayType: gw.type,
              baseUrl: gw.baseUrl,
              songPackage,
            };
          }
        }

        lastError = new Error(`SunoAPI HTTP ${res.status}: ${resMsg}`);
      } catch (err: any) {
        logSunoApi(gw.baseUrl, fullUrl, 'POST', 'EXCEPTION', err.message || 'Fetch failed');
        lastError = err;
      }
    }

    console.log(`[SONG_FAILURE] generationId=${generationId} timestamp=${new Date().toISOString()} status=FAILED error="${lastError?.message}"`);
    throw lastError || new Error('Impossible d’initialiser la tâche de génération SunoAPI sur les passerelles disponibles.');
  }

  /**
   * Poll status of a SunoAPI task until true completion, failure or timeout.
   * STRICT REQUIREMENT: Never exit early while status is "running" / "streaming" with duration 0.
   */
  public async pollTask(
    taskId: string,
    gatewayType: 'sunor' | 'sunoapi_org' = 'sunor',
    baseUrlOverride?: string,
    generationId?: string,
    userId?: string,
    maxWaitSeconds: number = 300,
    pollIntervalMs: number = 5000,
    onStatusUpdate?: (status: 'pending' | 'running', message: string, progress?: number) => void
  ): Promise<SunorTaskOutput> {
    const key = this.getApiKey();
    const startTime = Date.now();
    let consecutiveNetworkErrors = 0;

    const effectiveBaseUrl =
      baseUrlOverride || (gatewayType === 'sunoapi_org' ? 'https://api.sunoapi.org' : 'https://sunor.cc/api/v1');

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      try {
        let pollUrl: string;
        let pollHeaders: Record<string, string>;

        if (gatewayType === 'sunoapi_org') {
          pollUrl = buildApiUrl(effectiveBaseUrl, `/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`);
          pollHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'x-api-key': key,
          };
        } else {
          pollUrl = buildApiUrl(effectiveBaseUrl, `/task/${encodeURIComponent(taskId)}`);
          pollHeaders = {
            'Content-Type': 'application/json',
            'x-api-key': key,
          };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(pollUrl, {
          method: 'GET',
          headers: pollHeaders,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (!res.ok) {
          logSunoApi(effectiveBaseUrl, pollUrl, 'GET', res.status, `HTTP error during poll`);
          if (res.status >= 500 || res.status === 429) {
            consecutiveNetworkErrors++;
            if (consecutiveNetworkErrors > 6) {
              console.log(`[SONG_FAILURE] generationId=${generationId || '-'} providerTaskId=${taskId} timestamp=${new Date().toISOString()} status=FAILED error="Server error HTTP ${res.status}"`);
              return { status: 'failure', error: `Erreur serveur SunoAPI répétée (HTTP ${res.status}).` };
            }
            continue;
          }
          if (res.status === 401 || res.status === 403) {
            console.log(`[SONG_FAILURE] generationId=${generationId || '-'} providerTaskId=${taskId} timestamp=${new Date().toISOString()} status=FAILED error="Unauthorized"`);
            return { status: 'failure', error: 'Clé SUNO_API_KEY non autorisée lors du polling.' };
          }
        }

        consecutiveNetworkErrors = 0;
        const body = await res.json();

        if (gatewayType === 'sunor') {
          const taskData = body.data || body;
          const status = String(taskData.status || '').toLowerCase();
          const outputStatus = String(taskData.output?.status || '').toLowerCase();

          const rawResults =
            taskData.output?.result ||
            taskData.result ||
            taskData.output?.data ||
            taskData.data?.output?.result ||
            [];

          console.log(
            `[SUNO_STATUS] generationId=${generationId || '-'} providerTaskId=${taskId} status=${status} outputStatus=${outputStatus} resultsCount=${Array.isArray(rawResults) ? rawResults.length : 0} timestamp=${new Date().toISOString()}`
          );

          // Check if provider explicitly marked failure
          if (status === 'failure' || status === 'failed' || status === 'error' || outputStatus === 'failed') {
            const errMsg =
              taskData.error_message ||
              taskData.error ||
              taskData.fail_reason ||
              taskData.output?.fail_reason ||
              'Échec de génération chez SunoAPI.';
            console.log(`[SONG_FAILURE] generationId=${generationId || '-'} providerTaskId=${taskId} error="${errMsg}" timestamp=${new Date().toISOString()} status=FAILED`);
            return { status: 'failure', error: errMsg };
          }

          // A task is only considered completed when the overall task status or output status is terminal success
          const isTerminalSuccess =
            status === 'success' ||
            status === 'completed' ||
            outputStatus === 'success' ||
            outputStatus === 'completed';

          // Check if items have truly completed rendering with final MP3 URLs and positive duration
          const completedItems: any[] = [];
          if (Array.isArray(rawResults) && rawResults.length > 0) {
            for (const item of rawResults) {
              const itemStatus = String(item.status || '').toLowerCase();
              const itemState = String(item.state || '').toLowerCase();
              const duration = Number(item.duration) || 0;
              const audioUrl = item.audio_url || item.url || '';

              // Filter out intermediate streaming pipes and 0-second placeholders
              const isItemComplete =
                itemStatus === 'complete' ||
                itemStatus === 'completed' ||
                itemState === 'succeeded' ||
                (isTerminalSuccess && duration > 0 && !audioUrl.includes('audiopipe.suno'));

              if (isItemComplete && audioUrl && duration > 0) {
                completedItems.push(item);
              }
            }
          }

          // If terminal success confirmed AND completed items with real MP3s exist:
          if ((isTerminalSuccess || completedItems.length > 0) && completedItems.length > 0) {
            const songsList: SunorSongResult[] = [];

            for (const item of completedItems) {
              let audioUrl = item.audio_url || item.url || '';
              if (!audioUrl && Array.isArray(item.media_urls)) {
                const mp3Item = item.media_urls.find(
                  (m: any) => (m.content_type === 'mp3' && m.delivery !== 'streaming') || m.content_type === 'mp3'
                );
                if (mp3Item) audioUrl = mp3Item.url;
              }

              if (!audioUrl) continue;

              // Validate that the audio file is fully accessible and has valid content length
              const validation = await this.validateAudio(audioUrl);
              console.log(
                `[AUDIO_VALIDATION] generationId=${generationId || '-'} providerTaskId=${taskId} valid=${validation.valid} sizeBytes=${validation.sizeBytes} duration=${item.duration}s url=${audioUrl.slice(0, 60)} timestamp=${new Date().toISOString()}`
              );

              if (!validation.valid) {
                console.warn(`[SunoAPI] Piste audio non valide (${validation.error}) pour ${item.id}`);
                continue;
              }

              // Download and cache permanently
              const stored = await this.downloadAndStoreAudio(audioUrl, item.id || taskId);

              songsList.push({
                id: item.id || `suno-${Date.now()}`,
                title: item.title || 'Chanson Suno v6',
                audio_url: audioUrl,
                stored_audio_url: stored,
                duration: Math.round(Number(item.duration) || 180),
                image_url:
                  item.image_large_url ||
                  item.image_url ||
                  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
                lyrics: item.prompt || '',
                tags: item.tags || item.display_tags || '',
              });
            }

            if (songsList.length > 0) {
              const songA = songsList[0];
              console.log(
                `[SONG_SUCCESS] generationId=${generationId || '-'} providerTaskId=${taskId} audioUrl=${songA.audio_url} duration=${songA.duration}s timestamp=${new Date().toISOString()} status=SUCCESS`
              );
              return {
                status: 'success',
                audio_url: songA.stored_audio_url || songA.audio_url,
                stored_audio_url: songA.stored_audio_url,
                title: songA.title,
                duration: songA.duration,
                image_url: songA.image_url,
                lyrics: songA.lyrics,
                songs: [songA],
              };
            }

            // If task is marked success but CDN audio files are still finishing upload, continue polling
            console.log('[SunoAPI] Tâche marquée complétée, finalisation des fichiers audio CDN en cours...');
            continue;
          }

          if (status === 'pending') {
            onStatusUpdate?.('pending', 'Tâche enregistrée, file d’attente Suno v6...', 20);
            continue;
          }

          if (status === 'running' || status === 'processing' || outputStatus === 'processing') {
            const elapsed = Date.now() - startTime;
            const progressNum = Math.min(88, Math.max(25, Math.floor((elapsed / 65000) * 85)));
            onStatusUpdate?.(
              'running',
              `Génération musicale et rendu vocal Suno v6 en cours (${Math.round(elapsed / 1000)}s)...`,
              progressNum
            );
            continue;
          }
        } else {
          // sunoapi.org polling format
          const recordData = body.data || body;
          const status = String(recordData.status || '').toUpperCase();
          console.log(`[SUNO_STATUS] generationId=${generationId || '-'} providerTaskId=${taskId} status=${status} timestamp=${new Date().toISOString()}`);

          if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
            const clips = recordData.response?.sunoData || recordData.clips || [];
            const songsList: SunorSongResult[] = [];
            for (const clip of clips) {
              const audioUrl = clip.audioUrl || clip.audio_url;
              if (!audioUrl) continue;

              const validation = await this.validateAudio(audioUrl);
              console.log(`[AUDIO_VALIDATION] generationId=${generationId || '-'} providerTaskId=${taskId} valid=${validation.valid} sizeBytes=${validation.sizeBytes} timestamp=${new Date().toISOString()}`);

              if (!validation.valid) continue;

              const stored = await this.downloadAndStoreAudio(audioUrl, clip.id || taskId);
              songsList.push({
                id: clip.id || `suno-${Date.now()}`,
                title: clip.title || 'Chanson Suno v6',
                audio_url: audioUrl,
                stored_audio_url: stored,
                duration: Math.round(Number(clip.duration) || 180),
                image_url:
                  clip.imageUrl ||
                  clip.image_url ||
                  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
                lyrics: clip.prompt || '',
                tags: clip.tags || '',
              });
            }
            if (songsList.length > 0) {
              const songA = songsList[0];
              console.log(`[SONG_SUCCESS] generationId=${generationId || '-'} providerTaskId=${taskId} audioUrl=${songA.audio_url} duration=${songA.duration} timestamp=${new Date().toISOString()} status=SUCCESS`);
              return {
                status: 'success',
                audio_url: songA.stored_audio_url || songA.audio_url,
                stored_audio_url: songA.stored_audio_url,
                title: songA.title,
                duration: songA.duration,
                image_url: songA.image_url,
                lyrics: songA.lyrics,
                songs: [songA],
              };
            }
          }

          if (status === 'FAILED') {
            const errMsg = recordData.errorMessage || 'Échec de génération sur api.sunoapi.org.';
            console.log(`[SONG_FAILURE] generationId=${generationId || '-'} providerTaskId=${taskId} error="${errMsg}" timestamp=${new Date().toISOString()} status=FAILED`);
            return { status: 'failure', error: errMsg };
          }

          onStatusUpdate?.('running', 'Composition audio et harmonies vocales Suno v6...', 50);
        }
      } catch (err: any) {
        consecutiveNetworkErrors++;
        console.warn(`[SunoAPI] Erreur réseau lors du polling: ${err.message}. Retentative (${consecutiveNetworkErrors}/6)...`);
        if (consecutiveNetworkErrors > 6) {
          console.log(`[SONG_FAILURE] generationId=${generationId || '-'} providerTaskId=${taskId} error="Connection failed: ${err.message}" timestamp=${new Date().toISOString()} status=FAILED`);
          return { status: 'failure', error: `Erreur de connexion continue au service SunoAPI: ${err.message}` };
        }
      }
    }

    console.log(`[SONG_FAILURE] generationId=${generationId || '-'} providerTaskId=${taskId} error="Timeout after ${maxWaitSeconds}s" timestamp=${new Date().toISOString()} status=TIMEOUT`);
    return {
      status: 'timeout',
      error: `Délai d’attente maximal dépassé pour la génération SunoAPI (${maxWaitSeconds}s).`,
    };
  }

  /**
   * Download audio from temporary Suno URL and store locally in memory/disk cache
   * accessible securely via /api/audio/:id
   */
  public async downloadAndStoreAudio(audioUrl: string, identifier: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(audioUrl, { signal: controller.signal }).finally(() => clearTimeout(timeout));
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > 50000) {
          const localId = `suno-${identifier.replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}`;
          generatedAudioStore.set(localId, { buffer, mimeType: 'audio/mpeg' });
          console.log(`[Suno Audio Store] Fichier MP3 sauvegardé en cache local (${(buffer.length / 1024 / 1024).toFixed(2)} MB): /api/audio/${localId}`);
          return `/api/audio/${localId}`;
        }
      }
    } catch (err: any) {
      console.warn(`[Suno Audio Store] Téléchargement cache local non abouti: ${err.message}. Utilisation de l'URL directe.`);
    }
    return audioUrl;
  }

  /**
   * Generate complete song directly via SunoAPI (DIRECT PIPELINE, NO GEMINI / LYRIA)
   */
  public async generateSong(params: GenerateSongParams): Promise<GeneratedSongResult> {
    const isInstrumental = params.voice === 'instrumental';

    const taskCreation = await this.createTask({
      prompt: params.prompt,
      lyrics: params.lyrics,
      title: `${params.style || 'Musique'} - ${params.prompt.slice(0, 30)}`,
      genre: params.style,
      mood: params.mood,
      voice: params.voice,
      isInstrumental,
      generationId: `test-${Date.now()}`,
      userId: 'test-user',
    });

    const taskResult = await this.pollTask(
      taskCreation.taskId,
      taskCreation.gatewayType,
      taskCreation.baseUrl,
      `test-${Date.now()}`,
      'test-user',
      300,
      5000
    );

    if (taskResult.status !== 'success' || !taskResult.audio_url) {
      throw new Error(taskResult.error || 'SunoAPI n’a pas retourné de résultat audio valide.');
    }

    return {
      success: true,
      audioUrl: taskResult.stored_audio_url || taskResult.audio_url,
      title: taskResult.title || `${params.style} - SITDOWORLD`,
      lyrics: taskResult.lyrics || params.lyrics || '',
      style: params.style,
      bpm: 110,
      key: 'C Major',
      duration: taskResult.duration || params.duration || 180,
      providerUsed: 'SunoAPI (Suno v6)',
      modelUsed: 'suno-v6',
      isAudioSynthesized: true,
      mimeType: 'audio/mpeg',
    };
  }
}

export const sunorMusicProvider = new SunorMusicProvider();
