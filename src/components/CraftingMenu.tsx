import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Shield, Flame, Hammer, X, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { Cpu, Zap, FlaskConical, Fence } from 'lucide-react';
import { WeaponId, ResourceCount } from '../types';
import { WEAPONS } from '../constants';

interface CraftingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: ResourceCount;
  craftedWeapons: WeaponId[];
  activeWeapon: WeaponId;
  potionsCount: number;
  spikeTrapsCount?: number;
  teslaTurretsCount?: number;
  hasCompanionDrone?: boolean;
  onCraft: (id: WeaponId | 'potion' | 'spike_trap' | 'tesla_turret' | 'companion') => void;
  onEquip: (id: WeaponId) => void;
}

export default function CraftingMenu({
  isOpen,
  onClose,
  inventory,
  craftedWeapons,
  activeWeapon,
  potionsCount,
  spikeTrapsCount = 0,
  teslaTurretsCount = 0,
  hasCompanionDrone = false,
  onCraft,
  onEquip,
}: CraftingMenuProps) {
  // We can treat Potion, traps, and drone as unique custom recipes
  const potionRecipe: ResourceCount = { wood: 5, metal: 3, gem: 0 };
  const spikeTrapRecipe: ResourceCount = { wood: 12, metal: 4, gem: 0 };
  const teslaTurretRecipe: ResourceCount = { wood: 0, metal: 15, gem: 3 };
  const companionRecipe: ResourceCount = { wood: 0, metal: 20, gem: 5 };

  const canAfford = (recipe: ResourceCount) => {
    return (
      inventory.wood >= recipe.wood &&
      inventory.metal >= recipe.metal &&
      inventory.gem >= recipe.gem
    );
  };

  const getWeaponIcon = (id: WeaponId) => {
    switch (id) {
      case 'pistol': return <Swords className="w-5 h-5 text-gray-400" />;
      case 'plasma_rifle': return <Flame className="w-5 h-5 text-sky-400 animate-pulse" />;
      case 'shotgun': return <Hammer className="w-5 h-5 text-red-400" />;
      case 'submachine_gun': return <Swords className="w-5 h-5 text-amber-400" />;
      case 'sniper_rifle': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'rocket_launcher': return <Flame className="w-5 h-5 text-purple-400 animate-bounce" />;
      case 'flamethrower': return <Flame className="w-5 h-5 text-orange-400 animate-pulse" />;
      case 'laser_cannon': return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'grenade_launcher': return <Hammer className="w-5 h-5 text-pink-400" />;
      case 'tesla_carbine': return <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />;
      case 'void_staff': return <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />;
      case 'fire_staff': return <Flame className="w-5 h-5 text-red-500 animate-pulse" />;
      case 'ice_staff': return <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />;
      case 'wind_staff': return <Sparkles className="w-5 h-5 text-slate-200" />;
      case 'chrono_repeater': return <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2 sm:gap-3">
                <Hammer className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 animate-pulse" />
                <div>
                  <h2 className="text-base sm:text-xl font-bold font-sans text-white uppercase tracking-wider">
                    Forge & Alchemy
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-mono">Craft items using gathered materials</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/5 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Materials Tracker */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950/30 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/5 shadow-inner">
                  <span className="text-xs font-mono text-slate-300">Wood</span>
                  <span className="text-sm font-bold text-amber-500">{inventory.wood}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/5 shadow-inner">
                  <span className="text-xs font-mono text-slate-300">Metal</span>
                  <span className="text-sm font-bold text-slate-200">{inventory.metal}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/5 shadow-inner">
                  <span className="text-xs font-mono text-slate-300">Gems</span>
                  <span className="text-sm font-bold text-purple-400 animate-pulse">{inventory.gem}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Recipes</h3>

                {/* 1. Health Potion Recipe */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-0.5">
                      <FlaskConical className="w-5 h-5 text-red-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-red-400 font-sans">Healing Elixir</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                          Qty: {potionsCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">Consumable. Instantly restores +50 Health.</p>
                      {/* Recipe ingredients */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                        <span className={inventory.wood >= potionRecipe.wood ? 'text-slate-300' : 'text-red-400'}>
                          Wood: {potionRecipe.wood}
                        </span>
                        <span className={inventory.metal >= potionRecipe.metal ? 'text-slate-300' : 'text-red-400'}>
                          Metal: {potionRecipe.metal}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCraft('potion')}
                    disabled={!canAfford(potionRecipe)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                      canAfford(potionRecipe)
                        ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400/30 shadow-md shadow-red-600/10 cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed opacity-40'
                    }`}
                  >
                    Craft Pot
                  </button>
                </div>

                {/* 2. Combat Drone Companion Recipe */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-0.5 animate-pulse">
                      <Cpu className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-amber-400 font-sans">Aero-Drone Companion</h4>
                        {hasCompanionDrone && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">Summons a hovering robotic defender. Automatically vacuums nearby items and fires plasma shots at zombies!</p>
                      {/* Recipe ingredients */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                        <span className={inventory.metal >= companionRecipe.metal ? 'text-slate-300' : 'text-red-400'}>
                          Metal: {companionRecipe.metal}
                        </span>
                        <span className={inventory.gem >= companionRecipe.gem ? 'text-purple-400' : 'text-red-400'}>
                          Gems: {companionRecipe.gem}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCraft('companion')}
                    disabled={hasCompanionDrone || !canAfford(companionRecipe)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all uppercase ${
                      hasCompanionDrone
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 cursor-not-allowed'
                        : canAfford(companionRecipe)
                        ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/30 shadow-md shadow-amber-600/10 cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {hasCompanionDrone ? 'Summoned' : 'Forge Drone'}
                  </button>
                </div>

                {/* 3. Spike Trap Recipe */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mt-0.5">
                      <Fence className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-orange-400 font-sans">Tactical Spike Trap</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                          Stock: {spikeTrapsCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">Deployable trap. Slows and cuts down overlapping zombies in a 1-tile area when placed.</p>
                      {/* Recipe ingredients */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                        <span className={inventory.wood >= spikeTrapRecipe.wood ? 'text-slate-300' : 'text-red-400'}>
                          Wood: {spikeTrapRecipe.wood}
                        </span>
                        <span className={inventory.metal >= spikeTrapRecipe.metal ? 'text-slate-300' : 'text-red-400'}>
                          Metal: {spikeTrapRecipe.metal}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCraft('spike_trap')}
                    disabled={!canAfford(spikeTrapRecipe)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all uppercase ${
                      canAfford(spikeTrapRecipe)
                        ? 'bg-orange-600 hover:bg-orange-500 text-white border border-orange-400/30 shadow-md shadow-orange-600/10 cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed opacity-40'
                    }`}
                  >
                    Forge Trap
                  </button>
                </div>

                {/* 4. Tesla Turret Recipe */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mt-0.5">
                      <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-cyan-400 font-sans">Tesla Shock Turret</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                          Stock: {teslaTurretsCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">Deployable turret. Automatically shoots high-voltage electric charges at nearby zombies.</p>
                      {/* Recipe ingredients */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                        <span className={inventory.metal >= teslaTurretRecipe.metal ? 'text-slate-300' : 'text-red-400'}>
                          Metal: {teslaTurretRecipe.metal}
                        </span>
                        <span className={inventory.gem >= teslaTurretRecipe.gem ? 'text-purple-400' : 'text-red-400'}>
                          Gems: {teslaTurretRecipe.gem}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCraft('tesla_turret')}
                    disabled={!canAfford(teslaTurretRecipe)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all uppercase ${
                      canAfford(teslaTurretRecipe)
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/30 shadow-md shadow-cyan-600/10 cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed opacity-40'
                    }`}
                  >
                    Forge Turret
                  </button>
                </div>

                {/* Weapons Recipes */}
                {Object.values(WEAPONS).map((w) => {
                  // Pistol is starting weapon, already unlocked for free
                  if (w.id === 'pistol') return null;

                  const crafted = craftedWeapons.includes(w.id);
                  const active = activeWeapon === w.id;
                  const affordable = canAfford(w.recipe);

                  return (
                    <div
                      key={w.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/20 rounded-2xl border transition-all gap-4 ${
                        active
                          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                          : crafted
                          ? 'border-white/5 bg-slate-950/10'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Weapon Details */}
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="p-3 rounded-xl mt-0.5"
                          style={{
                            backgroundColor: `${w.color}15`,
                            border: `1px solid ${w.color}30`,
                          }}
                        >
                          {getWeaponIcon(w.id)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className="font-bold text-sm font-sans"
                              style={{ color: w.color }}
                            >
                              {w.name}
                            </h4>
                            {crafted && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                                OWNED
                              </span>
                            )}
                            {active && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/40 animate-pulse">
                                EQUIPPED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 max-w-md">{w.description}</p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 xs:grid-cols-4 gap-x-4 gap-y-1 pt-1.5 text-[10px] font-mono text-slate-400">
                            <div>
                              <span>ATK: {w.damage}</span>
                            </div>
                            <div>
                              <span>RNG: {w.range}m</span>
                            </div>
                            <div>
                              <span>SPD: {w.attackSpeed}/s</span>
                            </div>
                            {w.armorBonus > 0 && (
                              <div>
                                <span className="text-emerald-400">ARM: +{w.armorBonus}</span>
                              </div>
                            )}
                            {w.speedBonus !== 0 && (
                              <div>
                                <span className={w.speedBonus > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  SPD: {w.speedBonus > 0 ? `+${w.speedBonus * 100}%` : `${w.speedBonus * 100}%`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Recipe requirements */}
                          {!crafted && (
                            <div className="flex items-center gap-3 mt-2.5 text-[10px] font-mono border-t border-white/5 pt-1.5">
                              <span className="text-slate-500 mr-1 uppercase">Requires:</span>
                              <span className={inventory.wood >= w.recipe.wood ? 'text-slate-300' : 'text-red-400'}>
                                Wood: {w.recipe.wood}
                              </span>
                              <span className={inventory.metal >= w.recipe.metal ? 'text-slate-300' : 'text-red-400'}>
                                Metal: {w.recipe.metal}
                              </span>
                              {w.recipe.gem > 0 && (
                                <span className={inventory.gem >= w.recipe.gem ? 'text-purple-400' : 'text-red-400'}>
                                  Gems: {w.recipe.gem}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="w-full sm:w-auto flex flex-col justify-end">
                        {crafted ? (
                          <button
                            onClick={() => onEquip(w.id)}
                            disabled={active}
                            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all uppercase ${
                              active
                                ? 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed opacity-40'
                                : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 shadow-md shadow-purple-600/10 cursor-pointer hover:scale-105 active:scale-95'
                            }`}
                          >
                            {active ? 'Equipped' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            onClick={() => onCraft(w.id)}
                            disabled={!affordable}
                            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all uppercase ${
                              affordable
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 shadow-md shadow-emerald-600/10 cursor-pointer hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed opacity-40'
                            }`}
                          >
                            Craft
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Alert if missing materials */}
            <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-500/60" />
              <p className="text-[10px] font-mono text-slate-300">
                TIP: Defeat tank zombies for metal, spitters for gems, and break ruins for wood!
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
