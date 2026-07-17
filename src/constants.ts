import { Weapon, ZombieType, InventoryItem } from './types';

export const ISO_TILE_WIDTH = 64;
export const ISO_TILE_HEIGHT = 32;
export const GRID_SIZE = 48; // 48x48 tiles map (significantly larger area)

export const WEAPONS: Record<string, Weapon> = {
  pistol: {
    id: 'pistol',
    name: 'Tactical Laser Pistol',
    damage: 12,
    range: 7.0,
    attackSpeed: 2.2,
    armorBonus: 0,
    speedBonus: 0.15,
    description: 'A swift starting weapon. Fires concentrated light pulses with high accuracy.',
    isRanged: true,
    color: '#9ca3af',
    glowColor: 'rgba(209, 213, 219, 0.4)',
    recipe: { wood: 0, metal: 0, gem: 0 },
  },
  plasma_rifle: {
    id: 'plasma_rifle',
    name: 'Plasma Repeater',
    damage: 18,
    range: 7.5,
    attackSpeed: 3.5,
    armorBonus: 0,
    speedBonus: 0.05,
    description: 'Rapid fire plasma emitter. Emits tight bursts of high-velocity ionized plasma.',
    isRanged: true,
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.6)',
    recipe: { wood: 5, metal: 10, gem: 0 },
  },
  shotgun: {
    id: 'shotgun',
    name: 'Vanguard Scattershot',
    damage: 26,
    range: 5.0,
    attackSpeed: 1.0,
    armorBonus: 2,
    speedBonus: -0.05,
    description: 'Fires a 3-bullet spread with high pushback and massive close-range devastation.',
    isRanged: true,
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    recipe: { wood: 8, metal: 12, gem: 0 },
  },
  submachine_gun: {
    id: 'submachine_gun',
    name: 'Viper Micro-SMG',
    damage: 10,
    range: 6.5,
    attackSpeed: 5.5,
    armorBonus: 0,
    speedBonus: 0.1,
    description: 'Hyper-fast rate of fire with light spread. Excellent for sweeping tight crowds.',
    isRanged: true,
    color: '#a3e635',
    glowColor: 'rgba(163, 230, 53, 0.5)',
    recipe: { wood: 10, metal: 8, gem: 1 },
  },
  sniper_rifle: {
    id: 'sniper_rifle',
    name: 'Hyperion Charged Sniper',
    damage: 85,
    range: 11.0,
    attackSpeed: 0.7,
    armorBonus: 0,
    speedBonus: -0.1,
    description: 'Heavy charged sniper. High pierce and range, instantly disintegrating standard foes.',
    isRanged: true,
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.8)',
    recipe: { wood: 12, metal: 20, gem: 2 },
  },
  rocket_launcher: {
    id: 'rocket_launcher',
    name: 'Titan Rocket Launcher',
    damage: 95,
    range: 8.0,
    attackSpeed: 0.6,
    armorBonus: 1,
    speedBonus: -0.15,
    description: 'Fires explosive heavy rockets that detonate on impact, dealing splash damage.',
    isRanged: true,
    color: '#f87171',
    glowColor: 'rgba(248, 113, 113, 0.7)',
    recipe: { wood: 15, metal: 25, gem: 4 },
  },
  flamethrower: {
    id: 'flamethrower',
    name: 'Inferno Pyrospray',
    damage: 6,
    range: 4.2,
    attackSpeed: 8.0,
    armorBonus: 0,
    speedBonus: 0.05,
    description: 'Emits a scorching stream of fire particles. Melts packed zombie clusters.',
    isRanged: true,
    color: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.7)',
    recipe: { wood: 14, metal: 18, gem: 2 },
  },
  laser_cannon: {
    id: 'laser_cannon',
    name: 'Quantum Beam Cannon',
    damage: 38,
    range: 8.5,
    attackSpeed: 1.8,
    armorBonus: 0,
    speedBonus: 0.02,
    description: 'Charged quantum weapon. Fires concentrated light pulses at blistering speed.',
    isRanged: true,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    recipe: { wood: 12, metal: 15, gem: 3 },
  },
  grenade_launcher: {
    id: 'grenade_launcher',
    name: 'Cluster Bomber Mk-I',
    damage: 65,
    range: 7.0,
    attackSpeed: 0.8,
    armorBonus: 0,
    speedBonus: -0.05,
    description: 'Launches heavy bouncing grenades that detonate into secondary micro-explosions.',
    isRanged: true,
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    recipe: { wood: 18, metal: 15, gem: 3 },
  },
  tesla_carbine: {
    id: 'tesla_carbine',
    name: 'Tesla Static Carbine',
    damage: 30,
    range: 7.2,
    attackSpeed: 1.5,
    armorBonus: 0,
    speedBonus: 0.08,
    description: 'Fires high-voltage lightning bolts that jump to hit 2 additional nearby targets.',
    isRanged: true,
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.7)',
    recipe: { wood: 15, metal: 22, gem: 5 },
  },
  void_staff: {
    id: 'void_staff',
    name: 'Void Singularity Staff',
    damage: 52,
    range: 8.0,
    attackSpeed: 1.2,
    armorBonus: 3,
    speedBonus: 0.05,
    description: 'Mystical eldritch relic. Fires gravity-well vortex orbs that pull in and damage foes.',
    isRanged: true,
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.8)',
    recipe: { wood: 20, metal: 10, gem: 5 },
  },
  fire_staff: {
    id: 'fire_staff',
    name: 'Pyroclastic Ember Staff',
    damage: 68,
    range: 7.8,
    attackSpeed: 1.1,
    armorBonus: 0,
    speedBonus: 0.0,
    description: 'Ancient sage staff. Launches massive fireballs that detonate in a medium radius.',
    isRanged: true,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    recipe: { wood: 22, metal: 12, gem: 6 },
  },
  ice_staff: {
    id: 'ice_staff',
    name: 'Glacial Frost Staff',
    damage: 35,
    range: 7.5,
    attackSpeed: 1.4,
    armorBonus: 4,
    speedBonus: 0.05,
    description: 'Fires piercing frost shards that damage and freeze/slow enemy speed by 50% for 2s.',
    isRanged: true,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.8)',
    recipe: { wood: 25, metal: 8, gem: 5 },
  },
  wind_staff: {
    id: 'wind_staff',
    name: 'Zephyr Storm Staff',
    damage: 42,
    range: 8.2,
    attackSpeed: 1.6,
    armorBonus: 0,
    speedBonus: 0.12,
    description: 'Fires crescent wind blades that pierce all enemies and push them backwards.',
    isRanged: true,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.8)',
    recipe: { wood: 20, metal: 15, gem: 4 },
  },
  chrono_repeater: {
    id: 'chrono_repeater',
    name: 'Temporal Chrono Staff',
    damage: 48,
    range: 9.0,
    attackSpeed: 2.0,
    armorBonus: 2,
    speedBonus: 0.1,
    description: 'Accelerates time. Fires ticking chrono-orbs that apply a damage-over-time decay.',
    isRanged: true,
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.8)',
    recipe: { wood: 30, metal: 25, gem: 10 },
  },
};

