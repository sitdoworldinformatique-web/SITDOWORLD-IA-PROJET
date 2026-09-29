import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Key,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Sliders,
  Server,
  Zap,
  Info,
  Lock,
} from 'lucide-react';

interface SaspayConfigState {
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

interface TestResult {
  success: boolean;
  httpStatus?: number;
  latencyMs?: number;
  message: string;
  error?: string;
  details?: any;
}

export const SaspayConfigTab: React.FC = () => {
  const [config, setConfig] = useState<SaspayConfigState | null>(null);
  const [loading, setLoading] = useState(true);

  // Form input fields (empty by default; secrets are entered manually)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('https://api.saspay.me/api/v1');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [environmentInput, setEnvironmentInput] = useState<'live' | 'sandbox'>('live');
  const [isActiveInput, setIsActiveInput] = useState(false);

  // Field visibility toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Actions states
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/saspay/config');
      const data = await res.json();
      if (res.ok && data.config) {
        setConfig(data.config);
        setIsActiveInput(Boolean(data.config.isActive));
        setMerchantIdInput(data.config.merchantId || '');
        setBaseUrlInput(data.config.baseUrl || 'https://api.saspay.me/api/v1');
        setWebhookUrlInput(data.config.webhookUrl || `${window.location.origin}/api/payments/webhook`);
        setEnvironmentInput(data.config.environment || 'live');
      }
    } catch (err) {
      console.error('Erreur chargement configuration SASPAY:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setTestResult(null);

    const payload: Record<string, any> = {
      isActive: isActiveInput,
      merchantId: merchantIdInput.trim(),
      baseUrl: baseUrlInput.trim() || 'https://api.saspay.me/api/v1',
      webhookUrl: webhookUrlInput.trim() || `${window.location.origin}/api/payments/webhook`,
      environment: environmentInput,
    };

    // Only transmit new credentials if user entered something
    if (apiKeyInput.trim()) {
      payload.apiKey = apiKeyInput.trim();
    }
    if (secretKeyInput.trim()) {
      payload.secretKey = secretKeyInput.trim();
    }
    if (webhookSecretInput.trim()) {
      payload.webhookSecret = webhookSecretInput.trim();
    }

    try {
      const res = await fetch('/api/admin/saspay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement de la configuration.');
      }

      setConfig(data.config);
      // Clear sensitive input fields from form memory after successful save
      setApiKeyInput('');
      setSecretKeyInput('');
      setWebhookSecretInput('');

      setSaveMessage({
        type: 'success',
        text: 'Configuration SASPAY.ME enregistrée avec succès sur le serveur.',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Échec de l’enregistrement de la configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    // Provide pending inputs if user typed them without saving first
    const payload: Record<string, any> = {};
    if (apiKeyInput.trim()) payload.apiKey = apiKeyInput.trim();
    if (secretKeyInput.trim()) payload.secretKey = secretKeyInput.trim();
    if (baseUrlInput.trim()) payload.baseUrl = baseUrlInput.trim();

    try {
      const res = await fetch('/api/admin/saspay/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err.message || 'Erreur réseau lors de la communication avec le serveur.',
        error: 'NETWORK_ERROR',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyWebhook = () => {
    const url = webhookUrlInput || `${window.location.origin}/api/payments/webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Chargement de la configuration SASPAY.ME...</p>
      </div>
    );
  }

  const isConfigured = Boolean(config?.isConfigured);
  const isActive = Boolean(config?.isActive);

  return (
    <div className="space-y-6" id="saspay-configuration-panel">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Configuration SASPAY.ME
            </h2>

            {/* Status pills */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isActive ? 'Passerelle Active' : 'Passerelle Inactive'}</span>
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isConfigured
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Identifiants Configurés</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>En attente de clés</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Intégration manuelle officielle de la passerelle Mobile Money & Cartes bancaires SASPAY.ME. Saisissez vos identifiants marchands ci-dessous.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchConfig}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Save Toast Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Test Connection Result Box */}
      {testResult && (
        <div
          className={`p-5 rounded-3xl border text-xs space-y-2 animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-black">
                  {testResult.success
                    ? 'Succès du test de connexion SASPAY.ME'
                    : 'Échec du test de connexion SASPAY.ME'}
                </h4>
                <p className="font-medium text-slate-700">{testResult.message}</p>
                {testResult.latencyMs !== undefined && testResult.latencyMs > 0 && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Temps de réponse : {testResult.latencyMs}ms | HTTP Status: {testResult.httpStatus || 200}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                <span>Paramètres de Connexion SASPAY.ME</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Renseignez précisément les valeurs fournies par SASPAY.ME pour activer le paiement en ligne.
              </p>
            </div>

            {/* Toggle activation */}
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">Activer la passerelle :</span>
              <div className="relative inline-block w-11 h-6 select-none">
                <input
                  type="checkbox"
                  checked={isActiveInput}
                  onChange={(e) => setIsActiveInput(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clé API / API Key</span>
                </label>
                {config?.hasApiKey && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Déjà enregistrée ({config.maskedApiKey})
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    config?.hasApiKey
                      ? 'Laissez vide pour conserver la clé actuelle'
                      : 'sk_live_... ou votre Clé API SASPAY.ME'
                  }
                  className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono bg-slate-50/50"
                  id="saspay-api-key-input"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Clé d’accès fournie par SASPAY.ME pour identifier vos requêtes API.
              </p>
            </div>

            {/* 2. Secret Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clé Secrète / Secret Key</span>
                </label>
                {config?.hasSecretKey && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Déjà enregistrée ({config.maskedSecretKey})
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder={
                    config?.hasSecretKey
                      ? 'Laissez vide pour conserver le secret actuel'
                      : 'sk_live_... ou votre Clé Secrète SASPAY.ME'
                  }
                  className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono bg-slate-50/50"
                  id="saspay-secret-key-input"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Clé privée utilisée pour authentifier et signer les transactions Mobile Money.
              </p>
            </div>

            {/* 3. Merchant ID / Account ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Merchant ID / Account ID (Identifiant Marchand)</span>
              </label>
              <input
                type="text"
                value={merchantIdInput}
                onChange={(e) => setMerchantIdInput(e.target.value)}
                placeholder="Ex: SASP-M-12345 ou identifiant fourni par SASPAY"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono bg-slate-50/50"
                id="saspay-merchant-id-input"
              />
              <p className="text-[11px] text-slate-500">
                Identifiant unique de votre compte marchand chez SASPAY.ME (si requis par votre contrat).
              </p>
            </div>

            {/* 4. API URL / Endpoint */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>API URL / Endpoint</span>
              </label>
              <input
                type="url"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://api.saspay.me/api/v1"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono bg-slate-50/50"
                id="saspay-base-url-input"
              />
              <p className="text-[11px] text-slate-500">
                Endpoint API de base (défaut : <code className="font-mono text-orange-600">https://api.saspay.me/api/v1</code>).
              </p>
            </div>

            {/* 5. Webhook URL (Read & Copy for SASPAY Dashboard) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span>Webhook URL (URL de Notification)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copier l'URL</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder={`${window.location.origin}/api/payments/webhook`}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono bg-slate-50/50"
                id="saspay-webhook-url-input"
              />
              <p className="text-[11px] text-slate-500">
                Copiez cette URL dans le portail SASPAY.ME (Section Webhooks) pour recevoir les confirmations automatiques de paiement.
              </p>
            </div>

            {/* 6. Webhook Signing Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clé Secrète de Webhook / Secret de Signature</span>
                </label>
                {config?.hasWebhookSecret && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Déjà configurée ({config.maskedWebhookSecret})
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={webhookSecretInput}
                  onChange={(e) => setWebhookSecretInput(e.target.value)}
                  placeholder={
                    config?.hasWebhookSecret
                      ? 'Laissez vide pour conserver le secret existant'
                      : 'Clé secrète de signature HMAC-SHA256'
                  }
                  className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono bg-slate-50/50"
                  id="saspay-webhook-secret-input"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Clé de validation HMAC pour vérifier l’intégrité des notifications webhook reçues.
              </p>
            </div>

            {/* 7. Environment mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-slate-500" />
                <span>Environnement SASPAY.ME</span>
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEnvironmentInput('live')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    environmentInput === 'live'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Production (Live)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnvironmentInput('sandbox')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    environmentInput === 'sandbox'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Bac à sable (Sandbox / Test)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Basculez entre le mode Production et le mode Test selon la clé fournie par SASPAY.
              </p>
            </div>

            {/* 8. Server storage indicator */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stockage & Sécurité Serveur</span>
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Dernière mise à jour :</span>
                  <span className="font-bold text-slate-800">
                    {config?.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Jamais'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Modifié par :</span>
                  <span className="font-bold text-slate-800">{config?.updatedBy || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Clés chiffrées côté serveur, jamais exposées en clair dans le navigateur.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-medium">
              Toutes les modifications sont prises en compte immédiatement sans redémarrage.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                id="saspay-test-connection-btn"
              >
                {testing ? (
                  <RotateCw className="w-4 h-4 animate-spin text-orange-500" />
                ) : (
                  <Zap className="w-4 h-4 text-orange-500" />
                )}
                <span>Tester la connexion</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                id="saspay-save-config-btn"
              >
                {saving ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Enregistrer la configuration</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Operator & Integration Guide Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span>Informations sur l'intégration SASPAY.ME</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Une fois votre configuration enregistrée et activée :
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
          <li>
            <strong>Paiement Mobile Money direct :</strong> Vos clients pourront régler leurs packs via <em>Orange Money, MTN Mobile Money, Moov, Wave, Vodacom M-Pesa, Airtel Money</em> en saisissant simplement leur numéro.
          </li>
          <li>
            <strong>Confirmation Mobile Money :</strong> La demande de validation par code PIN sera transmise vers le téléphone du client selon les paramètres de routage définis avec SASPAY.ME.
          </li>
          <li>
            <strong>Crédit automatique des chansons :</strong> Dès confirmation par webhook, les crédits de chansons du pack choisi seront ajoutés immédiatement au compte du client.
          </li>
        </ul>
      </div>
    </div>
  );
};
