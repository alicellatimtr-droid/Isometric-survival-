import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Lock, 
  ShieldAlert, 
  Sword, 
  Zap, 
  Skull, 
  Crown, 
  Layers, 
  Sparkles, 
  BookOpen,
  Info
} from 'lucide-react';
import { PlayerSaveData } from '../systems/saveSystem';
import { LEVEL_ENEMIES, BOSS_BLUEPRINTS, EnemyBlueprint } from '../systems/enemySystem';
import { ENEMY_LORE_MAP, EnemyLoreEntry } from '../data/enemyLoreData';
import { LEVEL_THEMES } from '../constants';

interface EnemyCodexProps {
  saveData: PlayerSaveData;
  onBack: () => void;
}

export default function EnemyCodex({ saveData, onBack }: EnemyCodexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'enemies' | 'bosses'>('all');
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [selectedEnemyName, setSelectedEnemyName] = useState<string | null>(null);

  // Determine unlocked levels and defeated bosses
  const unlockedLevel = saveData.unlockedLevel || 1;
  const defeatedBossTypes = useMemo(() => {
    return new Set(saveData.bossesDefeated || []);
  }, [saveData.bossesDefeated]);

  // Aggregate all enemies & bosses into a unified codex array
  const allCodexEntries = useMemo(() => {
    const list: Array<{
      id: string;
      level: number;
      zoneName: string;
      isBoss: boolean;
      stats: {
        maxHealth: number;
        speed: number;
        damage: number;
        radius: number;
        color: string;
        glowColor: string;
        pointsValue: number;
        sizeMultiplier: number;
        weakness?: string;
        behaviorType?: string;
      };
      blueprint: EnemyBlueprint | any;
      lore?: EnemyLoreEntry;
      isUnlocked: boolean;
    }> = [];

    // 1. Add normal enemies
    Object.entries(LEVEL_ENEMIES).forEach(([lvlStr, enemies]) => {
      const lvl = parseInt(lvlStr, 10);
      const theme = LEVEL_THEMES.find(t => t.level === lvl);
      const zoneName = theme ? theme.name : `Zone ${lvl}`;
      
      // A normal enemy is unlocked if the player's highest unlockedLevel is >= its zone level
      const isUnlocked = unlockedLevel >= lvl;

      enemies.forEach((enemy, idx) => {
        const loreEntry = ENEMY_LORE_MAP[enemy.name];
        list.push({
          id: `normal-lvl${lvl}-${idx}`,
          level: lvl,
          zoneName,
          isBoss: false,
          stats: {
            maxHealth: enemy.maxHealth,
            speed: enemy.speed,
            damage: enemy.damage,
            radius: enemy.radius,
            color: enemy.color,
            glowColor: enemy.glowColor,
            pointsValue: enemy.pointsValue,
            sizeMultiplier: enemy.sizeMultiplier,
            weakness: enemy.weakness,
            behaviorType: enemy.behaviorType
          },
          blueprint: enemy,
          lore: loreEntry,
          isUnlocked
        });
      });
    });

    // 2. Add bosses
    Object.entries(BOSS_BLUEPRINTS).forEach(([lvlStr, boss]) => {
      const lvl = parseInt(lvlStr, 10);
      const theme = LEVEL_THEMES.find(t => t.level === lvl);
      const zoneName = theme ? theme.name : `Zone ${lvl}`;

      // Boss is encountered if player unlocked its level
      // Or if they defeated it
      const isUnlocked = unlockedLevel >= lvl || (boss.type && defeatedBossTypes.has(boss.type)) || false;

      const loreEntry = ENEMY_LORE_MAP[boss.name || ''];
      list.push({
        id: `boss-lvl${lvl}`,
        level: lvl,
        zoneName,
        isBoss: true,
        stats: {
          maxHealth: boss.maxHealth || 100,
          speed: boss.speed || 1,
          damage: boss.damage || 10,
          radius: boss.radius || 1,
          color: boss.color || '#fff',
          glowColor: boss.glowColor || 'rgba(255,255,255,0.3)',
          pointsValue: boss.pointsValue || 100,
          sizeMultiplier: boss.sizeMultiplier || 2,
          weakness: loreEntry?.weakness || 'Quantum Disintegration',
          behaviorType: 'boss'
        },
        blueprint: boss,
        lore: loreEntry,
        isUnlocked
      });
    });

    // Sort by Level, then bosses at the end of each level
    return list.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return (a.isBoss ? 1 : 0) - (b.isBoss ? 1 : 0);
    });
  }, [unlockedLevel, defeatedBossTypes]);

  // Filter entries based on search, tabs, and selected zone
  const filteredEntries = useMemo(() => {
    return allCodexEntries.filter(entry => {
      // Zone filter
      if (selectedZone !== 'all' && entry.level !== selectedZone) {
        return false;
      }

      // Tab filter
      if (activeTab === 'enemies' && entry.isBoss) return false;
      if (activeTab === 'bosses' && !entry.isBoss) return false;

      // Search filter (Matches Name, Lore, Behavior or Habitat)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = entry.blueprint.name?.toLowerCase().includes(query);
        const loreMatch = entry.lore?.lore?.toLowerCase().includes(query);
        const behaviorMatch = entry.stats.behaviorType?.toLowerCase().includes(query);
        const habitatMatch = entry.zoneName?.toLowerCase().includes(query);
        
        return nameMatch || loreMatch || behaviorMatch || habitatMatch;
      }

      return true;
    });
  }, [allCodexEntries, searchQuery, activeTab, selectedZone]);

  // Auto-select first unlocked entry if none or if current becomes filtered out
  const selectedEntry = useMemo(() => {
    const found = filteredEntries.find(e => e.blueprint.name === selectedEnemyName);
    if (found) return found;

    // Fallback to first unlocked entry in the filtered list
    const firstUnlocked = filteredEntries.find(e => e.isUnlocked);
    return firstUnlocked || null;
  }, [filteredEntries, selectedEnemyName]);

  // Handle setting selection safely
  const handleSelectEnemy = (name: string, isUnlocked: boolean) => {
    if (!isUnlocked) return; // Prevent viewing detailed lore of locked entries
    setSelectedEnemyName(name);
  };

  // Compute summary stats
  const codexProgress = useMemo(() => {
    const total = allCodexEntries.length;
    const encountered = allCodexEntries.filter(e => e.isUnlocked).length;
    const bossesTotal = allCodexEntries.filter(e => e.isBoss).length;
    const bossesEncountered = allCodexEntries.filter(e => e.isBoss && e.isUnlocked).length;
    const completionPercentage = total > 0 ? Math.round((encountered / total) * 100) : 0;

    return {
      total,
      encountered,
      bossesTotal,
      bossesEncountered,
      completionPercentage
    };
  }, [allCodexEntries]);

  return (
    <div className="w-full h-full text-slate-100 flex flex-col font-sans select-none overflow-hidden max-h-[85vh]">
      {/* 1. Header with Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-white uppercase">
              Tactical Enemy Codex
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Database of hostile organisms detected within the active zones.
          </p>
        </div>

        {/* Completion Bar */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl min-w-[280px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Horde Scanned</span>
              <span className="font-bold text-emerald-400">
                {codexProgress.encountered} / {codexProgress.total} ({codexProgress.completionPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${codexProgress.completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="text-center pl-3 border-l border-white/10">
            <div className="text-xs font-mono text-slate-400">BOSSES</div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {codexProgress.bossesEncountered} <span className="text-xs text-slate-500">/ {codexProgress.bossesTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls / Filters */}
      <div className="flex flex-col sm:flex-row gap-3 py-4 border-b border-white/5 bg-slate-900/40 px-1">
        {/* A. Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search enemy name, habitat, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 hover:bg-slate-950 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all"
          />
        </div>

        {/* B. Tabs */}
        <div className="flex p-1 bg-slate-950/80 border border-white/10 rounded-xl gap-1">
          {(['all', 'enemies', 'bosses'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* C. Zone Selector */}
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
          className="bg-slate-950/80 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 text-slate-300 font-mono text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer transition-all"
        >
          <option value="all">All Zones</option>
          {LEVEL_THEMES.map((theme) => (
            <option key={theme.level} value={theme.level}>
              Zone {theme.level} - {theme.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Main Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 overflow-hidden min-h-0">
        {/* Left Side: Enemy List (Grid) */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto pr-1 min-h-0 max-h-[50vh] lg:max-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.blueprint.name === entry.blueprint.name;
                
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleSelectEnemy(entry.blueprint.name, entry.isUnlocked)}
                    className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none overflow-hidden ${
                      !entry.isUnlocked
                        ? 'bg-slate-950/20 border-white/5 opacity-50 hover:bg-slate-950/40'
                        : isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Background tint for boss cards */}
                    {entry.isBoss && entry.isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                    )}

                    <div className="flex items-center gap-3.5 z-10">
                      {/* Enemy Glowing Micro-Orb / Lock */}
                      <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {entry.isUnlocked ? (
                          <>
                            {/* Glowing Core */}
                            <div 
                              className="absolute w-4 h-4 rounded-full animate-pulse"
                              style={{ 
                                backgroundColor: entry.stats.color,
                                boxShadow: `0 0 14px 6px ${entry.stats.glowColor || 'rgba(255,255,255,0.3)'}`
                              }}
                            />
                            {/* Inner graphic representing boss vs standard */}
                            {entry.isBoss ? (
                              <Crown className="w-4.5 h-4.5 text-amber-400 absolute opacity-70" />
                            ) : (
                              <Skull className="w-3.5 h-3.5 text-slate-400 absolute opacity-30" />
                            )}
                          </>
                        ) : (
                          <Lock className="w-4.5 h-4.5 text-slate-600" />
                        )}
                      </div>

                      {/* Info Text */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/5">
                            Z-{entry.level.toString().padStart(2, '0')}
                          </span>
                          {entry.isBoss && entry.isUnlocked && (
                            <span className="text-[9px] font-bold font-mono tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              BOSS
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold transition-colors ${
                          !entry.isUnlocked 
                            ? 'text-slate-500 font-mono tracking-wide' 
                            : isSelected 
                            ? 'text-emerald-400' 
                            : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {entry.isUnlocked ? entry.blueprint.name : 'Unknown Threat'}
                        </h4>
                      </div>
                    </div>

                    {/* Right action details / Locked text */}
                    <div className="text-right z-10 flex flex-col items-end">
                      {entry.isUnlocked ? (
                        <>
                          <span className="text-[10px] font-mono text-slate-400">
                            {entry.stats.behaviorType ? entry.stats.behaviorType.toUpperCase() : 'MELEE'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                            HP: {entry.stats.maxHealth}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] font-mono text-red-500/60 font-semibold tracking-wider">
                          LOCKED
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredEntries.length === 0 && (
              <div className="py-12 text-center text-slate-500 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                No matching telemetry logs found in this zone.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed View Panel */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950/50 border border-white/10 rounded-2xl overflow-y-auto p-5 relative min-h-[400px] max-h-[60vh] lg:max-h-full">
          {selectedEntry && selectedEntry.isUnlocked ? (
            <motion.div
              key={selectedEntry.blueprint.name}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Entry Header with Hologram Display */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                {/* Visual Hologram Scanner Screen */}
                <div className="relative w-28 h-28 rounded-2xl bg-slate-950 border border-emerald-500/20 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                  {/* Neon Grid Backing */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
                  
                  {/* Scanline Animation */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-500/50 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] animate-[bounce_3s_infinite]" />

                  {/* Dynamic Glowing Vector Orb representation */}
                  <div 
                    className="w-10 h-10 rounded-full animate-pulse transition-all"
                    style={{ 
                      backgroundColor: selectedEntry.stats.color,
                      transform: `scale(${Math.min(1.8, Math.max(0.9, selectedEntry.stats.sizeMultiplier || 1))})`,
                      boxShadow: `0 0 24px 10px ${selectedEntry.stats.glowColor || 'rgba(255,255,255,0.4)'}`
                    }}
                  />
                  
                  {/* Decorative Scan overlay */}
                  <div className="absolute bottom-1 right-1.5 text-[8px] font-mono text-slate-500 select-none">
                    X-SCALE: {selectedEntry.stats.sizeMultiplier}
                  </div>
                </div>

                {/* Main Stats Block */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-bold font-mono tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase">
                      {selectedEntry.stats.behaviorType || 'Melee Hostile'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md">
                      {selectedEntry.zoneName}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                    {selectedEntry.blueprint.name}
                  </h3>

                  <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-red-400 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Weakness: </span>
                    <span className="font-bold text-red-300 ml-0.5">{selectedEntry.stats.weakness || 'None Detected'}</span>
                  </div>
                </div>
              </div>

              {/* Grid of Core Combat Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1"><Skull className="w-4 h-4 text-rose-400" /></div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Vitality</div>
                  <div className="text-sm font-bold font-mono text-rose-300">{selectedEntry.stats.maxHealth}</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1"><Sword className="w-4 h-4 text-red-400" /></div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Damage</div>
                  <div className="text-sm font-bold font-mono text-red-300">{selectedEntry.stats.damage}</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1"><Zap className="w-4 h-4 text-cyan-400" /></div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Movement</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">{selectedEntry.stats.speed.toFixed(1)} m/s</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1"><Sparkles className="w-4 h-4 text-amber-400" /></div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Kill Value</div>
                  <div className="text-sm font-bold font-mono text-amber-300">{selectedEntry.stats.pointsValue} pts</div>
                </div>
              </div>

              {/* Lore / Intelligence Report */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Biomedical & Lore Dossier
                </h4>
                <p className="text-xs text-slate-300 font-serif leading-relaxed italic bg-white/5 p-4 rounded-xl border border-white/5">
                  "{selectedEntry.lore?.lore || 'No detailed tactical scan data is currently available in the directory databases.'}"
                </p>
              </div>

              {/* Combat Tips */}
              {selectedEntry.lore?.combatTips && selectedEntry.lore.combatTips.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-red-400" />
                    Tactical Combat Advice
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {selectedEntry.lore.combatTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed font-mono">
                        <span className="text-red-400 font-bold mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Loot Drop Rates Table */}
              {selectedEntry.lore?.drops && selectedEntry.lore.drops.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Detected Loot Drop Telemetry
                  </h4>
                  <div className="bg-slate-950/80 rounded-xl border border-white/5 overflow-hidden">
                    <div className="grid grid-cols-2 bg-white/5 px-4 py-2 text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-white/5">
                      <span>Item Core Module</span>
                      <span className="text-right">Drop Chance</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {selectedEntry.lore.drops.map((drop, idx) => (
                        <div key={idx} className="grid grid-cols-2 px-4 py-2.5 text-xs font-mono">
                          <span className={`font-semibold ${drop.rarityColor || 'text-slate-300'}`}>{drop.itemName}</span>
                          <span className="text-right text-emerald-400 font-bold">{drop.chance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono space-y-3">
              <Lock className="w-10 h-10 text-slate-700 animate-pulse" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Unmapped Target Signature</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                  Select an unlocked organism from the left log directory to view detailed biomedical lore, combat tactics, and drop telemetry.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
