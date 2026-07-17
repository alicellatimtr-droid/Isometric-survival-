import { Enemy, ZombieType } from '../types';

export type EnemyBehaviorType = 'melee' | 'ranged' | 'tank' | 'assassin' | 'flying' | 'summoner';

export interface EnemyBlueprint {
  type: ZombieType;
  name: string;
  behaviorType: EnemyBehaviorType;
  maxHealth: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  glowColor: string;
  pointsValue: number;
  sizeMultiplier: number;
  weakness?: string;
}

// 6 Levels of 3 completely unique enemy types (18 enemies in total!)
export const LEVEL_ENEMIES: Record<number, EnemyBlueprint[]> = {
  1: [
    {
      type: 'basic', // Maps to basic internally
      name: 'Forest Slime',
      behaviorType: 'melee',
      maxHealth: 25,
      speed: 1.0,
      damage: 6,
      radius: 0.35,
      color: '#10b981', // emerald green slime
      glowColor: 'rgba(16, 185, 129, 0.2)',
      pointsValue: 10,
      sizeMultiplier: 1.0,
      weakness: 'Fire / Melee Slashes'
    },
    {
      type: 'fast',
      name: 'Feral Forest Wolf',
      behaviorType: 'assassin',
      maxHealth: 20,
      speed: 2.3,
      damage: 8,
      radius: 0.3,
      color: '#f97316', // orange rust
      glowColor: 'rgba(249, 115, 22, 0.3)',
      pointsValue: 15,
      sizeMultiplier: 0.85,
      weakness: 'Ranged attacks / Bow'
    },
    {
      type: 'spitter',
      name: 'Forest Goblin Slinger',
      behaviorType: 'ranged',
      maxHealth: 30,
      speed: 1.4,
      damage: 10,
      radius: 0.35,
      color: '#84cc16', // lime goblin
      glowColor: 'rgba(132, 204, 22, 0.2)',
      pointsValue: 20,
      sizeMultiplier: 0.9,
      weakness: 'Dashing / Melee'
    }
  ],
  2: [
    {
      type: 'basic',
      name: 'Decayed Skeleton',
      behaviorType: 'melee',
      maxHealth: 50,
      speed: 1.1,
      damage: 12,
      radius: 0.35,
      color: '#e2e8f0', // bone white
      glowColor: 'rgba(226, 232, 240, 0.2)',
      pointsValue: 15,
      sizeMultiplier: 1.0,
      weakness: 'Heavy Axes / Mace'
    },
    {
      type: 'fast',
      name: 'Grave Ghoul',
      behaviorType: 'assassin',
      maxHealth: 40,
      speed: 2.5,
      damage: 10,
      radius: 0.3,
      color: '#ec4899', // bright flesh magenta
      glowColor: 'rgba(236, 72, 153, 0.3)',
      pointsValue: 25,
      sizeMultiplier: 0.9,
      weakness: 'Cleaving weapons'
    },
    {
      type: 'spitter',
      name: 'Crypt Necromancer',
      behaviorType: 'summoner',
      maxHealth: 65,
      speed: 1.2,
      damage: 15,
      radius: 0.4,
      color: '#a855f7', // purple
      glowColor: 'rgba(168, 85, 247, 0.3)',
      pointsValue: 40,
      sizeMultiplier: 1.1,
      weakness: 'Holy spells / High damage'
    }
  ],
  3: [
    {
      type: 'basic',
      name: 'Desert Scorpion',
      behaviorType: 'melee',
      maxHealth: 80,
      speed: 1.5,
      damage: 18,
      radius: 0.4,
      color: '#fbbf24', // golden yellow scorpion
      glowColor: 'rgba(251, 191, 36, 0.25)',
      pointsValue: 30,
      sizeMultiplier: 1.1,
      weakness: 'Ice damage / Pierce'
    },
    {
      type: 'fast',
      name: 'Desert Raider Scout',
      behaviorType: 'assassin',
      maxHealth: 70,
      speed: 2.6,
      damage: 15,
      radius: 0.32,
      color: '#f59e0b', // amber desert suit
      glowColor: 'rgba(245, 158, 11, 0.3)',
      pointsValue: 40,
      sizeMultiplier: 0.95,
      weakness: 'Shield Bashes'
    },
    {
      type: 'tank',
      name: 'Obsidian Sand Golem',
      behaviorType: 'tank',
      maxHealth: 180,
      speed: 0.8,
      damage: 30,
      radius: 0.6,
      color: '#78716c', // heavy stone gray
      glowColor: 'rgba(120, 113, 108, 0.4)',
      pointsValue: 60,
      sizeMultiplier: 1.5,
      weakness: 'Maces / Railguns'
    }
  ],
  4: [
    {
      type: 'basic',
      name: 'Frozen Glacier Shard',
      behaviorType: 'melee',
      maxHealth: 120,
      speed: 1.1,
      damage: 22,
      radius: 0.45,
      color: '#38bdf8', // light blue ice
      glowColor: 'rgba(56, 189, 248, 0.3)',
      pointsValue: 50,
      sizeMultiplier: 1.15,
      weakness: 'Fire elements'
    },
    {
      type: 'fast',
      name: 'Frost Wolf Pack-leader',
      behaviorType: 'assassin',
      maxHealth: 90,
      speed: 2.8,
      damage: 18,
      radius: 0.35,
      color: '#06b6d4', // cyan wolf
      glowColor: 'rgba(6, 182, 212, 0.4)',
      pointsValue: 60,
      sizeMultiplier: 1.0,
      weakness: 'Melee swings'
    },
    {
      type: 'spitter',
      name: 'Cryo Ice Mage',
      behaviorType: 'ranged',
      maxHealth: 110,
      speed: 1.5,
      damage: 25,
      radius: 0.4,
      color: '#0284c7', // deep frost blue
      glowColor: 'rgba(2, 132, 199, 0.4)',
      pointsValue: 80,
      sizeMultiplier: 1.1,
      weakness: 'Lighning spears'
    }
  ],
  5: [
    {
      type: 'basic',
      name: 'Abyssal Dark Knight',
      behaviorType: 'tank',
      maxHealth: 250,
      speed: 0.9,
      damage: 35,
      radius: 0.55,
      color: '#1e293b', // slate obsidian plate
      glowColor: 'rgba(30, 41, 59, 0.5)',
      pointsValue: 100,
      sizeMultiplier: 1.4,
      weakness: 'Energy saber / Plasma'
    },
    {
      type: 'fast',
      name: 'Hellfire Gargoyle',
      behaviorType: 'flying', // flying ignores collisions!
      maxHealth: 150,
      speed: 2.5,
      damage: 28,
      radius: 0.4,
      color: '#ef4444', // bright blood red
      glowColor: 'rgba(239, 68, 68, 0.5)',
      pointsValue: 120,
      sizeMultiplier: 1.1,
      weakness: 'Ranged bow arrows'
    },
    {
      type: 'spitter',
      name: 'Doom Fire Beast',
      behaviorType: 'ranged',
      maxHealth: 200,
      speed: 1.3,
      damage: 32,
      radius: 0.5,
      color: '#f97316', // bright orange embers
      glowColor: 'rgba(249, 115, 22, 0.5)',
      pointsValue: 150,
      sizeMultiplier: 1.3,
      weakness: 'Ice shards'
    }
  ],
  6: [
    {
      type: 'basic',
      name: 'Sentry Core Guardian',
      behaviorType: 'tank',
      maxHealth: 400,
      speed: 1.0,
      damage: 45,
      radius: 0.6,
      color: '#475569', // solid iron plating
      glowColor: 'rgba(71, 85, 105, 0.6)',
      pointsValue: 200,
      sizeMultiplier: 1.5,
      weakness: 'Heavy energy damage'
    },
    {
      type: 'fast',
      name: 'Ancient Fire Drake',
      behaviorType: 'flying',
      maxHealth: 300,
      speed: 3.0,
      damage: 40,
      radius: 0.5,
      color: '#b91c1c', // dark crimson red
      glowColor: 'rgba(185, 28, 28, 0.7)',
      pointsValue: 250,
      sizeMultiplier: 1.35,
      weakness: 'Cryo spikes'
    },
    {
      type: 'spitter',
      name: 'Sanctum Void Summoner',
      behaviorType: 'summoner',
      maxHealth: 350,
      speed: 1.6,
      damage: 50,
      radius: 0.45,
      color: '#6d28d9', // void royal violet
      glowColor: 'rgba(109, 40, 217, 0.6)',
      pointsValue: 300,
      sizeMultiplier: 1.25,
      weakness: 'Rapid close slashes'
    }
  ],
  7: [
    {
      type: 'basic',
      name: 'Frozen Sentry',
      behaviorType: 'tank',
      maxHealth: 500,
      speed: 0.9,
      damage: 50,
      radius: 0.6,
      color: '#0284c7',
      glowColor: 'rgba(2, 132, 199, 0.6)',
      pointsValue: 350,
      sizeMultiplier: 1.5,
      weakness: 'Fire stream / Flamethrower'
    },
    {
      type: 'fast',
      name: 'Cryo Spook',
      behaviorType: 'assassin',
      maxHealth: 350,
      speed: 2.8,
      damage: 42,
      radius: 0.4,
      color: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.6)',
      pointsValue: 400,
      sizeMultiplier: 1.1,
      weakness: 'Laser pulses'
    },
    {
      type: 'spitter',
      name: 'Blizzard Shaman',
      behaviorType: 'ranged',
      maxHealth: 400,
      speed: 1.5,
      damage: 55,
      radius: 0.45,
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.6)',
      pointsValue: 450,
      sizeMultiplier: 1.2,
      weakness: 'Tesla bolts'
    }
  ],
  8: [
    {
      type: 'basic',
      name: 'Mummy Guardian',
      behaviorType: 'melee',
      maxHealth: 600,
      speed: 1.1,
      damage: 60,
      radius: 0.5,
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.6)',
      pointsValue: 500,
      sizeMultiplier: 1.3,
      weakness: 'Wind blades'
    },
    {
      type: 'fast',
      name: 'Golden Scarab',
      behaviorType: 'flying',
      maxHealth: 450,
      speed: 3.2,
      damage: 45,
      radius: 0.35,
      color: '#ca8a04',
      glowColor: 'rgba(202, 138, 4, 0.7)',
      pointsValue: 550,
      sizeMultiplier: 1.0,
      weakness: 'Scattershot shotgun'
    },
    {
      type: 'spitter',
      name: 'Anubis Priest',
      behaviorType: 'summoner',
      maxHealth: 550,
      speed: 1.7,
      damage: 65,
      radius: 0.5,
      color: '#854d0e',
      glowColor: 'rgba(133, 77, 14, 0.6)',
      pointsValue: 600,
      sizeMultiplier: 1.4,
      weakness: 'Sniper bullets'
    }
  ],
  9: [
    {
      type: 'basic',
      name: 'Void Golem',
      behaviorType: 'tank',
      maxHealth: 800,
      speed: 0.8,
      damage: 70,
      radius: 0.7,
      color: '#4c1d95',
      glowColor: 'rgba(76, 29, 149, 0.7)',
      pointsValue: 700,
      sizeMultiplier: 1.6,
      weakness: 'Fire staff explosions'
    },
    {
      type: 'fast',
      name: 'Eldritch Stalker',
      behaviorType: 'assassin',
      maxHealth: 500,
      speed: 3.0,
      damage: 55,
      radius: 0.4,
      color: '#7c3aed',
      glowColor: 'rgba(124, 58, 237, 0.7)',
      pointsValue: 750,
      sizeMultiplier: 1.1,
      weakness: 'Quantum beams'
    },
    {
      type: 'spitter',
      name: 'Abyss Spitter',
      behaviorType: 'ranged',
      maxHealth: 600,
      speed: 1.6,
      damage: 75,
      radius: 0.45,
      color: '#a78bfa',
      glowColor: 'rgba(167, 139, 250, 0.6)',
      pointsValue: 800,
      sizeMultiplier: 1.2,
      weakness: 'Ice freezes'
    }
  ],
  10: [
    {
      type: 'basic',
      name: 'Magma Slag',
      behaviorType: 'melee',
      maxHealth: 900,
      speed: 1.2,
      damage: 80,
      radius: 0.55,
      color: '#ea580c',
      glowColor: 'rgba(234, 88, 12, 0.7)',
      pointsValue: 900,
      sizeMultiplier: 1.4,
      weakness: 'Ice blasts'
    },
    {
      type: 'fast',
      name: 'Lava Fly',
      behaviorType: 'flying',
      maxHealth: 600,
      speed: 3.4,
      damage: 60,
      radius: 0.35,
      color: '#dc2626',
      glowColor: 'rgba(220, 38, 38, 0.7)',
      pointsValue: 950,
      sizeMultiplier: 1.0,
      weakness: 'Water & Wind staff'
    },
    {
      type: 'spitter',
      name: 'Volcano Pyromancer',
      behaviorType: 'summoner',
      maxHealth: 750,
      speed: 1.8,
      damage: 85,
      radius: 0.5,
      color: '#9a3412',
      glowColor: 'rgba(154, 52, 18, 0.7)',
      pointsValue: 1000,
      sizeMultiplier: 1.35,
      weakness: 'Rockets'
    }
  ],
  11: [
    {
      type: 'basic',
      name: 'Rusty Mech-Droid',
      behaviorType: 'tank',
      maxHealth: 1100,
      speed: 1.0,
      damage: 90,
      radius: 0.65,
      color: '#4b5563',
      glowColor: 'rgba(75, 85, 99, 0.6)',
      pointsValue: 1100,
      sizeMultiplier: 1.5,
      weakness: 'Tesla lightning'
    },
    {
      type: 'fast',
      name: 'Scrap-Drone',
      behaviorType: 'flying',
      maxHealth: 700,
      speed: 3.5,
      damage: 70,
      radius: 0.4,
      color: '#6b7280',
      glowColor: 'rgba(107, 114, 128, 0.6)',
      pointsValue: 1200,
      sizeMultiplier: 1.15,
      weakness: 'Laser pistol'
    },
    {
      type: 'spitter',
      name: 'Laser Sentry',
      behaviorType: 'ranged',
      maxHealth: 850,
      speed: 1.5,
      damage: 95,
      radius: 0.45,
      color: '#374151',
      glowColor: 'rgba(55, 65, 81, 0.6)',
      pointsValue: 1300,
      sizeMultiplier: 1.25,
      weakness: 'Sniper charged beam'
    }
  ],
  12: [
    {
      type: 'basic',
      name: 'Shadow Shade',
      behaviorType: 'melee',
      maxHealth: 1300,
      speed: 1.3,
      damage: 100,
      radius: 0.5,
      color: '#1e1b4b',
      glowColor: 'rgba(30, 27, 75, 0.7)',
      pointsValue: 1500,
      sizeMultiplier: 1.3,
      weakness: 'Chrono repeater'
    },
    {
      type: 'fast',
      name: 'Phantasm Ripper',
      behaviorType: 'assassin',
      maxHealth: 900,
      speed: 3.6,
      damage: 80,
      radius: 0.4,
      color: '#311042',
      glowColor: 'rgba(49, 16, 66, 0.7)',
      pointsValue: 1600,
      sizeMultiplier: 1.1,
      weakness: 'Void singularity'
    },
    {
      type: 'spitter',
      name: 'Dread Summoner',
      behaviorType: 'summoner',
      maxHealth: 1050,
      speed: 1.9,
      damage: 110,
      radius: 0.5,
      color: '#491059',
      glowColor: 'rgba(73, 16, 89, 0.7)',
      pointsValue: 1800,
      sizeMultiplier: 1.4,
      weakness: 'Scattershot shotgun'
    }
  ],
  13: [
    {
      type: 'basic',
      name: 'Storm Golem',
      behaviorType: 'tank',
      maxHealth: 1600,
      speed: 1.1,
      damage: 115,
      radius: 0.7,
      color: '#0891b2',
      glowColor: 'rgba(8, 145, 178, 0.7)',
      pointsValue: 2000,
      sizeMultiplier: 1.6,
      weakness: 'Fire staff blast'
    },
    {
      type: 'fast',
      name: 'Volt Sprite',
      behaviorType: 'flying',
      maxHealth: 1000,
      speed: 3.8,
      damage: 90,
      radius: 0.35,
      color: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.7)',
      pointsValue: 2200,
      sizeMultiplier: 1.1,
      weakness: 'Wind staff pushback'
    },
    {
      type: 'spitter',
      name: 'Thunder Mage',
      behaviorType: 'ranged',
      maxHealth: 1200,
      speed: 2.0,
      damage: 120,
      radius: 0.45,
      color: '#22d3ee',
      glowColor: 'rgba(34, 211, 238, 0.7)',
      pointsValue: 2500,
      sizeMultiplier: 1.3,
      weakness: 'Ice slowdown'
    }
  ],
  14: [
    {
      type: 'basic',
      name: 'Marsh Behemoth',
      behaviorType: 'tank',
      maxHealth: 2000,
      speed: 0.9,
      damage: 130,
      radius: 0.75,
      color: '#065f46',
      glowColor: 'rgba(6, 95, 70, 0.7)',
      pointsValue: 3000,
      sizeMultiplier: 1.7,
      weakness: 'Flamethrower'
    },
    {
      type: 'fast',
      name: 'Swamp Lurker',
      behaviorType: 'assassin',
      maxHealth: 1200,
      speed: 3.2,
      damage: 100,
      radius: 0.4,
      color: '#047857',
      glowColor: 'rgba(4, 120, 87, 0.7)',
      pointsValue: 3300,
      sizeMultiplier: 1.2,
      weakness: 'Tesla bolts'
    },
    {
      type: 'spitter',
      name: 'Mire Spitter',
      behaviorType: 'ranged',
      maxHealth: 1400,
      speed: 1.7,
      damage: 135,
      radius: 0.5,
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.7)',
      pointsValue: 3600,
      sizeMultiplier: 1.35,
      weakness: 'Sniper bullet'
    }
  ],
  15: [
    {
      type: 'basic',
      name: 'Temporal Centurion',
      behaviorType: 'tank',
      maxHealth: 2500,
      speed: 1.2,
      damage: 150,
      radius: 0.7,
      color: '#d97706',
      glowColor: 'rgba(217, 119, 6, 0.7)',
      pointsValue: 4000,
      sizeMultiplier: 1.6,
      weakness: 'Quantum beam'
    },
    {
      type: 'fast',
      name: 'Chrono-Stalker',
      behaviorType: 'assassin',
      maxHealth: 1500,
      speed: 4.0,
      damage: 120,
      radius: 0.4,
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.7)',
      pointsValue: 4500,
      sizeMultiplier: 1.2,
      weakness: 'Void Staff singularity'
    },
    {
      type: 'spitter',
      name: 'Time Weaver',
      behaviorType: 'summoner',
      maxHealth: 1800,
      speed: 2.2,
      damage: 160,
      radius: 0.5,
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.7)',
      pointsValue: 5000,
      sizeMultiplier: 1.4,
      weakness: 'Rockets'
    }
  ],
  16: [
    {
      type: 'basic',
      name: 'Celestial Archon',
      behaviorType: 'tank',
      maxHealth: 4000,
      speed: 1.3,
      damage: 200,
      radius: 0.8,
      color: '#1d4ed8',
      glowColor: 'rgba(29, 78, 216, 0.8)',
      pointsValue: 8000,
      sizeMultiplier: 1.8,
      weakness: 'Chrono Repeater decay'
    },
    {
      type: 'fast',
      name: 'Nebula Stalker',
      behaviorType: 'flying',
      maxHealth: 2500,
      speed: 4.2,
      damage: 160,
      radius: 0.45,
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.8)',
      pointsValue: 9000,
      sizeMultiplier: 1.3,
      weakness: 'Glacial freeze & rockets'
    },
    {
      type: 'spitter',
      name: 'Cosmic Creator Minion',
      behaviorType: 'summoner',
      maxHealth: 3000,
      speed: 2.5,
      damage: 220,
      radius: 0.55,
      color: '#60a5fa',
      glowColor: 'rgba(96, 165, 250, 0.8)',
      pointsValue: 10000,
      sizeMultiplier: 1.5,
      weakness: 'Viper SMG & Fire staff'
    }
  ]
};

