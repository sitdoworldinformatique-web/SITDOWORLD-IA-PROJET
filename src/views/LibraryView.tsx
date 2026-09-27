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
  Plus,
  Play,
  Pause,
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
  navigate,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'drafts' | 'liked' | 'recent'>('all');

  // Filter songs belonging to user or liked
  const userSongs = songs.filter((s) => s.creator_id === currentUserId || s.creator_id === 'user-default-1');

  const filtered = userSongs.filter((s) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'songs') return true;
    if (activeTab === 'drafts') return s.title.toLowerCase().includes('draft') || s.title.toLowerCase().includes('brouillon');
    if (activeTab === 'liked') return s.likes_count > 0;
    if (activeTab === 'recent') return true;
    return true;
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
            Gérez vos créations originales, stems multitrack, versions A/B et remixes.
          </p>
        </div>

        <button
          onClick={() => navigate('/create')}
          className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Nouvelle création</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'all', label: 'Toutes les créations', count: userSongs.length, icon: Library },
          { id: 'songs', label: 'Morceaux', count: userSongs.length, icon: Library },
          { id: 'drafts', label: 'Brouillons & Variantes', count: Math.floor(userSongs.length / 2), icon: FileText },
          { id: 'liked', label: 'Favoris', count: userSongs.filter((s) => s.likes_count > 0).length, icon: Heart },
          { id: 'recent', label: 'Récents', count: userSongs.length, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
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

      {/* Songs Table / List */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filtered.map((song) => {
            const isSongActive = isPlaying && currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Left: Info & Play */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative group shrink-0">
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <button
                      onClick={() => onPlaySong(song)}
                      className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-[#2563EB]">{song.genre}</span>
                      <span>•</span>
                      <span>{song.bpm} BPM</span>
                      <span>•</span>
                      <span>{formatDuration(song.duration)}</span>
                      <span>•</span>
                      <span>{song.plays_count} écoutes</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Étendre le morceau"
                  >
                    <Scissors className="w-4 h-4" />
                  </button>

                  <a
                    href={song.audio_url}
                    download={`${song.title}.mp3`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Télécharger l'audio"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onDeleteSong(song.id)}
                    className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <h3 className="font-bold text-base text-[#0F172A]">Aucun morceau dans cet onglet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Commencez par générer votre premier titre à l'aide du studio IA.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#FF7A00] text-white text-xs font-extrabold shadow-sm"
          >
            Créer ma première chanson
          </button>
        </div>
      )}
    </div>
  );
};
