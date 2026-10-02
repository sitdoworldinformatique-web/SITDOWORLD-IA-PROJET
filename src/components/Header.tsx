import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Compass,
  Music,
  ListMusic,
  SlidersHorizontal,
  Mic,
  LayoutGrid,
  CreditCard,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { User, UserSongBalance } from '../types';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
  user: User | null;
  balance?: UserSongBalance | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  navigate,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const purchasedCount = user?.purchased_domains?.length || 0;
  const isAdmin = user && (user.role === 'admin' || user.role === 'owner');

  // ALL primary SaaS pages clearly defined
  const allPages = [
    { label: 'Coach IA & Accueil', route: '/', icon: Brain, badge: 'IA' },
    { label: 'Découvrir', route: '/discover', icon: Compass },
    { label: 'Studio Création', route: '/create', icon: Sparkles, highlight: true },
    { label: 'Ma Musique', route: '/library', icon: Music },
    { label: 'Playlists', route: '/playlists', icon: ListMusic },
    { label: 'Studio Mixage', route: '/studio', icon: SlidersHorizontal },
    { label: 'Voix IA', route: '/voices', icon: Mic },
    { label: 'Templates', route: '/templates', icon: LayoutGrid },
    { label: 'Tarifs & Packs', route: '/tarifs', icon: CreditCard },
  ];

  if (isAdmin) {
    allPages.push({ label: 'Administration', route: '/admin', icon: ShieldCheck, badge: 'Admin' });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* 1. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left group focus:outline-hidden cursor-pointer"
            id="brand-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-[#0F172A] block leading-none">
                INTELLIGENCE <span className="text-blue-600">AFRICAINE</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 tracking-wide">
                Coach IA & Studio Musical Panafricain
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Primary Nav Bar (Visible on large screens) */}
        <nav className="hidden lg:flex items-center gap-1" id="main-nav">
          {allPages.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/tarifs')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Tarifs</span>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer focus:outline-hidden"
                id="user-profile-menu-button"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-100">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {isAdmin ? 'Admin' : `${purchasedCount} domaine(s)`}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>{isAdmin ? 'Accès Super Admin' : `${purchasedCount} domaine(s) débloqué(s)`}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Mon Profil & Statistiques</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/library');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Music className="w-4 h-4 text-slate-400" />
                      <span>Ma Musique & Créations</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Console Administrateur</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      id="logout-btn"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Connexion
              </button>
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              >
                Inscription
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Secondary Horizontal Navigation Bar: ALL PAGES OF THE SAAS VISIBLE */}
      <div className="border-t border-slate-100 bg-slate-50/70 py-1.5 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1 tracking-wider">
            Pages :
          </span>
          {allPages.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white bg-slate-100/70 border border-transparent hover:border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && !isActive && (
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[9px] font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1.5 max-h-[80vh] overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Toutes les pages du SaaS
          </div>
          {allPages.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(item.route);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[9px] font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/profile');
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>Mon Profil</span>
            </button>
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion ({user.name})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
