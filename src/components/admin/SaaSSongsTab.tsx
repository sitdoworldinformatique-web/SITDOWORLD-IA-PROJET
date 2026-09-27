import React, { useState } from 'react';
import {
  Music,
  Trash2,
  Play,
  Pause,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';
import { Song } from '../../types';

interface SaaSSongsTabProps {
  songs: Song[];
  onRefresh: () => void;
  onDeleteSong: (songId: string) => Promise<boolean>;
  onClearTestSongs: () => Promise<boolean>;
}

export const SaaSSongsTab: React.FC<SaaSSongsTabProps> = ({
  songs,
  onRefresh,
  onDeleteSong,
  onClearTestSongs,
}) => {
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'test' | 'client'>('all');
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClearingTest, setIsClearingTest] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all_test';
    songId?: string;
    songTitle?: string;
  }>({ isOpen: false, type: 'single' });

  const isTestSong = (s: Song) => {
    return (
      s.id.startsWith('song-seed-') ||
      s.creator_name === 'Studio Test' ||
      s.creator_id === 'user-demo-2' ||
      s.creator_id === 'user-demo-3' ||
      s.prompt.toLowerCase().includes('lydia') ||
      s.prompt.toLowerCase().includes('test') ||
      s.title.toLowerCase().includes('test') ||
      s.title.toLowerCase().includes('lydia') ||
      s.title === 'Soleil de Cotonou' ||
      s.title === 'Amapiano Midnight Prayer' ||
      s.title === 'Mon Amour Pour Toi' ||
      s.title === 'Neon Drift (Cyber R&B)'
    );
  };

  const testSongsCount = songs.filter(isTestSong).length;

  const filteredSongs = songs.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.prompt.toLowerCase().includes(search.toLowerCase()) ||
      s.creator_name.toLowerCase().includes(search.toLowerCase()) ||
      s.genre.toLowerCase().includes(search.toLowerCase());

    const matchesGenre = filterGenre === 'all' || s.genre.toLowerCase() === filterGenre.toLowerCase();

    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'test'
        ? isTestSong(s)
        : !isTestSong(s);

    return matchesSearch && matchesGenre && matchesType;
  });

  const handlePlay = (song: Song) => {
    if (playingSongId === song.id) {
      audioElement?.pause();
      setPlayingSongId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(song.audio_url);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingSongId(null);
      setAudioElement(audio);
      setPlayingSongId(song.id);
    }
  };

  const executeDelete = async () => {
    if (confirmModal.type === 'single' && confirmModal.songId) {
      setIsDeleting(confirmModal.songId);
      await onDeleteSong(confirmModal.songId);
      setIsDeleting(null);
    } else if (confirmModal.type === 'all_test') {
      setIsClearingTest(true);
      await onClearTestSongs();
      setIsClearingTest(false);
    }
    setConfirmModal({ isOpen: false, type: 'single' });
  };

  const genres = Array.from(new Set(songs.map((s) => s.genre)));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Music className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Catalogue Musical du SaaS ({songs.length} pistes)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez toutes les créations musicales générées par vos utilisateurs ou lors des tests techniques Suno v6.
          </p>
        </div>

        {/* Global Action: Supprimer les chansons de test */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                type: 'all_test',
              })
            }
            disabled={isClearingTest || testSongsCount === 0}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-black tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            id="admin-clear-test-songs-btn"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer les Chansons de Test ({testSongsCount})</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, prompt, artiste..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="all">Tous les types ({songs.length})</option>
            <option value="test">Chansons de Test uniquement ({testSongsCount})</option>
            <option value="client">Créations Clients ({songs.length - testSongsCount})</option>
          </select>

          {/* Genre Filter */}
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="all">Tous les genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Songs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Morceau</th>
                <th className="py-3.5 px-4">Créateur / Source</th>
                <th className="py-3.5 px-4">Genre & Style</th>
                <th className="py-3.5 px-4">BPM / Durée</th>
                <th className="py-3.5 px-4">Date de Création</th>
                <th className="py-3.5 px-5 text-right">Actions Administrateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSongs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Music className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">Aucune chanson trouvée</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {songs.length === 0
                        ? 'Le catalogue est actuellement vide.'
                        : 'Modifiez vos filtres de recherche.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSongs.map((song) => {
                  const test = isTestSong(song);
                  const isPlaying = playingSongId === song.id;

                  return (
                    <tr key={song.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Song preview */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <img
                              src={song.cover_url}
                              alt={song.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handlePlay(song)}
                              className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={isPlaying ? 'Pause' : 'Écouter'}
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current" />
                              )}
                            </button>
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-900 truncate">
                                {song.title}
                              </h4>
                              {test ? (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                  Test / Démo
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                  Client
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5" title={song.prompt}>
                              {song.prompt}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-bold text-xs">
                          {song.creator_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {song.creator_id}
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {song.genre}
                        </span>
                      </td>

                      {/* BPM & Duration */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>{song.bpm} BPM</div>
                        <div className="text-[10px] text-slate-400">
                          {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(song.created_at).toLocaleDateString()}
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlay(song)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            title={isPlaying ? 'Pause' : 'Écouter'}
                          >
                            {isPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current text-purple-600" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: 'single',
                                songId: song.id,
                                songTitle: song.title,
                              })
                            }
                            disabled={isDeleting === song.id}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Supprimer cette chanson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                {confirmModal.type === 'all_test'
                  ? 'Supprimer toutes les chansons de test ?'
                  : `Supprimer "${confirmModal.songTitle}" ?`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {confirmModal.type === 'all_test'
                  ? `Cette action supprimera définitivement les ${testSongsCount} morceaux identifiés comme des tests ou maquettes de démonstration. Les créations réelles des clients seront conservées.`
                  : 'Cette action supprimera définitivement cette chanson du catalogue et de la base de données. Cette opération est irréversible.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: 'single' })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