export interface ZombieBlueprint {
  type: ZombieType;
  name: string;
  maxHealth: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  glowColor: string;
  pointsValue: number;
  sizeMultiplier: number;
}

export const ZOMBIES: Record<ZombieType, ZombieBlueprint> = {
  basic: {
    type: 'basic',
    name: 'Zombie Grunt',
    maxHealth: 30,
    speed: 1.2,
    damage: 8,
    radius: 0.35,
    color: '#4ade80', // green
    glowColor: 'rgba(74, 222, 128, 0.2)',
    pointsValue: 10,
    sizeMultiplier: 1.0,
  },
  fast: {
    type: 'fast',
    name: 'Feral Sprinter',
    maxHealth: 18,
    speed: 2.4,
    damage: 5,
    radius: 0.3,
    color: '#a3e635', // bright lime
    glowColor: 'rgba(163, 230, 53, 0.4)',
    pointsValue: 15,
    sizeMultiplier: 0.9,
  },
  tank: {
    type: 'tank',
    name: 'Rotting Behemoth',
    maxHealth: 120,
    speed: 0.7,
    damage: 25,
    radius: 0.55,
    color: '#ef4444', // heavy red
    glowColor: 'rgba(239, 68, 68, 0.3)',
    pointsValue: 35,
    sizeMultiplier: 1.5,
  },
  spitter: {
    type: 'spitter',
    name: 'Toxic Spitter',
    maxHealth: 25,
    speed: 1.4,
    damage: 12,
    radius: 0.35,
    color: '#c084fc', // purple
    glowColor: 'rgba(192, 132, 252, 0.3)',
    pointsValue: 25,
    sizeMultiplier: 1.0,
  },
  boss_goliath: {
    type: 'boss_goliath',
    name: 'Goliath Spitter (BOSS)',
    maxHealth: 500,
    speed: 0.9,
    damage: 35,
    radius: 1.0,
    color: '#fb923c', // orange
    glowColor: 'rgba(251, 146, 60, 0.7)',
    pointsValue: 250,
    sizeMultiplier: 2.2,
  },
  boss_necromancer: {
    type: 'boss_necromancer',
    name: 'Necromancer Lich (BOSS)',
    maxHealth: 800,
    speed: 1.1,
    damage: 45,
    radius: 0.9,
    color: '#f472b6', // pink
    glowColor: 'rgba(244, 114, 182, 0.8)',
    pointsValue: 500,
    sizeMultiplier: 2.0,
  },
  boss_frostlord: {
    type: 'boss_frostlord',
    name: 'Frostlord Archon (BOSS)',
    maxHealth: 1100,
    speed: 0.95,
    damage: 55,
    radius: 1.1,
    color: '#06b6d4', // cyan
    glowColor: 'rgba(34, 211, 238, 0.8)',
    pointsValue: 750,
    sizeMultiplier: 2.3,
  },
  boss_abomination: {
    type: 'boss_abomination',
    name: 'Acidic Abomination (BOSS)',
    maxHealth: 1500,
    speed: 0.85,
    damage: 65,
    radius: 1.25,
    color: '#10b981', // green
    glowColor: 'rgba(16, 185, 129, 0.8)',
    pointsValue: 1000,
    sizeMultiplier: 2.5,
  },
  boss_cyber_overlord: {
    type: 'boss_cyber_overlord',
    name: 'Cyber Sentinel (BOSS)',
    maxHealth: 2200,
    speed: 1.05,
    damage: 80,
    radius: 1.3,
    color: '#a855f7', // purple-magenta
    glowColor: 'rgba(168, 85, 247, 0.9)',
    pointsValue: 2000,
    sizeMultiplier: 2.7,
  },
};

