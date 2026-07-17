import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Swords, Zap, Trash2, X, Star, Coins, Award, Hammer, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { saveSystem, PlayerSaveData } from '../systems/saveSystem';
import { GameItem, RARITIES } from '../systems/lootSystem';
import { audio } from '../lib/audio';
import ItemIcon from './ItemIcon';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDataChanged?: () => void; // Notify main menu to refresh its stats
}

type TabType = 'weapons' | 'armor' | 'accessories' | 'materials' | 'trophies' | 'recent';

export default function InventoryModal({
  isOpen,
  onClose,
  onSaveDataChanged,
}: InventoryModalProps) {
  const [saveData, setSaveData] = useState<PlayerSaveData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('weapons');
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);

  // Load save data when modal opens
  useEffect(() => {
    if (isOpen) {
      const data = saveSystem.load();
      setSaveData(data);
      setSelectedItem(null);
    }
  }, [isOpen]);

  if (!isOpen || !saveData) return null;

  const handleRefresh = (newData: PlayerSaveData) => {
    setSaveData(newData);
    if (onSaveDataChanged) onSaveDataChanged();
    
    // Refresh selected item details if it was sold or equipped
    if (selectedItem) {
      const found = newData.items.find(i => i.id === selectedItem.id);
      setSelectedItem(found || null);
    }
  };

  const handleEquip = (itemId: string) => {
    audio.playSfx('craft'); // play solid equipment craft sounds
    const updated = saveSystem.equipItem(itemId);
    handleRefresh(updated);
  };

  const handleUnequip = (itemId: string) => {
    audio.playSfx('loot');
    const updated = saveSystem.unequipItem(itemId);
    handleRefresh(updated);
  };

  const handleSell = (itemId: string) => {
    audio.playSfx('loot');
    const updated = saveSystem.sellItem(itemId);
    handleRefresh(updated);
  };

  // Group items by active tab
  const getTabItems = (): GameItem[] => {
    const items = saveData.items || [];
    switch (activeTab) {
      case 'weapons':
        return items.filter(i => i.type === 'weapon');
      case 'armor':
        return items.filter(i => i.type === 'armor');
      case 'accessories':
        return items.filter(i => i.type === 'accessory');
      case 'materials':
        return items.filter(i => i.type === 'material');
      case 'trophies':
        return items.filter(i => i.type === 'trophy');
      case 'recent':
        // Sort by obtained date desc, limit to last 8
        return [...items]
          .sort((a, b) => (b.obtainedDate || 0) - (a.obtainedDate || 0))
          .slice(0, 10);
      default:
        return [];
    }
  };

  // Find currently equipped item for selected item's slot to compare
  const getEquippedInSlot = (slotType: 'weapon' | 'armor' | 'accessory'): GameItem | undefined => {
    const items = saveData.items || [];
    if (slotType === 'weapon') {
      return items.find(i => i.id === saveData.equippedWeaponId);
    } else if (slotType === 'armor') {
      return items.find(i => i.id === saveData.equippedArmorId);
    } else if (slotType === 'accessory') {
      return items.find(i => i.id === saveData.equippedAccessoryId);
    }
    return undefined;
  };

  // Active stats cumulative summaries
  const equippedWeapon = saveData.items.find(i => i.id === saveData.equippedWeaponId);
  const equippedArmor = saveData.items.find(i => i.id === saveData.equippedArmorId);
  const equippedAccessory = saveData.items.find(i => i.id === saveData.equippedAccessoryId);

  const totalAttack = (equippedWeapon?.attack || 0) + (equippedArmor?.attack || 0) + (equippedAccessory?.attack || 0);
  const totalDefense = (equippedWeapon?.defense || 0) + (equippedArmor?.defense || 0) + (equippedAccessory?.defense || 0);
  const totalHealth = (equippedWeapon?.health || 0) + (equippedArmor?.health || 0) + (equippedAccessory?.health || 0);
  const totalCrit = (equippedWeapon?.critChance || 0) + (equippedArmor?.critChance || 0) + (equippedAccessory?.critChance || 0);
  const totalSpeed = (equippedWeapon?.speedBonus || 0) + (equippedArmor?.speedBonus || 0) + (equippedAccessory?.speedBonus || 0);

  // Compare selected item with equipped item in that slot
  const renderComparison = () => {
    if (!selectedItem || selectedItem.type === 'material' || selectedItem.type === 'trophy') return null;
    
    const equipped = getEquippedInSlot(selectedItem.type as any);
    if (!equipped || equipped.id === selectedItem.id) return null;

    const diffAtk = (selectedItem.attack || 0) - (equipped.attack || 0);
    const diffDef = (selectedItem.defense || 0) - (equipped.defense || 0);
    const diffHp = (selectedItem.health || 0) - (equipped.health || 0);
    const diffCrit = (selectedItem.critChance || 0) - (equipped.critChance || 0);
    const diffSpd = (selectedItem.speedBonus || 0) - (equipped.speedBonus || 0);

    const renderDiff = (val: number, isPercent = false) => {
      if (val === 0) return null;
      const isPositive = val > 0;
      const formatted = isPercent ? `${Math.round(val * 100)}%` : val;
      return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold ml-1.5 px-1 rounded bg-black/10 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
          {isPositive ? '+' : ''}{formatted}
        </span>
      );
    };

    return (
      <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 space-y-2 mt-4 text-xs font-sans">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
          EQUIPMENT COMPARISON VS EQUIPPED
        </div>
        <div className="flex flex-col gap-1 font-mono">
          {(selectedItem.attack > 0 || equipped.attack > 0) && (
            <div className="flex justify-between items-center text-slate-300">
              <span>Attack Power:</span>
              <span className="text-white">
                {equipped.attack} ➔ {selectedItem.attack}
                {renderDiff(diffAtk)}
              </span>
            </div>
          )}
          {(selectedItem.defense > 0 || equipped.defense > 0) && (
            <div className="flex justify-between items-center text-slate-300">
              <span>Defense Plating:</span>
              <span className="text-white">
                {equipped.defense} ➔ {selectedItem.defense}
                {renderDiff(diffDef)}
              </span>
            </div>
          )}
          {(selectedItem.health > 0 || equipped.health > 0) && (
            <div className="flex justify-between items-center text-slate-300">
              <span>Max Health:</span>
              <span className="text-white">
                {equipped.health} ➔ {selectedItem.health}
                {renderDiff(diffHp)}
              </span>
            </div>
          )}
          {(selectedItem.critChance > 0 || equipped.critChance > 0) && (
            <div className="flex justify-between items-center text-slate-300">
              <span>Crit Chance:</span>
              <span className="text-white">
                {Math.round(equipped.critChance * 100)}% ➔ {Math.round(selectedItem.critChance * 100)}%
                {renderDiff(diffCrit, true)}
              </span>
            </div>
          )}
          {(selectedItem.speedBonus > 0 || equipped.speedBonus > 0) && (
            <div className="flex justify-between items-center text-slate-300">
              <span>Speed Bonus:</span>
              <span className="text-white">
                +{Math.round(equipped.speedBonus * 100)}% ➔ +{Math.round(selectedItem.speedBonus * 100)}%
                {renderDiff(diffSpd, true)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const currentLevel = saveData.unlockedLevel;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4 select-none font-sans overflow-hidden">
        {/* Absolute Backdrop click closer */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Large Central RPG Armory Console */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-5xl h-[90vh] md:h-[85vh] bg-slate-900/95 border border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/10">
                <Swords className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-xl font-black text-white uppercase tracking-tight">Armory Forge & Inventory</h2>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 font-mono text-[8px] sm:text-[10px] text-slate-400 mt-0.5">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {saveData.gold}g Gold
                  </span>
                  <span>•</span>
                   <span className="text-amber-500">Wood: <span className="text-slate-200">{saveData.wood}</span></span>
                  <span>•</span>
                  <span className="text-slate-400">Metal: <span className="text-slate-200">{saveData.metal}</span></span>
                  <span>•</span>
                  <span className="text-purple-400">Gem: <span className="text-purple-300">{saveData.gem}</span></span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Grid Layout splits Inventory & Detail Panels */}
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            
            {/* Left Column: Category Tabs & Item Grid */}
            <div className="flex-1 p-3 sm:p-5 flex flex-col overflow-visible md:overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
              
              {/* Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-3 border-b border-white/5 mb-4 scrollbar-none">
                {(['weapons', 'armor', 'accessories', 'materials', 'trophies', 'recent'] as TabType[]).map((tab) => {
                  const itemsCount = saveData.items.filter(i => {
                    if (tab === 'weapons') return i.type === 'weapon';
                    if (tab === 'armor') return i.type === 'armor';
                    if (tab === 'accessories') return i.type === 'accessory';
                    if (tab === 'materials') return i.type === 'material';
                    if (tab === 'trophies') return i.type === 'trophy';
                    return true; // recent handles sorting
                  }).length;

                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedItem(null);
                        audio.playSfx('loot');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                        activeTab === tab
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/35 shadow-inner'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {tab === 'weapons' && <Swords size={13} />}
                      {tab === 'armor' && <Shield size={13} />}
                      {tab === 'accessories' && <Star size={13} />}
                      {tab === 'materials' && <Hammer size={13} />}
                      {tab === 'trophies' && <Award size={13} />}
                      {tab === 'recent' && <Clock size={13} />}
                      <span className="capitalize">{tab}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/25 font-mono text-slate-400">
                        {tab === 'recent' ? getTabItems().length : itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Items Grid Area */}
              <div className="flex-1 overflow-y-auto pr-1">
                {getTabItems().length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-white/5 border-dashed rounded-2xl">
                    <span className="text-4xl mb-2 opacity-30">📦</span>
                    <h3 className="text-sm font-bold text-slate-400 font-sans uppercase">No Items Stored</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Defeat wave bosses inside dungeon runs to loot weapons, armors, accessories, and precious materials!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                    {getTabItems().map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const isEquipped = saveData.equippedWeaponId === item.id ||
                                         saveData.equippedArmorId === item.id ||
                                         saveData.equippedAccessoryId === item.id;
                      const rCfg = RARITIES[item.rarity];
                      
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedItem(item);
                            audio.playSfx('loot');
                          }}
                          className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-amber-500 border-white scale-105'
                              : `${rCfg.borderColor} ${rCfg.glowColor} bg-slate-900/60 hover:bg-slate-900`
                          }`}
                        >
                          {/* Equipped Badge indicator */}
                          {isEquipped && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" title="Equipped" />
                          )}

                          <ItemIcon item={item} className="w-10 h-10 filter drop-shadow" size={28} />
                          
                          {/* Small label for name */}
                          <span className="text-[8px] text-slate-400 font-mono text-center truncate w-full px-1.5 mt-1 uppercase">
                            {item.name.replace(/\[.*\]\s*/, '')}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Dynamic Statistics Sidebar and Detailed View with comparison */}
            <div className="w-full md:w-80 bg-slate-950/40 p-5 flex flex-col gap-4 overflow-y-auto">
              
              {/* Player Stats Summary Panel */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest">
                    Cumulative Armory Stats
                  </span>
                </div>
                
                <div className="space-y-2 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-rose-400"><Swords size={12}/> Weapon Attack:</span>
                    <span className="text-white font-bold">+{totalAttack} Dmg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-sky-400"><Shield size={12}/> Armor Defense:</span>
                    <span className="text-white font-bold">+{totalDefense} Def</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-emerald-400"><Zap size={12}/> Max HP Pool:</span>
                    <span className="text-white font-bold">+{totalHealth} HP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-yellow-400"><Star size={12}/> Crit Rate:</span>
                    <span className="text-white font-bold">+{Math.round(totalCrit * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-teal-400"><Zap size={12}/> Speed Bonus:</span>
                    <span className="text-white font-bold">+{Math.round(totalSpeed * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Selection Detail Panel */}
              <AnimatePresence mode="wait">
                {selectedItem ? (
                  <motion.div
                    key={selectedItem.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="bg-slate-900/60 border border-white/5 rounded-2xl p-4.5 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${RARITIES[selectedItem.rarity].borderColor} ${RARITIES[selectedItem.rarity].glowColor}`}>
                          <ItemIcon item={selectedItem} className="w-8 h-8" size={32} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase leading-tight font-sans">
                            {selectedItem.name.replace(/\[.*\]\s*/, '')}
                          </h4>
                          <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 border border-current bg-white/5 rounded inline-block mt-1 ${RARITIES[selectedItem.rarity].textColor}`}>
                            {selectedItem.rarity} {selectedItem.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 italic font-sans leading-relaxed">
                        "{selectedItem.description}"
                      </p>

                      {/* Item Stats Display */}
                      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 text-xs font-mono">
                        {(selectedItem.attack > 0 || selectedItem.defense > 0 || selectedItem.health > 0 || selectedItem.critChance > 0 || selectedItem.speedBonus > 0) ? (
                          <>
                            {selectedItem.attack > 0 && <div className="text-rose-400">Attack Power: +{selectedItem.attack}</div>}
                            {selectedItem.defense > 0 && <div className="text-sky-400">Defense Guard: +{selectedItem.defense}</div>}
                            {selectedItem.health > 0 && <div className="text-emerald-400">Max Health Boost: +{selectedItem.health}</div>}
                            {selectedItem.critChance > 0 && <div className="text-yellow-400">Crit Rate: +{Math.round(selectedItem.critChance * 100)}%</div>}
                            {selectedItem.speedBonus > 0 && <div className="text-teal-400">Movement Speed: +{Math.round(selectedItem.speedBonus * 100)}%</div>}
                          </>
                        ) : (
                          <div className="text-slate-500">No attribute modifiers</div>
                        )}
                        {selectedItem.specialBonus && (
                          <div className="text-amber-300 text-[10px] border-t border-white/5 pt-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
                            Special: {selectedItem.specialBonus}
                          </div>
                        )}
                      </div>

                      {/* Display Comparison if applicable */}
                      {renderComparison()}
                    </div>

                    {/* Action buttons (Equip / Unequip, Sell) */}
                    <div className="flex flex-col gap-2 mt-6 border-t border-white/5 pt-4">
                      {selectedItem.type !== 'material' && selectedItem.type !== 'trophy' && (
                        saveData.equippedWeaponId === selectedItem.id ||
                        saveData.equippedArmorId === selectedItem.id ||
                        saveData.equippedAccessoryId === selectedItem.id ? (
                          <button
                            onClick={() => handleUnequip(selectedItem.id)}
                            className="w-full py-3 bg-zinc-700/80 hover:bg-zinc-700 border border-zinc-600/40 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                          >
                            Unequip Gear
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(selectedItem.id)}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 border border-orange-400/30 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 animate-pulse"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Equip Gear
                          </button>
                        )
                      )}

                      <button
                        onClick={() => handleSell(selectedItem.id)}
                        className="w-full py-2.5 bg-red-500/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trash2 size={13} />
                        Sell for {selectedItem.sellValue}g Gold
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-white/5 border-dashed rounded-2xl bg-slate-900/10">
                    <span className="text-3xl mb-1 opacity-25">🎒</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-black">
                      Select any item to view tooltips & comparison metrics
                    </span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
