import React, { useState } from 'react';
import {
  Search,
  Flame,
  Sparkles,
  Music2,
  Heart,
  Tag,
} from 'lucide-react';
import { Song } from '../types';
import { SongCard } from '../components/SongCard';

interface DiscoverViewProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenStudio?: (song: Song) => void;
  onRemixSong?: (song: Song) => void;
  onToggleFavorite?: (songId: string) => void;
  onShare?: (song: Song) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenStudio,
  onRemixSong,
  onToggleFavorite,
  onShare,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');

  // Core genres, moods, and dynamic tags requested by user
  const filters = [
    { label: 'Tous', icon: null },
    { label: 'Favoris ❤️', icon: Heart, isFav: true },
    { label: 'Tendances', icon: Flame },
    { label: 'Nouveautés', icon: Sparkles },
    { label: 'Chill', icon: Tag },
    { label: 'Workout', icon: Tag },
    { label: 'Lo-fi', icon: Tag },
    { label: 'Afrobeat', icon: null },
    { label: 'Amapiano', icon: null },
    { label: 'Gospel', icon: null },
    { label: 'R&B', icon: null },
    { label: 'Dance', icon: null },
    { label: 'Romance', icon: Tag },
    { label: 'Focus', icon: Tag },
  ];

  const filteredSongs = songs.filter((song) => {
    // Search match across title, prompt, creator, genre, and tags
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      song.title.toLowerCase().includes(q) ||
      song.prompt.toLowerCase().includes(q) ||
      song.creator_name.toLowerCase().includes(q) ||
      song.genre.toLowerCase().includes(q) ||
      (song.tags && song.tags.some((t) => t.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    // Filter match
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'Favoris ❤️') return Boolean(song.is_favorite);
    if (activeFilter === 'Tendances') return song.plays_count >= 500;
    if (activeFilter === 'Nouveautés') return true;
    if (activeFilter === 'Afro') return song.genre.toLowerCase().includes('afro');

    const cleanFilter = activeFilter.toLowerCase();
    const matchesGenre = song.genre.toLowerCase() === cleanFilter;
    const matchesMood = song.mood.toLowerCase().includes(cleanFilter);
    const matchesTag = song.tags && song.tags.some((t) => t.toLowerCase() === cleanFilter);

    return matchesGenre || matchesMood || matchesTag;
  });

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Découverte Musicale
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Explorez les meilleures œuvres composées avec le moteur IA SITDOWORLD.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher titre, tag (#Chill, #Workout), genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all text-[#0F172A]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Tags Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((f) => {
          const isActive = activeFilter === f.label;
          const Icon = f.icon;
          return (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${f.isFav ? 'text-red-400 fill-current' : ''}`} />}
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Songs Grid */}
      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={onPlaySong}
              onOpenStudio={onOpenStudio}
              onRemix={onRemixSong}
              onToggleFavorite={onToggleFavorite}
              onShare={onShare}
              onSelectTag={(tag) => setActiveFilter(tag)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Music2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#0F172A]">Aucun morceau trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Essayez un autre mot-clé ou sélectionnez le filtre « Tous » pour explorer l'ensemble de la bibliothèque.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('Tous');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};
