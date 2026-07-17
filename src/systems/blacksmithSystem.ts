import { GameItem, Rarity, RARITIES, TROPHY_PRESETS } from './lootSystem';
import { PlayerSaveData, saveSystem } from './saveSystem';
import { economySystem } from './economySystem';

export interface UpgradeCost {
  gold: number;
  wood: number;
  metal: number;
  gem: number;
  trophyId?: string; // e.g., 'goliath', 'lich' etc. (matches trophy subType or key)
  trophyName?: string;
}

export const blacksmithSystem = {
  // Calculate resources required to upgrade an item's stats (flat weapon + armor leveling)
  getStatUpgradeCost(item: GameItem): UpgradeCost {
    const isHighTier = item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'ancient';
    const currentLvl = item.levelReq;
    
    // Gold cost scales exponentially with item level
    const gold = Math.round(150 * Math.pow(1.25, currentLvl));
    
    // Material costs
    const wood = Math.max(1, Math.round(3 * Math.pow(1.15, currentLvl)));
    const metal = Math.max(1, Math.round(2 * Math.pow(1.18, currentLvl)));
    const gem = isHighTier ? Math.max(1, Math.floor(currentLvl / 3)) : 0;

    return { gold, wood, metal, gem };
  },

  // Check if player has the materials and meets conditions to upgrade stats
  canUpgradeStats(itemId: string, saveData: PlayerSaveData): { allowed: boolean; reason?: string; cost: UpgradeCost } {
    const item = saveData.items.find(i => i.id === itemId);
    if (!item) {
      return { allowed: false, reason: 'Item not found in inventory.', cost: { gold: 0, wood: 0, metal: 0, gem: 0 } };
    }

    if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory') {
      return { allowed: false, reason: 'Only combat equipment can be reinforced.', cost: { gold: 0, wood: 0, metal: 0, gem: 0 } };
    }

    const cost = this.getStatUpgradeCost(item);

    if (saveData.gold < cost.gold) return { allowed: false, reason: 'Insufficient Gold coins.', cost };
    if (saveData.wood < cost.wood) return { allowed: false, reason: 'Insufficient Wood timber.', cost };
    if (saveData.metal < cost.metal) return { allowed: false, reason: 'Insufficient Metal alloy plates.', cost };
    if (saveData.gem < cost.gem) return { allowed: false, reason: 'Insufficient Crystal Gems.', cost };

    return { allowed: true, cost };
  },

  // Upgrade item stats (modifies item stats, consumes resources, increases item level levelReq)
  upgradeStats(itemId: string): PlayerSaveData {
    const saveData = saveSystem.load();
    const check = this.canUpgradeStats(itemId, saveData);
    if (!check.allowed || !check.cost) return saveData;

    const itemIndex = saveData.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return saveData;

    const item = saveData.items[itemIndex];
    const cost = check.cost;

    // Deduct resources
    saveData.gold -= cost.gold;
    saveData.wood -= cost.wood;
    saveData.metal -= cost.metal;
    saveData.gem -= cost.gem;

    // Increase item stats
    item.levelReq += 1;
    const multiplier = 1.08; // 8% increase per upgrade level

    if (item.type === 'weapon') {
      item.attack = Math.round(item.attack * multiplier) + 2;
      item.critChance = parseFloat((item.critChance + 0.005).toFixed(3));
    } else if (item.type === 'armor') {
      item.defense = Math.round(item.defense * multiplier) + 1;
      item.health = Math.round(item.health * multiplier) + 5;
    } else if (item.type === 'accessory') {
      item.health = Math.round(item.health * multiplier) + 2;
      item.speedBonus = parseFloat((item.speedBonus + 0.005).toFixed(3));
    }

    // Dynamic price scale on upgrade
    // Buy price increases, sell value scales up as well
    item.sellValue = economySystem.calculateSellPrice(item);

    saveSystem.save(saveData);
    return saveData;
  },

  // Determine rarity upgrade (evolution) costs
  getRarityEvolutionCost(item: GameItem): UpgradeCost {
    const nextRarity = this.getNextRarity(item.rarity);
    if (!nextRarity) return { gold: Infinity, wood: Infinity, metal: Infinity, gem: Infinity };

    let gold = 500;
    let wood = 10;
    let metal = 10;
    let gem = 1;
    let trophyId: string | undefined;
    let trophyName: string | undefined;

    switch (nextRarity) {
      case 'uncommon':
        gold = 300; wood = 15; metal = 10; gem = 0;
        break;
      case 'rare':
        gold = 750; wood = 25; metal = 20; gem = 2;
        break;
      case 'epic':
        gold = 1500; wood = 40; metal = 35; gem = 5;
        break;
      case 'legendary':
        gold = 4000; wood = 80; metal = 70; gem = 12;
        // Requires Goliath horn
        trophyId = 'goliath';
        trophyName = 'Goliath Spitter Horn';
        break;
      case 'mythic':
        gold = 10000; wood = 150; metal = 120; gem = 25;
        // Requires Frostlord archon core
        trophyId = 'frostlord';
        trophyName = 'Frostlord Archon Core';
        break;
      case 'ancient':
        gold = 25000; wood = 300; metal = 250; gem = 60;
        // Requires Dragon scale
        trophyId = 'dragon';
        trophyName = 'Ancient Dragon Scale';
        break;
    }

    return { gold, wood, metal, gem, trophyId, trophyName };
  },

  // Get next rarity in progression
  getNextRarity(current: Rarity): Rarity | null {
    const progress: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ancient'];
    const idx = progress.indexOf(current);
    if (idx === -1 || idx === progress.length - 1) return null;
    return progress[idx + 1];
  },

  // Check if player has resources/trophies to evolve rarity
  canEvolveRarity(itemId: string, saveData: PlayerSaveData): { allowed: boolean; reason?: string; cost: UpgradeCost } {
    const item = saveData.items.find(i => i.id === itemId);
    if (!item) {
      return { allowed: false, reason: 'Item not found.', cost: { gold: 0, wood: 0, metal: 0, gem: 0 } };
    }

    const nextRarity = this.getNextRarity(item.rarity);
    if (!nextRarity) {
      return { allowed: false, reason: 'This item has already achieved Ancient tier!', cost: { gold: 0, wood: 0, metal: 0, gem: 0 } };
    }

    const cost = this.getRarityEvolutionCost(item);

    if (saveData.gold < cost.gold) return { allowed: false, reason: 'Insufficient Gold coins.', cost };
    if (saveData.wood < cost.wood) return { allowed: false, reason: 'Insufficient Wood.', cost };
    if (saveData.metal < cost.metal) return { allowed: false, reason: 'Insufficient Metal.', cost };
    if (saveData.gem < cost.gem) return { allowed: false, reason: 'Insufficient Gems.', cost };

    if (cost.trophyId) {
      // Find a trophy of this type in inventory
      // We look for any item of type 'trophy' whose name/description matches the target trophy
      const trophyItem = saveData.items.find(i => i.type === 'trophy' && (i.name.toLowerCase().includes(cost.trophyId!) || i.description.toLowerCase().includes(cost.trophyId!)));
      if (!trophyItem) {
        return { allowed: false, reason: `Requires ${cost.trophyName} boss trophy in your bag!`, cost };
      }
    }

    return { allowed: true, cost };
  },

  // Evolve item rarity to the next level
  evolveRarity(itemId: string): PlayerSaveData {
    const saveData = saveSystem.load();
    const check = this.canEvolveRarity(itemId, saveData);
    if (!check.allowed || !check.cost) return saveData;

    const itemIndex = saveData.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return saveData;

    const item = saveData.items[itemIndex];
    const cost = check.cost;
    const nextRarity = this.getNextRarity(item.rarity)!;

    // Deduct resources
    saveData.gold -= cost.gold;
    saveData.wood -= cost.wood;
    saveData.metal -= cost.metal;
    saveData.gem -= cost.gem;

    // Remove trophy if required
    if (cost.trophyId) {
      const trophyIndex = saveData.items.findIndex(i => i.type === 'trophy' && (i.name.toLowerCase().includes(cost.trophyId!) || i.description.toLowerCase().includes(cost.trophyId!)));
      if (trophyIndex !== -1) {
        saveData.items.splice(trophyIndex, 1);
      }
    }

    // Evolve item Rarity
    item.rarity = nextRarity;
    
    // Modify item name to include new rarity
    const oldNameBase = item.name.replace(/\[.*?\] /, '');
    const config = RARITIES[nextRarity];
    item.name = `[${config.name}] ${oldNameBase}`;

    // Recalculate stats based on the new Rarity multiplier!
    const rConfig = RARITIES[nextRarity];
    if (item.type === 'weapon') {
      item.attack = Math.round((10 + item.levelReq * 6) * rConfig.statMultiplier);
      item.critChance = parseFloat((0.02 + Math.random() * 0.08 * rConfig.statMultiplier).toFixed(3));
      item.speedBonus = parseFloat((Math.random() * 0.05 * rConfig.statMultiplier).toFixed(3));
    } else if (item.type === 'armor') {
      item.defense = Math.round((2 + item.levelReq * 2) * rConfig.statMultiplier);
      item.health = Math.round((15 + item.levelReq * 10) * rConfig.statMultiplier);
    } else if (item.type === 'accessory') {
      item.health = Math.round((5 + item.levelReq * 4) * rConfig.statMultiplier);
      item.critChance = parseFloat((0.01 + Math.random() * 0.06 * rConfig.statMultiplier).toFixed(3));
      item.speedBonus = parseFloat((0.02 + Math.random() * 0.04 * rConfig.statMultiplier).toFixed(3));
    }

    // Recalculate prices
    item.sellValue = economySystem.calculateSellPrice(item);

    saveSystem.save(saveData);
    return saveData;
  }
};
