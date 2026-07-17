export type ResourceType = 'wood' | 'metal' | 'gem';

export interface ResourceCount {
  wood: number;
  metal: number;
  gem: number;
}

export type WeaponId = 'pistol' | 'plasma_rifle' | 'shotgun' | 'submachine_gun' | 'sniper_rifle' | 'rocket_launcher' | 'flamethrower' | 'laser_cannon' | 'grenade_launcher' | 'tesla_carbine' | 'void_staff' | 'fire_staff' | 'ice_staff' | 'wind_staff' | 'chrono_repeater';

export interface Weapon {
  id: WeaponId;
  name: string;
  damage: number;
  range: number; // grid units
  attackSpeed: number; // attacks per second
  armorBonus: number;
  speedBonus: number;
  description: string;
  isRanged: boolean;
  color: string;
  glowColor: string;
  recipe: ResourceCount;
}

export type ZombieType = 'basic' | 'fast' | 'tank' | 'spitter' | 'boss_goliath' | 'boss_necromancer' | 'boss_frostlord' | 'boss_abomination' | 'boss_cyber_overlord';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon_mod' | 'armor_plate' | 'speed_booster' | 'relic';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  statBonus: {
    damage?: number;
    armor?: number;
    speed?: number;
  };
  icon: string;
  description: string;
}

export interface Character {
  x: number; // grid coords
  y: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  xp: number;
  nextLevelXp: number;
  level: number;
  speed: number;
  baseDamage: number;
  armor: number; // percentage reduction or flat reduction
  facingAngle: number; // radians
  activeWeapon: WeaponId;
  inventory: ResourceCount;
  craftedWeapons: WeaponId[];
  potionsCount: number;
  items: any[];
  equippedItemIds: string[];
  damageFlash?: number;
  dashTimer?: number;
  dashCooldown?: number;
  comboCount?: number;
  comboTimer?: number;
  spikeTrapsCount?: number;
  teslaTurretsCount?: number;
  hasCompanionDrone?: boolean;
  upgrades?: Record<string, number>;
  dodgeChance?: number;
  critChance?: number;
  critDamageMultiplier?: number;
  luckMultiplier?: number;
  coinMultiplier?: number;
  xpMultiplier?: number;
  healthRegen?: number;
  attackSpeedMultiplier?: number;
}

export interface Enemy {
  id: string;
  type: ZombieType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  glowColor: string;
  isBoss: boolean;
  state: 'idle' | 'chase' | 'attack' | 'spit_cooldown' | 'boss_special';
  stateTimer: number;
  attackCooldown: number;
  facingAngle: number;
  pointsValue: number;
  name: string;
  sizeMultiplier: number;
  damageFlash?: number;
  slowTimer?: number;
  decayTimer?: number;
  decayDamagePerSec?: number;
  pushbackVX?: number;
  pushbackVY?: number;
  pushbackTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayerOwned: boolean;
  color: string;
  glowColor: string;
  radius: number;
  life: number; // ticks or distance
  maxLife: number;
  pierceRemaining?: number;
  specialEffect?: 'freeze' | 'fire' | 'tesla' | 'void' | 'chrono' | 'wind' | 'rocket' | 'grenade' | 'smg';
  enemiesHit?: string[];
}

export interface ResourceNode {
  id: string;
  type: ResourceType | 'chest';
  x: number;
  y: number;
  amount: number;
  health: number;
  maxHealth: number;
  respawnTimer: number;
}

export interface GroundItem {
  id: string;
  type: ResourceType | 'xp' | 'potion' | 'loot_item' | 'weapon' | 'powerup_double_damage' | 'powerup_hyper_speed' | 'powerup_force_shield' | 'powerup_magnet';
  x: number;
  y: number;
  amount: number;
  color: string;
  glowColor: string;
  pulseTimer: number;
  lootItem?: InventoryItem;
  weaponId?: WeaponId;
}

export interface GameState {
  currentWave: number;
  zombiesKilled: number;
  score: number;
  gameStatus: 'menu' | 'playing' | 'gameover' | 'victory' | 'wave_clear' | 'paused';
  waveTimer: number;
  waveActive: boolean;
  level: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface TextPop {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Deployable {
  id: string;
  type: 'spike_trap' | 'tesla_turret';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attackCooldown: number;
}