// Boss Blueprints for wave 5 (or 10 in level 2)
export const BOSS_BLUEPRINTS: Record<number, Partial<Enemy>> = {
  1: {
    type: 'boss_goliath',
    name: 'Goliath Spitter (BOSS)',
    maxHealth: 550,
    speed: 0.9,
    damage: 35,
    radius: 1.0,
    color: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.7)',
    pointsValue: 250,
    sizeMultiplier: 2.2,
    isBoss: true,
  },
  2: {
    type: 'boss_necromancer',
    name: 'Necromancer Lich (BOSS)',
    maxHealth: 850,
    speed: 1.1,
    damage: 45,
    radius: 0.9,
    color: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.8)',
    pointsValue: 500,
    sizeMultiplier: 2.0,
    isBoss: true,
  },
  3: {
    type: 'boss_frostlord',
    name: 'Frostlord Archon (BOSS)',
    maxHealth: 1200,
    speed: 0.95,
    damage: 55,
    radius: 1.1,
    color: '#06b6d4',
    glowColor: 'rgba(34, 211, 238, 0.8)',
    pointsValue: 750,
    sizeMultiplier: 2.3,
    isBoss: true,
  },
  4: {
    type: 'boss_abomination',
    name: 'Acidic Abomination (BOSS)',
    maxHealth: 1600,
    speed: 0.85,
    damage: 65,
    radius: 1.25,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.8)',
    pointsValue: 1000,
    sizeMultiplier: 2.5,
    isBoss: true,
  },
  5: {
    type: 'boss_cyber_overlord',
    name: 'Cyber Sentinel (BOSS)',
    maxHealth: 2400,
    speed: 1.05,
    damage: 80,
    radius: 1.3,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.9)',
    pointsValue: 2000,
    sizeMultiplier: 2.7,
    isBoss: true,
  },
  6: {
    type: 'boss_cyber_overlord', // Reuse cyber sentinel class but name Elder Dragon
    name: 'Ancient Sanctum Dragon (BOSS)',
    maxHealth: 3500,
    speed: 1.2,
    damage: 100,
    radius: 1.4,
    color: '#b91c1c',
    glowColor: 'rgba(185, 28, 28, 0.95)',
    pointsValue: 5000,
    sizeMultiplier: 3.0,
    isBoss: true,
  },
  7: {
    type: 'boss_frostlord',
    name: 'Frost Monarch Titan (BOSS)',
    maxHealth: 4500,
    speed: 1.0,
    damage: 110,
    radius: 1.5,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    pointsValue: 6000,
    sizeMultiplier: 3.2,
    isBoss: true,
  },
  8: {
    type: 'boss_necromancer',
    name: 'Gilded Pharaoh Wraith (BOSS)',
    maxHealth: 5500,
    speed: 1.15,
    damage: 120,
    radius: 1.4,
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    pointsValue: 7000,
    sizeMultiplier: 3.1,
    isBoss: true,
  },
  9: {
    type: 'boss_abomination',
    name: 'Herald of Void (BOSS)',
    maxHealth: 6500,
    speed: 0.95,
    damage: 130,
    radius: 1.6,
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.9)',
    pointsValue: 8000,
    sizeMultiplier: 3.3,
    isBoss: true,
  },
  10: {
    type: 'boss_goliath',
    name: 'Infernus Magma Lord (BOSS)',
    maxHealth: 8000,
    speed: 1.1,
    damage: 150,
    radius: 1.7,
    color: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.9)',
    pointsValue: 10000,
    sizeMultiplier: 3.5,
    isBoss: true,
  },
  11: {
    type: 'boss_cyber_overlord',
    name: 'A.I. Mecha Dreadnought (BOSS)',
    maxHealth: 10000,
    speed: 1.25,
    damage: 160,
    radius: 1.8,
    color: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.9)',
    pointsValue: 12000,
    sizeMultiplier: 3.6,
    isBoss: true,
  },
  12: {
    type: 'boss_abomination',
    name: 'Shoggoth Horror (BOSS)',
    maxHealth: 12000,
    speed: 1.05,
    damage: 180,
    radius: 1.8,
    color: '#491059',
    glowColor: 'rgba(73, 16, 89, 0.9)',
    pointsValue: 15000,
    sizeMultiplier: 3.4,
    isBoss: true,
  },
  13: {
    type: 'boss_goliath',
    name: 'Valkyrie Archon (BOSS)',
    maxHealth: 15000,
    speed: 1.3,
    damage: 200,
    radius: 1.6,
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.9)',
    pointsValue: 18000,
    sizeMultiplier: 3.2,
    isBoss: true,
  },
  14: {
    type: 'boss_abomination',
    name: 'Hydra Swamp Terror (BOSS)',
    maxHealth: 18000,
    speed: 1.1,
    damage: 220,
    radius: 1.9,
    color: '#065f46',
    glowColor: 'rgba(6, 95, 70, 0.9)',
    pointsValue: 20000,
    sizeMultiplier: 3.7,
    isBoss: true,
  },
  15: {
    type: 'boss_necromancer',
    name: 'Chrono Architect (BOSS)',
    maxHealth: 22000,
    speed: 1.35,
    damage: 250,
    radius: 1.7,
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.95)',
    pointsValue: 25000,
    sizeMultiplier: 3.3,
    isBoss: true,
  },
  16: {
    type: 'boss_cyber_overlord',
    name: 'Cosmic Creator Deity (BOSS)',
    maxHealth: 30000,
    speed: 1.5,
    damage: 300,
    radius: 2.0,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.95)',
    pointsValue: 50000,
    sizeMultiplier: 4.0,
    isBoss: true,
  }
};

