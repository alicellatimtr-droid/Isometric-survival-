import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, X, Filter, ArrowUpDown, Shield, Swords, 
  Sparkles, Heart, Zap, RefreshCw, Gift, Flame, 
  HelpCircle, Eye, Check, AlertTriangle, Trash2 
} from 'lucide-react';
import { saveSystem, PlayerSaveData } from '../systems/saveSystem';
import { GameItem, RARITIES, Rarity } from '../systems/lootSystem';
import { economySystem, DAILY_REWARDS } from '../systems/economySystem';
import { audio } from '../lib/audio';
import ItemIcon from './ItemIcon';

interface MarketUIProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDataChanged?: () => void;
}

type MarketTab = 'weapons' | 'armor' | 'potions' | 'materials' | 'special' | 'limited' | 'black_market' | 'sell';
type SortType = 'price-asc' | 'price-desc' | 'rarity-desc' | 'level-desc' | 'stats-desc';

export default function MarketUI({ isOpen, onClose, onSaveDataChanged }: MarketUIProps) {
  const [saveData, setSaveData] = useState<PlayerSaveData | null>(null);
  const [activeTab, setActiveTab] = useState<MarketTab>('weapons');
  
  // Filtering & Sorting
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('rarity-desc');
  
  // Selected item state for preview / comparison
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  
  // Rotating shop stock
  const [standardStock, setStandardStock] = useState<GameItem[]>([]);
  const [blackMarketStock, setBlackMarketStock] = useState<GameItem[]>([]);
  const [limitedStock, setLimitedStock] = useState<GameItem[]>([]);
  const [specialStock, setSpecialStock] = useState<GameItem[]>([]);

  // Selling confirmation modal
  const [itemToSell, setItemToSell] = useState<GameItem | null>(null);
  const [showConfirmSell, setShowConfirmSell] = useState(false);

  // Daily login claim notification
  const [dailyClaimMsg, setDailyClaimMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(true);

  // Load save & generate stock on open
  useEffect(() => {
    if (isOpen) {
      const data = saveSystem.load();
      setSaveData(data);
      setSelectedItem(null);
      
      // Seed shop inventory based on player's level
      const currentLvl = data.unlockedLevel || 1;
      setStandardStock(economySystem.generateShopStock(currentLvl));
      setBlackMarketStock(economySystem.generateBlackMarketStock(currentLvl));
      
      // Generate some limited stock
      const limited = economySystem.generateShopStock(currentLvl + 1).slice(0, 3).map(item => ({
        ...item,
        name: `[LIMITED] ${item.name.replace(/\[.*?\] /, '')}`,
        buyPrice: Math.round(economySystem.calculateBuyPrice(item) * 0.85) // 15% discount for limited offers!
      }));
      setLimitedStock(limited);

      // Special custom item stock
      const special: GameItem[] = [
        {
          id: 'spec-potion',
          name: 'Super Elixir Potion',
          type: 'material', // Treat potion as special material in buying stock
          rarity: 'rare',
          levelReq: 1,
          attack: 0,
          defense: 0,
          health: 0,
          critChance: 0,
          speedBonus: 0,
          specialBonus: 'Restores 50 health mid-game.',
          sellValue: 15,
          icon: '🧪',
          description: 'A glowing vials of organic healing fluids.',
          buyPrice: 50
        } as any,
        {
          id: 'spec-exp-node',
          name: 'Neural Matrix Node',
          type: 'material',
          rarity: 'epic',
          levelReq: 1,
          attack: 0,
          defense: 0,
          health: 0,
          critChance: 0,
          speedBonus: 0,
          specialBonus: 'Unlocks advanced crafting attributes.',
          sellValue: 40,
          icon: 'node',
          description: 'A solid state quantum memory drive storing combat data.',
          buyPrice: 200
        } as any,
        {
          id: 'spec-lucky-charm',
          name: 'Rabbit Foot Relic',
          type: 'accessory',
          rarity: 'legendary',
          levelReq: 1,
          attack: 0,
          defense: 0,
          health: 15,
          critChance: 0.04,
          speedBonus: 0.05,
          specialBonus: 'Increase drop rate by 15%',
          sellValue: 300,
          icon: 'charm',
          description: 'An ancient protective ward emitting warm vibrations.',
          buyPrice: 1500
        }
      ];
      setSpecialStock(special);

      // Check daily login cooldown
      const lastClaimStr = localStorage.getItem('isometric_survival_last_daily_claim');
      const lastClaim = lastClaimStr ? parseInt(lastClaimStr) : 0;
      const oneDayMs = 24 * 60 * 60 * 1000;
      setCanClaimDaily(Date.now() - lastClaim >= oneDayMs);
      
      const streakStr = localStorage.getItem('isometric_survival_daily_streak') || '0';
      setStreakDays(parseInt(streakStr));
    }
  }, [isOpen]);

  if (!isOpen || !saveData) return null;

  const handleRefresh = (newData: PlayerSaveData) => {
    setSaveData(newData);
    if (onSaveDataChanged) onSaveDataChanged();
    
    // Refresh select
    if (selectedItem) {
      const found = newData.items.find(i => i.id === selectedItem.id);
      setSelectedItem(found || null);
    }
  };

  // Claim Daily Rewards
  const handleClaimDaily = () => {
    const res = economySystem.claimDailyReward();
    if (res.success && res.reward) {
      audio.playSfx('levelUp');
      setDailyClaimMsg({ 
        success: true, 
        text: `Claimed Daily Reward! Received +${res.reward.gold}g${res.reward.materials?.gem ? ', +1 Crystal Gem' : ''}!` 
      });
      setCanClaimDaily(false);
      const streakStr = localStorage.getItem('isometric_survival_daily_streak') || '1';
      setStreakDays(parseInt(streakStr));
      handleRefresh(saveSystem.load());
    } else {
      audio.playSfx('loot');
      setDailyClaimMsg({ success: false, text: res.error || 'Reward on cooldown!' });
    }
    setTimeout(() => setDailyClaimMsg(null), 5000);
  };

  // Buy item
  const handleBuyItem = (item: GameItem) => {
    const price = item.buyPrice || economySystem.calculateBuyPrice(item);
    if (saveData.gold < price) {
      audio.playSfx('loot');
      alert("Insufficient Gold Coins!");
      return;
    }

    audio.playSfx('craft');
    
    // Deduct coins & Add to items (or add potionCount)
    const updated = saveSystem.load();
    updated.gold -= price;

    if (item.id === 'spec-potion') {
      // Special treatment for buying potion: directly increases potion count inside player data or inventory?
      // Wait, let's add standard potion item to inventory or increment a global material.
      // We can add it as a 'material' with custom name or we can store it in items. Since standard potion is item, let's add it!
      const potionItem: GameItem = {
        id: `potion-${Date.now()}`,
        name: 'Health Potion',
        type: 'material',
        rarity: 'common',
        levelReq: 1,
        attack: 0,
        defense: 0,
        health: 0,
        critChance: 0,
        speedBonus: 0,
        specialBonus: 'Heals 50 HP',
        sellValue: 15,
        icon: '🧪',
        description: 'Drink during wave survival to restore HP.'
      };
      updated.items.push(potionItem);
    } else {
      // General item purchase
      const purchasedItem: GameItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        obtainedDate: Date.now()
      };
      updated.items.push(purchasedItem);
    }

    saveSystem.save(updated);
    handleRefresh(updated);

    // Remove from stock if it's limited or special accessories
    if (activeTab === 'limited') {
      setLimitedStock(prev => prev.filter(i => i.id !== item.id));
    } else if (activeTab === 'black_market') {
      setBlackMarketStock(prev => prev.filter(i => i.id !== item.id));
    }
    setSelectedItem(null);
  };

  // Sell item with confirmation triggers
  const handleSellTrigger = (item: GameItem) => {
    // Is item equipped?
    if (item.id === saveData.equippedWeaponId || item.id === saveData.equippedArmorId || item.id === saveData.equippedAccessoryId) {
      alert("Cannot sell equipped items! Unequip first.");
      return;
    }

    const value = item.sellValue || economySystem.calculateSellPrice(item);
    // Valuable items require confirmation (Epic, Legendary, Mythic, Ancient, or value > 500)
    const isValuable = ['epic', 'legendary', 'mythic', 'ancient'].includes(item.rarity) || value >= 500;
    
    if (isValuable) {
      setItemToSell(item);
      setShowConfirmSell(true);
    } else {
      executeSell(item);
    }
  };

  const executeSell = (item: GameItem) => {
    audio.playSfx('loot');
    const updated = saveSystem.sellItem(item.id);
    handleRefresh(updated);
    setShowConfirmSell(false);
    setItemToSell(null);
  };

  // Get current stock items based on active tab
  const getTabStock = (): GameItem[] => {
    switch (activeTab) {
      case 'weapons':
        return standardStock.filter(i => i.type === 'weapon');
      case 'armor':
        return standardStock.filter(i => i.type === 'armor');
      case 'potions':
        return specialStock.filter(i => i.id === 'spec-potion');
      case 'materials':
        return specialStock.filter(i => i.type === 'material' && i.id !== 'spec-potion');
      case 'special':
        return specialStock.filter(i => i.type !== 'material');
      case 'limited':
        return limitedStock;
      case 'black_market':
        return blackMarketStock;
      case 'sell':
        // Return unequipped items from player's inventory
        return saveData.items.filter(i => {
          return i.id !== saveData.equippedWeaponId && 
                 i.id !== saveData.equippedArmorId && 
                 i.id !== saveData.equippedAccessoryId;
        });
      default:
        return [];
    }
  };

  // Filter & Sort Items
  const getProcessedItems = (): GameItem[] => {
    let items = getTabStock();

    // Rarity filtering
    if (rarityFilter !== 'all') {
      items = items.filter(i => i.rarity === rarityFilter);
    }

    // Sorting
    return [...items].sort((a, b) => {
      const pA = a.buyPrice || economySystem.calculateBuyPrice(a);
      const pB = b.buyPrice || economySystem.calculateBuyPrice(b);
      const sA = a.sellValue || economySystem.calculateSellPrice(a);
      const sB = b.sellValue || economySystem.calculateSellPrice(b);

      const valA = activeTab === 'sell' ? sA : pA;
      const valB = activeTab === 'sell' ? sB : pB;

      switch (sortBy) {
        case 'price-asc':
          return valA - valB;
        case 'price-desc':
          return valB - valA;
        case 'level-desc':
          return b.levelReq - a.levelReq;
        case 'rarity-desc':
          const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ancient'];
          return rarities.indexOf(b.rarity) - rarities.indexOf(a.rarity);
        case 'stats-desc':
          const statsA = (a.attack || 0) + (a.defense || 0) + (a.health || 0);
          const statsB = (b.attack || 0) + (b.defense || 0) + (b.health || 0);
          return statsB - statsA;
        default:
          return 0;
      }
    });
  };

  // Compare stats with equipped item
  const renderComparison = (item: GameItem) => {
    if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory') return null;

    let equipped: GameItem | undefined;
    if (item.type === 'weapon') equipped = saveData.items.find(i => i.id === saveData.equippedWeaponId);
    else if (item.type === 'armor') equipped = saveData.items.find(i => i.id === saveData.equippedArmorId);
    else if (item.type === 'accessory') equipped = saveData.items.find(i => i.id === saveData.equippedAccessoryId);

    if (!equipped || equipped.id === item.id) {
      return (
        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 text-[11px] text-slate-400 font-mono">
          No equipment comparison available.
        </div>
      );
    }

    const diffAtk = (item.attack || 0) - (equipped.attack || 0);
    const diffDef = (item.defense || 0) - (equipped.defense || 0);
    const diffHp = (item.health || 0) - (equipped.health || 0);
    const diffCrit = (item.critChance || 0) - (equipped.critChance || 0);
    const diffSpd = (item.speedBonus || 0) - (equipped.speedBonus || 0);

    const renderDiff = (diff: number, isPercent = false) => {
      if (diff === 0) return null;
      const isPos = diff > 0;
      const fmt = isPercent ? `${Math.round(diff * 100)}%` : diff;
      return (
        <span className={`text-[10px] font-black ml-1.5 ${isPos ? 'text-green-400' : 'text-red-400'}`}>
          {isPos ? '▲ +' : '▼ '}{fmt}
        </span>
      );
    };

    return (
      <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1 text-xs font-mono">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-sans font-bold">
          Stats Comparison vs Equipped
        </div>
        {(item.attack > 0 || equipped.attack > 0) && (
          <div className="flex justify-between">
            <span className="text-slate-400">Attack:</span>
            <span>{equipped.attack} ➔ {item.attack} {renderDiff(diffAtk)}</span>
          </div>
        )}
        {(item.defense > 0 || equipped.defense > 0) && (
          <div className="flex justify-between">
            <span className="text-slate-400">Defense:</span>
            <span>{equipped.defense} ➔ {item.defense} {renderDiff(diffDef)}</span>
          </div>
        )}
        {(item.health > 0 || equipped.health > 0) && (
          <div className="flex justify-between">
            <span className="text-slate-400">Health:</span>
            <span>{equipped.health} ➔ {item.health} {renderDiff(diffHp)}</span>
          </div>
        )}
        {(item.critChance > 0 || equipped.critChance > 0) && (
          <div className="flex justify-between">
            <span className="text-slate-400">Crit %:</span>
            <span>{Math.round(equipped.critChance * 100)}% ➔ {Math.round(item.critChance * 100)}% {renderDiff(diffCrit, true)}</span>
          </div>
        )}
        {(item.speedBonus > 0 || equipped.speedBonus > 0) && (
          <div className="flex justify-between">
            <span className="text-slate-400">Speed:</span>
            <span>{Math.round(equipped.speedBonus * 100)}% ➔ {Math.round(item.speedBonus * 100)}% {renderDiff(diffSpd, true)}</span>
          </div>
        )}
      </div>
    );
  };

  const processedItems = getProcessedItems();

  const renderRightColumnContent = (item: GameItem) => {
    const buyPrice = item.buyPrice || economySystem.calculateBuyPrice(item);
    return (
      <div className="space-y-4 flex-1 flex flex-col justify-between">
        {/* Visual Preview Card */}
        <div className="space-y-3">
          <div className="text-center p-4 rounded-xl bg-slate-950/85 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-1.5 left-2 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Visual Preview
            </div>

            {/* Cosmic glow layer matching rarity */}
            <div className={`absolute inset-0 bg-radial opacity-20 pointer-events-none`}
                 style={{ background: `radial-gradient(circle, ${RARITIES[item.rarity]?.color || '#ffffff'}33 0%, transparent 70%)` }} />
            
            <motion.div 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto w-10 h-10 flex items-center justify-center drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]"
            >
              <ItemIcon item={item} className="w-8 h-8" size={32} />
            </motion.div>
            
            <span className="block text-xs font-black text-white mt-1.5 uppercase tracking-wide">
              {item.name.replace(/\[.*?\] /, '')}
            </span>
            <span className={`inline-block text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-black/40 border ${RARITIES[item.rarity]?.borderColor} ${RARITIES[item.rarity]?.textColor} mt-1`}>
              {item.rarity} {item.type}
            </span>
          </div>

          {/* Attributes description list */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-0.5">
              Gear Parameters
            </span>
            <p className="text-[10px] text-slate-300 leading-normal font-sans italic">
              "{item.description}"
            </p>

            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
              {item.attack > 0 && (
                <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5">
                  <span className="text-[7.5px] text-slate-500 uppercase block leading-none mb-0.5">Attack dmg</span>
                  <span className="text-xs font-bold text-red-400">+{item.attack}</span>
                </div>
              )}
              {item.defense > 0 && (
                <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5">
                  <span className="text-[7.5px] text-slate-500 uppercase block leading-none mb-0.5">Defense</span>
                  <span className="text-xs font-bold text-blue-400">+{item.defense}</span>
                </div>
              )}
              {item.health > 0 && (
                <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5">
                  <span className="text-[7.5px] text-slate-500 uppercase block leading-none mb-0.5">Max HP</span>
                  <span className="text-xs font-bold text-emerald-400">+{item.health}</span>
                </div>
              )}
              {item.critChance > 0 && (
                <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5">
                  <span className="text-[7.5px] text-slate-500 uppercase block leading-none mb-0.5">Crit %</span>
                  <span className="text-xs font-bold text-amber-400">+{Math.round(item.critChance * 100)}%</span>
                </div>
              )}
              {item.speedBonus > 0 && (
                <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5">
                  <span className="text-[7.5px] text-slate-500 uppercase block leading-none mb-0.5">Speed</span>
                  <span className="text-xs font-bold text-purple-400">+{Math.round(item.speedBonus * 100)}%</span>
                </div>
              )}
              <div className="bg-slate-900/60 p-1 rounded-lg border border-white/5 col-span-2">
                <span className="text-[7.5px] text-slate-500 uppercase block leading-none mb-0.5">Special passive</span>
                <span className="text-[9px] font-bold text-teal-300 block truncate">
                  {item.specialBonus || 'Standard military issue'}
                </span>
              </div>
            </div>
          </div>

          {/* Stat comparison drawer */}
          {renderComparison(item)}
        </div>

        {/* Sell or Buy Button */}
        <div className="pt-2 border-t border-white/5">
          {activeTab === 'sell' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSellTrigger(item)}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/30 text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-red-900/20"
            >
              <Trash2 size={12} />
              <span>Liquidate ({item.sellValue}g)</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBuyItem(item)}
              disabled={saveData.gold < buyPrice}
              className={`w-full py-2 rounded-lg text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 shadow-lg transition-all ${
                saveData.gold >= buyPrice
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/40 shadow-amber-500/10 hover:brightness-110'
                  : 'bg-zinc-800 border border-zinc-700/50 text-zinc-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Coins size={12} />
              <span>Purchase Wares</span>
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
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black uppercase font-sans tracking-wide text-amber-300">
                Strategic Market & Shop
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                Purchase advanced equipment, sell unwanted loots, claim daily bonuses
              </p>
            </div>
          </div>

          {/* Currencies panel */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 w-full md:w-auto">
            {/* Daily Login Reward claim */}
            <button
              onClick={handleClaimDaily}
              disabled={!canClaimDaily}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border font-sans text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                canClaimDaily 
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 animate-pulse'
                  : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Gift size={12} />
              <span>Daily Claim ({streakDays}/7)</span>
            </button>

            {/* Gold balance */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl">
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

        {/* Daily Claim Floating Alert Toast */}
        <AnimatePresence>
          {dailyClaimMsg && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`absolute top-24 md:top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl border text-[10px] sm:text-xs font-bold font-mono z-50 shadow-lg ${
                dailyClaimMsg.success 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              }`}
            >
              {dailyClaimMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central split screen workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* LEFT COLUMN: Categories bar and item browser */}
          <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
            
            {/* Horizontal Subtabs */}
            <div className="flex flex-wrap gap-1 p-3 bg-slate-950/25 border-b border-white/5 overflow-x-auto">
              {([
                { id: 'weapons', label: 'Weapons' },
                { id: 'armor', label: 'Armor' },
                { id: 'potions', label: 'Potions' },
                { id: 'materials', label: 'Materials' },
                { id: 'special', label: 'Specials' },
                { id: 'limited', label: 'Limited Offers' },
                { id: 'black_market', label: 'Black Market' },
                { id: 'sell', label: 'Sell Loot' }
              ] as { id: MarketTab; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedItem(null);
                    audio.playSfx('loot');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                      : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Utility filter and sorting strip */}
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-white/5 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-slate-400" />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Rarity:</span>
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value as any)}
                  className="bg-slate-950 border border-white/10 text-slate-300 text-xs rounded px-2 py-1 outline-none font-mono focus:border-amber-500/50"
                >
                  <option value="all">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                  <option value="ancient">Ancient</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown size={12} className="text-slate-400" />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-white/10 text-slate-300 text-xs rounded px-2 py-1 outline-none font-mono focus:border-amber-500/50"
                >
                  <option value="rarity-desc">Rarity (Highest)</option>
                  <option value="price-asc">Price (Lowest)</option>
                  <option value="price-desc">Price (Highest)</option>
                  <option value="level-desc">Level Req</option>
                  <option value="stats-desc">Attributes Power</option>
                </select>
              </div>
            </div>

            {/* Grid browser of items */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
              {processedItems.length === 0 ? (
                <div className="col-span-full py-20 text-center font-mono text-slate-500 text-xs flex flex-col items-center gap-2">
                  <span>No products available under this filter setup.</span>
                  {activeTab === 'sell' && (
                    <span className="text-[11px] text-slate-600 max-w-sm">
                      Unequipped weapons, armors, and accessory items will show up here to be liquidated.
                    </span>
                  )}
                </div>
              ) : (
                processedItems.map(item => {
                  const buyPrice = item.buyPrice || economySystem.calculateBuyPrice(item);
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
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                      }`}
                    >
                      {/* Item Icon */}
                      <div className={`w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border ${rarityConf.borderColor} ${rarityConf.glowColor}`}>
                        <ItemIcon item={item} className="w-6 h-6" size={24} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${rarityConf.textColor}`}>
                              {item.rarity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              lvl {item.levelReq}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-100 truncate block mt-0.5">
                            {item.name.replace(/\[.*?\] /, '')}
                          </span>
                        </div>

                        {/* Price Tag */}
                        <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-white/5 font-mono text-[11px]">
                          <span className="text-slate-400">
                            {activeTab === 'sell' ? 'Liquidation:' : 'Cost:'}
                          </span>
                          <span className={`font-bold flex items-center gap-0.5 ${activeTab === 'sell' ? 'text-amber-400' : 'text-amber-300'}`}>
                            {activeTab === 'sell' ? item.sellValue : buyPrice}g
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Selection details, attributes, previews, triggers (Desktop only) */}
          <div className="hidden md:flex md:w-80 bg-slate-950/45 p-5 overflow-y-auto flex-col justify-between border-t md:border-t-0 border-white/5">
            {selectedItem ? (
              renderRightColumnContent(selectedItem)
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 font-mono text-xs space-y-2 p-5 border border-dashed border-white/5 rounded-2xl">
                <Eye size={24} className="text-slate-600" />
                <span>Select an item in the market display to preview specifications, visual appearance, and active attribute comparison.</span>
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
                  className="md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] bg-slate-900 border-t border-white/10 rounded-t-3xl z-50 p-5 overflow-y-auto flex flex-col justify-between shadow-2xl"
                >
                  <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Item Specifications</span>
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
                    {renderRightColumnContent(selectedItem)}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* Selling Confirmation Modal for valuable items */}
      <AnimatePresence>
        {showConfirmSell && itemToSell && (
          <div className="fixed inset-0 bg-slate-950/98 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto animate-pulse">
                <AlertTriangle size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase text-red-400 font-sans tracking-wide">
                  Confirm High-Value Sale
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-sans">
                  You are about to sell a high-rarity item: <strong className={`font-mono text-${RARITIES[itemToSell.rarity]?.textColor || 'white'}`}>{itemToSell.name}</strong>. This transaction is permanent and cannot be reversed!
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex justify-between items-center text-xs font-mono max-w-xs mx-auto">
                <span className="text-slate-400">Liquidation Price:</span>
                <span className="text-amber-400 font-bold">{itemToSell.sellValue}g Gold</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => executeSell(itemToSell)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Yes, Liquidate It
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSell(false);
                    setItemToSell(null);
                    audio.playSfx('loot');
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
