import React from 'react';
import { 
  Shield, Flame, Hammer, Swords, Heart, Sparkles, Plus, Compass, 
  Pause, Zap, FlaskConical, Fence, Magnet, Cpu, Sun, CloudRain, 
  Snowflake, TreePine, Wrench, Gem 
} from 'lucide-react';
import { Character, WeaponId, ResourceCount } from '../types';
import { WEAPONS } from '../constants';

interface HUDProps {
  player: Character;
  currentWave: number;
  waveActive: boolean;
  waveTimer: number;
  totalWaves: number;
  level: number;
  levelName: string;
  zombiesKilled: number;
  currentWeather: 'clear' | 'storm' | 'blizzard' | 'ashfall' | 'toxic_fog' | 'plasma_tempest';
  weatherTimer: number;
  activePowerups: { doubleDamage: number, hyperSpeed: number, forceShield: number, magnet: number };
  activePlacement: 'spike_trap' | 'tesla_turret' | null;
  onOpenCrafting: () => void;
  onOpenInventory: () => void;
  onUsePotion: () => void;
  onEquipWeapon: (id: WeaponId) => void;
  onPauseToggle: () => void;
  onTogglePlacement: (type: 'spike_trap' | 'tesla_turret') => void;
}

export default function HUD({
  player,
  currentWave,
  waveActive,
  waveTimer,
  totalWaves,
  level,
  levelName,
  zombiesKilled,
  currentWeather,
  weatherTimer,
  activePowerups,
  activePlacement,
  onOpenCrafting,
  onOpenInventory,
  onUsePotion,
  onEquipWeapon,
  onPauseToggle,
  onTogglePlacement,
}: HUDProps) {
  // Percentage values for health and XP
  const healthPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.nextLevelXp) * 100));

  const activeW = WEAPONS[player.activeWeapon];

  // Quick stats computed
  const speedDisplay = (player.speed * (1 + (activeW?.speedBonus || 0)) * 100).toFixed(0);
  const armorDisplay = player.armor + (activeW?.armorBonus || 0);
  const damageDisplay = player.baseDamage + (activeW?.damage || 0);

  const getWeaponIcon = (id: WeaponId) => {
    switch (id) {
      case 'pistol': return <Swords className="w-4 h-4 text-gray-400" />;
      case 'plasma_rifle': return <Flame className="w-4 h-4 text-sky-400 animate-pulse" />;
      case 'shotgun': return <Hammer className="w-4 h-4 text-red-400" />;
      case 'submachine_gun': return <Swords className="w-4 h-4 text-amber-400" />;
      case 'sniper_rifle': return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'rocket_launcher': return <Flame className="w-4 h-4 text-purple-400 animate-bounce" />;
      case 'flamethrower': return <Flame className="w-4 h-4 text-orange-400 animate-pulse" />;
      case 'laser_cannon': return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'grenade_launcher': return <Hammer className="w-4 h-4 text-pink-400" />;
      case 'tesla_carbine': return <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />;
      case 'void_staff': return <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'fire_staff': return <Flame className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'ice_staff': return <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />;
      case 'wind_staff': return <Sparkles className="w-4 h-4 text-slate-200" />;
      case 'chrono_repeater': return <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-40 select-none">
      {/* TOP SECTION: Vitals, Wave tracker, Resources */}
      {/* DESKTOP-ONLY TOP HUD */}
      <div className="hidden sm:flex flex-row items-start justify-between w-full gap-2 pointer-events-auto">
        {/* Top Left: Compact Vitals */}
        <div className="flex flex-col gap-1.5 max-w-[150px] sm:max-w-xs">
          {/* Compact Vitals Panel */}
          <div className="bg-slate-950/90 border border-white/10 p-2 sm:p-3 rounded-xl shadow-lg flex items-center gap-2 sm:gap-3">
            {/* Small Lvl Badge */}
            <div className="flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-lg px-1.5 py-1 min-w-[28px] sm:min-w-[36px]">
              <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-blue-400">LVL</span>
              <span className="text-xs sm:text-base font-black text-white leading-none">{player.level}</span>
            </div>

            {/* Bars Column */}
            <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
              {/* HP */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-mono leading-none">
                  <span className="font-bold uppercase text-red-400">HP</span>
                  <span className="text-slate-200 font-bold">{Math.ceil(player.health)}/{player.maxHealth}</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              </div>

              {/* XP */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-mono leading-none">
                  <span className="font-bold uppercase text-blue-400">XP</span>
                  <span className="text-slate-300">{player.xp}/{player.nextLevelXp}</span>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Stats Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[7px] sm:text-[9px] font-bold font-mono bg-slate-950/80 px-2 py-1 rounded-lg border border-white/5 w-fit text-slate-300 shadow-sm">
            <span className="flex items-center gap-0.5"><Swords className="w-2.5 h-2.5 text-rose-400 mr-1" /><strong className="text-rose-400">{damageDisplay}</strong></span>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-emerald-400 mr-1" /><strong className="text-emerald-400">{armorDisplay}</strong></span>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5 text-sky-400 mr-1" /><strong className="text-sky-400">{speedDisplay}%</strong></span>
          </div>

          {/* Active Powerups & Drone Status Panel */}
          <div className="flex flex-col gap-1.5 mt-1 sm:mt-2 pointer-events-auto">
            {activePowerups.doubleDamage > 0 && (
              <div className="flex items-center gap-1.5 bg-red-950/95 border border-red-500/40 px-2 py-1 rounded-lg text-[9px] sm:text-xs font-bold text-red-200 shadow-md">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>X2 DAMAGE:</span>
                <span className="font-mono text-red-400">{activePowerups.doubleDamage.toFixed(1)}s</span>
              </div>
            )}
            {activePowerups.hyperSpeed > 0 && (
              <div className="flex items-center gap-1.5 bg-cyan-950/95 border border-cyan-500/40 px-2 py-1 rounded-lg text-[9px] sm:text-xs font-bold text-cyan-200 shadow-md">
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>HYPER SPEED:</span>
                <span className="font-mono text-cyan-400">{activePowerups.hyperSpeed.toFixed(1)}s</span>
              </div>
            )}
            {activePowerups.forceShield > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/95 border border-emerald-500/40 px-2 py-1 rounded-lg text-[9px] sm:text-xs font-bold text-emerald-200 shadow-md">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>FORCE SHIELD:</span>
                <span className="font-mono text-emerald-400">{activePowerups.forceShield.toFixed(1)}s</span>
              </div>
            )}
            {activePowerups.magnet > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-950/95 border border-yellow-500/40 px-2 py-1 rounded-lg text-[9px] sm:text-xs font-bold text-yellow-200 shadow-md">
                <Magnet className="w-3.5 h-3.5 text-yellow-400" />
                <span>ULTRA MAGNET:</span>
                <span className="font-mono text-yellow-400">{activePowerups.magnet.toFixed(1)}s</span>
              </div>
            )}
            {player.hasCompanionDrone && (
              <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/30 px-2 py-1 rounded-lg text-[9px] sm:text-xs font-bold text-amber-200 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="whitespace-nowrap">AERO-DRONE ONLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Center: Compact Wave Tracker & Weather Status */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
          <div className="flex flex-col items-center gap-1 bg-slate-950/90 border border-white/10 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-center shadow-lg max-w-[130px] sm:max-w-xs">
            <div className="flex items-center gap-1 text-[7px] sm:text-[9px] font-bold uppercase tracking-wider text-blue-400 truncate max-w-[110px] sm:max-w-none">
              <Compass className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">Z{level}: {levelName}</span>
            </div>

            {waveActive ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-base font-black text-white whitespace-nowrap">WAVE {currentWave.toString().padStart(2, '0')}</span>
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse shrink-0" />
              </div>
            ) : (
              <div className="flex flex-col items-center leading-none">
                <span className="text-[9px] sm:text-xs font-bold font-sans text-amber-400 animate-pulse uppercase tracking-wider whitespace-nowrap">
                  NEXT: {Math.max(0, Math.ceil(waveTimer))}s
                </span>
              </div>
            )}

            <div className="text-[7px] sm:text-[9px] font-mono text-slate-400 border-t border-white/5 pt-0.5 mt-0.5 w-full">
              Kills: <span className="text-slate-200 font-bold">{zombiesKilled}</span>
            </div>
          </div>

          {/* Environmental Weather Badge */}
          <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-950/90 border border-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-center shadow-lg max-w-[150px] sm:max-w-xs font-sans">
            <div className="text-[7px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">Environment</div>
            <div className="text-[10px] sm:text-xs font-black text-slate-200 leading-tight flex items-center justify-center">
              {currentWeather === 'clear' && <><Sun className="w-3.5 h-3.5 text-amber-300 mr-1" /> CLEAR SKY</>}
              {currentWeather === 'storm' && <><CloudRain className="w-3.5 h-3.5 text-sky-400 mr-1 animate-pulse" /> RAINSTORM</>}
              {currentWeather === 'blizzard' && <><Snowflake className="w-3.5 h-3.5 text-cyan-300 mr-1 animate-pulse" /> BLIZZARD</>}
              {currentWeather === 'ashfall' && <><Flame className="w-3.5 h-3.5 text-orange-400 mr-1 animate-pulse" /> ASHFALL</>}
              {currentWeather === 'toxic_fog' && <><FlaskConical className="w-3.5 h-3.5 text-emerald-400 mr-1 animate-pulse" /> ACID FOG</>}
              {currentWeather === 'plasma_tempest' && <><Zap className="w-3.5 h-3.5 text-pink-400 mr-1 animate-pulse" /> PLASMA TEMPEST</>}
            </div>
            <div className="text-[7px] sm:text-[8px] font-mono text-slate-400 leading-none mt-1">
              {currentWeather === 'clear' && 'Standard attributes'}
              {currentWeather === 'storm' && '-15% Speed, +25% Atk Speed'}
              {currentWeather === 'blizzard' && 'Zombies slowed, deals Frost dmg'}
              {currentWeather === 'ashfall' && 'Combat damage boosted by +15%'}
              {currentWeather === 'toxic_fog' && '+20% Critical, Stand-still damage'}
              {currentWeather === 'plasma_tempest' && 'Lightning strikes enemies!'}
            </div>
            <div className="text-[8px] font-mono text-slate-500 font-bold mt-1">
              Timer: {Math.max(0, Math.ceil(weatherTimer))}s
            </div>
          </div>

          <button
            onClick={onPauseToggle}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-950/90 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shrink-0 pointer-events-auto"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-200" />
          </button>
        </div>

        {/* Top Right: Compact Resources Tracker */}
        <div className="flex flex-row gap-1 sm:gap-2 bg-slate-950/90 border border-white/10 p-1 sm:p-1.5 rounded-xl shadow-lg">
          {/* Wood */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded-lg border border-white/5">
            <TreePine className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-200">{player.inventory.wood}</span>
          </div>

          {/* Metal */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded-lg border border-white/5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-200">{player.inventory.metal}</span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded-lg border border-white/5">
            <Gem className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-300">{player.inventory.gem}</span>
          </div>
        </div>
      </div>

      {/* MOBILE-ONLY TOP HUD */}
      <div className="flex sm:hidden flex-col gap-1.5 w-full pointer-events-auto">
        {/* Row 1: Vitals & Resources & Pause Button */}
        <div className="flex justify-between items-center w-full gap-2">
          {/* Left: Vitals Capsule */}
          <div className="bg-slate-950/90 border border-white/10 p-1.5 rounded-xl shadow-lg flex items-center gap-1.5 flex-1 max-w-[170px]">
            {/* Lvl Badge */}
            <div className="flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-md px-1 py-0.5 min-w-[22px]">
              <span className="text-[6px] font-black uppercase tracking-widest text-blue-400">LVL</span>
              <span className="text-xs font-black text-white leading-none">{player.level}</span>
            </div>
            {/* Bars Column */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="h-1.5 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5 relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
              <div className="h-1 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5 relative">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Resources Capsule + Pause */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Resources list */}
            <div className="flex flex-row gap-1.5 bg-slate-950/90 border border-white/10 p-1 rounded-xl shadow-lg text-[10px] font-mono font-bold text-slate-200">
              <span className="px-1.5 py-0.5 bg-white/5 rounded flex items-center gap-0.5 text-amber-500">W: <span className="text-slate-200">{player.inventory.wood}</span></span>
              <span className="px-1.5 py-0.5 bg-white/5 rounded flex items-center gap-0.5 text-slate-400">M: <span className="text-slate-200">{player.inventory.metal}</span></span>
              <span className="px-1.5 py-0.5 bg-white/5 rounded flex items-center gap-0.5 text-purple-400">G: <span className="text-purple-300">{player.inventory.gem}</span></span>
            </div>
            {/* Pause */}
            <button
              onClick={onPauseToggle}
              className="p-1.5 rounded-xl bg-slate-950/90 border border-white/10 text-slate-300 active:bg-white/10"
            >
              <Pause className="w-3.5 h-3.5 text-slate-200" />
            </button>
          </div>
        </div>

        {/* Row 2: Unified Wave, Info, Stats, Environment Capsule */}
        <div className="flex justify-between items-center w-full gap-1.5">
          {/* Wave and Environment Info */}
          <div className="bg-slate-950/90 border border-white/10 px-2 py-1 rounded-xl shadow-lg flex items-center justify-between flex-1 text-[9px] font-sans font-bold">
            <span className="text-blue-400">WAVE {currentWave.toString().padStart(2, '0')}</span>
            {!waveActive && (
              <span className="text-amber-400 animate-pulse">NEXT: {Math.max(0, Math.ceil(waveTimer))}s</span>
            )}
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 truncate max-w-[80px]">
              {currentWeather === 'clear' && 'Clear'}
              {currentWeather === 'storm' && 'Storm'}
              {currentWeather === 'blizzard' && 'Blizzard'}
              {currentWeather === 'ashfall' && 'Ashfall'}
              {currentWeather === 'toxic_fog' && 'Acid'}
              {currentWeather === 'plasma_tempest' && 'Plasma'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-200 font-mono">Kills: {zombiesKilled}</span>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-1 text-[8px] font-bold font-mono bg-slate-950/90 px-2 py-1 rounded-xl border border-white/10 text-slate-300 shrink-0">
            <span>ATK: <strong className="text-rose-400">{damageDisplay}</strong></span>
            <span>DEF: <strong className="text-emerald-400">{armorDisplay}</strong></span>
          </div>
        </div>

        {/* Row 3: Active Powerups (Mobile Compact Row) */}
        <div className="flex flex-wrap gap-1 pointer-events-none">
          {activePowerups.doubleDamage > 0 && (
            <div className="bg-red-950/80 border border-red-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-red-200 flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" /> {activePowerups.doubleDamage.toFixed(0)}s
            </div>
          )}
          {activePowerups.hyperSpeed > 0 && (
            <div className="bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-cyan-200 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" /> {activePowerups.hyperSpeed.toFixed(0)}s
            </div>
          )}
          {activePowerups.forceShield > 0 && (
            <div className="bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-emerald-200 flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> {activePowerups.forceShield.toFixed(0)}s
            </div>
          )}
          {activePowerups.magnet > 0 && (
            <div className="bg-yellow-950/80 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-yellow-200 flex items-center gap-0.5">
              <Magnet className="w-2.5 h-2.5" /> {activePowerups.magnet.toFixed(0)}s
            </div>
          )}
        </div>
      </div>

      {/* MOBILE-ONLY BOTTOM-RIGHT ACTION PAD (To prevent any overlap with virtual joystick) */}
      <div className="sm:hidden absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-3 z-40">
        {/* Quick Weapons List */}
        <div className="flex gap-1.5 bg-slate-950/85 border border-white/10 p-1 rounded-2xl shadow-lg">
          {player.craftedWeapons.map((weaponId) => {
            const w = WEAPONS[weaponId];
            const isEquipped = player.activeWeapon === weaponId;
            if (!w) return null;
            return (
              <button
                key={weaponId}
                onClick={() => onEquipWeapon(weaponId)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                  isEquipped
                    ? 'scale-105'
                    : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                }`}
                style={{
                  borderColor: isEquipped ? w.color : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isEquipped ? `0 0 10px ${w.glowColor}` : 'none',
                  backgroundColor: isEquipped ? `${w.color}20` : undefined,
                }}
              >
                {getWeaponIcon(weaponId)}
              </button>
            );
          })}
        </div>

        {/* Action Controls Group */}
        <div className="flex gap-2">
          {/* Potion Button */}
          <button
            onClick={onUsePotion}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
              player.potionsCount > 0
                ? 'bg-red-500/15 border-red-500/55 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'bg-white/5 border-white/10 opacity-35'
            }`}
          >
            {player.potionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[8px] font-extrabold flex items-center justify-center shadow-md">
                {player.potionsCount}
              </span>
            )}
            <FlaskConical className="w-5 h-5 text-red-400" />
          </button>

          {/* Spike Trap Button */}
          <button
            onClick={() => onTogglePlacement('spike_trap')}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
              activePlacement === 'spike_trap'
                ? 'bg-orange-500/30 border-orange-400'
                : (player.spikeTrapsCount || 0) > 0
                ? 'bg-orange-500/15 border-orange-500/40'
                : 'bg-white/5 border-white/10 opacity-35'
            }`}
            title="Deploy Spike Trap"
          >
            {(player.spikeTrapsCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white font-mono text-[8px] font-bold flex items-center justify-center">
                {player.spikeTrapsCount}
              </span>
            )}
            <Fence className="w-5 h-5 text-orange-400" />
          </button>

          {/* Tesla Turret Button */}
          <button
            onClick={() => onTogglePlacement('tesla_turret')}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
              activePlacement === 'tesla_turret'
                ? 'bg-cyan-500/30 border-cyan-400'
                : (player.teslaTurretsCount || 0) > 0
                ? 'bg-cyan-500/15 border-cyan-500/40'
                : 'bg-white/5 border-white/10 opacity-35'
            }`}
            title="Deploy Tesla Turret"
          >
            {(player.teslaTurretsCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-600 text-white font-mono text-[8px] font-bold flex items-center justify-center">
                {player.teslaTurretsCount}
              </span>
            )}
            <Zap className="w-5 h-5 text-cyan-400" />
          </button>

          {/* Forge/Craft Button */}
          <button
            onClick={onOpenCrafting}
            className="w-11 h-11 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)] relative transition-all cursor-pointer"
          >
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Hammer className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* DESKTOP-ONLY BOTTOM HUD PANEL */}
      <div className="hidden sm:flex flex-row items-end justify-between w-full pointer-events-none mt-auto gap-4">
        {/* Left Side: Empty to avoid Joystick overlap */}
        <div className="w-10"></div>

        {/* Center Side: Quick Weapon Selector bar */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 max-w-md mx-4">
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-3xl flex gap-3 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
            {player.craftedWeapons.map((weaponId) => {
              const w = WEAPONS[weaponId];
              const isEquipped = player.activeWeapon === weaponId;
              if (!w) return null;

              // map visual icons
              const renderWeaponIcon = () => {
                switch (weaponId) {
                  case 'pistol': return <Swords className="w-5 h-5 text-slate-400" />;
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
                  default: return <Swords className="w-5 h-5 text-slate-300" />;
                }
              };

              return (
                <button
                   key={weaponId}
                   onClick={() => onEquipWeapon(weaponId)}
                   className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all border relative cursor-pointer ${
                    isEquipped
                      ? 'scale-105'
                      : 'bg-white/5 border-white/10 opacity-75 hover:opacity-100 hover:scale-102'
                  }`}
                  style={{
                    borderColor: isEquipped ? w.color : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isEquipped ? `0 0 15px ${w.glowColor}` : 'none',
                    backgroundColor: isEquipped ? `${w.color}20` : undefined,
                  }}
                  title={w.name}
                >
                  <div className="flex items-center justify-center drop-shadow-md">{renderWeaponIcon()}</div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[54px] mt-1.5">{w.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Heal Potion, Defenses & Craft Buttons */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/85 p-1.5 rounded-2xl border border-white/5">
            {/* Heal Potion button */}
            <button
              onClick={onUsePotion}
              className={`group relative w-14 h-14 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                player.potionsCount > 0
                  ? 'bg-white/10 border-red-500/50 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-md'
                  : 'bg-white/5 border-white/10 opacity-40 hover:bg-white/10'
              }`}
            >
              {player.potionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-md animate-bounce">
                  {player.potionsCount}
                </span>
              )}
              <FlaskConical className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[7px] font-bold tracking-wider text-red-300 uppercase mt-0.5">HEAL (H)</span>
            </button>

            {/* Spike Trap deployment */}
            <button
              onClick={() => onTogglePlacement('spike_trap')}
              className={`group relative w-14 h-14 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
                activePlacement === 'spike_trap'
                  ? 'bg-orange-500/35 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)] scale-105 animate-pulse'
                  : (player.spikeTrapsCount || 0) > 0
                  ? 'bg-white/10 border-orange-500/30 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-md'
                  : 'bg-white/5 border-white/10 opacity-40 hover:bg-white/10'
              }`}
              title="Deploy Spike Trap (T)"
            >
              <Fence className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[7px] font-bold tracking-wider text-orange-300 uppercase mt-0.5">
                {activePlacement === 'spike_trap' ? 'PLACING' : `TRAP (${player.spikeTrapsCount || 0})`}
              </span>
            </button>

            {/* Tesla Turret deployment */}
            <button
              onClick={() => onTogglePlacement('tesla_turret')}
              className={`group relative w-14 h-14 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
                activePlacement === 'tesla_turret'
                  ? 'bg-cyan-500/35 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105 animate-pulse'
                  : (player.teslaTurretsCount || 0) > 0
                  ? 'bg-white/10 border-cyan-500/30 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-md'
                  : 'bg-white/5 border-white/10 opacity-40 hover:bg-white/10'
              }`}
              title="Deploy Tesla Turret (Y)"
            >
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className="text-[7px] font-bold tracking-wider text-cyan-300 uppercase mt-0.5">
                {activePlacement === 'tesla_turret' ? 'PLACING' : `TURRET (${player.teslaTurretsCount || 0})`}
              </span>
            </button>
          </div>

          {/* Crafting Button */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col font-mono text-[9px] text-slate-400 text-right leading-tight">
              <span>Forge Menu</span>
              <span className="font-bold text-emerald-400">(C Key)</span>
            </div>
            <button
              onClick={onOpenCrafting}
              className="group relative w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {/* Pulsing forge indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-65" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300 shadow" />

              <Hammer className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-250" />
              <span className="text-[8px] font-bold uppercase text-emerald-300 mt-1">CRAFT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
