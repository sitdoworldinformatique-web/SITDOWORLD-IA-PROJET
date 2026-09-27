import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { AuthModal } from './components/AuthModal';

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

import { User, UserSongBalance, Song, Playlist, Plan, PromptTemplate, VoiceProfile } from './types';

export function App() {
  // Navigation
  const [currentRoute, setCurrentRoute] = useState<string>('/');

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
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
      if (data.balance) setBalance(data.balance);
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

  // Cross actions
  const handleOpenStudio = (song: Song) => {
    setStudioTargetSong(song);
    setCurrentRoute('/studio');
  };

  const handleSelectGenre = (genre: string) => {
    setPrefillCreateGenre(genre);
    setCurrentRoute('/create');
  };

  const handleUseTemplate = (template: PromptTemplate) => {
    setPrefillCreateGenre(template.genre);
    setPrefillCreatePrompt(template.prompt);
    setCurrentRoute('/create');
  };

  const handleRemix = (song: Song) => {
    setPrefillCreatePrompt(`Remix officiel de "${song.title}" avec sonorités festives et basses percutantes.`);
    setPrefillCreateGenre(song.genre);
    setCurrentRoute('/create');
  };

  const handleExtend = (song: Song) => {
    setPrefillCreatePrompt(`Extension instrumentale et montée d'énergie pour la chanson "${song.title}".`);
    setPrefillCreateGenre(song.genre);
    setCurrentRoute('/create');
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
    setCurrentRoute('/payment');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentRoute={currentRoute}
        navigate={(r) => setCurrentRoute(r)}
        user={user}
        balance={balance}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          refreshUserData();
        }}
      />

      {/* Main Container View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentRoute === '/' && (
          <HomeView
            navigate={(r) => setCurrentRoute(r)}
            songs={songs}
            playlists={playlists}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onSelectGenre={handleSelectGenre}
            onOpenStudio={handleOpenStudio}
          />
        )}

        {currentRoute === '/discover' && (
          <DiscoverView
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onOpenStudio={handleOpenStudio}
            onRemixSong={handleRemix}
          />
        )}

        {currentRoute === '/create' && (
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
            navigate={(r) => setCurrentRoute(r)}
            prefillGenre={prefillCreateGenre}
            prefillPrompt={prefillCreatePrompt}
          />
        )}

        {currentRoute === '/library' && (
          <LibraryView
            songs={songs}
            currentUserId={user?.id || 'user-default-1'}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onOpenStudio={handleOpenStudio}
            onRemixSong={handleRemix}
            onExtendSong={handleExtend}
            onDeleteSong={handleDeleteSong}
            navigate={(r) => setCurrentRoute(r)}
          />
        )}

        {currentRoute === '/playlists' && (
          <PlaylistsView
            playlists={playlists}
            onPlaySong={handlePlaySong}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onOpenStudio={handleOpenStudio}
          />
        )}

        {currentRoute === '/studio' && (
          <StudioView
            song={studioTargetSong || currentSong}
            onRemix={handleRemix}
            onExtend={handleExtend}
          />
        )}

        {currentRoute === '/voices' && (
          <VoicesView
            voices={voices}
            onVoiceCreated={(v) => setVoices([v, ...voices])}
          />
        )}

        {currentRoute === '/templates' && (
          <TemplatesView
            templates={templates}
            onUseTemplate={handleUseTemplate}
          />
        )}

        {currentRoute === '/pricing' && (
          <PricingView
            plans={plans}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {currentRoute === '/payment' && (
          <PaymentView
            plan={selectedPlanForPayment || plans[1] || null}
            onBack={() => setCurrentRoute('/pricing')}
            onSuccess={(newBal) => {
              setBalance(newBal);
              refreshUserData();
            }}
            navigate={(r) => setCurrentRoute(r)}
          />
        )}

        {currentRoute === '/profile' && (
          <ProfileView
            user={user}
            balance={balance}
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onOpenStudio={handleOpenStudio}
            navigate={(r) => setCurrentRoute(r)}
          />
        )}

        {currentRoute === '/admin' && <AdminView />}
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
          setUser(u);
          setBalance(b);
        }}
      />
    </div>
  );
}
export default App;
