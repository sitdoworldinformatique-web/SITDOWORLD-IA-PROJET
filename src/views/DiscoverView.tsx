import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Sparkles,
  TrendingUp,
  Music2,
  Filter,
} from 'lucide-react';
import { Song, Genre } from '../types';
import { SongCard } from '../components/SongCard';

interface DiscoverViewProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenStudio?: (song: Song) => void;
  onRemixSong?: (song: Song) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenStudio,
  onRemixSong,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');

  const filters = [
    'Tous',
    'Tendances',
    'Nouveautés',
    'Afro',
    'Gospel',
    'Amapiano',
    'Hip-Hop',
    'R&B',
    'Pop',
    'Dance',
    'Reggae',
    'Jazz',
    'Cinematic',
  ];

  const filteredSongs = songs.filter((song) => {
    // Search match
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filter match
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'Tendances') return song.plays_count >= 500;
    if (activeFilter === 'Nouveautés') return true;
    if (activeFilter === 'Afro') return song.genre === 'Afrobeat';
    return song.genre.toLowerCase() === activeFilter.toLowerCase();
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
            placeholder="Rechercher titre, genre, créateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((f) => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f === 'Tendances' && <Flame className="w-3.5 h-3.5 inline mr-1 text-orange-400" />}
              {f === 'Nouveautés' && <Sparkles className="w-3.5 h-3.5 inline mr-1 text-blue-400" />}
              {f}
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
            className="mt-4 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};
