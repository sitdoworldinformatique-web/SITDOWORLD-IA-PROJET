import React, { useState } from 'react';
import {
  Mic,
  Upload,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  Info,
} from 'lucide-react';
import { VoiceProfile } from '../types';

interface VoicesViewProps {
  voices: VoiceProfile[];
  onVoiceCreated: (voice: VoiceProfile) => void;
}

export const VoicesView: React.FC<VoicesViewProps> = ({ voices, onVoiceCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const consentStatement = 'I confirm that I own this voice or have permission to use it.';

  const handleCreateVoice = async () => {
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Veuillez donner un nom à votre profil vocal.');
      return;
    }

    if (!hasConsent) {
      setErrorMsg('Vous devez impérativement valider la déclaration de consentement légal.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          has_consent: hasConsent,
          consent_statement: consentStatement,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du profil vocal.');
      }

      onVoiceCreated(data.voice);
      setName('');
      setDescription('');
      setHasConsent(false);
      setRecordedAudio(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de créer la voix.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-28">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#2563EB] text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>SITDOWORLD VOICE STUDIO</span>
        </div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
          Profils Vocaux & Synthèse Personnalisée
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Enregistrez ou importez votre propre timbre vocal pour l'utiliser comme chanteur principal dans vos générations musicales.
        </p>
      </div>

      {/* Creation Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#FF7A00]" />
          <span>Créer un nouveau profil vocal</span>
        </h2>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Nom de la voix (ex: Ma Voix Studio, Sarah Soul, Malik Afro)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du profil vocal..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Description ou registre vocal
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Ténor chaleureux avec vibrato léger..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:border-[#2563EB]"
            />
          </div>

          {/* Record / Upload simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  setTimeout(() => {
                    setIsRecording(false);
                    setRecordedAudio(true);
                  }, 2500);
                }
              }}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                isRecording
                  ? 'border-red-500 bg-red-50 text-red-700 animate-pulse'
                  : recordedAudio
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50 text-slate-700'
              }`}
            >
              <Mic className="w-7 h-7 text-[#FF7A00]" />
              <span className="font-extrabold text-xs">
                {isRecording
                  ? 'Enregistrement vocal en cours (parlez)...'
                  : recordedAudio
                  ? 'Échantillon vocal capturé (2.5s)'
                  : 'Enregistrer avec le micro (30s)'}
              </span>
            </button>

            <label className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] bg-slate-50 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors">
              <Upload className="w-7 h-7 text-[#2563EB]" />
              <span className="font-extrabold text-xs text-slate-700">Importer un échantillon WAV / MP3</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={() => setRecordedAudio(true)}
              />
            </label>
          </div>

          {/* Legal Consent Verification (Section 15 STRICT Requirement) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-xs text-amber-900">
                  Déclaration légale et éthique de consentement vocal
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  SITDOWORLD AI MUSIC protège les droits des créateurs. L'imitation d'une personne réelle sans son consentement explicite est formellement interdite.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="w-4 h-4 text-[#FF7A00] accent-[#FF7A00]"
              />
              <span className="text-xs font-black text-amber-950">
                « {consentStatement} »
              </span>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleCreateVoice}
            disabled={isProcessing}
            className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {isProcessing ? 'Entraînement du modèle vocal...' : 'Enregistrer le profil vocal'}
          </button>
        </div>
      </div>

      {/* Voice Profiles List */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-[#0F172A]">Profils Vocaux Actifs ({voices.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {voices.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A]">{v.name}</h4>
                  <p className="text-xs text-[#64748B]">{v.description || 'Voix personnalisée'}</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Certifiée</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
