import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Coins, Dumbbell, Shield, Sparkles, Heart, Zap, 
  RefreshCw, TrendingUp, Compass, ArrowUp, CheckCircle, Flame,
  Swords, Target, Wind, Ghost, Dna, Clover, Brain
} from 'lucide-react';
import { saveSystem, PlayerSaveData } from '../systems/saveSystem';
import { UPGRADE_LIST, getUpgradeCost, getUpgradeStatBonus, UpgradeType, DEFAULT_UPGRADES } from '../systems/upgradeSystem';
import { audio } from '../lib/audio';

const upgradeIconMap: Record<UpgradeType, React.ReactElement> = {
  maxHealth: <Heart className="w-5 h-5 text-rose-500" />,
  attackDamage: <Swords className="w-5 h-5 text-red-500" />,
  defense: <Shield className="w-5 h-5 text-emerald-500" />,
  critChance: <Target className="w-5 h-5 text-amber-500" />,
  critDamage: <Flame className="w-5 h-5 text-orange-500" />,
  attackSpeed: <Zap className="w-5 h-5 text-cyan-500 animate-pulse" />,
  movementSpeed: <Wind className="w-5 h-5 text-sky-400" />,
  dodgeChance: <Ghost className="w-5 h-5 text-purple-400" />,
  healthRegen: <Dna className="w-5 h-5 text-pink-400" />,
  luck: <Clover className="w-5 h-5 text-green-400" />,
  coinMultiplier: <Coins className="w-5 h-5 text-yellow-400" />,
  xpMultiplier: <Brain className="w-5 h-5 text-indigo-400" />,
};

interface UpgradeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDataChanged?: () => void;
}

