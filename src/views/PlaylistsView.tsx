import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Pause,
  Trash2,
  Share2,
  Lock,
  Globe,
  Music,
  Check,
} from 'lucide-react';
import { Playlist, Song } from '../types';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onPlaySong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onOpenStudio: (song: Song) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists: initialPlaylists,
  onPlaySong,
  currentSong,
  isPlaying,
  onOpenStudio,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(
    initialPlaylists.length > 0 ? initialPlaylists[0] : null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          is_public: isPublic,
        }),
      });
      const data = await res.json();
      if (data.playlist) {
        setPlaylists([data.playlist, ...playlists]);
        setActivePlaylist(data.playlist);
        setShowCreateModal(false);
        setNewTitle('');
        setNewDesc('');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            Playlists & Compilations
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Organisez vos pistes par style, projet d’album ou sélection publique.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Playlists List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Vos sélections</h3>
          {playlists.map((pl) => {
            const isSelected = activePlaylist?.id === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist(pl)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={pl.cover_url}
                  alt={pl.title}
                  className="w-13 h-13 rounded-xl object-cover"
                />
                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-[#0F172A] truncate">{pl.title}</h4>
                    {pl.is_public ? (
                      <Globe className="w-3 h-3 text-slate-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] truncate">{pl.description || 'Aucune description'}</p>
                  <span className="text-[11px] font-bold text-[#2563EB]">{pl.songs.length} morceaux</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Playlist Details & Songs */}
        <div className="lg:col-span-2 space-y-6">
          {activePlaylist ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
                <img
                  src={activePlaylist.cover_url}
                  alt={activePlaylist.title}
                  className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-slate-200"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-[#2563EB]">
                      {activePlaylist.is_public ? 'Playlist Publique' : 'Privée'}
                    </span>
                    <span className="text-xs text-[#64748B]">{activePlaylist.creator_name}</span>
                  </div>
                  <h2 className="text-2xl font-black text-[#0F172A] mt-1">{activePlaylist.title}</h2>
                  <p className="text-xs text-[#64748B] mt-1">{activePlaylist.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                    <span>{copied ? 'Lien copié' : 'Partager'}</span>
                  </button>
                </div>
              </div>

              {/* Songs List */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Morceaux inclus ({activePlaylist.songs.length})
                </h3>

                {activePlaylist.songs.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {activePlaylist.songs.map((song, idx) => {
                      const isSongActive = isPlaying && currentSong?.id === song.id;
                      return (
                        <div
                          key={song.id}
                          className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                            <img
                              src={song.cover_url}
                              alt={song.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div className="truncate">
                              <h4
                                onClick={() => onPlaySong(song)}
                                className="font-bold text-sm text-[#0F172A] hover:text-[#2563EB] cursor-pointer truncate"
                              >
                                {song.title}
                              </h4>
                              <p className="text-[11px] text-[#64748B]">
                                {song.creator_name} • {song.genre}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onPlaySong(song)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-orange-100 text-[#FF7A00] transition-colors"
                            >
                              {isSongActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Cette playlist est encore vide. Ajoutez des chansons depuis Discover ou Ma musique.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <ListMusic className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Sélectionnez une playlist pour afficher son contenu.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl text-[#0F172A]">Créer une nouvelle playlist</h3>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Titre de la playlist</label>
              <input
                type="text"
                placeholder="Ex: Afrobeat Hits 2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Description de votre playlist..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:border-[#2563EB]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] accent-[#2563EB]"
              />
              <span>Rendre la playlist publique dans Discover</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-extrabold shadow-sm"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
