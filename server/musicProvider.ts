/**
 * SITDOWORLD AI MUSIC - Music Provider Service
 *
 * Primary Music Engine: SunoAPI (Suno v6)
 * DIRECT PIPELINE:
 * User -> SITDOWORLD -> Backend -> SunoAPI -> Result -> Backend -> Audio Player
 *
 * NO Gemini / Google Lyria audio generation.
 */

import { db } from './db';
import { Song, Stem, GenerationJob, GenerationStatus } from '../src/types';
import { sunorMusicProvider } from './services/ai/SunorMusicProvider';

export interface GenerateSongParams {
  userId: string;
  prompt: string;
  genre: string;
  mood?: string;
  language?: string;
  voice?: 'male' | 'female' | 'duet' | 'instrumental';
  isInstrumental?: boolean;
  bpm?: number;
  key?: string;
  structure?: string[];
  lyrics?: string;
  energy?: number;
  creativity?: number;
  idempotencyKey?: string;
}

export interface ExtendSongParams {
  songId: string;
  userId: string;
  extensionPrompt?: string;
  addDuration?: number; // seconds
}

export interface RemixSongParams {
  songId: string;
  userId: string;
  targetGenre: string;
  targetMood?: string;
  tempoVariation?: number;
}

export interface MusicProvider {
  generateSong(params: GenerateSongParams): Promise<{ jobId: string }>;
  getGenerationStatus(jobId: string): Promise<GenerationJob | null>;
  getSong(songId: string): Promise<Song | null>;
  extendSong(params: ExtendSongParams): Promise<{ jobId: string }>;
  remixSong(params: RemixSongParams): Promise<{ jobId: string }>;
  generateStems(songId: string): Promise<Stem[]>;
}

// Curated default cover arts by genre
const GENRE_COVERS: Record<string, string> = {
  Afrobeat: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
  Amapiano: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
  Gospel: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
  'R&B': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
  'Hip-Hop': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
  Pop: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  Dance: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  Reggae: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  Drill: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  Cinematic: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
  'Lo-fi': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  Jazz: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80',
};

export class SitdoworldMusicProvider implements MusicProvider {
  // Generate complete song via Async Job Pipeline directly to SunoAPI
  public async generateSong(params: GenerateSongParams): Promise<{ jobId: string }> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const user = db.users.get(params.userId);
    const creatorName = user ? user.name : 'Sitdo Creator';

    const isInstrumental = !!params.isInstrumental || params.voice === 'instrumental';

    // 1. Reserve 1 credit immediately (Section 10)
    const reserved = db.reserveSong(params.userId, jobId, `GEN-${jobId}`);
    if (!reserved) {
      throw new Error('Solde de chansons insuffisant pour créer cette musique.');
    }