// Generates and returns a random level-appropriate enemy instance
export function spawnLevelEnemy(
  id: string,
  level: number,
  x: number,
  y: number,
  difficultyMultiplier: number = 1.0
): Enemy {
  const levelBlueprints = LEVEL_ENEMIES[level] || LEVEL_ENEMIES[1];
  // Select blueprint randomly or based on wave state
  const bp = levelBlueprints[Math.floor(Math.random() * levelBlueprints.length)];
  
  // Decide if this is an "Elite" enemy (10% chance)
  const isElite = Math.random() < 0.12;
  const hp = Math.round(bp.maxHealth * difficultyMultiplier * (isElite ? 2.0 : 1.0));
  const dmg = Math.round(bp.damage * difficultyMultiplier * (isElite ? 1.4 : 1.0));
  const speed = bp.speed * (isElite ? 1.25 : 1.0);
  const sizeMult = bp.sizeMultiplier * (isElite ? 1.35 : 1.0);
  const name = isElite ? `★ Elite ${bp.name} ★` : bp.name;
  const glow = isElite ? 'rgba(251, 191, 36, 0.65)' : bp.glowColor;

  return {
    id,
    type: bp.type,
    x,
    y,
    health: hp,
    maxHealth: hp,
    speed,
    damage: dmg,
    radius: bp.radius * (isElite ? 1.25 : 1.0),
    color: isElite ? '#fbbf24' : bp.color, // Gold colored for elite
    glowColor: glow,
    isBoss: false,
    state: 'chase',
    stateTimer: 0,
    attackCooldown: 0,
    facingAngle: 0,
    pointsValue: bp.pointsValue * (isElite ? 3 : 1),
    name,
    sizeMultiplier: sizeMult,
    // Attach custom behavioral types
    behaviorType: bp.behaviorType,
    eliteType: isElite ? (Math.random() < 0.5 ? 'speedy' : 'fire_trail') : 'standard',
    spitTimer: 0,
    lastSummonTime: 0
  } as any;
}

