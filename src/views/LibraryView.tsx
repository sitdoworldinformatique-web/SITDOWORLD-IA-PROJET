import React, { useState } from 'react';
import {
  Library,
  Heart,
  FileText,
  Clock,
  Sparkles,
  Sliders,
  Share2,
  Trash2,
  Download,
  Scissors,
  Play,
  Pause,
  Tag,
} from 'lucide-react';
import { Song } from '../types';

interface LibraryViewProps {
  songs: Song[];
  currentUserId: string;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenStudio: (song: Song) => void;
  onRemixSong: (song: Song) => void;
  onExtendSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onToggleFavorite?: (songId: string) => void;
  onShare?: (song: Song) => void;
  navigate: (route: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  songs,
  currentUserId,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenStudio,
  onRemixSong,
  onExtendSong,
  onDeleteSong,
  onToggleFavorite,
  onShare,
  navigate,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'drafts' | 'liked' | 'recent'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('Tous');

  // Filter songs belonging to user or created
  const userSongs = songs.filter((s) => s.creator_id === currentUserId || s.creator_id === 'user-default-1');

  const availableTags = [
    'Tous',
    'Favoris ❤️',
    'Chill',
    'Workout',
    'Lo-fi',
    'Afrobeat',
    'Amapiano',
    'Romance',
    'Party',
    'Focus',
  ];

  const filtered = userSongs.filter((s) => {
    // 1. Tab filter
    if (activeTab === 'drafts' && !(s.title.toLowerCase().includes('draft') || s.title.toLowerCase().includes('brouillon'))) {
      return false;
    }
    if (activeTab === 'liked' && !s.is_favorite && s.likes_count === 0) {
      return false;
    }

    // 2. Tag filter
    if (selectedTag === 'Tous') return true;
    if (selectedTag === 'Favoris ❤️') return Boolean(s.is_favorite);

    const cleanTag = selectedTag.toLowerCase();
    const matchesTag = s.tags && s.tags.some((t) => t.toLowerCase() === cleanTag);
    const matchesGenre = s.genre.toLowerCase() === cleanTag;
    const matchesMood = s.mood.toLowerCase().includes(cleanTag);

    return matchesTag || matchesGenre || matchesMood;
  });

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            Ma Musique & Bibliothèque
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Gérez vos créations originales, vos pistes favorites, stems multitrack et remixes.
          </p>
        </div>

        <button
          onClick={() => navigate('/create')}
          className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-all active:scale-98"
        >
          <Sparkles className="w-4 h-4" />
          <span>Nouvelle création</span>
        </button>
      </div>

      {/* Primary Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Toutes les créations', count: userSongs.length, icon: Library },
          { id: 'songs', label: 'Morceaux', count: userSongs.length, icon: Library },
          { id: 'drafts', label: 'Brouillons & Variantes', count: Math.floor(userSongs.length / 2), icon: FileText },
          { id: 'liked', label: 'Favoris', count: userSongs.filter((s) => s.is_favorite || s.likes_count > 0).length, icon: Heart },
          { id: 'recent', label: 'Récents', count: userSongs.length, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'liked') setSelectedTag('Tous');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.id === 'liked' ? 'text-red-400 fill-current' : ''}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tag Filters Bar (User Request: Chill, Lo-fi, Workout, etc.) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Tags:
        </span>
        {availableTags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tag.startsWith('Favoris') ? '❤️ Favoris' : `#${tag}`}
            </button>
          );
        })}
      </div>

      {/* Songs Table / List */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filtered.map((song) => {
            const isSongActive = isPlaying && currentSong?.id === song.id;
            const isFav = Boolean(song.is_favorite);

            return (
              <div
                key={song.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Left: Info, Cover & Play */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative group shrink-0">
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <button
                      onClick={() => onPlaySong(song)}
                      className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isSongActive ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => onPlaySong(song)}
                        className="font-extrabold text-sm text-[#0F172A] hover:text-[#2563EB] cursor-pointer truncate"
                      >
                        {song.title}
                      </h3>
                      {song.version_tag && song.version_tag !== 'VERSION A' && song.version_tag !== 'VERSION B' && song.version_tag !== 'ORIGINAL' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-100 text-[#FF7A00] shrink-0">
                          {song.version_tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] truncate mt-0.5 max-w-xl">
                      {song.prompt}
                    </p>

                    {/* Metadata line + Dynamic Tags */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                      <span className="font-semibold text-[#2563EB]">{song.genre}</span>
                      <span>•</span>
                      <span>{song.bpm} BPM</span>
                      <span>•</span>
                      <span>{formatDuration(song.duration)}</span>
                      <span>•</span>
                      <span>{song.plays_count} écoutes</span>

                      {/* Tag Badges */}
                      {song.tags && song.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex flex-wrap gap-1">
                            {song.tags.map((t) => (
                              <button
                                key={t}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(t);
                                }}
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#2563EB] transition-colors cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {/* Heart / Favorite Button */}
                  {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(song.id)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  {/* Share Button */}
                  {onShare && (
                    <button
                      onClick={() => onShare(song)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Partager ce morceau"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onPlaySong(song)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSongActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isSongActive ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => onOpenStudio(song)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Ouvrir dans le Studio Multitrack"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Studio</span>
                  </button>

                  <button
                    onClick={() => onRemixSong(song)}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF7A00] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Créer un Remix"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Remix</span>
                  </button>

                  <button
                    onClick={() => onExtendSong(song)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Étendre le morceau"
                  >
                    <Scissors className="w-4 h-4" />
                  </button>

                  <a
                    href={song.audio_url}
                    download={`${song.title}.mp3`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Télécharger l'audio"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onDeleteSong(song.id)}
                    className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#0F172A]">Aucun morceau dans ce filtre</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Modifiez vos filtres ou lancez une nouvelle création avec le studio IA.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            {selectedTag !== 'Tous' && (
              <button
                onClick={() => setSelectedTag('Tous')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Réinitialiser les tags
              </button>
            )}
            <button
              onClick={() => navigate('/create')}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A00] text-white text-xs font-extrabold shadow-sm cursor-pointer"
            >
              Créer une chanson
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
