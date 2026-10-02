import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Music,
  Heart,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Wand2,
  Clock,
  Play,
  Pause,
  SlidersHorizontal,
  Brain,
  ArrowRight,
  TrendingUp,
  Activity,
  Filter,
  ShoppingBag,
} from 'lucide-react';
import { User, UserSongBalance, Song, SongTransaction, UserActivity, ActivityType } from '../types';
import { SongCard } from '../components/SongCard';
import { COACHING_DOMAINS } from '../data/coachingDomains';

interface ProfileViewProps {
  user: User | null;
  balance: UserSongBalance | null;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenStudio: (song: Song) => void;
  navigate: (route: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  balance,
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenStudio,
  navigate,
}) => {
  const [activeTab, setActiveTab] = useState<'creations' | 'liked' | 'activity'>('activity');
  const [activityFilter, setActivityFilter] = useState<'all' | 'creation' | 'remix' | 'purchase'>('all');
  const [transactions, setTransactions] = useState<SongTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const effectiveUserId = user?.id || 'user-default-1';

  // Songs created by the user
  const creatorSongs = useMemo(() => {
    return songs.filter((s) => s.creator_id === user?.id || s.creator_id === 'user-default-1');
  }, [songs, user]);

  // Liked songs
  const likedSongs = useMemo(() => {
    return songs.filter((s) => s.is_favorite);
  }, [songs]);

  // Fetch transactions on mount
  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const res = await fetch(`/api/user/transactions?userId=${encodeURIComponent(effectiveUserId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.transactions && Array.isArray(data.transactions)) {
            setTransactions(data.transactions);
          }
        }
      } catch (err) {
        console.warn('Error fetching transactions:', err);
      } finally {
        if (isMounted) setLoadingTransactions(false);
      }
    };

    fetchTransactions();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  // Build aggregated Recent Activity feed
  const activities: UserActivity[] = useMemo(() => {
    const list: UserActivity[] = [];

    // 1. Add Song Creations & Remixes from user's songs
    creatorSongs.forEach((song) => {
      const isRemix = song.version_tag === 'REMIX' || song.title.toLowerCase().includes('remix');
      if (isRemix) {
        list.push({
          id: `act-remix-${song.id}`,
          type: 'remix',
          title: `Remix produit : ${song.title}`,
          description: `Variation remixée avec sonorités dynamiques dans le style ${song.genre}.`,
          timestamp: song.created_at,
          song,
        });
      } else {
        list.push({
          id: `act-song-${song.id}`,
          type: 'creation',
          title: `Chanson créée : ${song.title}`,
          description: `Masterisation complète en studio HD • ${song.genre} (${song.bpm || 104} BPM, ${song.key || 'F# Minor'}).`,
          timestamp: song.created_at,
          song,
        });
      }
    });

    // 2. Add Transactions & Purchases
    transactions.forEach((tx) => {
      if (tx.type === 'PURCHASE') {
        list.push({
          id: `act-tx-${tx.id}`,
          type: 'purchase',
          title: `Achat Pack : +${tx.amount} chansons créditées`,
          description: `Paiement Mobile Money validé avec succès (Réf: ${tx.reference}).`,
          timestamp: tx.created_at,
          amount: tx.amount,
          reference: tx.reference,
        });
      } else if (tx.type === 'GENERATION') {
        // Generation debit transaction
        list.push({
          id: `act-gen-${tx.id}`,
          type: 'creation',
          title: `Création musicale : 1 crédit consommé`,
          description: `Production studio initiée via ${tx.reference}.`,
          timestamp: tx.created_at,
          reference: tx.reference,
        });
      }
    });

    // 3. Add Domain Purchases
    if (user?.purchased_domains && Array.isArray(user.purchased_domains)) {
      user.purchased_domains.forEach((domId) => {
        const dom = COACHING_DOMAINS.find((d) => d.id === domId);
        list.push({
          id: `act-dom-${domId}`,
          type: 'domain_purchase',
          title: `Domaine débloqué : ${dom?.name || domId.toUpperCase()}`,
          description: `Accès premium illimité au coach IA dédié (${dom?.coachName || 'Expert'}).`,
          timestamp: user.created_at || new Date().toISOString(),
          domainId: domId,
          domainName: dom?.name,
        });
      });
    }

    // Sort chronologically (most recent first)
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return list;
  }, [creatorSongs, transactions, user]);

  // Filter activities based on active pill
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    if (activityFilter === 'purchase') {
      return activities.filter((a) => a.type === 'purchase' || a.type === 'domain_purchase');
    }
    return activities.filter((a) => a.type === activityFilter);
  }, [activities, activityFilter]);

  // Format relative timestamp
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-28">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl bg-radial from-[#EFF6FF] to-white border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={user?.name || 'Utilisateur'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%232563EB"/%3E%3Ctext x="50" y="55" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle"%3EIA%3C/text%3E%3C/svg%3E';
              }}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                  {user?.name || 'Créateur INTELLIGENCE AFRICAINE'}
                </h1>
                <span className="p-1 rounded-full bg-blue-100 text-[#2563EB]" title="Créateur Certifié">
                  <CheckCircle2 className="w-4 h-4 fill-current text-[#2563EB]" />
                </span>
              </div>
              <p className="text-xs font-semibold text-[#64748B] mt-0.5">
                @{user?.username || 'sitdoworld'} • {user?.email || 'sitdoworldinformatique@gmail.com'}
              </p>
              <p className="text-xs text-slate-700 mt-2 max-w-md">
                {user?.bio || 'Entrepreneur et créateur de projets avec INTELLIGENCE AFRICAINE.'}
              </p>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs font-bold text-slate-600">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                  <strong className="text-blue-600">{creatorSongs.length}</strong> morceaux créés
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                  <strong className="text-blue-600">{balance?.available_songs ?? 8}</strong> chansons dispos
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                  <strong className="text-emerald-700">{user?.purchased_domains?.length || 0}</strong> domaine(s)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800">
                  <strong className="text-amber-700">{activities.length}</strong> actions enregistrées
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/tarifs')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Acheter des Packs</span>
            </button>
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Nouveau Morceau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs (Including Recent Activity Feed) */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
          }`}
          id="tab-recent-activity"
        >
          <Activity className="w-4 h-4" />
          <span>Activité Récente</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'activity' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {activities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'creations'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
          }`}
          id="tab-creations"
        >
          <Music className="w-4 h-4" />
          <span>Morceaux Publiés</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'creations' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {creatorSongs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'liked'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
          }`}
          id="tab-liked"
        >
          <Heart className="w-4 h-4" />
          <span>Favoris</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'liked' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {likedSongs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RECENT ACTIVITY FEED */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Activity Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                Filtrer par :
              </span>
              {[
                { id: 'all', label: 'Toutes les actions' },
                { id: 'creation', label: '🎵 Créations' },
                { id: 'remix', label: '🎛️ Remixes' },
                { id: 'purchase', label: '💳 Achats & Packs' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActivityFilter(pill.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === pill.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-semibold">
              {filteredActivities.length} action{filteredActivities.length > 1 ? 's' : ''} trouvée
              {filteredActivities.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Activity Timeline List */}
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Aucune activité dans cette catégorie</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Commencez par générer un premier morceau ou découvrez les packs de création disponibles.
              </p>
              <button
                onClick={() => navigate('/create')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
              >
                Lancer une création
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((act) => {
                const song = act.song;
                const isCurrentPlaying = Boolean(isPlaying && song && currentSong?.id === song.id);

                return (
                  <div
                    key={act.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Icon, Cover & Info */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      {/* Activity Type Badge Icon */}
                      <div className="shrink-0 mt-0.5 sm:mt-0">
                        {act.type === 'creation' && (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        )}
                        {act.type === 'remix' && (
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                            <Wand2 className="w-5 h-5" />
                          </div>
                        )}
                        {act.type === 'purchase' && (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        )}
                        {act.type === 'domain_purchase' && (
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                            <Brain className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Song thumbnail if present */}
                      {song && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-xs hidden sm:block">
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <button
                            onClick={() => onPlaySong(song)}
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            {isCurrentPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                          </button>
                        </div>
                      )}

                      {/* Content details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                            {act.title}
                          </h4>
                          {act.type === 'remix' && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase">
                              Remix
                            </span>
                          )}
                          {act.type === 'creation' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                              Original
                            </span>
                          )}
                          {act.type === 'purchase' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                              Crédit
                            </span>
                          )}
                          {act.type === 'domain_purchase' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                              Coach IA
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-1">
                          {act.description}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimestamp(act.timestamp)}
                          </span>
                          {act.reference && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-500">{act.reference}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Contextual Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {song && (
                        <>
                          <button
                            onClick={() => onPlaySong(song)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isCurrentPlaying
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600'
                            }`}
                          >
                            {isCurrentPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>{isCurrentPlaying ? 'Pause' : 'Écouter'}</span>
                          </button>

                          <button
                            onClick={() => onOpenStudio(song)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Ouvrir dans le Studio Multitrack"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Studio</span>
                          </button>
                        </>
                      )}

                      {act.type === 'purchase' && (
                        <button
                          onClick={() => navigate('/tarifs')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Recharger</span>
                        </button>
                      )}

                      {act.type === 'domain_purchase' && (
                        <button
                          onClick={() => navigate('/')}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Brain className="w-3.5 h-3.5 text-amber-700" />
                          <span>Consulter</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLISHED SONGS */}
      {activeTab === 'creations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Morceaux créés par vous ({creatorSongs.length})
            </h3>
            <button
              onClick={() => navigate('/create')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Créer un nouveau morceau</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {creatorSongs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <Music className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">Aucun morceau composé pour le moment.</p>
              <button
                onClick={() => navigate('/create')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Composer mon premier titre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {creatorSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isPlaying={isPlaying && currentSong?.id === song.id}
                  onPlay={onPlaySong}
                  onOpenStudio={onOpenStudio}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAVORITES */}
      {activeTab === 'liked' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Vos Favoris ({likedSongs.length})</h3>
            <button
              onClick={() => navigate('/discover')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explorer d'autres titres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {likedSongs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">Aucun morceau ajouté aux favoris.</p>
              <button
                onClick={() => navigate('/discover')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Découvrir des morceaux
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {likedSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isPlaying={isPlaying && currentSong?.id === song.id}
                  onPlay={onPlaySong}
                  onOpenStudio={onOpenStudio}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