// Spawns the level specific wave boss
export function spawnLevelBoss(
  id: string,
  level: number,
  x: number,
  y: number
): Enemy {
  const bp = BOSS_BLUEPRINTS[level] || BOSS_BLUEPRINTS[1];
  return {
    id,
    type: bp.type,
    x,
    y,
    health: bp.maxHealth!,
    maxHealth: bp.maxHealth!,
    speed: bp.speed!,
    damage: bp.damage!,
    radius: bp.radius!,
    color: bp.color!,
    glowColor: bp.glowColor!,
    isBoss: true,
    state: 'chase',
    stateTimer: 0,
    attackCooldown: 0,
    facingAngle: 0,
    pointsValue: bp.pointsValue!,
    name: bp.name!,
    sizeMultiplier: bp.sizeMultiplier!,
    behaviorType: 'melee', // Boss gets custom scripts
    phase: 1,
    spitTimer: 0,
    lastSummonTime: 0
  } as any;
}

// Run modular AI updates for each enemy depending on their class/behavior
export function updateEnemyMovementAI(
  enemy: any,
  playerX: number,
  playerY: number,
  dt: number,
  spawnProjectile: (isPlayer: boolean, x: number, y: number, vx: number, vy: number, damage: number, color: string, glowColor: string, radius: number) => void,
  spawnMinion: (type: ZombieType, x: number, y: number) => void
) {
  const dx = playerX - enemy.x;
  const dy = playerY - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Basic facing angle
  enemy.facingAngle = Math.atan2(dy, dx);

  // If enemy is frozen / knocked back / stunned, skip default movement
  if (enemy.attackCooldown > 0) {
    enemy.attackCooldown -= dt;
  }
  
  if (enemy.isBoss) {
    updateBossAI(enemy, dx, dy, dist, dt, spawnProjectile, spawnMinion);
    return;
  }

  let speedMultiplier = 1.0;
  if (enemy.slowTimer && enemy.slowTimer > 0) {
    enemy.slowTimer -= dt;
    speedMultiplier *= 0.5; // 50% slower
  }

  if (enemy.pushbackTimer && enemy.pushbackTimer > 0) {
    enemy.pushbackTimer -= dt;
    enemy.x += (enemy.pushbackVX || 0) * dt;
    enemy.y += (enemy.pushbackVY || 0) * dt;
    speedMultiplier *= 0.1; // almost stationary relative to default pathing
  }
  
  switch (enemy.behaviorType) {
    case 'flying': {
      // Flying ignores obstacles completely and hovers. Float up and down slightly.
      const hover = Math.sin(performance.now() * 0.008) * 0.1;
      const vx = (dx / (dist || 1)) * enemy.speed * speedMultiplier;
      const vy = (dy / (dist || 1)) * enemy.speed * speedMultiplier;
      
      enemy.x += vx * dt;
      enemy.y += vy * dt;
      break;
    }
    
    case 'ranged': {
      // Ranged enemies try to maintain a distance of about 4-6 tiles
      enemy.spitTimer = (enemy.spitTimer || 0) + dt;
      
      if (dist < 4.5) {
        // Run away!
        const vx = -(dx / (dist || 1)) * enemy.speed * speedMultiplier;
        const vy = -(dy / (dist || 1)) * enemy.speed * speedMultiplier;
        enemy.x += vx * dt;
        enemy.y += vy * dt;
      } else if (dist > 6.5) {
        // Move closer
        const vx = (dx / (dist || 1)) * enemy.speed * speedMultiplier;
        const vy = (dy / (dist || 1)) * enemy.speed * speedMultiplier;
        enemy.x += vx * dt;
        enemy.y += vy * dt;
      }
      
      // Shoot projectile
      if (enemy.spitTimer >= 2.0 && dist < 12) {
        enemy.spitTimer = 0;
        const shootAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
        const speed = 6.0;
        const pvx = Math.cos(shootAngle) * speed;
        const pvy = Math.sin(shootAngle) * speed;
        spawnProjectile(
          false,
          enemy.x,
          enemy.y,
          pvx,
          pvy,
          enemy.damage,
          enemy.color,
          enemy.glowColor,
          0.16
        );
      }
      break;
    }
    
    case 'summoner': {
      // Stays far back and summons basic minions
      enemy.lastSummonTime = (enemy.lastSummonTime || 0) + dt;
      
      if (dist < 6.0) {
        // Run away
        const vx = -(dx / (dist || 1)) * enemy.speed;
        const vy = -(dy / (dist || 1)) * enemy.speed;
        enemy.x += vx * dt;
        enemy.y += vy * dt;
      } else if (dist > 9.0) {
        // Approach
        const vx = (dx / (dist || 1)) * enemy.speed;
        const vy = (dy / (dist || 1)) * enemy.speed;
        enemy.x += vx * dt;
        enemy.y += vy * dt;
      }
      
      if (enemy.lastSummonTime >= 5.5 && dist < 15) {
        enemy.lastSummonTime = 0;
        // Spawn minor minion near summoner
        const sx = enemy.x + (Math.random() - 0.5) * 2;
        const sy = enemy.y + (Math.random() - 0.5) * 2;
        spawnMinion('basic', sx, sy);
      }
      break;
    }
    
    case 'assassin': {
      // Extremely fast, dashes directly in bursts
      enemy.spitTimer = (enemy.spitTimer || 0) + dt;
      
      let mult = 1.0;
      if (enemy.spitTimer > 2.5) {
        // Pre-lunge warning (slows down for 0.4s)
        mult = 0.25;
        if (enemy.spitTimer > 2.9) {
          // LUNGE SPEED!
          enemy.spitTimer = 0;
          mult = 4.0;
        }
      }
      
      const vx = (dx / (dist || 1)) * enemy.speed * mult;
      const vy = (dy / (dist || 1)) * enemy.speed * mult;
      enemy.x += vx * dt;
      enemy.y += vy * dt;
      break;
    }
    
    case 'tank':
    case 'melee':
    default: {
      // Aggressive rush towards player
      const vx = (dx / (dist || 1)) * enemy.speed;
      const vy = (dy / (dist || 1)) * enemy.speed;
      enemy.x += vx * dt;
      enemy.y += vy * dt;
      break;
    }
  }
}

