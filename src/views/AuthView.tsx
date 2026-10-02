import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Lock,
  Mail,
  User as UserIcon,
  Headphones,
  Wand2,
  Disc3,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { User, UserSongBalance } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: User, balance: UserSongBalance) => void;
  initialMode?: 'login' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  initialMode = 'register',
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResetSuccessMessage(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { email: email.trim(), name: name.trim() || 'Créateur', password }
      : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’authentification.');
      }

      // Persist session
      if (data.user?.id) {
        localStorage.setItem('sitdoworld_logged_in', 'true');
        localStorage.setItem('sitdoworld_user_id', data.user.id);
      }

      onAuthSuccess(data.user, data.balance);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de se connecter. Veuillez vérifier vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Veuillez saisir votre adresse email.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la demande de réinitialisation.');
      setResetSuccessMessage('Un lien de réinitialisation sécurisé a été transmis à votre adresse email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de traiter la demande pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Platform Presentation for African Project Leaders */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-black shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>COACHING IA & TRANSFORMATION DES PROJETS</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
              Bienvenue sur <span className="text-blue-600">INTELLIGENCE</span>{' '}
              <span className="text-[#0F172A]">AFRICAINE</span>.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Votre coach IA pour apprendre, développer et transformer vos projets en Afrique. Accédez à des expertises concrètes et adaptées aux réalités économiques locales.
            </p>
          </div>

          {/* Key value propositions for the 5 coaching domains */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">
                  5 Domaines Stratégiques Panafricains
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Agriculture tropicale, Aviculture & Élevage rentable, Devis & BTP, Informatique & Mobile Money, et Commerce/Importation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">
                  Conseils Concrets et Chiffrés
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Fini la théorie abstraite : obtenez des calendriers culturaux, des formulations d'aliments locaux et des métrés de chantier réalistes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">
                  Interaction Vocale & Écrite Intuitive
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Discutez en direct au clavier ou par microphone avec synthèse vocale instantanée inspirée de l'ergonomie de ChatGPT.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Authentication Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative">
            {!isForgotPassword ? (
              <>
                {/* Top Toggle: Inscription vs Connexion */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isRegister
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    id="auth-tab-register"
                  >
                    Créer un compte
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      !isRegister
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    id="auth-tab-login"
                  >
                    Se connecter
                  </button>
                </div>

                {/* Header info */}
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#0F172A]">
                    {isRegister ? 'Inscription Créateur' : 'Connexion à votre Espace'}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    {isRegister
                      ? 'Créez votre profil pour accéder au studio de création musicale.'
                      : 'Saisissez vos identifiants pour reprendre vos compositions.'}
                  </p>
                </div>

                {/* Error banner */}
                {errorMsg && (
                  <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in">
                    {errorMsg}
                  </div>
                )}

                {/* Authentication Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#0F172A]">
                        Nom d'artiste ou Nom complet
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: David Beats, Aïcha Vocals"
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all text-[#0F172A]"
                          id="auth-name-input"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#0F172A]">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre.email@exemple.com"
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all text-[#0F172A]"
                        id="auth-email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#0F172A]">
                        Mot de passe
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setErrorMsg(null);
                            setResetSuccessMessage(null);
                          }}
                          className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all text-[#0F172A]"
                        id="auth-password-input"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
                    id="auth-submit-btn"
                  >
                    {loading ? (
                      <span>Chargement en cours...</span>
                    ) : isRegister ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Créer mon compte</span>
                      </>
                    ) : (
                      <>
                        <Music className="w-4 h-4" />
                        <span>Se connecter</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Password Reset Sub-flow */
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h2 className="text-2xl font-black text-[#0F172A]">
                    Récupération de mot de passe
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Indiquez votre adresse email pour recevoir les instructions de réinitialisation.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {resetSuccessMessage ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{resetSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setIsRegister(false);
                        setResetSuccessMessage(null);
                      }}
                      className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#0F172A]">
                        Adresse email de votre compte
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="votre.email@exemple.com"
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all text-[#0F172A]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setErrorMsg(null);
                      }}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer pt-2"
                    >
                      Retourner à la connexion
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
