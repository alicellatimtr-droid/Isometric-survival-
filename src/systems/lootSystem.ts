import { WeaponId } from '../types';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancient';

export interface RarityConfig {
  name: string;
  color: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  chance: number; // Drop chance
  statMultiplier: number;
}

export const RARITIES: Record<Rarity, RarityConfig> = {
  common: {
    name: 'Common',
    color: '#64748b',
    borderColor: 'border-slate-500',
    glowColor: 'shadow-slate-500/5',
    textColor: 'text-slate-400',
    chance: 0.50, // 50%
    statMultiplier: 1.0,
  },
  uncommon: {
    name: 'Uncommon',
    color: '#22c55e',
    borderColor: 'border-green-500',
    glowColor: 'shadow-green-500/10',
    textColor: 'text-green-400',
    chance: 0.25, // 25%
    statMultiplier: 1.25,
  },
  rare: {
    name: 'Rare',
    color: '#3b82f6',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/15',
    textColor: 'text-blue-400',
    chance: 0.15, // 15%
    statMultiplier: 1.6,
  },
  epic: {
    name: 'Epic',
    color: '#a855f7',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/20',
    textColor: 'text-purple-400',
    chance: 0.07, // 7%
    statMultiplier: 2.1,
  },
  legendary: {
    name: 'Legendary',
    color: '#f97316',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.35)]',
    textColor: 'text-orange-400 font-bold',
    chance: 0.02, // 2%
    statMultiplier: 2.8,
  },
  mythic: {
    name: 'Mythic',
    color: '#ef4444',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse',
    textColor: 'text-red-400 font-extrabold',
    chance: 0.008, // 0.8%
    statMultiplier: 3.8,
  },
  ancient: {
    name: 'Ancient',
    color: '#eab308',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/50 shadow-[0_0_25px_rgba(234,179,8,0.65)] animate-bounce-slow',
    textColor: 'text-yellow-400 font-black',
    chance: 0.002, // 0.2%
    statMultiplier: 5.0,
  }
};

export interface GameItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'material' | 'trophy';
  subType?: WeaponId | string; // e.g. 'sword', 'chest', etc.
  rarity: Rarity;
  levelReq: number;
  attack: number;
  defense: number;
  health: number;
  critChance: number; // e.g. 0.05 for 5%
  speedBonus: number; // e.g. 0.1 for +10% speed
  specialBonus: string;
  sellValue: number;
  buyPrice?: number;
  durability?: number;
  maxDurability?: number;
  icon: string;
  description: string;
  obtainedDate?: number;
}

// Preset weapons blueprints
export const WEAPON_PRESETS = [
  { name: 'Vanguard Laser Pistol', subType: 'pistol', icon: 'pistol', desc: 'Tactical energy sidearm.' },
  { name: 'Plasma Repeater Carbine', subType: 'plasma_rifle', icon: 'plasma_rifle', desc: 'Rapid ionized plasma emitter.' },
  { name: 'Vanguard Scattershot Shotgun', subType: 'shotgun', icon: 'shotgun', desc: 'High impact close-range scattershot.' },
  { name: 'Viper Micro-SMG', subType: 'submachine_gun', icon: 'submachine_gun', desc: 'Hyper-fast rate of fire SMG.' },
  { name: 'Hyperion Charged Sniper', subType: 'sniper_rifle', icon: 'sniper_rifle', desc: 'High pierce charged precision sniper.' },
  { name: 'Titan Rocket Launcher', subType: 'rocket_launcher', icon: 'rocket_launcher', desc: 'Heavy explosive missile launcher.' },
  { name: 'Inferno Pyrospray Flamethrower', subType: 'flamethrower', icon: 'flamethrower', desc: 'Melts packed clusters with high-velocity fire.' },
  { name: 'Quantum Beam Cannon', subType: 'laser_cannon', icon: 'laser_cannon', desc: 'Charged quantum light-pulse beam.' },
  { name: 'Cluster Bomber Launcher', subType: 'grenade_launcher', icon: 'grenade_launcher', desc: 'Launches heavy bouncing cluster grenades.' },
  { name: 'Tesla Static Carbine', subType: 'tesla_carbine', icon: 'tesla_carbine', desc: 'Fires high-voltage lightning jumping to nearby foes.' },
  { name: 'Void Singularity Staff', subType: 'void_staff', icon: 'void_staff', desc: 'Eldritch gravity-well vortex staff.' },
  { name: 'Pyroclastic Ember Staff', subType: 'fire_staff', icon: 'fire_staff', desc: 'Launches massive fireballs.' },
  { name: 'Glacial Frost Staff', subType: 'ice_staff', icon: 'ice_staff', desc: 'Staff emitting freezing glacial shards.' },
  { name: 'Zephyr Storm Staff', subType: 'wind_staff', icon: 'wind_staff', desc: 'Staff emitting piercing wind blades.' },
  { name: 'Temporal Chrono Staff', subType: 'chrono_repeater', icon: 'chrono_repeater', desc: 'Staff applying temporal chrono-decay.' }
];