export const LEVEL_THEMES = [
  {
    level: 1,
    name: 'Overgrown Ruins',
    groundColor: '#1e3025', // Brighter moss forest underlay
    gridLineColor: 'rgba(74, 222, 128, 0.05)',
    fogColor: 'rgba(12, 22, 16, 0.35)', // Vibrant, clear environment with soft ambient fog
    description: 'An abandoned forest sanctuary. Scrape wood and scrap metal. Beware the Goliath Spitter at wave 5!',
  },
  {
    level: 2,
    name: 'Obsidian Crypts',
    groundColor: '#32253f', // Brighter gothic violet-slate underlay
    gridLineColor: 'rgba(192, 132, 252, 0.05)',
    fogColor: 'rgba(20, 15, 28, 0.35)', // Warm volcanic atmosphere with clear visibility
    description: 'A subterranean lava tomb. Plentiful iron nodes, but faster zombies. The Lich Necromancer awaits at wave 10!',
  },
  {
    level: 3,
    name: 'Cryo Glaciers',
    groundColor: '#162e3d', // Frosty deep cyan-blue underlay
    gridLineColor: 'rgba(34, 211, 238, 0.06)',
    fogColor: 'rgba(8, 20, 32, 0.35)',
    description: 'A freezing cryo-facility. Gather precious gems, but watch out for deep frost-burn zones. Defeat the Frostlord Archon!',
  },
  {
    level: 4,
    name: 'Toxic Refineries',
    groundColor: '#142c1f', // Dark chemical muck underlay
    gridLineColor: 'rgba(16, 185, 129, 0.06)',
    fogColor: 'rgba(6, 18, 12, 0.4)',
    description: 'A hazardous radioactive wasteland. Beware of caustic green acid pools! Eradicate the massive Acidic Abomination!',
  },
  {
    level: 5,
    name: 'Plasma Core',
    groundColor: '#2b1236', // Neon hyper-violet alien hive underlay
    gridLineColor: 'rgba(236, 72, 153, 0.07)',
    fogColor: 'rgba(18, 6, 24, 0.45)',
    description: 'The epicenter of the outbreak. Swarming with elite mutated horrors. Defeat the legendary Cyber Sentinel!',
  },
  {
    level: 6,
    name: 'Ancient Sanctum',
    groundColor: '#121c24', // Primordial solid obsidian-deep core underlay
    gridLineColor: 'rgba(234, 179, 8, 0.08)',
    fogColor: 'rgba(8, 12, 18, 0.45)',
    description: 'The primordial heart of power. Swarming with flying Fire Drakes and Gilded Guardians. Face the colossal Sanctum Dragon!',
  },
  {
    level: 7,
    name: 'Sub-Zero Core',
    groundColor: '#0a1d37', // Subzero dark blue ice
    gridLineColor: 'rgba(0, 191, 255, 0.08)',
    fogColor: 'rgba(4, 12, 28, 0.4)',
    description: 'Deep below the frozen glaciers lies the frozen reactor. Beware the Frost Monarch Titan at wave 10!',
  },
  {
    level: 8,
    name: 'Gilded Vaults',
    groundColor: '#362a10', // Deep metallic gold
    gridLineColor: 'rgba(234, 179, 8, 0.1)',
    fogColor: 'rgba(22, 15, 6, 0.35)',
    description: 'The ancient treasury vaults of a forgotten civilization. Defeat the Gilded Pharaoh Wraith!',
  },
  {
    level: 9,
    name: 'Deep Void Abyss',
    groundColor: '#0c0714', // Void deep violet-black
    gridLineColor: 'rgba(138, 43, 226, 0.08)',
    fogColor: 'rgba(6, 3, 10, 0.5)',
    description: 'A pocket dimension devoid of matter. Gravity is unstable. Eradicate the Herald of Void!',
  },
  {
    level: 10,
    name: 'Volcanic Fissures',
    groundColor: '#300f0c', // Fiery glowing lava deep
    gridLineColor: 'rgba(255, 69, 0, 0.08)',
    fogColor: 'rgba(20, 6, 5, 0.4)',
    description: 'The roots of the volcano. Avoid magma pools! Face the Infernus Magma Lord at wave 10!',
  },
  {
    level: 11,
    name: 'Cyber Graveyard',
    groundColor: '#1c1d1f', // Rusty tech silver-gray
    gridLineColor: 'rgba(128, 128, 128, 0.08)',
    fogColor: 'rgba(10, 11, 12, 0.45)',
    description: 'Decommissioned battle bots have awakened under a rogue virus. Defeat the A.I. Mecha Dreadnought!',
  },
  {
    level: 12,
    name: 'Shadow Realm',
    groundColor: '#110a18', // Eldritch shadow indigo
    gridLineColor: 'rgba(111, 66, 193, 0.08)',
    fogColor: 'rgba(5, 3, 8, 0.5)',
    description: 'The dimension of eternal nightmare. Shadows materialize into monsters. Vanquish the Shoggoth Horror!',
  },
  {
    level: 13,
    name: 'Storm Peaks',
    groundColor: '#0f1a2e', // Lightning dark navy
    gridLineColor: 'rgba(0, 255, 255, 0.1)',
    fogColor: 'rgba(4, 8, 16, 0.4)',
    description: 'Shattered mountaintops where lightning strikes endlessly. Eradicate the legendary Valkyrie Archon!',
  },
  {
    level: 14,
    name: 'Dread Swamps',
    groundColor: '#151e18', // Poisonous moss green
    gridLineColor: 'rgba(40, 167, 69, 0.08)',
    fogColor: 'rgba(8, 12, 9, 0.48)',
    description: 'A decaying marshland filled with swamp gases. Destroy the Hydra Swamp Terror!',
  },
  {
    level: 15,
    name: 'Chrono Nexus',
    groundColor: '#1f162b', // Clockwork dark purple
    gridLineColor: 'rgba(156, 39, 176, 0.08)',
    fogColor: 'rgba(12, 8, 18, 0.45)',
    description: 'A temporal nexus where past, present, and future collide. Defeat the Chrono Architect!',
  },
  {
    level: 16,
    name: 'Hyperion Citadel',
    groundColor: '#0b162c', // Outer space celestial cobalt
    gridLineColor: 'rgba(255, 215, 0, 0.12)',
    fogColor: 'rgba(3, 6, 14, 0.5)',
    description: 'The ultimate cosmic citadel at the edge of reality. Defeat the supreme Cosmic Creator Deity!',
  },
];

