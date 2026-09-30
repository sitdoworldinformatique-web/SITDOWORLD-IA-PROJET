import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  DollarSign,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Globe,
  Music,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { SaaSSettings } from '../../types';

interface SaaSSettingsTabProps {
  settings: SaaSSettings | null;
  onSave: (updated: SaaSSettings) => Promise<boolean>;
  onReset: () => Promise<boolean>;
  saving: boolean;
}

export const SaaSSettingsTab: React.FC<SaaSSettingsTabProps> = ({
  settings,
  onSave,
  onReset,
  saving,
}) => {
  const [formData, setFormData] = useState<SaaSSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'general' | 'ai' | 'billing' | 'security'>('all');

  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
    }
  }, [settings]);

  if (!formData) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Chargement des paramètres du SaaS...</p>
      </div>
    );
  }

  const updateGeneral = <K extends keyof SaaSSettings['general']>(key: K, value: SaaSSettings['general'][K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        general: { ...prev.general, [key]: value },
      };
    });
    setHasChanges(true);
  };

  const updateAI = <K extends keyof SaaSSettings['ai']>(key: K, value: SaaSSettings['ai'][K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ai: { ...prev.ai, [key]: value },
      };
    });
    setHasChanges(true);
  };

  const updateBilling = <K extends keyof SaaSSettings['billing']>(key: K, value: SaaSSettings['billing'][K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        billing: { ...prev.billing, [key]: value },
      };
    });
    setHasChanges(true);
  };

  const updateSecurity = <K extends keyof SaaSSettings['security']>(key: K, value: SaaSSettings['security'][K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        security: { ...prev.security, [key]: value },
      };
    });
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    const ok = await onSave(formData);
    if (ok) {
      setHasChanges(false);
      setSaveSuccessMsg('Tous les paramètres du SaaS ont été sauvegardés avec succès !');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const handleConfirmReset = async () => {
    const ok = await onReset();
    setResetConfirmOpen(false);
    if (ok) {
      setHasChanges(false);
      setSaveSuccessMsg('Les paramètres du SaaS ont été réinitialisés aux valeurs recommandées.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="saas-settings-form">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Configuration Centrale SaaS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-400">
              Dernière mise à jour: {new Date(formData.updatedAt).toLocaleString()}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Paramètres Généraux & Règles Métier du SaaS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurez le branding, les quotas du générateur Lyria 3.5 Pro, la politique tarifaire SASPAY et la modération.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="saas-reset-settings-btn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Réinitialiser</span>
          </button>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              hasChanges
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 animate-pulse'
                : 'bg-slate-400 opacity-60 cursor-not-allowed'
            }`}
            id="saas-save-settings-btn"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : hasChanges ? 'Enregistrer les modifications' : 'Paramètres à jour'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Maintenance Mode Warning if Active */}
      {formData.general.maintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-extrabold block">ATTENTION : Le mode maintenance est actuellement activé !</span>
            <span className="text-amber-800">
              Les utilisateurs ordinaires ne peuvent pas générer de musique ni acheter de packs. Seuls les administrateurs ont accès aux fonctions avancées.
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs for Quick Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'all', label: 'Tous les paramètres', icon: Sliders },
          { id: 'general', label: '1. Général & Branding', icon: Globe },
          { id: 'ai', label: '2. Moteur IA & Quotas', icon: Sparkles },
          { id: 'billing', label: '3. Facturation & SASPAY', icon: DollarSign },
          { id: 'security', label: '4. Modération & Sécurité', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: GENERAL & BRANDING */}
      {(activeSection === 'all' || activeSection === 'general') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">1. Général & Identité du SaaS</h3>
              <p className="text-xs text-slate-500">Nom de la marque, coordonnées, devise globale et statut de disponibilité.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nom du Service SaaS
              </label>
              <input
                type="text"
                value={formData.general.appName}
                onChange={(e) => updateGeneral('appName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={formData.general.appTagline}
                onChange={(e) => updateGeneral('appTagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Support & Facturation
              </label>
              <input
                type="email"
                value={formData.general.supportEmail}
                onChange={(e) => updateGeneral('supportEmail', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Devise de Référence
              </label>
              <select
                value={formData.general.defaultCurrency}
                onChange={(e) => updateGeneral('defaultCurrency', e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($) - Dollar américain</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="XOF">XOF (FCFA) - Franc CFA</option>
                <option value="GBP">GBP (£) - Livre sterling</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Maintenance Mode Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Mode Maintenance</span>
                <span className="text-[11px] text-slate-500">
                  Suspend l'accès public pour maintenance technique ou mise à niveau.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.general.maintenanceMode}
                  onChange={(e) => updateGeneral('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Registrations Allowed */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Inscriptions Ouvertes</span>
                <span className="text-[11px] text-slate-500">
                  Autorise les nouveaux utilisateurs à créer un compte.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.general.allowRegistrations}
                  onChange={(e) => updateGeneral('allowRegistrations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AI ENGINE & GENERATION QUOTAS */}
      {(activeSection === 'all' || activeSection === 'ai') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                2. Moteur IA Musical & Quotas Studio
              </h3>
              <p className="text-xs text-slate-500">
                Pilotez les modèles Google Lyria 3.5 Pro, Gemini 3.8 Flash, les durées et la qualité audio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Modèle Audio Musical Principal</span>
                <span className="text-[10px] text-orange-600 font-mono font-bold">Google DeepMind</span>
              </label>
              <select
                value={formData.ai.defaultMusicModel}
                onChange={(e) => updateAI('defaultMusicModel', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="lyria-3-pro-preview">lyria-3-pro-preview (Lyria 3.5 Pro - Recommandé)</option>
                <option value="lyria-3-clip-preview">lyria-3-clip-preview (Lyria 3.0 Clip Rapide)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Modèle Paroles, Harmonie & BPM</span>
                <span className="text-[10px] text-blue-600 font-mono font-bold">Google GenAI</span>
              </label>
              <select
                value={formData.ai.lyricsModel}
                onChange={(e) => updateAI('lyricsModel', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Gemini Studio - Recommandé)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              </select>
            </div>

            {/* Max Duration slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Durée Maximale par Morceau</label>
                <span className="text-xs font-mono font-extrabold text-orange-600">
                  {formData.ai.maxDurationSeconds} secondes ({Math.floor(formData.ai.maxDurationSeconds / 60)}m {formData.ai.maxDurationSeconds % 60}s)
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="300"
                step="15"
                value={formData.ai.maxDurationSeconds}
                onChange={(e) => updateAI('maxDurationSeconds', Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 min (60s)</span>
                <span>3 min (180s)</span>
                <span>5 min (300s)</span>
              </div>
            </div>

            {/* AI Creativity Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Température Créative IA</label>
                <span className="text-xs font-mono font-extrabold text-indigo-600">
                  {formData.ai.aiCreativityTemperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={formData.ai.aiCreativityTemperature}
                onChange={(e) => updateAI('aiCreativityTemperature', Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.1 (Strict & Harmonique)</span>
                <span>0.7 (Équilibré Studio)</span>
                <span>1.0 (Expérimental)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Qualité Audio d'Encodage Studio
              </label>
              <select
                value={formData.ai.defaultSamplingQuality}
                onChange={(e) => updateAI('defaultSamplingQuality', e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="studio_hd_wav">Studio Master WAV 24-bit / 48kHz (Recommandé)</option>
                <option value="standard_mp3">Standard MP3 320 kbps</option>
                <option value="audiophile_flac">Audiophile FLAC Sans Perte</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Limite Générations Simultanées
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.ai.maxConcurrentGenerations}
                onChange={(e) => updateAI('maxConcurrentGenerations', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Nombre de jobs musicaux calculés en parallèle sur le cluster cloud.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Stem Extraction Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Extraction Multitrack des Stems
                </span>
                <span className="text-[11px] text-slate-500">
                  Permet aux abonnés de séparer voix, batterie, basse et synthés dans le Studio.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ai.allowStemExtraction}
                  onChange={(e) => updateAI('allowStemExtraction', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: BILLING & SASPAY */}
      {(activeSection === 'all' || activeSection === 'billing') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                3. Facturation, Tarifs & Passerelle SASPAY
              </h3>
              <p className="text-xs text-slate-500">
                Chansons de bienvenue, prix unitaire indicatif et paramètres de paiement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chansons Gratuites à l'Inscription
              </label>
              <input
                type="number"
                min="0"
                max="0"
                disabled
                value={0}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                Strictement 0. Achat préalable d'un pack obligatoire.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Prix Unitaire par Chanson (USD $)
              </label>
              <input
                type="number"
                step="0.10"
                min="0.5"
                max="10"
                value={formData.billing.unitSongPriceUSD}
                onChange={(e) => updateBilling('unitSongPriceUSD', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Base de calcul de la valeur des morceaux.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Seuil Alerte Solde Faible
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.billing.lowBalanceThreshold}
                onChange={(e) => updateBilling('lowBalanceThreshold', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Déclenche la bannière de rechargement dans l'entête.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* SASPAY Active Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Passerelle SASPAY Active</span>
                <span className="text-[11px] text-slate-500">Paiements Carte & Mobile Money</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.billing.saspayGatewayActive}
                  onChange={(e) => updateBilling('saspayGatewayActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* Test Mode Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Mode Test Sandbox SASPAY</span>
                <span className="text-[11px] text-slate-500">Transactions simulées sans débit</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.billing.testMode}
                  onChange={(e) => updateBilling('testMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Auto Refund on Failure */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Remboursement Auto Échec</span>
                <span className="text-[11px] text-slate-500">Recrédite la chanson si l'IA échoue</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.billing.autoRefundOnFailure}
                  onChange={(e) => updateBilling('autoRefundOnFailure', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SECURITY & MODERATION */}
      {(activeSection === 'all' || activeSection === 'security') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                4. Modération des Contenus, Droits d'Auteur & Sécurité
              </h3>
              <p className="text-xs text-slate-500">
                Filtre de paroles, traçabilité d'audit et protection juridique des créations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Plafond Journalier de Création / Utilisateur
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={formData.security.maxDailyCreationsPerUser}
                onChange={(e) => updateSecurity('maxDailyCreationsPerUser', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Prévient les abus et la surcharge de l'API Lyria.
              </span>
            </div>

            {/* Explicit filter */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Filtre Paroles Explicites</span>
                <span className="text-[11px] text-slate-500">Bloque haine & contenus illégaux</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.security.explicitLyricsFilter}
                  onChange={(e) => updateSecurity('explicitLyricsFilter', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            {/* Copyright Protection */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">Protection Droits d'Auteur</span>
                <span className="text-[11px] text-slate-500">Vérifie l'originalité des prompts</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.security.copyrightProtection}
                  onChange={(e) => updateSecurity('copyrightProtection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Watermark toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Filigrane Audio / Audio Watermark
                </span>
                <span className="text-[11px] text-slate-500">
                  Insère un identifiant sonore « SITDOWORLD AI » sur les pré-écoutes audio.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.security.watermarkAudioFreeTier}
                  onChange={(e) => updateSecurity('watermarkAudioFreeTier', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            {/* Audit Logging */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Journalisation d'Audit Système
                </span>
                <span className="text-[11px] text-slate-500">
                  Enregistre chaque génération, webhook SASPAY et ajustement dans la base de logs.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.security.auditLogging}
                  onChange={(e) => updateSecurity('auditLogging', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Save Floating Bar if changed */}
      {hasChanges && (
        <div className="sticky bottom-6 z-30 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200">
              Vous avez des modifications non enregistrées sur les paramètres SaaS.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (settings) {
                  setFormData(JSON.parse(JSON.stringify(settings)));
                  setHasChanges(false);
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer maintenant'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting to Defaults */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black text-slate-900">Réinitialiser les paramètres ?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tous les réglages actuels seront remplacés par les paramètres par défaut recommandés par Google AI Studio et SITDOWORLD.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmer la réinitialisation
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