// Preset armors blueprints
export const ARMOR_PRESETS = [
  { name: 'Scavenger Vest', icon: 'vest', desc: 'Reinforced leather vest patched with metal scrap.' },
  { name: 'Kevlar Tactical Suit', icon: 'suit', desc: 'Military-grade ballistic fiber that dampens impacts.' },
  { name: 'Titanium Chestplate', icon: 'chestplate', desc: 'Full-body armored plate forged in cryo-facilities.' },
  { name: 'Exosuit Harness', icon: 'harness', desc: 'Pneumatic power suit that boosts carrying strength and health.' },
  { name: 'Plasma Aegis Barrier', icon: 'barrier', desc: 'A solid plasma coat absorbing chemical and physical damage.' },
  { name: 'Ancient Paladin Plate', icon: 'plate', desc: 'Holy gilded relics providing ultimate kinetic defense.' }
];

// Preset accessories blueprints
export const ACCESSORY_PRESETS = [
  { name: 'Band of Fortitude', icon: 'ring', desc: 'A steel ring radiating standard life energy.' },
  { name: 'Hyper-Engine Core', icon: 'battery', desc: 'A micro-generator worn around neck, boosts critical chance.' },
  { name: 'Vampiric Eye Pendant', icon: 'eye', desc: 'A crystalline necklace absorbing life force from slaughters.' },
  { name: 'Ranger Quiver Loop', icon: 'loop', desc: 'Light straps increasing critical hit accuracy.' },
  { name: 'Giga-Shield Node', icon: 'node', desc: 'Energy field stabilizer node worn as a badge.' },
  { name: 'Dragon Eye Amulet', icon: 'amulet', desc: 'A heavy gold chain holding a glowing ancient dragon scale.' }
];

// Boss trophies blueprints
export const TROPHY_PRESETS: Record<string, { name: string; icon: string; desc: string }> = {
  goliath: { name: 'Goliath Spitter Horn', icon: 'horn', desc: 'Carved horn of the mutated Goliath. Drops in Level 1 Overgrown Ruins.' },
  lich: { name: 'Lich Necromancer Crown', icon: 'crown', desc: 'Tattered metal crown filled with dark souls. Drops in Level 2 Obsidian Crypts.' },
  frostlord: { name: 'Frostlord Archon Core', icon: 'core', desc: 'Frozen crystal core that never melts. Drops in Level 3 Cryo Glaciers.' },
  abomination: { name: 'Acidic Heart Chamber', icon: 'heart_chamber', desc: 'A biological sac pumping radioactive acid. Drops in Level 4 Toxic Refineries.' },
  sentinel: { name: 'Cyber Sentinel Processor', icon: 'processor', desc: 'Quantum microprocessor from the boss mainframe. Drops in Level 5 Plasma Core.' },
  dragon: { name: 'Ancient Dragon Scale', icon: 'scale', desc: 'Immutable scale of the Guardian Dragon. Drops in Level 6 Ancient Sanctum.' }
};

