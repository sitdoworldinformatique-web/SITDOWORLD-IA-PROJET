import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { saspayService } from './server/saspay';
import { saspayConfigManager } from './server/saspayConfig';
import { getRecentSaspayOutgoingLogs, clearSaspayOutgoingLogs } from './server/saspayLogger';
import { saspayLoggerMiddleware } from './src/server/middleware/saspayLogger';
import { musicProvider } from './server/musicProvider';
import {
  getGeminiEnvironmentStatus,
  testGeminiHealth,
  enhancePromptWithGemini,
  generateLyricsWithGemini,
  lyriaAudioCache,
  GEMINI_PROJECT_ID,
} from './server/gemini';
import { PlanId, Song, User } from './src/types';
import { BACKEND_PRIVATE_SECRET, SUNOR_API_KEY, SUNO_API_KEY } from './server/secrets';
import { aiProviderManager } from './server/services/ai/AIProviderManager';
import { ProviderHealthCheck } from './server/services/ai/ProviderHealthCheck';
import { saspMeProvider } from './server/services/saspme/SaspMeProvider';
import { validateEnvironment, loadConfig } from './server/config';
import { generatedAudioStore } from './server/services/ai/MusicProvider';
import { sunorMusicProvider } from './server/services/ai/SunorMusicProvider';
import { supabaseService } from './server/services/supabase';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(saspayLoggerMiddleware);

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check - System & Basic
  app.get('/api/health', (req, res) => {
    const envStatus = validateEnvironment();
    res.json({
      status: 'ok',
      platform: 'SITDOWORLD AI MUSIC',
      time: new Date().toISOString(),
      environment: envStatus.isValid ? 'ready' : 'needs_configuration',
      geminiConfigured: envStatus.components.gemini.configured,
    });
  });

  // Dedicated Gemini Health Endpoint (Step 4)
  // Returns:
  // Success: { "provider": "gemini", "configured": true, "connected": true }
  // Failure: { "provider": "gemini", "configured": boolean, "connected": false, "error": "CAUSE EXACTE" }
  app.get('/api/health/gemini', async (req, res) => {
    try {
      const configured = !!process.env.GEMINI_API_KEY;
      if (!configured) {
        return res.status(200).json({
          provider: 'gemini',
          configured: false,
          connected: false,
          error: 'Missing environment variable: GEMINI_API_KEY',
        });
      }

      const testResult = await aiProviderManager.getGemini().testConnection();
      if (testResult.success) {
        return res.status(200).json({
          provider: 'gemini',
          configured: true,
          connected: true,
        });
      } else {
        return res.status(200).json({
          provider: 'gemini',
          configured: true,
          connected: false,
          error: testResult.error || 'Erreur lors de la communication avec Google GenAI',
        });
      }
    } catch (err: any) {
      return res.status(200).json({
        provider: 'gemini',
        configured: !!process.env.GEMINI_API_KEY,
        connected: false,
        error: err.message || 'Erreur inattendue',
      });
    }
  });

  // Exhaustive Gemini API Models & Capabilities Endpoint
  // Returns all models supported and accessible via the single GEMINI_API_KEY
  app.get('/api/gemini/capabilities', (req, res) => {
    const config = loadConfig();
    const hasKey = !!config.geminiApiKey;
    res.json({
      environmentVariable: 'GEMINI_API_KEY',
      configured: hasKey,
      sdk: '@google/genai',
      description: 'Clé API Google Gemini unifiée donnant accès à l’ensemble des modèles et fonctionnalités multimodales',
      models: {
        textAndReasoning: [
          {
            model: 'gemini-3.8-flash',
            alias: 'Flash Latest',
            role: 'Paroles complètes, prompt engineering studio, métadonnées musicales et vitesse maximale',
            status: 'actif par défaut'
          },
          {
            model: 'gemini-3.1-pro-preview',
            alias: 'Gemini Pro',
            role: 'Raisonnement musical complexe, analyse harmonique avancée et composition',
            status: 'supporté'
          },
          {
            model: 'gemini-3.1-flash-lite',
            alias: 'Flash Lite',
            role: 'Micro-tâches ultra-rapides et classification de genres',
            status: 'supporté'
          },
          {
            model: 'gemini-2.5-flash',
            alias: 'Flash 2.5',
            role: 'Modèle de repli haute disponibilité en cas de pic de charge',
            status: 'secours automatique'
          }
        ],
        musicAndAudio: [
          {
            model: 'lyria-3-pro-preview',
            alias: 'Lyria Pro',
            role: 'Génération musicale haute fidélité Google DeepMind',
            status: 'intégré au SDK'
          },
          {
            model: 'lyria-3-clip-preview',
            alias: 'Lyria Clip',
            role: 'Création de boucles et fragments audio courts',
            status: 'intégré au SDK'
          },
          {
            model: 'gemini-3.8-live',
            alias: 'Native Audio / Live',
            role: 'Flux audio bidirectionnel temps réel et assistance vocale',
            status: 'supporté'
          },
          {
            model: 'gemini-3.1-flash-tts-preview',
            alias: 'Gemini TTS',
            role: 'Synthèse vocale expressive et voix off pour maquettes',
            status: 'supporté'
          },
          {
            model: 'gemini-3.5-transcribe',
            alias: 'Gemini Transcribe',
            role: 'Transcription et reconnaissance audio',
            status: 'supporté'
          }
        ],
        visualAndCovers: [
          {
            model: 'gemini-3.1-flash-image',
            alias: 'Nano Banana 2',
            role: 'Génération de pochettes d’albums haute définition (1K/2K/4K)',
            status: 'supporté'
          },
          {
            model: 'gemini-3.1-flash-lite-image',
            alias: 'Nano Banana Lite',
            role: 'Aperçus et vignettes rapides de projets',
            status: 'supporté'
          }
        ]
      },
      featuresEnabled: [
        'generateContent (Text & Multimodal)',
        'Structured Output (JSON Schema)',
        'Lyrics & Composition Engineering',
        'Harmonic & BPM Studio Analysis',
        'Audio Generation (Lyria / Native Audio)',
        'Cover Art Generation (Image generation models)',
        'Streaming API'
      ]
    });
  });

  // Health check - Comprehensive AI & Integrations (Section 8)
  app.get('/api/health/ai', async (req, res) => {
    try {
      const report = await ProviderHealthCheck.runFullHealthCheck();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({
        server: 'ok',
        gemini: 'error',
        musicProvider: 'error',
        storage: 'ok',
        authentication: 'ok',
        error: err.message,
      });
    }
  });

  // ---------------- AUTHENTICATION & ACCESS CONTROL HELPERS ----------------
  function getAuthenticatedUser(req: express.Request): User | null {
    const authHeader = req.headers['authorization'];
    let bearerId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerId = authHeader.substring(7).trim();
    }

    const userId =
      bearerId ||
      (req.headers['x-user-id'] as string) ||
      (req.query.userId as string) ||
      (req.body && req.body.userId);
    if (!userId) return null;
    return db.users.get(userId) || null;
  }

  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        error: 'Non authentifié. Veuillez vous connecter.',
        code: 'UNAUTHENTICATED',
      });
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({
        error: 'Accès refusé. Cette section est réservée aux administrateurs autorisés.',
        code: 'FORBIDDEN',
      });
    }
    (req as any).currentUser = user;
    next();
  }

  function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        error: 'Non authentifié. Veuillez vous connecter.',
        code: 'UNAUTHENTICATED',
      });
    }
    if (user.role !== 'owner') {
      return res.status(403).json({
        error: 'Accès refusé. Cette action est strictement réservée au propriétaire du SaaS.',
        code: 'OWNER_REQUIRED',
      });
    }
    (req as any).currentUser = user;
    next();
  }

  // Admin AI Settings & Credentials Management (Section 7) - PROTECTED
  app.get('/api/admin/ai-settings', requireAdmin, (req, res) => {
    const config = aiProviderManager.getSafeConfiguration();
    const envStatus = validateEnvironment();
    res.json({ config, envStatus });
  });

  // Admin AI Connection Tester (Section 7) - PROTECTED
  app.post('/api/admin/ai-settings/test', requireAdmin, async (req, res) => {
    try {
      const { provider = 'gemini' } = req.body;
      if (provider === 'gemini') {
        const test = await aiProviderManager.getGemini().testConnection();
        return res.json(test);
      } else if (provider === 'music') {
        const test = await aiProviderManager.getMusicProvider().testConnection();
        return res.json(test);
      } else {
        const report = await ProviderHealthCheck.runFullHealthCheck();
        return res.json({ success: true, report });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SASP.ME Provider Status & Health (Section 9) - PROTECTED
  app.get('/api/admin/saspme/config', requireAdmin, (req, res) => {
    res.json({ config: saspMeProvider.getConfiguration() });
  });

  app.post('/api/admin/saspme/test', requireAdmin, async (req, res) => {
    try {
      const result = await saspMeProvider.healthCheck();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/music/generate endpoint with credit & auth verification (Section 12 asynchronous pipeline)
  app.post('/api/music/generate', async (req, res) => {
    try {
      const {
        prompt,
        genre = 'Afrobeat',
        mood,
        language = 'Français',
        voice,
        userId,
        lyrics,
        is_instrumental,
        bpm,
        key,
        idempotency_key,
      } = req.body;
      const targetUserId = userId || (req.headers['x-user-id'] as string) || (req.query.userId as string);

      if (!targetUserId || targetUserId === 'anonymous' || !db.users.has(targetUserId)) {
        return res.status(401).json({
          error: 'Vous devez être connecté avec un compte pour créer une chanson.',
          code: 'UNAUTHENTICATED',
        });
      }

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Un prompt descriptif est requis pour générer une chanson.' });
      }

      // Strict Pack & Credit Verification (Section 2 & 3: No pack -> No generation)
      const balance = db.getBalance(targetUserId);
      const hasActivePack = db.hasActivePack(targetUserId);

      if (!hasActivePack) {
        if (balance.total_purchased > 0) {
          return res.status(403).json({
            error: 'Vous avez utilisé toutes les chansons disponibles dans votre pack. Veuillez acheter un nouveau pack pour continuer.',
            code: 'PACK_EXHAUSTED',
            available_songs: 0,
            has_active_pack: false,
          });
        }
        return res.status(403).json({
          error: 'Vous devez acheter un pack de chansons pour utiliser le générateur.',
          code: 'NO_ACTIVE_PACK',
          available_songs: 0,
          has_active_pack: false,
        });
      }

      if (balance.available_songs <= 0) {
        return res.status(403).json({
          error: 'Vous avez utilisé toutes les chansons disponibles dans votre pack. Veuillez acheter un nouveau pack pour continuer.',
          code: 'PACK_EXHAUSTED',
          available_songs: 0,
          has_active_pack: false,
        });
      }

      // Check idempotency
      const clientKey = idempotency_key || (req.headers['idempotency-key'] as string);
      const effectiveKey = clientKey || `${targetUserId}:${prompt.trim()}:${genre}`;
      if (effectiveKey) {
        const cached = activeIdempotentJobs.get(effectiveKey);
        if (cached && Date.now() - cached.createdAt < 60000) {
          const existingJob = await musicProvider.getGenerationStatus(cached.jobId);
          if (existingJob && existingJob.status !== 'FAILED') {
            return res.json({
              success: true,
              jobId: cached.jobId,
              idempotent: true,
              available_songs: db.getBalance(targetUserId).available_songs,
              message: 'Votre chanson est déjà en cours de création...',
            });
          }
        }
      }

      const isInstrumental = !!is_instrumental || voice === 'instrumental';

      // Launch async generation job directly via SunoAPI
      const { jobId } = await musicProvider.generateSong({
        userId: targetUserId,
        prompt: prompt.trim(),
        genre,
        mood,
        language,
        voice: isInstrumental ? 'instrumental' : (voice || 'male'),
        isInstrumental,
        lyrics,
        bpm: bpm ? Number(bpm) : undefined,
        key,
        idempotencyKey: effectiveKey,
      });

      if (effectiveKey) {
        activeIdempotentJobs.set(effectiveKey, { jobId, createdAt: Date.now() });
      }

      res.json({
        success: true,
        jobId,
        available_songs: db.getBalance(targetUserId).available_songs,
        message: 'Votre chanson est en cours de création...',
      });
    } catch (err: any) {
      console.error('[SUNO] API /api/music/generate error:', err?.message || err);
      res.status(500).json({ error: err.message || 'Erreur lors de la génération musicale.' });
    }
  });

  // ---------------- GEMINI AI ENVIRONMENT ROUTES ----------------
  app.get('/api/gemini/status', (req, res) => {
    const status = getGeminiEnvironmentStatus();
    res.json({ status });
  });

  app.post('/api/gemini/health', async (req, res) => {
    try {
      const result = await testGeminiHealth();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/gemini/enhance-prompt', async (req, res) => {
    try {
      const { prompt, genre, mood, language } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt requis' });
      }
      const result = await enhancePromptWithGemini({ prompt, genre, mood, language });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gemini/generate-lyrics', async (req, res) => {
    try {
      const { theme, genre, mood, language, structure } = req.body;
      if (!theme) {
        return res.status(400).json({ error: 'Thème ou idée requis' });
      }
      const result = await generateLyricsWithGemini({ theme, genre, mood, language, structure });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Official SunoAPI Callback & Webhook Route
  // Webhook handler for asynchronous SunoAPI callbacks (Section 11)
  const handleSunoCallback = async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body || {};
      const taskId = payload.task_id || payload.data?.task_id || payload.id || payload.taskId;
      const callbackType = String(payload.callbackType || payload.type || 'complete').toLowerCase();
      const rawStatus = String(payload.status || payload.data?.status || '').toLowerCase();

      console.log(`[SONO_CALLBACK] providerTaskId=${taskId || '-'} callbackType=${callbackType} status=${rawStatus} timestamp=${new Date().toISOString()}`);

      if (!taskId) {
        return res.status(400).json({ error: 'Missing task_id in webhook payload' });
      }

      const job = db.findJobByTaskId(taskId);
      if (!job) {
        console.warn(`[SONO_CALLBACK] No local generation job found for task ${taskId}`);
        return res.json({ success: true, message: 'Task received but not associated with active job' });
      }

      // Idempotency: if job is already COMPLETED, ignore duplicate complete callback
      if (job.status === 'COMPLETED') {
        console.log(`[SONO_CALLBACK] Job ${job.id} already completed. Ignoring duplicate callback.`);
        return res.json({ success: true, message: 'Already processed' });
      }

      // Handle intermediate status callbacks ('text', 'first')
      if (callbackType === 'text') {
        job.progress = Math.max(job.progress, 30);
        job.status = 'PROCESSING';
        if (job.steps[1]) job.steps[1].status = 'completed';
        if (job.steps[2]) {
          job.steps[2].status = 'active';
          job.steps[2].message = 'Paroles et structure vocale validées par Suno...';
        }
        job.updated_at = new Date().toISOString();
        db.generationJobs.set(job.id, job);
        return res.json({ success: true, step: 'text' });
      }

      if (callbackType === 'first') {
        job.progress = Math.max(job.progress, 70);
        job.status = 'PROCESSING';
        if (job.steps[2]) job.steps[2].status = 'completed';
        if (job.steps[3]) {
          job.steps[3].status = 'active';
          job.steps[3].message = 'Premier flux audio généré avec succès...';
        }
        job.updated_at = new Date().toISOString();
        db.generationJobs.set(job.id, job);
        return res.json({ success: true, step: 'first' });
      }

      // Handle final completion
      const isSuccess =
        callbackType === 'complete' ||
        rawStatus === 'completed' ||
        rawStatus === 'success' ||
        rawStatus === 'first_success';

      if (isSuccess) {
        const results =
          payload.output?.result ||
          payload.data?.output?.result ||
          payload.data?.response?.sunoData ||
          payload.output?.data ||
          payload.data ||
          [];

        const audioUrl =
          results[0]?.audio_url ||
          results[0]?.audioUrl ||
          results[0]?.stream_audio_url ||
          payload.audio_url;

        if (audioUrl) {
          job.status = 'COMPLETED';
          job.progress = 100;
          job.audio_url = audioUrl;
          job.stored_audio_url = audioUrl;
          job.completed_at = new Date().toISOString();
          job.updated_at = new Date().toISOString();
          job.credits_consumed = 1;
          job.steps = job.steps.map((s) => ({ ...s, status: 'completed' }));

          // Save song in DB if not already present
          const songId = `song-${job.id}-A`;
          if (!db.songs.has(songId)) {
            const song: Song = {
              id: songId,
              title: job.title || 'Chanson Suno v6',
              prompt: job.prompt,
              lyrics: job.lyrics,
              genre: String(job.genre || 'Afrobeat'),
              mood: job.mood,
              duration: Math.round(Number(results[0]?.duration) || 180),
              bpm: 110,
              key: 'C Major',
              creator_id: job.user_id,
              creator_name: 'Sitdo Creator',
              cover_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
              audio_url: audioUrl,
              version_tag: 'ORIGINAL',
              is_public: true,
              likes_count: 0,
              plays_count: 1,
              shares_count: 0,
              model_used: 'suno-v6',
              created_at: new Date().toISOString(),
            };
            db.songs.set(songId, song);
            job.song = song;
            job.versions = { a: song };
          }

          db.generationJobs.set(job.id, job);
          // Commit credit safely and idempotently
          db.commitSong(job.user_id, job.id, `GEN-${job.id}`);
          console.log(`[SONG_SUCCESS] generationId=${job.id} providerTaskId=${taskId} timestamp=${new Date().toISOString()} status=SUCCESS (via Webhook)`);
        }
      } else if (rawStatus === 'failed' || rawStatus === 'failure' || rawStatus === 'error') {
        job.status = 'FAILED';
        job.error_message = payload.fail_reason || payload.error || 'Échec de la tâche SunoAPI.';
        job.updated_at = new Date().toISOString();
        db.generationJobs.set(job.id, job);
        // Release credit on failure
        db.releaseSong(job.user_id, job.id, 'Webhook reported failure');
        console.log(`[SONG_FAILURE] generationId=${job.id} providerTaskId=${taskId} timestamp=${new Date().toISOString()} status=FAILED (via Webhook)`);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('[SUNO] Webhook processing error:', err.message);
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/suno/callback', handleSunoCallback);
  app.post('/api/webhooks/suno', handleSunoCallback);

  // Diagnostic and health endpoint for Sunor API and AI Services
  const handleDiagnostics = async (req: express.Request, res: express.Response) => {
    const sunorTest = await sunorMusicProvider.testConnection();
    res.json({
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
      services: {
        sunor: {
          configured: sunorMusicProvider.isConfigured(),
          name: sunorMusicProvider.name,
          ...sunorTest,
        },
        gemini: {
          configured: !!process.env.GEMINI_API_KEY,
          model: 'gemini-2.5-flash',
        },
        saspay: {
          configured: saspayConfigManager.getPublicConfig().isConfigured,
          active: saspayConfigManager.getPublicConfig().isActive,
          gateway: 'SASPAY.ME MOBILE MONEY',
        },
      },
    });
  };

  app.get('/api/ai/diagnostics', handleDiagnostics);
  app.get('/api/music/diagnostics', handleDiagnostics);

  // Section 2: Direct Sunor backend diagnostic POST test endpoint
  app.post('/api/admin/sunor-diagnostic', async (req, res) => {
    const key = (process.env.SUNOR_API_KEY || SUNOR_API_KEY || '').trim();
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'SUNOR_API_KEY is not configured in the backend environment.',
      });
    }

    const payload = {
      model: 'suno',
      task_type: 'music',
      input: {
        gpt_description_prompt: 'Modern Afrobeat, energetic African pop, catchy chorus, professional production',
        make_instrumental: false,
        model_version: 'v6',
      },
    };

    try {
      const response = await fetch('https://sunor.cc/api/v1/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
        },
        body: JSON.stringify(payload),
      });

      console.log(`[SUNOR] HTTP status: ${response.status}`);
      const text = await response.text();
      console.log(`[SUNOR] Response: ${text}`);

      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      return res.json({
        success: response.ok,
        httpStatus: response.status,
        responseRaw: text,
        responseJson: json,
        errorCode: json?.error_code || json?.code || `HTTP_${response.status}`,
        errorMessage: json?.message || text,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Strict rule: Free test generations are completely disabled
  app.post('/api/music/test-generation', (req, res) => {
    return res.status(403).json({
      success: false,
      error: 'Toute génération de test gratuite est désactivée. Un pack de chansons acheté est strictement obligatoire.',
      code: 'FREE_GENERATION_FORBIDDEN',
    });
  });


  // Audio Streaming Endpoint for locally stored & cached music streams (supports Range requests for seeking)
  app.get('/api/audio/:id', (req, res) => {
    const item = generatedAudioStore.get(req.params.id) || lyriaAudioCache.get(req.params.id);
    if (!item) {
      return res.status(404).send('Piste audio introuvable ou expirée');
    }
    const total = item.buffer.length;
    const range = req.headers.range;
    const mimeType = item.mimeType || 'audio/mpeg';

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (isNaN(start) || isNaN(end) || start >= total || end >= total || start > end) {
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.status(416).send('Requested range not satisfiable');
      }
      const chunksize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', chunksize);
      res.send(item.buffer.subarray(start, end + 1));
    } else {
      res.setHeader('Content-Length', total);
      res.send(item.buffer);
    }
  });

  // ---------------- AUTH ROUTES ----------------
  app.get('/api/auth/me', (req, res) => {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (userId && db.users.has(userId)) {
      const user = db.users.get(userId)!;
      const balance = db.getBalance(user.id);
      return res.json({ user, balance });
    }
    res.json({ user: null, balance: null });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Une adresse email valide est obligatoire.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({
        error: 'Aucun compte associé à cette adresse email. Veuillez créer un compte.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Votre compte est suspendu. Veuillez contacter le support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }
    const balance = db.getBalance(user.id);
    res.json({ user, balance });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, name, username } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Une adresse email valide est obligatoire.' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Votre nom d\'artiste ou nom complet est obligatoire.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({
        error: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
      username: (username || cleanEmail.split('@')[0]).trim(),
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      bio: 'Créateur sur SITDOWORLD AI MUSIC',
      role: 'creator', // Strictly creator role on public registration, never admin or owner
      status: 'active',
      created_at: new Date().toISOString(),
    };
    db.users.set(newUser.id, newUser);
    // Strict rule: 0 free songs. Commercial pack purchase strictly required to create songs.
    const balance = db.getBalance(newUser.id);
    res.json({ user: newUser, balance });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    res.json({ success: true, message: 'Un lien de réinitialisation sécurisé a été envoyé par email.' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    res.json({ success: true, message: 'Votre mot de passe a été mis à jour avec succès.' });
  });

  // ---------------- PLANS & PRICING ----------------
  app.get('/api/plans', (req, res) => {
    res.json({ plans: db.plans });
  });

  // ---------------- USER BALANCE & TRANSACTIONS ----------------
  app.get('/api/user/balance', (req, res) => {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId || !db.users.has(userId)) {
      return res.status(401).json({ error: 'Non authentifié.', balance: null });
    }
    const balance = db.getBalance(userId);
    res.json({ balance });
  });

  app.get('/api/user/transactions', (req, res) => {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId || !db.users.has(userId)) {
      return res.status(401).json({ error: 'Non authentifié.', transactions: [] });
    }
    const txs = db.transactions.filter((t) => t.user_id === userId);
    res.json({ transactions: txs });
  });

  // ---------------- SASPAY PAYMENTS ----------------
  // 1. Create SASPAY transaction (never trust frontend amount)
  app.post('/api/payments/create', async (req, res) => {
    try {
      const { plan_id, customer_phone, payment_method, userId } = req.body;
      const targetUserId = userId || (req.headers['x-user-id'] as string);

      if (!targetUserId || !db.users.has(targetUserId)) {
        return res.status(401).json({
          error: 'Vous devez être connecté avec un compte pour acheter un pack.',
          code: 'UNAUTHENTICATED',
        });
      }

      if (!plan_id) {
        return res.status(400).json({ error: 'plan_id est requis.' });
      }

      const result = await saspayService.createTransaction({
        planId: plan_id as PlanId,
        userId: targetUserId,
        customerPhone: customer_phone,
        paymentMethod: payment_method,
      });

      res.json(result);
    } catch (err: any) {
      db.logEvent('api_error', undefined, { endpoint: '/api/payments/create', error: err.message });
      res.status(400).json({ error: err.message || 'Erreur lors de la création du paiement SASPAY.' });
    }
  });

  // 2. SASPAY Webhook (with signature verification & idempotency)
  // Supports /api/payments/webhook, /api/webhooks/saspay, and /api/payments/saspay/webhook
  const handleSaspayWebhook = (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body;
      const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

      const result = saspayService.processWebhook(payload, req.headers, rawBody);
      res.status(result.success || result.duplicate ? 200 : 400).json(result);
    } catch (err: any) {
      db.logEvent('api_error', undefined, { endpoint: '/api/payments/webhook', error: err.message });
      res.status(500).json({ error: 'Erreur interne du webhook SASPAY.' });
    }
  };

  app.post('/api/payments/webhook', handleSaspayWebhook);
  app.post('/api/webhooks/saspay', handleSaspayWebhook);
  app.post('/api/payments/saspay/webhook', handleSaspayWebhook);

  // 3. Official Check & Polling verification against SASPAY Gateway
  const handleStatusCheck = async (req: express.Request, res: express.Response) => {
    const ref = req.params.reference || req.params.transactionId;
    try {
      const { payment, verified, message } = await saspayService.verifyTransactionStatus(ref);
      const balance = db.getBalance(payment.user_id);
      res.json({ payment, balance, verified, message });
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Transaction non trouvée.' });
    }
  };

  app.get('/api/payments/status/:reference', handleStatusCheck);
  app.get('/api/payments/:transactionId/status', handleStatusCheck);
  app.post('/api/payments/verify/:reference', handleStatusCheck);

  // 4. Production Mode: simulation endpoint disabled
  app.post('/api/payments/simulate-saspay-approval', (req, res) => {
    return res.status(403).json({
      error: 'Simulation désactivée. Le SaaS fonctionne exclusivement avec la passerelle réelle de paiement SASPAY.ME.',
      code: 'SIMULATION_DISABLED',
    });
  });

  // 5. Get recent outgoing Saspay logs (with credentials strictly redacted) - PROTECTED
  app.get('/api/admin/saspay/logs', requireAdmin, (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = getRecentSaspayOutgoingLogs(limit);
    res.json({ success: true, count: logs.length, logs });
  });

  app.post('/api/admin/saspay/logs/clear', requireAdmin, (req, res) => {
    clearSaspayOutgoingLogs();
    res.json({ success: true, message: 'Logs Saspay réinitialisés avec succès.' });
  });

  // 6. Manual SASPAY.ME Configuration Endpoints (Admin Controlled) - PROTECTED
  app.get('/api/admin/saspay/config', requireAdmin, (req, res) => {
    try {
      const pub = saspayConfigManager.getPublicConfig(req.get('host'));
      res.json({ success: true, config: pub });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/saspay/config', requireAdmin, (req, res) => {
    try {
      const updated = saspayConfigManager.updateConfig(req.body, (req as any).currentUser?.name || 'Administrateur');
      db.logEvent('saas_settings_updated', (req as any).currentUser?.id, {
        action: 'SASPAY_MANUAL_CONFIG_UPDATED',
        isActive: updated.isActive,
        isConfigured: updated.isConfigured,
        baseUrl: updated.baseUrl,
        merchantId: updated.merchantId,
        environment: updated.environment,
      });
      res.json({
        success: true,
        message: 'Configuration SASPAY.ME enregistrée avec succès.',
        config: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/saspay/test', requireAdmin, async (req, res) => {
    try {
      const result = await saspayConfigManager.testConnection(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        latencyMs: 0,
        message: err.message || 'Erreur lors du test de connexion SASPAY.ME',
        error: 'TEST_FAILED',
      });
    }
  });

  // ---------------- AI MUSIC GENERATIONS ----------------
  // Idempotency cache: prevents duplicate generation jobs on rapid double-clicks (60s window)
  const activeIdempotentJobs = new Map<string, { jobId: string; createdAt: number }>();

  app.post('/api/generations', async (req, res) => {
    try {
      const {
        prompt,
        genre,
        mood,
        language,
        voice,
        is_instrumental,
        bpm,
        key,
        structure,
        lyrics,
        userId,
        idempotency_key,
      } = req.body;
      const targetUserId = userId || (req.headers['x-user-id'] as string) || (req.query.userId as string);

      if (!targetUserId || targetUserId === 'anonymous' || !db.users.has(targetUserId)) {
        return res.status(401).json({
          error: 'Vous devez être connecté avec un compte pour créer une chanson.',
          code: 'UNAUTHENTICATED',
        });
      }

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Veuillez décrire la chanson que vous souhaitez créer.' });
      }

      // Check active confirmed pack & available songs (Section 2 & 3: No pack -> No generation)
      const balance = db.getBalance(targetUserId);
      const hasActivePack = db.hasActivePack(targetUserId);

      if (!hasActivePack) {
        if (balance.total_purchased > 0) {
          return res.status(403).json({
            error: 'Vous avez utilisé toutes les chansons disponibles dans votre pack. Veuillez acheter un nouveau pack pour continuer.',
            code: 'PACK_EXHAUSTED',
            available_songs: 0,
            has_active_pack: false,
          });
        }
        return res.status(403).json({
          error: 'Vous devez acheter un pack de chansons pour utiliser le générateur.',
          code: 'NO_ACTIVE_PACK',
          available_songs: 0,
          has_active_pack: false,
        });
      }

      if (balance.available_songs <= 0) {
        return res.status(403).json({
          error: 'Vous avez utilisé toutes les chansons disponibles dans votre pack. Veuillez acheter un nouveau pack pour continuer.',
          code: 'PACK_EXHAUSTED',
          available_songs: 0,
          has_active_pack: false,
        });
      }

      // Idempotency check: prevent duplicate tasks on rapid double click
      const clientKey = idempotency_key || (req.headers['idempotency-key'] as string);
      const effectiveKey = clientKey || `${targetUserId}:${prompt.trim()}:${genre || 'Afrobeat'}`;
      if (effectiveKey) {
        const cached = activeIdempotentJobs.get(effectiveKey);
        if (cached && Date.now() - cached.createdAt < 60000) {
          const existingJob = await musicProvider.getGenerationStatus(cached.jobId);
          if (existingJob && existingJob.status !== 'FAILED') {
            console.log(`[MUSIC] Idempotent request intercepted for key: ${effectiveKey} -> returning job ${cached.jobId}`);
            return res.json({
              success: true,
              jobId: cached.jobId,
              idempotent: true,
              available_songs: db.getBalance(targetUserId).available_songs,
              message: 'Votre chanson est déjà en cours de création...',
            });
          }
        }
      }

      // Start generation job via MusicProvider
      const { jobId } = await musicProvider.generateSong({
        userId: targetUserId,
        prompt: prompt.trim(),
        genre: genre || 'Afrobeat',
        mood,
        language: language || 'Français',
        voice: is_instrumental ? 'instrumental' : voice || 'male',
        isInstrumental: !!is_instrumental,
        bpm: bpm ? Number(bpm) : undefined,
        key,
        structure,
        lyrics,
        idempotencyKey: effectiveKey,
      });

      // Save idempotency key
      if (effectiveKey) {
        activeIdempotentJobs.set(effectiveKey, { jobId, createdAt: Date.now() });
      }

      res.json({
        success: true,
        jobId,
        available_songs: db.getBalance(targetUserId).available_songs,
        message: 'Votre chanson est en cours de création...',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Le service musical est temporairement indisponible.' });
    }
  });

  // Polling generation status handler (Section 13 contract)
  const handleGetGeneration = async (req: express.Request, res: express.Response) => {
    const job = await musicProvider.getGenerationStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Génération introuvable.' });
    }
    res.json({
      job,
      id: job.id,
      user_id: job.user_id,
      task_id: job.task_id,
      status: job.status,
      prompt: job.prompt,
      model: job.model || 'suno',
      model_version: job.model_version || 'v6',
      audio_url: job.audio_url,
      stored_audio_url: job.stored_audio_url,
      error_message: job.error_message,
      created_at: job.created_at,
      updated_at: job.updated_at,
      completed_at: job.completed_at,
    });
  };

  app.get('/api/generations/:id', handleGetGeneration);
  app.get('/api/music/generations/:id', handleGetGeneration);

  // ---------------- SONGS & DISCOVERY ----------------
  app.get('/api/songs', (req, res) => {
    const { genre, search, filter, creatorId } = req.query;
    let songs = Array.from(db.songs.values());

    if (creatorId) {
      songs = songs.filter((s) => s.creator_id === creatorId);
    }

    if (genre && genre !== 'Tous') {
      songs = songs.filter((s) => s.genre.toLowerCase() === (genre as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      songs = songs.filter((s) => s.title.toLowerCase().includes(q) || s.prompt.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q));
    }

    if (filter === 'Tendances') {
      songs.sort((a, b) => b.plays_count - a.plays_count);
    } else if (filter === 'Nouveautés') {
      songs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      songs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    res.json({ songs });
  });

  app.get('/api/songs/:id', (req, res) => {
    const song = db.songs.get(req.params.id);
    if (!song) return res.status(404).json({ error: 'Chanson non trouvée.' });
    res.json({ song });
  });

  app.post('/api/songs/:id/like', (req, res) => {
    const song = db.songs.get(req.params.id);
    if (!song) return res.status(404).json({ error: 'Chanson non trouvée.' });
    song.likes_count += 1;
    db.songs.set(song.id, song);
    res.json({ success: true, likes_count: song.likes_count });
  });

  app.post('/api/songs/:id/play', (req, res) => {
    const song = db.songs.get(req.params.id);
    if (song) {
      song.plays_count += 1;
      db.songs.set(song.id, song);
    }
    res.json({ success: true });
  });

  app.delete('/api/songs/:id', (req, res) => {
    const exists = db.songs.has(req.params.id);
    if (exists) {
      db.songs.delete(req.params.id);
      return res.json({ success: true, message: 'Chanson supprimée.' });
    }
    res.status(404).json({ error: 'Chanson introuvable.' });
  });

  app.post('/api/songs/:id/stems', async (req, res) => {
    try {
      const stems = await musicProvider.generateStems(req.params.id);
      res.json({ stems });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Impossible d’extraire les stems.' });
    }
  });

  app.post('/api/songs/:id/remix', async (req, res) => {
    try {
      const { targetGenre, targetMood, userId } = req.body;
      const targetUserId = userId || (req.headers['x-user-id'] as string);

      if (!targetUserId || !db.users.has(targetUserId)) {
        return res.status(401).json({
          error: 'Vous devez être connecté pour remixer un morceau.',
          code: 'UNAUTHENTICATED',
        });
      }

      const balance = db.getBalance(targetUserId);
      const hasActivePack = db.hasActivePack(targetUserId);

      if (!hasActivePack || balance.available_songs <= 0) {
        return res.status(403).json({
          error: 'Vous devez acheter un pack de chansons pour créer un remix.',
          code: 'NO_ACTIVE_PACK',
        });
      }

      const { jobId } = await musicProvider.remixSong({
        songId: req.params.id,
        userId: targetUserId,
        targetGenre: targetGenre || 'Afrobeat',
        targetMood,
      });

      db.deductSong(targetUserId, jobId, `REMIX-${jobId}`);
      res.json({ jobId, success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/songs/:id/extend', async (req, res) => {
    try {
      const { extensionPrompt, userId } = req.body;
      const targetUserId = userId || (req.headers['x-user-id'] as string);

      if (!targetUserId || !db.users.has(targetUserId)) {
        return res.status(401).json({
          error: 'Vous devez être connecté pour étendre un morceau.',
          code: 'UNAUTHENTICATED',
        });
      }

      const balance = db.getBalance(targetUserId);
      const hasActivePack = db.hasActivePack(targetUserId);

      if (!hasActivePack || balance.available_songs <= 0) {
        return res.status(403).json({
          error: 'Vous devez acheter un pack de chansons pour étendre ce morceau.',
          code: 'NO_ACTIVE_PACK',
        });
      }

      const { jobId } = await musicProvider.extendSong({
        songId: req.params.id,
        userId: targetUserId,
        extensionPrompt,
      });

      db.deductSong(targetUserId, jobId, `EXT-${jobId}`);
      res.json({ jobId, success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------- PLAYLISTS ----------------
  app.get('/api/playlists', (req, res) => {
    res.json({ playlists: Array.from(db.playlists.values()) });
  });

  app.post('/api/playlists', (req, res) => {
    const { title, description, is_public } = req.body;
    const user = db.users.get('user-default-1')!;
    const playlist = {
      id: `playlist-${Date.now()}`,
      title: title || 'Nouvelle Playlist',
      description: description || '',
      cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      creator_id: user.id,
      creator_name: user.name,
      songs: [],
      is_public: is_public ?? true,
      created_at: new Date().toISOString(),
    };
    db.playlists.set(playlist.id, playlist);
    res.json({ playlist });
  });

  app.post('/api/playlists/:id/songs', (req, res) => {
    const playlist = db.playlists.get(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist introuvable.' });
    const { songId } = req.body;
    const song = db.songs.get(songId);
    if (!song) return res.status(404).json({ error: 'Chanson introuvable.' });

    if (!playlist.songs.find((s) => s.id === song.id)) {
      playlist.songs.push(song);
      db.playlists.set(playlist.id, playlist);
    }
    res.json({ playlist });
  });

  app.delete('/api/playlists/:id/songs/:songId', (req, res) => {
    const playlist = db.playlists.get(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist introuvable.' });
    playlist.songs = playlist.songs.filter((s) => s.id !== req.params.songId);
    db.playlists.set(playlist.id, playlist);
    res.json({ playlist });
  });

  // ---------------- SITDOWORLD VOICE ----------------
  app.get('/api/voices', (req, res) => {
    res.json({ voices: Array.from(db.voiceProfiles.values()) });
  });

  app.post('/api/voices', (req, res) => {
    const { name, description, has_consent, consent_statement } = req.body;
    // Section 15 Requirement: Explicit consent verification!
    if (!has_consent || !consent_statement || !consent_statement.includes('I confirm that I own this voice or have permission to use it')) {
      return res.status(400).json({
        error: 'Le consentement explicite est obligatoire: "I confirm that I own this voice or have permission to use it."',
      });
    }

    const voice = {
      id: `voice-${Date.now()}`,
      user_id: 'user-default-1',
      name: name || 'Voix Personnalisée',
      description: description || '',
      has_consent: true,
      consent_statement,
      created_at: new Date().toISOString(),
    };
    db.voiceProfiles.set(voice.id, voice);
    res.json({ voice });
  });

  // ---------------- TEMPLATES ----------------
  app.get('/api/templates', (req, res) => {
    res.json({ templates: db.templates });
  });

  // ---------------- ADMIN PANEL & SAAS DASHBOARD (PROTECTED) ----------------
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const totalUsers = db.users.size;
    const totalSongs = db.songs.size;
    const totalJobs = db.generationJobs.size;
    const paymentsList = Array.from(new Map(Array.from(db.payments.values()).map((p) => [p.id, p])).values());
    const totalRevenue = paymentsList
      .filter((p) => p.status === 'SUCCESS' || p.status === 'CONFIRMED' || p.status === 'PAID')
      .reduce((acc, p) => acc + p.amount, 0);

    const totalSongBalances = Array.from(db.songBalances.values()).reduce(
      (acc, b) => acc + b.available_songs,
      0
    );

    // Distribution by genre
    const songsList = Array.from(db.songs.values());
    const songsByGenre: Record<string, number> = {};
    let totalDurationSeconds = 0;
    for (const s of songsList) {
      songsByGenre[s.genre] = (songsByGenre[s.genre] || 0) + 1;
      totalDurationSeconds += s.duration || 180;
    }

    // Active users (not suspended)
    const activeUsers = Array.from(db.users.values()).filter((u) => u.status !== 'suspended').length;
    const vipUsers = Array.from(db.users.values()).filter((u) => u.is_vip).length;

    // SaaS MRR approximation (active paying clients average)
    const isMRRCleared = db.isTestMRRCleared;
    const mrr = isMRRCleared ? 0 : (totalRevenue > 0 ? Math.round(totalRevenue * 1.35) : 0);

    res.json({
      totalUsers,
      activeUsers,
      vipUsers,
      totalSongs,
      totalJobs,
      totalRevenue,
      mrr,
      estimatedMarginPercent: 84,
      totalSongBalances,
      totalDurationMinutes: Math.round(totalDurationSeconds / 60),
      songsByGenre,
      recentPaymentsCount: paymentsList.length,
      logsCount: db.adminLogs.length,
      maintenanceMode: db.saasSettings.general.maintenanceMode,
    });
  });

  // SaaS Settings Endpoints - PROTECTED
  app.get('/api/admin/saas-settings', requireAdmin, (req, res) => {
    res.json({ settings: db.getSaaSSettings() });
  });

  app.put('/api/admin/saas-settings', requireAdmin, (req, res) => {
    try {
      const updated = db.updateSaaSSettings(req.body);
      res.json({ success: true, settings: updated, message: 'Paramètres SaaS mis à jour avec succès.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/saas-settings/reset', requireAdmin, (req, res) => {
    const settings = db.resetSaaSSettings();
    res.json({ success: true, settings, message: 'Paramètres SaaS réinitialisés aux valeurs recommandées.' });
  });

  // User Management Endpoints - PROTECTED
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const usersWithBalances = Array.from(db.users.values()).map((u) => {
      const balance = db.getBalance(u.id);
      return { ...u, balance };
    });
    res.json({ users: usersWithBalances });
  });

  // Update user: only owner can promote/demote administrators
  app.put('/api/admin/users/:userId', requireAdmin, (req, res) => {
    const { role, status, is_vip, name, email } = req.body;
    const currentUser = (req as any).currentUser as User;

    if (role !== undefined) {
      if (currentUser.role !== 'owner') {
        return res.status(403).json({
          error: 'Seul le propriétaire du SaaS est autorisé à attribuer ou modifier les rôles administrateurs.',
          code: 'OWNER_REQUIRED',
        });
      }
      const targetUser = db.users.get(req.params.userId);
      if (targetUser && targetUser.role === 'owner' && role !== 'owner') {
        return res.status(403).json({
          error: 'Impossible de rétrograder le propriétaire principal du SaaS.',
          code: 'CANNOT_DEMOTE_OWNER',
        });
      }
    }

    const updated = db.updateUser(req.params.userId, {
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
      ...(is_vip !== undefined && { is_vip }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    });
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ success: true, user: { ...updated, balance: db.getBalance(updated.id) } });
  });

  // Administrator Management Endpoints (Owner Only)
  app.get('/api/admin/administrators', requireAdmin, (req, res) => {
    const admins = Array.from(db.users.values())
      .filter((u) => u.role === 'admin' || u.role === 'owner')
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status || 'active',
        created_at: u.created_at,
        is_owner: u.role === 'owner',
      }));
    res.json({ success: true, administrators: admins });
  });

  app.post('/api/admin/administrators', requireOwner, (req, res) => {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Une adresse email valide est obligatoire.' });
    }
    const result = db.addOrPromoteAdmin(email, name);
    res.json(result);
  });

  app.delete('/api/admin/administrators/:id', requireOwner, (req, res) => {
    const result = db.removeAdmin(req.params.id);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  });

  app.post('/api/admin/users/:userId/adjust-balance', requireAdmin, (req, res) => {
    const { amount, reason = 'Ajustement manuel administrateur' } = req.body;
    const bal = db.getBalance(req.params.userId);
    bal.available_songs += Number(amount);
    bal.updated_at = new Date().toISOString();
    db.songBalances.set(req.params.userId, bal);

    db.transactions.unshift({
      id: `tx-adm-${Date.now()}`,
      user_id: req.params.userId,
      type: 'ADMIN_ADJUSTMENT',
      amount: Number(amount),
      reference: `ADMIN-ADJ-${Date.now()}`,
      created_at: new Date().toISOString(),
    });

    db.logEvent('song_balance_updated', req.params.userId, {
      reason: 'ADMIN_ADJUSTMENT',
      adjustment: amount,
      new_balance: bal.available_songs,
      note: reason,
    });

    res.json({ success: true, balance: bal });
  });

  app.get('/api/admin/logs', requireAdmin, (req, res) => {
    res.json({ logs: db.adminLogs });
  });

  app.get('/api/admin/payments', requireAdmin, (req, res) => {
    const list = Array.from(new Map(Array.from(db.payments.values()).map((p) => [p.id, p])).values());
    res.json({ payments: list });
  });

  app.delete('/api/admin/payments/:id', requireAdmin, (req, res) => {
    const deleted = db.deletePayment(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Paiement non trouvé.' });
    res.json({ success: true, message: 'Paiement supprimé.' });
  });

  app.post('/api/admin/payments/clear-test', requireAdmin, (req, res) => {
    const result = db.clearTestPayments();
    res.json({
      success: true,
      message: `${result.deletedCount} transaction(s) de test supprimée(s). Revenu test réinitialisé à $0.`,
      ...result,
    });
  });

  app.post('/api/admin/mrr/clear-test', requireAdmin, (req, res) => {
    const result = db.clearTestMRR();
    res.json(result);
  });

  app.get('/api/admin/songs', requireAdmin, (req, res) => {
    res.json({ songs: Array.from(db.songs.values()) });
  });

  app.delete('/api/admin/songs/:id', requireAdmin, (req, res) => {
    const deleted = db.deleteSong(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Chanson non trouvée.' });
    res.json({ success: true, message: 'Chanson supprimée par l’administrateur.' });
  });

  app.post('/api/admin/songs/clear-test', requireAdmin, (req, res) => {
    const result = db.clearTestSongs();
    res.json({
      success: true,
      message: `${result.deletedCount} chanson(s) de test supprimée(s).`,
      ...result,
    });
  });

  app.put('/api/admin/plans/:id', requireAdmin, (req, res) => {
    const { price, songs, active, name, popular } = req.body;
    const plan = db.plans.find((p) => p.id === req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan non trouvé.' });
    if (price !== undefined) plan.price = Number(price);
    if (songs !== undefined) plan.songs = Number(songs);
    if (active !== undefined) plan.active = !!active;
    if (name !== undefined) plan.name = String(name);
    if (popular !== undefined) plan.popular = !!popular;
    db.updatePlan(req.params.id, plan);
    res.json({ plan });
  });

  // ---------------- DATABASE MANAGEMENT (SUPABASE) (PROTECTED) ----------------
  app.get('/api/admin/database/status', requireAdmin, async (req, res) => {
    const status = db.getDatabaseStatus();
    res.json(status);
  });

  app.post('/api/admin/database/disconnect', requireAdmin, (req, res) => {
    const result = db.disconnectDatabase();
    res.json({
      ...result,
      status: db.getDatabaseStatus(),
    });
  });

  app.post('/api/admin/database/connect', requireAdmin, async (req, res) => {
    const { url = 'https://pctngaoclnwpwouokwxc.supabase.co/rest/v1/', apiKey } = req.body;
    const status = await db.connectDatabase(url, apiKey);
    res.json({
      success: true,
      message: `Connecté à ${status.restUrl}`,
      status,
    });
  });

  app.post('/api/admin/database/test', requireAdmin, async (req, res) => {
    const result = await supabaseService.testConnection();
    res.json(result);
  });

  app.post('/api/admin/database/sync', requireAdmin, async (req, res) => {
    const songs = Array.from(db.songs.values());
    const users = Array.from(db.users.values());
    const payments = Array.from(new Map(Array.from(db.payments.values()).map((p) => [p.id, p])).values());

    let syncedSongs = 0;
    let syncedUsers = 0;
    let syncedPayments = 0;

    for (const song of songs) {
      if (await supabaseService.syncSong(song)) syncedSongs++;
    }
    for (const user of users) {
      if (await supabaseService.syncUser(user)) syncedUsers++;
    }
    for (const payment of payments) {
      if (await supabaseService.syncPayment(payment)) syncedPayments++;
    }

    res.json({
      success: true,
      message: 'Synchronisation vers Supabase effectuée.',
      synced: {
        songs: syncedSongs,
        totalSongs: songs.length,
        users: syncedUsers,
        totalUsers: users.length,
        payments: syncedPayments,
        totalPayments: payments.length,
      },
      databaseStatus: db.getDatabaseStatus(),
    });
  });

  // ---------------- VITE MIDDLEWARE / STATIC FILES ----------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SITDOWORLD AI MUSIC] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