// Boss AI script with multiple phases
function updateBossAI(
  boss: any,
  dx: number,
  dy: number,
  dist: number,
  dt: number,
  spawnProjectile: (isPlayer: boolean, x: number, y: number, vx: number, vy: number, damage: number, color: string, glowColor: string, radius: number) => void,
  spawnMinion: (type: ZombieType, x: number, y: number) => void
) {
  // Phase shift at 50% health
  const hpPercent = boss.health / boss.maxHealth;
  const originalPhase = boss.phase || 1;
  if (hpPercent < 0.5 && originalPhase === 1) {
    boss.phase = 2;
    boss.speed *= 1.35; // Rages!
  }
  const phase = boss.phase || 1;

  // Timers
  boss.spitTimer = (boss.spitTimer || 0) + dt;
  boss.lastSummonTime = (boss.lastSummonTime || 0) + dt;

  // Approach Player
  const vx = (dx / (dist || 1)) * boss.speed;
  const vy = (dy / (dist || 1)) * boss.speed;
  boss.x += vx * dt;
  boss.y += vy * dt;

  // Boss Ability 1: Bullet Hell Blast
  const spitRate = phase === 2 ? 1.5 : 2.5;
  if (boss.spitTimer >= spitRate && dist < 15) {
    boss.spitTimer = 0;
    
    // Shoot 8-directional projectles in phase 2, 4-directional in phase 1
    const directions = phase === 2 ? 8 : 4;
    const baseAngle = Math.atan2(dy, dx);
    const speed = phase === 2 ? 5.5 : 4.0;
    
    for (let i = 0; i < directions; i++) {
      const angle = baseAngle + (i * Math.PI * 2) / directions;
      const pvx = Math.cos(angle) * speed;
      const pvy = Math.sin(angle) * speed;
      spawnProjectile(
        false,
        boss.x,
        boss.y,
        pvx,
        pvy,
        boss.damage * 0.75,
        boss.color,
        boss.glowColor,
        0.22
      );
    }
  }

  // Boss Ability 2: Summon reinforcements
  const summonRate = phase === 2 ? 4.5 : 7.0;
  if (boss.lastSummonTime >= summonRate && dist < 16) {
    boss.lastSummonTime = 0;
    const summonsCount = phase === 2 ? 3 : 2;
    for (let i = 0; i < summonsCount; i++) {
      const sx = boss.x + (Math.random() - 0.5) * 3;
      const sy = boss.y + (Math.random() - 0.5) * 3;
      spawnMinion('fast', sx, sy);
    }
  }
}
