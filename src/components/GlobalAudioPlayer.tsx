import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Sliders,
  Download,
  Repeat,
  Music,
} from 'lucide-react';
import { Song } from '../types';

interface GlobalAudioPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenStudio: (song: Song) => void;
}

export const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  onOpenStudio,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(currentSong?.duration || 180);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const displayDuration = actualDuration || currentSong?.duration || 180;

  // Sync actual HTMLAudio element with currentSong and isPlaying state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audio_url) return;

    if (audio.src !== currentSong.audio_url && !audio.src.endsWith(currentSong.audio_url)) {
      audio.src = currentSong.audio_url;
      audio.load();
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[GlobalAudioPlayer] Autoplay prevented or stream error:', err.message);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.id, currentSong?.audio_url]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  if (!currentSong) return null;

  return (
    <div
      id="global-audio-player"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-4 py-2.5 transition-all"
    >
      {/* Hidden real HTML5 audio engine playing the genuine Suno MP3 stream */}
      <audio
        ref={audioRef}
        src={currentSong.audio_url}
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
            setActualDuration(Math.round(audioRef.current.duration));
          }
        }}
        onEnded={() => {
          if (isLooping && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          } else {
            onNext();
          }
        }}
        onError={(e) => {
          console.error('[GlobalAudioPlayer] Audio playback error on URL:', currentSong.audio_url, e);
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-6">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-[220px]">
          <div className="relative group shrink-0">
            <img
              src={currentSong.cover_url}
              alt={currentSong.title}
              className="w-13 h-13 rounded-xl object-cover shadow-sm border border-slate-200"
            />
            <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="truncate flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-[#0F172A] truncate hover:text-[#2563EB] cursor-pointer">
                {currentSong.title}
              </h4>
              {currentSong.version_tag && currentSong.version_tag !== 'VERSION A' && currentSong.version_tag !== 'VERSION B' && currentSong.version_tag !== 'ORIGINAL' && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-orange-100 text-[#FF7A00] shrink-0">
                  {currentSong.version_tag}
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] truncate">
              {currentSong.creator_name} • <span className="text-[#2563EB] font-medium">{currentSong.genre}</span>
            </p>
          </div>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
              isLiked ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Aimer ce morceau"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex-1 w-full max-w-2xl flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg hover:bg-slate-100 text-xs cursor-pointer transition-colors ${
                isLooping ? 'text-[#FF7A00] bg-orange-50' : 'text-slate-400'
              }`}
              title="Boucler"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onPrevious}
              className="p-1.5 text-slate-700 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Précédent"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-[#FF7A00] hover:bg-[#e66e00] text-white flex items-center justify-center shadow-md shadow-orange-500/30 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Lecture'}
              id="player-play-btn"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 text-slate-700 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Suivant"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenStudio(currentSong)}
              className="p-1.5 text-slate-600 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Ouvrir dans le Studio Multitrack"
            >
              <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="hidden sm:inline">Studio</span>
            </button>
          </div>

          {/* Scrubber timeline */}
          <div className="w-full flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={displayDuration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF7A00]"
              />
            </div>
            <span>{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Right: Volume & Extras */}
        <div className="hidden lg:flex items-center justify-end gap-3 w-1/4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
          </div>

          <a
            href={currentSong.audio_url}
            download={`${currentSong.title}.mp3`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Télécharger le fichier audio MP3 officiel"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
