import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Scissors,
  Sparkles,
  Layers,
  Plus,
  RotateCcw,
  Download,
  Share2,
  Music,
  Activity,
} from 'lucide-react';
import { Song, Stem } from '../types';
import { soundEngine } from '../utils/audioSynth';

interface StudioViewProps {
  song: Song | null;
  onRemix: (song: Song) => void;
  onExtend: (song: Song) => void;
}

interface StudioTrack {
  id: string;
  name: 'Vocals' | 'Drums' | 'Bass' | 'Keys' | 'Guitar' | 'Synth' | 'FX';
  color: string;
  volume: number;
  pan: number; // -50 to +50
  muted: boolean;
  solo: boolean;
  waveformPattern: number[];
}

export const StudioView: React.FC<StudioViewProps> = ({ song, onRemix, onExtend }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [masterBpm, setMasterBpm] = useState(song?.bpm || 112);
  const [masterPitch, setMasterPitch] = useState(0); // semitones -12 to +12
  const [masterVolume, setMasterVolume] = useState(80);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [studioToast, setStudioToast] = useState<string | null>(null);

  const triggerStudioAction = (msg: string) => {
    setStudioToast(msg);
    setTimeout(() => setStudioToast(null), 3000);
  };

  // Initialize multitrack stems
  const [tracks, setTracks] = useState<StudioTrack[]>([
    {
      id: 't1',
      name: 'Vocals',
      color: 'from-amber-400 to-orange-500',
      volume: 85,
      pan: 0,
      muted: false,
      solo: false,
      waveformPattern: [30, 45, 60, 80, 70, 95, 65, 40, 80, 90, 75, 55, 30, 70, 85, 40],
    },
    {
      id: 't2',
      name: 'Drums',
      color: 'from-blue-500 to-indigo-600',
      volume: 90,
      pan: 0,
      muted: false,
      solo: false,
      waveformPattern: [90, 30, 85, 40, 95, 30, 80, 45, 90, 35, 85, 40, 95, 30, 80, 40],
    },
    {
      id: 't3',
      name: 'Bass',
      color: 'from-purple-500 to-violet-700',
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
      waveformPattern: [70, 75, 80, 85, 70, 75, 80, 85, 70, 75, 80, 85, 70, 75, 80, 85],
    },
    {
      id: 't4',
      name: 'Keys',
      color: 'from-emerald-400 to-teal-600',
      volume: 75,
      pan: -15,
      muted: false,
      solo: false,
      waveformPattern: [40, 50, 65, 70, 50, 60, 75, 80, 40, 55, 70, 65, 50, 60, 75, 40],
    },
    {
      id: 't5',
      name: 'Guitar',
      color: 'from-yellow-400 to-amber-600',
      volume: 70,
      pan: 20,
      muted: false,
      solo: false,
      waveformPattern: [50, 60, 45, 75, 60, 50, 70, 60, 50, 65, 50, 75, 60, 50, 70, 55],
    },
    {
      id: 't6',
      name: 'Synth',
      color: 'from-pink-500 to-rose-600',
      volume: 65,
      pan: -25,
      muted: false,
      solo: false,
      waveformPattern: [20, 35, 60, 85, 90, 75, 50, 30, 25, 40, 65, 85, 90, 70, 45, 20],
    },
    {
      id: 't7',
      name: 'FX',
      color: 'from-cyan-400 to-blue-500',
      volume: 60,
      pan: 30,
      muted: false,
      solo: false,
      waveformPattern: [10, 20, 40, 90, 10, 20, 30, 70, 10, 15, 40, 85, 10, 20, 30, 65],
    },
  ]);

  // Real multitrack sound playback
  useEffect(() => {
    if (isPlaying) {
      soundEngine.playStudioTracks(tracks, masterBpm, (progress) => {
        setTimelineProgress(progress);
      });
    } else {
      soundEngine.stop();
    }

    return () => {
      soundEngine.stop();
    };
  }, [isPlaying, tracks, masterBpm]);

  const toggleTrackMute = (id: string) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)));
  };

  const toggleTrackSolo = (id: string) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, solo: !t.solo } : t)));
  };

  const updateTrackVolume = (id: string, vol: number) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, volume: vol } : t)));
  };

  const updateTrackPan = (id: string, pan: number) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, pan } : t)));
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Studio Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Track Title / Metadata */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#FF7A00] flex items-center justify-center text-white shadow-md">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#FF7A00] text-white">
                SITDOWORLD DAW
              </span>
              <span className="text-xs text-slate-400">Mode Multitrack & Stems</span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">
              {song?.title || 'Session Studio Multitrack'}
            </h2>
            <p className="text-xs text-slate-400">{song?.genre || 'Afrobeat'} • 7 Stems isolés</p>
          </div>
        </div>

        {/* Global DAW Transport Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
          {/* Play / Pause / Stop */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-11 h-11 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setTimelineProgress(0);
                soundEngine.stop();
              }}
              className="w-11 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Arrêter"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          {/* Master BPM */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">BPM</span>
            <input
              type="number"
              min={60}
              max={180}
              value={masterBpm}
              onChange={(e) => setMasterBpm(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-black text-orange-400 text-center"
            />
          </div>

          {/* Master Pitch Knob */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Pitch</span>
            <span className="text-xs font-bold text-blue-400">{masterPitch > 0 ? `+${masterPitch}` : masterPitch}st</span>
            <input
              type="range"
              min={-12}
              max={12}
              value={masterPitch}
              onChange={(e) => setMasterPitch(Number(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none accent-[#2563EB]"
            />
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min={0}
              max={100}
              value={masterVolume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMasterVolume(v);
                soundEngine.setMasterVolume(v / 100);
              }}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none accent-[#FF7A00]"
            />
          </div>
        </div>

        {/* Action Buttons: Trim, Split, Extend, Remix */}
        <div className="flex items-center gap-2">
          {song && (
            <>
              <button
                onClick={() => onRemix(song)}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Remix</span>
              </button>
              <button
                onClick={() => onExtend(song)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Extend</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Multitrack DAW Timeline & Stems */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
        {/* Timeline Header Ruler */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
          <div className="w-64 shrink-0 font-bold text-slate-300">PISTES & CONTRÔLES</div>
          <div className="flex-1 relative flex items-center justify-between px-4">
            <span>0:00</span>
            <span>0:30 [Intro]</span>
            <span>1:00 [Couplet]</span>
            <span>1:30 [Refrain]</span>
            <span>2:00 [Pont]</span>
            <span>2:30 [Final]</span>
            <span>3:00</span>

            {/* Moving Playhead Cursor */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#FF7A00] shadow-[0_0_10px_#FF7A00] transition-all pointer-events-none"
              style={{ left: `${timelineProgress * 100}%` }}
            >
              <div className="w-3 h-3 bg-[#FF7A00] rotate-45 -ml-1.25 -mt-1.5 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`p-3 rounded-2xl border transition-all flex flex-col lg:flex-row items-stretch lg:items-center gap-4 ${
                track.muted
                  ? 'bg-slate-900/40 border-slate-800 opacity-60'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Track Controls (Left) */}
              <div className="w-64 shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-3 h-8 rounded-md bg-gradient-to-b ${track.color}`} />
                  <div>
                    <h4 className="font-extrabold text-sm text-white truncate">{track.name}</h4>
                    <span className="text-[10px] text-slate-400">Pan: {track.pan}</span>
                  </div>
                </div>

                {/* Mute / Solo */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-colors ${
                      track.muted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => toggleTrackSolo(track.id)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-colors ${
                      track.solo ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    S
                  </button>
                </div>

                {/* Volume slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={track.volume}
                  onChange={(e) => updateTrackVolume(track.id, Number(e.target.value))}
                  className="w-16 h-1 bg-slate-800 rounded-lg appearance-none accent-[#FF7A00]"
                />
              </div>

              {/* Waveform Visualization (Right) */}
              <div className="flex-1 h-14 bg-slate-950/80 rounded-xl p-2 border border-slate-850 flex items-center gap-1.5 overflow-hidden relative group cursor-pointer">
                {/* Waveform bars */}
                {Array.from({ length: 48 }).map((_, idx) => {
                  const patternVal = track.waveformPattern[idx % track.waveformPattern.length];
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-full bg-gradient-to-t ${track.color} transition-all opacity-80 group-hover:opacity-100`}
                      style={{ height: `${patternVal}%` }}
                    />
                  );
                })}

                {/* Waveform playhead slice */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none"
                  style={{ left: `${timelineProgress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Studio Status Toast */}
        {studioToast && (
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-[#FF7A00] shrink-0" />
            <span>{studioToast}</span>
          </div>
        )}

        {/* Section Actions: Trim, Split, Add Section */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerStudioAction('Outil Séparer (Split) activé au curseur de lecture.')}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Split Section</span>
            </button>
            <button
              onClick={() => triggerStudioAction('Section découpée (Trim) avec succès.')}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Trim Audio</span>
            </button>
            <button
              onClick={() => triggerStudioAction('Génération d’une nouvelle variation IA sur la section...')}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Remplacer Section (IA)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerStudioAction('Export des 7 Stems WAV en cours de préparation...')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter les 7 Stems (WAV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
