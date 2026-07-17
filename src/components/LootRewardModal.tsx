import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Shield, Swords, Star, Coins, Gift } from 'lucide-react';
import { GameItem, RARITIES } from '../systems/lootSystem';
import { saveSystem } from '../systems/saveSystem';
import { audio } from '../lib/audio';
import ItemIcon from './ItemIcon';

interface LootRewardModalProps {
  isOpen: boolean;
  bossName: string;
  rewards: GameItem[];
  onClose: () => void;
}

export default function LootRewardModal({
  isOpen,
  bossName,
  rewards,
  onClose,
}: LootRewardModalProps) {
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [chestOpened, setChestOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRevealedIndex(-1);
      setChestOpened(false);
      
      // Play opening audio
      const timer1 = setTimeout(() => {
        setChestOpened(true);
        audio.playSfx('loot');
      }, 1000);

      return () => clearTimeout(timer1);
    }
  }, [isOpen]);

  const handleNextReveal = () => {
    if (revealedIndex < rewards.length - 1) {
      const nextIdx = revealedIndex + 1;
      setRevealedIndex(nextIdx);
      
      // Play specific sfx depending on rarity
      const item = rewards[nextIdx];
      if (item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'ancient') {
        audio.playSfx('levelUp');
      } else {
        audio.playSfx('loot');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/98 z-[100] overflow-y-auto select-none font-sans flex flex-col items-center py-6 px-4 md:py-12">
          {/* Ambient space glow */}
          <div className="absolute inset-0 bg-radial from-violet-950/20 via-slate-950 to-slate-950 pointer-events-none" />

          {/* Top Title */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center z-10 mb-4 md:mb-8"
          >
            <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 animate-pulse">
              🏆 Boss Slay Conquered 🏆
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 uppercase tracking-tight mt-2 md:mt-3 leading-none">
              {bossName} DEFEATED
            </h2>
            <p className="text-slate-400 text-[10px] md:text-xs font-mono uppercase mt-1">
              Extracting valuable loot data directly to your inventory
            </p>
          </motion.div>

          {/* Chest Scene */}
          {!chestOpened ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative flex flex-col items-center justify-center space-y-4 z-10 my-auto"
            >
              <div className="relative w-28 h-28 md:w-36 md:h-36 bg-amber-500/10 border border-amber-400/30 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(245,158,11,0.25)]">
                <Gift className="w-12 h-12 md:w-16 md:h-16 text-amber-400 animate-bounce" />
              </div>
              <p className="text-amber-400 font-mono text-[10px] md:text-xs uppercase tracking-widest animate-pulse font-bold">
                Unlocking Tactical Nano-Vault...
              </p>
            </motion.div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col items-center z-10 my-auto">
              {/* Display rewards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 w-full px-2 md:px-4 justify-center items-stretch my-4 md:my-6">
                {rewards.map((item, idx) => {
                  const isRevealed = idx <= revealedIndex;
                  const rarityCfg = RARITIES[item.rarity];
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`relative flex flex-col justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border bg-slate-900/80 transition-all h-48 md:h-60 min-w-0 ${
                        isRevealed 
                          ? `${rarityCfg.borderColor} ${rarityCfg.glowColor} ring-1 ring-white/10` 
                          : 'border-white/5 bg-zinc-900/40 opacity-40 grayscale'
                      }`}
                    >
                      {/* Legendary beam effect behind item */}
                      {isRevealed && (item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'ancient') && (
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-current/5 to-current/25 rounded-2xl pointer-events-none animate-pulse opacity-50 overflow-hidden" style={{ color: rarityCfg.color }}>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white opacity-80 blur-xs animate-pulse" />
                        </div>
                      )}

                      {isRevealed ? (
                        <>
                          {/* Item Card Content */}
                          <div className="flex flex-col items-center text-center">
                            <ItemIcon item={item} className="w-9 h-9 md:w-12 md:h-12 filter drop-shadow-md mb-1 md:mb-2" size={32} />
                            <span className={`text-[8px] md:text-[10px] font-bold font-mono uppercase tracking-wider ${rarityCfg.textColor}`}>
                              {item.rarity}
                            </span>
                            <h4 className="text-[10px] md:text-xs font-bold text-white uppercase tracking-tight mt-0.5 md:mt-1 truncate w-full">
                              {item.name.replace(/\[.*\]\s*/, '')}
                            </h4>
                            <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2 md:line-clamp-3">
                              {item.description}
                            </p>
                          </div>

                          {/* Stats and Sell value */}
                          <div className="mt-2 md:mt-4 pt-1 md:pt-2 border-t border-white/5 flex flex-col gap-0.5 md:gap-1 text-[8px] md:text-[10px] font-mono">
                            {item.attack > 0 && (
                              <div className="flex justify-between text-rose-400">
                                <span>Attack</span>
                                <span className="font-bold">+{item.attack}</span>
                              </div>
                            )}
                            {item.defense > 0 && (
                              <div className="flex justify-between text-sky-400">
                                <span>Defense</span>
                                <span className="font-bold">+{item.defense}</span>
                              </div>
                            )}
                            {item.health > 0 && (
                              <div className="flex justify-between text-emerald-400">
                                <span>Health</span>
                                <span className="font-bold">+{item.health}</span>
                              </div>
                            )}
                            {item.critChance > 0 && (
                              <div className="flex justify-between text-yellow-400">
                                <span>Crit</span>
                                <span className="font-bold">+{Math.round(item.critChance * 100)}%</span>
                              </div>
                            )}
                            <div className="flex justify-between text-amber-500 mt-0.5 md:mt-1">
                              <span className="flex items-center gap-0.5"><Coins className="w-2.5 h-2.5 md:w-3 md:h-3"/> Sell</span>
                              <span>{item.sellValue}g</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-[8px] md:text-[10px] uppercase font-black">
                          <span className="text-xl md:text-3xl mb-1 opacity-20">🔒</span>
                          <span>Locked</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Reveal Control Button */}
              <div className="flex flex-col items-center gap-3 mt-4 md:mt-8 pb-8">
                {revealedIndex < rewards.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextReveal}
                    className="px-6 py-2.5 md:px-8 md:py-3.5 rounded-lg md:rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 border border-yellow-400/30 text-white text-xs md:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-200 animate-spin" />
                    Reveal Next Reward ({revealedIndex + 1}/{rewards.length})
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-8 py-3 md:px-10 md:py-4 rounded-lg md:rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 border border-green-400/30 text-white text-xs md:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    Confirm & Return to Base
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
