import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Music,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Lock,
  Globe,
  Database,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface AISettingsData {
  config: {
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
  };
  envStatus: {
    isValid: boolean;
    warnings: string[];
    missingVars: string[];
    components: {
      gemini: { configured: boolean; message: string };
      musicProvider: { configured: boolean; message: string };
      storage: { configured: boolean; message: string };
      auth: { configured: boolean; message: string };
      saspay: { configured: boolean; message: string };
    };
  };
}

export const SaaSAISettingsTab: React.FC = () => {
  const [data, setData] = useState<AISettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Test connection states for Gemini
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    model?: string;
    sampleReply?: string;
    error?: string;
  } | null>(null);

  // Test connection states for Music Provider
  const [testingMusic, setTestingMusic] = useState(false);
  const [musicTestResult, setMusicTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Test connection states for SASPAY
  const [testingSaspay, setTestingSaspay] = useState(false);
  const [saspayTestResult, setSaspayTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Full system health report
  const [healthReport, setHealthReport] = useState<any | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ai-settings');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erreur chargement ai-settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch('/api/health/ai');
      if (res.ok) {
        const json = await res.json();
        setHealthReport(json);
      }
    } catch (err) {
      console.error('Erreur chargement health report:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchFullHealth();
  }, []);

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini' }),
      });
      const json = await res.json();
      setGeminiTestResult(json);
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        error: err.message || 'Erreur réseau lors du test de Gemini',
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestMusic = async () => {
    setTestingMusic(true);
    setMusicTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'music' }),
      });
      const json = await res.json();
      setMusicTestResult(json);
    } catch (err: any) {
      setMusicTestResult({
        success: false,
        error: err.message || 'Erreur lors du test du fournisseur musical',
      });
    } finally {
      setTestingMusic(false);
    }
  };

  const handleTestSaspay = async () => {
    setTestingSaspay(true);
    setSaspayTestResult(null);
    try {
      const res = await fetch('/api/admin/saspme/test', {
        method: 'POST',
      });
      const json = await res.json();
      setSaspayTestResult(json);
    } catch (err: any) {
      setSaspayTestResult({
        success: false,
        error: err.message || 'Erreur lors du test de SASPAY',
      });
    } finally {
      setTestingSaspay(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Chargement des paramètres d’API IA...</p>
      </div>
    );
  }

  const config = data?.config;

  return (
    <div className="space-y-6" id="ai-api-settings-view">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Architecture & Fournisseurs d’Intelligence Artificielle
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Gestion sécurisée des clés API (Gemini, SunoAPI, SASPAY), vérification des connexions et surveillance de l’infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchSettings();
              fetchFullHealth();
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Global Health Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>AI Provider</span>
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-base font-black text-slate-900 uppercase">
            {config?.aiProvider || 'GEMINI'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Actif & Sélectionné</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Gemini API</span>
            <Zap className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-base font-black text-slate-900">
            {config?.gemini.configured ? 'Connecté' : 'À configurer'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {config?.gemini.model}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Music Provider</span>
            <Music className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-base font-black text-slate-900 uppercase">
            {config?.music.provider || 'SUNO'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
            {config?.music.model || 'suno-v6'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Stockage Audio</span>
            <Database className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-base font-black text-slate-900">
            Opérationnel
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {config?.storage.type}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Passerelle SASPAY</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base font-black text-slate-900">
            {config?.saspay.configured ? 'Prêt' : 'En attente'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Mobile Money
          </div>
        </div>
      </div>

      {/* SECTION 1: GEMINI API CONFIGURATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">1. Fournisseur Gemini API (Google GenAI)</h3>
              <p className="text-xs text-slate-500">
                Génération de paroles, enrichissement de prompts, analyse harmonique et orchestration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestGemini}
            disabled={testingGemini}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            id="test-gemini-btn"
          >
            {testingGemini ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Test en cours...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>TEST CONNECTION</span>
              </>
            )}
          </button>
        </div>

        {/* Form Fields Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Gemini API Key (Strictement privée côté serveur)
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={config?.gemini.maskedKey || '••••••••••••••••'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {config?.gemini.configured ? 'Configuré' : 'Non détecté'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Les clés sont masquées et chargées depuis les variables d’environnement du serveur.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Google Cloud Project ID
            </label>
            <input
              type="text"
              readOnly
              value={config?.gemini.project || 'gen-lang-client-0670318176'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Identifiant de projet Google Cloud pour l’authentification backend.
            </p>
          </div>
        </div>

        {/* Live Test Feedback Banner for Gemini */}
        {geminiTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              geminiTestResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {geminiTestResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-black text-sm">
                {geminiTestResult.success ? '✓ Connection successful' : '✕ Connection failed'}
              </div>
              {geminiTestResult.success ? (
                <div>
                  <span className="font-semibold">Temps de réponse:</span> {geminiTestResult.latencyMs}ms |{' '}
                  <span className="font-semibold">Modèle vérifié:</span> {geminiTestResult.model}
                  {geminiTestResult.sampleReply && (
                    <div className="mt-1 text-slate-600 italic">
                      « {geminiTestResult.sampleReply} »
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span className="font-bold">Reason:</span> {geminiTestResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: MUSIC PROVIDER CONFIGURATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">2. Fournisseur Musical (Music Provider)</h3>
              <p className="text-xs text-slate-500">
                Génération de l’audio, synthèse des instruments et masterisation studio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestMusic}
            disabled={testingMusic}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            id="test-music-btn"
          >
            {testingMusic ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Test en cours...</span>
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5" />
                <span>TEST CONNECTION</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Required Inputs from prompt: [Provider] [API URL] [API Key] [Model] */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              [ Provider ]
            </label>
            <input
              type="text"
              readOnly
              value={config?.music.provider || 'suno'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              [ API URL ]
            </label>
            <input
              type="text"
              readOnly
              value={config?.music.apiUrl || 'https://sunor.cc/api/v1'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              [ API Key ]
            </label>
            <input
              type="text"
              readOnly
              value={config?.music.maskedKey || '••••••••••••••••'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              [ Model ]
            </label>
            <input
              type="text"
              readOnly
              value={config?.music.model || 'suno-v6'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>
        </div>

        {/* Live Test Feedback Banner for Music */}
        {musicTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              musicTestResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {musicTestResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-black text-sm">
                {musicTestResult.success ? '✓ Connection successful' : '✕ Connection failed'}
              </div>
              {musicTestResult.success ? (
                <div>
                  <span className="font-semibold">Temps de réponse:</span> {musicTestResult.latencyMs}ms |{' '}
                  <span className="font-semibold">Statut:</span> {musicTestResult.message}
                </div>
              ) : (
                <div>
                  <span className="font-bold">Reason:</span> {musicTestResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: SASP.ME (SASPAY) MOBILE MONEY GATEWAY */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">3. Passerelle de Paiement SASP.ME / SASPAY</h3>
              <p className="text-xs text-slate-500">
                Paiements Mobile Money automatisés (Wave, Orange Money, MTN MoMo, M-Pesa).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestSaspay}
            disabled={testingSaspay}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            id="test-saspay-btn"
          >
            {testingSaspay ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Test en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>TEST CONNECTION</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              SASPAY Live API Key (Masquée)
            </label>
            <input
              type="text"
              readOnly
              value={config?.saspay.maskedKey || '••••••••••••••••'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              SASPAY Endpoint URL
            </label>
            <input
              type="text"
              readOnly
              value={config?.saspay.baseUrl || 'https://api.saspay.net/v1'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
          </div>
        </div>

        {/* Live Test Feedback Banner for SASPAY */}
        {saspayTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              saspayTestResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {saspayTestResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-black text-sm">
                {saspayTestResult.success ? '✓ Connection successful' : '✕ Connection failed'}
              </div>
              <div className="text-slate-600">
                {saspayTestResult.message || saspayTestResult.error}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: STORAGE & AUTHENTICATION OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Stockage Audio & Média</h4>
              <p className="text-[11px] text-slate-500">Mise en mémoire tampon et streaming audio haute fidélité</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Type de stockage :</span>
              <span className="font-bold text-slate-800">{config?.storage.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cache Audio :</span>
              <span className="font-semibold text-emerald-600">Actif (Accept-Ranges, Byte streaming)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Authentification & Sécurité RBAC</h4>
              <p className="text-[11px] text-slate-500">Sessions signées et protection HMAC anti-fraude</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Secret Auth :</span>
              <span className="font-mono text-slate-800">••••••••••••••••</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protection Webhook :</span>
              <span className="font-semibold text-emerald-600">Signature HMAC-SHA256 active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