// Rare Crafting Materials
export const MATERIAL_PRESETS = [
  { name: 'Carbon Fiber Strands', icon: 'strand', desc: 'High-tensile material used to craft epic weapons.' },
  { name: 'Depleted Plasma Battery', icon: 'battery', desc: 'Highly reactive material. Needed for energy gear.' },
  { name: 'Cryo-Glow Shard', icon: 'shard', desc: 'Subzero crystal glowing with clean blue light.' },
  { name: 'Lich Soul Essence', icon: 'essence', desc: 'Spiritual matter extracted from the undead.' },
  { name: 'Dragon Fire Powder', icon: 'powder', desc: 'Superheated catalyst capable of smelting ancient weapons.' }
];

// Draw a weighted rarity
export function drawRarity(): Rarity {
  const rand = Math.random();
  let cumulative = 0;
  
  // Sort rarities lowest to highest chance or simply check standard weighted
  const list: { rarity: Rarity; chance: number }[] = [
    { rarity: 'ancient', chance: 0.002 },
    { rarity: 'mythic', chance: 0.008 },
    { rarity: 'legendary', chance: 0.02 },
    { rarity: 'epic', chance: 0.07 },
    { rarity: 'rare', chance: 0.15 },
    { rarity: 'uncommon', chance: 0.25 },
    { rarity: 'common', chance: 0.50 }
  ];

  for (const item of list) {
    cumulative += item.chance;
    if (rand <= cumulative) {
      return item.rarity;
    }
  }
  return 'common';
}

