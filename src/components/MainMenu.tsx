import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Play, Shield, HelpCircle, Heart, Sparkles, BookOpen, Skull, Flame, Volume2, VolumeX, Award, Settings, BarChart2, ShieldCheck, LogOut, RotateCcw, Coins, Hammer, TrendingUp } from 'lucide-react';
import { LEVEL_THEMES } from '../constants';
import { audio } from '../lib/audio';
import { saveSystem, PlayerSaveData } from '../systems/saveSystem';
import InventoryModal from './InventoryModal';
import MarketUI from './MarketUI';
import UpgradeMenu from './UpgradeMenu';
import BlacksmithMenu from './BlacksmithMenu';
import EnemyCodex from './EnemyCodex';

interface MainMenuProps {
  onStartGame: (startingLevel: number) => void;
}

type MenuSection = 'play' | 'inventory' | 'settings' | 'statistics' | 'credits' | 'exit';

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => saveSystem.load());
  const [activeSection, setActiveSection] = useState<MenuSection>('play');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isMuted, setIsMuted] = useState(audio.getMuteState());
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isBlacksmithOpen, setIsBlacksmithOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [statsSubTab, setStatsSubTab] = useState<'summary' | 'codex'>('summary');

  // Custom persistent configurations
  const [masterVolume, setMasterVolume] = useState(() => audio.getMasterVolume());
  const [musicVolume, setMusicVolume] = useState(() => audio.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState(() => audio.getSfxVolume());
  const [graphicsQuality, setGraphicsQuality] = useState(() => localStorage.getItem('game_graphics_quality') || 'high');
  const [targetFps, setTargetFps] = useState(() => localStorage.getItem('game_target_fps') || 'uncapped');

  // Sync unlocked level to selected level by default
  useEffect(() => {
    setSelectedLevel(Math.min(LEVEL_THEMES.length, saveData.unlockedLevel || 1));
  }, [saveData]);

  // Animated background dust particle generator
  const [dustParticles, setDustParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);
  useEffect(() => {
    const list = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      duration: 10 + Math.random() * 20,
    }));
    setDustParticles(list);
  }, []);

  // Play main menu background music (BGM Level 0) on mount
  useEffect(() => {
    audio.playBgm(0);
    return () => {
      audio.stopBgm();
    };
  }, []);

  const toggleMute = () => {
    audio.toggleMute();
    setIsMuted(audio.getMuteState());
    if (!audio.getMuteState()) {
      audio.playSfx('loot');
    }
  };

  const handleResetData = () => {
    const resetData = saveSystem.reset();
    setSaveData(resetData);
    setResetConfirm(false);
    audio.playSfx('levelUp');
  };

  const handleRefreshSaveData = () => {
    setSaveData(saveSystem.load());
  };

  const isDesktop = typeof window !== 'undefined' && !/Mobi|Android/i.test(navigator.userAgent);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white flex flex-col items-center justify-center p-3 md:p-6 select-none">
      {/* Animated Dust background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {dustParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: '100%', x: `${p.x}%`, opacity: 0 }}
            animate={{ y: '-10%', opacity: [0, 0.4, 0.4, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full bg-emerald-500/25 blur-xs"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </div>

      {/* Atmospheric radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-950/15 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Floating Audio Control */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={toggleMute}
          className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 cursor-pointer text-slate-300 hover:text-white transition-all flex items-center justify-center"
          title={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
        </button>
      </div>

      {/* Main Container */}
      <div className={`relative w-full flex flex-col items-center space-y-3 md:space-y-4 z-10 transition-all duration-300 ${
        activeSection === 'statistics' && statsSubTab === 'codex' ? 'max-w-5xl' : 'max-w-2xl'
      }`}>
        
        {/* Skull Logo & Game Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="flex items-center gap-3 text-center md:text-left"
        >
          <div className="relative flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-full bg-slate-900 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
            <Skull className="w-5 h-5 md:w-7 md:h-7 text-emerald-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-slate-950 animate-ping" />
          </div>

          <div className="flex flex-col items-start space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-500 uppercase select-none drop-shadow-md leading-none">
              ISOMETRIC HERO
            </h1>
            <p className="text-slate-400 font-mono text-[8px] uppercase tracking-wider">
              Action RPG • Alchemy Sandbox • Boss Slayers
            </p>
          </div>
        </motion.div>

        {/* Navigation Tab Bar */}
        <div className="flex justify-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full">
          {(['play', 'inventory', 'settings', 'statistics', 'credits', 'exit'] as MenuSection[]).map((section) => {
            if (section === 'exit' && !isDesktop) return null; // hide exit on mobile devices

            return (
              <button
                key={section}
                onClick={() => {
                  if (section === 'inventory') {
                    setIsInventoryOpen(true);
                  } else {
                    setActiveSection(section);
                  }
                  audio.playSfx('loot');
                }}
                className={`flex-1 py-1.5 md:py-2 px-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeSection === section && section !== 'inventory'
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-inner'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {section === 'play' && <Play size={11} className="fill-current hidden sm:inline" />}
                {section === 'inventory' && <ShieldCheck size={11} className="hidden sm:inline" />}
                {section === 'settings' && <Settings size={11} className="hidden sm:inline" />}
                {section === 'statistics' && <BarChart2 size={11} className="hidden sm:inline" />}
                {section === 'credits' && <Award size={11} className="hidden sm:inline" />}
                {section === 'exit' && <LogOut size={11} className="hidden sm:inline" />}
                <span>{section}</span>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="w-full bg-slate-900/85 border border-white/10 rounded-2xl p-4 md:p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {activeSection === 'play' && (
              <motion.div
                key="play"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="space-y-3.5"
              >
                {/* Tactical Preparation Area */}
                <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-3">
                  <button
                    onClick={() => {
                      setIsMarketOpen(true);
                      audio.playSfx('loot');
                    }}
                    className="flex flex-col items-center justify-center p-2 bg-gradient-to-b from-amber-500/5 to-amber-500/10 hover:from-amber-500/10 hover:to-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer text-center group"
                  >
                    <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-all mb-0.5" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold">Marketplace</span>
                    <span className="text-[7px] text-slate-500">Buy/Sell Loot</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUpgradesOpen(true);
                      audio.playSfx('loot');
                    }}
                    className="flex flex-col items-center justify-center p-2 bg-gradient-to-b from-purple-500/5 to-purple-500/10 hover:from-purple-500/10 hover:to-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all cursor-pointer text-center group"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-all mb-0.5" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-purple-300 font-bold">Upgrades</span>
                    <span className="text-[7px] text-slate-500">Stats Boost</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsBlacksmithOpen(true);
                      audio.playSfx('loot');
                    }}
                    className="flex flex-col items-center justify-center p-2 bg-gradient-to-b from-red-500/5 to-red-500/10 hover:from-red-500/10 hover:to-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all cursor-pointer text-center group"
                  >
                    <Hammer className="w-4 h-4 text-red-400 group-hover:scale-110 transition-all mb-0.5" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-red-300 font-bold">Blacksmith</span>
                    <span className="text-[7px] text-slate-500">Forge Gear</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5 text-emerald-400" />
                    Select Deployment Level (1 - 6)
                  </label>
                  <button
                    onClick={() => {
                      setShowHowToPlay(true);
                      audio.playSfx('loot');
                    }}
                    className="text-[9px] font-mono text-emerald-400 hover:underline uppercase font-bold"
                  >
                    Intel Guide
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[16vh] md:max-h-[22vh] overflow-y-auto pr-1">
                  {LEVEL_THEMES.map((theme) => {
                    const isSelected = selectedLevel === theme.level;
                    const isLocked = theme.level > (saveData.unlockedLevel || 1);
                    return (
                      <button
                        key={theme.level}
                        disabled={isLocked}
                        onClick={() => {
                          setSelectedLevel(theme.level);
                          audio.playSfx('loot');
                        }}
                        className={`relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isLocked
                            ? 'opacity-40 bg-zinc-950/40 border-zinc-900/50 cursor-not-allowed select-none'
                            : isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                            : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10'
                        }`}
                      >
                        {isLocked ? (
                          <span className="absolute top-2 right-2 text-[8px] font-mono text-slate-500 flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 rounded-full">
                            🔒 Locked
                          </span>
                        ) : isSelected ? (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                        ) : (
                          <span className="absolute top-2 right-2 text-[8px] text-emerald-400/40 font-mono font-bold uppercase tracking-wider">
                            Clear
                          </span>
                        )}

                        <span className="text-[8px] font-mono text-slate-400 uppercase font-bold">
                          LEVEL 0{theme.level}
                        </span>
                        <span className="text-xs font-black text-emerald-300 mt-0.5 uppercase font-sans">
                          {theme.name}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-tight line-clamp-1">
                          {theme.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStartGame(selectedLevel)}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white font-sans text-xs font-bold shadow-lg shadow-emerald-500/20 border border-emerald-400/30 uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-white text-white" />
                    Deploy Character
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeSection === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-4 text-sans"
              >
                <div className="border-b border-white/5 pb-1.5">
                  <h3 className="text-base font-bold text-emerald-300 uppercase font-sans">System Configurations</h3>
                  <p className="text-slate-400 text-[10px] font-mono">Configure save-data, sound levels, and visual quality</p>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {/* SOUND SETTINGS */}
                  <div className="space-y-3 bg-white/5 border border-white/5 rounded-2xl p-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Sound Settings</h4>
                      <button
                        onClick={toggleMute}
                        className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border bg-slate-950 border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        {isMuted ? <VolumeX size={11} className="text-red-400" /> : <Volume2 size={11} className="text-emerald-400" />}
                        <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                      </button>
                    </div>

                    {/* Master Volume */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-300 font-bold">Master Volume</span>
                        <span className="text-emerald-400 font-mono font-bold">{Math.round(masterVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={masterVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setMasterVolume(val);
                          audio.setMasterVolume(val);
                        }}
                        className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-300 font-bold">Background Music</span>
                        <span className="text-emerald-400 font-mono font-bold">{Math.round(musicVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={musicVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setMusicVolume(val);
                          audio.setMusicVolume(val);
                        }}
                        className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* SFX Volume */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-300 font-bold">Sound Effects (SFX)</span>
                        <span className="text-emerald-400 font-mono font-bold">{Math.round(sfxVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sfxVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSfxVolume(val);
                          audio.setSfxVolume(val);
                        }}
                        className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* PERFORMANCE SETTINGS */}
                  <div className="space-y-3 bg-white/5 border border-white/5 rounded-2xl p-3">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono border-b border-white/5 pb-1.5">Performance Settings</h4>

                    {/* Graphics Quality */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-300 font-bold block">Graphics Quality</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['low', 'medium', 'high'] as const).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => {
                              setGraphicsQuality(quality);
                              localStorage.setItem('game_graphics_quality', quality);
                              audio.playSfx('loot');
                            }}
                            className={`py-1 px-2 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                              graphicsQuality === quality
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-inner'
                                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950/70'
                            }`}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                      <p className="text-[8px] text-slate-400 leading-tight">
                        {graphicsQuality === 'low' && 'Optimized for older mobile devices. Disables render shadows, cuts down particle limits, and disables weather overlays.'}
                        {graphicsQuality === 'medium' && 'Balanced performance. Disables heavy blurred glow shadows but keeps full trail and weather effects.'}
                        {graphicsQuality === 'high' && 'Full visual fidelity. Renders high-quality blurred canvas glows, dense particle explosions, and weather tempests.'}
                      </p>
                    </div>

                    {/* Frame Rate Selection */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <span className="text-[11px] text-slate-300 font-bold block">Target Frame Rate</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['30', '60', 'uncapped'] as const).map((fps) => (
                          <button
                            key={fps}
                            onClick={() => {
                              setTargetFps(fps);
                              localStorage.setItem('game_target_fps', fps);
                              audio.playSfx('loot');
                            }}
                            className={`py-1 px-2 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                              targetFps === fps
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-inner'
                                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950/70'
                            }`}
                          >
                            {fps === 'uncapped' ? 'Uncapped' : `${fps} FPS`}
                          </button>
                        ))}
                      </div>
                      <p className="text-[8px] text-slate-400 leading-tight">
                        Capping frame rates is recommended on mobile browsers to reduce thermal throttling and save battery life.
                      </p>
                    </div>
                  </div>

                  {/* RESET BUTTON */}
                  <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div>
                      <span className="text-xs font-bold text-red-400 block">Wipe Persistent Progress</span>
                      <span className="text-[9px] text-slate-400 font-sans leading-tight block mt-0.5">Deletes all saved weapons, armor upgrades, gold, and unlock progress permanently.</span>
                    </div>

                    {!resetConfirm ? (
                      <button
                        onClick={() => {
                          setResetConfirm(true);
                          audio.playSfx('loot');
                        }}
                        className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all shrink-0"
                      >
                        Reset Data
                      </button>
                    ) : (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={handleResetData}
                          className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setResetConfirm(false)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'statistics' && (
              <motion.div
                key="statistics"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-4 h-full flex flex-col"
              >
                {/* Sub-tab Navigation */}
                <div className="flex bg-slate-950/80 border border-white/10 rounded-2xl p-1 gap-1 w-full max-w-xs mb-1">
                  <button
                    onClick={() => {
                      audio.playSfx('loot');
                      setStatsSubTab('summary');
                    }}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      statsSubTab === 'summary'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold shadow-inner'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    Dossier Report
                  </button>
                  <button
                    onClick={() => {
                      audio.playSfx('loot');
                      setStatsSubTab('codex');
                    }}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      statsSubTab === 'codex'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold shadow-inner'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    Enemy Codex
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {statsSubTab === 'summary' ? (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-white/5 pb-2">
                        <h3 className="text-lg font-bold text-emerald-300 uppercase font-sans">Persistent Dossier logs</h3>
                        <p className="text-slate-400 text-xs font-mono">Durable telemetry logs of player combat effectiveness</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                          <span className="text-slate-400 block text-[10px] uppercase">Enemies Slayed</span>
                          <span className="text-xl font-black text-white mt-1 block">
                            {saveData.stats?.zombiesKilled || 0}
                          </span>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                          <span className="text-slate-400 block text-[10px] uppercase">Bosses Conquered</span>
                          <span className="text-xl font-black text-white mt-1 block">
                            {saveData.stats?.bossesDefeatedCount || 0}
                          </span>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                          <span className="text-slate-400 block text-[10px] uppercase">Cumulative Gold Earned</span>
                          <span className="text-xl font-black text-amber-400 mt-1 block">
                            {saveData.stats?.goldEarned || 0}g
                          </span>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                          <span className="text-slate-400 block text-[10px] uppercase">Levels Unlocked</span>
                          <span className="text-xl font-black text-emerald-400 mt-1 block">
                            {saveData.unlockedLevel || 1} / {LEVEL_THEMES.length}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="codex"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full"
                    >
                      <EnemyCodex saveData={saveData} onBack={() => setStatsSubTab('summary')} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeSection === 'credits' && (
              <motion.div
                key="credits"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-lg font-bold text-emerald-300 uppercase font-sans">Production Credits</h3>
                  <p className="text-slate-400 text-xs font-mono">Creative team behind Isometric Hero</p>
                </div>

                <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                    <div>
                      <strong className="text-white block uppercase tracking-wider font-mono text-[11px]">Lead Architect & Programmer</strong>
                      <span className="text-slate-400">Google AI Studio Build Agent</span>
                    </div>
                    <div>
                      <strong className="text-white block uppercase tracking-wider font-mono text-[11px]">Senior Game Developer</strong>
                      <span className="text-slate-400">Google DeepMind Team</span>
                    </div>
                    <div>
                      <strong className="text-white block uppercase tracking-wider font-mono text-[11px]">VFX & Audio Compositing</strong>
                      <span className="text-slate-400">Isometric Survival Core Engine Assets</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'exit' && (
              <motion.div
                key="exit"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6 text-center"
              >
                <div className="py-8 space-y-3">
                  <Skull className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <h3 className="text-lg font-black text-white uppercase font-sans">Exit Application?</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You can safely close this browser window or log out. Your inventory modifications and character progress are permanently persisted.
                  </p>
                  <button
                    onClick={() => {
                      setActiveSection('play');
                      audio.playSfx('loot');
                    }}
                    className="mt-4 px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Return to menu
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Survival Guide Modal */}
      <AnimatePresence>
        {showHowToPlay && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-2xl"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold font-sans text-emerald-300 uppercase tracking-wide">
                  Survival Guide & Intel
                </h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-200 font-sans max-h-[50vh] overflow-y-auto pr-2">
                <div>
                  <h4 className="font-bold text-sm text-emerald-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-400" /> Movement Controls
                  </h4>
                  <p>
                    <strong>Desktop:</strong> Move with <strong>W, A, S, D</strong> or <strong>Arrow Keys</strong>. Use <strong>H</strong> to heal with potions, and <strong>C</strong> to open crafting.
                  </p>
                  <p className="mt-1">
                    <strong>Mobile:</strong> Drag the digital joystick on the screen margins. Tap indicators to consume potions.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-emerald-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-emerald-400" /> Auto Combat Attacks
                  </h4>
                  <p>
                    Your hero automatically slashes or fires projectiles when any monster steps within weapon range! Melee weapons swing in a circular arc. Bows fire glowing arrows.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-emerald-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Skull className="w-4 h-4 text-emerald-400" /> Level Variety & AI Patterns
                  </h4>
                  <p>
                    Every level introduces 3 custom enemies with distinct behaviors: Goblins, Slimes, Scorpions, flying Fire Drakes, or Sand Golems. Level bosses use multi-phase bullet hell attacks when health is low.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-emerald-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" /> Outside Inventory Customization
                  </h4>
                  <p>
                    Equipping gear is restricted to the Main Menu armory. Open the Inventory tab to modify weapons, armor, and accessories to gain massive flat attack speed, damage reflection, critical hit chances, and max health pools before you deploy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowHowToPlay(false);
                  audio.playSfx('loot');
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                Close Survival Guide
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Menu Inventory Modal trigger */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onSaveDataChanged={handleRefreshSaveData}
      />

      {/* Strategic Market Modal trigger */}
      <MarketUI
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        onSaveDataChanged={handleRefreshSaveData}
      />

      {/* Genome Upgrades Modal trigger */}
      <UpgradeMenu
        isOpen={isUpgradesOpen}
        onClose={() => setIsUpgradesOpen(false)}
        onSaveDataChanged={handleRefreshSaveData}
      />

      {/* Lichfire Forge Modal trigger */}
      <BlacksmithMenu
        isOpen={isBlacksmithOpen}
        onClose={() => setIsBlacksmithOpen(false)}
        onSaveDataChanged={handleRefreshSaveData}
      />
    </div>
  );
}