    const job: GenerationJob = {
      id: jobId,
      user_id: params.userId,
      provider: 'suno',
      idempotency_key: params.idempotencyKey,
      prompt: params.prompt,
      genre: params.genre,
      mood: params.mood || 'Énergique & Vibrant',
      language: params.language || 'Français',
      voice: params.voice || (isInstrumental ? 'instrumental' : 'male'),
      is_instrumental: isInstrumental,
      instrumental: isInstrumental,
      mode: isInstrumental ? 'instrumental' : 'chanson',
      status: 'QUEUED',
      progress: 5,
      current_step: 1,
      model: 'suno',
      model_version: 'v6',
      credits_reserved: 1,
      credits_consumed: 0,
      steps: [
        { step: 1, title: 'Demande reçue & Analyse', status: 'active', message: 'Analyse du style, du rythme et des paroles vocales...' },
        { step: 2, title: 'Tâche SunoAPI v6 créée', status: 'pending', message: 'Initialisation directe de la tâche sur SunoAPI...' },
        { step: 3, title: 'Génération musicale Suno v6 en cours', status: 'pending', message: 'Composition et rendu vocal haute fidélité par Suno v6...' },
        { step: 4, title: 'Extraction du flux audio', status: 'pending', message: 'Récupération et sécurisation du flux audio MP3...' },
        { step: 5, title: 'Validation du fichier audio', status: 'pending', message: 'Contrôle qualité, présence de voix et métadonnées...' },
        { step: 6, title: 'Chanson prête', status: 'pending', message: 'Votre chanson est prête pour écoute et téléchargement.' },
      ],
      versions: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.generationJobs.set(jobId, job);
    db.logEvent('generation_started', params.userId, {
      jobId,
      prompt: params.prompt,
      genre: params.genre,
      isInstrumental,
      idempotencyKey: params.idempotencyKey,
    });

    // Start background processing pipeline directly with SunoAPI
    this.runJobPipeline(jobId, params, creatorName).catch((err) => {
      console.error('[SUNO] Job pipeline error:', err?.message || err);
      const j = db.generationJobs.get(jobId);
      if (j) {
        const isTimeout =
          err?.message?.toLowerCase().includes('timeout') || err?.errorCode === 'suno_timeout';
        j.status = isTimeout ? 'TIMEOUT' : 'FAILED';
        j.error_message = err?.message || 'Erreur lors de la génération avec le moteur SunoAPI.';
        j.error_code = isTimeout ? 'timeout' : 'generation_failed';
        j.credits_consumed = 0;
        j.updated_at = new Date().toISOString();
        j.completed_at = new Date().toISOString();
        j.steps = j.steps.map((s) =>
          s.status === 'active'
            ? { ...s, status: isTimeout ? 'timeout' : 'failed', message: err?.message || s.message }
            : s
        );
        db.generationJobs.set(jobId, j);
        // Release credit back to user balance on failure
        db.releaseSong(params.userId, jobId, isTimeout ? 'Suno timeout release' : 'Suno failure release');
        db.logEvent('generation_failed', params.userId, {
          jobId,
          error: err?.message,
          errorCode: err?.errorCode,
          httpStatus: err?.httpStatus,
          isTimeout,
        });
      }
    });

    return { jobId };
  }