export const LOOT_TEMPLATES = [
  {
    name: 'Overclocked Capacitor',
    type: 'weapon_mod' as const,
    rarity: 'rare' as const,
    statBonus: { damage: 5 },
    icon: 'capacitor',
    description: 'An advanced capacitor that increases melee and ranged damage.'
  },
  {
    name: 'Reinforced Kevlar Plate',
    type: 'armor_plate' as const,
    rarity: 'common' as const,
    statBonus: { armor: 2 },
    icon: 'plate',
    description: 'A light steel plating providing extra armor protection.'
  },
  {
    name: 'Nano-Tech Thruster',
    type: 'speed_booster' as const,
    rarity: 'epic' as const,
    statBonus: { speed: 0.15 },
    icon: 'thruster',
    description: 'Cybernetic rocket boosters that increase movement speed.'
  },
  {
    name: 'Titanium Exoskeleton',
    type: 'armor_plate' as const,
    rarity: 'legendary' as const,
    statBonus: { armor: 6, damage: 4 },
    icon: 'exoskeleton',
    description: 'A legendary robotic skeleton frame providing armor and damage.'
  },
  {
    name: 'Vampiric Crystal Core',
    type: 'relic' as const,
    rarity: 'legendary' as const,
    statBonus: { damage: 10, speed: 0.10 },
    icon: 'crystal_core',
    description: 'A dark glowing power cell increasing damage and movement speed.'
  },
  {
    name: 'Slayer Module',
    type: 'weapon_mod' as const,
    rarity: 'rare' as const,
    statBonus: { damage: 6 },
    icon: 'slayer_module',
    description: 'Increases kinetic impact, boosting overall damage output.'
  },
  {
    name: 'Carbon-Fiber Boots',
    type: 'speed_booster' as const,
    rarity: 'common' as const,
    statBonus: { speed: 0.08 },
    icon: 'boots',
    description: 'Lightweight tactical boots providing extra movement speed.'
  },
  {
    name: 'Deflection Matrix',
    type: 'relic' as const,
    rarity: 'epic' as const,
    statBonus: { armor: 4 },
    icon: 'deflection_matrix',
    description: 'Creates a localized energy barrier that increases Armor.'
  }
];

