import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Coins, Hammer, Flame, Shield, Swords, Sparkles, 
  ArrowUpRight, AlertCircle, ArrowUp, CheckCircle, 
  Trash2, FileCode, Gem, HelpCircle 
} from 'lucide-react';
import { saveSystem, PlayerSaveData } from '../systems/saveSystem';
import { GameItem, RARITIES, Rarity } from '../systems/lootSystem';
import { blacksmithSystem, UpgradeCost } from '../systems/blacksmithSystem';
import { economySystem } from '../systems/economySystem';
import { audio } from '../lib/audio';
import ItemIcon from './ItemIcon';

interface BlacksmithMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDataChanged?: () => void;
}

type ForgeMode = 'stats' | 'rarity';

export default function BlacksmithMenu({ isOpen, onClose, onSaveDataChanged }: BlacksmithMenuProps) {
  const [saveData, setSaveData] = useState<PlayerSaveData | null>(null);
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [forgeMode, setForgeMode] = useState<ForgeMode>('stats');
  const [forgeFlashing, setForgeFlashing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSaveData(saveSystem.load());
      setSelectedItem(null);
    }
  }, [isOpen]);

  if (!isOpen || !saveData) return null;

  const handleRefresh = (updated: PlayerSaveData) => {
    setSaveData(updated);
    if (onSaveDataChanged) onSaveDataChanged();

    // Keep selected item synced
    if (selectedItem) {
      const synced = updated.items.find(i => i.id === selectedItem.id);
      setSelectedItem(synced || null);
    }
  };

  // Run stat upgrade
  const handleUpgradeStats = () => {
    if (!selectedItem) return;
    
    const check = blacksmithSystem.canUpgradeStats(selectedItem.id, saveData);
    if (!check.allowed) {
      audio.playSfx('loot');
      alert(check.reason || 'Cannot reinforce stats.');
      return;
    }

    // Trigger visual flash
    setForgeFlashing(true);
    audio.playSfx('craft');

    setTimeout(() => {
      const updated = blacksmithSystem.upgradeStats(selectedItem.id);
      handleRefresh(updated);
      setForgeFlashing(false);
    }, 600);
  };

  // Run rarity evolution
  const handleEvolveRarity = () => {
    if (!selectedItem) return;

    const check = blacksmithSystem.canEvolveRarity(selectedItem.id, saveData);
    if (!check.allowed) {
      audio.playSfx('loot');
      alert(check.reason || 'Cannot evolve rarity.');
      return;
    }

    setForgeFlashing(true);
    audio.playSfx('levelUp');

    setTimeout(() => {
      const updated = blacksmithSystem.evolveRarity(selectedItem.id);
      handleRefresh(updated);
      setForgeFlashing(false);
    }, 800);
  };

  // Filter player's inventory to unequipped weapon/armor/accessories
  const getGearList = (): GameItem[] => {
    return saveData.items.filter(i => {
      const isEquippable = i.type === 'weapon' || i.type === 'armor' || i.type === 'accessory';
      const isEquipped = i.id === saveData.equippedWeaponId || 
                         i.id === saveData.equippedArmorId || 
                         i.id === saveData.equippedAccessoryId;
      return isEquippable && !isEquipped;
    });
  };

  const gearItems = getGearList();

  // Render cost item
  const renderCostMaterial = (name: string, required: number, possessed: number, icon: string) => {
    if (required <= 0) return null;
    const met = possessed >= required;
    return (
      <div className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-mono ${
        met ? 'bg-slate-900/40 border-white/5 text-slate-300' : 'bg-red-500/5 border-red-500/20 text-red-400'
      }`}>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span>{icon}</span> {name}
        </span>
        <span className="font-bold">
          {possessed}/{required}
        </span>
      </div>
    );
  };

  // Check for specific boss trophy in inventory
  const getTrophyCount = (trophyId: string): number => {
    return saveData.items.filter(i => i.type === 'trophy' && (i.name.toLowerCase().includes(trophyId) || i.description.toLowerCase().includes(trophyId))).length;
  };

  const renderBlacksmithDetails = (selectedItem: GameItem) => {
    return (
      <div className="space-y-4 flex-1 flex flex-col justify-between">
        {/* Visual Details */}
        <div className="space-y-3">
          
          {/* Item Display Header */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-white/10">
            <div className="w-11 h-11 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
              <ItemIcon item={selectedItem} className="w-7 h-7" size={28} />
            </div>
            <div className="min-w-0">
              <span className={`text-[8px] font-mono uppercase font-bold tracking-wider ${RARITIES[selectedItem.rarity]?.textColor || 'text-white'}`}>
                {selectedItem.rarity} {selectedItem.type}
              </span>
              <h4 className="text-xs font-black text-white leading-tight truncate">
                {selectedItem.name.replace(/\[.*?\] /, '')}
              </h4>
              <span className="text-[9px] font-mono text-slate-400 block">
                Item level req: {selectedItem.levelReq}
              </span>
            </div>
          </div>

          {/* Mode switcher tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
            <button
              onClick={() => setForgeMode('stats')}
              className={`py-1 text-center text-[11px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                forgeMode === 'stats' 
                  ? 'bg-red-500/15 border border-red-500/35 text-red-300' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reinforce Stats
            </button>
            <button
              onClick={() => setForgeMode('rarity')}
              className={`py-1 text-center text-[11px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                forgeMode === 'rarity' 
                  ? 'bg-red-500/15 border border-red-500/35 text-red-300' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Evolve Rarity
            </button>
          </div>

          {/* Sub-Section: Stats upgrade comparison */}
          {forgeMode === 'stats' ? (
            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-2 text-[11px] font-mono">
                <span className="text-[8px] text-slate-500 uppercase font-sans font-bold block border-b border-white/5 pb-1 mb-1">
                  Reinforcement Predictions
                </span>
                
                {selectedItem.attack > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attack Dmg:</span>
                    <span>
                      <strong className="text-slate-200">+{selectedItem.attack}</strong>
                      <span className="text-slate-500 mx-1">➔</span>
                      <strong className="text-red-400">+{selectedItem.attack + 4}</strong>
                    </span>
                  </div>
                )}

                {selectedItem.defense > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defense Rating:</span>
                    <span>
                      <strong className="text-slate-200">+{selectedItem.defense}</strong>
                      <span className="text-slate-500 mx-1">➔</span>
                      <strong className="text-blue-400">+{selectedItem.defense + 3}</strong>
                    </span>
                  </div>
                )}

                {selectedItem.health > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Health Pool:</span>
                    <span>
                      <strong className="text-slate-200">+{selectedItem.health}</strong>
                      <span className="text-slate-500 mx-1">➔</span>
                      <strong className="text-emerald-400">+{selectedItem.health + 15}</strong>
                    </span>
                  </div>
                )}

                <div className="bg-red-500/5 p-1.5 rounded border border-red-500/10 text-[9px] text-slate-400 leading-normal">
                   Stat reinforcement adds static modifier upgrades to primary weapon or armor slots.
                </div>
              </div>

              {/* Cost Recipe Material Widgets */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-0.5">
                  Reinforcement Cost
                </span>
                {(() => {
                  const cost = blacksmithSystem.getStatUpgradeCost(selectedItem);
                  return (
                    <div className="grid grid-cols-2 gap-1.5">
                      {renderCostMaterial('Gold Coin', cost.gold, saveData.gold, 'Gold')}
                      {renderCostMaterial('Timber Wood', cost.wood, saveData.wood, 'Wood')}
                      {renderCostMaterial('Metal Alloy', cost.metal, saveData.metal, 'Metal')}
                      {renderCostMaterial('Crystal Gem', cost.gem, saveData.gem, 'Gems')}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* SUB-SECTION: Rarity evolution logic */
            <div className="space-y-3">
              {/* Evolve specifications */}
              {blacksmithSystem.getNextRarity(selectedItem.rarity) ? (
                <div className="space-y-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1.5 text-[11px] font-mono">
                    <span className="text-[8px] text-slate-500 uppercase font-sans font-bold block border-b border-white/5 pb-1 mb-1">
                      Projected Evolution Tiers
                    </span>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Rarity Tier:</span>
                      <span className="flex items-center gap-1">
                        <span className={RARITIES[selectedItem.rarity]?.textColor}>{selectedItem.rarity}</span>
                        <span>➔</span>
                        <strong className={RARITIES[blacksmithSystem.getNextRarity(selectedItem.rarity)!]?.textColor}>
                          {blacksmithSystem.getNextRarity(selectedItem.rarity)}
                        </strong>
                      </span>
                    </div>

                    <div className="bg-red-500/5 p-1.5 rounded border border-red-500/10 text-[9px] text-slate-400 leading-normal">
                       Evolving raw tier class rolls higher random multipliers which can drastically upgrade combat stats and selling liquidation values.
                    </div>
                  </div>

                  {/* Evolution Recipe cost */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-0.5">
                      Evolution Recipe Cost
                    </span>
                    {(() => {
                      const cost = blacksmithSystem.getRarityEvolutionCost(selectedItem);
                      return (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            {renderCostMaterial('Gold Coin', cost.gold, saveData.gold, 'Gold')}
                            {renderCostMaterial('Timber Wood', cost.wood, saveData.wood, 'Wood')}
                            {renderCostMaterial('Metal Alloy', cost.metal, saveData.metal, 'Metal')}
                            {renderCostMaterial('Crystal Gem', cost.gem, saveData.gem, 'Gems')}
                          </div>

                          {/* Trophy requirement */}
                          {cost.trophyId && (
                            <div className={`p-2 rounded-lg border flex justify-between items-center text-[10px] font-mono ${
                              getTrophyCount(cost.trophyId) > 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}>
                              <span className="flex items-center gap-1 text-slate-400">
                                Trophy: {cost.trophyName}
                              </span>
                              <span className="font-bold">
                                {getTrophyCount(cost.trophyId) > 0 ? 'READY' : 'MISSING'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5 text-emerald-400 space-y-1 font-mono text-[10px]">
                  <CheckCircle size={20} className="mx-auto text-emerald-500" />
                  <span>This item has achieved Ancient status and can no longer be evolved further!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm trigger buttons */}
        <div className="pt-3 border-t border-white/5">
          {forgeMode === 'stats' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpgradeStats}
              disabled={!blacksmithSystem.canUpgradeStats(selectedItem.id, saveData).allowed}
              className={`w-full py-2.5 rounded-xl text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 shadow-lg transition-all ${
                blacksmithSystem.canUpgradeStats(selectedItem.id, saveData).allowed
                  ? 'bg-gradient-to-r from-red-600 to-red-700 border border-red-400/40 shadow-red-500/10 hover:brightness-110'
                  : 'bg-zinc-800 border border-zinc-700/50 text-zinc-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Hammer size={12} />
              <span>Reinforce Stats</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEvolveRarity}
              disabled={!blacksmithSystem.getNextRarity(selectedItem.rarity) || !blacksmithSystem.canEvolveRarity(selectedItem.id, saveData).allowed}
              className={`w-full py-2.5 rounded-xl text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 shadow-lg transition-all ${
                blacksmithSystem.getNextRarity(selectedItem.rarity) && blacksmithSystem.canEvolveRarity(selectedItem.id, saveData).allowed
                  ? 'bg-gradient-to-r from-red-600 to-red-700 border border-red-400/40 shadow-red-500/10 hover:brightness-110'
                  : 'bg-zinc-800 border border-zinc-700/50 text-zinc-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles size={12} />
              <span>Evolve Rarity Tier</span>
            </motion.button>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-2 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-5xl w-full h-[95vh] md:h-[80vh] bg-slate-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Hot embers background visual */}
        <div className="absolute inset-0 bg-radial pointer-events-none opacity-10"
             style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 60%)' }} />

        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-slate-950/30 gap-3 relative z-10 w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/30">
              <Hammer className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black uppercase font-sans tracking-wide text-red-300">
                Lichfire Anvil & Blacksmith
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                Reinforce combat attributes or evolve raw equipment rarity tiers using materials & boss trophies
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 w-full md:w-auto">
            {/* Player resources panel */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-black/40 px-2.5 py-1.5 rounded-2xl border border-white/5 text-[9px] sm:text-[10px] font-mono">
              <span className="text-amber-400">Gold: <span className="text-slate-200">{saveData.gold}g</span></span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-100">Wood: <span className="text-slate-200">{saveData.wood}</span></span>
              <span className="text-slate-400">|</span>
              <span className="text-zinc-300">Metal: <span className="text-slate-200">{saveData.metal}</span></span>
              <span className="text-slate-400">|</span>
              <span className="text-cyan-400">Gems: <span className="text-cyan-200">{saveData.gem}</span></span>
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
          
          {/* LEFT PANEL: Player's gear list browser */}
          <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
            <div className="p-4 bg-slate-950/20 border-b border-white/5">
              <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                Select Unequipped Gear for Forging ({gearItems.length} items)
              </h4>
            </div>

            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              {gearItems.length === 0 ? (
                <div className="col-span-full py-20 text-center font-mono text-slate-500 text-xs flex flex-col items-center gap-1.5">
                  <span>No unequipped gear found in inventory.</span>
                  <span className="text-[10px] text-slate-600 max-w-xs">
                    Only Weapons, Armors, and Accessories currently not equipped in your Main Menu Armory can be forged.
                  </span>
                </div>
              ) : (
                gearItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const rarityConf = RARITIES[item.rarity] || RARITIES.common;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        audio.playSfx('loot');
                      }}
                      className={`relative p-3 rounded-2xl border text-left flex gap-3 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-red-500/10 border-red-500/50 shadow-md shadow-red-500/5'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border ${rarityConf.borderColor} ${rarityConf.glowColor}`}>
                        <ItemIcon item={item} className="w-6 h-6" size={24} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${rarityConf.textColor}`}>
                              {item.rarity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Lvl {item.levelReq}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-100 truncate block mt-0.5">
                            {item.name.replace(/\[.*?\] /, '')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-400">
                          {item.attack > 0 && <span>ATK: {item.attack}</span>}
                          {item.defense > 0 && <span>DEF: {item.defense}</span>}
                          {item.health > 0 && <span>HP: {item.health}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Selected item forging workspace (Desktop only) */}
          <div className="hidden md:flex md:w-96 bg-slate-950/45 p-5 overflow-y-auto flex-col justify-between border-t md:border-t-0 border-white/5 relative">
            
            {/* Forge flashing overlay */}
            <AnimatePresence>
              {forgeFlashing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-red-600/25 flex flex-col items-center justify-center z-50 text-amber-300 gap-2 font-black uppercase font-sans tracking-widest text-lg"
                >
                  <Flame className="w-12 h-12 text-red-500 animate-bounce" />
                  <span>FORGING...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedItem ? (
              renderBlacksmithDetails(selectedItem)
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 font-mono text-xs space-y-2 p-5 border border-dashed border-white/5 rounded-2xl">
                <Hammer size={24} className="text-slate-600" />
                <span>Select an item in your bag on the left browser list to initiate reforging options.</span>
              </div>
            )}
          </div>

          {/* MOBILE POP-UP BOTTOM SHEET DRAWER (Mobile only) */}
          <AnimatePresence>
            {selectedItem && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedItem(null)}
                  className="md:hidden fixed inset-0 bg-slate-950/80 z-40"
                />

                {/* Bottom sheet popup */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] bg-slate-900 border-t border-white/10 rounded-t-3xl z-50 p-5 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                  {/* Forge flashing overlay on mobile too! */}
                  <AnimatePresence>
                    {forgeFlashing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-600/35 flex flex-col items-center justify-center z-50 text-amber-300 gap-2 font-black uppercase font-sans tracking-widest text-lg rounded-t-3xl"
                      >
                        <Flame className="w-12 h-12 text-red-500 animate-bounce" />
                        <span>FORGING...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Reforging Hearth</span>
                    <button 
                      onClick={() => {
                        setSelectedItem(null);
                        audio.playSfx('loot');
                      }} 
                      className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {renderBlacksmithDetails(selectedItem)}
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
