import { GameItem } from './lootSystem';
import { PlayerUpgrades, DEFAULT_UPGRADES } from './upgradeSystem';

export interface GameStats {
  zombiesKilled: number;
  bossesDefeatedCount: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  gamesPlayed: number;
  timePlayed: number; // in seconds
  goldEarned: number;
}

export interface PlayerSaveData {
  gold: number;
  wood: number;
  metal: number;
  gem: number;
  unlockedLevel: number;
  items: GameItem[];
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  equippedAccessoryId: string | null;
  bossesDefeated: string[]; // List of boss types defeated
  stats: GameStats;
  upgrades: PlayerUpgrades;
}

const DEFAULT_SAVE: PlayerSaveData = {
  gold: 250, // Balanced starting gold for survival progression
  wood: 50,  // Starting wood
  metal: 25, // Starting metal
  gem: 5,    // Starting gem
  unlockedLevel: 1, // First level is unlocked by default
  items: [], // Start with empty inventory
  equippedWeaponId: null,
  equippedArmorId: null,
  equippedAccessoryId: null,
  bossesDefeated: [],
  stats: {
    zombiesKilled: 0,
    bossesDefeatedCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    gamesPlayed: 0,
    timePlayed: 0,
    goldEarned: 0,
  },
  upgrades: { ...DEFAULT_UPGRADES }
};

const SAVE_KEY = 'isometric_survival_save_data_v2';

export const saveSystem = {
  // Load save data
  load(): PlayerSaveData {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as PlayerSaveData;
        // Merge to prevent issues with older versions and load standard player progress
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          stats: {
            ...DEFAULT_SAVE.stats,
            ...(parsed.stats || {})
          },
          upgrades: {
            ...DEFAULT_SAVE.upgrades,
            ...(parsed.upgrades || {})
          },
          items: parsed.items || [],
          bossesDefeated: parsed.bossesDefeated || []
        };
      }
    } catch (e) {
      console.error('Failed to load save data:', e);
    }
    return { ...DEFAULT_SAVE };
  },

  // Save data
  save(data: PlayerSaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      // Backward compatibility for old unlock levels
      localStorage.setItem('isometric_survival_unlocked_level', data.unlockedLevel.toString());
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  },

  // Reset progress
  reset(): PlayerSaveData {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(DEFAULT_SAVE));
      localStorage.setItem('isometric_survival_unlocked_level', '1');
    } catch (e) {
      console.error('Failed to reset save data:', e);
    }
    return { ...DEFAULT_SAVE };
  },

  // Equip an item
  equipItem(itemId: string): PlayerSaveData {
    const data = this.load();
    const item = data.items.find(i => i.id === itemId);
    if (!item) return data;

    if (item.type === 'weapon') {
      data.equippedWeaponId = item.id;
    } else if (item.type === 'armor') {
      data.equippedArmorId = item.id;
    } else if (item.type === 'accessory') {
      data.equippedAccessoryId = item.id;
    }

    this.save(data);
    return data;
  },

  // Unequip an item
  unequipItem(itemId: string): PlayerSaveData {
    const data = this.load();
    if (data.equippedWeaponId === itemId) data.equippedWeaponId = null;
    else if (data.equippedArmorId === itemId) data.equippedArmorId = null;
    else if (data.equippedAccessoryId === itemId) data.equippedAccessoryId = null;

    this.save(data);
    return data;
  },

  // Sell an item
  sellItem(itemId: string): PlayerSaveData {
    const data = this.load();
    const itemIdx = data.items.findIndex(i => i.id === itemId);
    if (itemIdx === -1) return data;

    const item = data.items[itemIdx];
    
    // Ensure we unequip first
    if (data.equippedWeaponId === itemId) data.equippedWeaponId = null;
    if (data.equippedArmorId === itemId) data.equippedArmorId = null;
    if (data.equippedAccessoryId === itemId) data.equippedAccessoryId = null;

    // Remove from array & add gold
    data.items.splice(itemIdx, 1);
    data.gold += item.sellValue;
    data.stats.goldEarned += item.sellValue;

    this.save(data);
    return data;
  },

  // Get total equipped stats (combining weapons, armors, accessories)
  getEquippedStats() {
    const data = this.load();
    const stats = {
      attack: 0,
      defense: 0,
      health: 0,
      critChance: 0,
      speedBonus: 0,
      passives: [] as string[]
    };

    const weapon = data.items.find(i => i.id === data.equippedWeaponId);
    const armor = data.items.find(i => i.id === data.equippedArmorId);
    const accessory = data.items.find(i => i.id === data.equippedAccessoryId);

    const equipped = [weapon, armor, accessory].filter((item): item is GameItem => !!item);

    for (const item of equipped) {
      stats.attack += item.attack || 0;
      stats.defense += item.defense || 0;
      stats.health += item.health || 0;
      stats.critChance += item.critChance || 0;
      stats.speedBonus += item.speedBonus || 0;
      if (item.specialBonus) {
        stats.passives.push(item.specialBonus);
      }
    }

    return stats;
  },

  // Add a list of items to the player's saved inventory
  addLootItems(lootList: GameItem[]): PlayerSaveData {
    const data = this.load();
    data.items = [...data.items, ...lootList];
    this.save(data);
    return data;
  },

  // Add gold to player
  addGold(goldReward: number): PlayerSaveData {
    const data = this.load();
    data.gold += goldReward;
    data.stats.goldEarned += goldReward;
    this.save(data);
    return data;
  },

  // Record a boss as defeated and increment counts
  recordBossDefeated(bossName: string, goldReward: number): PlayerSaveData {
    const data = this.load();
    if (!data.bossesDefeated.includes(bossName)) {
      data.bossesDefeated.push(bossName);
    }
    data.stats.bossesDefeatedCount += 1;
    this.save(data);
    return data;
  },

  // Unlock the next level
  unlockNextLevel(): PlayerSaveData {
    const data = this.load();
    data.unlockedLevel += 1;
    this.save(data);
    return data;
  }
};
