/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmVolumeNode: GainNode | null = null;
  private masterVolumeNode: GainNode | null = null; // Mapped to SFX Volume for backward compatibility
  private actualMasterNode: GainNode | null = null;  // True master output control
  private delayNode: DelayNode | null = null;

  // Detailed Volume configuration levels
  private masterVolume: number = 0.6;
  private musicVolume: number = 0.4;
  private sfxVolume: number = 0.8;

  // Sequencer state
  private isBgmPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private sequencerTimer: any = null;
  private bpm: number = 120;
  private scheduleAheadTime: number = 0.1; // schedule 100ms ahead
  private lookahead: number = 30; // check queue every 30ms

  // Bass scale (A minor / Phrygian vibes)
  private bassNotes = [
    55.00, // A1
    55.00, // A1
    65.41, // C2
    65.41, // C2
    73.42, // D2
    73.42, // D2
    49.00, // G1
    58.27, // A#1 (Phrygian vibe!)
  ];

  private melodyNotes = [
    220.00, // A3
    246.94, // B3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
  ];

  constructor() {
    this.isMuted = localStorage.getItem('game_audio_muted') === 'true';
    
    const savedMaster = localStorage.getItem('game_audio_master_volume');
    if (savedMaster !== null) this.masterVolume = parseFloat(savedMaster);
    
    const savedMusic = localStorage.getItem('game_audio_music_volume');
    if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
    
    const savedSfx = localStorage.getItem('game_audio_sfx_volume');
    if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
  }

  private init() {
    if (this.ctx) return;

    try {
      // Create context
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master gain
      this.actualMasterNode = this.ctx.createGain();
      const currentMaster = this.isMuted ? 0 : this.masterVolume;
      this.actualMasterNode.gain.setValueAtTime(currentMaster, this.ctx.currentTime);
      this.actualMasterNode.connect(this.ctx.destination);

      // SFX gain (mapped as masterVolumeNode to preserve code routing)
      this.masterVolumeNode = this.ctx.createGain();
      this.masterVolumeNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.masterVolumeNode.connect(this.actualMasterNode);

      // BGM gain
      this.bgmVolumeNode = this.ctx.createGain();
      this.bgmVolumeNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.bgmVolumeNode.connect(this.actualMasterNode);

      // Delay effect for melody
      this.delayNode = this.ctx.createDelay(1.0);
      const delayFeedback = this.ctx.createGain();
      this.delayNode.delayTime.setValueAtTime(0.35, this.ctx.currentTime);
      delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);

      // Feedback loop
      this.delayNode.connect(delayFeedback);
      delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.actualMasterNode);

    } catch (e) {
      console.error('Failed to initialize Web Audio API', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('game_audio_muted', this.isMuted ? 'true' : 'false');

    if (this.ctx) {
      this.init(); // ensure init
      if (this.actualMasterNode) {
        this.actualMasterNode.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = vol;
    localStorage.setItem('game_audio_master_volume', vol.toString());
    if (this.ctx && this.actualMasterNode) {
      const currentMaster = this.isMuted ? 0 : vol;
      this.actualMasterNode.gain.setValueAtTime(currentMaster, this.ctx.currentTime);
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    localStorage.setItem('game_audio_music_volume', vol.toString());
    if (this.ctx && this.bgmVolumeNode) {
      this.bgmVolumeNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = vol;
    localStorage.setItem('game_audio_sfx_volume', vol.toString());
    if (this.ctx && this.masterVolumeNode) {
      this.masterVolumeNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  // --- PLAY PROCEDURAL SFX ---
  public playSfx(type: 'shoot' | 'slash' | 'dash' | 'hitEnemy' | 'hitPlayer' | 'levelUp' | 'loot' | 'craft', weaponId?: string) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    switch (type) {
      case 'slash': {
        // SWORD/AXE SWING - Pitch sweeping down + short noise burst
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterVolumeNode!);
        osc.start(t);
        osc.stop(t + 0.16);

        // Noise element
        const noise = this.createNoiseBufferNode(0.08);
        if (noise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(800, t);
          filter.Q.setValueAtTime(3, t);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.2, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.masterVolumeNode!);
          noise.start(t);
        }
        break;
      }
      case 'shoot': {
        const weapon = weaponId || 'pistol';
        if (weapon === 'pistol') {
          // Tactical Laser Pistol - swift light pulse
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);

          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.11);
        } else if (weapon === 'plasma_rifle') {
          // Plasma Repeater - snappy dual plasma pulse
          [0, 0.04].forEach((delay) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, t + delay);
            osc.frequency.exponentialRampToValueAtTime(1100, t + delay + 0.05);

            gain.gain.setValueAtTime(0.18, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.05);

            osc.connect(gain);
            gain.connect(this.masterVolumeNode!);
            osc.start(t + delay);
            osc.stop(t + delay + 0.06);
          });
        } else if (weapon === 'shotgun') {
          // Vanguard Scattershot - massive heavy explosive blast with noise
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.linearRampToValueAtTime(30, t + 0.22);

          gain.gain.setValueAtTime(0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.26);

          const noise = this.createNoiseBufferNode(0.25);
          if (noise) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, t);
            filter.frequency.exponentialRampToValueAtTime(80, t + 0.2);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.35, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterVolumeNode!);
            noise.start(t);
          }
        } else if (weapon === 'submachine_gun') {
          // Viper Micro-SMG - hyper-fast sharp pop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100, t);
          osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

          gain.gain.setValueAtTime(0.16, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.05);
        } else if (weapon === 'sniper_rifle') {
          // Hyperion Sniper - Charged Railgun hum with huge high pierce ring
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, t);
          osc.frequency.linearRampToValueAtTime(80, t + 0.35);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.36);

          // Piercing high sweep
          const oscHigh = this.ctx.createOscillator();
          const gainHigh = this.ctx.createGain();
          oscHigh.type = 'sine';
          oscHigh.frequency.setValueAtTime(2500, t);
          oscHigh.frequency.exponentialRampToValueAtTime(600, t + 0.28);

          gainHigh.gain.setValueAtTime(0.22, t);
          gainHigh.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

          oscHigh.connect(gainHigh);
          gainHigh.connect(this.masterVolumeNode!);
          oscHigh.start(t);
          oscHigh.stop(t + 0.29);
        } else if (weapon === 'rocket_launcher') {
          // Titan Rocket Launcher - whistling ignition swell followed by heavy rumble
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(60, t);
          osc.frequency.exponentialRampToValueAtTime(450, t + 0.15);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.16);

          // Heavy explosion rumble
          const boomOsc = this.ctx.createOscillator();
          const boomGain = this.ctx.createGain();
          boomOsc.type = 'sawtooth';
          boomOsc.frequency.setValueAtTime(100, t + 0.05);
          boomOsc.frequency.linearRampToValueAtTime(20, t + 0.35);

          boomGain.gain.setValueAtTime(0.45, t + 0.05);
          boomGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

          boomOsc.connect(boomGain);
          boomGain.connect(this.masterVolumeNode!);
          boomOsc.start(t + 0.05);
          boomOsc.stop(t + 0.36);
        } else if (weapon === 'flamethrower') {
          // Inferno Pyrospray - continuous short noise hiss
          const noise = this.createNoiseBufferNode(0.08);
          if (noise) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, t);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterVolumeNode!);
            noise.start(t);
          }
        } else if (weapon === 'laser_cannon') {
          // Quantum Beam Cannon - deep scientific charge beam
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.16);

          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.17);
        } else if (weapon === 'grenade_launcher') {
          // Cluster Bomber - hollow thud mortar launch
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.19);
        } else if (weapon === 'tesla_carbine') {
          // Tesla Static Carbine - electric crackle
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc1.type = 'triangle';
          osc2.type = 'sawtooth';
          
          osc1.frequency.setValueAtTime(1300, t);
          osc2.frequency.setValueAtTime(1340, t);
          osc1.frequency.exponentialRampToValueAtTime(100, t + 0.14);
          osc2.frequency.exponentialRampToValueAtTime(120, t + 0.14);

          gain.gain.setValueAtTime(0.18, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.15);
          osc2.stop(t + 0.15);
        } else if (weapon === 'void_staff') {
          // Void Singularity Staff - low gravity well spatial vortex
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(80, t);
          osc.frequency.linearRampToValueAtTime(380, t + 0.12);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.24);

          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.26);
        } else if (weapon === 'fire_staff') {
          // Pyroclastic Staff - roaring fire ball swell
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.21);

          const noise = this.createNoiseBufferNode(0.18);
          if (noise) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(450, t);
            
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.12, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterVolumeNode!);
            noise.start(t);
          }
        } else if (weapon === 'ice_staff') {
          // Glacial Frost Staff - detuned high pitch ice crystal chimes
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';

          osc1.frequency.setValueAtTime(1550, t);
          osc2.frequency.setValueAtTime(2350, t);

          gain.gain.setValueAtTime(0.16, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.masterVolumeNode!);

          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.24);
          osc2.stop(t + 0.24);
        } else if (weapon === 'wind_staff') {
          // Zephyr Storm Staff - whistling wind gale blade whoosh
          const noise = this.createNoiseBufferNode(0.2);
          if (noise) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1600, t);
            filter.frequency.exponentialRampToValueAtTime(400, t + 0.2);
            filter.Q.setValueAtTime(4, t);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterVolumeNode!);
            noise.start(t);
          }
        } else if (weapon === 'chrono_repeater') {
          // Temporal Chrono Staff - phase shifted ticking chrono-orb
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, t);
          osc.frequency.setValueAtTime(450, t + 0.05);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.16);
        } else {
          // Fallback generic shoot
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1000, t);
          osc.frequency.exponentialRampToValueAtTime(350, t + 0.12);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(t);
          osc.stop(t + 0.13);
        }
        break;
      }
      case 'dash': {
        // ENERGY DASH - Sweep noise + low triangle drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

        osc.connect(gain);
        gain.connect(this.masterVolumeNode!);
        osc.start(t);
        osc.stop(t + 0.23);

        const noise = this.createNoiseBufferNode(0.18);
        if (noise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, t);
          filter.frequency.exponentialRampToValueAtTime(150, t + 0.18);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.35, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.masterVolumeNode!);
          noise.start(t);
        }
        break;
      }
      case 'hitEnemy': {
        // CHIPTUNE CRUNCHY IMPACT
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.08);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        osc.connect(gain);
        gain.connect(this.masterVolumeNode!);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }
      case 'hitPlayer': {
        // DEEP CRUNCHY HURT
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.linearRampToValueAtTime(30, t + 0.2);

        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterVolumeNode!);
        osc.start(t);
        osc.stop(t + 0.21);

        // Add extreme low pass noise burst for blood hit crunch
        const noise = this.createNoiseBufferNode(0.15);
        if (noise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, t);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.5, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.masterVolumeNode!);
          noise.start(t);
        }
        break;
      }
      case 'levelUp': {
        // CELEBRATORY MAJOR CHIPTUNE ARPEGGIO
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chord climb
        notes.forEach((freq, idx) => {
          const noteTime = t + idx * 0.07;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.3);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(noteTime);
          osc.stop(noteTime + 0.32);
        });
        break;
      }
      case 'loot': {
        // DOUBLE BLIP - CRYSTAL / ITEM PICKUP
        const notes = [659.25, 987.77]; // E5 then B5
        notes.forEach((freq, idx) => {
          const noteTime = t + idx * 0.06;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.18, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.12);

          osc.connect(gain);
          gain.connect(this.masterVolumeNode!);
          osc.start(noteTime);
          osc.stop(noteTime + 0.14);
        });
        break;
      }
      case 'craft': {
        // ALCHEMY CLINK - Metallic hit and rising energy
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2200, t);
        osc1.frequency.exponentialRampToValueAtTime(1400, t + 0.1);

        gain1.gain.setValueAtTime(0.25, t);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc1.connect(gain1);
        gain1.connect(this.masterVolumeNode!);
        osc1.start(t);
        osc1.stop(t + 0.13);

        // Low anvil hum
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(120, t);

        gain2.gain.setValueAtTime(0.35, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc2.connect(gain2);
        gain2.connect(this.masterVolumeNode!);
        osc2.start(t);
        osc2.stop(t + 0.26);
        break;
      }
    }
  }

  // Helper: generates white noise dynamically
  private createNoiseBufferNode(duration: number): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      return noise;
    } catch {
      return null;
    }
  }

  // --- PROCEDURAL CYBERPUNK BACKGROUND MUSIC ---
  private currentLevelIndex: number = 1;

  // Level-specific scales and synth parameters
  private levelScales = {
    0: { // Main Menu - Atmospheric C Minor Ambient Space Drone Vibe
      bass: [65.41, 65.41, 77.78, 77.78, 87.31, 87.31, 58.27, 65.41], // C2, D#2, F2, A#1, C2
      melody: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25], // C4, D#4, F4, G4, A#4, C5
      oscType: 'triangle' as OscillatorType,
    },
    1: { // Overgrown Ruins - Mysterious A Dorian / forest vibe
      bass: [55.00, 55.00, 65.41, 65.41, 73.42, 73.42, 49.00, 58.27], // A1, C2, D2, G1, A#1
      melody: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00], // A3, B3, C4, D4, E4, G4, A4
      oscType: 'triangle' as OscillatorType,
    },
    2: { // Obsidian Crypts - Dark Gothic F# Phrygian / underworld vibe
      bass: [46.25, 46.25, 48.99, 48.99, 55.00, 55.00, 41.20, 46.25], // F#1, G1, A1, E1
      melody: [185.00, 196.00, 220.00, 246.94, 277.18, 329.63, 369.99], // F#3, G3, A3, B3, C#4, E4, F#4
      oscType: 'sawtooth' as OscillatorType,
    },
    3: { // Cryo Glaciers - Icy E Minor Pentatonic (Sine bell chime vibe)
      bass: [41.20, 41.20, 49.00, 49.00, 55.00, 55.00, 36.71, 41.20], // E1, G1, A1, D1
      melody: [329.63, 392.00, 440.00, 493.88, 587.33, 659.25], // E4, G4, A4, B4, D5, E5
      oscType: 'sine' as OscillatorType,
    },
    4: { // Toxic Refineries - Aggressive D Locrian / sludge metal vibe
      bass: [36.71, 38.89, 43.65, 36.71, 38.89, 32.70, 36.71, 43.65], // D1, D#1, F1, C1
      melody: [146.83, 155.56, 174.61, 196.00, 220.00, 233.08, 293.66], // D3, D#3, F3, G3, A3, A#3, D4
      oscType: 'sawtooth' as OscillatorType,
    },
    5: { // Plasma Core - Uplifting & Driving Cyber Final Trance (G# Minor)
      bass: [51.91, 51.91, 61.74, 61.74, 69.30, 69.30, 58.27, 51.91], // G#1, B1, C#2, A#1
      melody: [207.65, 246.94, 277.18, 311.13, 369.99, 415.30, 493.88, 554.37], // G#3, B3, C#4, D#4, F#4, G#4
      oscType: 'sawtooth' as OscillatorType,
    }
  };

  public playBgm(level?: number) {
    this.init();
    const lvl = level === 0 ? 0 : (level || 1);
    
    // If BGM is already running for the exact same level, keep it playing seamlessly.
    if (this.isBgmPlaying && this.currentLevelIndex === lvl) return;

    // Transitioning to a new level's song: stop previous BGM sequencer first
    if (this.isBgmPlaying) {
      this.stopBgm();
    }

    this.currentLevelIndex = lvl;
    this.isBgmPlaying = true;

    // Load appropriate tempos (BPM)
    if (lvl === 0) {
      this.bpm = 85;
    } else if (lvl === 1) {
      this.bpm = 110;
    } else if (lvl === 2) {
      this.bpm = 126;
    } else if (lvl === 3) {
      this.bpm = 98;
    } else if (lvl === 4) {
      this.bpm = 122;
    } else if (lvl === 5) {
      this.bpm = 140;
    } else {
      this.bpm = 120;
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.currentStep = 0;
      this.scheduler();
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  private scheduler() {
    if (!this.isBgmPlaying || !this.ctx) return;

    // Schedule all notes that fit within the lookahead window
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    // Check again soon
    this.sequencerTimer = setTimeout(() => this.scheduler(), this.lookahead);
  }

  private advanceStep() {
    // 16-step pattern sequencer
    const secondsPerStep = 60.0 / this.bpm / 2.0; // 8th notes
    this.nextNoteTime += secondsPerStep;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleNote(step: number, time: number) {
    if (!this.ctx || this.isMuted) return;

    const lvl = this.currentLevelIndex;
    const config = this.levelScales[lvl as keyof typeof this.levelScales] || this.levelScales[1];

    // A. DEEP LEVEL-SPECIFIC SYNTH BASS - Eighth notes
    const bassIdx = Math.floor(step / 2) % config.bass.length;
    const rawBassFreq = config.bass[bassIdx];
    
    // Octave jumps to drive the bass groove
    let bassFreq = rawBassFreq;
    if (step % 4 === 2 && lvl !== 0) bassFreq *= 2; 

    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    
    bassOsc.type = config.oscType;
    bassOsc.frequency.setValueAtTime(bassFreq, time);

    // Deep lowpass filter to make the bass rumble cleanly
    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(lvl === 0 ? 180 : 260, time);

    // Balance volume
    const bassVol = lvl === 0 ? 0.16 : (lvl === 4 ? 0.28 : (lvl === 5 ? 0.25 : 0.22));
    bassGain.gain.setValueAtTime(bassVol, time);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + (lvl === 0 ? 0.35 : 0.22));

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.bgmVolumeNode!);

    bassOsc.start(time);
    bassOsc.stop(time + (lvl === 0 ? 0.4 : 0.24));

    // B. CYBER DRUM SYSTEM (Procedural drums tailored to level vibe)
    // Kick Drum triggers
    let playKick = false;
    if (lvl === 0) {
      playKick = (step === 0 || step === 8);
    } else if (lvl === 1 || lvl === 3) {
      playKick = (step === 0 || step === 8 || step === 12);
    } else if (lvl === 2) {
      playKick = (step === 0 || step === 3 || step === 8 || step === 11);
    } else if (lvl === 4) {
      playKick = (step === 0 || step === 6 || step === 8 || step === 14);
    } else if (lvl === 5) {
      playKick = (step === 0 || step === 4 || step === 8 || step === 12);
    }

    if (playKick) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      
      const startFreq = lvl === 0 ? 100 : (lvl === 4 ? 120 : (lvl === 3 ? 160 : 140));
      const endFreq = lvl === 0 ? 30 : (lvl === 3 ? 35 : 45);
      const decayTime = lvl === 0 ? 0.16 : (lvl === 3 ? 0.18 : 0.12);

      kickOsc.frequency.setValueAtTime(startFreq, time);
      kickOsc.frequency.exponentialRampToValueAtTime(endFreq, time + decayTime);

      kickGain.gain.setValueAtTime(lvl === 0 ? 0.38 : (lvl === 5 ? 0.65 : 0.55), time);
      kickGain.gain.exponentialRampToValueAtTime(0.01, time + decayTime + 0.02);

      kickOsc.connect(kickGain);
      kickGain.connect(this.bgmVolumeNode!);
      kickOsc.start(time);
      kickOsc.stop(time + decayTime + 0.03);
    }

    // Snare Drum triggers
    let playSnare = false;
    if (lvl === 0) {
      playSnare = false; // No snare in main menu for a relaxed atmosphere
    } else if (lvl === 1 || lvl === 2 || lvl === 5) {
      playSnare = (step === 4 || step === 12);
    } else if (lvl === 3) {
      playSnare = (step === 8);
    } else if (lvl === 4) {
      playSnare = (step === 4 || step === 10 || step === 12);
    }

    if (playSnare) {
      const snareNoise = this.createNoiseBufferNode(lvl === 3 ? 0.22 : 0.12);
      if (snareNoise) {
        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = lvl === 4 ? 'lowpass' : 'bandpass';
        snareFilter.frequency.setValueAtTime(lvl === 4 ? 800 : 1000, time);
        snareFilter.Q.setValueAtTime(lvl === 4 ? 4 : 2, time);

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(lvl === 5 ? 0.22 : 0.18, time);
        snareGain.gain.exponentialRampToValueAtTime(0.01, time + (lvl === 3 ? 0.2 : 0.12));

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.bgmVolumeNode!);
        snareNoise.start(time);
      }
    }

    // Hi-hat triggers
    let playHat = false;
    if (lvl === 0) {
      playHat = (step % 8 === 4); // Slow sparse high hat
    } else if (lvl === 1 || lvl === 2) {
      playHat = (step % 4 === 2);
    } else if (lvl === 3) {
      playHat = (step === 2 || step === 6 || step === 10 || step === 14);
    } else if (lvl === 4) {
      playHat = (step % 2 === 1);
    } else if (lvl === 5) {
      playHat = true; // continuous driving hats!
    }

    if (playHat) {
      const hatNoise = this.createNoiseBufferNode(0.04);
      if (hatNoise) {
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(lvl === 0 || lvl === 3 ? 9000 : 7000, time);

        const hatGain = this.ctx.createGain();
        const hatVol = lvl === 0 ? 0.018 : (lvl === 5 ? 0.025 : (lvl === 4 ? 0.045 : 0.035));
        hatGain.gain.setValueAtTime(hatVol, time);
        hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        hatNoise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.bgmVolumeNode!);
        hatNoise.start(time);
      }
    }

    // C. SYNTH AMBIENT MELODY
    const playMelodyBeats = lvl === 0 ? [0, 4, 8, 12] : (lvl === 5 ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 3, 6, 11, 14]);
    const threshold = lvl === 0 ? 0.55 : (lvl === 5 ? 0.35 : 0.45);
    
    if (playMelodyBeats.includes(step) && Math.random() > threshold) {
      const mIdx = (Math.floor(time * 0.3) + step) % config.melody.length;
      const freq = config.melody[mIdx];

      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();
      
      if (lvl === 0 || lvl === 3) {
        melOsc.type = 'sine'; // Sine chime bells for main menu ambient / cryo glacers
      } else {
        melOsc.type = config.oscType;
      }
      
      melOsc.frequency.setValueAtTime(freq, time);

      const ringTime = lvl === 0 ? 0.8 : (lvl === 3 ? 0.7 : (lvl === 5 ? 0.28 : 0.4));
      melGain.gain.setValueAtTime(lvl === 0 ? 0.14 : (lvl === 3 ? 0.16 : 0.12), time);
      melGain.gain.exponentialRampToValueAtTime(0.001, time + ringTime);

      melOsc.connect(melGain);
      melGain.connect(this.delayNode!);
      melGain.connect(this.bgmVolumeNode!);

      melOsc.start(time);
      melOsc.stop(time + ringTime + 0.05);
    }
  }
}

// Global shared singleton
export const audio = new SoundEngine();
export default audio;
