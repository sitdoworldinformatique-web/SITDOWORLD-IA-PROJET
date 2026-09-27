// Web Audio synthesizer for SITDOWORLD AI MUSIC
// Provides real, glitch-free audio synthesis for songs, stems, and multitrack studio tracks

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private currentTrackId: string | null = null;
  private timer: number | null = null;

  // Stems track gains for Studio
  private stemGains: Record<string, GainNode> = {};

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public playSongPreview(songId: string, genre: string = 'Afrobeat', onTick?: (sec: number) => void) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentTrackId = songId;

    // Musical scale frequencies based on genre
    const scales: Record<string, number[]> = {
      Afrobeat: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // C Major pentatonic vibrant
      Amapiano: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0], // A Minor smooth
      Gospel: [261.63, 329.63, 392.0, 493.88, 523.25, 659.25], // C Major uplift
      'R&B': [246.94, 293.66, 349.23, 392.0, 440.0, 523.25], // B Minor romantic
      'Hip-Hop': [196.0, 233.08, 261.63, 293.66, 349.23, 392.0], // G Minor boom bap
      Pop: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0], // C Major
    };

    const notes = scales[genre] || scales['Afrobeat'];
    let step = 0;
    let seconds = 0;

    // Rhythm loop using synthesizers
    const interval = setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) {
        clearInterval(interval);
        return;
      }

      seconds += 0.25;
      if (onTick && Math.floor(seconds) !== Math.floor(seconds - 0.25)) {
        onTick(Math.floor(seconds));
      }

      const now = this.ctx.currentTime;

      // 1. Kick/Log Drum (on beat 0, 2)
      if (step % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = genre === 'Amapiano' ? 'triangle' : 'sine';
        kickOsc.frequency.setValueAtTime(genre === 'Amapiano' ? 75 : 120, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
        kickGain.gain.setValueAtTime(0.6, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.22);
      }

      // 2. Harmonic melody chord
      const noteFreq = notes[step % notes.length];
      const melodyOsc = this.ctx.createOscillator();
      const melodyGain = this.ctx.createGain();
      melodyOsc.type = genre === 'Gospel' ? 'sawtooth' : 'sine';
      melodyOsc.frequency.setValueAtTime(noteFreq, now);

      // Low pass filter for warm sound
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(genre === 'R&B' ? 900 : 1800, now);

      melodyGain.gain.setValueAtTime(0.2, now);
      melodyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      melodyOsc.connect(filter);
      filter.connect(melodyGain);
      melodyGain.connect(this.masterGain);

      melodyOsc.start(now);
      melodyOsc.stop(now + 0.38);

      // 3. Shaker / Hi-Hat
      const noiseOsc = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      noiseOsc.type = 'square';
      noiseOsc.frequency.setValueAtTime(4500 + (step % 4) * 300, now);
      noiseGain.gain.setValueAtTime(0.05, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noiseOsc.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseOsc.start(now);
      noiseOsc.stop(now + 0.07);

      step = (step + 1) % 16;
    }, 250);

    this.timer = interval as any;
  }

  // Multitrack stem playback for Studio
  public playStudioTracks(
    tracks: { name: string; volume: number; muted: boolean; solo: boolean }[],
    bpm: number = 110,
    onProgress?: (progress: number) => void
  ) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;
    const hasSolo = tracks.some((t) => t.solo);
    let beat = 0;
    const beatInterval = (60 / bpm) * 1000 * 0.5; // 8th notes

    const interval = setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) {
        clearInterval(interval);
        return;
      }

      const now = this.ctx.currentTime;
      if (onProgress) {
        onProgress((beat % 64) / 64);
      }

      tracks.forEach((track) => {
        const isMuted = track.muted || (hasSolo && !track.solo);
        if (isMuted) return;

        const trackGain = (track.volume / 100) * 0.3;

        // Drums track
        if (track.name === 'Drums' && (beat % 2 === 0 || beat % 8 === 4)) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.frequency.setValueAtTime(90, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
          gain.gain.setValueAtTime(trackGain * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.16);
        }

        // Bass track
        if (track.name === 'Bass' && beat % 2 === 0) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          const bassNotes = [55, 65.4, 73.4, 82.4];
          osc.frequency.setValueAtTime(bassNotes[(beat / 2) % bassNotes.length], now);
          gain.gain.setValueAtTime(trackGain * 0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.32);
        }

        // Vocals / Choirs track
        if (track.name === 'Vocals' && beat % 4 === 0) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          const vocNotes = [329.63, 392.0, 440.0, 523.25];
          osc.frequency.setValueAtTime(vocNotes[(beat / 4) % vocNotes.length], now);
          gain.gain.setValueAtTime(trackGain * 0.6, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.45);
        }

        // Keys / Piano / Guitar track
        if ((track.name === 'Keys' || track.name === 'Guitar' || track.name === 'Piano') && beat % 2 === 1) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          const chordNotes = [261.63, 329.63, 392.0, 493.88];
          osc.frequency.setValueAtTime(chordNotes[(beat % 4)], now);
          gain.gain.setValueAtTime(trackGain * 0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.22);
        }

        // Synth / FX track
        if ((track.name === 'Synth' || track.name === 'FX') && beat % 8 === 0) {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(659.25, now);
          gain.gain.setValueAtTime(trackGain * 0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.65);
        }
      });

      beat++;
    }, beatInterval);

    this.timer = interval as any;
  }

  public stop() {
    this.isPlaying = false;
    this.currentTrackId = null;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    }
    this.activeOscillators = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }
}

export const soundEngine = new SoundEngine();
