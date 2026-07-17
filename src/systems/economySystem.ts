import { GameItem, Rarity, generateLootItem, RARITIES } from './lootSystem';
import { PlayerSaveData, saveSystem } from './saveSystem';

export interface DailyReward {
  day: number;
  gold: number;
  materials?: { wood?: number; metal?: number; gem?: number };
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gold: 100 },
  { day: 2, gold: 150, materials: { wood: 5 } },
  { day: 3, gold: 200, materials: { metal: 3 } },
  { day: 4, gold: 250 },
  { day: 5, gold: 350, materials: { wood: 10, metal: 5 } },
  { day: 6, gold: 500, materials: { gem: 1 } },
  { day: 7, gold: 1000, materials: { wood: 15, metal: 10, gem: 2 } }
];

export const economySystem = {
  // Get Selling Ratio based on Rarity
  getSellRatio(rarity: Rarity): number {
    switch (rarity) {
      case 'common': return 0.50;
      case 'uncommon': return 0.55;
      case 'rare': return 0.60;
      case 'epic': return 0.70;
      case 'legendary': return 0.80;
      case 'mythic': return 0.90;
      case 'ancient': return 0.95;
      default: return 0.50;
    }
  },

  // Calculate standard buy price of an item
  calculateBuyPrice(item: GameItem): number {
    // Pricing scales by Level, Rarity multiplier, and stats count
    const levelBonus = Math.max(1, item.levelReq);
    let base = 50 * levelBonus;
    
    // Add value for stats
    const statsWeight = (item.attack * 5) + (item.defense * 8) + (item.health * 2) + (item.critChance * 300) + (item.speedBonus * 400);
    
    let rarityMult = 1.0;
    switch (item.rarity) {
      case 'common': rarityMult = 1.0; break;
      case 'uncommon': rarityMult = 1.8; break;
      case 'rare': rarityMult = 3.5; break;
      case 'epic': rarityMult = 8.0; break;
      case 'legendary': rarityMult = 20.0; break;
      case 'mythic': rarityMult = 50.0; break;
      case 'ancient': rarityMult = 120.0; break;
    }

    let specialValue = item.specialBonus && item.specialBonus !== 'Standard combat weapon' && item.specialBonus !== 'Provides flat kinetic armor' ? 100 : 0;
    
    return Math.round((base + statsWeight + specialValue) * rarityMult);
  },

  // Calculate standard sell price of an item based on its buy price (or stats)
  calculateSellPrice(item: GameItem): number {
    const buyPrice = this.calculateBuyPrice(item);
    const ratio = this.getSellRatio(item.rarity);
    return Math.round(buyPrice * ratio);
  },

  // Generate standard items for shop categories
  generateShopStock(level: number): GameItem[] {
    const stock: GameItem[] = [];
    
    // Weapons category (3 items, levels slightly scaled)
    stock.push(generateLootItem('weapon', level));
    stock.push(generateLootItem('weapon', Math.max(1, level - 1)));
    stock.push(generateLootItem('weapon', level + 1));

    // Armor category (3 items)
    stock.push(generateLootItem('armor', level));
    stock.push(generateLootItem('armor', Math.max(1, level - 1)));
    stock.push(generateLootItem('armor', level + 1));

    // Accessory category (2 items)
    stock.push(generateLootItem('accessory', level));
    stock.push(generateLootItem('accessory', level + 1));

    return stock.map(item => {
      // Set future-ready durability
      const buyPrice = this.calculateBuyPrice(item);
      const sellPrice = this.calculateSellPrice(item);
      return {
        ...item,
        buyPrice,
        sellValue: sellPrice,
        durability: 100,
        maxDurability: 100
      };
    });
  },

  // Generate Black Market rare rotating items (higher level, rare or better guaranteed)
  generateBlackMarketStock(level: number): GameItem[] {
    const stock: GameItem[] = [];
    // Black market items are always epic, legendary, mythic, or ancient
    const blackMarketRarities: Rarity[] = ['epic', 'legendary', 'mythic', 'ancient'];
    
    for (let i = 0; i < 4; i++) {
      const type = i % 3 === 0 ? 'weapon' : (i % 3 === 1 ? 'armor' : 'accessory');
      const item = generateLootItem(type as any, level + Math.floor(Math.random() * 2));
      
      // Override to ensure high tier rarity
      const finalRarity = blackMarketRarities[Math.floor(Math.random() * blackMarketRarities.length)];
      item.rarity = finalRarity;
      
      // Scale stats according to new rarity multiplier
      const rConfig = RARITIES[finalRarity];
      if (item.type === 'weapon') {
        item.attack = Math.round((10 + item.levelReq * 6) * rConfig.statMultiplier);
      } else if (item.type === 'armor') {
        item.defense = Math.round((2 + item.levelReq * 2) * rConfig.statMultiplier);
        item.health = Math.round((15 + item.levelReq * 10) * rConfig.statMultiplier);
      }
      
      // Assign appropriate black market descriptions/prices
      const buyPrice = Math.round(this.calculateBuyPrice(item) * 1.35); // 35% premium for rare black market wares!
      const sellPrice = this.calculateSellPrice(item);

      stock.push({
        ...item,
        name: `[BLACK MARKET] ${item.name.replace(/\[.*?\] /, '')}`,
        buyPrice,
        sellValue: sellPrice,
        durability: 100,
        maxDurability: 100
      });
    }

    return stock;
  },

  // Claim Daily Reward
  claimDailyReward(): { success: boolean; reward?: DailyReward; error?: string } {
    const saveData = saveSystem.load();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Check local storage for last daily claim
    const lastClaimStr = localStorage.getItem('isometric_survival_last_daily_claim');
    const streakStr = localStorage.getItem('isometric_survival_daily_streak') || '0';
    
    let lastClaim = lastClaimStr ? parseInt(lastClaimStr) : 0;
    let streak = parseInt(streakStr);

    if (now - lastClaim < oneDayMs) {
      // Wait time remaining formatted
      const diff = oneDayMs - (now - lastClaim);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        success: false,
        error: `Daily login reward is on cooldown. Try again in ${hours}h ${mins}m.`
      };
    }

    // Determine current day reward (1 to 7 cycle)
    if (now - lastClaim > oneDayMs * 2) {
      // Streak broken, reset to Day 1
      streak = 1;
    } else {
      streak = (streak % 7) + 1;
    }

    const reward = DAILY_REWARDS.find(r => r.day === streak) || DAILY_REWARDS[0];
    
    // Apply reward
    saveData.gold += reward.gold;
    saveData.stats.goldEarned += reward.gold;
    
    if (reward.materials) {
      saveData.wood += reward.materials.wood || 0;
      saveData.metal += reward.materials.metal || 0;
      saveData.gem += reward.materials.gem || 0;
    }

    saveSystem.save(saveData);
    localStorage.setItem('isometric_survival_last_daily_claim', now.toString());
    localStorage.setItem('isometric_survival_daily_streak', streak.toString());

    return {
      success: true,
      reward
    };
  }
};