// Generate an item based on level and slot
export function generateLootItem(
  type: 'weapon' | 'armor' | 'accessory' | 'material' | 'trophy',
  level: number,
  bossId?: string
): GameItem {
  const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const rarity = drawRarity();
  const config = RARITIES[rarity];
  
  let name = '';
  let icon = '📦';
  let description = '';
  let subType = '';
  
  let attack = 0;
  let defense = 0;
  let health = 0;
  let critChance = 0;
  let speedBonus = 0;
  let specialBonus = '';
  let sellValue = 10;

  if (type === 'trophy' && bossId) {
    const blueprint = TROPHY_PRESETS[bossId] || { name: 'Unknown Boss Trophy', icon: '🏆', desc: 'Defeated a dungeon boss.' };
    name = blueprint.name;
    icon = blueprint.icon;
    description = blueprint.desc;
    sellValue = 250;
    return {
      id,
      name,
      type: 'trophy',
      rarity: 'ancient', // Boss trophies are always ancient!
      levelReq: level,
      attack: 0,
      defense: 5,
      health: 25,
      critChance: 0.02,
      speedBonus: 0,
      specialBonus: '🏆 Boss Slayer Passives Active!',
      sellValue,
      icon,
      description
    };
  }

  if (type === 'material') {
    const blueprint = MATERIAL_PRESETS[Math.floor(Math.random() * MATERIAL_PRESETS.length)];
    return {
      id,
      name: blueprint.name,
      type: 'material',
      rarity: rarity === 'common' ? 'uncommon' : rarity, // materials are cooler
      levelReq: 1,
      attack: 0,
      defense: 0,
      health: 0,
      critChance: 0,
      speedBonus: 0,
      specialBonus: 'Crafting Component',
      sellValue: 20 * config.statMultiplier,
      icon: blueprint.icon,
      description: blueprint.desc
    };
  }

  // Draw weapons, armor, accessories
  if (type === 'weapon') {
    const blueprint = WEAPON_PRESETS[Math.floor(Math.random() * WEAPON_PRESETS.length)];
    subType = blueprint.subType;
    icon = blueprint.icon;
    
    // Base damage scales with level and rarity
    const baseDmg = 10 + level * 6;
    attack = Math.round(baseDmg * config.statMultiplier);
    critChance = parseFloat((0.02 + Math.random() * 0.08 * config.statMultiplier).toFixed(3));
    speedBonus = parseFloat((Math.random() * 0.05 * config.statMultiplier).toFixed(3));
    
    name = `[${config.name}] ${blueprint.name}`;
    description = blueprint.desc;
    
    if (rarity === 'ancient') specialBonus = '15% Chance to Burn on Hit';
    else if (rarity === 'mythic') specialBonus = '+10% Poison Damage';
    else if (rarity === 'legendary') specialBonus = '+10% Faster Attack Cooldowns';
    else if (rarity === 'epic') specialBonus = '+5% Lifesteal';
    else if (rarity === 'rare') specialBonus = 'Critical Hits deal +20% Damage';
    else specialBonus = 'Standard combat weapon';
    
    sellValue = Math.round(30 * level * config.statMultiplier);
  } else if (type === 'armor') {
    const blueprint = ARMOR_PRESETS[Math.floor(Math.random() * ARMOR_PRESETS.length)];
    icon = blueprint.icon;
    
    const baseDef = 2 + level * 2;
    defense = Math.round(baseDef * config.statMultiplier);
    
    const baseHp = 15 + level * 10;
    health = Math.round(baseHp * config.statMultiplier);
    
    name = `[${config.name}] ${blueprint.name}`;
    description = blueprint.desc;
    
    if (rarity === 'ancient') specialBonus = '+15% Flat Damage Reflection';
    else if (rarity === 'mythic') specialBonus = 'Regens 1.5 HP/sec when stationary';
    else if (rarity === 'legendary') specialBonus = 'Shield blocks initial projectile damage';
    else if (rarity === 'epic') specialBonus = '+8% Movement Speed';
    else if (rarity === 'rare') specialBonus = '+15 Max Health';
    else specialBonus = 'Provides flat kinetic armor';

    sellValue = Math.round(25 * level * config.statMultiplier);
  } else {
    const blueprint = ACCESSORY_PRESETS[Math.floor(Math.random() * ACCESSORY_PRESETS.length)];
    icon = blueprint.icon;
    
    health = Math.round((5 + level * 4) * config.statMultiplier);
    critChance = parseFloat((0.01 + Math.random() * 0.06 * config.statMultiplier).toFixed(3));
    speedBonus = parseFloat((0.02 + Math.random() * 0.04 * config.statMultiplier).toFixed(3));
    
    name = `[${config.name}] ${blueprint.name}`;
    description = blueprint.desc;
    
    if (rarity === 'ancient') specialBonus = 'Double damage of deployables';
    else if (rarity === 'mythic') specialBonus = 'Half dash cooldown time';
    else if (rarity === 'legendary') specialBonus = '+100% item draw range';
    else if (rarity === 'epic') specialBonus = 'x2 XP gain rate';
    else specialBonus = 'Provides helpful micro passive boosts';
    
    sellValue = Math.round(20 * level * config.statMultiplier);
  }

  return {
    id,
    name,
    type,
    subType,
    rarity,
    levelReq: level,
    attack,
    defense,
    health,
    critChance,
    speedBonus,
    specialBonus,
    sellValue,
    icon,
    description,
    obtainedDate: Date.now()
  };
}

// Generate Boss Drops! Always returns 3-5 items including boss trophies, crafting items, weapons/armor, with weighted RNG.
export function generateBossLootTable(bossId: 'goliath' | 'lich' | 'frostlord' | 'abomination' | 'sentinel' | 'dragon', level: number): GameItem[] {
  const drops: GameItem[] = [];
  
  // 1. Definite Trophy drop
  drops.push(generateLootItem('trophy', level, bossId));
  
  // 2. High-value materials
  const matCount = 1 + Math.floor(Math.random() * 2); // 1-2 crafting materials
  for (let i = 0; i < matCount; i++) {
    drops.push(generateLootItem('material', level));
  }
  
  // 3. Equipment drops (Weapons / Armor / Accessories)
  const eqCount = 2 + Math.floor(Math.random() * 2); // 2-3 pieces of equipment
  const types: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory'];
  
  for (let i = 0; i < eqCount; i++) {
    const rType = types[Math.floor(Math.random() * types.length)];
    drops.push(generateLootItem(rType, level));
  }
  
  return drops;
}
