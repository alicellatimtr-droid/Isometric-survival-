export interface PlayerUpgrades {
  maxHealth: number;       // Level of upgrade (0 to max)
  attackDamage: number;
  defense: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number;
  movementSpeed: number;
  dodgeChance: number;
  healthRegen: number;
  luck: number;
  coinMultiplier: number;
  xpMultiplier: number;
}

export interface UpgradeConfig {
  id: keyof PlayerUpgrades;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  statPerLevel: number;
  displayType: 'flat' | 'percent';
}

export const UPGRADE_LIST: UpgradeConfig[] = [
  {
    id: 'maxHealth',
    name: 'Fortitude (Max HP)',
    description: 'Increases maximum health pool to survive longer in hazardous operations.',
    icon: 'health',
    maxLevel: 10,
    baseCost: 200,
    costMultiplier: 1.4,
    statPerLevel: 15,
    displayType: 'flat'
  },
  {
    id: 'attackDamage',
    name: 'Overcharge (Atk Damage)',
    description: 'Increases raw damage output of all equipped weaponry.',
    icon: 'damage',
    maxLevel: 10,
    baseCost: 250,
    costMultiplier: 1.45,
    statPerLevel: 4,
    displayType: 'flat'
  },
  {
    id: 'defense',
    name: 'Hardened Armor (Defense)',
    description: 'Provides flat armor plating to absorb incoming physical attacks.',
    icon: 'defense',
    maxLevel: 10,
    baseCost: 200,
    costMultiplier: 1.4,
    statPerLevel: 2,
    displayType: 'flat'
  },
  {
    id: 'critChance',
    name: 'Precision Sight (Crit Chance)',
    description: 'Increases probability of landing devastating critical strikes.',
    icon: 'crit_chance',
    maxLevel: 10,
    baseCost: 300,
    costMultiplier: 1.5,
    statPerLevel: 0.02, // +2% per level
    displayType: 'percent'
  },
  {
    id: 'critDamage',
    name: 'Vicious Force (Crit Damage)',
    description: 'Amplifies damage dealt by critical strikes.',
    icon: 'crit_damage',
    maxLevel: 10,
    baseCost: 300,
    costMultiplier: 1.5,
    statPerLevel: 0.10, // +10% per level
    displayType: 'percent'
  },
  {
    id: 'attackSpeed',
    name: 'Reflex Sync (Attack Speed)',
    description: 'Decreases reload/recoil cooldown allowing faster attacks.',
    icon: 'attack_speed',
    maxLevel: 10,
    baseCost: 350,
    costMultiplier: 1.5,
    statPerLevel: 0.03, // +3% per level
    displayType: 'percent'
  },
  {
    id: 'movementSpeed',
    name: 'Kinetic Thrusters',
    description: 'Increases hero tactical traversal and dash speeds.',
    icon: 'speed',
    maxLevel: 5,
    baseCost: 400,
    costMultiplier: 1.6,
    statPerLevel: 0.04, // +4% per level
    displayType: 'percent'
  },
  {
    id: 'dodgeChance',
    name: 'Phase Drift (Dodge Chance)',
    description: 'Grants chance to completely phase-dodge incoming attacks.',
    icon: 'dodge',
    maxLevel: 8,
    baseCost: 350,
    costMultiplier: 1.55,
    statPerLevel: 0.015, // +1.5% per level
    displayType: 'percent'
  },
  {
    id: 'healthRegen',
    name: 'Nanite Mend (Regen)',
    description: 'Passively regenerates HP every second.',
    icon: 'regen',
    maxLevel: 10,
    baseCost: 250,
    costMultiplier: 1.45,
    statPerLevel: 0.3, // +0.3 HP/sec per level
    displayType: 'flat'
  },
  {
    id: 'luck',
    name: 'Prospector Node (Luck)',
    description: 'Improves the likelihood of finding Rare or Legendary items.',
    icon: 'luck',
    maxLevel: 10,
    baseCost: 300,
    costMultiplier: 1.4,
    statPerLevel: 0.05, // +5% luck scaling factor per level
    displayType: 'percent'
  },
  {
    id: 'coinMultiplier',
    name: 'Gold Siphon (Gold %)',
    description: 'Multiplies all Gold earned from defeating zombies and bosses.',
    icon: 'gold',
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.35,
    statPerLevel: 0.08, // +8% gold per level
    displayType: 'percent'
  },
  {
    id: 'xpMultiplier',
    name: 'Neural Matrix (XP %)',
    description: 'Increases the amount of experience received from combat tasks.',
    icon: 'xp',
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.35,
    statPerLevel: 0.08, // +8% XP per level
    displayType: 'percent'
  }
];

export type UpgradeType = keyof PlayerUpgrades;

export function getUpgradeCost(id: UpgradeType, currentLevel: number): number {
  return upgradeSystem.getUpgradeCost(id, currentLevel);
}

export function getUpgradeStatBonus(id: UpgradeType, level: number): number {
  return upgradeSystem.getStatBonus(id, level);
}

export const DEFAULT_UPGRADES: PlayerUpgrades = {
  maxHealth: 0,
  attackDamage: 0,
  defense: 0,
  critChance: 0,
  critDamage: 0,
  attackSpeed: 0,
  movementSpeed: 0,
  dodgeChance: 0,
  healthRegen: 0,
  luck: 0,
  coinMultiplier: 0,
  xpMultiplier: 0,
};

export const upgradeSystem = {
  // Get upgrade cost
  getUpgradeCost(id: keyof PlayerUpgrades, currentLevel: number): number {
    const config = UPGRADE_LIST.find(u => u.id === id);
    if (!config) return 999999;
    if (currentLevel >= config.maxLevel) return Infinity;
    return Math.round(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
  },

  // Get upgrade stats bonus for a specific stat
  getStatBonus(id: keyof PlayerUpgrades, level: number): number {
    const config = UPGRADE_LIST.find(u => u.id === id);
    if (!config) return 0;
    return level * config.statPerLevel;
  },

  // Format bonus display
  formatValue(id: keyof PlayerUpgrades, value: number): string {
    const config = UPGRADE_LIST.find(u => u.id === id);
    if (!config) return '0';
    if (config.displayType === 'percent') {
      return `${Math.round(value * 100)}%`;
    }
    return value.toFixed(1).replace(/\.0$/, '');
  }
};
