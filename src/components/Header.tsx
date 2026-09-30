import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Compass,
  Library,
  ListMusic,
  SlidersHorizontal,
  Sliders,
  Mic,
  LayoutGrid,
  CreditCard,
  ShieldCheck,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { User, UserSongBalance } from '../types';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
  user: User | null;
  balance: UserSongBalance | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  navigate,
  user,
  balance,
  onOpenAuth,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const availableSongs = balance?.available_songs ?? 0;
  const hasActivePack = Boolean(user && balance?.has_active_pack && availableSongs > 0);

  // When user has an active pack, show full studio tools. When logged in without pack, show standard tools.
  const navItems = !user
    ? [
        { label: 'Connexion / Inscription', route: '/auth', icon: UserIcon },
      ]
    : hasActivePack
    ? [
        { label: 'Accueil', route: '/', icon: Music },
        { label: 'Découvrir', route: '/discover', icon: Compass },
        { label: 'Studio Création', route: '/create', icon: Sparkles },
        { label: 'Ma musique', route: '/library', icon: Library },
        { label: 'Playlists', route: '/playlists', icon: ListMusic },
        { label: 'Studio Multitrack', route: '/studio', icon: SlidersHorizontal },
        { label: 'Voix', route: '/voices', icon: Mic },
        { label: 'Templates', route: '/templates', icon: LayoutGrid },
        { label: 'Tarifs', route: '/tarifs', icon: CreditCard },
      ]
    : [
        { label: 'Accueil', route: '/', icon: Music },
        { label: 'Découvrir', route: '/discover', icon: Compass },
        { label: 'Tarifs & Packs', route: '/tarifs', icon: CreditCard },
      ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left group focus:outline-hidden"
            id="brand-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#FF7A00] flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[#0F172A] block leading-none">
                SITDOWORLD <span className="text-[#FF7A00]">AI MUSIC</span>
              </span>
              <span className="text-[11px] font-medium text-[#64748B] tracking-wide">
                AI Music Studio for Creators
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 ml-4" id="main-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-[#2563EB] bg-[#EFF6FF]'
                      : 'text-[#0F172A] hover:text-[#2563EB] hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Balance, Notifs, Profile, CTA */}
        <div className="flex items-center gap-3">
          {/* Song Balance Badge (Only displayed when user has purchased credits) */}
          {user ? (
            <button
              onClick={() => navigate('/tarifs')}
              title="Cliquez pour voir les packs ou recharger vos crédits de chansons"
              id="header-balance-badge"
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                availableSongs === 0
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-[#EFF6FF] text-[#2563EB] border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availableSongs > 0 ? 'bg-[#FF7A00] animate-pulse' : 'bg-slate-400'}`}></span>
              <span>
                {availableSongs} {availableSongs > 1 ? 'chansons' : 'chanson'} restante{availableSongs > 1 ? 's' : ''}
              </span>
              {availableSongs === 0 && (
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                  Pack requis
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              title="Se connecter"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
              id="header-notif-btn"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7A00] rounded-full"></span>
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-bold text-sm text-[#0F172A]">Notifications</span>
                  <span className="text-[11px] text-[#2563EB] font-semibold cursor-pointer">Tout marquer lu</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-[#EFF6FF] rounded-lg text-slate-700">
                    <p className="font-semibold text-[#0F172A]">🎉 Bienvenue sur SITDOWORLD AI MUSIC</p>
                    <p className="text-slate-500 mt-0.5">Votre studio IA musical pour créer des morceaux complets.</p>
                  </div>
                  <div className="p-2 hover:bg-slate-50 rounded-lg text-slate-700">
                    <p className="font-semibold text-[#0F172A]">⚡ Studio Multitrack disponible</p>
                    <p className="text-slate-500 mt-0.5">Éditez les stems audio (Vocals, Drums, Bass, Synth) en temps réel.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile or Login CTA */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                id="header-profile-btn"
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-orange-400"
                />
                <span className="hidden md:inline text-xs font-bold text-[#0F172A] max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Connecté en tant que</p>
                  <p className="font-bold text-sm text-[#0F172A] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center gap-2 font-medium"
                >
                  <UserIcon className="w-4 h-4" /> Mon profil créateur
                </button>
                <button
                  onClick={() => {
                    navigate('/pricing');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center gap-2 font-medium"
                >
                  <CreditCard className="w-4 h-4" /> Acheter des chansons ({availableSongs} dispo)
                </button>
                <button
                  onClick={() => {
                    navigate('/admin');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-orange-700 hover:bg-orange-50 flex items-center gap-2 font-bold"
                >
                  <Sliders className="w-4 h-4 text-orange-600" /> Paramètres du SaaS
                </button>
                <button
                  onClick={() => {
                    navigate('/admin');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-semibold"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Tableau de Bord Admin
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    onLogout();
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            id="header-login-btn"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Connexion / Inscription</span>
          </button>
        )}

          {/* Primary Action Button: + CRÉER if hasActivePack, else Acheter un Pack */}
          {hasActivePack ? (
            <button
              onClick={() => navigate('/create')}
              id="header-create-btn"
              className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm tracking-wide shadow-md shadow-orange-500/25 active:scale-98 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ CRÉER</span>
            </button>
          ) : (
            <button
              onClick={() => navigate(user ? '/tarifs' : '/auth')}
              id="header-buy-pack-btn"
              className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm tracking-wide shadow-md shadow-orange-500/25 active:scale-98 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Acheter un Pack</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#0F172A]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => {
                  navigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
                  isActive
                    ? 'text-[#2563EB] bg-[#EFF6FF]'
                    : 'text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                navigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Administration
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
