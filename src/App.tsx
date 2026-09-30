import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { AuthModal } from './components/AuthModal';

import { AuthView } from './views/AuthView';
import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { CreateView } from './views/CreateView';
import { LibraryView } from './views/LibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { StudioView } from './views/StudioView';
import { VoicesView } from './views/VoicesView';
import { TemplatesView } from './views/TemplatesView';
import { PricingView } from './views/PricingView';
import { PaymentView } from './views/PaymentView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { StudioLockedGate } from './components/StudioLockedGate';

import { User, UserSongBalance, Song, Playlist, Plan, PromptTemplate, VoiceProfile } from './types';

export function App() {
  // Navigation: unauthenticated visitors arrive on the registration/login page first
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('sitdoworld_logged_in') === 'true';
      return isLoggedIn ? '/' : '/auth';
    }
    return '/auth';
  });

  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<UserSongBalance | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);

  // Audio Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Cross-view contextual state
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [prefillCreateGenre, setPrefillCreateGenre] = useState<string | undefined>();
  const [prefillCreatePrompt, setPrefillCreatePrompt] = useState<string | undefined>();
  const [studioTargetSong, setStudioTargetSong] = useState<Song | null>(null);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Initial Data Fetch
  const refreshUserData = async () => {
    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('sitdoworld_user_id') : null;
      const url = storedUserId ? `/api/auth/me?userId=${encodeURIComponent(storedUserId)}` : '/api/auth/me';
      const res = await fetch(url);
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.balance) setBalance(data.balance);
      } else {
        // If server says no user, wipe local credentials
        setUser(null);
        setBalance(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sitdoworld_logged_in');
          localStorage.removeItem('sitdoworld_user_id');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.songs) {
        setSongs(data.songs);
        if (!currentSong && data.songs.length > 0) {
          setCurrentSong(data.songs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllData = async () => {
    refreshUserData();
    fetchSongs();

    try {
      const [plRes, pRes, tRes, vRes] = await Promise.all([
        fetch('/api/playlists').then((r) => r.json()),
        fetch('/api/plans').then((r) => r.json()),
        fetch('/api/templates').then((r) => r.json()),
        fetch('/api/voices').then((r) => r.json()),
      ]);

      if (plRes.playlists) setPlaylists(plRes.playlists);
      if (pRes.plans) setPlans(pRes.plans);
      if (tRes.templates) setTemplates(tRes.templates);
      if (vRes.voices) setVoices(vRes.voices);
    } catch (err) {
      console.error('Error fetching global platform state:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Strict route protection guard
  // If user is unauthenticated, redirect unconditionally to /auth or /login
  useEffect(() => {
    const isLoggedIn = Boolean(user) || (typeof window !== 'undefined' && localStorage.getItem('sitdoworld_logged_in') === 'true');
    const isPublicAuthRoute = currentRoute === '/auth' || currentRoute === '/login' || currentRoute === '/register';

    if (!isLoggedIn && !isPublicAuthRoute) {
      setCurrentRoute('/auth');
    }
  }, [user, currentRoute]);

  // Centralized route navigator with protection
  const navigate = useCallback((targetRoute: string) => {
    let normalized = targetRoute;
    if (normalized === '/pricing') normalized = '/tarifs';
    if (normalized === '/dashboard') normalized = '/profile';
    if (normalized === '/achat') normalized = '/payment';

    const isLoggedIn = Boolean(user) || (typeof window !== 'undefined' && localStorage.getItem('sitdoworld_logged_in') === 'true');
    const isPublicAuthRoute = normalized === '/auth' || normalized === '/login' || normalized === '/register';

    if (!isLoggedIn && !isPublicAuthRoute) {
      setCurrentRoute('/auth');
      return;
    }

    setCurrentRoute(normalized);
  }, [user]);

  // Player controls
  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      fetch(`/api/songs/${song.id}/play`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleNextSong = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePreviousSong = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const hasActivePack = Boolean(user && balance?.has_active_pack && (balance?.available_songs ?? 0) > 0);

  // Cross actions guarded by pack ownership
  const handleOpenStudio = (song: Song) => {
    if (!hasActivePack) {
      handleSelectPlan(plans[1] || plans[0]);
      return;
    }
    setStudioTargetSong(song);
    navigate('/studio');
  };

  const handleSelectGenre = (genre: string) => {
    if (!hasActivePack) {
      handleSelectPlan(plans[1] || plans[0]);
      return;
    }
    setPrefillCreateGenre(genre);
    navigate('/create');
  };

  const handleUseTemplate = (template: PromptTemplate) => {
    if (!hasActivePack) {
      handleSelectPlan(plans[1] || plans[0]);
      return;
    }
    setPrefillCreateGenre(template.genre);
    setPrefillCreatePrompt(template.prompt);
    navigate('/create');
  };

  const handleRemix = (song: Song) => {
    if (!hasActivePack) {
      handleSelectPlan(plans[1] || plans[0]);
      return;
    }
    setPrefillCreatePrompt(`Remix officiel de "${song.title}" avec sonorités festives et basses percutantes.`);
    setPrefillCreateGenre(song.genre);
    navigate('/create');
  };

  const handleExtend = (song: Song) => {
    if (!hasActivePack) {
      handleSelectPlan(plans[1] || plans[0]);
      return;
    }
    setPrefillCreatePrompt(`Extension instrumentale et montée d'énergie pour la chanson "${song.title}".`);
    setPrefillCreateGenre(song.genre);
    navigate('/create');
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      await fetch(`/api/songs/${songId}`, { method: 'DELETE' });
      setSongs(songs.filter((s) => s.id !== songId));
      if (currentSong?.id === songId) {
        setIsPlaying(false);
        setCurrentSong(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanForPayment(plan);
    navigate('/payment');
  };

  // Auth Success Handler: user lands immediately on Accueil '/'
  const handleAuthSuccess = (u: User, b: UserSongBalance) => {
    setUser(u);
    setBalance(b);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sitdoworld_logged_in', 'true');
      localStorage.setItem('sitdoworld_user_id', u.id);
    }
    setCurrentRoute('/');
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sitdoworld_logged_in');
      localStorage.removeItem('sitdoworld_user_id');
    }
    setUser(null);
    setBalance(null);
    setCurrentRoute('/auth');
  };

  const isAuthRoute = currentRoute === '/auth' || currentRoute === '/login' || currentRoute === '/register';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentRoute={currentRoute}
        navigate={navigate}
        user={user}
        balance={balance}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Registration or Login Page (Gateway before Home View) */}
        {isAuthRoute && (
          <AuthView
            initialMode={currentRoute === '/login' ? 'login' : 'register'}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* Home View (Requires Authentication) */}
        {currentRoute === '/' && user && (
          <HomeView
            navigate={navigate}
            songs={songs}
            playlists={playlists}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onSelectGenre={handleSelectGenre}
            onOpenStudio={hasActivePack ? handleOpenStudio : undefined}
            hasActivePack={hasActivePack}
          />
        )}

        {currentRoute === '/discover' && user && (
          <DiscoverView
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onOpenStudio={hasActivePack ? handleOpenStudio : undefined}
            onRemixSong={hasActivePack ? handleRemix : () => handleSelectPlan(plans[1] || plans[0])}
          />
        )}

        {currentRoute === '/create' && user && (
          <CreateView
            balance={balance}
            onGenerationFinished={() => {
              refreshUserData();
              fetchSongs();
            }}
            onOpenStudio={handleOpenStudio}
            onPlaySong={handlePlaySong}
            currentSong={currentSong}
            isPlaying={isPlaying}
            navigate={navigate}
            prefillGenre={prefillCreateGenre}
            prefillPrompt={prefillCreatePrompt}
            plans={plans}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {currentRoute === '/library' && user && (
          <LibraryView
            songs={songs}
            currentUserId={user?.id || 'user-default-1'}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onOpenStudio={hasActivePack ? handleOpenStudio : () => handleSelectPlan(plans[1] || plans[0])}
            onRemixSong={hasActivePack ? handleRemix : () => handleSelectPlan(plans[1] || plans[0])}
            onExtendSong={hasActivePack ? handleExtend : () => handleSelectPlan(plans[1] || plans[0])}
            onDeleteSong={handleDeleteSong}
            navigate={navigate}
          />
        )}

        {currentRoute === '/playlists' && user && (
          <PlaylistsView
            playlists={playlists}
            onPlaySong={handlePlaySong}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onOpenStudio={hasActivePack ? handleOpenStudio : () => handleSelectPlan(plans[1] || plans[0])}
          />
        )}

        {currentRoute === '/studio' && user && (
          hasActivePack ? (
            <StudioView
              song={studioTargetSong || currentSong}
              onRemix={handleRemix}
              onExtend={handleExtend}
            />
          ) : (
            <StudioLockedGate
              plans={plans}
              onSelectPlan={handleSelectPlan}
              navigate={navigate}
              title="Accès au Studio Multitrack Réservé"
            />
          )
        )}

        {currentRoute === '/voices' && user && (
          hasActivePack ? (
            <VoicesView
              voices={voices}
              onVoiceCreated={(v) => setVoices([v, ...voices])}
            />
          ) : (
            <StudioLockedGate
              plans={plans}
              onSelectPlan={handleSelectPlan}
              navigate={navigate}
              title="Accès au Studio Vocal Réservé"
            />
          )
        )}

        {currentRoute === '/templates' && user && (
          hasActivePack ? (
            <TemplatesView
              templates={templates}
              onUseTemplate={handleUseTemplate}
            />
          ) : (
            <StudioLockedGate
              plans={plans}
              onSelectPlan={handleSelectPlan}
              navigate={navigate}
              title="Accès aux Templates Studio Réservé"
            />
          )
        )}

        {/* The SINGLE Official Pricing Page (/tarifs and /pricing) */}
        {(currentRoute === '/tarifs' || currentRoute === '/pricing') && user && (
          <PricingView
            plans={plans}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {currentRoute === '/payment' && user && (
          <PaymentView
            plan={selectedPlanForPayment || plans[1] || null}
            onBack={() => navigate('/tarifs')}
            onSuccess={(newBal) => {
              setBalance(newBal);
              refreshUserData();
            }}
            navigate={navigate}
          />
        )}

        {(currentRoute === '/profile' || currentRoute === '/dashboard') && user && (
          <ProfileView
            user={user}
            balance={balance}
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onOpenStudio={handleOpenStudio}
            navigate={navigate}
          />
        )}

        {currentRoute === '/admin' && user && <AdminView />}
      </main>

      {/* Global Persistent Audio Player */}
      <GlobalAudioPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={handleNextSong}
        onPrevious={handlePreviousSong}
        onOpenStudio={handleOpenStudio}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u, b) => {
          handleAuthSuccess(u, b);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
export default App;