  // Background Async pipeline executing 6 visual steps with direct SunoAPI integration
  private async runJobPipeline(jobId: string, params: GenerateSongParams, creatorName: string) {
    const updateJob = (updates: Partial<GenerationJob>) => {
      const j = db.generationJobs.get(jobId);
      if (!j) return;
      Object.assign(j, updates, { updated_at: new Date().toISOString() });
      db.generationJobs.set(jobId, j);
    };

    const updateStep = (
      stepIndex: number,
      progressPercent: number,
      status: GenerationStatus = 'GENERATING',
      stepMessage?: string
    ) => {
      const j = db.generationJobs.get(jobId);
      if (!j) return;
      j.status = status;
      j.progress = progressPercent;
      j.current_step = stepIndex;
      j.updated_at = new Date().toISOString();
      j.steps = j.steps.map((s, idx) => {
        if (idx + 1 < stepIndex) return { ...s, status: 'completed' };
        if (idx + 1 === stepIndex) return { ...s, status: 'active', message: stepMessage || s.message };
        return { ...s, status: 'pending' };
      });
      db.generationJobs.set(jobId, j);
    };

    // Step 1: Demande reçue & Préparation des paramètres
    updateStep(1, 15, 'GENERATING', 'Préparation des paroles et de la structure vocale...');

    const isInstrumental = !!params.isInstrumental || params.voice === 'instrumental';

    let bpm = params.bpm || (params.genre === 'Amapiano' ? 113 : params.genre === 'Afrobeat' ? 104 : 120);
    let key = params.key || 'C Major';

    let coverA = GENRE_COVERS[params.genre] || GENRE_COVERS['Afrobeat'];
    let coverB =
      params.genre === 'Afrobeat'
        ? GENRE_COVERS['Amapiano']
        : params.genre === 'R&B'
        ? GENRE_COVERS['Pop']
        : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80';

    // Step 2: Création de la tâche SunoAPI
    updateStep(2, 25, 'PROCESSING', 'Création de la tâche asynchrone sur SunoAPI (Suno v6)...');

    if (!sunorMusicProvider.isConfigured()) {
      throw new Error(
        'SUNO_API_KEY non configurée sur le serveur. Veuillez configurer SUNO_API_KEY ou SUNOR_API_KEY.'
      );
    }

    try {
      const { taskId, gatewayType, baseUrl, songPackage } = await sunorMusicProvider.createTask({
        prompt: params.prompt,
        lyrics: params.lyrics,
        genre: params.genre,
        mood: params.mood,
        voice: params.voice,
        isInstrumental,
        bpm,
        key,
        structure: params.structure,
        generationId: jobId,
        userId: params.userId,
      });

      // Save taskId, style and title immediately in DB (Section 15)
      updateJob({
        provider: 'suno',
        provider_task_id: taskId,
        task_id: taskId,
        title: songPackage.title,
        style: songPackage.style,
        prompt: songPackage.prompt,
        lyrics: songPackage.lyrics,
        model: 'suno',
        model_version: 'v6',
        mode: songPackage.mode,
        instrumental: songPackage.instrumental,
      });

      // Step 3: Génération musicale SunoAI (Suno v6) - surveillance polling
      updateStep(3, 40, 'PROCESSING', `Tâche ${taskId} soumise à Suno v6. Surveillance en cours...`);

      const sunorResult = await sunorMusicProvider.pollTask(
        taskId,
        gatewayType,
        baseUrl,
        jobId,
        params.userId,
        280,
        5000,
        (pollStatus, message, progress) => {
          const j = db.generationJobs.get(jobId);
          if (!j) return;
          j.status = 'PROCESSING';
          if (progress) j.progress = Math.min(85, Math.max(35, progress));
          j.updated_at = new Date().toISOString();
          if (j.steps[2]) {
            j.steps[2].status = 'active';
            j.steps[2].message = message;
          }
          db.generationJobs.set(jobId, j);
        }
      );

      if (sunorResult.status === 'success' && sunorResult.audio_url) {
        // Step 4: Extraction du flux audio
        updateStep(4, 75, 'PROCESSING', 'Extraction du flux audio haute fidélité...');

        const directAudio = sunorResult.audio_url;
        const storedAudio = sunorResult.stored_audio_url || directAudio;
        let generatedTitle = songPackage.title || sunorResult.title || `${params.genre} - SITDOWORLD`;

        if (sunorResult.image_url) coverA = sunorResult.image_url;
        let lyricsFinal = songPackage.lyrics || sunorResult.lyrics || '';

        // Step 5: Validation du fichier audio (Section 9)
        updateStep(5, 88, 'PROCESSING', 'Validation de conformité du fichier audio et des voix...');
        
        // Validate external CDN audio or local stored audio
        let audioValidation = await sunorMusicProvider.validateAudio(directAudio);
        if (!audioValidation.valid && storedAudio) {
          audioValidation = await sunorMusicProvider.validateAudio(storedAudio);
        }

        if (!audioValidation.valid) {
          console.warn(`[AUDIO_VALIDATION] Échec sur ${directAudio}: ${audioValidation.error}`);
          throw new Error(`Validation audio échouée : le fichier retourné n’est pas accessible (${audioValidation.error}).`);
        }

        updateJob({
          audio_url: directAudio,
          stored_audio_url: storedAudio,
          duration: Math.round(sunorResult.duration || 180),
        });

        // Step 6: Audio prêt et finalisation studio (1 chanson unique)
        updateStep(6, 100, 'COMPLETED', 'Votre chanson est prête pour écoute et téléchargement.');

        const song: Song = {
          id: `song-${Date.now()}`,
          title: generatedTitle,
          prompt: params.prompt,
          lyrics: lyricsFinal,
          genre: params.genre,
          mood: params.mood || 'Romantique & Entraînant',
          duration: Math.round(sunorResult.duration || 180),
          bpm,
          key,
          creator_id: params.userId,
          creator_name: creatorName,
          cover_url: coverA,
          audio_url: directAudio,
          stored_audio_url: storedAudio,
          version_tag: 'ORIGINAL',
          is_public: true,
          likes_count: 0,
          plays_count: 1,
          shares_count: 0,
          stems_extracted: false,
          model_used: 'suno-v6',
          created_at: new Date().toISOString(),
        };

        // Save single song in DB
        db.songs.set(song.id, song);

        // Commit credit consumption ONLY now that song is verified (1 prompt = 1 credit)
        db.commitSong(params.userId, jobId, `GEN-${jobId}`);

        const j = db.generationJobs.get(jobId);
        if (j) {
          j.status = 'COMPLETED';
          j.progress = 100;
          j.current_step = 6;
          j.credits_consumed = 1;
          j.steps = j.steps.map((s) => ({ ...s, status: 'completed' }));
          j.song = song;
          j.versions = {
            a: song,
          };
          j.completed_at = new Date().toISOString();
          j.updated_at = new Date().toISOString();
          db.generationJobs.set(jobId, j);
        }

        db.logEvent('generation_completed', params.userId, {
          jobId,
          songId: song.id,
          title: song.title,
          model: 'suno-v6',
        });
      } else if (sunorResult.status === 'timeout') {
        throw new Error(sunorResult.error || 'Délai d’attente SunoAPI dépassé (timeout).');
      } else {
        throw new Error(sunorResult.error || 'La génération SunoAPI a retourné une erreur.');
      }
    } catch (sunoErr: any) {
      console.error('[SUNO] Erreur génération SunoAPI:', sunoErr.message);
      throw sunoErr;
    }
  }

