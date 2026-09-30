import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Play,
  Pause,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  Scissors,
  Share2,
  Trash2,
  Music2,
  Mic,
  Volume2,
  Wand2,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Song, GenerationJob, UserSongBalance, Genre, Plan } from '../types';
import { StudioLockedGate } from '../components/StudioLockedGate';

interface CreateViewProps {
  balance: UserSongBalance | null;
  onGenerationFinished: () => void;
  onOpenStudio: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  navigate: (route: string) => void;
  prefillGenre?: string;
  prefillPrompt?: string;
  plans?: Plan[];
  onSelectPlan?: (plan: Plan) => void;
}

export const CreateView: React.FC<CreateViewProps> = ({
  balance,
  onGenerationFinished,
  onOpenStudio,
  onPlaySong,
  currentSong,
  isPlaying,
  navigate,
  prefillGenre,
  prefillPrompt,
  plans = [],
  onSelectPlan,
}) => {
  // Mode selection
  const [isAdvanced, setIsAdvanced] = useState(false);

  // Form fields
  const [prompt, setPrompt] = useState(
    prefillPrompt ||
      'Une chanson afrobeat romantique en français, voix masculine chaleureuse, guitare douce, batterie dansante et refrain très accrocheur.'
  );
  const [genre, setGenre] = useState<string>(prefillGenre || 'Afrobeat');
  const [mood, setMood] = useState('Romantique & Dansant');
  const [language, setLanguage] = useState('Français');
  const [voice, setVoice] = useState<'male' | 'female' | 'duet' | 'instrumental'>('male');
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [duration, setDuration] = useState('3:00');
  const [tempo, setTempo] = useState('104 BPM');

  // Advanced fields
  const [lyrics, setLyrics] = useState('');
  const [bpm, setBpm] = useState(104);
  const [key, setKey] = useState('F# Minor');
  const [selectedStructures, setSelectedStructures] = useState<string[]>([
    'Intro',
    'Verse',
    'Pre-Chorus',
    'Chorus',
    'Verse 2',
    'Bridge',
    'Final Chorus',
    'Outro',
  ]);
  const [energy, setEnergy] = useState(80);
  const [creativity, setCreativity] = useState(75);
  const [styleStrength, setStyleStrength] = useState(85);
  const [originality, setOriginality] = useState(70);

  // Async Generation state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalDiagnostic, setTechnicalDiagnostic] = useState<{
    httpStatus?: number | string;
    errorCode?: string;
    message?: string;
    taskId?: string;
  } | null>(null);

  // Gemini AI Assistant state
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [geminiStatusNote, setGeminiStatusNote] = useState<string | null>(null);


  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    setGeminiStatusNote(null);
    try {
      const res = await fetch('/api/gemini/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre, mood, language }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        if (data.suggestedBpm) setBpm(data.suggestedBpm);
        if (data.suggestedKey) setKey(data.suggestedKey);
        setGeminiStatusNote('✨ Prompt enrichi avec succès par Gemini 3.8 Flash !');
        setTimeout(() => setGeminiStatusNote(null), 4500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const res = await fetch('/api/gemini/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: prompt || 'Une célébration de la vie et de la musique',
          genre,
          mood,
          language,
          structures: selectedStructures,
        }),
      });
      const data = await res.json();
      if (data.lyrics) {
        setLyrics(data.lyrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const availableSongs = balance?.available_songs ?? 0;
  const hasActivePack = Boolean(balance?.has_active_pack && availableSongs > 0);

  // Strictly enforce pack check: Users without active pack or with 0 songs cannot access the generator
  if (!hasActivePack) {
    return (
      <StudioLockedGate
        plans={plans}
        onSelectPlan={onSelectPlan || ((p) => navigate('/pricing'))}
        navigate={navigate}
        reason={balance && balance.total_purchased > 0 && availableSongs <= 0 ? 'zero_remaining' : 'no_pack'}
      />
    );
  }

  // Inspiration prompts
  const samplePrompts = [
    'Une chanson afrobeat romantique en français, voix masculine chaleureuse, guitare douce, batterie dansante et refrain très accrocheur.',
    'Amapiano envoûtant de Soweto, log drums ultra profonds, solo de piano jazz Rhodes et chant féminin doux.',
    'Gospel francophone grandiose avec chœur céleste, orgue Hammond, montée puissante et message d’espérance.',
    'R&B nocturne sensuel, beat feutré, guitare acoustique intime et chant passionné en anglais et français.',
    'Pop electro lumineuse prête pour les radios, refrain explosif et guitare funk entraînante.',
  ];

  // Poll generation status
  useEffect(() => {
    if (!activeJobId) return;

    // Polling backend every 5 seconds as specified in Section 9
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generations/${activeJobId}`);
        const data = await res.json();
        if (data.job) {
          setActiveJob(data.job);
          if (data.job.status === 'COMPLETED' || data.job.status === 'completed') {
            clearInterval(interval);
            onGenerationFinished();
          } else if (
            data.job.status === 'FAILED' ||
            data.job.status === 'failed' ||
            data.job.status === 'TIMEOUT' ||
            data.job.status === 'timeout'
          ) {
            clearInterval(interval);
            const rawMsg = data.job.error_message || 'Échec de la génération musicale. Vos crédits ont été restitués.';
            setErrorMessage(rawMsg);
            
            // Extract developer diagnostic according to Section 3 & 22
            const isInsufficientCredits = rawMsg.toLowerCase().includes('insufficient credits') || rawMsg.includes('402');
            setTechnicalDiagnostic({
              httpStatus: isInsufficientCredits ? 402 : rawMsg.match(/HTTP\s*(\d{3})/)?.[1] || 500,
              errorCode: isInsufficientCredits ? 'insufficient_credits' : 'generation_failed',
              message: rawMsg,
              taskId: data.job.task_id || '-',
            });
            onGenerationFinished();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const handleGenerate = async () => {
    setErrorMessage(null);

    if (isSubmitting) return;

    if (!balance?.has_active_pack || availableSongs <= 0) {
      setErrorMessage('Vous devez acheter un pack de chansons pour utiliser le générateur.');
      return;
    }

    if (!prompt.trim()) {
      setErrorMessage('Veuillez entrer une description de votre chanson.');
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          prompt,
          genre,
          mood,
          language,
          voice: isInstrumental ? 'instrumental' : voice,
          is_instrumental: isInstrumental,
          bpm,
          key,
          structure: isAdvanced ? selectedStructures : undefined,
          lyrics: isAdvanced ? lyrics : undefined,
          energy,
          creativity,
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du démarrage de la génération.');
      }

      setActiveJobId(data.jobId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Le service musical est temporairement indisponible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStructure = (part: string) => {
    if (selectedStructures.includes(part)) {
      setSelectedStructures(selectedStructures.filter((p) => p !== part));
    } else {
      setSelectedStructures([...selectedStructures, part]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-28">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <span>STUDIO DE CRÉATION</span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 text-[#FF7A00]">
              IA Music
            </span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Exprimez votre idée en mots simples. Notre moteur d'intelligence artificielle compose votre chanson originale.
          </p>
        </div>

        {/* Mode Toggle Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setIsAdvanced(false)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isAdvanced ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode Simple
            </button>
            <button
              onClick={() => setIsAdvanced(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isAdvanced ? 'bg-white text-[#FF7A00] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Mode Avancé</span>
            </button>
          </div>
        </div>
      </div>


      {/* BALANCE ALERTS (Section 28) */}
      {availableSongs === 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Vous avez utilisé toutes vos chansons.</p>
              <p className="text-xs text-red-700">Rechargez votre compte avec un pack pour démarrer de nouvelles créations.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
          >
            Acheter un nouveau pack
          </button>
        </div>
      )}

      {availableSongs === 1 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold">Il vous reste 1 chanson disponible sur votre compte.</span>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="text-xs font-bold text-[#FF7A00] hover:underline shrink-0"
          >
            Recharger
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              La génération n'a pas pu être lancée. Vos chansons SITDOWORLD ont été automatiquement restituées.
            </span>
            <button
              onClick={() => {
                setErrorMessage(null);
                setTechnicalDiagnostic(null);
              }}
              className="text-xs underline ml-2 cursor-pointer text-red-600 hover:text-red-900"
            >
              Fermer
            </button>
          </div>

          {technicalDiagnostic && (
            <div className="mt-3 p-3 bg-red-900/90 text-red-50 rounded-xl font-mono text-[11px] leading-relaxed border border-red-800">
              <div className="font-bold text-amber-300 pb-1 border-b border-red-700/60 mb-1.5 flex items-center justify-between">
                <span>[SUNOR ERROR] RAPPORT TECHNIQUE FOURNISSEUR</span>
                <span className="text-[10px] text-red-300 font-sans">Diagnostic Backend</span>
              </div>
              <p>HTTP STATUS: <span className="text-amber-200 font-bold">{technicalDiagnostic.httpStatus}</span></p>
              <p>ERROR CODE: <span className="text-amber-200 font-bold">{technicalDiagnostic.errorCode}</span></p>
              <p>MESSAGE: <span className="text-white">{technicalDiagnostic.message}</span></p>
              <p>TASK ID: <span className="text-slate-300">{technicalDiagnostic.taskId || '-'}</span></p>

              {String(technicalDiagnostic.message).includes('Insufficient credits') && (
                <div className="mt-2.5 pt-2 border-t border-red-700/60 text-amber-200 font-sans text-xs">
                  💡 <strong>Cause identifiée :</strong> Votre clé d'API Sunor est valide et authentifiée, mais votre compte fournisseur Sunor ne dispose que de <strong>5 crédits</strong> alors que la génération Suno v6 requiert <strong>10 crédits</strong> (5 crédits par variation audio). Une recharge de crédits sur votre compte Sunor est nécessaire pour générer de nouveaux titres.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MAIN GENERATOR FORM */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Sunor API Engine Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 rounded-2xl border border-orange-200/70 text-xs">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-slate-900">Moteur Musical : Sunor API (Suno v6)</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-600 hidden sm:inline">Passerelle sunor.cc/api/v1/task</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-orange-800 bg-white/80 px-2.5 py-1 rounded-xl border border-orange-200/50 shadow-xs">
            <span className="text-slate-500">Modèle actif :</span>
            <span className="font-bold text-orange-600">suno / v6</span>
          </div>
        </div>

        {/* Main Prompt Box */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
              <span>Décris la chanson que tu veux créer...</span>
              <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isEnhancingPrompt || !prompt.trim()}
                onClick={handleEnhancePrompt}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEnhancingPrompt
                    ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                    : 'bg-orange-50/80 hover:bg-orange-100 border-orange-200 text-[#FF7A00] shadow-xs'
                }`}
                title="Enrichir automatiquement le prompt avec Gemini 3.8 Flash (instruments, groove, ambiance)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEnhancingPrompt ? 'Optimisation Gemini...' : '🪄 Optimiser avec Gemini AI'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const random = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
                  setPrompt(random);
                }}
                className="text-xs text-[#2563EB] hover:underline font-bold flex items-center gap-1 cursor-pointer py-1.5 px-2"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Idée aléatoire</span>
              </button>
            </div>
          </div>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Exemple: Une chanson afrobeat romantique en français, voix masculine chaleureuse, guitare douce, batterie dansante et refrain très accrocheur."
            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FF7A00] focus:ring-2 focus:ring-orange-100 transition-all resize-y"
          />
          {geminiStatusNote && (
            <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{geminiStatusNote}</span>
            </div>
          )}
        </div>

        {/* Standard Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Style musical */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Style musical</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2563EB]"
            >
              <option value="Afrobeat">Afrobeat</option>
              <option value="Amapiano">Amapiano</option>
              <option value="Gospel">Gospel</option>
              <option value="R&B">R&B</option>
              <option value="Hip-Hop">Hip-Hop</option>
              <option value="Pop">Pop</option>
              <option value="Dance">Dance</option>
              <option value="Reggae">Reggae</option>
              <option value="Drill">Drill</option>
              <option value="Cinematic">Cinematic</option>
              <option value="Lo-fi">Lo-fi</option>
              <option value="Jazz">Jazz</option>
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2563EB]"
            >
              <option value="Dansant & Positif">Dansant & Positif</option>
              <option value="Romantique & Tendre">Romantique & Tendre</option>
              <option value="Spirituel & Inspirant">Spirituel & Inspirant</option>
              <option value="Chill & Relax">Chill & Relax</option>
              <option value="Énergique & Festif">Énergique & Festif</option>
              <option value="Triste & Mélancolique">Triste & Mélancolique</option>
              <option value="Épique & Triomphant">Épique & Triomphant</option>
            </select>
          </div>

          {/* Langue */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Langue</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2563EB]"
            >
              <option value="Français">Français</option>
              <option value="Anglais">Anglais</option>
              <option value="Pidgin English">Pidgin English</option>
              <option value="Espagnol">Espagnol</option>
              <option value="Lingala / Yoruba">Lingala / Yoruba</option>
              <option value="Bilingue FR/EN">Bilingue FR/EN</option>
            </select>
          </div>

          {/* Voix */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Voix</label>
            <select
              disabled={isInstrumental}
              value={voice}
              onChange={(e) => setVoice(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2563EB] disabled:opacity-50"
            >
              <option value="male">Voix Masculine</option>
              <option value="female">Voix Féminine</option>
              <option value="duet">Duo (Mixte)</option>
            </select>
          </div>
        </div>

        {/* Options: Vocal vs Instrumental */}
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#0F172A]">
            <input
              type="radio"
              name="format"
              checked={!isInstrumental}
              onChange={() => setIsInstrumental(false)}
              className="w-4 h-4 text-[#FF7A00] accent-[#FF7A00]"
            />
            <Mic className="w-4 h-4 text-[#2563EB]" />
            <span>Vocal (avec chant & paroles)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#0F172A]">
            <input
              type="radio"
              name="format"
              checked={isInstrumental}
              onChange={() => setIsInstrumental(true)}
              className="w-4 h-4 text-[#FF7A00] accent-[#FF7A00]"
            />
            <Volume2 className="w-4 h-4 text-[#FF7A00]" />
            <span>Instrumental uniquement</span>
          </label>
        </div>

        {/* ADVANCED MODE SECTION (Section 8) */}
        {isAdvanced && (
          <div className="pt-6 border-t border-slate-200 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#2563EB] tracking-wider">
                Paramètres Avancés de Production
              </span>
              <span className="text-[11px] text-[#64748B]">Personnalisation du studio</span>
            </div>

            {/* Lyrics Editor */}
            {!isInstrumental && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Paroles personnalisées (Optionnel)
                  </label>
                  <button
                    type="button"
                    disabled={isGeneratingLyrics}
                    onClick={handleGenerateLyrics}
                    className="text-xs text-[#2563EB] hover:text-blue-700 font-bold flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all"
                    title="Générer des paroles structurées avec le modèle Gemini 3.8 Flash"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                    <span>{isGeneratingLyrics ? 'Rédaction Gemini...' : '✍️ Rédiger avec Gemini AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="[Intro] ...&#10;[Refrain] ...&#10;[Couplet 1] ...&#10;Laissez vide pour que l'IA génère les paroles complètes."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>
            )}

            {/* Tempo, BPM & Key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Tempo / BPM: {bpm}</span>
                  <span className="text-[#64748B]">{bpm < 90 ? 'Lent' : bpm < 115 ? 'Modéré' : 'Rapide'}</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={160}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Tonalité / Key</label>
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                >
                  <option value="C Major">C Major</option>
                  <option value="C Minor">C Minor</option>
                  <option value="F# Minor">F# Minor (Afrobeat standard)</option>
                  <option value="A Minor">A Minor</option>
                  <option value="G Major">G Major</option>
                  <option value="Eb Major">Eb Major (Gospel standard)</option>
                  <option value="D Minor">D Minor</option>
                </select>
              </div>
            </div>

            {/* Song Structure Selector */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-2">
                Structure de la chanson (Cliquez pour activer/désactiver)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Verse 2', 'Bridge', 'Final Chorus', 'Outro'].map(
                  (part) => {
                    const isSelected = selectedStructures.includes(part);
                    return (
                      <button
                        key={part}
                        type="button"
                        onClick={() => toggleStructure(part)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {part}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Sliders: Energy, Creativity, Style Strength, Originality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Énergie</span>
                  <span>{energy}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-[#FF7A00]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Créativité</span>
                  <span>{creativity}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Force du style</span>
                  <span>{styleStrength}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={styleStrength}
                  onChange={(e) => setStyleStrength(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-[#FF7A00]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Originalité</span>
                  <span>{originality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={originality}
                  onChange={(e) => setOriginality(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-[#2563EB]"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON: 🟠 GENERATE SONG */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
          <div className="text-xs text-[#64748B]">
            Coût : <strong className="text-[#0F172A]">1 chanson</strong> (déduite uniquement à la validation par le backend)
          </div>

          <button
            onClick={handleGenerate}
            disabled={isSubmitting || activeJob?.status === 'GENERATING' || activeJob?.status === 'PROCESSING'}
            id="generate-song-btn"
            className="px-8 py-4 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] disabled:opacity-50 text-white font-extrabold text-base tracking-wide shadow-xl shadow-orange-500/30 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isSubmitting || activeJob?.status === 'GENERATING' || activeJob?.status === 'PROCESSING' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Générer la chanson</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ASYNCHRONOUS GENERATION OVERLAY & RESULTS (Section 9 & 10) */}
      {activeJob && (
        <div className="bg-white rounded-3xl border-2 border-orange-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#0F172A]">
                  {activeJob.status === 'COMPLETED'
                    ? 'Votre chanson est prête.'
                    : 'Génération en cours...'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Job ID: {activeJob.id} • Statut: {activeJob.status}
                </p>
              </div>
            </div>
            <div className="text-right">
              {activeJob.status === 'COMPLETED' ? (
                <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  100% • Prêt
                </span>
              ) : activeJob.status === 'FAILED' || activeJob.status === 'TIMEOUT' ? (
                <span className="text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  Erreur
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                  Génération en cours...
                </span>
              )}
            </div>
          </div>

          {/* Live Progress Bar with Indeterminate Animation during Generation */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
            {activeJob.status === 'COMPLETED' ? (
              <div className="bg-gradient-to-r from-emerald-500 to-[#FF7A00] h-full w-full rounded-full transition-all duration-500" />
            ) : activeJob.status === 'FAILED' || activeJob.status === 'TIMEOUT' ? (
              <div className="bg-rose-500 h-full w-full rounded-full" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-[#2563EB] via-[#FF7A00] to-[#2563EB] bg-[length:200%_100%] animate-pulse rounded-full" />
            )}
          </div>

          {/* Real-time status notice */}
          {activeJob.status !== 'COMPLETED' && activeJob.status !== 'FAILED' && activeJob.status !== 'TIMEOUT' && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-orange-50/80 border border-orange-200/80 text-orange-900 text-xs">
              <Sparkles className="w-4 h-4 text-[#FF7A00] animate-spin shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Synthèse musicale en cours via Sunor (Suno v6)</p>
                <p className="text-[11px] text-orange-800/80">
                  {activeJob.steps.find((s) => s.status === 'active')?.message ||
                    'Création audio en cours... Cela peut prendre quelques instants selon la charge du serveur.'}
                </p>
              </div>
            </div>
          )}

          {/* 6 Visual Steps (Section 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeJob.steps.map((step) => {
              const isDone = step.status === 'completed';
              const isActive = step.status === 'active';
              return (
                <div
                  key={step.step}
                  className={`p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : isActive
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isActive ? (
                      <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">
                      {step.step}. {step.title}
                    </p>
                    {step.message && <p className="text-[11px] opacity-80 mt-0.5">{step.message}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SINGLE GENERATED SONG RESULT */}
          {activeJob.status === 'COMPLETED' && (activeJob.song || activeJob.versions?.a) && (() => {
            const finalSong = activeJob.song || activeJob.versions?.a;
            if (!finalSong) return null;
            return (
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2">
                    <span>Votre chanson est prête</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      1 chanson finalisée
                    </span>
                  </h4>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/40 border-2 border-orange-200 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img
                      src={finalSong.cover_url}
                      alt={finalSong.title}
                      className="w-20 h-20 rounded-2xl object-cover shadow-md shrink-0 border border-orange-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-[#FF7A00] text-white">
                          Chanson Finale
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {finalSong.duration ? `${Math.floor(finalSong.duration / 60)}:${String(finalSong.duration % 60).padStart(2, '0')}` : '3:00'}
                        </span>
                      </div>
                      <h5 className="font-black text-lg text-[#0F172A] truncate mt-1">
                        {finalSong.title}
                      </h5>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {finalSong.genre} • {finalSong.bpm} BPM • {finalSong.mood}
                      </p>
                    </div>
                  </div>

                  {/* Actions on Generated Song */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-orange-200/80">
                    <button
                      onClick={() => onPlaySong(finalSong)}
                      className="px-4 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer transition-all active:scale-95"
                    >
                      {isPlaying && currentSong?.id === finalSong.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                      <span>{isPlaying && currentSong?.id === finalSong.id ? 'Pause' : 'Écouter'}</span>
                    </button>

                    <button
                      onClick={() => onOpenStudio(finalSong)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-orange-50 text-[#FF7A00] border border-orange-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Studio & Stems</span>
                    </button>

                    <button
                      onClick={() => navigate('/library')}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs cursor-pointer shadow-xs transition-all"
                    >
                      Ma musique
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
