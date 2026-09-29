import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Headphones,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { User, UserSongBalance } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: User, balance: UserSongBalance) => void;
  onExploreAsGuest: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onExploreAsGuest,
  initialMode = 'register',
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { email: email.trim(), name: name.trim() || 'Sitdo Creator', password }
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
      setErrorMsg(err.message || 'Impossible de se connecter. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoName: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      localStorage.setItem('sitdoworld_logged_in', 'true');
      localStorage.setItem('sitdoworld_user_id', data.user.id);
      onAuthSuccess(data.user, data.balance);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Visual Presentation & Benefits */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-[#FF7A00] text-xs font-black shadow-xs">
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            <span>STUDIO DE PRODUCTION IA MUSICALE</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
              Bienvenue sur <span className="text-[#FF7A00]">SITDOWORLD</span>{' '}
              <span className="text-[#2563EB]">AI MUSIC</span>.
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Créez, arrangez et exportez vos chansons complètes en haute fidélité grâce au studio IA numéro 1 pour les créateurs.
            </p>
          </div>

          {/* Value points */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">
                  2 Chansons Offertes dès l’inscription
                </h4>
                <p className="text-xs text-[#64748B]">
                  Testez immédiatement la génération d'un morceau complet sans carte bancaire obligatoire.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">
                  Studio Multitrack & Stems Séparés
                </h4>
                <p className="text-xs text-[#64748B]">
                  Exportez les pistes voix (vocals), batterie (drums), basse et synthétiseur en qualité WAV master.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">
                  Paiement Mobile Money SASPAY.ME
                </h4>
                <p className="text-xs text-[#64748B]">
                  Paiement à la demande sans abonnement forcé via Orange Money, MTN, Wave et Vodacom M-Pesa.
                </p>
              </div>
            </div>
          </div>

          {/* Guest Link */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] hover:text-blue-700 hover:underline cursor-pointer"
            >
              <span>Continuer d'abord en mode visiteur pour explorer le site</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Authentication Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative">
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
                {isRegister ? 'Inscription Créateur Studio' : 'Connexion à votre Studio'}
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                {isRegister
                  ? 'Rejoignez SITDOWORLD AI MUSIC et recevez 2 chansons complètes gratuites.'
                  : 'Retrouvez votre bibliothèque, vos créations audio et vos crédits de morceaux.'}
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Gift banner for register */}
            {isRegister && (
              <div className="p-3 mb-5 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF7A00] text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>🎁 Cadeau de bienvenue : 2 chansons gratuites créditées dès validation !</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Nom d'artiste / Nom complet
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Amani Beats, Sarah Vocals, Sitdo"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all"
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
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all"
                    id="auth-email-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0F172A]">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all"
                    id="auth-password-input"
                  />
                </div>
              </div>

              {/* Submit CTA */}
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
                    <span>Créer mon compte et recevoir mes 2 chansons</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4" />
                    <span>Se connecter au Studio</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins for fast review */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Accès Rapide en 1 Clic (Comptes de Test)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('creator@sitdoworld.com', 'Créateur Studio')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Compte Créateur</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sitdoworldinformatique@gmail.com', 'Administrateur')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span>Administrateur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
