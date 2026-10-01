import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Plus,
  MoreVertical,
  Sliders,
  Scissors,
  Share2,
  Trash2,
  Sparkles,
  Layers,
  Download,
} from 'lucide-react';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onLike?: (songId: string) => void;
  onToggleFavorite?: (songId: string) => void;
  onShare?: (song: Song) => void;
  onSelectTag?: (tag: string) => void;
  onAddToPlaylist?: (song: Song) => void;
  onOpenStudio?: (song: Song) => void;
  onRemix?: (song: Song) => void;
  onExtend?: (song: Song) => void;
  onExtractStems?: (song: Song) => void;
  onDelete?: (songId: string) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  onPlay,
  onLike,
  onToggleFavorite,
  onShare,
  onSelectTag,
  onAddToPlaylist,
  onOpenStudio,
  onRemix,
  onExtend,
  onExtractStems,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isFav = Boolean(song.is_favorite);
  const [likesCount, setLikesCount] = useState(song.likes_count);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(song.id);
    } else if (onLike) {
      onLike(song.id);
    }
    setLikesCount((prev) => (isFav ? Math.max(0, prev - 1) : prev + 1));
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-3"
      id={`song-card-${song.id}`}
    >
      {/* Cover Image & Hover Actions */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
        <img
          src={song.cover_url}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
            isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Play Button Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => onPlay(song)}
            className="w-13 h-13 rounded-full bg-[#FF7A00] text-white flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Écouter'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#2563EB] shadow-xs">
            {song.genre}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white">
            {formatDuration(song.duration)}
          </span>
        </div>

        {/* Bottom Quick Overlay Bar */}
        <div
          className={`absolute bottom-2 left-2 right-2 flex items-center justify-between text-white transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer ${
                isFav ? 'text-red-500' : 'text-white'
              }`}
              title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <span className="text-[11px] font-semibold">{likesCount}</span>
          </div>

          <div className="flex items-center gap-1">
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(song);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Partager ce morceau"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {onAddToPlaylist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist(song);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Ajouter à la playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {onOpenStudio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudio(song);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Ouvrir dans le Studio"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Song Metadata */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <div className="truncate flex-1">
              <div className="flex items-center gap-1.5">
                <h3
                  onClick={() => onPlay(song)}
                  className="font-bold text-sm text-[#0F172A] truncate hover:text-[#2563EB] cursor-pointer"
                  title={song.title}
                >
                  {song.title}
                </h3>
                {song.version_tag && song.version_tag !== 'VERSION A' && song.version_tag !== 'VERSION B' && song.version_tag !== 'ORIGINAL' && (
                  <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded-xs bg-orange-50 text-[#FF7A00] border border-orange-200 shrink-0">
                    {song.version_tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] truncate mt-0.5">
                {song.creator_name}
              </p>
            </div>

            {/* Top right quick icons: Heart & Share */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isFav ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                }`}
                title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </button>

              {onShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(song);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                    {onShare && (
                      <button
                        onClick={() => {
                          onShare(song);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#EFF6FF] text-[#0F172A] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#2563EB]" /> Partager ce morceau
                      </button>
                    )}
                    {onOpenStudio && (
                      <button
                        onClick={() => {
                          onOpenStudio(song);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#EFF6FF] text-[#0F172A] flex items-center gap-2 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#2563EB]" /> Ouvrir dans Studio
                      </button>
                    )}
                    {onExtractStems && (
                      <button
                        onClick={() => {
                          onExtractStems(song);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#EFF6FF] text-[#0F172A] flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-600" /> Extraire les stems
                      </button>
                    )}
                    {onRemix && (
                      <button
                        onClick={() => {
                          onRemix(song);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-orange-50 text-[#0F172A] flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" /> Créer un Remix
                      </button>
                    )}
                    {onExtend && (
                      <button
                        onClick={() => {
                          onExtend(song);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#EFF6FF] text-[#0F172A] flex items-center gap-2 cursor-pointer"
                      >
                        <Scissors className="w-3.5 h-3.5 text-[#2563EB]" /> Étendre le morceau
                      </button>
                    )}
                    <a
                      href={song.audio_url}
                      download={`${song.title}.mp3`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[#0F172A] flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" /> Télécharger MP3
                    </a>
                    {onDelete && (
                      <>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                          onClick={() => {
                            onDelete(song.id);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Mood & Genre Tags */}
          {song.tags && song.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {song.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#2563EB] transition-colors cursor-pointer"
                  title={`Filtrer par #${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
