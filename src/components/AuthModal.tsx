import React, { useState } from 'react';
import { Sparkles, X, Lock, Mail, User as UserIcon } from 'lucide-react';
import { User, UserSongBalance } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, balance: UserSongBalance) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('creator@sitdoworld.com');
  const [name, setName] = useState('Sitdo Music Creator');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { email, name, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentification échouée.');
      }
      onLoginSuccess(data.user, data.balance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-black text-2xl text-[#0F172A]">
            {isRegister ? 'Créer un compte studio' : 'Connexion créateur'}
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            {isRegister
              ? 'Inscrivez-vous pour obtenir 2 chansons gratuites d’accueil.'
              : 'Accédez à votre bibliothèque et vos stems audio.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Nom d'artiste</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">Adresse email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-[#2563EB]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer"
          >
            {loading ? 'Connexion en cours...' : isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          {isRegister ? (
            <p>
              Déjà inscrit ?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="text-[#2563EB] font-bold hover:underline"
              >
                Se connecter
              </button>
            </p>
          ) : (
            <p>
              Pas encore de compte ?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-[#2563EB] font-bold hover:underline"
              >
                Créer un compte
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
