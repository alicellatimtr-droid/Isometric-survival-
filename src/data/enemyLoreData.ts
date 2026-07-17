export interface EnemyLoreEntry {
  name: string;
  lore: string;
  habitat: string;
  behavior: string;
  weakness: string;
  drops: Array<{ itemName: string; chance: string; rarityColor?: string }>;
  combatTips: string[];
}

export const ENEMY_LORE_MAP: Record<string, EnemyLoreEntry> = {
  // --- LEVEL 1: Overgrown Ruins ---
  "Forest Slime": {
    name: "Forest Slime",
    lore: "A gelatinous bio-mass mutated by raw elemental runoff. It moves with mindless persistence, seeking organic matter to assimilate into its bubbling emerald form.",
    habitat: "Zone 01 - Overgrown Ruins",
    behavior: "Aggressive Melee / Slow Charger",
    weakness: "Fire / Melee Slashes",
    drops: [
      { itemName: "Raw Slime Core", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Wood Material", chance: "30%", rarityColor: "text-amber-500" },
      { itemName: "XP Essence Gland", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Keep moving to avoid getting cornered by slow-moving groups.",
      "Use melee sweeps or fire weapons to dispatch them rapidly."
    ]
  },
  "Feral Forest Wolf": {
    name: "Feral Forest Wolf",
    lore: "Once a peaceful woodland predator, now mutated into an agile, red-eyed beast. Its musculature is hyper-tuned, allowing for explosive sprints and devastating lunges.",
    habitat: "Zone 01 - Overgrown Ruins",
    behavior: "Hyper-Agile Assassin / Lunger",
    weakness: "Ranged weapons / Bows",
    drops: [
      { itemName: "Feral Canine Claw", chance: "40%", rarityColor: "text-slate-400" },
      { itemName: "Raw Fur Bundle", chance: "40%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence Gland", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Watch for its visual wind-up pause, signaling an imminent, ultra-fast lunge.",
      "Use ranged weapons to thin their pack before they close the distance."
    ]
  },
  "Forest Goblin Slinger": {
    name: "Forest Goblin Slinger",
    lore: "A primitive, cunning scavenger that weaponizes local crystalline ores. They keep their distance, peppering trespassers with highly caustic, glowing projectiles.",
    habitat: "Zone 01 - Overgrown Ruins",
    behavior: "Skirmishing Ranged Archer",
    weakness: "Dashing / Melee Slashes",
    drops: [
      { itemName: "Damaged Sling pouch", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Scrap Metal Part", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence Gland", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Dash directly through their glowing rocks to close the distance and strike.",
      "They run away if you get too close; corner them against ruins."
    ]
  },
  "Goliath Spitter (BOSS)": {
    name: "Goliath Spitter (BOSS)",
    lore: "The ancient guardian of the ruins, swollen to monstrous proportions by chemical runoff. It acts as a living artillery cannon, unleashing dense barrages of toxic plasma.",
    habitat: "Zone 01 - Overgrown Ruins",
    behavior: "Ranged Artillery Boss / Bullet-hell Summoner",
    weakness: "Melee Backstabs / Fire Staff",
    drops: [
      { itemName: "Goliath Core Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Ancient Boss Chest Key", chance: "100%", rarityColor: "text-amber-400" },
      { itemName: "Epic/Legendary Weapon Upgrade", chance: "40%", rarityColor: "text-orange-400" }
    ],
    combatTips: [
      "Watch for its 4-directional bullet hell blast; stand at diagonal angles to evade.",
      "Dispatch its summoned minions immediately to prevent getting overwhelmed."
    ]
  },

  // --- LEVEL 2: Obsidian Crypts ---
  "Decayed Skeleton": {
    name: "Decayed Skeleton",
    lore: "Reanimated fossilized remains held together by purple necrotic energy. Their bones are encrusted with volcanic ash, granting them moderate resistance to basic cuts.",
    habitat: "Zone 02 - Obsidian Crypts",
    behavior: "Resilient Melee Guard",
    weakness: "Heavy Axes / Mace Bludgeons",
    drops: [
      { itemName: "Charred Bone Fragment", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Iron Scrap Ore", chance: "30%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Bludgeoning or explosive weapons ignore their bone-plating armor bonuses.",
      "They slow down before swinging; backstep to bait and punish."
    ]
  },
  "Grave Ghoul": {
    name: "Grave Ghoul",
    lore: "A ravenous, skinless scavenger that feeds on necromantic essence. Ghouls travel in packs, using their clawed limbs to climb vault walls and ambush prey.",
    habitat: "Zone 02 - Obsidian Crypts",
    behavior: "High-Speed Assassin / Pack Hunter",
    weakness: "Cleaving weapons / Wide Melee Swings",
    drops: [
      { itemName: "Corrosive Ghoul Claw", chance: "45%", rarityColor: "text-slate-400" },
      { itemName: "Hardened Hide Leather", chance: "30%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Wide arc cleaving weapons like broadswords can strike multiple ghouls in a single swing.",
      "Keep your back to a wall to prevent ghouls from surrounding you."
    ]
  },
  "Crypt Necromancer": {
    name: "Crypt Necromancer",
    lore: "A fallen acolyte of the dark arts who channels purple runic energy. They stand in the back ranks, reanimating minor skeletons and slinging dark spells.",
    habitat: "Zone 02 - Obsidian Crypts",
    behavior: "Necromantic Summoner / Ranged Spellcaster",
    weakness: "Holy damage / High Burst Damage",
    drops: [
      { itemName: "Necromantic Scroll Piece", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Dark Essence Gem", chance: "15%", rarityColor: "text-purple-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Prioritize killing Necromancers first, as they will continuously summon basic skeletons.",
      "Use high-burst single-target weapons to defeat them rapidly."
    ]
  },
  "Necromancer Lich (BOSS)": {
    name: "Necromancer Lich (BOSS)",
    lore: "An undying dark lord who has traded his humanity for absolute control over the grave. He commands massive legions of the dead and can siphon life from his foes.",
    habitat: "Zone 02 - Obsidian Crypts",
    behavior: "Summoner Boss / Life-Siphon Archmage",
    weakness: "Rapid Close Slashes / Holy Smite",
    drops: [
      { itemName: "Phylactery Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Runic Obsidian Wand", chance: "35%", rarityColor: "text-orange-400" },
      { itemName: "Dark Magic Plate Armor", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "In Phase 2, the Lich unleashes an 8-directional projectile storm. Time your dashes perfectly.",
      "Clear his summoned Grave Ghouls immediately or prepare to get pinned."
    ]
  },

  // --- LEVEL 3: Cryo Glaciers / Desert (Wait, level 3 is Desert Scorpion in enemySystem, cryo in LEVEL_THEMES! Let's match the level list in enemySystem.ts) ---
  // Wait, let's look at `enemySystem.ts` level list:
  // Level 1: Forest Slime, Feral Forest Wolf, Forest Goblin Slinger
  // Level 2: Decayed Skeleton, Grave Ghoul, Crypt Necromancer
  // Level 3: Desert Scorpion, Desert Raider Scout, Obsidian Sand Golem -> (Boss: Frostlord Archon? Wait, BOSS_BLUEPRINTS[3] is Frostlord Archon! That's fine, we will list them exactly as they spawn!)
  "Desert Scorpion": {
    name: "Desert Scorpion",
    lore: "A monstrous arachnid mutated by the desert's extreme radiation. Its golden carapace is virtually immune to physical blows, and its tail drips with highly deadly toxins.",
    habitat: "Zone 03 - Cryo Glaciers / Desert Lands",
    behavior: "Heavy Melee Striker",
    weakness: "Ice damage / Piercing Bolts",
    drops: [
      { itemName: "Scorpion Chitin Shell", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Poison Gland Pod", chance: "40%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Its attacks deal heavy damage. Try slowing it down with frost weapons.",
      "Avoid standing directly in front of its giant claws; dodge to the side."
    ]
  },
  "Desert Raider Scout": {
    name: "Desert Raider Scout",
    lore: "A highly trained scout of the nomadic desert raiders, wearing lightweight protective gear. They use speed and sudden ambush tactics to overwhelm prey.",
    habitat: "Zone 03 - Cryo Glaciers / Desert Lands",
    behavior: "High-Speed Raider / Assassin",
    weakness: "Shield Bashes / Heavy Knockback",
    drops: [
      { itemName: "Raider Scarf Bandana", chance: "45%", rarityColor: "text-slate-400" },
      { itemName: "Scrap Metal Plate", chance: "40%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They run in swift, unpredictable patterns; wait for them to pause before striking.",
      "Use a shotgun or heavy-knockback weapon to keep them away."
    ]
  },
  "Obsidian Sand Golem": {
    name: "Obsidian Sand Golem",
    lore: "An animated juggernaut constructed from heavy basalt rock and superheated sand. It moves slowly but can smash a seasoned adventurer to dust in a single impact.",
    habitat: "Zone 03 - Cryo Glaciers / Desert Lands",
    behavior: "Super-Heavy Tank",
    weakness: "Maces / Heavy Railguns",
    drops: [
      { itemName: "Basalt Core Fragment", chance: "65%", rarityColor: "text-slate-400" },
      { itemName: "Obsidian Shard Jewel", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Never trade hits directly with this massive tank; use your mobility advantage.",
      "Its massive health pool makes it vulnerable to damage-over-time effects like burn."
    ]
  },
  "Frostlord Archon (BOSS)": {
    name: "Frostlord Archon (BOSS)",
    lore: "An ancient elemental warden of absolute zero, entombed within unbreakable glacier ice. He channels tempestuous blizzard winds to freeze travelers solid.",
    habitat: "Zone 03 - Cryo Glaciers / Desert Lands",
    behavior: "Glacial Ward Boss / Cryo Summoner",
    weakness: "Fire stream / Heavy Explosives",
    drops: [
      { itemName: "Frostlord Crest Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Glacial Frost Staff", chance: "35%", rarityColor: "text-orange-400" },
      { itemName: "Sub-Zero Ring of Power", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Stand outside his active freezing blizzard circles to avoid severe speed penalties.",
      "In Phase 2, his projectile speeds double; keep moving in wide circles."
    ]
  },

  // --- LEVEL 4: Toxic Refineries / Ice (Let's match enemySystem level 4) ---
  // Level 4 in enemySystem: Frozen Glacier Shard, Frost Wolf Pack-leader, Cryo Ice Mage -> (Boss: Acidic Abomination)
  "Frozen Glacier Shard": {
    name: "Frozen Glacier Shard",
    lore: "A crystalline cluster of sentient permafrost. These fragments slide across cold floors, using their sharp jagged edges to slice through armor plating.",
    habitat: "Zone 04 - Toxic Refineries / Glacier Lands",
    behavior: "Sharp Melee Slider",
    weakness: "Fire / Meltdown element",
    drops: [
      { itemName: "Sentient Ice Crystal", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Glimmering Frost Dust", chance: "40%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Melting them with thermal weapons disables their high-friction sliding speed.",
      "Avoid letting large groups corner you, as their frost spikes deal rapid pierce damage."
    ]
  },
  "Frost Wolf Pack-leader": {
    name: "Frost Wolf Pack-leader",
    lore: "The massive, cybernetically enhanced alpha wolf of the arctic wastes. It leads hunts with chilling growls that empower nearby pack members.",
    habitat: "Zone 04 - Toxic Refineries / Glacier Lands",
    behavior: "Lethal Pack Assassin",
    weakness: "Heavy Melee Slashes / Stun",
    drops: [
      { itemName: "Alpha Frost Claw", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Thick Winter Pelt", chance: "30%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Watch out for its high-speed charge; it always runs in a straight line before leaping.",
      "Use stun traps or heavy shock weapons to halt its lunge mid-air."
    ]
  },
  "Cryo Ice Mage": {
    name: "Cryo Ice Mage",
    lore: "A rogue cryogenic technician mutated by leaking cryo-fluids. They harness absolute-zero elements to cast freezing bolts at trespassers.",
    habitat: "Zone 04 - Toxic Refineries / Glacier Lands",
    behavior: "Ranged Cryo Shooter",
    weakness: "Lightning spears / Plasma Rifles",
    drops: [
      { itemName: "Cryo Battery cell", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Frozen Catalyst Core", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Getting hit by their blue magic bolts will slow down your movement speed considerably.",
      "Dodge their projectiles and slay them quickly, as they have low health pools."
    ]
  },
  "Acidic Abomination (BOSS)": {
    name: "Acidic Abomination (BOSS)",
    lore: "A gelatinous nightmare born from the bio-waste vats of the refinery. It oozes radioactive sludge and can liquefy entire security divisions in seconds.",
    habitat: "Zone 04 - Toxic Refineries / Glacier Lands",
    behavior: "Caustic Bio-Beast Boss",
    weakness: "Ice Freezes / Cryo staff",
    drops: [
      { itemName: "Acidic Heart Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Caustic Spit Cannon", chance: "35%", rarityColor: "text-orange-400" },
      { itemName: "Mutated Hazmat Suit", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Avoid standing in the radioactive puddles it deposits on the ground; they deal massive DPS.",
      "Its protective outer gelatinous shield is highly vulnerable to freezing spells."
    ]
  },

  // --- LEVEL 5: Plasma Core / Ruins (Let's match enemySystem level 5) ---
  // Level 5 in enemySystem: Abyssal Dark Knight, Hellfire Gargoyle, Doom Fire Beast -> (Boss: Cyber Sentinel)
  "Abyssal Dark Knight": {
    name: "Abyssal Dark Knight",
    lore: "A towering spectral warrior encased in heavy slate obsidian plate armor. They walk forward with unwavering determination, deflecting front-facing shots with their shields.",
    habitat: "Zone 05 - Plasma Core / Abyssal Grounds",
    behavior: "Shielded Heavy Tank",
    weakness: "Energy Saber / Plasma beams",
    drops: [
      { itemName: "Obsidian Armor Plate", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Dark Knight Emblem", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Use high-penetration energy weapons or lasers to melt through their shields.",
      "Flank them or wait for them to attack before delivering heavy backstabs."
    ]
  },
  "Hellfire Gargoyle": {
    name: "Hellfire Gargoyle",
    lore: "A flying, winged beast carved from volcanic stone and animated by demonic embers. They ignore ground collisions, soaring over obstacles to ambush players.",
    habitat: "Zone 05 - Plasma Core / Abyssal Grounds",
    behavior: "Soaring Flying Striker",
    weakness: "Ranged arrows / Auto-turrets",
    drops: [
      { itemName: "Stone Wing Fragment", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Volcanic Ash Core", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Gargoyles ignore obstacles entirely; do not try to hide behind ruins.",
      "Deploy automated turrets to shoot them down while you focus on ground threats."
    ]
  },
  "Doom Fire Beast": {
    name: "Doom Fire Beast",
    lore: "A hound-like elemental beast constantly radiating bright orange embers. It shoots highly unstable fireballs that explode in a wide area on contact.",
    habitat: "Zone 05 - Plasma Core / Abyssal Grounds",
    behavior: "Explosive Ranged Artillery",
    weakness: "Ice shards / Blizzard spell",
    drops: [
      { itemName: "Unstable Flame Gland", chance: "55%", rarityColor: "text-slate-400" },
      { itemName: "Magma Crystal Gem", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Keep clear of their impact zones; their fireballs have a large splash radius.",
      "Slow them down with frost attacks to severely delay their explosive charges."
    ]
  },
  "Cyber Sentinel (BOSS)": {
    name: "Cyber Sentinel (BOSS)",
    lore: "A colossal defense mainframe integrated with organic matter. It uses experimental particle beams and automated security protocols to purge non-authorized units.",
    habitat: "Zone 05 - Plasma Core / Abyssal Grounds",
    behavior: "High-Tech Mainframe Boss",
    weakness: "Tesla Overloads / EMP",
    drops: [
      { itemName: "Cyber Sentinel Mainframe Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Mainframe Logic Core", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Experimental Cyber-Plate Shield", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Watch for its rapid laser targeting lines; stay behind obstacles to avoid the mega-beam.",
      "Its high-tech shields can be overloaded with consecutive electric/tesla discharges."
    ]
  },

  // --- LEVEL 6: Ancient Sanctum ---
  // Level 6 in enemySystem: Sentry Core Guardian, Ancient Fire Drake, Sanctum Void Summoner -> (Boss: Ancient Sanctum Dragon)
  "Sentry Core Guardian": {
    name: "Sentry Core Guardian",
    lore: "A mechanical sentinel forged from primordial iron alloys. It guards the inner sanctum, absorbing massive damage before releasing shockwaves.",
    habitat: "Zone 06 - Ancient Sanctum",
    behavior: "Shockwave-Emitting Tank",
    weakness: "Heavy energy damage / Lasers",
    drops: [
      { itemName: "Guardian Core Alloy", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Primordial Iron Slab", chance: "30%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Do not stay inside its glowing radius; its ground slams deal circular area damage.",
      "Use high-penetration energy weapons to deal constant critical hits."
    ]
  },
  "Ancient Fire Drake": {
    name: "Ancient Fire Drake",
    lore: "A majestic, flying reptile that channels raw magma. It sweeps across the combat zone, raining hellfire down upon any trespassers.",
    habitat: "Zone 06 - Ancient Sanctum",
    behavior: "Flying Firestorm Drake",
    weakness: "Cryo spikes / Blizzard Staff",
    drops: [
      { itemName: "Hardened Drake Scale", chance: "55%", rarityColor: "text-slate-400" },
      { itemName: "Everburning Drake Heart", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Its flying nature makes it incredibly fast; stay clear of its swooping paths.",
      "Use ice attacks to freeze its wings and slow down its aerial maneuvers."
    ]
  },
  "Sanctum Void Summoner": {
    name: "Sanctum Void Summoner",
    lore: "A dark master of the outer void, adorned in violet ceremonial robes. It draws strength from unstable black holes, bringing forth nightmare aberrations.",
    habitat: "Zone 06 - Ancient Sanctum",
    behavior: "Void Portal Summoner",
    weakness: "Rapid close range slashes",
    drops: [
      { itemName: "Void Portal Fragment", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Royal Violet Runic Gem", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Its dimensional portals summon minor drakes; close them down by slaying the summoner.",
      "Get up close and use high attack-speed melee weapons to break its spellcasting stance."
    ]
  },
  "Ancient Sanctum Dragon (BOSS)": {
    name: "Ancient Sanctum Dragon (BOSS)",
    lore: "A legendary, gold-scaled dragon resurrected by void radiation. He rules the sanctum with absolute firestorm tempests and impenetrable scales.",
    habitat: "Zone 06 - Ancient Sanctum",
    behavior: "Firestorm Dragon Overlord Boss",
    weakness: "Cryo freeze / Frost repeater",
    drops: [
      { itemName: "Sanctum Dragon Scale Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Inferno Dragon Claw", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Dragonheart Ring", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Its breath covers wide sectors of the arena; use swift dashes to escape the fire cone.",
      "Maintain distance and strike during its attack recovery phases."
    ]
  },

  // --- LEVEL 7: Sub-Zero Core ---
  "Frozen Sentry": {
    name: "Frozen Sentry",
    lore: "A heavy security mechanoid encrusted in hyper-dense glacier ice. It acts as a mobile shield wall, freezing nearby players who dare approach.",
    habitat: "Zone 07 - Sub-Zero Core",
    behavior: "Glacial Protection Tank",
    weakness: "Flamethrower / Fire stream",
    drops: [
      { itemName: "Frozen Sentry Core", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Gilded Glacier Plate", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "The Frozen Sentry is highly resistant to standard bullets; use fire to melt its armor.",
      "Stay at mid-range to avoid being caught in its freezing field."
    ]
  },
  "Cryo Spook": {
    name: "Cryo Spook",
    lore: "A spectral assassin that drifts through ice walls. It teleports into the blind spots of defensive squads, performing lethal armor-piercing strikes.",
    habitat: "Zone 07 - Sub-Zero Core",
    behavior: "Teleporting Cryo Assassin",
    weakness: "Laser pulses / SMG spray",
    drops: [
      { itemName: "Phantasm Veil Dust", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Cryo Spook Blade", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Watch for its shimmering teleportation particles; prepare to dodge instantly.",
      "High rate-of-fire weapons like the SMG are best to strike it down before it slips away."
    ]
  },
  "Blizzard Shaman": {
    name: "Blizzard Shaman",
    lore: "An ancient cultist who has fused with the reactor's coolant fluids. It channels miniature blizzard tempests that sweep across the battlefield.",
    habitat: "Zone 07 - Sub-Zero Core",
    behavior: "Area-Control Stormcaller",
    weakness: "Tesla bolts / Electric arcs",
    drops: [
      { itemName: "Shaman Runic Staff Piece", chance: "65%", rarityColor: "text-slate-400" },
      { itemName: "Coolant Reactor Fluid", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Avoid standing inside its tracking frost tempests; they deal rapid ticks of frost damage.",
      "Discharge electricity on them; their wet bodies are highly vulnerable to shock damage."
    ]
  },
  "Frost Monarch Titan (BOSS)": {
    name: "Frost Monarch Titan (BOSS)",
    lore: "A titanic, mechanical behemoth integrated with ancient frozen artifacts. It guards the reactor core, wielding massive ice swords that can split glaciers.",
    habitat: "Zone 07 - Sub-Zero Core",
    behavior: "Glacial Overlord Titan Boss",
    weakness: "Meltdown Fire / Rocket barrage",
    drops: [
      { itemName: "Frost Monarch Crest Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Titan Ice Blade", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Glacial Monarch Crown", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Its gigantic sword arcs hit almost half the screen. Dash directly through its swing to get behind.",
      "Use heavy explosive rocket fire to shatter its frosty plate defenses."
    ]
  },

  // --- LEVEL 8: Gilded Vaults ---
  "Mummy Guardian": {
    name: "Mummy Guardian",
    lore: "The mummified remains of ancient rulers, wrapped in cursed linen threads and preserved with chemical mutagens. They absorb immense physical impact.",
    habitat: "Zone 08 - Gilded Vaults",
    behavior: "Cursed Indestructible Walker",
    weakness: "Wind blades / Knockback",
    drops: [
      { itemName: "Cursed Linen Wrap", chance: "55%", rarityColor: "text-slate-400" },
      { itemName: "Ancient Pharaoh Gold", chance: "35%", rarityColor: "text-amber-500" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Their wraps make them vulnerable to cutting wind blades; use pushback to keep them at distance.",
      "Beware their curse aura, which slows down your healing rates if you stay too close."
    ]
  },
  "Golden Scarab": {
    name: "Golden Scarab",
    lore: "A flying, crystalline insect that feeds on raw gold and energy coins. They swarm rapidly, charging at targets with armor-shredding metallic pincers.",
    habitat: "Zone 08 - Gilded Vaults",
    behavior: "Flying Armor-Shredder Swarmer",
    weakness: "Scattershot shotgun / Wide cleaves",
    drops: [
      { itemName: "Polished Golden Shell", chance: "50%", rarityColor: "text-amber-500" },
      { itemName: "Gilded Pincer Horn", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They fly incredibly fast and attack in packs. Bring a shotgun to dispatch several at once.",
      "Use defensive armor plate mods to neutralize their armor-shredding properties."
    ]
  },
  "Anubis Priest": {
    name: "Anubis Priest",
    lore: "A jackal-headed priest who channels solar fire and necrotic energy. They stand back, summoning reanimated mummies and calling down pillars of golden light.",
    habitat: "Zone 08 - Gilded Vaults",
    behavior: "Solar Summoner / High Priest",
    weakness: "Sniper bullets / Long Range",
    drops: [
      { itemName: "Priest Jackal Mask", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Solar Fire Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Slay them from distance with a Sniper Rifle before they fill the screen with summoned mummies.",
      "Avoid standing in their glowing golden pillars of light; they deal heavy ticks of damage."
    ]
  },
  "Gilded Pharaoh Wraith (BOSS)": {
    name: "Gilded Pharaoh Wraith (BOSS)",
    lore: "An ancient spectral emperor, adorned in solid gold plate armor. He channels the power of a dying star, drowning the chamber in golden fire and sandstorms.",
    habitat: "Zone 08 - Gilded Vaults",
    behavior: "Solar Deity Boss / Wraith Emperor",
    weakness: "Void Staff / Chrono repeater",
    drops: [
      { itemName: "Gilded Pharaoh Mask Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Scepter of Solar Judgement", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Emperor's Golden Plate", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "During his sandstorm phase, your visibility is reduced; look for the glowing circles to find safety.",
      "Use void or dark magic weapons to quickly disintegrate his solar protective shields."
    ]
  },

  // --- LEVEL 9: Deep Void Abyss ---
  "Void Golem": {
    name: "Void Golem",
    lore: "A monstrous entity constructed from anti-matter and dark purple crystals. Its colossal form absorbs projectile impacts, pulling close targets into its gravitational field.",
    habitat: "Zone 09 - Deep Void Abyss",
    behavior: "Gravitational Void Golem",
    weakness: "Fire staff / Flame stream",
    drops: [
      { itemName: "Anti-Matter Core", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Void Crystal Shard", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Be careful not to get pulled into its melee gravity slam; stay at maximum range.",
      "Ignite them with fire staff blasts to deal continuous damage that bypasses void armor."
    ]
  },
  "Eldritch Stalker": {
    name: "Eldritch Stalker",
    lore: "A multi-limbed nightmare creature that slips through space-time folds. It strikes silently from behind, leaving a trail of dark void shadow particles.",
    habitat: "Zone 09 - Deep Void Abyss",
    behavior: "Anti-Matter Assassin / teleporter",
    weakness: "Quantum beams / Lasers",
    drops: [
      { itemName: "Eldritch Eye Gland", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Anti-Matter Essence Dust", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They strike rapidly from the shadows; listen for their signature screech before dodging.",
      "High-precision laser weapons are highly effective at tracking and melting their anti-matter forms."
    ]
  },
  "Abyss Spitter": {
    name: "Abyss Spitter",
    lore: "A floating void aberration with a massive glowing eye. It discharges highly unstable dark matter spheres that break into secondary seeking projectiles on impact.",
    habitat: "Zone 09 - Deep Void Abyss",
    behavior: "Ranged Anti-Matter Artillery",
    weakness: "Ice freeze / Slowdown",
    drops: [
      { itemName: "Abyss Eye Lens", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Dark Matter Catalyst", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Do not try to block their shots directly; their dark matter spheres break into multiple splitting bolts.",
      "Keep them frozen or slowed down to disrupt their spelling cycles."
    ]
  },
  "Herald of Void (BOSS)": {
    name: "Herald of Void (BOSS)",
    lore: "An ancient cosmic horror representing the void's hunger. He can tear open dimensional rifts, summoning infinite aberrations and devouring space-time.",
    habitat: "Zone 09 - Deep Void Abyss",
    behavior: "Cosmic Horror Void Overlord",
    weakness: "Quantum Meltdown / Heavy Railguns",
    drops: [
      { itemName: "Herald Core Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Void Singularity Staff", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Abyssal Void Plate Armor", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "In Phase 2, he creates active void vortexes that pull you in. Dash in the opposite direction.",
      "Bring high single-target burst weapons to destroy his rift portals before aberrations flood the arena."
    ]
  },

  // --- LEVEL 10: Volcanic Fissures ---
  "Magma Slag": {
    name: "Magma Slag",
    lore: "A boiling mass of sentient volcanic slag and molten iron. It slides across fissure floors, leaving a persistent trail of fire that burns on contact.",
    habitat: "Zone 10 - Volcanic Fissures",
    behavior: "Molten Fire Trailer",
    weakness: "Ice blasts / Cryo arrows",
    drops: [
      { itemName: "Molten Slag Core", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Raw Volcanic Iron Ore", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Avoid crossing their fiery paths, as the fire trail deals rapid fire DPS.",
      "Extinguish them with ice blasts to permanently slow down their movement and trail rate."
    ]
  },
  "Lava Fly": {
    name: "Lava Fly",
    lore: "A winged insect living inside hyper-hot volcanic vents. They fly in swift swarms, igniting players with rapid fire bites and hyper-speed charges.",
    habitat: "Zone 10 - Volcanic Fissures",
    behavior: "Hyper-Speed Flying Igniter",
    weakness: "Water & Wind pushbacks",
    drops: [
      { itemName: "Lava Fly Wing", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Molten Ember Pod", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They charge in straight lines; dodge sideways and use wide attacks to knock them back.",
      "Wind staves are exceptional for throwing them into fissure walls."
    ]
  },
  "Volcano Pyromancer": {
    name: "Volcano Pyromancer",
    lore: "A high cultist of the igneous flame, wielding a volcanic staff. They stand back, summoning molten lava slag and calling down meteor showers.",
    habitat: "Zone 10 - Volcanic Fissures",
    behavior: "Meteor Summoner / Pyromancer",
    weakness: "Heavy Rockets / Long Range",
    drops: [
      { itemName: "Pyromancer Staff Core", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Igneous Meteor Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Watch for the meteor impact shadow circles on the ground; step away immediately.",
      "Use long-range rocket launchers to defeat them before they complete spellcasting."
    ]
  },
  "Infernus Magma Lord (BOSS)": {
    name: "Infernus Magma Lord (BOSS)",
    lore: "The supreme igneous elemental ruler, bound inside a colossal armor of solidified volcanic basalt. He commands lava streams and meteor cataclysms.",
    habitat: "Zone 10 - Volcanic Fissures",
    behavior: "Lava Deity / Cataclysm Overlord Boss",
    weakness: "Glacial Freeze / Absolute Zero Staff",
    drops: [
      { itemName: "Infernus Magma Heart Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Magma Lord Greatsword", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Igneous Fire-Plate Mail", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "In Phase 2, he rages, filling the arena with intersecting lava streams and continuous meteors.",
      "Keep him frozen with high-potency absolute-zero staves to reduce his movement rate to a crawl."
    ]
  },

  // --- LEVEL 11: Scrap Yards ---
  "Rusty Mech-Droid": {
    name: "Rusty Mech-Droid",
    lore: "An old security unit abandoned in the waste yards, re-activated by chemical leaks. Its heavy iron armor plates are highly resistant to standard cuts.",
    habitat: "Zone 11 - Scrap Yards",
    behavior: "Heavy Iron Armored Mech",
    weakness: "Tesla lightning / Electric arcs",
    drops: [
      { itemName: "Rusty Gear Part", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Heavy Iron Scrap Slab", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Standard bullet fire bounces off their scrap plate armor; use high-voltage shock staves.",
      "Stunning them with electricity completely disables their armor bonuses."
    ]
  },
  "Scrap-Drone": {
    name: "Scrap-Drone",
    lore: "A small, flying scavenger drone equipped with rapid-firing micro lasers. They travel in tight formations, hovering over junk piles to fire at targets.",
    habitat: "Zone 11 - Scrap Yards",
    behavior: "Flying Laser Swarmer",
    weakness: "Laser pistol / SMG spray",
    drops: [
      { itemName: "Scrap Microchip core", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Gimbal Lens Scanner", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Their micro lasers deal rapid minor damage; use SMGs or rapid-firing weapons to pop them quickly.",
      "They hover high, which makes them immune to ground-based traps or fire trails."
    ]
  },
  "Laser Sentry": {
    name: "Laser Sentry",
    lore: "A stationary defense turret mounted on a mechanical tripod. It charges highly focused thermal laser beams that track targets across wide sectors.",
    habitat: "Zone 11 - Scrap Yards",
    behavior: "Stationary Laser Artillery",
    weakness: "Sniper charged beam / Rockets",
    drops: [
      { itemName: "Laser Optical Prism", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Sentry Tripod Frame", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Stand behind junk mounds to break their laser locks before they complete charging.",
      "Shoot them down from maximum range with a Sniper Rifle."
    ]
  },
  "A.I. Mecha Dreadnought (BOSS)": {
    name: "A.I. Mecha Dreadnought (BOSS)",
    lore: "A super-heavy tank mainframe fused with chaotic AI matrices. It utilizes missile barrages, high-energy particle rays, and personal shield fields to annihilate targets.",
    habitat: "Zone 11 - Scrap Yards",
    behavior: "Chaotic AI Warmachine Boss",
    weakness: "Tesla overloads / Heavy EMP Staff",
    drops: [
      { itemName: "Dreadnought CPU Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "A.I. Particle Cannon", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Dreadnought Exo-Armor Shell", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "In Phase 2, he fires continuous seeking missiles; keep dashing to stay ahead of the explosion radii.",
      "Discharge high-tier electric/tesla weapons to short-circuit his personal energy shields."
    ]
  },

  // --- LEVEL 12: Phantasm Realm ---
  "Shadow Shade": {
    name: "Shadow Shade",
    lore: "A shadowy apparition that drifts through dark voids. It slides across the battlefield, draining the lifespans of nearby biological targets.",
    habitat: "Zone 12 - Phantasm Realm",
    behavior: "Spectral Lifeforce Drainer",
    weakness: "Chrono repeater / Laser fire",
    drops: [
      { itemName: "Ectoplasmic Shimmer Dust", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Spectral Phantasm Veil", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Do not stand close to Shadow Shades; their passive aura drains health continuously.",
      "Strike them down from mid-range with Chrono Repeaters or laser weapons."
    ]
  },
  "Phantasm Ripper": {
    name: "Phantasm Ripper",
    lore: "A multi-armed terror with glowing violet eyes that teleports from the spirit realm. It strikes with massive hyper-speed claws before slipping away.",
    habitat: "Zone 12 - Phantasm Realm",
    behavior: "Lethal Teleporting assassin",
    weakness: "Void staff / Blackhole pull",
    drops: [
      { itemName: "Ripper Runic Claws", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Phantasm Shimmer Gem", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They teleport behind you right before executing their claw sweep. Be ready to dash forward.",
      "Use a Void Staff black hole to pull them in and lock them in place."
    ]
  },
  "Dread Summoner": {
    name: "Dread Summoner",
    lore: "A towering phantasm acolyte clad in ancient void-woven robes. It stand back, calling forth legion souls and shooting homing necrotic skulls.",
    habitat: "Zone 12 - Phantasm Realm",
    behavior: "Necrotic High Summoner",
    weakness: "Scattershot shotgun / Rapid swings",
    drops: [
      { itemName: "Cursed Spellscroll Piece", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Void Skull Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Their homing skulls trace your path; dash sideways to break their seeking lock.",
      "Pummel them up close with a shotgun to break their summoning rituals instantly."
    ]
  },
  "Shoggoth Horror (BOSS)": {
    name: "Shoggoth Horror (BOSS)",
    lore: "A massive, formless nightmare aberration made of teeth, eyes, and shifting anti-matter. It eats reality, tearing open massive necrotic voids.",
    habitat: "Zone 12 - Phantasm Realm",
    behavior: "Reality-Devouring Eldritch Boss",
    weakness: "Chrono repeater / Rapid SMG fire",
    drops: [
      { itemName: "Shoggoth Eldritch Heart Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Devourer Eldritch Maw", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Shroud of the Old Gods", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Its shifting form makes it immune to basic crowd controls. Maintain constant circular movement.",
      "Use Chrono Repeaters to accelerate its decay rate and melt its massive health pool."
    ]
  },

  // --- LEVEL 13: Thunder Tempest ---
  "Storm Golem": {
    name: "Storm Golem",
    lore: "A massive mechanical giant powered by heavy electrical lightning cells. It marches forward slowly, releasing lightning bolts that chain between targets.",
    habitat: "Zone 13 - Thunder Tempest",
    behavior: "Chaining Lightning Tank",
    weakness: "Fire staff / Flame explosions",
    drops: [
      { itemName: "Storm Golem Core Plate", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Lightning Cell battery", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Avoid standing near companions or companion drones, as its lightning chains between targets.",
      "Ignite them with high-explosive fire staff blasts to bypass their copper insulation plates."
    ]
  },
  "Volt Sprite": {
    name: "Volt Sprite",
    lore: "A small, highly volatile flying spark that floats inside electrical storm clouds. It moves at hyper-speed, exploding in electrical discharge upon contact.",
    habitat: "Zone 13 - Thunder Tempest",
    behavior: "Hyper-Speed Flying spark / Kamikaze",
    weakness: "Wind staff pushbacks / Slow",
    drops: [
      { itemName: "Volt Spark dust", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Volt Sprite Capsule", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They fly at extreme speeds. Use a Wind Staff to blow them away before they get close.",
      "Slaying them triggers a minor electrical explosion; stand clear."
    ]
  },
  "Thunder Mage": {
    name: "Thunder Mage",
    lore: "A high acolyte of the storm currents, clad in sky-cyan robes. They stand back, slinging chain-lightning balls and calling down lightning strikes.",
    habitat: "Zone 13 - Thunder Tempest",
    behavior: "Chain-Lightning Stormcaller",
    weakness: "Ice slowdown / Cryo staves",
    drops: [
      { itemName: "Mage Cyan Robe Cloth", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Thunder Tempest Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Watch for the glowing tracking sparks on the ground, signaling a lightning strike.",
      "Freeze them with Cryo Staves to shut down their swift electrical spellcasting."
    ]
  },
  "Valkyrie Archon (BOSS)": {
    name: "Valkyrie Archon (BOSS)",
    lore: "The legendary warrior guardian of the storm clouds, resurrecting ancient lightning arrays. She flies through the heavens, throwing massive electric spears.",
    habitat: "Zone 13 - Thunder Tempest",
    behavior: "Storm Archon Valkyrie Boss",
    weakness: "Glacial permafrost / Sniper shots",
    drops: [
      { itemName: "Valkyrie Spear Fragment Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Storm Valkyrie Spear", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Archon Lightning Mail", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Her electric spears explode in a wide cross-shaped pattern on impact; dodge diagonally.",
      "Strike her down from maximum range with Sniper charged shots while she channels storm waves."
    ]
  },

  // --- LEVEL 14: Toxic Marshes ---
  "Marsh Behemoth": {
    name: "Marsh Behemoth",
    lore: "A giant reptilian monster swollen with acidic marsh fluids. It moves slowly but can absorb massive physical impacts, discharging poisonous gases when struck.",
    habitat: "Zone 14 - Toxic Marshes",
    behavior: "Poison-Emitting Heavy Tank",
    weakness: "Flamethrower / Fire storms",
    drops: [
      { itemName: "Behemoth Toxic Hide", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Swamp Behemoth Core", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Its toxic gas cloud expands as its health drops. Use fire to ignite and burn the gas.",
      "Bring a Flamethrower to deal massive continuous damage to its damp, mutated skin."
    ]
  },
  "Swamp Lurker": {
    name: "Swamp Lurker",
    lore: "A highly camouflaged predator that crawls through deep muddy swamps. It rushes out of nowhere, biting targets with venomous fangs.",
    habitat: "Zone 14 - Toxic Marshes",
    behavior: "Mud Camouflage assassin",
    weakness: "Tesla bolts / Chain shock",
    drops: [
      { itemName: "Lurker Toxic Tooth", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Mud-Stained Swatch", chance: "20%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They are hard to see while moving in muddy waters. Watch for ripples.",
      "Shock them with electricity; the wet marsh mud conducts chain-lightning perfectly."
    ]
  },
  "Mire Spitter": {
    name: "Mire Spitter",
    lore: "A bloated insectoid that feeds on caustic swamp chemicals. It spits long-range chemical globs that coat armor plates, reducing player defense.",
    habitat: "Zone 14 - Toxic Marshes",
    behavior: "Armor-Melting Ranged Spitter",
    weakness: "Sniper Rifle / Long Range",
    drops: [
      { itemName: "Mire Spitter Eye", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Caustic Swamp Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Getting hit by their green globs weakens your defense rating. Avoid contact at all costs.",
      "Slay them from maximum range before their spit targets you."
    ]
  },
  "Hydra Swamp Terror (BOSS)": {
    name: "Hydra Swamp Terror (BOSS)",
    lore: "A monstrous, multi-headed swamp serpent reanimated by radioactive chemicals. It floods the entire marsh chamber in waves of caustic acid.",
    habitat: "Zone 14 - Toxic Marshes",
    behavior: "Multi-Headed Caustic Hydra Boss",
    weakness: "Heavy rockets / MagmaGreatsword",
    drops: [
      { itemName: "Hydra Fangs Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Viper Caustic SMG", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Hydra scale Vest", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "Each head fires separate spit barrages. Focus on moving in wide arches around the beast.",
      "Unleash explosive rocket barrages to strike multiple heads simultaneously for maximum damage."
    ]
  },

  // --- LEVEL 15: Chrono Convergence ---
  "Temporal Centurion": {
    name: "Temporal Centurion",
    lore: "An ancient legion warrior brought through time folds, wielding chronometer weaponry. It moves in sudden hyper-speed sprints, deflecting slower shots.",
    habitat: "Zone 15 - Chrono Convergence",
    behavior: "Temporal Deflecting Tank",
    weakness: "Quantum beam / Lasers",
    drops: [
      { itemName: "Temporal Armor Plate", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Chrono Cell core", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Their chrono shields deflect slower physical bullets; melt them with high-precision lasers.",
      "Dodge their sudden warp rushes by jumping or dashing sideways."
    ]
  },
  "Chrono-Stalker": {
    name: "Chrono-Stalker",
    lore: "A highly deadly shadow stalker that shifts through time streams. It blinks constantly across the battlefield, striking down targets with temporal blades.",
    habitat: "Zone 15 - Chrono Convergence",
    behavior: "Warp Blinking assassin",
    weakness: "Void staff singularity",
    drops: [
      { itemName: "Warp Stalker Claws", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Temporal Shimmer Core", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They blink constantly, making them difficult to target. Use AOE crowd control to lock them.",
      "Deploy a Void Staff singularity to pull them out of their blink animation and freeze them."
    ]
  },
  "Time Weaver": {
    name: "Time Weaver",
    lore: "A dark seer manipulating the chronometer flow. They stand back, slinging slow-running temporal rifts and calling forth centurions from alternative times.",
    habitat: "Zone 15 - Chrono Convergence",
    behavior: "Chrono Summoner / High Seer",
    weakness: "Heavy Rocket explosions",
    drops: [
      { itemName: "Seer Time Robe Cloth", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Chrono Rift Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Standing inside their purple chrono rifts reduces your movement and reload speed to zero.",
      "Blast them with rockets before they fill the screen with slowing rifts."
    ]
  },
  "Chrono Architect (BOSS)": {
    name: "Chrono Architect (BOSS)",
    lore: "The supreme master of the chronometer flows, seeking to reconstruct timeline matrices. He controls temporal rifts, warping reality and calling cataclysmic timelines.",
    habitat: "Zone 15 - Chrono Convergence",
    behavior: "Master of Timelines Boss / Chrono Deity",
    weakness: "Void Singularity / Plasma cannon",
    drops: [
      { itemName: "Chrono Chronometer Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Staff of Chrono Matrix", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Architect Time Armor", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "In Phase 2, he warps space-time, shifting your positions. Be prepared to orient your direction instantly.",
      "Overload his temporal matrices with high-energy plasma blasts."
    ]
  },

  // --- LEVEL 16: Cosmic Ascension ---
  "Celestial Archon": {
    name: "Celestial Archon",
    lore: "A pure cosmic energy entity that has taken physical form inside heavy titanium alloys. It floats slowly, discharging massive solar plasma flares.",
    habitat: "Zone 16 - Cosmic Ascension",
    behavior: "Cosmic Flare Emission Tank",
    weakness: "Chrono repeater decay",
    drops: [
      { itemName: "Celestial Titanium Plate", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Cosmic Solar Battery", chance: "35%", rarityColor: "text-slate-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Their cosmic flares deal circular burn damage. Stay outside their light halo.",
      "Use Chrono Repeaters to quickly drain their solar battery core."
    ]
  },
  "Nebula Stalker": {
    name: "Nebula Stalker",
    lore: "A beautiful but lethal flying predator born inside nebula clouds. It flies at extreme speeds, striking with highly concentrated cosmic lasers.",
    habitat: "Zone 16 - Cosmic Ascension",
    behavior: "Flying Nebula Predator / Laser",
    weakness: "Glacial freeze & Rockets",
    drops: [
      { itemName: "Nebula Wings Shimmer", chance: "50%", rarityColor: "text-slate-400" },
      { itemName: "Cosmic Crystal Core", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "They sweep rapidly across the sky. Freeze them in place with glacial staves.",
      "Blast them with explosive rockets while they are locked down."
    ]
  },
  "Cosmic Creator Minion": {
    name: "Cosmic Creator Minion",
    lore: "A primordial servant summoned from alternative worlds by the Deity. It stands back, firing star shards that track player movements.",
    habitat: "Zone 16 - Cosmic Ascension",
    behavior: "Star-Shard Summoner / Servant",
    weakness: "Viper SMG / Rapid Fire Staff",
    drops: [
      { itemName: "Servant Star Shard", chance: "60%", rarityColor: "text-slate-400" },
      { itemName: "Creator Aura Catalyst", chance: "25%", rarityColor: "text-blue-400" },
      { itemName: "XP Essence", chance: "100%", rarityColor: "text-emerald-400" }
    ],
    combatTips: [
      "Dodge their seeking star shards; they curve towards your position.",
      "Use high attack-speed SMGs to pop them before they release multiple shards."
    ]
  },
  "Cosmic Creator Deity (BOSS)": {
    name: "Cosmic Creator Deity (BOSS)",
    lore: "The supreme cosmic architect of the Isometric Universe, who has orchestrated the evolutionary outbreak. He wields the raw creative powers of the cosmos.",
    habitat: "Zone 16 - Cosmic Ascension",
    behavior: "Supreme Cosmos Deity Creator Boss",
    weakness: "Lichfire Greatsword / Hyper SMG Overload",
    drops: [
      { itemName: "Creator Cosmos Eye Trophy", chance: "100% (Definite Drop)", rarityColor: "text-purple-400 font-bold" },
      { itemName: "Deity Cosmic Laser Rifle", chance: "45%", rarityColor: "text-orange-400" },
      { itemName: "Exotic Universe Plate Plate", chance: "45%", rarityColor: "text-purple-400" }
    ],
    combatTips: [
      "His final phase triggers absolute bullet hell; use every dash and potion defensively.",
      "Unleash fully upgraded Lichfire weapons or SMGs to penetrate his transcendent shell."
    ]
  }
};