export function generateRandomLootItem(isBoss = false): InventoryItem {
  const rarities: ('common' | 'rare' | 'epic' | 'legendary')[] = isBoss
    ? ['rare', 'epic', 'legendary']
    : ['common', 'common', 'common', 'rare', 'rare', 'epic'];
  const rarity = rarities[Math.floor(Math.random() * rarities.length)];

  const templates = LOOT_TEMPLATES.filter(t => isBoss ? true : t.rarity === rarity || (rarity === 'common' && t.rarity === 'common'));
  const template = templates.length > 0 
    ? templates[Math.floor(Math.random() * templates.length)]
    : LOOT_TEMPLATES[Math.floor(Math.random() * LOOT_TEMPLATES.length)];

  const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  let multiplier = 1;
  if (rarity === 'rare') multiplier = 1.3;
  if (rarity === 'epic') multiplier = 1.8;
  if (rarity === 'legendary') multiplier = 2.5;

  const statBonus: { damage?: number; armor?: number; speed?: number } = {};
  if (template.statBonus.damage) statBonus.damage = Math.round(template.statBonus.damage * multiplier);
  if (template.statBonus.armor) statBonus.armor = Math.round(template.statBonus.armor * multiplier);
  if (template.statBonus.speed) statBonus.speed = parseFloat((template.statBonus.speed * multiplier).toFixed(2));

  return {
    id,
    name: `${template.name} ${rarity === 'legendary' ? '★' : rarity === 'epic' ? '✦' : ''}`,
    type: template.type as any,
    rarity,
    statBonus,
    icon: template.icon,
    description: template.description
  };
}