export default function UpgradeMenu({ isOpen, onClose, onSaveDataChanged }: UpgradeMenuProps) {
  const [saveData, setSaveData] = useState<PlayerSaveData | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeType | null>(null);
  const [hoveredUpgrade, setHoveredUpgrade] = useState<UpgradeType | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<UpgradeType | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSaveData(saveSystem.load());
      setSelectedUpgrade(null);
    }
  }, [isOpen]);

  if (!isOpen || !saveData) return null;

  const handleUpgrade = (type: UpgradeType) => {
    const upgrades = saveData.upgrades || {};
    const currentLvl = upgrades[type] || 0;
    const upgradeConfig = UPGRADE_LIST.find(u => u.id === type);

    if (!upgradeConfig) return;

    if (currentLvl >= upgradeConfig.maxLevel) {
      audio.playSfx('loot');
      setErrorText("Upgrade at maximum capacity!");
      setTimeout(() => setErrorText(null), 3000);
      return;
    }

    const cost = getUpgradeCost(type, currentLvl);
    if (saveData.gold < cost) {
      audio.playSfx('loot');
      setErrorText("Insufficient Gold coins!");
      setTimeout(() => setErrorText(null), 3000);
      return;
    }

    // Spend gold, increment upgrade level
    audio.playSfx('levelUp');
    const updated = saveSystem.load();
    updated.gold -= cost;
    updated.upgrades = {
      ...DEFAULT_UPGRADES,
      ...(updated.upgrades || {}),
      [type]: currentLvl + 1
    };

    saveSystem.save(updated);
    setSaveData(updated);
    if (onSaveDataChanged) onSaveDataChanged();

    // Trigger success flash
    setSuccessAnimation(type);
    setTimeout(() => setSuccessAnimation(null), 800);
  };

  const renderUpgradeDetails = (type: UpgradeType) => {
    const config = UPGRADE_LIST.find(u => u.id === type)!;
    const currentLvl = saveData.upgrades[type] || 0;
    const isMax = currentLvl >= config.maxLevel;
    const cost = getUpgradeCost(type, currentLvl);
    const canAfford = saveData.gold >= cost;
    const isFlashing = successAnimation === type;

    return (
      <div className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="text-center p-4 rounded-2xl bg-slate-950/80 border border-white/10 relative overflow-hidden">
            <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Genome Highlight
            </div>
            <div className="mx-auto w-12 h-12 flex items-center justify-center animate-pulse">
              {React.cloneElement(upgradeIconMap[config.id], { className: "w-10 h-10" })}
            </div>
            <span className="block text-sm font-black text-white mt-3 uppercase tracking-wide">
              {config.name}
            </span>
            <span className="text-xs font-mono text-purple-300 mt-1 block">
              Matrix Tier {currentLvl}/{config.maxLevel} Upgrade
            </span>
          </div>

          {/* Attribute Boost Comparison */}
          <div className="space-y-2.5 bg-slate-900/60 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-1">
              Attribute Output
            </span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Boost:</span>
                <span className="text-slate-300 font-bold">
                  +{getUpgradeStatBonus(type, currentLvl)}
                </span>
              </div>

              {!isMax && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Next Boost:</span>
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    +{getUpgradeStatBonus(type, currentLvl + 1)}
                    <ArrowUp size={11} className="text-purple-400 animate-bounce" />
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 text-[10px] font-mono text-slate-400 leading-relaxed">
            🔬 Genome modifications are permanent, fully synthesized, and applied instantly to the player's character upon deploying to any active zone.
          </div>
        </div>

        {/* Train Action Button inside the panel */}
        <div className="pt-3 border-t border-white/5">
          {isMax ? (
            <div className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-500 font-sans font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
              <CheckCircle size={12} />
              <span>Max Capacity Reached</span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpgrade(type)}
              disabled={!canAfford}
              className={`w-full py-2.5 rounded-xl text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 shadow-lg transition-all ${
                canAfford
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 border border-purple-400/40 shadow-purple-500/10 hover:brightness-110'
                  : 'bg-zinc-800 border border-zinc-700/50 text-zinc-500 cursor-not-allowed shadow-none'
              }`}
            >
              <TrendingUp size={12} />
              <span>Synthesize Gene ({cost.toLocaleString()}g)</span>
            </motion.button>
          )}
        </div>
      </div>
    );
  };

  const activeFocusType = hoveredUpgrade || selectedUpgrade;

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-2 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-4xl w-full h-[95vh] md:h-[80vh] bg-slate-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Error text overlay */}
        <AnimatePresence>
          {errorText && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.4)] border border-red-400/30 flex items-center gap-2"
            >
              <span>⚠️ {errorText}</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Decorative background grids */}
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-5" />

        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/20 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black uppercase font-sans tracking-wide text-purple-300">
                Permanent Stats Training Matrix
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                Enhance your genome to unlock passive modifiers that persist across survival attempts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Gold balance */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="text-amber-300 text-xs sm:text-sm font-black font-mono">
                {saveData.gold.toLocaleString()}
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">GOLD</span>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Central split screen workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* LEFT PANEL: Upgrade bento grid */}
          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            {UPGRADE_LIST.map(config => {
              const type = config.id;
              const currentLvl = saveData.upgrades[type] || 0;
              const isMax = currentLvl >= config.maxLevel;
              const cost = getUpgradeCost(type, currentLvl);
              const canAfford = saveData.gold >= cost;
              const isSelected = selectedUpgrade === type;
              const isFlashing = successAnimation === type;

              return (
                <button
                  key={type}
                  onMouseEnter={() => setHoveredUpgrade(type)}
                  onMouseLeave={() => setHoveredUpgrade(null)}
                  onClick={() => {
                    setSelectedUpgrade(type);
                    audio.playSfx('loot');
                  }}
                  className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isFlashing
                      ? 'bg-emerald-500/25 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : isSelected
                        ? 'bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/5'
                        : isMax
                          ? 'bg-zinc-950/20 border-zinc-800/80 text-zinc-500'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                  }`}
                >
                  <div className="w-full">
                    {/* Level marker and name */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {upgradeIconMap[config.id]}
                        <span className={`text-xs font-black uppercase tracking-wide ${isMax ? 'text-zinc-500' : 'text-slate-100'}`}>
                          {config.name.split(' (')[0]}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/15">
                        LVL {currentLvl}/{config.maxLevel}
                      </span>
                    </div>

                    <p className={`text-[10px] mt-1.5 leading-relaxed truncate ${isMax ? 'text-zinc-600' : 'text-slate-400'}`}>
                      {config.description}
                    </p>

                    {/* Progress indicators */}
                    <div className="mt-2.5 flex gap-0.5 h-1">
                      {Array.from({ length: config.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all ${
                            i < currentLvl
                              ? isFlashing 
                                ? 'bg-emerald-400' 
                                : 'bg-purple-400'
                              : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pricing action footer */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center w-full font-mono text-[10px]">
                    {isMax ? (
                      <span className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-0.5">
                        <CheckCircle size={10} /> MAXED
                      </span>
                    ) : (
                      <>
                        <span className="text-slate-500">Train Cost:</span>
                        <span className={`font-black flex items-center gap-0.5 ${canAfford ? 'text-amber-300' : 'text-red-400'}`}>
                          <Coins size={10} className="mr-0.5" />
                          {cost.toLocaleString()}g
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT PANEL: Focused genome details (Desktop only) */}
          <div className="hidden md:flex md:w-80 bg-slate-950/45 p-6 border-l border-white/5 flex-col justify-between overflow-y-auto">
            {activeFocusType ? (
              renderUpgradeDetails(activeFocusType)
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 font-mono text-xs space-y-2 p-5 border border-dashed border-white/5 rounded-2xl">
                <Dumbbell size={24} className="text-slate-600" />
                <span>Select any gene sequence to visualize DNA replication parameters, current attribute bonuses, and potential upgrades.</span>
              </div>
            )}
          </div>

          {/* MOBILE POP-UP BOTTOM SHEET DRAWER (Mobile only) */}
          <AnimatePresence>
            {selectedUpgrade && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedUpgrade(null)}
                  className="md:hidden fixed inset-0 bg-slate-950/80 z-40"
                />

                {/* Bottom sheet popup */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] bg-slate-900 border-t border-white/10 rounded-t-3xl z-50 p-5 overflow-y-auto flex flex-col justify-between shadow-2xl"
                >
                  <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Genome Refinement</span>
                    <button 
                      onClick={() => {
                        setSelectedUpgrade(null);
                        audio.playSfx('loot');
                      }} 
                      className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {renderUpgradeDetails(selectedUpgrade)}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