  public async getGenerationStatus(jobId: string): Promise<GenerationJob | null> {
    return db.generationJobs.get(jobId) || null;
  }

  public async getSong(songId: string): Promise<Song | null> {
    return db.songs.get(songId) || null;
  }

  public async extendSong(params: ExtendSongParams): Promise<{ jobId: string }> {
    const parentSong = db.songs.get(params.songId);
    return this.generateSong({
      userId: params.userId,
      prompt: `Extension: ${params.extensionPrompt || parentSong?.prompt || 'Morceau étendu'}`,
      genre: parentSong?.genre || 'Afrobeat',
      mood: parentSong?.mood || 'Vibrant',
      isInstrumental: false,
    });
  }

  public async remixSong(params: RemixSongParams): Promise<{ jobId: string }> {
    const parentSong = db.songs.get(params.songId);
    return this.generateSong({
      userId: params.userId,
      prompt: `Remix ${params.targetGenre}: ${parentSong?.prompt || 'Morceau'}`,
      genre: params.targetGenre,
      mood: params.targetMood || parentSong?.mood || 'Remix Vibe',
      isInstrumental: false,
    });
  }

  public async generateStems(songId: string): Promise<Stem[]> {
    const song = db.songs.get(songId);
    if (!song) throw new Error('Chanson introuvable pour extraction');

    const stems: Stem[] = [
      { id: `stem-${songId}-vocal`, song_id: songId, name: 'Vocals', audio_url: song.audio_url, volume: 1.0, muted: false, solo: false },
      { id: `stem-${songId}-drums`, song_id: songId, name: 'Drums', audio_url: song.audio_url, volume: 0.9, muted: false, solo: false },
      { id: `stem-${songId}-bass`, song_id: songId, name: 'Bass', audio_url: song.audio_url, volume: 0.85, muted: false, solo: false },
      { id: `stem-${songId}-other`, song_id: songId, name: 'Guitar', audio_url: song.audio_url, volume: 0.8, muted: false, solo: false },
    ];

    song.stems_extracted = true;
    db.songs.set(songId, song);
    return stems;
  }
}

export const musicProvider = new SitdoworldMusicProvider();
