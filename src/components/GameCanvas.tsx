import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Skull, Crown, Pause, Award } from 'lucide-react';
import { Character, Enemy, Projectile, ResourceNode, GroundItem, Particle, TextPop, GameState, WeaponId, ZombieType, Deployable } from '../types';
import { WEAPONS, LEVEL_THEMES, GRID_SIZE, ISO_TILE_WIDTH, ISO_TILE_HEIGHT, generateRandomLootItem } from '../constants';
import Joystick from './Joystick';
import HUD from './HUD';
import CraftingMenu from './CraftingMenu';
import { audio } from '../lib/audio';

// Modular RPG systems
import { saveSystem } from '../systems/saveSystem';
import { generateBossLootTable, GameItem } from '../systems/lootSystem';
import { spawnLevelEnemy, spawnLevelBoss, updateEnemyMovementAI } from '../systems/enemySystem';
import LootRewardModal from './LootRewardModal';

interface GameCanvasProps {
  startingLevel: number;
  onReturnToMenu: () => void;
}

interface LevelZone {
  type: string;
  x: number;
  y: number;
  radius: number;
}

const getLevelZones = (level: number): LevelZone[] => {
  switch (level) {
    case 1:
      return [
        { type: 'heal', x: 10, y: 8, radius: 1.8 },
        { type: 'heal', x: 22, y: 24, radius: 1.8 },
        { type: 'speed', x: 8, y: 24, radius: 1.4 },
        { type: 'speed', x: 24, y: 8, radius: 1.4 },
      ];
    case 2:
      return [
        { type: 'lava', x: 11, y: 10, radius: 1.6 },
        { type: 'lava', x: 21, y: 22, radius: 1.6 },
        { type: 'lava', x: 8, y: 24, radius: 1.6 },
      ];
    case 3:
      return [
        { type: 'heal', x: 12, y: 12, radius: 1.8 }, // hot geyser thermal spring
        { type: 'frost', x: 9, y: 22, radius: 1.5 },
        { type: 'frost', x: 22, y: 9, radius: 1.5 },
        { type: 'frost', x: 16, y: 24, radius: 1.6 },
      ];
    case 4:
      return [
        { type: 'acid', x: 10, y: 11, radius: 1.7 },
        { type: 'acid', x: 22, y: 21, radius: 1.7 },
        { type: 'speed', x: 16, y: 8, radius: 1.5 },
        { type: 'acid', x: 8, y: 24, radius: 1.6 },
      ];
    case 5:
      return [
        { type: 'lava', x: 10, y: 22, radius: 1.6 }, // Plasma surge
        { type: 'acid', x: 22, y: 10, radius: 1.6 }, // Corrosive leak
        { type: 'heal', x: 16, y: 16, radius: 2.0 }, // Central stabilizer nexus
        { type: 'speed', x: 24, y: 24, radius: 1.5 },
      ];
    default:
      return [];
  }
};

const generateRandomRivers = (gridSize: number): boolean[][] => {
  const map: boolean[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
  
  // Create organic horizontal river
  let curY = Math.floor(Math.random() * (gridSize - 16)) + 8; // Start between 8 and 23
  const hWidth = 3;
  for (let x = 0; x < gridSize; x++) {
    // Wander slightly with 45% chance
    if (Math.random() < 0.45) {
      curY += Math.random() < 0.5 ? -1 : 1;
      curY = Math.max(3, Math.min(gridSize - 3 - hWidth, curY));
    }
    for (let w = 0; w < hWidth; w++) {
      if (curY + w >= 0 && curY + w < gridSize) {
        map[x][curY + w] = true;
      }
    }
  }

  // Create organic vertical river
  let curX = Math.floor(Math.random() * (gridSize - 16)) + 8; // Start between 8 and 23
  const vWidth = 3;
  for (let y = 0; y < gridSize; y++) {
    // Wander slightly with 45% chance
    if (Math.random() < 0.45) {
      curX += Math.random() < 0.5 ? -1 : 1;
      curX = Math.max(3, Math.min(gridSize - 3 - vWidth, curX));
    }
    for (let w = 0; w < vWidth; w++) {
      if (curX + w >= 0 && curX + w < gridSize) {
        map[curX + w][y] = true;
      }
    }
  }

  return map;
};

export default function GameCanvas({ startingLevel, onReturnToMenu }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentLevel, setCurrentLevel] = useState(startingLevel);

  // Core React States for UI synchronization
  const [gameState, setGameState] = useState<GameState>({
    currentWave: 1,
    zombiesKilled: 0,
    score: 0,
    gameStatus: 'playing',
    waveTimer: 10,
    waveActive: false,
    level: startingLevel,
  });

  const [playerState, setPlayerState] = useState<Character>({
    x: GRID_SIZE / 2,
    y: GRID_SIZE / 2,
    targetX: GRID_SIZE / 2,
    targetY: GRID_SIZE / 2,
    health: 100,
    maxHealth: 100,
    xp: 0,
    nextLevelXp: 100,
    level: 1,
    speed: 2.8, // grid units per second
    baseDamage: 5,
    armor: 2,
    facingAngle: 0,
    activeWeapon: 'pistol',
    inventory: { wood: 50, metal: 25, gem: 5 },
    craftedWeapons: ['pistol'],
    potionsCount: 3,
    items: [],
    equippedItemIds: [],
    dashTimer: 0,
    dashCooldown: 0,
    comboCount: 0,
    comboTimer: 0,
    spikeTrapsCount: 2,
    teslaTurretsCount: 1,
    hasCompanionDrone: false,
  });

  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  
  // Boss Loot Reward States
  const [activeBossLoot, setActiveBossLoot] = useState<GameItem[] | null>(null);
  const [activeBossName, setActiveBossName] = useState("");
  const isLootModalActiveRef = useRef(false);

  useEffect(() => {
    isLootModalActiveRef.current = activeBossLoot !== null;
  }, [activeBossLoot]);

  // Powerups and Weather React States for HUD
  const [currentWeather, setCurrentWeather] = useState<'clear' | 'storm' | 'blizzard' | 'ashfall' | 'toxic_fog' | 'plasma_tempest'>('clear');
  const [weatherTimer, setWeatherTimer] = useState(30.0);
  const [activePlacement, setActivePlacement] = useState<'spike_trap' | 'tesla_turret' | null>(null);
  const [activePowerupsState, setActivePowerupsState] = useState({ doubleDamage: 0, hyperSpeed: 0, forceShield: 0, magnet: 0 });

  // References to keep game loop variables running synchronously without closure staleness
  const gameLoopRef = useRef<number | null>(null);
  const playerRef = useRef<Character>({ ...playerState });
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const resourceNodesRef = useRef<ResourceNode[]>([]);
  const groundItemsRef = useRef<GroundItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textPopsRef = useRef<TextPop[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const targetJoystickVectorRef = useRef({ x: 0, y: 0 });
  const mouseScreenRef = useRef({ x: 0, y: 0 });
  const riverMapRef = useRef<boolean[][]>([]);

  // Base Deployables, Companion orbit tracking, and weather loops
  const deployablesRef = useRef<Deployable[]>([]);
  const mouseGridPosRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const companionDronePosRef = useRef<{ x: number, y: number, screenX: number, screenY: number }>({ x: 0, y: 0, screenX: 0, screenY: 0 });
  const companionDroneAttackCooldownRef = useRef<number>(0);
  const lightningTimerRef = useRef<number>(0);
  const currentWeatherRef = useRef<'clear' | 'storm' | 'blizzard' | 'ashfall' | 'toxic_fog' | 'plasma_tempest'>('clear');
  const weatherTimerRef = useRef<number>(30.0);
  const activePowerupsRef = useRef<{ doubleDamage: number, hyperSpeed: number, forceShield: number, magnet: number }>({ doubleDamage: 0, hyperSpeed: 0, forceShield: 0, magnet: 0 });
  const tileCacheRef = useRef<Record<string, HTMLCanvasElement>>({});
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game configuration variables
  const levelTheme = LEVEL_THEMES[(gameState.level - 1) % LEVEL_THEMES.length] || LEVEL_THEMES[0];
  const totalWaves = 10; // 10 waves total, bosses at waves 5 and 10

  // Action timers / cooldowns
  const attackCooldownRef = useRef(0);
  const muzzleFlashTimerRef = useRef(0);
  const weaponRecoilRef = useRef(0);
  const waveTimerRef = useRef(10); // Countdown to start wave
  const waveActiveRef = useRef(false);
  const currentWaveRef = useRef(1);
  const zombiesKilledRef = useRef(0);
  const scoreRef = useRef(0);

  // Keep references in sync with state for rendering updates
  useEffect(() => {
    playerRef.current = playerState;
  }, [playerState]);

  // Handle Background Music play/stop state
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      audio.playBgm(gameState.level);
    } else {
      audio.stopBgm();
    }
    return () => {
      audio.stopBgm();
    };
  }, [gameState.gameStatus, gameState.level]);

  // Screen size state
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle ResizeObserver to maintain full viewport compatibility
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 320),
          height: Math.max(height, 240),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize Level Map (Trees, Metal nodes, Gems)
  const initMapResources = useCallback(() => {
    // Set level-thematic starting weather
    const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
    let initialWeather: 'clear' | 'storm' | 'blizzard' | 'ashfall' | 'toxic_fog' | 'plasma_tempest' = 'clear';
    if (activeLevelIndex === 3 || activeLevelIndex === 7) {
      initialWeather = 'blizzard';
    } else if (activeLevelIndex === 2 || activeLevelIndex === 6 || activeLevelIndex === 10) {
      initialWeather = 'ashfall';
    } else if (activeLevelIndex === 4 || activeLevelIndex === 12) {
      initialWeather = 'toxic_fog';
    } else if (activeLevelIndex === 5 || activeLevelIndex === 9 || activeLevelIndex === 11 || activeLevelIndex === 13 || activeLevelIndex === 15 || activeLevelIndex === 16) {
      initialWeather = 'plasma_tempest';
    }
    currentWeatherRef.current = initialWeather;
    weatherTimerRef.current = 30.0;

    riverMapRef.current = generateRandomRivers(GRID_SIZE);
    const nodes: ResourceNode[] = [];
    // Place resources scatter-clustered around the map
    // We avoid placing directly in the center to keep player spawning safe
    const minCenterDist = 4;
    const center = GRID_SIZE / 2;

    for (let i = 0; i < 60; i++) {
      const rx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
      const ry = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

      const distToCenter = Math.sqrt((rx - center) ** 2 + (ry - center) ** 2);
      if (distToCenter < minCenterDist) continue;

      // Type weight: mostly wood, some metal, very few gems
      const rand = Math.random();
      let type: 'wood' | 'metal' | 'gem' = 'wood';
      let health = 40;

      if (rand > 0.85) {
        type = 'gem';
        health = 80;
      } else if (rand > 0.55) {
        type = 'metal';
        health = 60;
      }

      nodes.push({
        id: `node-${Date.now()}-${i}-${Math.random()}`,
        type,
        x: rx + 0.5,
        y: ry + 0.5,
        amount: type === 'gem' ? 1 : type === 'metal' ? 3 : 5,
        health,
        maxHealth: health,
        respawnTimer: 0,
      });
    }

    resourceNodesRef.current = nodes;
  }, [gameState.level]);

  const persistActiveInventory = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const saveData = saveSystem.load();
    saveData.wood = player.inventory.wood;
    saveData.metal = player.inventory.metal;
    saveData.gem = player.inventory.gem;
    saveSystem.save(saveData);
  }, []);

  const restartLevel = useCallback(() => {
    initMapResources();
    enemiesRef.current = [];
    projectilesRef.current = [];
    groundItemsRef.current = [];
    particlesRef.current = [];
    textPopsRef.current = [];
    attackCooldownRef.current = 0;
    waveTimerRef.current = 8;
    waveActiveRef.current = false;
    currentWaveRef.current = 1;
    zombiesKilledRef.current = 0;
    scoreRef.current = 0;

    // Load persistent save data
    const saveData = saveSystem.load();
    const items = saveData.items || [];

    // Find active equipped item details
    const equippedWeapon = items.find(i => i.id === saveData.equippedWeaponId);
    const equippedArmor = items.find(i => i.id === saveData.equippedArmorId);
    const equippedAccessory = items.find(i => i.id === saveData.equippedAccessoryId);

    // Get upgraded genome modifiers (pure level multiplier * statPerLevel)
    const up = (saveData.upgrades || {}) as any;
    const lvlHp = (up.maxHealth || 0) * 15;
    const lvlAtk = (up.attackDamage || 0) * 4;
    const lvlDef = (up.defense || 0) * 2;
    const lvlSpeed = (up.movementSpeed || 0) * 0.04;

    // Calculate gear stats
    const gearHp = (equippedArmor?.health || 0) + (equippedAccessory?.health || 0);
    const gearAtk = equippedWeapon?.attack || 0;
    const gearDef = equippedArmor?.defense || 0;
    const gearSpeed = equippedAccessory?.speedBonus || 0;
    const gearCrit = (equippedWeapon?.critChance || 0) + (equippedAccessory?.critChance || 0);

    // Calculate total starting variables
    const finalMaxHealth = 100 + gearHp + lvlHp;
    const finalBaseDamage = 5 + gearAtk + lvlAtk;
    const finalArmor = 2 + gearDef + lvlDef;
    const finalSpeed = 2.8 * (1 + gearSpeed + lvlSpeed);

    // Collect weapons owned or crafted
    const activeWeaponType = (equippedWeapon?.subType as any) || 'pistol';
    const craftedList: any[] = ['pistol'];
    items.forEach(item => {
      if (item.type === 'weapon' && item.subType) {
        if (!craftedList.includes(item.subType)) {
          craftedList.push(item.subType);
        }
      }
    });
    if (!craftedList.includes(activeWeaponType)) {
      craftedList.push(activeWeaponType);
    }

    setGameState({
      currentWave: 1,
      zombiesKilled: 0,
      score: 0,
      gameStatus: 'playing',
      waveTimer: 8,
      waveActive: false,
      level: currentLevel,
    });

    // Reset player position and stats with persistent modifiers!
    const finalPlayer: Character = {
      x: GRID_SIZE / 2,
      y: GRID_SIZE / 2,
      targetX: GRID_SIZE / 2,
      targetY: GRID_SIZE / 2,
      health: finalMaxHealth,
      maxHealth: finalMaxHealth,
      xp: 0,
      nextLevelXp: 100,
      level: 1,
      speed: finalSpeed,
      baseDamage: finalBaseDamage,
      armor: finalArmor,
      facingAngle: 0,
      activeWeapon: activeWeaponType,
      craftedWeapons: craftedList,
      potionsCount: 3, // Balanced survival starting potions
      inventory: {
        wood: saveData.wood !== undefined ? saveData.wood : 50,
        metal: saveData.metal !== undefined ? saveData.metal : 25,
        gem: saveData.gem !== undefined ? saveData.gem : 5,
      },
      // Save tactical upgrades and modifiers for in-game application
      upgrades: up,
      dodgeChance: (up.dodgeChance || 0) * 0.015,
      critChance: 0.05 + gearCrit + (up.critChance || 0) * 0.02,
      critDamageMultiplier: 1.50 + (up.critDamage || 0) * 0.10,
      luckMultiplier: 1.0 + (up.luck || 0) * 0.05,
      coinMultiplier: 1.0 + (up.coinMultiplier || 0) * 0.08,
      xpMultiplier: 1.0 + (up.xpMultiplier || 0) * 0.08,
      healthRegen: (up.healthRegen || 0) * 0.3,
      attackSpeedMultiplier: 1.0 + (up.attackSpeed || 0) * 0.05,
      items: items,
      equippedItemIds: [saveData.equippedWeaponId, saveData.equippedArmorId, saveData.equippedAccessoryId].filter(Boolean) as string[],
      spikeTrapsCount: 2,
      teslaTurretsCount: 1,
      hasCompanionDrone: false,
      dashTimer: 0,
      dashCooldown: 0,
      comboCount: 0,
      comboTimer: 0,
    };

    playerRef.current = finalPlayer;
    setPlayerState(finalPlayer);
  }, [currentLevel, initMapResources]);

  // Start Level / Handle Level Progression
  useEffect(() => {
    restartLevel();
  }, [currentLevel, restartLevel]);

  // Particle Spawner
  const spawnParticles = (x: number, y: number, color: string, count: number, speedMultiplier = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * speedMultiplier;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 30),
        size: 2 + Math.random() * 4,
      });
    }
  };

  // Text Pop Spawner
  const spawnTextPop = (x: number, y: number, text: string, color: string) => {
    textPopsRef.current.push({
      id: `pop-${Date.now()}-${Math.random()}`,
      x,
      y: y - 0.2, // slightly above target
      text,
      color,
      life: 0,
      maxLife: 45,
    });
  };

  // Spawn Zombie helpers using advanced enemy system
  const spawnZombie = (type: ZombieType) => {
    // Spawn around the map margins
    let sx = 0;
    let sy = 0;
    const side = Math.floor(Math.random() * 4);
    const offset = Math.random() * GRID_SIZE;

    switch (side) {
      case 0: // Top
        sx = offset; sy = 1; break;
      case 1: // Right
        sx = GRID_SIZE - 1; sy = offset; break;
      case 2: // Bottom
        sx = offset; sy = GRID_SIZE - 1; break;
      case 3: // Left
        sx = 1; sy = offset; break;
    }

    const id = `zombie-${Date.now()}-${Math.random()}`;
    const difficultyScaling = 1 + (gameState.level - 1) * 0.45 + (currentWaveRef.current - 1) * 0.15;
    
    const isBoss = type.startsWith('boss_');
    const enemy = isBoss
      ? spawnLevelBoss(id, gameState.level, sx, sy)
      : spawnLevelEnemy(id, gameState.level, sx, sy, difficultyScaling);

    enemiesRef.current.push(enemy);
  };

  // Wave Manager Spawning Trigger
  const triggerWaveSpawns = (wave: number) => {
    const level = gameState.level;
    // If wave 5 or 10, spawn the level-appropriate boss!
    if (wave === 5) {
      const id = `zombie-boss-${Date.now()}-${Math.random()}`;
      const bossEnemy = spawnLevelBoss(id, level, GRID_SIZE / 2, GRID_SIZE / 2 - 3);
      enemiesRef.current.push(bossEnemy);

      spawnTextPop(GRID_SIZE / 2, GRID_SIZE / 2 - 2, `${bossEnemy.name.toUpperCase()} INBOUND!`, bossEnemy.color);
      audio.playSfx('levelUp');

      // Spawn 5 support basic zombies
      for (let i = 0; i < 5; i++) {
        spawnZombie('basic');
      }
    } else if (wave === 10) {
      const id = `zombie-boss-${Date.now()}-${Math.random()}`;
      const bossEnemy = spawnLevelBoss(id, level, GRID_SIZE / 2, GRID_SIZE / 2 - 3);
      enemiesRef.current.push(bossEnemy);

      spawnTextPop(GRID_SIZE / 2, GRID_SIZE / 2 - 2, `ELITE ${bossEnemy.name.toUpperCase()} ENCOUNTER!`, bossEnemy.color);
      audio.playSfx('levelUp');

      // Spawn some fast zombies
      const count = level >= 5 ? 8 : 6;
      for (let i = 0; i < count; i++) {
        spawnZombie('fast');
      }
    } else {
      // Standard scaled wave
      const baseCount = 5 + wave * 3;
      spawnTextPop(playerRef.current.x, playerRef.current.y - 1.5, `WAVE ${wave} INCOMING`, "#f43f5e");

      for (let i = 0; i < baseCount; i++) {
        spawnZombie('basic'); // spawnZombie will auto-select random level-specific enemies!
      }
    }
  };

  // Active Dash Dodge mechanics
  const triggerDash = () => {
    const player = playerRef.current;
    if (player.dashCooldown && player.dashCooldown > 0) {
      spawnTextPop(player.x, player.y - 1.2, "COOLDOWN", "#ef4444");
      return;
    }

    // Get current movement direction from joystick vector
    let dx = joystickVectorRef.current.x;
    let dy = joystickVectorRef.current.y;

    // If standing still, dash in facing direction
    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
      dx = Math.cos(player.facingAngle || 0);
      dy = Math.sin(player.facingAngle || 0);
    }

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    } else {
      dx = 1;
      dy = 0;
    }

    // Assign dash attributes
    player.dashTimer = 0.25; // dash duration in seconds
    player.dashCooldown = 1.8; // cooldown in seconds
    player.dashVx = dx * 5.0; // speed velocity boost
    player.dashVy = dy * 5.0;

    spawnTextPop(player.x, player.y - 1.2, "DASH!", "#22d3ee");
    spawnParticles(player.x, player.y, "#22d3ee", 15, 1.4);
    audio.playSfx('dash');
  };

  // Keyboard and Potion events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Pause/unpause shortcut
      if (e.key === 'Escape' || key === 'p') {
        e.preventDefault();
        setGameState((prev) => {
          if (prev.gameStatus === 'playing') {
            audio.playSfx('loot');
            return { ...prev, gameStatus: 'paused' };
          } else if (prev.gameStatus === 'paused') {
            audio.playSfx('loot');
            return { ...prev, gameStatus: 'playing' };
          }
          return prev;
        });
        return;
      }

      // Only allow other gameplay shortcuts if actively playing
      if (gameState.gameStatus !== 'playing') return;

      // Spacebar Dash
      if (e.key === ' ' || key === 'spacebar') {
        e.preventDefault();
        triggerDash();
      }
      // Fast Potion (H)
      if (key === 'h') {
        triggerPotionUse();
      }
      // Fast Forge Menu (C)
      if (key === 'c') {
        setIsCraftingOpen((prev) => !prev);
      }
      // Quick Weapons Hotkeys
      if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        const idx = parseInt(key) - 1;
        const player = playerRef.current;
        if (idx >= 0 && idx < player.craftedWeapons.length) {
          const wId = player.craftedWeapons[idx];
          equipWeapon(wId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStatus]);

  // Quick equip weapon
  const equipWeapon = (id: WeaponId) => {
    setPlayerState((prev) => {
      if (prev.craftedWeapons.includes(id)) {
        spawnTextPop(prev.x, prev.y - 1, `Equipped ${WEAPONS[id].name}`, WEAPONS[id].color);
        return { ...prev, activeWeapon: id };
      }
      return prev;
    });
  };

  // Heal Potion Usage
  const triggerPotionUse = () => {
    const player = playerRef.current;
    if (player.potionsCount <= 0) {
      spawnTextPop(player.x, player.y - 1, 'No Potions!', '#f87171');
      return;
    }
    if (player.health >= player.maxHealth) {
      spawnTextPop(player.x, player.y - 1, 'Health Already Full!', '#38bdf8');
      return;
    }
    const healedAmount = 50;
    const newHealth = Math.min(player.maxHealth, player.health + healedAmount);
    player.health = newHealth;
    player.potionsCount -= 1;
    spawnTextPop(player.x, player.y - 1, `+${healedAmount} HP`, '#4ade80');
    spawnParticles(player.x, player.y, '#ef4444', 15, 1.2);
    audio.playSfx('loot');
    setPlayerState({ ...player });
  };

  // Crafting items handler
  const handleCraft = (id: WeaponId | 'potion' | 'spike_trap' | 'tesla_turret' | 'companion') => {
    const player = playerRef.current;
    if (id === 'potion') {
      const recipe = { wood: 5, metal: 3, gem: 0 };
      if (
        player.inventory.wood >= recipe.wood &&
        player.inventory.metal >= recipe.metal
      ) {
        player.potionsCount += 1;
        player.inventory.wood -= recipe.wood;
        player.inventory.metal -= recipe.metal;

        spawnTextPop(player.x, player.y - 1, '🧪 Healing Potion Crafted!', '#f43f5e');
        spawnParticles(player.x, player.y, '#f43f5e', 12, 1);
        audio.playSfx('craft');
        setPlayerState({ ...player });
      }
    } else if (id === 'spike_trap') {
      const recipe = { wood: 12, metal: 4, gem: 0 };
      if (
        player.inventory.wood >= recipe.wood &&
        player.inventory.metal >= recipe.metal
      ) {
        player.spikeTrapsCount = (player.spikeTrapsCount || 0) + 1;
        player.inventory.wood -= recipe.wood;
        player.inventory.metal -= recipe.metal;

        spawnTextPop(player.x, player.y - 1, 'Spike Trap Crafted!', '#f97316');
        spawnParticles(player.x, player.y, '#f97316', 12, 1);
        audio.playSfx('craft');
        setPlayerState({ ...player });
      }
    } else if (id === 'tesla_turret') {
      const recipe = { wood: 0, metal: 15, gem: 3 };
      if (
        player.inventory.metal >= recipe.metal &&
        player.inventory.gem >= recipe.gem
      ) {
        player.teslaTurretsCount = (player.teslaTurretsCount || 0) + 1;
        player.inventory.metal -= recipe.metal;
        player.inventory.gem -= recipe.gem;

        spawnTextPop(player.x, player.y - 1, 'Tesla Turret Crafted!', '#06b6d4');
        spawnParticles(player.x, player.y, '#06b6d4', 12, 1);
        audio.playSfx('craft');
        setPlayerState({ ...player });
      }
    } else if (id === 'companion') {
      const recipe = { wood: 0, metal: 20, gem: 5 };
      if (
        player.inventory.metal >= recipe.metal &&
        player.inventory.gem >= recipe.gem
      ) {
        player.hasCompanionDrone = true;
        player.inventory.metal -= recipe.metal;
        player.inventory.gem -= recipe.gem;

        spawnTextPop(player.x, player.y - 1, 'Aero-Drone Summoned!', '#fbbf24');
        spawnParticles(player.x, player.y, '#fbbf24', 15, 1.2);
        audio.playSfx('craft');
        setPlayerState({ ...player });
      }
    } else {
      const w = WEAPONS[id];
      if (w && !player.craftedWeapons.includes(id)) {
        const affordable =
          player.inventory.wood >= w.recipe.wood &&
          player.inventory.metal >= w.recipe.metal &&
          player.inventory.gem >= w.recipe.gem;

        if (affordable) {
          player.craftedWeapons = [...player.craftedWeapons, id];
          player.activeWeapon = id; // auto-equip
          player.inventory.wood -= w.recipe.wood;
          player.inventory.metal -= w.recipe.metal;
          player.inventory.gem -= w.recipe.gem;

          spawnTextPop(player.x, player.y - 1.2, `Crafted ${w.name}!`, w.color);
          spawnParticles(player.x, player.y, w.color, 25, 1.5);
          audio.playSfx('craft');
          setPlayerState({ ...player });
        }
      }
    }
  };

  // Equip Mod Item Handler
  const equipInventoryItem = (itemId: string) => {
    const player = playerRef.current;
    if (!player.items) player.items = [];
    const item = player.items.find((i) => i.id === itemId);
    if (!item) return;

    // Filter out other equipped items that share the exact same slot/type!
    let newEquipped = (player.equippedItemIds || []).filter((id) => {
      const eqItem = player.items.find((i) => i.id === id);
      return eqItem ? eqItem.type !== item.type : true;
    });

    newEquipped.push(itemId);
    player.equippedItemIds = newEquipped;
    setPlayerState({ ...player });
    
    spawnTextPop(player.x, player.y - 1.5, `Mod Equipped: ${item.name}`, '#f59e0b');
    spawnParticles(player.x, player.y, '#f59e0b', 12, 1.0);
  };

  // Unequip Mod Item Handler
  const unequipInventoryItem = (itemId: string) => {
    const player = playerRef.current;
    if (!player.equippedItemIds) player.equippedItemIds = [];
    player.equippedItemIds = player.equippedItemIds.filter((id) => id !== itemId);
    setPlayerState({ ...player });
    spawnTextPop(player.x, player.y - 1.5, `Removed Mod`, '#94a3b8');
  };

  // Dismantle/Salvage Mod Item Handler
  const dismantleInventoryItem = (itemId: string) => {
    const player = playerRef.current;
    if (!player.items) player.items = [];
    const item = player.items.find((i) => i.id === itemId);
    if (!item) return;

    // Calculate salvage resources based on item rarity
    let woodSalvage = 5;
    let metalSalvage = 5;
    let gemSalvage = 0;

    if (item.rarity === 'rare') {
      woodSalvage = 15;
      metalSalvage = 15;
    } else if (item.rarity === 'epic') {
      woodSalvage = 35;
      metalSalvage = 35;
      gemSalvage = 1;
    } else if (item.rarity === 'legendary') {
      woodSalvage = 80;
      metalSalvage = 80;
      gemSalvage = 3;
    }

    // Add to resources
    player.inventory.wood += woodSalvage;
    player.inventory.metal += metalSalvage;
    player.inventory.gem += gemSalvage;

    // Filter out of lists
    player.items = player.items.filter((i) => i.id !== itemId);
    player.equippedItemIds = (player.equippedItemIds || []).filter((id) => id !== itemId);

    setPlayerState({ ...player });
    spawnTextPop(player.x, player.y - 1.5, `Salvaged: +${woodSalvage} Wood, +${metalSalvage} Metal`, '#38bdf8');
    if (gemSalvage > 0) {
      spawnTextPop(player.x, player.y - 1.1, `+${gemSalvage} Gem Salvaged`, '#c084fc');
    }
    spawnParticles(player.x, player.y, '#38bdf8', 18, 1.2);
  };

  // Core Game Update Loop (calculates movement, attacks, waves, item collections, and physics collisions)
  useEffect(() => {
    let lastTime = performance.now();
    let lastFrameTime = performance.now();

    const loop = (time: number) => {
      // Dynamic Frame Rate Selection mapping
      const targetFpsSetting = localStorage.getItem('game_target_fps') || 'uncapped';
      const targetFps = targetFpsSetting === '30' ? 30 : targetFpsSetting === '60' ? 60 : null;

      if (targetFps) {
        const frameInterval = 1000 / targetFps;
        const elapsed = time - lastFrameTime;
        if (elapsed < frameInterval) {
          gameLoopRef.current = requestAnimationFrame(loop);
          return;
        }
        // Sync frame interval timings
        lastFrameTime = time - (elapsed % frameInterval);
      } else {
        lastFrameTime = time;
      }

      const dt = Math.min(0.1, (time - lastTime) / 1000); // capped to avoid huge jumps on lag
      lastTime = time;

      // Ensure we are playing and not looting a boss reward
      if (gameState.gameStatus === 'playing' && !isLootModalActiveRef.current) {
        updateGame(dt);
      }

      // Render updated states
      renderGame();

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState.gameStatus, levelTheme]);

  // Game state physics and ticks update
  const updateGame = (dt: number) => {
    const player = playerRef.current;
    const activeW = WEAPONS[player.activeWeapon] || WEAPONS['pistol'];

    // Update gun animation timers
    if (muzzleFlashTimerRef.current > 0) {
      muzzleFlashTimerRef.current = Math.max(0, muzzleFlashTimerRef.current - dt);
    }
    if (weaponRecoilRef.current > 0) {
      weaponRecoilRef.current = Math.max(0, weaponRecoilRef.current - dt * 8); // rapid recoil decay
    }

    // Decrement Arcade Power-up timers
    if (activePowerupsRef.current.doubleDamage > 0) {
      activePowerupsRef.current.doubleDamage = Math.max(0, activePowerupsRef.current.doubleDamage - dt);
    }
    if (activePowerupsRef.current.hyperSpeed > 0) {
      activePowerupsRef.current.hyperSpeed = Math.max(0, activePowerupsRef.current.hyperSpeed - dt);
    }
    if (activePowerupsRef.current.forceShield > 0) {
      activePowerupsRef.current.forceShield = Math.max(0, activePowerupsRef.current.forceShield - dt);
    }
    if (activePowerupsRef.current.magnet > 0) {
      activePowerupsRef.current.magnet = Math.max(0, activePowerupsRef.current.magnet - dt);
    }

    // Decrement dynamic weather timer
    weatherTimerRef.current -= dt;
    if (weatherTimerRef.current <= 0) {
      // Cycle weather based on the current level theme!
      const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
      let thematicWeathers: Array<'clear' | 'storm' | 'blizzard' | 'ashfall' | 'toxic_fog' | 'plasma_tempest'> = ['clear', 'storm'];
      
      if (activeLevelIndex === 3 || activeLevelIndex === 7) {
        thematicWeathers = ['blizzard', 'clear'];
      } else if (activeLevelIndex === 2 || activeLevelIndex === 6 || activeLevelIndex === 10 || activeLevelIndex === 8) {
        thematicWeathers = ['ashfall', 'clear', 'storm'];
      } else if (activeLevelIndex === 4 || activeLevelIndex === 12 || activeLevelIndex === 14) {
        thematicWeathers = ['toxic_fog', 'clear', 'storm'];
      } else if (activeLevelIndex === 5 || activeLevelIndex === 9 || activeLevelIndex === 11 || activeLevelIndex === 13 || activeLevelIndex === 15 || activeLevelIndex === 16) {
        thematicWeathers = ['plasma_tempest', 'clear', 'storm'];
      }

      let nextWeather = thematicWeathers[Math.floor(Math.random() * thematicWeathers.length)];
      // If we have multiple choices and select the same one, try once to get a different one
      if (thematicWeathers.length > 1 && nextWeather === currentWeatherRef.current) {
        nextWeather = thematicWeathers.find(w => w !== currentWeatherRef.current) || nextWeather;
      }
      
      currentWeatherRef.current = nextWeather;
      weatherTimerRef.current = 25.0 + Math.random() * 20.0; // 25-45 seconds
      
      // Notify player
      spawnTextPop(player.x, player.y - 1.5, `WEATHER: ${nextWeather.toUpperCase()}!`, '#fbbf24');
      audio.playSfx('loot');
    }

    // 1. WAVE TIMER DECREMENT
    if (!waveActiveRef.current) {
      waveTimerRef.current -= dt;
      if (waveTimerRef.current <= 0) {
        waveActiveRef.current = true;
        triggerWaveSpawns(currentWaveRef.current);
        setGameState((prev) => ({ ...prev, waveActive: true, waveTimer: 0 }));
      } else {
        // sync countdown to state periodically
        setGameState((prev) => ({
          ...prev,
          waveTimer: Math.max(0, waveTimerRef.current),
        }));
      }
    }

    // 2. PLAYER MOVEMENT & COLLISION
    // Gather equipped items bonuses
    let extraDamage = 0;
    let extraArmor = 0;
    let extraSpeed = 0;

    if (player.items && player.equippedItemIds) {
      player.items.forEach((item) => {
        if (item && player.equippedItemIds.includes(item.id)) {
          if (item.statBonus) {
            if (item.statBonus.damage) extraDamage += item.statBonus.damage;
            if (item.statBonus.armor) extraArmor += item.statBonus.armor;
            if (item.statBonus.speed) extraSpeed += item.statBonus.speed;
          }
        }
      });
    }

    // Passive Health Regeneration from genome upgrade
    if (player.healthRegen && player.healthRegen > 0 && player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + player.healthRegen * dt);
    }

    // Smoothly lerp joystick vector for buttery-smooth movement
    const lerpFactor = 15 * dt; // Adjust for balance between responsiveness & smoothing
    joystickVectorRef.current.x += (targetJoystickVectorRef.current.x - joystickVectorRef.current.x) * Math.min(1, lerpFactor);
    joystickVectorRef.current.y += (targetJoystickVectorRef.current.y - joystickVectorRef.current.y) * Math.min(1, lerpFactor);

    // --- EVALUATE ENVIRONMENTAL ZONES EFFECTS ---
    let insideSpeedZone = false;
    let insideFrostZone = false;
    let insideAcidZone = false;
    const currentZones = getLevelZones(gameState.level);

    currentZones.forEach((zone) => {
      const zdx = player.x - zone.x;
      const zdy = player.y - zone.y;
      const dist = Math.sqrt(zdx * zdx + zdy * zdy);

      if (dist <= zone.radius) {
        if (zone.type === 'heal') {
          // Heal player +4 HP per second
          const healing = 6 * dt;
          if (player.health < player.maxHealth) {
            player.health = Math.min(player.maxHealth, player.health + healing);
            if (Math.random() < 0.08) {
              spawnParticles(player.x, player.y, '#38bdf8', 1, 0.5);
              spawnTextPop(player.x, player.y - 1.2, "+1 HP", "#22d3ee");
            }
          }
        } else if (zone.type === 'speed') {
          // Speed booster indicator
          insideSpeedZone = true;
        } else if (zone.type === 'lava') {
          // Burn player -12 HP per second (not reduced by armor) if they are not actively dashing/invulnerable
          if (!player.dashTimer || player.dashTimer <= 0) {
            player.health -= 12 * dt;
            if (Math.random() < 0.12) {
              spawnParticles(player.x, player.y, '#ef4444', 3, 0.8);
              spawnTextPop(player.x, player.y - 1.2, "BURNING!", "#f87171");
            }
            if (player.health <= 0) {
              player.health = 0;
              setPlayerState({ ...player });
              setGameState((prev) => ({ ...prev, gameStatus: 'gameover' }));
              if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            }
          }
        } else if (zone.type === 'frost') {
          // Frost zone: slow down player speed considerably, and deal 3 damage per second
          insideFrostZone = true;
          if (!player.dashTimer || player.dashTimer <= 0) {
            player.health -= 3 * dt;
            if (Math.random() < 0.08) {
              spawnParticles(player.x, player.y, '#06b6d4', 2, 0.5);
              spawnTextPop(player.x, player.y - 1.2, "FROSTBITE!", "#38bdf8");
            }
            if (player.health <= 0) {
              player.health = 0;
              setPlayerState({ ...player });
              setGameState((prev) => ({ ...prev, gameStatus: 'gameover' }));
              if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            }
          }
        } else if (zone.type === 'acid') {
          // Acid zone: deal heavy damage -18 HP per second, but boosts weapon damage!
          insideAcidZone = true;
          if (!player.dashTimer || player.dashTimer <= 0) {
            player.health -= 18 * dt;
            if (Math.random() < 0.15) {
              spawnParticles(player.x, player.y, '#10b981', 3, 0.6);
              spawnTextPop(player.x, player.y - 1.2, "🧪 ACID CORROSION!", "#10b981");
            }
            if (player.health <= 0) {
              player.health = 0;
              setPlayerState({ ...player });
              setGameState((prev) => ({ ...prev, gameStatus: 'gameover' }));
              if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            }
          }
        }
      }
    });

    let speedMult = 1.0;
    if (insideSpeedZone) {
      speedMult = 1.5; // +50% speed boost!
    } else if (insideFrostZone) {
      speedMult = 0.55; // -45% speed slow!
    }

    // Apply Rainstorm environment slowdown (-15%)
    if (currentWeatherRef.current === 'storm') {
      speedMult *= 0.85;
    }
    // Apply Hyper Speed overcharge power-up (+50% speed!)
    if (activePowerupsRef.current.hyperSpeed > 0) {
      speedMult *= 1.50;
    }

    if (insideAcidZone) {
      extraDamage += 12; // Toxic overcharge: +12 base weapon damage!
    }

    // --- DECAY COMBO STREAK TIMER ---
    if (player.comboCount && player.comboCount > 0) {
      player.comboTimer = (player.comboTimer || 0) - dt;
      if (player.comboTimer <= 0) {
        player.comboCount = 0;
        player.comboTimer = 0;
        spawnTextPop(player.x, player.y - 1.2, "Combo Reset", "#94a3b8");
      }
    }

    // --- COOLDOWN DASH ACTIONS ---
    if (player.dashCooldown && player.dashCooldown > 0) {
      player.dashCooldown -= dt;
      if (player.dashCooldown < 0) player.dashCooldown = 0;
    }

    if (player.damageFlash && player.damageFlash > 0) {
      player.damageFlash -= dt;
      if (player.damageFlash < 0) player.damageFlash = 0;
    }

    // Speed modifiers: baseSpeed + equipped item bonuses + activeWeapon bonus/penalty
    const activeSpeed = (player.speed + extraSpeed) * (1 + (activeW?.speedBonus || 0)) * speedMult;
    const mvX = joystickVectorRef.current.x;
    const mvY = joystickVectorRef.current.y;

    // --- HANDLE POSITIONING & DASH VELOCITIES ---
    if (player.dashTimer && player.dashTimer > 0) {
      player.dashTimer -= dt;
      if (player.dashTimer < 0) player.dashTimer = 0;

      // Move player at high speed by dash velocities
      player.x += (player.dashVx || 0) * dt;
      player.y += (player.dashVy || 0) * dt;

      // Keep inside boundary walls
      player.x = Math.max(0.6, Math.min(GRID_SIZE - 0.6, player.x));
      player.y = Math.max(0.6, Math.min(GRID_SIZE - 0.6, player.y));
    } else {
      // Normal movement calculation
      if (Math.abs(mvX) > 0.01 || Math.abs(mvY) > 0.01) {
        player.x += mvX * activeSpeed * dt;
        player.y += mvY * activeSpeed * dt;

        // Keep inside boundary walls
        player.x = Math.max(0.6, Math.min(GRID_SIZE - 0.6, player.x));
        player.y = Math.max(0.6, Math.min(GRID_SIZE - 0.6, player.y));

        // Facing angle follows movement unless locking targets
        player.facingAngle = Math.atan2(mvY, mvX);
      }
    }

    // --- EVALUATE STAND-STILL WEATHER EFFECTS ---
    const isStandingStill = Math.abs(mvX) <= 0.01 && Math.abs(mvY) <= 0.01 && (!player.dashTimer || player.dashTimer <= 0);
    if (isStandingStill) {
      if (currentWeatherRef.current === 'blizzard') {
        // Frost frostbite damage: 2.2 HP per second
        player.health -= 2.2 * dt;
        if (Math.random() < 0.06) {
          spawnParticles(player.x, player.y, '#38bdf8', 1, 0.4);
          spawnTextPop(player.x, player.y - 1.2, "STILL COLD!", "#38bdf8");
        }
        if (player.health <= 0) {
          player.health = 0;
          setPlayerState({ ...player });
          setGameState((prev) => ({ ...prev, gameStatus: 'gameover' }));
          if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
      } else if (currentWeatherRef.current === 'toxic_fog') {
        // Stand-still toxic corrosive fog: 2.6 HP per second
        player.health -= 2.6 * dt;
        if (Math.random() < 0.06) {
          spawnParticles(player.x, player.y, '#10b981', 1, 0.4);
          spawnTextPop(player.x, player.y - 1.2, "TOXIC INHALATION!", "#10b981");
        }
        if (player.health <= 0) {
          player.health = 0;
          setPlayerState({ ...player });
          setGameState((prev) => ({ ...prev, gameStatus: 'gameover' }));
          if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
      }
    }

    // Periodic random lightning strikes during Plasma Tempest
    if (currentWeatherRef.current === 'plasma_tempest') {
      lightningTimerRef.current = (lightningTimerRef.current || 0) - dt;
      if (lightningTimerRef.current <= 0) {
        lightningTimerRef.current = 1.8 + Math.random() * 1.5; // every 1.8 - 3.3s
        const stormEnemies = enemiesRef.current;
        if (stormEnemies.length > 0) {
          // Pick a random zombie
          const targetIndex = Math.floor(Math.random() * stormEnemies.length);
          const target = stormEnemies[targetIndex];
          
          // Deal massive lightning damage!
          target.health -= 120;
          spawnTextPop(target.x, target.y - 1.2, "LIGHTNING STRIKE!", "#22d3ee");
          spawnParticles(target.x, target.y, "#a5f3fc", 15, 1.5);
          audio.playSfx('dash'); // lightning sound!
          
          // If zombie died, trigger death drops & xp
          if (target.health <= 0) {
            stormEnemies.splice(targetIndex, 1);
            killZombie(target);
          }
        }
      }
    }

    // 3. TARGETING & AUTO ATTACKING
    const enemies = enemiesRef.current;
    let targetEnemy: Enemy | null = null;
    let minDist = Infinity;

    // Find nearest zombie for aiming
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        targetEnemy = enemy;
      }
    });

    // Face nearest enemy if in weapon range, otherwise face movement
    if (targetEnemy && minDist < Math.max(5, activeW.range + 1)) {
      const enemy: Enemy = targetEnemy;
      player.facingAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    }

    // Calculate total player damage pre-multiplied by double damage overcharge
    let totalPlayerDamage = activeW.damage + player.baseDamage + extraDamage;
    if (activePowerupsRef.current.doubleDamage > 0) {
      totalPlayerDamage *= 2.0; // Double Damage Overcharge!
    }

    // Apply toxic weather extra damage bonus (+15% all normal attacks)
    if (currentWeatherRef.current === 'ashfall') {
      totalPlayerDamage *= 1.15;
    }

    // Process weapon attack timers
    if (attackCooldownRef.current > 0) {
      attackCooldownRef.current -= dt;
    } else if (enemies.length > 0 && targetEnemy && minDist <= activeW.range) {
      // ATTACK TRIGGERED!
      const enemy: Enemy = targetEnemy;
      
      let finalAttackSpeed = activeW.attackSpeed * (player.attackSpeedMultiplier || 1.0);
      if (currentWeatherRef.current === 'storm') {
        finalAttackSpeed *= 1.25; // 25% faster rate in Rainstorm!
      }
      attackCooldownRef.current = 1 / finalAttackSpeed;

      if (activeW.isRanged) {
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        
        switch (activeW.id) {
          case 'pistol': {
            projectilesRef.current.push({
              id: `pistol-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 14,
              vy: Math.sin(angle) * 14,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.14,
              life: 0,
              maxLife: 1.0,
            });
            break;
          }
          case 'plasma_rifle': {
            projectilesRef.current.push({
              id: `plasma-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 15,
              vy: Math.sin(angle) * 15,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.12,
              life: 0,
              maxLife: 0.8,
            });
            break;
          }
          case 'shotgun': {
            // 3-bullet spread
            const angles = [angle - 0.22, angle, angle + 0.22];
            angles.forEach((ang, idx) => {
              projectilesRef.current.push({
                id: `shotgun-${idx}-${Date.now()}-${Math.random()}`,
                x: player.x,
                y: player.y,
                vx: Math.cos(ang) * 11,
                vy: Math.sin(ang) * 11,
                damage: Math.round(totalPlayerDamage * 0.95),
                isPlayerOwned: true,
                color: activeW.color,
                glowColor: activeW.glowColor,
                radius: 0.13,
                life: 0,
                maxLife: 0.5, // short range scatter
              });
            });
            break;
          }
          case 'submachine_gun': {
            // Single shot with a slight random spread
            const spreadAngle = angle + (Math.random() - 0.5) * 0.14;
            projectilesRef.current.push({
              id: `smg-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(spreadAngle) * 13,
              vy: Math.sin(spreadAngle) * 13,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.1,
              life: 0,
              maxLife: 0.8,
              specialEffect: 'smg',
            });
            break;
          }
          case 'sniper_rifle': {
            // Mega velocity, large pierce, long maxLife
            projectilesRef.current.push({
              id: `sniper-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 22,
              vy: Math.sin(angle) * 22,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.18,
              life: 0,
              maxLife: 1.5,
              pierceRemaining: 15, // Pierces up to 15 enemies!
            });
            break;
          }
          case 'rocket_launcher': {
            projectilesRef.current.push({
              id: `rocket-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 9.5,
              vy: Math.sin(angle) * 9.5,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.22,
              life: 0,
              maxLife: 1.5,
              specialEffect: 'rocket',
            });
            break;
          }
          case 'flamethrower': {
            // Shoot multiple rapid short range fire flame embers
            const flameAngle = angle + (Math.random() - 0.5) * 0.25;
            projectilesRef.current.push({
              id: `flame-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(flameAngle) * (6 + Math.random() * 3),
              vy: Math.sin(flameAngle) * (6 + Math.random() * 3),
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.24,
              life: 0,
              maxLife: 0.45, // very short range
              specialEffect: 'fire',
            });
            break;
          }
          case 'laser_cannon': {
            projectilesRef.current.push({
              id: `laser-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 18,
              vy: Math.sin(angle) * 18,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.16,
              life: 0,
              maxLife: 1.0,
            });
            break;
          }
          case 'grenade_launcher': {
            projectilesRef.current.push({
              id: `grenade-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 8.5,
              vy: Math.sin(angle) * 8.5,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.18,
              life: 0,
              maxLife: 1.3,
              specialEffect: 'grenade',
            });
            break;
          }
          case 'tesla_carbine': {
            projectilesRef.current.push({
              id: `tesla-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 13,
              vy: Math.sin(angle) * 13,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.14,
              life: 0,
              maxLife: 1.0,
              specialEffect: 'tesla',
            });
            break;
          }
          case 'void_staff': {
            projectilesRef.current.push({
              id: `void-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 6.5,
              vy: Math.sin(angle) * 6.5,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.28, // Large slow moving void orb
              life: 0,
              maxLife: 1.8,
              specialEffect: 'void',
            });
            break;
          }
          case 'fire_staff': {
            projectilesRef.current.push({
              id: `firestaff-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 9,
              vy: Math.sin(angle) * 9,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.2,
              life: 0,
              maxLife: 1.3,
              specialEffect: 'fire',
            });
            break;
          }
          case 'ice_staff': {
            projectilesRef.current.push({
              id: `icestaff-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 11,
              vy: Math.sin(angle) * 11,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.14,
              life: 0,
              maxLife: 1.2,
              specialEffect: 'freeze',
              pierceRemaining: 2, // Pierces up to 2 enemies!
            });
            break;
          }
          case 'wind_staff': {
            projectilesRef.current.push({
              id: `windstaff-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 10,
              vy: Math.sin(angle) * 10,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.25, // wide crescent wind blade
              life: 0,
              maxLife: 1.1,
              specialEffect: 'wind',
              pierceRemaining: 10, // Pierces all in path!
            });
            break;
          }
          case 'chrono_repeater': {
            projectilesRef.current.push({
              id: `chronostaff-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 12,
              vy: Math.sin(angle) * 12,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.15,
              life: 0,
              maxLife: 1.2,
              specialEffect: 'chrono',
            });
            break;
          }
          default: {
            projectilesRef.current.push({
              id: `projectile-fallback-${Date.now()}-${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 12,
              vy: Math.sin(angle) * 12,
              damage: totalPlayerDamage,
              isPlayerOwned: true,
              color: activeW.color,
              glowColor: activeW.glowColor,
              radius: 0.15,
              life: 0,
              maxLife: 1.2,
            });
            break;
          }
        }
        
        // Unique gun-firing recoil particles and muzzle visual feedback based on weapon spec
        let particleCount = 3;
        let particleSpeed = 0.6;
        let muzzleFlashDuration = 0.08;
        let recoilIntensity = 1.0;

        if (activeW.id === 'submachine_gun') {
          particleCount = 2;
          particleSpeed = 0.5;
          muzzleFlashDuration = 0.04;
          recoilIntensity = 0.4;
        } else if (activeW.id === 'shotgun') {
          particleCount = 8;
          particleSpeed = 1.2;
          muzzleFlashDuration = 0.12;
          recoilIntensity = 2.0;
        } else if (activeW.id === 'sniper_rifle') {
          particleCount = 10;
          particleSpeed = 1.6;
          muzzleFlashDuration = 0.15;
          recoilIntensity = 2.6;
        } else if (activeW.id === 'rocket_launcher') {
          particleCount = 12;
          particleSpeed = 1.4;
          muzzleFlashDuration = 0.18;
          recoilIntensity = 3.2;
        } else if (activeW.id === 'flamethrower') {
          particleCount = 4;
          particleSpeed = 0.8;
          muzzleFlashDuration = 0.03;
          recoilIntensity = 0.2;
        } else if (activeW.id === 'laser_cannon') {
          particleCount = 6;
          particleSpeed = 1.0;
          muzzleFlashDuration = 0.08;
          recoilIntensity = 1.4;
        } else if (activeW.id === 'tesla_carbine') {
          particleCount = 5;
          particleSpeed = 1.1;
          muzzleFlashDuration = 0.07;
          recoilIntensity = 0.8;
        }

        spawnParticles(player.x, player.y, activeW.color, particleCount, particleSpeed);
        audio.playSfx('shoot', activeW.id);
        muzzleFlashTimerRef.current = muzzleFlashDuration;
        weaponRecoilRef.current = recoilIntensity;
      } else {
        // Melee sweep attack (Sword, Axe, Shield, Quartz Saber)
        // Sweep arc hits everything in weapon sweep angle
        const attackAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);

        // Find and hit all zombies in weapon reach & 120-degree arc
        enemies.forEach((zombie) => {
          const zdx = zombie.x - player.x;
          const zdy = zombie.y - player.y;
          const zdist = Math.sqrt(zdx * zdx + zdy * zdy);

          if (zdist <= activeW.range) {
            const zAngle = Math.atan2(zdy, zdx);
            let angleDiff = zAngle - attackAngle;
            // Normalize angleDiff
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            if (Math.abs(angleDiff) < Math.PI / 3) {
              // HIT SUCCESSFUL!
              damageZombie(zombie, totalPlayerDamage, attackAngle);
            }
          }
        });

        // Swing slash particles
        const arcX = player.x + Math.cos(attackAngle) * activeW.range * 0.7;
        const arcY = player.y + Math.sin(attackAngle) * activeW.range * 0.7;
        spawnParticles(arcX, arcY, activeW.color, 8, 0.8);
        audio.playSfx('slash');
      }
    }

    // 4. RESOURCE AUTO-MINING (standing near nodes slowly harvests them)
    const nodes = resourceNodesRef.current;
    nodes.forEach((node) => {
      if (node.health > 0) {
        const dx = node.x - player.x;
        const dy = node.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Stand in mining radius (1.3 tiles) to harvest
        if (dist <= 1.3) {
          // Miner bonus with heavy explosive guns!
          const harvestPower = (activeW.id === 'shotgun' || activeW.id === 'grenade_launcher' || activeW.id === 'rocket_launcher') ? 12 * dt : 5 * dt;
          node.health -= harvestPower;

          // Spark particles
          if (Math.random() < 0.15) {
            const pColor = node.type === 'wood' ? '#f59e0b' : node.type === 'metal' ? '#9ca3af' : node.type === 'gem' ? '#c084fc' : '#fbbf24';
            spawnParticles(node.x, node.y, pColor, 2, 0.5);
          }

          if (node.health <= 0) {
            node.health = 0;

            if (node.type === 'chest') {
              // EPIC LOOT CHEST UNLOCKED!
              spawnTextPop(node.x, node.y - 1.0, "CHEST UNLOCKED!", "#fbbf24");
              spawnParticles(node.x, node.y, '#fbbf24', 35, 1.8);
              spawnParticles(node.x, node.y, '#38bdf8', 15, 1.2);
              spawnParticles(node.x, node.y, '#ec4899', 15, 1.2);

              // 1. Drop guaranteed premium random loot mod item!
              let randomLoot = generateRandomLootItem();
              
              // Apply Player Luck upgrade (higher probability of epic/legendary rerolls!)
              const luckChance = (player.luckMultiplier || 1.0) - 1.0;
              if (luckChance > 0 && Math.random() < luckChance) {
                if (randomLoot.rarity === 'common') randomLoot.rarity = 'rare';
                else if (randomLoot.rarity === 'rare') randomLoot.rarity = 'epic';
                else if (randomLoot.rarity === 'epic') randomLoot.rarity = 'legendary';
                
                // Scale stats
                const multiplier = randomLoot.rarity === 'legendary' ? 2.5 : randomLoot.rarity === 'epic' ? 1.8 : 1.3;
                if (randomLoot.statBonus) {
                  if (randomLoot.statBonus.damage) randomLoot.statBonus.damage = Math.round(randomLoot.statBonus.damage * multiplier);
                  if (randomLoot.statBonus.armor) randomLoot.statBonus.armor = Math.round(randomLoot.statBonus.armor * multiplier);
                  if (randomLoot.statBonus.speed) randomLoot.statBonus.speed = parseFloat((randomLoot.statBonus.speed * multiplier).toFixed(2));
                }
                
                randomLoot.name = `${randomLoot.name.replace(' ★', '').replace(' ✦', '')} ${randomLoot.rarity === 'legendary' ? '★' : randomLoot.rarity === 'epic' ? '✦' : ''}`;
              }

              groundItemsRef.current.push({
                id: `drop-loot-chest-${Date.now()}-${Math.random()}`,
                type: 'loot_item',
                x: node.x + (Math.random() - 0.5) * 0.8,
                y: node.y + (Math.random() - 0.5) * 0.8,
                amount: 1,
                color: randomLoot.rarity === 'legendary' ? '#f59e0b' : randomLoot.rarity === 'epic' ? '#c084fc' : randomLoot.rarity === 'rare' ? '#3b82f6' : '#94a3b8',
                glowColor: 'rgba(255,255,255,0.4)',
                pulseTimer: Math.random() * 5,
                lootItem: randomLoot,
              });

              // 2. Drop 1-2 random high-tier weapons!
              const chestWeapons: WeaponId[] = ['rocket_launcher', 'flamethrower', 'laser_cannon', 'void_staff', 'fire_staff', 'chrono_repeater'];
              const dropsCount = Math.floor(Math.random() * 2) + 1;
              for (let d = 0; d < dropsCount; d++) {
                const bWep = chestWeapons[Math.floor(Math.random() * chestWeapons.length)];
                const bWepDetails = WEAPONS[bWep];
                if (bWepDetails) {
                  groundItemsRef.current.push({
                    id: `drop-weapon-chest-${Date.now()}-${Math.random()}`,
                    type: 'weapon',
                    x: node.x + (Math.random() - 0.5) * 1.0,
                    y: node.y + (Math.random() - 0.5) * 1.0,
                    amount: 1,
                    color: bWepDetails.color,
                    glowColor: bWepDetails.glowColor,
                    pulseTimer: Math.random() * 5,
                    weaponId: bWep,
                  });
                }
              }

              // 3. Drop lots of resources (wood, metal, gems)
              const resList: ('wood' | 'metal' | 'gem')[] = ['wood', 'metal', 'gem'];
              resList.forEach((rT) => {
                const amt = rT === 'gem' ? 2 : 4;
                const rColor = rT === 'wood' ? '#f59e0b' : rT === 'metal' ? '#9ca3af' : '#c084fc';
                for (let k = 0; k < amt; k++) {
                  groundItemsRef.current.push({
                    id: `loot-chest-${Date.now()}-${Math.random()}`,
                    type: rT,
                    x: node.x + (Math.random() - 0.5) * 1.4,
                    y: node.y + (Math.random() - 0.5) * 1.4,
                    amount: 1,
                    color: rColor,
                    glowColor: rColor + '55',
                    pulseTimer: Math.random() * 5,
                  });
                }
              });

              // 4. Drop health potions
              for (let pI = 0; pI < 2; pI++) {
                groundItemsRef.current.push({
                  id: `potion-chest-${Date.now()}-${Math.random()}`,
                  type: 'potion',
                  x: node.x + (Math.random() - 0.5) * 1.4,
                  y: node.y + (Math.random() - 0.5) * 1.4,
                  amount: 1,
                  color: '#ef4444',
                  glowColor: 'rgba(239,68,68,0.4)',
                  pulseTimer: Math.random() * 5,
                });
              }

              // Longer respawn time for chests
              node.respawnTimer = 60.0; // 60 seconds respawn
            } else {
              // Standard Resource depletion
              const yieldAmount = node.amount;

              // Trigger floating text
              const label = node.type === 'wood' ? 'Wood' : node.type === 'metal' ? 'Metal' : 'Gem';
              const color = node.type === 'wood' ? '#f59e0b' : node.type === 'metal' ? '#9ca3af' : '#c084fc';
              spawnTextPop(node.x, node.y - 0.5, `+${yieldAmount} ${label}`, color);

              // Add directly or drop ground item with visual pick effects
              for (let k = 0; k < yieldAmount; k++) {
                groundItemsRef.current.push({
                  id: `loot-${Date.now()}-${Math.random()}`,
                  type: node.type,
                  x: node.x + (Math.random() - 0.5) * 0.6,
                  y: node.y + (Math.random() - 0.5) * 0.6,
                  amount: 1,
                  color,
                  glowColor: color + '55',
                  pulseTimer: Math.random() * 5,
                });
              }

              node.respawnTimer = 25.0; // 25 seconds
            }
          }
        }
      } else {
        // respawn tick
        node.respawnTimer -= dt;
        if (node.respawnTimer <= 0) {
          node.health = node.maxHealth;
          node.x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5;
          node.y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5;
        }
      }
    });

    // 5. UPDATE PROJECTILES
    const projectiles = projectilesRef.current;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life += dt;

      // Spawn weapon-specific ambient trail particles
      if (Math.random() < 0.28) {
        const idLower = proj.id.toLowerCase();
        if (idLower.startsWith('rocket-')) {
          spawnParticles(proj.x, proj.y, 'rgba(148, 163, 184, 0.45)', 1, 0.3); // heavy dark gray rocket fuel smoke
        } else if (idLower.startsWith('flame-') || idLower.startsWith('firestaff-')) {
          spawnParticles(proj.x, proj.y, '#f97316', 1, 0.5); // hot glowing fire embers
        } else if (idLower.startsWith('icestaff-')) {
          spawnParticles(proj.x, proj.y, '#e0f2fe', 1, 0.3); // freezing frost crystals
        } else if (idLower.startsWith('void-')) {
          spawnParticles(proj.x, proj.y, '#c084fc', 1, 0.4); // deep purple stellar dust
        } else if (idLower.startsWith('tesla-')) {
          spawnParticles(proj.x, proj.y, '#22d3ee', 1, 0.8); // electric blue static sparks
        } else if (idLower.startsWith('chronostaff-')) {
          spawnParticles(proj.x, proj.y, '#fbbf24', 1, 0.2); // golden clockwork gears sparkles
        } else if (idLower.startsWith('laser-') || idLower.startsWith('plasma-')) {
          spawnParticles(proj.x, proj.y, '#38bdf8', 1, 0.5); // cyber neon light sparkles
        } else if (idLower.startsWith('sniper-')) {
          spawnParticles(proj.x, proj.y, '#34d399', 1, 0.4); // precision emerald green trails
        }
      }

      let hit = false;

      // Hit boundary check
      if (proj.x < 0 || proj.x > GRID_SIZE || proj.y < 0 || proj.y > GRID_SIZE || proj.life >= proj.maxLife) {
        hit = true;
      } else {
        // Player owned projectles hit enemies
        if (proj.isPlayerOwned) {
          for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            const dx = enemy.x - proj.x;
            const dy = enemy.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= enemy.radius + proj.radius) {
              // Pierce tracking check to prevent multiple hits on same target on same tick
              proj.enemiesHit = proj.enemiesHit || [];
              if (proj.enemiesHit.includes(enemy.id)) {
                continue;
              }
              proj.enemiesHit.push(enemy.id);

              hit = true;
              const angle = Math.atan2(proj.vy, proj.vx);
              damageZombie(enemy, proj.damage, angle);

              // Weapon specific mechanics triggers!
              if (proj.specialEffect) {
                switch (proj.specialEffect) {
                  case 'freeze': {
                    enemy.slowTimer = 3.0; // Slow for 3 seconds
                    spawnParticles(enemy.x, enemy.y, '#38bdf8', 12, 0.7);
                    break;
                  }
                  case 'fire': {
                    // Flame Splash
                    enemies.forEach((other) => {
                      if (other.id !== enemy.id) {
                        const odx = other.x - enemy.x;
                        const ody = other.y - enemy.y;
                        const odist = Math.sqrt(odx * odx + ody * ody);
                        if (odist <= 2.2) {
                          damageZombie(other, Math.round(proj.damage * 0.5), Math.atan2(ody, odx));
                          spawnParticles(other.x, other.y, '#f97316', 3, 0.5);
                        }
                      }
                    });
                    spawnParticles(enemy.x, enemy.y, '#f97316', 15, 1.0);
                    break;
                  }
                  case 'rocket': {
                    // Huge AOE explosion with full damage!
                    enemies.forEach((other) => {
                      if (other.id !== enemy.id) {
                        const odx = other.x - enemy.x;
                        const ody = other.y - enemy.y;
                        const odist = Math.sqrt(odx * odx + ody * ody);
                        if (odist <= 3.8) {
                          const splashDmg = Math.round(proj.damage * (1 - odist / 4.5));
                          if (splashDmg > 5) {
                            damageZombie(other, splashDmg, Math.atan2(ody, odx));
                          }
                          spawnParticles(other.x, other.y, '#ef4444', 5, 0.6);
                        }
                      }
                    });
                    // Explosive splash fireworks particles
                    for (let p = 0; p < 25; p++) {
                      const pang = Math.random() * Math.PI * 2;
                      const pspd = 1 + Math.random() * 5;
                      particlesRef.current.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(pang) * pspd,
                        vy: Math.sin(pang) * pspd,
                        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
                        alpha: 1.0,
                        life: 0,
                        maxLife: 0.5 + Math.random() * 0.4,
                        size: 4 + Math.random() * 5,
                      });
                    }
                    audio.playSfx('hitEnemy'); // robust blast wave sfx
                    break;
                  }
                  case 'grenade': {
                    // Explodes into 3 micro cluster-bombs!
                    for (let g = 0; g < 3; g++) {
                      const gang = angle + (Math.random() - 0.5) * 1.5;
                      const gspd = 5 + Math.random() * 4;
                      projectilesRef.current.push({
                        id: `shrapnel-${Date.now()}-${Math.random()}`,
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(gang) * gspd,
                        vy: Math.sin(gang) * gspd,
                        damage: Math.round(proj.damage * 0.4),
                        isPlayerOwned: true,
                        color: '#fbbf24',
                        glowColor: 'rgba(251, 191, 36, 0.6)',
                        radius: 0.08,
                        life: 0,
                        maxLife: 0.4,
                      });
                    }
                    spawnParticles(enemy.x, enemy.y, '#eab308', 12, 0.8);
                    break;
                  }
                  case 'tesla': {
                    // Jump electricity chain
                    let chainsLeft = 3;
                    const chainMaxDist = 4.5;
                    const chainedIds = new Set<string>([enemy.id]);
                    let currentChainSource = enemy;

                    while (chainsLeft > 0) {
                      let nextTarget: Enemy | null = null;
                      let closestDist = Infinity;

                      for (let k = 0; k < enemies.length; k++) {
                        const e = enemies[k];
                        if (chainedIds.has(e.id)) continue;
                        const tdx = e.x - currentChainSource.x;
                        const tdy = e.y - currentChainSource.y;
                        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                        if (tdist < closestDist && tdist <= chainMaxDist) {
                          closestDist = tdist;
                          nextTarget = e;
                        }
                      }

                      if (nextTarget) {
                        chainedIds.add(nextTarget.id);
                        damageZombie(nextTarget, Math.round(proj.damage * 0.85), Math.atan2(nextTarget.y - currentChainSource.y, nextTarget.x - currentChainSource.x));
                        
                        // Draw spark line
                        const steps = 8;
                        for (let s = 0; s <= steps; s++) {
                          const ratio = s / steps;
                          const lx = currentChainSource.x + (nextTarget.x - currentChainSource.x) * ratio;
                          const ly = currentChainSource.y + (nextTarget.y - currentChainSource.y) * ratio;
                          spawnParticles(lx, ly, '#22d3ee', 1, 0.3);
                        }

                        currentChainSource = nextTarget;
                        chainsLeft--;
                      } else {
                        break;
                      }
                    }
                    spawnParticles(enemy.x, enemy.y, '#67e8f9', 8, 0.6);
                    break;
                  }
                  case 'void': {
                    // Vortex gravity pull
                    enemies.forEach((other) => {
                      const vdx = other.x - enemy.x;
                      const vdy = other.y - enemy.y;
                      const vdist = Math.sqrt(vdx * vdx + vdy * vdy);
                      if (vdist > 0.1 && vdist <= 4.0) {
                        const pullFactor = (4.0 - vdist) * 0.45;
                        other.x -= (vdx / vdist) * pullFactor;
                        other.y -= (vdy / vdist) * pullFactor;
                      }
                    });
                    spawnParticles(enemy.x, enemy.y, '#c084fc', 14, 0.9);
                    break;
                  }
                  case 'chrono': {
                    // Damage over time trigger
                    enemy.decayTimer = 4.0;
                    enemy.decayDamagePerSec = Math.round(proj.damage * 0.6);
                    spawnParticles(enemy.x, enemy.y, '#e9d5ff', 8, 0.7);
                    break;
                  }
                  case 'wind': {
                    // Wind wave kinetic push
                    const pushForce = 8.5;
                    enemy.pushbackTimer = 0.45;
                    enemy.pushbackVX = Math.cos(angle) * pushForce;
                    enemy.pushbackVY = Math.sin(angle) * pushForce;
                    spawnParticles(enemy.x, enemy.y, '#cbd5e1', 6, 0.5);
                    break;
                  }
                  default:
                    break;
                }
              }

              // Pierce logic check
              if (proj.pierceRemaining && proj.pierceRemaining > 0) {
                proj.pierceRemaining--;
                hit = false; // pierce target, keep flying!
              } else {
                break;
              }
            }
          }
        } else {
          // Enemy projectiles hit player
          const dx = player.x - proj.x;
          const dy = player.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 0.4 + proj.radius) {
            hit = true;
            damagePlayer(proj.damage);
          }
        }
      }

      if (hit) {
        // Spawn small crash burst
        spawnParticles(proj.x, proj.y, proj.color, 6, 0.6);
        projectiles.splice(i, 1);
      }
    }

    // 6. UPDATE ENEMIES
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];

      // Decrease cooldowns
      if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

      if (enemy.damageFlash && enemy.damageFlash > 0) {
        enemy.damageFlash -= dt;
        if (enemy.damageFlash < 0) enemy.damageFlash = 0;
      }

      // Chrono decay status tick
      if (enemy.decayTimer && enemy.decayTimer > 0) {
        enemy.decayTimer -= dt;
        const tickDamage = (enemy.decayDamagePerSec || 5) * dt;
        enemy.health -= tickDamage;
        enemy.damageFlash = 0.1;
        if (Math.random() < 0.1) {
          spawnParticles(enemy.x, enemy.y, '#c084fc', 1, 0.4);
        }
        if (enemy.health <= 0) {
          killZombie(enemy);
          continue; // Enemy died, skip rest of this iteration
        }
      }

      // Modular advanced AI updates depending on their class/behavior!
      const spawnProj = (isPl: boolean, px: number, py: number, pvx: number, pvy: number, dmg: number, col: string, glow: string, rad: number) => {
        projectilesRef.current.push({
          id: `enemyproj-${Date.now()}-${Math.random()}`,
          x: px,
          y: py,
          vx: pvx,
          vy: pvy,
          damage: dmg,
          isPlayerOwned: isPl,
          color: col,
          glowColor: glow,
          radius: rad,
          life: 0,
          maxLife: 2.2
        });
        spawnParticles(px, py, col, 4, 0.6);
      };

      const spawnMin = (t: ZombieType, mx: number, my: number) => {
        const id = `zombie-summon-${Date.now()}-${Math.random()}`;
        // Spawns a level-specific sub-minion using spawnLevelEnemy!
        const minion = spawnLevelEnemy(id, gameState.level, mx, my, 0.7);
        // Ensure standard name for minion
        minion.name = `Summoned ${minion.name}`;
        enemiesRef.current.push(minion);
        spawnParticles(mx, my, minion.color, 12, 0.8);
      };

      updateEnemyMovementAI(enemy, player.x, player.y, dt, spawnProj, spawnMin);

      // Keep zombies on map bounds
      enemy.x = Math.max(0.5, Math.min(GRID_SIZE - 0.5, enemy.x));
      enemy.y = Math.max(0.5, Math.min(GRID_SIZE - 0.5, enemy.y));

      // Touch player attack check
      const postDx = player.x - enemy.x;
      const postDy = player.y - enemy.y;
      const postDist = Math.sqrt(postDx * postDx + postDy * postDy);
      if (postDist <= enemy.radius + 0.4) {
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1.0; // 1 second cooldown
          damagePlayer(enemy.damage);

          // bounce back zombie slightly on impact
          enemy.x -= Math.cos(enemy.facingAngle) * 0.4;
          enemy.y -= Math.sin(enemy.facingAngle) * 0.4;
        }
      }
    }

    // 7. UPDATE GROUND ITEMS (and magnet draw toward player)
    const items = groundItemsRef.current;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.pulseTimer += dt * 5;

      const idxX = player.x - item.x;
      const idxY = player.y - item.y;
      const idist = Math.sqrt(idxX * idxX + idxY * idxY);

      // Vacuum magnetic draw if player stands within magnetic range!
      // Magnet power-up multiplies magnetic draw range by 2.5x (from 2.2 to 5.5 tiles) and doubles draw speed!
      const magnetActive = activePowerupsRef.current.magnet > 0;
      const magRange = magnetActive ? 5.5 : 2.2;
      const magSpeed = magnetActive ? 9.5 : 4.5;
      if (idist <= magRange) {
        const speed = magSpeed;
        const angle = Math.atan2(idxY, idxX);
        item.x += Math.cos(angle) * speed * dt;
        item.y += Math.sin(angle) * speed * dt;
      }

      // Collect item if touching (0.4 tiles)
      if (idist <= 0.45) {
        if (item.type === 'xp') {
          gainXP(item.amount);
        } else if (item.type === 'potion') {
          player.potionsCount += item.amount;
          spawnTextPop(player.x, player.y - 1.2, `+${item.amount} Potions`, '#ef4444');
        } else if (item.type === 'loot_item' && item.lootItem) {
          if (!player.items) player.items = [];
          player.items.push(item.lootItem);
          const rarityLabel = item.lootItem.rarity.toUpperCase();
          spawnTextPop(player.x, player.y - 1.4, `Found: ${item.lootItem.name} [${rarityLabel}]`, item.color);
        } else if (item.type === 'weapon' && item.weaponId) {
          const wep = WEAPONS[item.weaponId];
          if (wep) {
            if (!player.craftedWeapons.includes(item.weaponId)) {
              player.craftedWeapons.push(item.weaponId);
            }
            player.activeWeapon = item.weaponId;
            spawnTextPop(player.x, player.y - 1.4, `UNLOCKED: ${wep.name}!`, wep.color);
          }
        } else if (item.type === 'wood' || item.type === 'metal' || item.type === 'gem') {
          // Resource
          player.inventory[item.type] += item.amount;
          const label = item.type === 'wood' ? 'Wood' : item.type === 'metal' ? 'Metal' : 'Gem';
          spawnTextPop(player.x, player.y - 0.9, `+${item.amount} ${label}`, item.color);
        } else if (item.type === 'powerup_double_damage') {
          activePowerupsRef.current.doubleDamage = 15.0; // 15s duration
          spawnTextPop(player.x, player.y - 1.2, "x2 DAMAGE OVERCHARGE!", "#ef4444");
        } else if (item.type === 'powerup_hyper_speed') {
          activePowerupsRef.current.hyperSpeed = 15.0; // 15s duration
          spawnTextPop(player.x, player.y - 1.2, "HYPER SPEED ENGAGED!", "#06b6d4");
        } else if (item.type === 'powerup_force_shield') {
          activePowerupsRef.current.forceShield = 15.0; // 15s duration
          spawnTextPop(player.x, player.y - 1.2, "FORCE SHIELD ACTIVE!", "#10b981");
        } else if (item.type === 'powerup_magnet') {
          activePowerupsRef.current.magnet = 15.0; // 15s duration
          spawnTextPop(player.x, player.y - 1.2, "ULTRA VACUUM MAGNET!", "#eab308");
        }

        // play burst particles
        spawnParticles(item.x, item.y, item.color, 6, 0.8);
        audio.playSfx('loot');
        items.splice(i, 1);
      }
    }

    // --- 9. UPDATE DEPLOYABLES ---
    const deployables = deployablesRef.current;
    for (let i = deployables.length - 1; i >= 0; i--) {
      const dep = deployables[i];
      
      if (dep.type === 'spike_trap') {
        // Spike traps damage enemies that step on them
        const enemies = enemiesRef.current;
        let triggered = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          const dist = Math.sqrt((dep.x - enemy.x) ** 2 + (dep.y - enemy.y) ** 2);
          
          if (dist <= 0.8) {
            // Damage enemy
            const spikeDamage = 25 * dt; // deals continuous damage!
            enemy.health -= spikeDamage;
            triggered = true;
            
            // Slow enemy on spike trap!
            enemy.x -= Math.cos(enemy.facingAngle) * enemy.speed * 0.4 * dt;
            enemy.y -= Math.sin(enemy.facingAngle) * enemy.speed * 0.4 * dt;
            
            if (Math.random() < 0.15) {
              spawnParticles(enemy.x, enemy.y, '#f59e0b', 3, 0.4);
            }
            
            if (enemy.health <= 0) {
              enemies.splice(j, 1);
              killZombie(enemy);
            }
          }
        }
        
        if (triggered) {
          // Spike traps slowly lose health when active/damaging zombies
          dep.health -= 8 * dt;
          if (dep.health <= 0) {
            spawnTextPop(dep.x, dep.y - 1.0, "SPIKES BROKEN!", "#ef4444");
            spawnParticles(dep.x, dep.y, '#78350f', 8, 0.8);
            deployables.splice(i, 1);
          }
        }
      } else if (dep.type === 'tesla_turret') {
        // Tesla turrets shoot lightning arcs at the closest enemy in range
        dep.attackCooldown -= dt;
        
        if (dep.attackCooldown <= 0) {
          const enemies = enemiesRef.current;
          let target: Enemy | null = null;
          let nearestDist = 6.0; // range of 6 tiles
          
          enemies.forEach((enemy) => {
            const dist = Math.sqrt((dep.x - enemy.x) ** 2 + (dep.y - enemy.y) ** 2);
            if (dist < nearestDist) {
              nearestDist = dist;
              target = enemy;
            }
          });
          
          if (target) {
            dep.attackCooldown = 0.8; // fires every 0.8 seconds!
            
            // Deal electrical damage to target and up to 2 nearby enemies (chain lightning!)
            target.health -= 45;
            spawnTextPop(target.x, target.y - 1.2, "SHOCK!", "#22d3ee");
            spawnParticles(target.x, target.y, '#22d3ee', 6, 0.6);
            
            // Draw electric lightning beam line from turret to target inside render loop by spawning lightning particles
            const tX = dep.x;
            const tY = dep.y;
            const eX = target.x;
            const eY = target.y;
            
            // Spawn lightning beam particles
            for (let step = 0; step <= 5; step++) {
              const px = tX + (eX - tX) * (step / 5);
              const py = tY + (eY - tY) * (step / 5);
              spawnParticles(px, py, '#a5f3fc', 1, 0.3);
            }
            
            if (target.health <= 0) {
              const targetIdx = enemies.indexOf(target);
              if (targetIdx !== -1) {
                enemies.splice(targetIdx, 1);
                killZombie(target);
              }
            }
            
            // Turrets lose charge per shot (durability!)
            dep.health -= 3; // loses 3 health per shot
            if (dep.health <= 0) {
              spawnTextPop(dep.x, dep.y - 1.0, "TURRET DEPLETED!", "#06b6d4");
              spawnParticles(dep.x, dep.y, '#334155', 12, 1.0);
              deployables.splice(i, 1);
            }
          }
        }
      }
    }

    // --- 10. UPDATE COMPANION DRONE ATTACK ---
    if (playerState.hasCompanionDrone) {
      companionDroneAttackCooldownRef.current = (companionDroneAttackCooldownRef.current || 0) - dt;
      
      if (companionDroneAttackCooldownRef.current <= 0) {
        const enemies = enemiesRef.current;
        let target: Enemy | null = null;
        let nearestDist = 5.0; // 5 tiles orbit attack range
        
        enemies.forEach((enemy) => {
          const dist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
          if (dist < nearestDist) {
            nearestDist = dist;
            target = enemy;
          }
        });
        
        if (target) {
          companionDroneAttackCooldownRef.current = 0.5; // Shoots fast: every 0.5s!
          
          // Spawn player-owned projectile from the drone's circular position!
          const dPos = companionDronePosRef.current || { x: player.x, y: player.y - 0.5 };
          const dx = target.x - dPos.x;
          const dy = target.y - dPos.y;
          const angle = Math.atan2(dy, dx);
          
          projectilesRef.current.push({
            id: `drone-plasma-${Date.now()}-${Math.random()}`,
            x: dPos.x,
            y: dPos.y,
            vx: Math.cos(angle) * 11.0, // fast plasma bolt
            vy: Math.sin(angle) * 11.0,
            damage: 15, // decent assistant damage
            isPlayerOwned: true,
            color: '#fbbf24', // golden plasma
            glowColor: 'rgba(251, 191, 36, 0.6)',
            radius: 0.12,
            life: 0,
            maxLife: 1.5,
          });
          
          audio.playSfx('shoot'); // high-tech laser sound!
          spawnParticles(dPos.x, dPos.y, '#fbbf24', 2, 0.4);
        }
      }
    }

    // 8. UPDATE PARTICLES & TEXT POPS
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
      }
    }

    const textPops = textPopsRef.current;
    for (let i = textPops.length - 1; i >= 0; i--) {
      const pop = textPops[i];
      pop.y -= 0.4 * dt; // float upwards
      pop.life++;
      if (pop.life >= pop.maxLife) {
        textPops.splice(i, 1);
      }
    }

    // Sync powerups, weather, and deployables count back to react state for HUD rendering
    setCurrentWeather(currentWeatherRef.current);
    setWeatherTimer(weatherTimerRef.current);
    setActivePowerupsState({
      doubleDamage: activePowerupsRef.current.doubleDamage,
      hyperSpeed: activePowerupsRef.current.hyperSpeed,
      forceShield: activePowerupsRef.current.forceShield,
      magnet: activePowerupsRef.current.magnet,
    });

    // Sync state for React renders (throttled to avoid rendering strain)
    setPlayerState({ ...player });
  };

  // Process Zombie Damage
  const damageZombie = (zombie: Enemy, rawDmg: number, angle: number) => {
    const player = playerRef.current;

    // Critical Strike Chance (defaults to calculated value)
    const critRate = player.critChance !== undefined ? player.critChance : 0.15;
    const isCrit = Math.random() < critRate;
    let finalDmg = rawDmg;

    // Apply active Combo multiplier (+5% damage per combo stack)
    const comboMult = 1 + (player.comboCount || 0) * 0.05;
    finalDmg *= comboMult;

    if (isCrit) {
      const critMultiplier = player.critDamageMultiplier !== undefined ? player.critDamageMultiplier : 1.8;
      finalDmg *= critMultiplier; // Dynamic critical strike multiplier
    }

    zombie.health -= finalDmg;
    zombie.damageFlash = 0.15;

    // Knockback
    const kb = 0.4;
    zombie.x += Math.cos(angle) * kb;
    zombie.y += Math.sin(angle) * kb;

    // Blood and spark particles (Larger golden spark for Critical Strike!)
    spawnParticles(zombie.x, zombie.y, isCrit ? '#f59e0b' : zombie.color, isCrit ? 20 : 12, isCrit ? 1.5 : 1.2);
    audio.playSfx('hitEnemy');

    if (isCrit) {
      spawnTextPop(zombie.x, zombie.y - 0.7, `CRIT! ${Math.ceil(finalDmg)}`, '#fbbf24');
    } else {
      spawnTextPop(zombie.x, zombie.y - 0.3, Math.ceil(finalDmg).toString(), '#ffffff');
    }

    // Build/refresh Combo Streak
    player.comboCount = (player.comboCount || 0) + 1;
    player.comboTimer = 3.5; // combo lasts 3.5 seconds

    if (zombie.health <= 0) {
      killZombie(zombie);
    }
  };

  // Process Player Damage
  const damagePlayer = (rawDmg: number) => {
    const player = playerRef.current;
    
    // Check Force Shield powerup invulnerability
    if (activePowerupsRef.current.forceShield > 0) {
      spawnTextPop(player.x, player.y - 1.1, "BLOCKED!", "#34d399");
      spawnParticles(player.x, player.y, "#a7f3d0", 5, 0.5);
      return;
    }

    // Check Dash dodge invulnerability
    if (player.dashTimer && player.dashTimer > 0) {
      spawnTextPop(player.x, player.y - 1.1, "DODGED!", "#22d3ee");
      return;
    }

    // Check Phase Drift Dodge Chance upgrade
    if (player.dodgeChance && Math.random() < player.dodgeChance) {
      spawnTextPop(player.x, player.y - 1.1, "PHASE DODGED!", "#c084fc");
      spawnParticles(player.x, player.y, "#d8b4fe", 5, 0.6);
      return;
    }

    // Reset combat combo streak on getting hit
    if (player.comboCount && player.comboCount > 0) {
      player.comboCount = 0;
      player.comboTimer = 0;
      spawnTextPop(player.x, player.y - 1.4, "💔 STREAK BROKEN!", "#ef4444");
    }

    const activeW = WEAPONS[player.activeWeapon] || WEAPONS['pistol'];
    player.damageFlash = 0.18;

    let extraArmor = 0;
    if (player.items && player.equippedItemIds) {
      player.items.forEach((item) => {
        if (item && player.equippedItemIds.includes(item.id)) {
          if (item.statBonus && item.statBonus.armor) {
            extraArmor += item.statBonus.armor;
          }
        }
      });
    }

    const totalArmor = player.armor + extraArmor + (activeW?.armorBonus || 0);

    // Damage reduced by armor (percentage based: each armor adds 2.5% reduction, up to 75% cap)
    const reduction = Math.min(0.75, totalArmor * 0.025);
    const finalDmg = Math.max(2, rawDmg * (1 - reduction));

    player.health -= finalDmg;

    // Red impact vignette and text
    spawnTextPop(player.x, player.y - 1.1, `-${Math.ceil(finalDmg)} HP`, '#ef4444');
    spawnParticles(player.x, player.y, '#ef4444', 8, 1);
    audio.playSfx('hitPlayer');

    if (player.health <= 0) {
      player.health = 0;
      setPlayerState({ ...player });
      setGameState((prev) => ({ ...prev, gameStatus: 'gameover' }));
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
  };

  // gain XP and level up
  const gainXP = (amt: number) => {
    const player = playerRef.current;
    const finalAmt = Math.round(amt * (player.xpMultiplier || 1.0));
    player.xp += finalAmt;

    if (player.xp >= player.nextLevelXp) {
      // LEVEL UP!
      player.xp -= player.nextLevelXp;
      player.level += 1;
      player.nextLevelXp = Math.floor(player.nextLevelXp * 1.5);
      player.maxHealth = Math.floor(player.maxHealth + 15);
      player.health = player.maxHealth; // fully heal!
      player.baseDamage += 3;

      spawnTextPop(player.x, player.y - 1.5, "👑 LEVEL UP! 👑", "#34d399");
      spawnParticles(player.x, player.y, '#fbbf24', 35, 1.6);
      audio.playSfx('levelUp');
    }
  };

  // Zombie death loot & reward pipeline
  const killZombie = (enemy: Enemy) => {
    const player = playerRef.current;
    const enemies = enemiesRef.current;

    // Remove from active array
    const idx = enemies.indexOf(enemy);
    if (idx !== -1) enemies.splice(idx, 1);

    zombiesKilledRef.current += 1;
    scoreRef.current += enemy.pointsValue;

    // Boss rewards
    if (enemy.isBoss) {
      audio.playSfx('levelUp');
      
      // Generate Boss Loot via modular RPG system
      const lootList = generateBossLootTable(enemy.type as any, gameState.level);
      
      // Award gold reward
      const baseGoldReward = Math.round((150 * gameState.level) + Math.random() * (150 * gameState.level));
      const goldReward = Math.round(baseGoldReward * (player.coinMultiplier || 1.0));

      // Direct, safe loading and updating of save system
      const saveData = saveSystem.load();
      saveData.items = [...(saveData.items || []), ...lootList];
      saveData.gold += goldReward;
      saveData.stats.goldEarned += goldReward;
      saveData.stats.bossesDefeatedCount += 1;
      saveData.wood = player.inventory.wood;
      saveData.metal = player.inventory.metal;
      saveData.gem = player.inventory.gem;

      if (!saveData.bossesDefeated) {
        saveData.bossesDefeated = [];
      }
      if (!saveData.bossesDefeated.includes(enemy.type)) {
        saveData.bossesDefeated.push(enemy.type);
      }

      // Unlock next level if we cleared the current campaign level
      if (gameState.level === saveData.unlockedLevel && saveData.unlockedLevel < LEVEL_THEMES.length) {
        saveData.unlockedLevel = saveData.unlockedLevel + 1;
      }

      saveSystem.save(saveData);

      // Trigger Loot Reward Overlay Modal
      setActiveBossLoot(lootList);
      setActiveBossName(enemy.name);

      // Drop precious visual gems on ground
      const gemDrops = currentWaveRef.current === 5 ? 3 : 6;
      for (let g = 0; g < gemDrops; g++) {
        groundItemsRef.current.push({
          id: `drop-gem-${Date.now()}-${Math.random()}`,
          type: 'gem',
          x: enemy.x + (Math.random() - 0.5) * 1.5,
          y: enemy.y + (Math.random() - 0.5) * 1.5,
          amount: 1,
          color: '#c084fc',
          glowColor: 'rgba(192, 132, 252, 0.7)',
          pulseTimer: Math.random() * 5,
        });
      }

      // Drop direct Healing Potions
      groundItemsRef.current.push({
        id: `drop-pot-${Date.now()}-${Math.random()}`,
        type: 'potion',
        x: enemy.x + (Math.random() - 0.5) * 1.5,
        y: enemy.y + (Math.random() - 0.5) * 1.5,
        amount: 2,
        color: '#ef4444',
        glowColor: 'rgba(239, 68, 68, 0.7)',
        pulseTimer: Math.random() * 5,
      });

      // Direct physically dropped gear from Boss
      let bossLoot = generateRandomLootItem(true);
      groundItemsRef.current.push({
        id: `drop-loot-boss-${Date.now()}-${Math.random()}`,
        type: 'loot_item',
        x: enemy.x + (Math.random() - 0.5) * 1.2,
        y: enemy.y + (Math.random() - 0.5) * 1.2,
        amount: 1,
        color: bossLoot.rarity === 'legendary' ? '#f59e0b' : bossLoot.rarity === 'epic' ? '#c084fc' : bossLoot.rarity === 'rare' ? '#3b82f6' : '#94a3b8',
        glowColor: 'rgba(255,255,255,0.4)',
        pulseTimer: Math.random() * 5,
        lootItem: bossLoot,
      });

      // Direct physically dropped weapon from Boss
      const bossWeapons: WeaponId[] = ['rocket_launcher', 'flamethrower', 'laser_cannon', 'void_staff', 'fire_staff', 'chrono_repeater'];
      const bossWep = bossWeapons[Math.floor(Math.random() * bossWeapons.length)];
      const bossWepDetails = WEAPONS[bossWep];
      if (bossWepDetails) {
        groundItemsRef.current.push({
          id: `drop-weapon-boss-${Date.now()}-${Math.random()}`,
          type: 'weapon',
          x: enemy.x + (Math.random() - 0.5) * 1.5,
          y: enemy.y + (Math.random() - 0.5) * 1.5,
          amount: 1,
          color: bossWepDetails.color,
          glowColor: bossWepDetails.glowColor,
          pulseTimer: Math.random() * 5,
          weaponId: bossWep,
        });
      }
    } else {
      // Standard resource and XP drops (materials and potions only, no equipment)
      let dropType: 'wood' | 'metal' | 'xp' = 'xp';
      let dColor = '#34d399'; // green for XP

      if (enemy.type === 'tank') {
        dropType = 'metal';
        dColor = '#9ca3af';
      } else if (enemy.type === 'fast' || enemy.type === 'basic') {
        dropType = Math.random() > 0.6 ? 'wood' : 'xp';
        dColor = dropType === 'wood' ? '#f59e0b' : '#34d399';
      } else if (enemy.type === 'spitter') {
        dropType = Math.random() > 0.5 ? 'metal' : 'xp';
        dColor = dropType === 'metal' ? '#9ca3af' : '#34d399';
      }

      groundItemsRef.current.push({
        id: `drop-${Date.now()}-${Math.random()}`,
        type: dropType,
        x: enemy.x + (Math.random() - 0.5) * 0.4,
        y: enemy.y + (Math.random() - 0.5) * 0.4,
        amount: dropType === 'xp' ? Math.floor(8 + Math.random() * 8) : 1,
        color: dColor,
        glowColor: dColor + '55',
        pulseTimer: Math.random() * 5,
      });

      // 5% Arcade Power-up drop chance
      if (Math.random() < 0.05) {
        const powerupTypes: Array<'powerup_double_damage' | 'powerup_hyper_speed' | 'powerup_force_shield' | 'powerup_magnet'> = [
          'powerup_double_damage',
          'powerup_hyper_speed',
          'powerup_force_shield',
          'powerup_magnet'
        ];
        const selectedPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        let pColor = '#ef4444'; // double damage (red)
        let pgColor = 'rgba(239, 68, 68, 0.7)';
        if (selectedPowerup === 'powerup_hyper_speed') {
          pColor = '#06b6d4'; // hyper speed (cyan)
          pgColor = 'rgba(6, 182, 212, 0.7)';
        } else if (selectedPowerup === 'powerup_force_shield') {
          pColor = '#10b981'; // force shield (green)
          pgColor = 'rgba(16, 185, 129, 0.7)';
        } else if (selectedPowerup === 'powerup_magnet') {
          pColor = '#eab308'; // magnet (yellow)
          pgColor = 'rgba(234, 179, 8, 0.7)';
        }
        
        groundItemsRef.current.push({
          id: `drop-${selectedPowerup}-${Date.now()}-${Math.random()}`,
          type: selectedPowerup,
          x: enemy.x + (Math.random() - 0.5) * 0.4,
          y: enemy.y + (Math.random() - 0.5) * 0.4,
          amount: 1,
          color: pColor,
          glowColor: pgColor,
          pulseTimer: Math.random() * 5,
        });
      }

      // Random Loot Drops from standard enemies
      if (Math.random() < 0.03) {
        const randomLoot = generateRandomLootItem(false);
        groundItemsRef.current.push({
          id: `drop-loot-enemy-${Date.now()}-${Math.random()}`,
          type: 'loot_item',
          x: enemy.x + (Math.random() - 0.5) * 0.8,
          y: enemy.y + (Math.random() - 0.5) * 0.8,
          amount: 1,
          color: randomLoot.rarity === 'legendary' ? '#f59e0b' : randomLoot.rarity === 'epic' ? '#c084fc' : randomLoot.rarity === 'rare' ? '#3b82f6' : '#94a3b8',
          glowColor: 'rgba(255,255,255,0.4)',
          pulseTimer: Math.random() * 5,
          lootItem: randomLoot,
        });
        spawnTextPop(enemy.x, enemy.y - 1.0, "LOOT DROPPED!", "#fbbf24");
      } else if (Math.random() < 0.01) {
        const standardWeapons: WeaponId[] = ['pistol', 'plasma_rifle', 'shotgun', 'submachine_gun', 'sniper_rifle', 'wind_staff', 'ice_staff'];
        const randWep = standardWeapons[Math.floor(Math.random() * standardWeapons.length)];
        const wepDetails = WEAPONS[randWep];
        if (wepDetails) {
          groundItemsRef.current.push({
            id: `drop-weapon-enemy-${Date.now()}-${Math.random()}`,
            type: 'weapon',
            x: enemy.x + (Math.random() - 0.5) * 1.0,
            y: enemy.y + (Math.random() - 0.5) * 1.0,
            amount: 1,
            color: wepDetails.color,
            glowColor: wepDetails.glowColor,
            pulseTimer: Math.random() * 5,
            weaponId: randWep,
          });
          spawnTextPop(enemy.x, enemy.y - 1.0, "WEAPON DROPPED!", wepDetails.color);
        }
      }
    }

    // Always drop a little basic XP orb
    groundItemsRef.current.push({
      id: `drop-xp-${Date.now()}-${Math.random()}`,
      type: 'xp',
      x: enemy.x + (Math.random() - 0.5) * 0.6,
      y: enemy.y + (Math.random() - 0.5) * 0.6,
      amount: Math.floor(10 + Math.random() * 10),
      color: '#34d399',
      glowColor: 'rgba(52, 211, 153, 0.4)',
      pulseTimer: Math.random() * 5,
    });

    // Check if Wave Cleared!
    if (enemies.length === 0 && waveActiveRef.current) {
      waveActiveRef.current = false;
      const nextWave = currentWaveRef.current + 1;

      if (nextWave > totalWaves) {
        // Level cleared victory
        setGameState((prev) => ({ ...prev, gameStatus: 'victory' }));
      } else {
        // Increment Wave
        currentWaveRef.current = nextWave;
        waveTimerRef.current = 10; // 10 second preparation window

        setGameState((prev) => ({
          ...prev,
          currentWave: nextWave,
          waveActive: false,
          waveTimer: 10,
          zombiesKilled: zombiesKilledRef.current,
          score: scoreRef.current,
        }));

        spawnTextPop(player.x, player.y - 1.5, "🎉 WAVE CLEARED! 🎉", "#34d399");
        spawnParticles(player.x, player.y, '#34d399', 20, 1.2);
      }
    } else {
      // Sync simple kill counters
      setGameState((prev) => ({
        ...prev,
        zombiesKilled: zombiesKilledRef.current,
        score: scoreRef.current,
      }));
    }
  };

  // Convert Grid Map Coordinates (x, y) to Isometric Screen Coordinates (X, Y)
  const gridToScreen = (gx: number, gy: number, offsetX = 0, offsetY = 0) => {
    const screenX = (gx - gy) * (ISO_TILE_WIDTH / 2) + offsetX;
    const screenY = (gx + gy) * (ISO_TILE_HEIGHT / 2) + offsetY;
    return { x: screenX, y: screenY };
  };

  // Render high-fidelity custom vector icons on the HTML5 Canvas
  const drawCanvasVectorIcon = (
    c: CanvasRenderingContext2D,
    type: string,
    subType: string,
    name: string,
    px: number,
    py: number,
    color: string,
    size: number = 10
  ) => {
    const nameLower = name.toLowerCase();
    const subTypeLower = (subType || '').toLowerCase();
    c.save();
    c.translate(px, py);

    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 1.5;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    const half = size / 2;

    // 1. WEAPONS
    if (
      type === 'weapon' ||
      nameLower.includes('sword') ||
      nameLower.includes('saber') ||
      nameLower.includes('dagger') ||
      nameLower.includes('mace') ||
      nameLower.includes('axe') ||
      nameLower.includes('bow') ||
      nameLower.includes('spear') ||
      nameLower.includes('wand') ||
      nameLower.includes('railgun') ||
      nameLower.includes('scythe')
    ) {
      if (subTypeLower === 'shield' || nameLower.includes('shield')) {
        c.beginPath();
        c.moveTo(-half + 1, -half);
        c.lineTo(half - 1, -half);
        c.lineTo(half, -half + 3);
        c.quadraticCurveTo(half, half - 1, 0, half);
        c.quadraticCurveTo(-half, half - 1, -half, -half + 3);
        c.closePath();
        c.fill();
        c.strokeStyle = '#ffffff';
        c.stroke();
      } else if (subTypeLower === 'bow' || nameLower.includes('bow')) {
        c.beginPath();
        c.arc(0, 0, half, -Math.PI / 1.4, Math.PI / 1.4);
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.45)';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(Math.cos(-Math.PI / 1.4) * half, Math.sin(-Math.PI / 1.4) * half);
        c.lineTo(Math.cos(Math.PI / 1.4) * half, Math.sin(Math.PI / 1.4) * half);
        c.stroke();
      } else if (subTypeLower === 'mace' || nameLower.includes('mace') || nameLower.includes('hammer') || nameLower.includes('bonecracker')) {
        c.strokeStyle = '#78350f';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-half + 1, half - 1);
        c.lineTo(half - 3, -half + 3);
        c.stroke();
        c.fillStyle = color;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(half - 3, -half + 3, 3, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      } else if (subTypeLower === 'dagger' || nameLower.includes('dagger')) {
        c.strokeStyle = '#78350f';
        c.beginPath();
        c.moveTo(-half + 1, half - 1);
        c.lineTo(-half + 3, half - 3);
        c.stroke();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-half + 3, half - 3);
        c.lineTo(half - 1, -half + 1);
        c.stroke();
      } else if (subTypeLower === 'axe' || nameLower.includes('axe')) {
        c.strokeStyle = '#78350f';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-half + 1, half - 1);
        c.lineTo(half - 2, -half + 2);
        c.stroke();
        c.fillStyle = color;
        c.beginPath();
        c.arc(half - 2, -half + 2, 4.5, -Math.PI / 2, Math.PI / 2);
        c.fill();
      } else if (subTypeLower === 'spear' || nameLower.includes('spear')) {
        c.strokeStyle = '#78350f';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-half, half);
        c.lineTo(half - 2, -half + 2);
        c.stroke();
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(half - 2, -half + 2);
        c.lineTo(half - 1, -half - 1);
        c.lineTo(half + 1, -half + 1);
        c.closePath();
        c.fill();
      } else if (subTypeLower === 'wand' || nameLower.includes('wand') || nameLower.includes('scepter')) {
        c.strokeStyle = '#3f3f46';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-half, half);
        c.lineTo(half - 2, -half + 2);
        c.stroke();
        c.fillStyle = '#f472b6';
        c.shadowColor = '#f472b6';
        c.shadowBlur = 4;
        c.beginPath();
        c.arc(half - 2, -half + 2, 2.5, 0, Math.PI * 2);
        c.fill();
      } else if (subTypeLower === 'railgun' || nameLower.includes('railgun')) {
        c.fillStyle = '#27272a';
        c.fillRect(-half, -2, size - 2, 4);
        c.strokeStyle = color;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(-half, -1);
        c.lineTo(size - 3, -1);
        c.stroke();
      } else if (subTypeLower === 'scythe' || nameLower.includes('scythe') || nameLower.includes('sythe')) {
        c.strokeStyle = '#0f172a';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-half, half);
        c.lineTo(half - 2, -half + 2);
        c.stroke();
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(half - 2, -half + 2, 4, -Math.PI / 2, Math.PI / 4, true);
        c.stroke();
      } else {
        const bladeX = half - 1;
        const bladeY = -half + 1;
        c.strokeStyle = '#78350f';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-half + 1, half - 1);
        c.lineTo(-half + 4, half - 4);
        c.stroke();
        c.strokeStyle = '#fbbf24';
        c.beginPath();
        c.moveTo(-half + 5, half - 2);
        c.lineTo(-half + 2, half - 5);
        c.stroke();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-half + 4, half - 4);
        c.lineTo(bladeX, bladeY);
        c.stroke();
      }
    }
    // 2. ARMORS
    else if (
      type === 'armor' ||
      nameLower.includes('plate') ||
      nameLower.includes('suit') ||
      nameLower.includes('vest') ||
      nameLower.includes('harness') ||
      nameLower.includes('aegis')
    ) {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(-half + 1, -half);
      c.lineTo(half - 1, -half);
      c.lineTo(half, -half + 3);
      c.lineTo(half - 1, half - 1);
      c.lineTo(-half + 1, half - 1);
      c.lineTo(-half, -half + 3);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.beginPath();
      c.arc(0, -half, 3, 0, Math.PI);
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-half + 2, 0);
      c.lineTo(half - 2, 0);
      c.stroke();
    }
    // 3. ACCESSORIES
    else if (
      type === 'accessory' ||
      nameLower.includes('band') ||
      nameLower.includes('ring') ||
      nameLower.includes('node') ||
      nameLower.includes('amulet') ||
      nameLower.includes('pendant') ||
      nameLower.includes('core')
    ) {
      if (nameLower.includes('ring') || nameLower.includes('band')) {
        c.strokeStyle = '#fbbf24';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(0, 1, 3.5, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = color;
        c.beginPath();
        c.arc(0, -2.5, 1.8, 0, Math.PI * 2);
        c.fill();
      } else {
        c.strokeStyle = '#94a3b8';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(0, -3, 3, 0, Math.PI);
        c.stroke();
        c.fillStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 3;
        c.beginPath();
        c.moveTo(0, -1);
        c.lineTo(2.5, 2);
        c.lineTo(0, 5);
        c.lineTo(-2.5, 2);
        c.closePath();
        c.fill();
      }
    }
    // 4. TROPHIES
    else if (
      type === 'trophy' ||
      nameLower.includes('crown') ||
      nameLower.includes('horn') ||
      nameLower.includes('processor') ||
      nameLower.includes('chamber') ||
      nameLower.includes('scale')
    ) {
      if (nameLower.includes('crown')) {
        c.fillStyle = '#f59e0b';
        c.beginPath();
        c.moveTo(-half, half);
        c.lineTo(-half, -half + 3);
        c.lineTo(-half + 3, 0);
        c.lineTo(0, -half);
        c.lineTo(half - 3, 0);
        c.lineTo(half, -half + 3);
        c.lineTo(half, half);
        c.closePath();
        c.fill();
        c.fillStyle = '#ef4444';
        c.fillRect(-2, half - 3, 1.5, 1.5);
        c.fillStyle = '#3b82f6';
        c.fillRect(1, half - 3, 1.5, 1.5);
      } else if (nameLower.includes('horn')) {
        c.fillStyle = '#f97316';
        c.beginPath();
        c.moveTo(-3, half);
        c.bezierCurveTo(-1, 0, 1, -2, half - 1, -half);
        c.bezierCurveTo(3, -1, 1, 2, 3, half);
        c.closePath();
        c.fill();
      } else if (nameLower.includes('processor') || nameLower.includes('core')) {
        c.fillStyle = '#334155';
        c.fillRect(-half + 1, -half + 1, size - 2, size - 2);
        c.strokeStyle = color;
        c.lineWidth = 1;
        c.strokeRect(-half + 2, -half + 2, size - 4, size - 4);
        c.fillStyle = '#fbbf24';
        c.fillRect(-half, -half + 2, 1, 1.5);
        c.fillRect(-half, 0, 1, 1.5);
        c.fillRect(-half, half - 3.5, 1, 1.5);
        c.fillRect(half - 1, -half + 2, 1, 1.5);
        c.fillRect(half - 1, 0, 1, 1.5);
        c.fillRect(half - 1, half - 3.5, 1, 1.5);
      } else {
        c.fillStyle = '#fbbf24';
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          c.lineTo(Math.cos(angle) * half, Math.sin(angle) * half);
          const innerAngle = angle + Math.PI / 5;
          c.lineTo(Math.cos(innerAngle) * (half * 0.4), Math.sin(innerAngle) * (half * 0.4));
        }
        c.closePath();
        c.fill();
      }
    }
    // 5. MATERIALS
    else if (
      type === 'material' ||
      nameLower.includes('essence') ||
      nameLower.includes('shards') ||
      nameLower.includes('strands') ||
      nameLower.includes('powder') ||
      nameLower.includes('glow')
    ) {
      if (nameLower.includes('battery')) {
        c.fillStyle = '#1e293b';
        c.fillRect(-3, -half, 6, size);
        c.fillStyle = '#22c55e';
        c.fillRect(-3, 0, 6, half);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.strokeRect(-3, -half, 6, size);
      } else if (nameLower.includes('essence') || nameLower.includes('soul')) {
        c.fillStyle = 'rgba(168, 85, 247, 0.7)';
        c.beginPath();
        c.arc(0, -1, 3.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(-2.5, 1);
        c.lineTo(-1, half);
        c.lineTo(0, 1);
        c.lineTo(1, half);
        c.lineTo(2.5, 1);
        c.closePath();
        c.fill();
      } else if (nameLower.includes('strands') || nameLower.includes('fiber') || nameLower.includes('rope')) {
        c.strokeStyle = color;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-half, -half);
        c.bezierCurveTo(-2, 2, 2, -2, half, half);
        c.moveTo(half, -half);
        c.bezierCurveTo(2, 2, -2, -2, -half, half);
        c.stroke();
      } else if (nameLower.includes('powder') || nameLower.includes('ash')) {
        c.fillStyle = color;
        c.beginPath();
        c.arc(-3, -2, 1, 0, Math.PI * 2);
        c.arc(2, -3, 1.2, 0, Math.PI * 2);
        c.arc(0, 2, 1, 0, Math.PI * 2);
        c.arc(-2, 3, 0.8, 0, Math.PI * 2);
        c.fill();
      } else {
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(0, -half);
        c.lineTo(half, 0);
        c.lineTo(0, half);
        c.lineTo(-half, 0);
        c.closePath();
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(0, -half);
        c.lineTo(half * 0.4, 0);
        c.lineTo(0, half);
        c.closePath();
        c.fill();
      }
    } else {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, -half);
      c.lineTo(half, 0);
      c.lineTo(0, half);
      c.lineTo(-half, 0);
      c.closePath();
      c.fill();
    }

    c.restore();
  };

  // Convert Isometric Screen Coordinates back to Grid Map Coordinates (x, y)
  const screenToGrid = (sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const player = playerRef.current;
    
    // We need the dynamic renderOffset used in renderGame
    const playerIso = gridToScreen(player.x, player.y);
    const cameraX = playerIso.x - canvas.width / 2;
    const cameraY = playerIso.y - canvas.height / 2;
    const renderOffsetX = -cameraX;
    const renderOffsetY = -cameraY;

    const isoX = sx - renderOffsetX;
    const isoY = sy - renderOffsetY;

    const U = isoX / (ISO_TILE_WIDTH / 2);
    const V = isoY / (ISO_TILE_HEIGHT / 2);

    const gx = (U + V) / 2;
    const gy = (V - U) / 2;
    return { x: gx, y: gy };
  };

  const getCachedTile = (key: string, level: number, isRoad: boolean, shadeIndex: number, x: number, y: number) => {
    if (tileCacheRef.current[key]) {
      return tileCacheRef.current[key];
    }

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = ISO_TILE_WIDTH + 4;
    tileCanvas.height = ISO_TILE_HEIGHT + 4;
    const c = tileCanvas.getContext('2d');
    if (!c) return tileCanvas;

    // Draw tile in local space centered at cx, cy
    const cx = ISO_TILE_WIDTH / 2 + 2;
    const cy = 2; // top of tile
    const overlap = 0.5;

    c.beginPath();
    c.moveTo(cx, cy - overlap);
    c.lineTo(cx + ISO_TILE_WIDTH / 2 + overlap, cy + ISO_TILE_HEIGHT / 2);
    c.lineTo(cx, cy + ISO_TILE_HEIGHT + overlap);
    c.lineTo(cx - ISO_TILE_WIDTH / 2 - overlap, cy + ISO_TILE_HEIGHT / 2);
    c.closePath();

    const fillAndStrokeLocal = (color: string) => {
      c.fillStyle = color;
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 1.0;
      c.stroke();
    };

    const activeLevelIndex = ((level - 1) % LEVEL_THEMES.length) + 1;

    if (activeLevelIndex === 1) {
      if (isRoad) {
        // 1. First, draw a seamless grass base so the road is layered on top of beautiful green
        const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.3);
        if (shadeIndex === 0) {
          radGrad.addColorStop(0, '#2e6b32');
          radGrad.addColorStop(0.5, '#225225');
          radGrad.addColorStop(1, '#183b1a');
        } else if (shadeIndex === 1) {
          radGrad.addColorStop(0, '#357d3a');
          radGrad.addColorStop(0.5, '#275c2a');
          radGrad.addColorStop(1, '#1a3d1c');
        } else {
          radGrad.addColorStop(0, '#3a873f');
          radGrad.addColorStop(0.5, '#2b6630');
          radGrad.addColorStop(1, '#1d4220');
        }
        c.fillStyle = radGrad;
        c.fill();
        c.strokeStyle = shadeIndex === 0 ? '#183b1a' : shadeIndex === 1 ? '#1a3d1c' : '#1d4220';
        c.lineWidth = 1.0;
        c.stroke();

        // 2. Draw organic, connected paved winding cobble path overlay
        const roadColor = '#5c4e3b'; // organic rich brown-grey dirt
        const ccy = cy + ISO_TILE_HEIGHT / 2;

        c.fillStyle = roadColor;
        c.beginPath();
        c.arc(cx, ccy, ISO_TILE_HEIGHT * 0.42, 0, Math.PI * 2);
        c.fill();

        // Helper to draw a thick connection strip to connected neighbors
        const drawStrip = (ex: number, ey: number, width: number) => {
          const dx = ex - cx;
          const dy = ey - ccy;
          const len = Math.hypot(dx, dy);
          if (len === 0) return;
          const px = (-dy / len) * (width / 2);
          const py = (dx / len) * (width / 2);

          c.beginPath();
          c.moveTo(cx - px, ccy - py);
          c.lineTo(ex - px, ey - py);
          c.lineTo(ex + px, ey + py);
          c.lineTo(cx + px, ccy + py);
          c.closePath();
          c.fill();
        };

        const pathWidth = ISO_TILE_HEIGHT * 0.72; // connects perfectly with neighbors

        const isRoadNW = riverMapRef.current[x - 1]?.[y] || false;
        const isRoadSE = riverMapRef.current[x + 1]?.[y] || false;
        const isRoadNE = riverMapRef.current[x]?.[y - 1] || false;
        const isRoadSW = riverMapRef.current[x]?.[y + 1] || false;

        if (isRoadNW) drawStrip(cx - ISO_TILE_WIDTH / 2, ccy, pathWidth);
        if (isRoadSE) drawStrip(cx + ISO_TILE_WIDTH / 2, ccy, pathWidth);
        if (isRoadNE) drawStrip(cx, cy, pathWidth);
        if (isRoadSW) drawStrip(cx, cy + ISO_TILE_HEIGHT, pathWidth);

        // Cobblestone rocks scattered along the path
        c.fillStyle = '#7a6e5d';
        c.strokeStyle = '#4a3f30';
        c.lineWidth = 0.8;
        
        const numStones = 4;
        for (let i = 0; i < numStones; i++) {
          const seed = Math.sin(x * 12.34 + y * 56.78 + i * 9.1) * 1000;
          const angle = (seed % 10) * Math.PI * 0.2;
          const dist = (Math.abs(seed) % 1) * (ISO_TILE_HEIGHT * 0.35);
          const scx = cx + Math.cos(angle) * dist;
          const scy = ccy + Math.sin(angle) * dist;
          const sizeX = 3 + (Math.floor(seed * 7) % 4);
          const sizeY = 2 + (Math.floor(seed * 3) % 3);

          c.beginPath();
          c.ellipse(scx, scy, sizeX, sizeY, angle, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        // Overlay grass blades to soften the borders of the road organic transition
        c.strokeStyle = '#225225';
        c.lineWidth = 1.0;
        for (let i = 0; i < 4; i++) {
          const seed = Math.sin(x * 33.4 + y * 11.2 + i * 7.5) * 500;
          const angle = (seed % 10) * Math.PI * 0.2;
          const dist = (ISO_TILE_HEIGHT * 0.38) + (Math.abs(seed) % 1) * 4;
          const gcx = cx + Math.cos(angle) * dist;
          const gcy = ccy + Math.sin(angle) * dist;

          c.beginPath();
          c.moveTo(gcx, gcy);
          c.quadraticCurveTo(gcx - 1, gcy - 3, gcx - 2, gcy - 5);
          c.stroke();
        }
      } else {
        // --- REAL SEAMLESS GRASS FIELD WITH ZERO HARD GRID EDGE LINES ---
        const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.3);
        if (shadeIndex === 0) {
          radGrad.addColorStop(0, '#2e6b32');
          radGrad.addColorStop(0.5, '#225225');
          radGrad.addColorStop(1, '#183b1a');
        } else if (shadeIndex === 1) {
          radGrad.addColorStop(0, '#357d3a');
          radGrad.addColorStop(0.5, '#275c2a');
          radGrad.addColorStop(1, '#1a3d1c');
        } else {
          radGrad.addColorStop(0, '#3a873f');
          radGrad.addColorStop(0.5, '#2b6630');
          radGrad.addColorStop(1, '#1d4220');
        }
        c.fillStyle = radGrad;
        c.fill();
        c.strokeStyle = shadeIndex === 0 ? '#183b1a' : shadeIndex === 1 ? '#1a3d1c' : '#1d4220';
        c.lineWidth = 1.0;
        c.stroke();

        // Draw multiple lush curved grass blade clumps
        c.strokeStyle = '#4ade80'; // vibrant glowing green blades
        c.lineWidth = 0.9;
        const numClumps = 2 + (x * 3 + y * 7) % 3;
        for (let i = 0; i < numClumps; i++) {
          const seedX = Math.sin(x * 12.3 + y * 7.1 + i * 19.9) * 500;
          const seedY = Math.cos(x * 9.7 + y * 13.3 + i * 23.4) * 500;
          const ox = (seedX % 1) * (ISO_TILE_WIDTH * 0.35);
          const oy = (seedY % 1) * (ISO_TILE_HEIGHT * 0.35);
          const ccx = cx + ox;
          const ccy = cy + ISO_TILE_HEIGHT / 2 + oy;

          if (Math.abs(ox) / (ISO_TILE_WIDTH / 2) + Math.abs(oy) / (ISO_TILE_HEIGHT / 2) < 0.8) {
            c.beginPath();
            c.moveTo(ccx, ccy);
            c.quadraticCurveTo(ccx - 2, ccy - 5, ccx - 3, ccy - 9);
            c.moveTo(ccx, ccy);
            c.quadraticCurveTo(ccx + 2, ccy - 6, ccx + 3, ccy - 11);
            if ((i + x) % 2 === 0) {
              c.moveTo(ccx - 1, ccy);
              c.quadraticCurveTo(ccx + 1, ccy - 4, ccx + 1, ccy - 7);
            }
            c.stroke();
          }
        }

        // Soft green clover/moss clusters (adds rich organic foliage detail)
        if ((x * 13 + y * 29) % 5 === 0) {
          c.fillStyle = '#10b981';
          const seedX = Math.sin(x * 14.5 + y * 8.2) * 500;
          const seedY = Math.cos(x * 11.2 + y * 17.1) * 500;
          const ox = (seedX % 1) * (ISO_TILE_WIDTH * 0.25);
          const oy = (seedY % 1) * (ISO_TILE_HEIGHT * 0.25);
          const ccx = cx + ox;
          const ccy = cy + ISO_TILE_HEIGHT / 2 + oy;

          c.beginPath();
          c.arc(ccx, ccy, 1.2, 0, Math.PI * 2);
          c.arc(ccx - 2, ccy + 1, 1.0, 0, Math.PI * 2);
          c.arc(ccx + 1, ccy + 2, 1.1, 0, Math.PI * 2);
          c.fill();
        }

        // Draw cute little flowers with yellow centers and white/pink petals
        if ((x * 17 + y * 29) % 13 === 0) {
          const ccx = cx - 5;
          const ccy = cy + ISO_TILE_HEIGHT / 2 - 3;
          c.fillStyle = '#fbbf24'; // Yellow center
          c.beginPath();
          c.arc(ccx, ccy, 1.5, 0, Math.PI * 2);
          c.fill();
          
          c.fillStyle = '#ffffff'; // White petals
          c.beginPath();
          c.arc(ccx - 2, ccy, 1.0, 0, Math.PI * 2);
          c.arc(ccx + 2, ccy, 1.0, 0, Math.PI * 2);
          c.arc(ccx, ccy - 2, 1.0, 0, Math.PI * 2);
          c.arc(ccx, ccy + 2, 1.0, 0, Math.PI * 2);
          c.fill();
        } else if ((x * 19 + y * 23) % 17 === 0) {
          const ccx = cx + 8;
          const ccy = cy + ISO_TILE_HEIGHT / 2 + 2;
          c.fillStyle = '#f87171'; // Red center
          c.beginPath();
          c.arc(ccx, ccy, 1.5, 0, Math.PI * 2);
          c.fill();
          
          c.fillStyle = '#fca5a5'; // Pink petals
          c.beginPath();
          c.arc(ccx - 1.5, ccy - 1.5, 1.0, 0, Math.PI * 2);
          c.arc(ccx + 1.5, ccy - 1.5, 1.0, 0, Math.PI * 2);
          c.arc(ccx - 1.5, ccy + 1.5, 1.0, 0, Math.PI * 2);
          c.arc(ccx + 1.5, ccy + 1.5, 1.0, 0, Math.PI * 2);
          c.fill();
        }
      }
    } else if (activeLevelIndex === 2) {
      // --- OBSIDIAN CRYPTS (GLOWING MAGMA CHAMBER GRADIENTS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      if (shadeIndex === 0) {
        radGrad.addColorStop(0, '#311942');
        radGrad.addColorStop(0.5, '#22112e');
        radGrad.addColorStop(1, '#15091f');
      } else {
        radGrad.addColorStop(0, '#3e2154');
        radGrad.addColorStop(0.5, '#2b163b');
        radGrad.addColorStop(1, '#1b0e26');
      }
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = shadeIndex === 0 ? '#15091f' : '#1b0e26';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 3 === 0) {
        c.strokeStyle = '#f87171';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(ccx - 10, ccy);
        c.lineTo(ccx, ccy - 3);
        c.lineTo(ccx + 10, ccy + 1);
        c.stroke();
      }
    } else if (activeLevelIndex === 3) {
      // --- CRYO GLACIERS (ICY FROST GRADIENTS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      if (shadeIndex === 0) {
        radGrad.addColorStop(0, '#1a263d');
        radGrad.addColorStop(0.5, '#0f172a');
        radGrad.addColorStop(1, '#050a14');
      } else {
        radGrad.addColorStop(0, '#2b3952');
        radGrad.addColorStop(0.5, '#1e293b');
        radGrad.addColorStop(1, '#0d131f');
      }
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = shadeIndex === 0 ? '#050a14' : '#0d131f';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 3 === 0) {
        c.strokeStyle = '#22d3ee';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(ccx - 6, ccy - 4);
        c.lineTo(ccx + 6, ccy + 4);
        c.moveTo(ccx + 6, ccy - 4);
        c.lineTo(ccx - 6, ccy + 4);
        c.stroke();
      }
    } else if (activeLevelIndex === 4) {
      // --- TOXIC REFINERIES (GRID METALLIC SHEET PLATES) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#292524');
      radGrad.addColorStop(0.7, '#1c1917');
      radGrad.addColorStop(1, '#0c0a09');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#0c0a09';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      
      // Rivets
      c.fillStyle = '#854d0e'; // rusty copper rivets
      c.beginPath();
      c.arc(ccx - 10, ccy - 4, 1.2, 0, Math.PI * 2);
      c.arc(ccx + 10, ccy + 4, 1.2, 0, Math.PI * 2);
      c.fill();

      if ((x * 5 + y * 7) % 11 === 0) {
        c.strokeStyle = '#15803d'; // toxic waste streak
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(ccx - 5, ccy);
        c.lineTo(ccx + 5, ccy);
        c.stroke();
      }
    } else if (activeLevelIndex === 5) {
      // --- PLASMA CORE (NEON GLOW GRIDS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#150c26');
      radGrad.addColorStop(0.7, '#090514');
      radGrad.addColorStop(1, '#020105');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#020105';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 2 === 0) {
        c.strokeStyle = '#a855f7'; // Purple neon trace line
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(ccx - 12, ccy);
        c.lineTo(ccx, ccy - 6);
        c.lineTo(ccx + 12, ccy);
        c.stroke();
      }
    } else if (activeLevelIndex === 6) {
      // --- ANCIENT SANCTUM (OBSIDIAN/GOLD CORE RUNES) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      if (shadeIndex === 0) {
        radGrad.addColorStop(0, '#1c1917'); // obsidian
        radGrad.addColorStop(0.5, '#0c0a09');
        radGrad.addColorStop(1, '#020101');
      } else {
        radGrad.addColorStop(0, '#292524');
        radGrad.addColorStop(0.5, '#1c1917');
        radGrad.addColorStop(1, '#0c0a09');
      }
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = shadeIndex === 0 ? '#020101' : '#0c0a09';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 3 === 0) {
        c.strokeStyle = 'rgba(234, 179, 8, 0.6)'; // Gold runes
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(ccx - 8, ccy - 3);
        c.lineTo(ccx, ccy + 1);
        c.lineTo(ccx + 8, ccy - 3);
        c.stroke();
      }
    } else if (activeLevelIndex === 7) {
      // --- SUB-ZERO CORE (FROSTY ICE CRACKS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#0a1d37');
      radGrad.addColorStop(0.7, '#040d1a');
      radGrad.addColorStop(1, '#01040a');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#01040a';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x * 3 + y) % 4 === 0) {
        c.strokeStyle = '#00bfff';
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(ccx - 12, ccy + 2);
        c.lineTo(ccx + 4, ccy - 4);
        c.lineTo(ccx + 12, ccy + 1);
        c.stroke();
      }
    } else if (activeLevelIndex === 8) {
      // --- GILDED VAULTS (GOLD METALLIC TILES) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#423214'); // bronze gold
      radGrad.addColorStop(0.7, '#241b0b');
      radGrad.addColorStop(1, '#0f0b04');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#fbbf24';
      c.lineWidth = 0.4;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y * 2) % 3 === 0) {
        c.fillStyle = '#fef08a'; // sparkles
        c.beginPath();
        c.arc(ccx + 4, ccy - 2, 1.2, 0, Math.PI * 2);
        c.arc(ccx - 6, ccy + 3, 1.0, 0, Math.PI * 2);
        c.fill();
      }
    } else if (activeLevelIndex === 9) {
      // --- DEEP VOID ABYSS (VOID PARTICLES & SPIRALS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#120724');
      radGrad.addColorStop(0.7, '#06020c');
      radGrad.addColorStop(1, '#020004');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#8a2be2';
      c.lineWidth = 0.5;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x * 7 + y) % 5 === 0) {
        c.strokeStyle = 'rgba(192, 132, 252, 0.4)';
        c.lineWidth = 0.7;
        c.beginPath();
        c.arc(ccx, ccy, 6, 0, Math.PI);
        c.stroke();
      }
    } else if (activeLevelIndex === 10) {
      // --- VOLCANIC FISSURES (MAGMA FISSURE TILE) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#3a110c');
      radGrad.addColorStop(0.7, '#1f0906');
      radGrad.addColorStop(1, '#0c0302');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#0c0302';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 2 === 0) {
        c.strokeStyle = '#ff4500';
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(ccx - 10, ccy + 1);
        c.lineTo(ccx + 10, ccy - 1);
        c.stroke();
      }
    } else if (activeLevelIndex === 11) {
      // --- CYBER GRAVEYARD (MOTHERBOARD CIRCUITS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#1c1d1f');
      radGrad.addColorStop(0.7, '#0e0f10');
      radGrad.addColorStop(1, '#050506');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#1e293b';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x * y) % 3 === 0) {
        c.strokeStyle = '#14b8a6';
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(ccx - 10, ccy);
        c.lineTo(ccx, ccy);
        c.lineTo(ccx + 5, ccy + 3);
        c.stroke();
      }
    } else if (activeLevelIndex === 12) {
      // --- SHADOW REALM (SHADOW SWIRLS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#110a18');
      radGrad.addColorStop(0.7, '#07040a');
      radGrad.addColorStop(1, '#020104');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#020104';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 3 === 0) {
        c.fillStyle = '#6f42c1';
        c.beginPath();
        c.ellipse(ccx, ccy, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
        c.fill();
      }
    } else if (activeLevelIndex === 13) {
      // --- STORM PEAKS (ELECTRIC CHARGES) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#111a2e');
      radGrad.addColorStop(0.7, '#060a12');
      radGrad.addColorStop(1, '#020306');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = '#020306';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 3 === 1) {
        c.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(ccx - 8, ccy - 4);
        c.lineTo(ccx - 2, ccy + 2);
        c.lineTo(ccx + 2, ccy - 2);
        c.lineTo(ccx + 8, ccy + 4);
        c.stroke();
      }
    } else if (activeLevelIndex === 14) {
      // --- DREAD SWAMPS (POISON MOSS & BUBBLES) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#1b261e');
      radGrad.addColorStop(0.7, '#0f1410');
      radGrad.addColorStop(1, '#050705');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = shadeIndex === 0 ? '#050705' : '#0f1410';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x * 5 + y * 3) % 7 === 0) {
        c.fillStyle = '#28a745';
        c.beginPath();
        c.arc(ccx - 4, ccy + 1, 2, 0, Math.PI * 2);
        c.arc(ccx + 5, ccy - 2, 1.5, 0, Math.PI * 2);
        c.fill();
      }
    } else if (activeLevelIndex === 15) {
      // --- CHRONO NEXUS (CLOCKWORK GEARS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#2b1b3d');
      radGrad.addColorStop(0.7, '#150d21');
      radGrad.addColorStop(1, '#08050d');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = 'rgba(156, 39, 176, 0.4)';
      c.lineWidth = 1.0;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x + y) % 3 === 0) {
        c.strokeStyle = '#fbbf24';
        c.lineWidth = 0.5;
        c.beginPath();
        c.arc(ccx, ccy, 8, 0, Math.PI * 2);
        c.stroke();
      }
    } else if (activeLevelIndex === 16) {
      // --- HYPERION CITADEL (CELESTIAL STARMAPS) ---
      const radGrad = c.createRadialGradient(cx, cy + ISO_TILE_HEIGHT / 2, 2, cx, cy + ISO_TILE_HEIGHT / 2, ISO_TILE_WIDTH / 1.2);
      radGrad.addColorStop(0, '#0c162c');
      radGrad.addColorStop(0.7, '#040917');
      radGrad.addColorStop(1, '#010208');
      c.fillStyle = radGrad;
      c.fill();
      c.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      c.lineWidth = 0.8;
      c.stroke();

      const ccx = cx;
      const ccy = cy + ISO_TILE_HEIGHT / 2;
      if ((x * y) % 5 === 0) {
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(ccx, ccy, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }

    tileCacheRef.current[key] = tileCanvas;
    return tileCanvas;
  };

  // CORE RENDER PIPELINE: Draws grass/crypt tile layers, characters, shadows, particle slashes, and glows
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically query Graphics Quality
    const graphicsQuality = localStorage.getItem('game_graphics_quality') || 'high';

    // Intercept and bypass canvas shadows if graphics quality is not high to maximize mobile FPS
    if (graphicsQuality !== 'high') {
      Object.defineProperty(ctx, 'shadowBlur', {
        get() { return 0; },
        set() { /* bypass shadowBlur calculations to prevent lag on budget GPUs */ },
        configurable: true
      });
    }

    const player = playerRef.current;
    const activeW = WEAPONS[player.activeWeapon] || WEAPONS['pistol'];

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dynamic screen centering offset (camera follows player smoothly)
    const playerIso = gridToScreen(player.x, player.y);
    const cameraX = playerIso.x - canvas.width / 2;
    const cameraY = playerIso.y - canvas.height / 2;

    const renderOffsetX = -cameraX;
    const renderOffsetY = -cameraY;

    // Draw dark atmospheric sky gradient (represents deep sky/abyss behind the floating grid)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#020617'); // slate-950 (extreme dark space)
    skyGrad.addColorStop(0.5, levelTheme.groundColor); // blend into the zone color
    skyGrad.addColorStop(1, '#090d16'); // bottom abyss
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some slow drifting twinkling ambient background stars (extremely optimized, pre-seeded offset)
    const timeFactor = performance.now() * 0.00015;
    for (let i = 0; i < 35; i++) {
      // Create deterministic positions using basic trig math so we don't need a heavy state array
      const sX = (Math.sin(i * 123.45) * 0.5 + 0.5) * canvas.width;
      const sY = ((Math.cos(i * 543.21) * 0.5 + 0.5) * canvas.height + timeFactor * (8 + (i % 5) * 3)) % canvas.height;
      const sSize = (i % 3) === 0 ? 1.5 : 1.0;
      const opacity = 0.15 + 0.45 * Math.abs(Math.sin(timeFactor + i));
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fillRect(sX, sY, sSize, sSize);
    }

    // 1. DRAW TILE GRID (Isometric flooring with grass, roads, and volcanic lava details)
    const viewPadding = 12;
    const minX = Math.max(0, Math.floor(player.x - viewPadding));
    const maxX = Math.min(GRID_SIZE, Math.ceil(player.x + viewPadding));
    const minY = Math.max(0, Math.floor(player.y - viewPadding));
    const maxY = Math.min(GRID_SIZE, Math.ceil(player.y + viewPadding));

    // Draw the floor tiles (highly optimized with offscreen cache drawImage calls and dynamic river winding connections)
    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        const tileIso = gridToScreen(x, y, renderOffsetX, renderOffsetY);
        const isRoad = riverMapRef.current[x]?.[y] || false;

        // Animated paths are rendered dynamically to preserve smooth liquid flowing glows
        const isAnimatedRiver = isRoad && gameState.level >= 2;

        if (isAnimatedRiver) {
          // 1. Draw a basic dark background/land tile underneath so the animated river sits on a clean base
          const shadeIndex = (x * 7 + y * 13) % 3;
          const landKey = `tile_l${gameState.level}_r0_s${shadeIndex}`;
          const cachedLand = getCachedTile(landKey, gameState.level, false, shadeIndex, x, y);
          ctx.drawImage(cachedLand, tileIso.x - ISO_TILE_WIDTH / 2 - 2, tileIso.y - 2);

          // 2. Render dynamic winding flowing fluid tube on top
          const isRoadNW = riverMapRef.current[x - 1]?.[y] || false;
          const isRoadSE = riverMapRef.current[x + 1]?.[y] || false;
          const isRoadNE = riverMapRef.current[x]?.[y - 1] || false;
          const isRoadSW = riverMapRef.current[x]?.[y + 1] || false;

          const cx = tileIso.x;
          const ccy = tileIso.y + ISO_TILE_HEIGHT / 2;

          const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
          let fluidColor = '#ea580c';
          let surfaceStroke = '#fbbf24';
          const time = Date.now();

          switch (activeLevelIndex) {
            case 2: { // Obsidian Crypts - Orange Magma
              const pulse = Math.sin(time / 250 + x + y) * 15;
              fluidColor = `rgb(${Math.floor(235 + pulse)}, ${Math.floor(65 + pulse / 2)}, 15)`;
              surfaceStroke = '#f97316';
              break;
            }
            case 3: { // Cryo Glaciers - Icy Cyan
              const pulse = Math.sin(time / 300 + x * 0.5) * 10;
              fluidColor = `rgb(${Math.floor(14 + pulse)}, ${Math.floor(116 + pulse)}, ${Math.floor(144 + pulse)})`;
              surfaceStroke = '#38bdf8';
              break;
            }
            case 4: { // Toxic Refineries - Acid Green
              const bubble = Math.sin(time / 200 + x * 2 + y) * 20;
              fluidColor = `rgb(${Math.floor(22 + bubble / 3)}, ${Math.floor(163 + bubble)}, ${Math.floor(74 + bubble / 2)})`;
              surfaceStroke = '#86efac';
              break;
            }
            case 5: { // Plasma Core - Neon Pink
              const plasmaPulse = Math.sin(time / 150 + x) * 30;
              fluidColor = `rgb(${Math.floor(219 + plasmaPulse)}, ${Math.floor(39 + plasmaPulse / 2)}, ${Math.floor(119 + plasmaPulse)})`;
              surfaceStroke = '#f472b6';
              break;
            }
            case 6: { // Ancient Sanctum - Liquid Sun / Gold
              const goldPulse = Math.sin(time / 200 + x - y) * 20;
              fluidColor = `rgb(${Math.floor(234 + goldPulse)}, ${Math.floor(179 + goldPulse / 2)}, ${Math.floor(8 + goldPulse / 4)})`;
              surfaceStroke = '#fef08a';
              break;
            }
            case 7: { // Sub-Zero Core - Deep Blue Frost
              const frostPulse = Math.sin(time / 300 + x + y) * 15;
              fluidColor = `rgb(${Math.floor(8 + frostPulse / 4)}, ${Math.floor(47 + frostPulse / 2)}, ${Math.floor(113 + frostPulse)})`;
              surfaceStroke = '#60a5fa';
              break;
            }
            case 8: { // Gilded Vaults - Molten Gold
              const amberPulse = Math.sin(time / 180 + x * 0.8) * 15;
              fluidColor = `rgb(${Math.floor(180 + amberPulse)}, ${Math.floor(130 + amberPulse)}, ${Math.floor(10 + amberPulse / 2)})`;
              surfaceStroke = '#fbbf24';
              break;
            }
            case 9: { // Deep Void Abyss - Void Liquid
              const voidPulse = Math.sin(time / 220 + x + y) * 20;
              fluidColor = `rgb(${Math.floor(88 + voidPulse)}, ${Math.floor(28 + voidPulse / 2)}, ${Math.floor(135 + voidPulse)})`;
              surfaceStroke = '#c084fc';
              break;
            }
            case 10: { // Volcanic Fissures - White Hot Magma
              const lavaPulse = Math.sin(time / 150 + x * 1.5) * 25;
              fluidColor = `rgb(${Math.floor(255 - Math.abs(lavaPulse))}, ${Math.floor(90 + lavaPulse)}, ${Math.floor(10)})`;
              surfaceStroke = '#ffffff';
              break;
            }
            case 11: { // Cyber Graveyard - Coolant Fluid
              const coolPulse = Math.sin(time / 250 + x - y) * 15;
              fluidColor = `rgb(${Math.floor(13 + coolPulse / 3)}, ${Math.floor(148 + coolPulse)}, ${Math.floor(136 + coolPulse)})`;
              surfaceStroke = '#2dd4bf';
              break;
            }
            case 12: { // Shadow Realm - Shadow Miasma
              const shadowPulse = Math.sin(time / 300 + x) * 10;
              fluidColor = `rgb(${Math.floor(30 + shadowPulse)}, ${Math.floor(10 + shadowPulse / 2)}, ${Math.floor(54 + shadowPulse)})`;
              surfaceStroke = '#818cf8';
              break;
            }
            case 13: { // Storm Peaks - Electric Plasma
              const stormPulse = Math.sin(time / 100 + x * 2) * 35;
              fluidColor = `rgb(${Math.floor(6 + Math.abs(stormPulse))}, ${Math.floor(182 + stormPulse / 2)}, ${Math.floor(212 + stormPulse)})`;
              surfaceStroke = '#e0f2fe';
              break;
            }
            case 14: { // Dread Swamps - Poison Mire
              const swampPulse = Math.sin(time / 400 + x) * 8;
              fluidColor = `rgb(${Math.floor(20 + swampPulse)}, ${Math.floor(83 + swampPulse)}, ${Math.floor(45 + swampPulse / 2)})`;
              surfaceStroke = '#a3e635';
              break;
            }
            case 15: { // Chrono Nexus - Temporal Sands
              const clockPulse = Math.sin(time / 200 + x * 1.2) * 18;
              fluidColor = `rgb(${Math.floor(156 + clockPulse)}, ${Math.floor(39 + clockPulse / 2)}, ${Math.floor(176 + clockPulse)})`;
              surfaceStroke = '#fbbf24';
              break;
            }
            case 16: { // Hyperion Citadel - Cosmic Nebula Stream
              const cosmicPulse = Math.sin(time / 250 + x + y) * 15;
              fluidColor = `rgb(${Math.floor(29 + cosmicPulse / 3)}, ${Math.floor(78 + cosmicPulse / 2)}, ${Math.floor(216 + cosmicPulse)})`;
              surfaceStroke = '#fef08a';
              break;
            }
            default: {
              const defaultPulse = Math.sin(time / 200 + x) * 20;
              fluidColor = `rgb(${Math.floor(22 + defaultPulse / 3)}, ${Math.floor(163 + defaultPulse)}, ${Math.floor(74 + defaultPulse / 2)})`;
              surfaceStroke = '#86efac';
              break;
            }
          }

          ctx.fillStyle = fluidColor;

          // Central fluid pool
          ctx.beginPath();
          ctx.arc(cx, ccy, ISO_TILE_HEIGHT * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Helper to draw thick connection strip
          const drawFluidStrip = (ex: number, ey: number, width: number) => {
            const dx = ex - cx;
            const dy = ey - ccy;
            const len = Math.hypot(dx, dy);
            if (len === 0) return;
            const px = (-dy / len) * (width / 2);
            const py = (dx / len) * (width / 2);

            ctx.beginPath();
            ctx.moveTo(cx - px, ccy - py);
            ctx.lineTo(ex - px, ey - py);
            ctx.lineTo(ex + px, ey + py);
            ctx.lineTo(cx + px, ccy + py);
            ctx.closePath();
            ctx.fill();
          };

          const fluidWidth = ISO_TILE_HEIGHT * 0.65;
          if (isRoadNW) drawFluidStrip(cx - ISO_TILE_WIDTH / 2, ccy, fluidWidth);
          if (isRoadSE) drawFluidStrip(cx + ISO_TILE_WIDTH / 2, ccy, fluidWidth);
          if (isRoadNE) drawFluidStrip(cx, tileIso.y, fluidWidth);
          if (isRoadSW) drawFluidStrip(cx, tileIso.y + ISO_TILE_HEIGHT, fluidWidth);

          // Animated flowing bubbles or central current lines
          ctx.strokeStyle = surfaceStroke;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (isRoadNW || isRoadSE) {
            ctx.moveTo(cx - (isRoadNW ? ISO_TILE_WIDTH / 3 : 0), ccy);
            ctx.lineTo(cx + (isRoadSE ? ISO_TILE_WIDTH / 3 : 0), ccy);
          }
          if (isRoadNE || isRoadSW) {
            ctx.moveTo(cx, ccy - (isRoadNE ? ISO_TILE_HEIGHT / 3 : 0));
            ctx.lineTo(cx, ccy + (isRoadSW ? ISO_TILE_HEIGHT / 3 : 0));
          }
          ctx.stroke();

          // Bubbles inside toxic river
          if (gameState.level === 4 && (x + y) % 2 === 0) {
            ctx.fillStyle = '#a3e635';
            ctx.beginPath();
            ctx.arc(cx + Math.sin(Date.now() / 1000 + x) * 6, ccy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Static land tiles or cobblestone roads: draw cached offscreen canvas!
          const shadeIndex = (x * 7 + y * 13) % 3;
          
          let key = '';
          if (isRoad && gameState.level === 1) {
            const isRoadNW = riverMapRef.current[x - 1]?.[y] || false;
            const isRoadSE = riverMapRef.current[x + 1]?.[y] || false;
            const isRoadNE = riverMapRef.current[x]?.[y - 1] || false;
            const isRoadSW = riverMapRef.current[x]?.[y + 1] || false;
            key = `tile_l${gameState.level}_road_nw${isRoadNW ? 1 : 0}_se${isRoadSE ? 1 : 0}_ne${isRoadNE ? 1 : 0}_sw${isRoadSW ? 1 : 0}`;
          } else {
            key = `tile_l${gameState.level}_r0_s${shadeIndex}`;
          }

          const cachedCanvas = getCachedTile(key, gameState.level, isRoad, shadeIndex, x, y);
          ctx.drawImage(cachedCanvas, tileIso.x - ISO_TILE_WIDTH / 2 - 2, tileIso.y - 2);
        }
      }
    }

    // --- DRAW GROUND ENVIRONMENTAL ZONES ---
    const activeZones = getLevelZones(gameState.level);
    activeZones.forEach((zone) => {
      const sPos = gridToScreen(zone.x, zone.y, renderOffsetX, renderOffsetY);
      const sRadiusX = zone.radius * (ISO_TILE_WIDTH / 2);
      const sRadiusY = zone.radius * (ISO_TILE_HEIGHT / 2);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, sRadiusX, sRadiusY, 0, 0, Math.PI * 2);

      if (zone.type === 'heal') {
        // Glowing blue-green healing fountain pool
        const grad = ctx.createRadialGradient(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 0, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, sRadiusX);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0.45)');
        grad.addColorStop(0.7, 'rgba(16, 185, 129, 0.2)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Draw small floating "+" symbols
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#22d3ee';
        ctx.font = '10px sans-serif';
        const bounce = Math.sin(Date.now() * 0.003 + zone.x) * 4;
        ctx.fillText("+", sPos.x - 15, sPos.y + ISO_TILE_HEIGHT / 2 - 10 + bounce);
        ctx.fillText("+", sPos.x + 15, sPos.y + ISO_TILE_HEIGHT / 2 - 5 + bounce);
      } else if (zone.type === 'speed') {
        // Glowing yellow neon boost pad grid
        const grad = ctx.createRadialGradient(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 0, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, sRadiusX);
        grad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
        grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw speed arrow symbols inside
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("BOOST", sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
      } else if (zone.type === 'lava') {
        // Blazing red magma pit hotspots
        const grad = ctx.createRadialGradient(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 0, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, sRadiusX);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
        grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.3)');
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Draw caution sign
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("LAVA", sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
      } else if (zone.type === 'frost') {
        // Freezing cryo frost zone
        const grad = ctx.createRadialGradient(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 0, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, sRadiusX);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.55)');
        grad.addColorStop(0.7, 'rgba(30, 58, 138, 0.25)');
        grad.addColorStop(1, 'rgba(30, 58, 138, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Draw frost crystals text/icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("CRYO", sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
      } else if (zone.type === 'acid') {
        // Hazardous toxic waste acid pool
        const grad = ctx.createRadialGradient(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 0, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, sRadiusX);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
        grad.addColorStop(0.6, 'rgba(6, 95, 70, 0.25)');
        grad.addColorStop(1, 'rgba(6, 95, 70, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Draw overcharge indicator
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("🧪 OVERCHARGE", sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
      }
      ctx.restore();
    });

    // Compile dynamic renderable queue for Painter's Algorithm depth sorting
    interface Renderable {
      depth: number;
      draw: (c: CanvasRenderingContext2D) => void;
    }
    const renderQueue: Renderable[] = [];

    // A. Add Ground Loot Drops
    groundItemsRef.current.forEach((item) => {
      renderQueue.push({
        depth: item.x + item.y,
        draw: (c) => {
          const sPos = gridToScreen(item.x, item.y, renderOffsetX, renderOffsetY);
          const bounceOffset = Math.sin(item.pulseTimer) * 4;

          // Check if custom loot_item
          const isLoot = item.type === 'loot_item' && item.lootItem;
          const isWeapon = item.type === 'weapon' && item.weaponId;

          if (isLoot) {
            // Pulse ground aura
            c.strokeStyle = item.color;
            c.lineWidth = 1.5;
            c.shadowColor = item.color;
            c.shadowBlur = 10;
            c.beginPath();
            c.ellipse(
              sPos.x,
              sPos.y + ISO_TILE_HEIGHT / 2 + 4,
              10 + Math.sin(item.pulseTimer) * 2,
              5 + Math.sin(item.pulseTimer) * 1,
              0,
              0,
              Math.PI * 2
            );
            c.stroke();

            // Draw shiny crystal geode container
            c.fillStyle = item.color;
            const px = sPos.x;
            const py = sPos.y + ISO_TILE_HEIGHT / 2 - 2 + bounceOffset;
            c.beginPath();
            c.moveTo(px, py - 9);
            c.lineTo(px + 6, py - 2);
            c.lineTo(px + 4, py + 5);
            c.lineTo(px - 4, py + 5);
            c.lineTo(px - 6, py - 2);
            c.closePath();
            c.fill();

            // Highlight side
            c.fillStyle = 'rgba(255, 255, 255, 0.65)';
            c.beginPath();
            c.moveTo(px, py - 9);
            c.lineTo(px + 2, py - 2);
            c.lineTo(px, py + 4);
            c.closePath();
            c.fill();

            // Text tag for rarity above - now uses beautiful custom vector icon drawing!
            c.shadowBlur = 0;
            drawCanvasVectorIcon(c, item.lootItem!.type, item.lootItem!.subType || '', item.lootItem!.name, px, py - 12, item.color, 12);
          } else if (isWeapon) {
            // Pulse ground aura for weapon
            c.strokeStyle = item.color;
            c.lineWidth = 2;
            c.shadowColor = item.color;
            c.shadowBlur = 12;
            c.beginPath();
            c.ellipse(
              sPos.x,
              sPos.y + ISO_TILE_HEIGHT / 2 + 4,
              12 + Math.sin(item.pulseTimer) * 3,
              6 + Math.sin(item.pulseTimer) * 1.5,
              0,
              0,
              Math.PI * 2
            );
            c.stroke();

            // Draw a beautiful rotating/hovering double-diamond shape for the weapon container
            c.fillStyle = item.color;
            const px = sPos.x;
            const py = sPos.y + ISO_TILE_HEIGHT / 2 - 4 + bounceOffset;
            
            c.beginPath();
            c.moveTo(px, py - 10);
            c.lineTo(px + 7, py);
            c.lineTo(px, py + 10);
            c.lineTo(px - 7, py);
            c.closePath();
            c.fill();

            // Inner white core diamond for extreme glow contrast
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.moveTo(px, py - 6);
            c.lineTo(px + 4, py);
            c.lineTo(px, py + 6);
            c.lineTo(px - 4, py);
            c.closePath();
            c.fill();

            // Draw weapon sign vector above it
            c.shadowBlur = 0;
            drawCanvasVectorIcon(c, 'weapon', item.weaponId || '', item.weaponId || 'sword', px, py - 12, item.color, 11);
          } else {
            // Drawing glowing ground pickups
            c.shadowColor = item.color;
            c.shadowBlur = 10;

            const isPowerup = item.type.startsWith('powerup_');
            if (isPowerup) {
              // Draw an ultra-polished arcade powerup bubble
              c.strokeStyle = item.color;
              c.lineWidth = 1.5;
              c.beginPath();
              c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + bounceOffset, 8, 0, Math.PI * 2);
              c.stroke();
              
              c.fillStyle = 'rgba(255,255,255,0.15)';
              c.fill();

              // Glowing solid inner core
              c.fillStyle = item.color;
              c.beginPath();
              c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + bounceOffset, 4, 0, Math.PI * 2);
              c.fill();

              // Draw vector representation instead of emoji
              c.shadowBlur = 0;
              const iy = sPos.y + ISO_TILE_HEIGHT / 2 + bounceOffset;
              if (item.type === 'powerup_double_damage') {
                // Draw elegant orange flame
                c.fillStyle = '#f97316';
                c.beginPath();
                c.moveTo(sPos.x, iy + 4);
                c.quadraticCurveTo(sPos.x - 3, iy + 2, sPos.x - 2, iy - 2);
                c.quadraticCurveTo(sPos.x, iy, sPos.x, iy - 5);
                c.quadraticCurveTo(sPos.x + 1.5, iy, sPos.x + 2, iy - 2);
                c.quadraticCurveTo(sPos.x + 3, iy + 2, sPos.x, iy + 4);
                c.closePath();
                c.fill();
              } else if (item.type === 'powerup_hyper_speed') {
                // Draw yellow lightning bolt
                c.fillStyle = '#eab308';
                c.beginPath();
                c.moveTo(sPos.x + 1, iy - 4);
                c.lineTo(sPos.x - 2, iy);
                c.lineTo(sPos.x, iy);
                c.lineTo(sPos.x - 1, iy + 4);
                c.lineTo(sPos.x + 2, iy);
                c.lineTo(sPos.x, iy);
                c.closePath();
                c.fill();
              } else if (item.type === 'powerup_force_shield') {
                // Draw small blue shield outline
                c.strokeStyle = '#38bdf8';
                c.lineWidth = 1.2;
                c.beginPath();
                c.moveTo(sPos.x - 2.5, iy - 3);
                c.lineTo(sPos.x + 2.5, iy - 3);
                c.lineTo(sPos.x + 3, iy - 1);
                c.quadraticCurveTo(sPos.x + 3, iy + 2, sPos.x, iy + 3.5);
                c.quadraticCurveTo(sPos.x - 3, iy + 2, sPos.x - 3, iy - 1);
                c.closePath();
                c.stroke();
              } else if (item.type === 'powerup_magnet') {
                // Draw small red U-magnet
                c.strokeStyle = '#ef4444';
                c.lineWidth = 1.8;
                c.lineCap = 'round';
                c.beginPath();
                c.arc(sPos.x, iy + 0.5, 2.2, 0, Math.PI, false);
                c.stroke();
                c.fillStyle = '#3b82f6';
                c.fillRect(sPos.x - 3.2, iy - 1.5, 1, 1.8);
                c.fillRect(sPos.x + 2.2, iy - 1.5, 1, 1.8);
              }
            } else {
              // Standard materials (wood, metal, gems, potions, xp)
              c.fillStyle = item.color;
              c.beginPath();
              c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + bounceOffset, 4, 0, Math.PI * 2);
              c.fill();
              
              // Draw a resource symbol for potions & gems using vector lines
              if (item.type === 'potion') {
                const iy = sPos.y + ISO_TILE_HEIGHT / 2 + bounceOffset;
                c.shadowBlur = 0;
                c.fillStyle = '#ec4899'; // pink potion fill
                c.fillRect(sPos.x - 1.5, iy - 1, 3, 3.5);
                // bottle glass outline
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1;
                c.strokeRect(sPos.x - 2, iy - 2.5, 4, 5);
                // neck
                c.fillRect(sPos.x - 0.7, iy - 4, 1.4, 1.5);
              } else if (item.type === 'gem') {
                const iy = sPos.y + ISO_TILE_HEIGHT / 2 + bounceOffset;
                c.shadowBlur = 0;
                c.fillStyle = '#06b6d4'; // cyan gem core
                c.beginPath();
                c.moveTo(sPos.x, iy - 3.5);
                c.lineTo(sPos.x + 3, iy);
                c.lineTo(sPos.x, iy + 3.5);
                c.lineTo(sPos.x - 3, iy);
                c.closePath();
                c.fill();
                c.strokeStyle = '#ffffff';
                c.lineWidth = 0.6;
                c.stroke();
              }
            }
          }

          // Simple visual shadow under drop
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(0,0,0,0.4)';
          c.beginPath();
          c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 4, 5, 2.5, 0, 0, Math.PI * 2);
          c.fill();
        },
      });
    });

    // B. Add Resource Nodes (Trees, ores, crystal gems)
    resourceNodesRef.current.forEach((node) => {
      if (node.health <= 0) return;

      renderQueue.push({
        depth: node.x + node.y,
        draw: (c) => {
          const sPos = gridToScreen(node.x, node.y, renderOffsetX, renderOffsetY);

          // Draw base shadow
          c.fillStyle = 'rgba(0,0,0,0.45)';
          c.beginPath();
          c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT, 15, 8, 0, 0, Math.PI * 2);
          c.fill();

          const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;

          if (node.type === 'wood') {
            // Isometric level-adaptive Tree / Pylon / Spike
            const trunkW = 8;
            const trunkH = 22;

            if (activeLevelIndex === 3 || activeLevelIndex === 7) {
              // --- FROZEN GLACIER ICE STALAGMITE ---
              const h = 26;
              c.shadowColor = 'rgba(56, 189, 248, 0.5)';
              c.shadowBlur = 10;
              c.fillStyle = '#0284c7'; // deep ice blue base
              c.beginPath();
              c.moveTo(sPos.x - 7, sPos.y + ISO_TILE_HEIGHT / 2);
              c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
              c.lineTo(sPos.x + 7, sPos.y + ISO_TILE_HEIGHT / 2);
              c.closePath();
              c.fill();

              c.fillStyle = '#e0f2fe'; // frost white tip core
              c.beginPath();
              c.moveTo(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2);
              c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h + 5);
              c.lineTo(sPos.x + 3, sPos.y + ISO_TILE_HEIGHT / 2);
              c.closePath();
              c.fill();
              c.shadowBlur = 0;
            } else if (activeLevelIndex === 2 || activeLevelIndex === 6 || activeLevelIndex === 10) {
              // --- BURNT CHARCOAL / VOLCANIC BRIMSTONE SPIKE ---
              const h = 24;
              c.shadowColor = 'rgba(239, 68, 68, 0.4)';
              c.shadowBlur = 8;
              c.fillStyle = '#1c1917'; // coal black
              c.beginPath();
              c.moveTo(sPos.x - 6, sPos.y + ISO_TILE_HEIGHT / 2);
              c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
              c.lineTo(sPos.x + 6, sPos.y + ISO_TILE_HEIGHT / 2);
              c.closePath();
              c.fill();

              // lava core cracks glowing
              c.fillStyle = '#f97316';
              c.fillRect(sPos.x - 1, sPos.y + ISO_TILE_HEIGHT / 2 - h + 6, 2, h - 8);
              c.shadowBlur = 0;
            } else if (activeLevelIndex === 4 || activeLevelIndex === 12 || activeLevelIndex === 14) {
              // --- MUTATED TOXIC SPORE / GIANT BIO-LUMINESCENT MUSHROOM ---
              c.fillStyle = '#065f46'; // toxic green stalk
              c.fillRect(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2 - 16, 6, 16);

              // glowing flat cap
              const capColor = activeLevelIndex === 12 ? '#c084fc' : '#a3e635'; // purple for shadow, lime for toxic
              c.shadowColor = capColor;
              c.shadowBlur = 8;
              c.fillStyle = capColor;
              c.beginPath();
              c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 16, 14, 6, 0, 0, Math.PI * 2);
              c.fill();
              c.shadowBlur = 0;
            } else if (activeLevelIndex === 5 || activeLevelIndex === 9 || activeLevelIndex === 11 || activeLevelIndex === 13 || activeLevelIndex === 15 || activeLevelIndex === 16) {
              // --- HIGH-TECH NEON POWER PYLON ---
              c.fillStyle = '#1e293b'; // steel core rod
              c.fillRect(sPos.x - 2, sPos.y + ISO_TILE_HEIGHT / 2 - 24, 4, 24);

              // glowing energy rings
              const ringColor = activeLevelIndex === 5 ? '#a855f7' : activeLevelIndex === 11 ? '#14b8a6' : '#f43f5e';
              c.strokeStyle = ringColor;
              c.lineWidth = 2.0;
              c.shadowColor = ringColor;
              c.shadowBlur = 8;
              c.beginPath();
              c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 8, 8, 3, 0, 0, Math.PI * 2);
              c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 18, 5, 2, 0, 0, Math.PI * 2);
              c.stroke();
              c.shadowBlur = 0;
            } else {
              // --- STANDARD RUINS GRASSLAND TREE ---
              // Draw brown trunk
              c.fillStyle = '#78350f';
              c.fillRect(sPos.x - trunkW / 2, sPos.y + ISO_TILE_HEIGHT / 2 - trunkH, trunkW, trunkH);

              // Foliage hexagon caps
              c.shadowColor = 'rgba(16,185,129,0.3)';
              c.shadowBlur = 10;
              c.fillStyle = '#064e3b';
              c.beginPath();
              c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - trunkH - 8, 16, 0, Math.PI * 2);
              c.fill();

              c.fillStyle = '#0f766e';
              c.beginPath();
              c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - trunkH - 12, 12, 0, Math.PI * 2);
              c.fill();
              c.shadowBlur = 0;
            }
          } else if (node.type === 'metal') {
            // Isometric ore block (level adaptive style)
            const h = 18;
            let faceLeft = '#4b5563';
            let faceRight = '#1f2937';
            let topLid = '#9ca3af';
            let glow = 'rgba(209,213,219,0.3)';

            if (activeLevelIndex === 3 || activeLevelIndex === 7) {
              // Frozen Ice Crate
              faceLeft = '#1d4ed8'; faceRight = '#1e3a8a'; topLid = '#60a5fa'; glow = 'rgba(56,189,248,0.5)';
            } else if (activeLevelIndex === 2 || activeLevelIndex === 6 || activeLevelIndex === 10) {
              // Volcanic Basalt Block
              faceLeft = '#292524'; faceRight = '#1c1917'; topLid = '#f97316'; glow = 'rgba(249,115,22,0.5)';
            } else if (activeLevelIndex === 4 || activeLevelIndex === 12 || activeLevelIndex === 14) {
              // Toxic Sludge Canister
              faceLeft = '#15803d'; faceRight = '#166534'; topLid = '#a3e635'; glow = 'rgba(163,230,53,0.5)';
            } else if (activeLevelIndex === 5 || activeLevelIndex === 9 || activeLevelIndex === 11 || activeLevelIndex === 13 || activeLevelIndex === 15 || activeLevelIndex === 16) {
              // Cyber Server Block
              faceLeft = '#0f172a'; faceRight = '#1e293b'; topLid = '#14b8a6'; glow = 'rgba(20,184,166,0.5)';
            } else if (activeLevelIndex === 8) {
              // Gilded Gold Bars Chest
              faceLeft = '#b45309'; faceRight = '#78350f'; topLid = '#facc15'; glow = 'rgba(253,224,71,0.6)';
            }

            c.shadowColor = glow;
            c.shadowBlur = 6;

            // Draw block face (Left)
            c.fillStyle = faceLeft;
            c.beginPath();
            c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x - 12, sPos.y + ISO_TILE_HEIGHT / 2 - h + 6);
            c.lineTo(sPos.x - 12, sPos.y + ISO_TILE_HEIGHT / 2 + 6);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2);
            c.closePath();
            c.fill();

            // Right face
            c.fillStyle = faceRight;
            c.beginPath();
            c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x + 12, sPos.y + ISO_TILE_HEIGHT / 2 - h + 6);
            c.lineTo(sPos.x + 12, sPos.y + ISO_TILE_HEIGHT / 2 + 6);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2);
            c.closePath();
            c.fill();

            // Top lid
            c.fillStyle = topLid;
            c.beginPath();
            c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x - 12, sPos.y + ISO_TILE_HEIGHT / 2 - h - 6);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h - 12);
            c.lineTo(sPos.x + 12, sPos.y + ISO_TILE_HEIGHT / 2 - h - 6);
            c.closePath();
            c.fill();

            c.shadowBlur = 0;
          } else if (node.type === 'gem') {
            // Level adaptive gem crystals
            const h = 22;
            let baseColor = '#5b21b6';
            let coreColor = '#c084fc';
            let glow = 'rgba(192, 132, 252, 0.6)';

            if (activeLevelIndex === 3 || activeLevelIndex === 7) {
              // Glacier Ice Crystal (Blue)
              baseColor = '#0369a1'; coreColor = '#38bdf8'; glow = 'rgba(56,189,248,0.7)';
            } else if (activeLevelIndex === 2 || activeLevelIndex === 6 || activeLevelIndex === 10) {
              // Volcanic Fire Crystal (Red)
              baseColor = '#991b1b'; coreColor = '#f97316'; glow = 'rgba(249,115,22,0.7)';
            } else if (activeLevelIndex === 4 || activeLevelIndex === 12 || activeLevelIndex === 14) {
              // Toxic Uranium (Lime green)
              baseColor = '#166534'; coreColor = '#a3e635'; glow = 'rgba(163,230,53,0.7)';
            } else if (activeLevelIndex === 5 || activeLevelIndex === 9 || activeLevelIndex === 11 || activeLevelIndex === 13 || activeLevelIndex === 15 || activeLevelIndex === 16) {
              // Plasma / Cyber Crystal (Hot pink)
              baseColor = '#701a75'; coreColor = '#ec4899'; glow = 'rgba(236,72,153,0.7)';
            } else if (activeLevelIndex === 8) {
              // Gold Topaz
              baseColor = '#854d0e'; coreColor = '#facc15'; glow = 'rgba(250,204,21,0.7)';
            }

            c.shadowColor = glow;
            c.shadowBlur = 12;

            c.fillStyle = baseColor;
            c.beginPath();
            c.moveTo(sPos.x - 8, sPos.y + ISO_TILE_HEIGHT / 2);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x + 8, sPos.y + ISO_TILE_HEIGHT / 2);
            c.closePath();
            c.fill();

            // Bright inner crystal prism
            c.fillStyle = coreColor;
            c.beginPath();
            c.moveTo(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h + 4);
            c.lineTo(sPos.x + 3, sPos.y + ISO_TILE_HEIGHT / 2);
            c.closePath();
            c.fill();

            c.shadowBlur = 0;
          } else if (node.type === 'chest') {
            // Isometric Golden/Purple heavy chest
            const h = 14;
            c.shadowColor = 'rgba(251, 191, 36, 0.8)';
            c.shadowBlur = 15;

            // Chest front-left face (Gold plates)
            c.fillStyle = '#b45309'; // dark golden brown
            c.beginPath();
            c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x - 14, sPos.y + ISO_TILE_HEIGHT / 2 - h + 7);
            c.lineTo(sPos.x - 14, sPos.y + ISO_TILE_HEIGHT / 2 + 7);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2);
            c.closePath();
            c.fill();

            // Chest front-right face
            c.fillStyle = '#78350f'; // darker brown
            c.beginPath();
            c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x + 14, sPos.y + ISO_TILE_HEIGHT / 2 - h + 7);
            c.lineTo(sPos.x + 14, sPos.y + ISO_TILE_HEIGHT / 2 + 7);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2);
            c.closePath();
            c.fill();

            // Lid (Top face)
            c.fillStyle = '#f59e0b'; // bright gold lid
            c.beginPath();
            c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h);
            c.lineTo(sPos.x - 14, sPos.y + ISO_TILE_HEIGHT / 2 - h - 7);
            c.lineTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h - 14);
            c.lineTo(sPos.x + 14, sPos.y + ISO_TILE_HEIGHT / 2 - h - 7);
            c.closePath();
            c.fill();

            // Gold bands/straps and glowing blue electronic lock core
            c.strokeStyle = '#fbbf24';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(sPos.x - 5, sPos.y + ISO_TILE_HEIGHT / 2 - h + 3);
            c.lineTo(sPos.x - 5, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
            c.moveTo(sPos.x + 5, sPos.y + ISO_TILE_HEIGHT / 2 - h + 3);
            c.lineTo(sPos.x + 5, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
            c.stroke();

            // Lock glow core
            c.fillStyle = '#38bdf8'; // glowing neon blue keylock
            c.shadowColor = '#38bdf8';
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - h / 2, 2.5, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
          }
        },
      });
    });

    // --- B.5. Add Deployables (Spike Traps & Tesla Turrets) ---
    deployablesRef.current.forEach((dep) => {
      renderQueue.push({
        depth: dep.x + dep.y,
        draw: (c) => {
          const sPos = gridToScreen(dep.x, dep.y, renderOffsetX, renderOffsetY);
          
          if (dep.type === 'spike_trap') {
            // Draw wooden spike trap
            c.save();
            c.shadowColor = '#d97706';
            c.shadowBlur = 6;
            
            // Draw wooden base plate
            c.fillStyle = '#78350f';
            c.beginPath();
            c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 22, 11, 0, 0, Math.PI * 2);
            c.fill();
            
            // Draw wooden spikes pointing upwards
            c.fillStyle = '#f59e0b';
            c.strokeStyle = '#451a03';
            c.lineWidth = 1;
            for (let i = -2; i <= 2; i++) {
              const sx = sPos.x + i * 7;
              const sy = sPos.y + ISO_TILE_HEIGHT / 2 + Math.abs(i) * 2;
              c.beginPath();
              c.moveTo(sx - 3, sy);
              c.lineTo(sx, sy - 14);
              c.lineTo(sx + 3, sy);
              c.closePath();
              c.fill();
              c.stroke();
            }
            
            // Health bar for spikes
            if (dep.health < dep.maxHealth) {
              const hpPercent = dep.health / dep.maxHealth;
              c.fillStyle = 'rgba(0,0,0,0.6)';
              c.fillRect(sPos.x - 12, sPos.y + 10, 24, 3);
              c.fillStyle = '#ef4444';
              c.fillRect(sPos.x - 12, sPos.y + 10, 24 * hpPercent, 3);
            }
            c.restore();
          } else if (dep.type === 'tesla_turret') {
            // Draw futuristic Tesla Turret
            c.save();
            c.shadowColor = '#06b6d4';
            c.shadowBlur = 10;
            
            // Draw metal platform base
            c.fillStyle = '#334155';
            c.strokeStyle = '#475569';
            c.lineWidth = 1.5;
            c.beginPath();
            c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 20, 10, 0, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            
            // Draw mounting pole
            c.fillStyle = '#64748b';
            c.fillRect(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2 - 25, 6, 25);
            c.strokeStyle = '#1e293b';
            c.strokeRect(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2 - 25, 6, 25);
            
            // Draw golden pulsing coils
            const spin = (Date.now() / 150) % (Math.PI * 2);
            const coilPulse = Math.abs(Math.sin(spin)) * 4;
            c.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
              const coilY = sPos.y + ISO_TILE_HEIGHT / 2 - 12 - i * 5;
              c.beginPath();
              c.ellipse(sPos.x, coilY, 6 + coilPulse * 0.5, 3, 0, 0, Math.PI * 2);
              c.fill();
            }
            
            // Draw blue pulsing plasma orb on top
            const glow = Math.sin(Date.now() / 80) * 3;
            c.fillStyle = '#22d3ee';
            c.beginPath();
            c.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 28, 6 + glow * 0.5, 0, Math.PI * 2);
            c.fill();
            
            // Electric spark arcs if ready to shoot!
            if (Math.random() < 0.3) {
              c.strokeStyle = '#a5f3fc';
              c.lineWidth = 1.5;
              c.beginPath();
              c.moveTo(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 28);
              c.lineTo(sPos.x + (Math.random() - 0.5) * 24, sPos.y + ISO_TILE_HEIGHT / 2 - 40 - Math.random() * 10);
              c.stroke();
            }
            
            // Health bar for turret
            if (dep.health < dep.maxHealth) {
              const hpPercent = dep.health / dep.maxHealth;
              c.fillStyle = 'rgba(0,0,0,0.6)';
              c.fillRect(sPos.x - 12, sPos.y - 42, 24, 3);
              c.fillStyle = '#22d3ee';
              c.fillRect(sPos.x - 12, sPos.y - 42, 24 * hpPercent, 3);
            }
            
            c.restore();
          }
        }
      });
    });

    // --- B.6. Add Aero-Drone Companion ---
    if (playerState.hasCompanionDrone) {
      renderQueue.push({
        depth: player.x + player.y + 0.1, // slightly on top of player depth-wise
        draw: (c) => {
          // Drone floats in a circular orbit around the player
          const time = Date.now() * 0.003;
          const orbitRadiusX = 35;
          const orbitRadiusY = 18;
          const playerIso = gridToScreen(player.x, player.y, renderOffsetX, renderOffsetY);
          
          const dx = Math.sin(time) * orbitRadiusX;
          const dy = Math.cos(time) * orbitRadiusY - 25; // float 25px above player's base
          
          const droneX = playerIso.x + dx;
          const droneY = playerIso.y + dy;
          
          c.save();
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 8;
          
          // Draw metallic main body
          c.fillStyle = '#475569';
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 1;
          c.beginPath();
          c.ellipse(droneX, droneY, 7, 5, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          
          // Draw camera lens eye
          c.fillStyle = '#fbbf24';
          c.beginPath();
          c.arc(droneX + Math.sin(time + 1.5) * 3, droneY + 1, 2, 0, Math.PI * 2);
          c.fill();
          
          // Draw small rotating thruster wings
          c.fillStyle = '#1e293b';
          c.fillRect(droneX - 11, droneY - 2, 4, 2);
          c.fillRect(droneX + 7, droneY - 2, 4, 2);
          
          // Draw cyan exhaust flame glow
          const flameH = 3 + Math.random() * 4;
          c.fillStyle = 'rgba(34, 211, 238, 0.85)';
          c.beginPath();
          c.moveTo(droneX - 1, droneY + 5);
          c.lineTo(droneX + 1, droneY + 5);
          c.lineTo(droneX, droneY + 5 + flameH);
          c.closePath();
          c.fill();
          
          c.restore();
          
          // Store raw coordinates for projectiles spawning
          companionDronePosRef.current = {
            x: player.x + (dx / (ISO_TILE_WIDTH / 2)),
            y: player.y + (dy / (ISO_TILE_HEIGHT / 2)),
            screenX: droneX,
            screenY: droneY
          };
        }
      });
    }

    // C. Add Player
    renderQueue.push({
      depth: player.x + player.y,
      draw: (c) => {
        const sPos = gridToScreen(player.x, player.y, renderOffsetX, renderOffsetY);

        // Check if player is moving
        const isMoving = Math.abs(joystickVectorRef.current.x) > 0.05 || Math.abs(joystickVectorRef.current.y) > 0.05;
        const bob = isMoving 
          ? Math.sin(performance.now() * 0.015) * 2.5 
          : Math.sin(performance.now() * 0.003) * 0.6; // subtle breathing when idle
        const legsAngle = isMoving ? Math.sin(performance.now() * 0.015) * 6 : 0;

        // Walk sway / tilt rotation
        const tiltAngle = isMoving ? Math.sin(performance.now() * 0.015) * 0.05 : 0;

        // Combat Squash & Stretch scales
        let scaleX = 1;
        let scaleY = 1;
        if (player.damageFlash && player.damageFlash > 0) {
          const t = player.damageFlash / 0.18; // 1 -> 0
          scaleY = 1 - Math.sin(t * Math.PI) * 0.22;
          scaleX = 1 + Math.sin(t * Math.PI) * 0.22;
        }

        // Draw trailing ghosts if actively dashing
        if (player.dashTimer && player.dashTimer > 0) {
          const trailCount = 3;
          for (let g = 1; g <= trailCount; g++) {
            // Draw a simplified cyan glow trail behind player
            const backDist = g * 0.18; // proportion back
            const gPos = gridToScreen(
              player.x - (player.dashVx || 0) * 0.016 * backDist,
              player.y - (player.dashVy || 0) * 0.016 * backDist,
              renderOffsetX,
              renderOffsetY
            );
            
            c.save();
            c.translate(gPos.x, gPos.y + ISO_TILE_HEIGHT / 2 + 5);
            c.scale(scaleX, scaleY);
            c.rotate(tiltAngle);
            c.translate(-gPos.x, -(gPos.y + ISO_TILE_HEIGHT / 2 + 5));
            
            c.globalAlpha = 0.45 / g; // fades
            c.fillStyle = '#22d3ee'; // bright cyan ghost
            c.shadowColor = '#06b6d4';
            c.shadowBlur = 10;
            
            // Draw body capsule
            const gPy = gPos.y + ISO_TILE_HEIGHT / 2 - 4 + bob;
            c.beginPath();
            c.ellipse(gPos.x, gPy, 8, 4, 0, 0, Math.PI * 2);
            c.fill();
            c.fillRect(gPos.x - 8, gPy - 26 + 4, 16, 26 - 6);
            
            // Draw head
            c.beginPath();
            c.arc(gPos.x, gPy - 29, 6, 0, Math.PI * 2);
            c.fill();
            
            c.restore();
          }
        }

        c.save();

        // Translate to player's base for proper pivot rotation & scaling
        const pivotX = sPos.x;
        const pivotY = sPos.y + ISO_TILE_HEIGHT / 2 + 5;
        c.translate(pivotX, pivotY);
        c.scale(scaleX, scaleY);
        c.rotate(tiltAngle);
        c.translate(-pivotX, -pivotY);

        // Apply filters for damage flash
        const originalFilter = c.filter;
        if (player.damageFlash && player.damageFlash > 0) {
          c.filter = 'brightness(3) sepia(1) hue-rotate(-50deg) saturate(8)';
        }

        // Find active equipped item details
        const equippedWeapon = player.items?.find(i => player.equippedItemIds?.includes(i.id) && i.type === 'weapon');
        const equippedArmor = player.items?.find(i => player.equippedItemIds?.includes(i.id) && i.type === 'armor');
        const equippedAccessory = player.items?.find(i => player.equippedItemIds?.includes(i.id) && i.type === 'accessory');

        // Draw Player base shadow ring
        c.fillStyle = 'rgba(0,0,0,0.4)';
        c.beginPath();
        c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 5, 12, 6, 0, 0, Math.PI * 2);
        c.fill();

        // Draw selection helper boundary (glowing circle matching active weapon theme)
        c.strokeStyle = activeW.color;
        c.lineWidth = 1.5;
        c.shadowColor = activeW.color;
        c.shadowBlur = 5;
        c.beginPath();
        c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 5, 14, 7, 0, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;

        // Draw animated walking legs
        c.fillStyle = '#1c1917'; // dark cyber boots
        if (isMoving) {
          // Left foot
          c.beginPath();
          c.ellipse(sPos.x - 4 + legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3 - Math.abs(legsAngle) / 4, 3, 1.5, 0, 0, Math.PI * 2);
          c.fill();
          // Right foot
          c.beginPath();
          c.ellipse(sPos.x + 4 - legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3 - Math.abs(legsAngle) / 4, 3, 1.5, 0, 0, Math.PI * 2);
          c.fill();

          // Sparking heel flame thrusters for hyper movement juice!
          const flameH = 4 + Math.sin(performance.now() * 0.1) * 3;
          const flameGrad = c.createLinearGradient(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 3, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 10);
          flameGrad.addColorStop(0, '#38bdf8'); // sky blue core
          flameGrad.addColorStop(0.4, '#f97316'); // hot orange
          flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)'); // tattered red tail
          
          c.fillStyle = flameGrad;
          // Left heel spark
          c.beginPath();
          c.moveTo(sPos.x - 5.5 + legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
          c.lineTo(sPos.x - 7.5 + legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3 + flameH);
          c.lineTo(sPos.x - 3.5 + legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3 + flameH);
          c.closePath();
          c.fill();
          // Right heel spark
          c.beginPath();
          c.moveTo(sPos.x + 2.5 - legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3);
          c.lineTo(sPos.x + 0.5 - legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3 + flameH);
          c.lineTo(sPos.x + 4.5 - legsAngle / 2, sPos.y + ISO_TILE_HEIGHT / 2 + 3 + flameH);
          c.closePath();
          c.fill();
        } else {
          c.fillRect(sPos.x - 6, sPos.y + ISO_TILE_HEIGHT / 2 + 1, 4, 3);
          c.fillRect(sPos.x + 2, sPos.y + ISO_TILE_HEIGHT / 2 + 1, 4, 3);
        }

        // Draw Player body (Stylized, high-fidelity elite hero warrior with tapered proportions and organic shading)
        const bodyH = 26;
        const headRadius = 6.5;
        const px = sPos.x;
        const py = sPos.y + ISO_TILE_HEIGHT / 2 - 4 + bob; // bobbing the torso and head

        // Dynamic Armor-driven Cape and Scarf colors
        let capeColor = '#dc2626'; // Default rich warrior crimson
        let capeUnderColor = '#991b1b'; // Dark shadow under-cape
        let capeGlow = 'rgba(220, 38, 38, 0.4)';
        let isEnergyCape = false;

        if (equippedArmor) {
          const nameLower = (equippedArmor.name || '').toLowerCase();
          const rarity = (equippedArmor.rarity || '').toLowerCase();
          if (nameLower.includes('paladin') || rarity === 'ancient' || rarity === 'mythic') {
            capeColor = '#fbbf24'; // Celestial holy gold
            capeUnderColor = '#b45309';
            capeGlow = 'rgba(251, 191, 36, 0.6)';
            isEnergyCape = true;
          } else if (nameLower.includes('aegis') || rarity === 'legendary') {
            capeColor = '#22d3ee'; // Plasma cyber cyan
            capeUnderColor = '#0891b2';
            capeGlow = 'rgba(34, 211, 238, 0.6)';
            isEnergyCape = true;
          } else if (nameLower.includes('harness') || rarity === 'epic') {
            capeColor = '#ec4899'; // Void neon-pink trailing banner
            capeUnderColor = '#be185d';
            capeGlow = 'rgba(236, 72, 153, 0.5)';
            isEnergyCape = true;
          } else if (nameLower.includes('titanium') || rarity === 'rare') {
            capeColor = '#3b82f6'; // Deep titanium cobalt blue
            capeUnderColor = '#1d4ed8';
            capeGlow = 'rgba(59, 130, 246, 0.4)';
          } else if (nameLower.includes('kevlar') || rarity === 'uncommon') {
            capeColor = '#22c55e'; // Ranger green cloth
            capeUnderColor = '#15803d';
            capeGlow = 'rgba(34, 197, 94, 0.3)';
          } else {
            capeColor = '#6b7280'; // Scavenger leather ash
            capeUnderColor = '#374151';
          }
        }

        // 1. Flowing Layered Warrior Cape (gorgeous dynamic organic cloth folding with Bezier curves)
        const capeTime = performance.now() * 0.012;
        const capeWave1 = Math.sin(capeTime) * 3;
        const capeWave2 = Math.cos(capeTime * 0.8) * 2;
        const capeAngle = player.facingAngle + Math.PI + (isMoving ? 0.22 : 0);
        
        c.save();
        if (isEnergyCape) {
          c.shadowColor = capeColor;
          c.shadowBlur = 12;
        }

        // Layer A: Under-cape shadow layer (slightly wider and offset for realistic thickness)
        c.fillStyle = capeUnderColor;
        c.beginPath();
        c.moveTo(px, py - bodyH + 9);
        c.quadraticCurveTo(
          px + Math.cos(capeAngle) * 12 + capeWave2 - 2.5,
          py - bodyH + 13 + capeWave1,
          px + Math.cos(capeAngle) * 28 + (isMoving ? capeWave1 * 1.6 : 0) - 3,
          py - bodyH + 24 + capeWave2
        );
        c.lineTo(px + Math.cos(capeAngle) * 19 - 3, py - bodyH + 29 + capeWave1);
        c.quadraticCurveTo(
          px + Math.cos(capeAngle) * 8 - 1,
          py - bodyH + 16 + capeWave2,
          px,
          py - bodyH + 11
        );
        c.closePath();
        c.fill();

        // Layer B: Main Over-cape (Vibrant colored dynamic banner)
        c.fillStyle = capeColor;
        c.beginPath();
        c.moveTo(px, py - bodyH + 8);
        c.quadraticCurveTo(
          px + Math.cos(capeAngle) * 14 + capeWave1,
          py - bodyH + 11 + capeWave2,
          px + Math.cos(capeAngle) * 26 + (isMoving ? capeWave1 * 1.5 : 0),
          py - bodyH + 22 + capeWave1
        );
        c.lineTo(px + Math.cos(capeAngle) * 20, py - bodyH + 27 + capeWave2);
        c.quadraticCurveTo(
          px + Math.cos(capeAngle) * 9,
          py - bodyH + 15 + capeWave1,
          px,
          py - bodyH + 11
        );
        c.closePath();
        c.fill();
        c.restore();

        // 2. High-Tech Tapered Chestplate & Torso Plating (Wide shoulders tapering sleekly to a trim waist)
        let armorColorPrimary = '#292524'; // default stone armor primary
        let armorColorSecondary = '#44403c'; // light-struck highlights
        let armorColorShadow = '#1c1917'; // dark shaded side
        let trimColor = '#78716c'; // metallic titanium trims
        
        if (equippedArmor) {
          const rarity = (equippedArmor.rarity || '').toLowerCase();
          if (rarity === 'ancient' || rarity === 'mythic') {
            armorColorPrimary = '#fbbf24'; armorColorSecondary = '#fef08a'; armorColorShadow = '#b45309'; trimColor = '#ffffff';
          } else if (rarity === 'legendary') {
            armorColorPrimary = '#06b6d4'; armorColorSecondary = '#67e8f9'; armorColorShadow = '#083344'; trimColor = '#22d3ee';
          } else if (rarity === 'epic') {
            armorColorPrimary = '#8b5cf6'; armorColorSecondary = '#c084fc'; armorColorShadow = '#4c1d95'; trimColor = '#e9d5ff';
          } else if (rarity === 'rare') {
            armorColorPrimary = '#2563eb'; armorColorSecondary = '#60a5fa'; armorColorShadow = '#1e3a8a'; trimColor = '#93c5fd';
          } else if (rarity === 'uncommon') {
            armorColorPrimary = '#16a34a'; armorColorSecondary = '#4ade80'; armorColorShadow = '#14532d'; trimColor = '#bbf7d0';
          }
        }

        // Armored High-Collar Gorget (Frames the neck and helmet beautifully)
        c.fillStyle = armorColorShadow;
        c.beginPath();
        c.ellipse(px, py - bodyH + 3, 7, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = armorColorPrimary;
        c.fillRect(px - 5, py - bodyH, 10, 4);

        // LEFT PECTORAL SHIELD PLATE (light-struck highlight face)
        c.fillStyle = armorColorSecondary;
        c.beginPath();
        c.moveTo(px, py - bodyH + 3);
        c.lineTo(px - 6.5, py - bodyH + 3);
        c.lineTo(px - 5, py - 5);
        c.lineTo(px, py - 3.5);
        c.closePath();
        c.fill();

        // RIGHT PECTORAL SHIELD PLATE (shaded side)
        c.fillStyle = armorColorShadow;
        c.beginPath();
        c.moveTo(px, py - bodyH + 3);
        c.lineTo(px + 6.5, py - bodyH + 3);
        c.lineTo(px + 5, py - 5);
        c.lineTo(px, py - 3.5);
        c.closePath();
        c.fill();

        // Beautiful golden spine chest-seam line
        c.strokeStyle = trimColor;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(px, py - bodyH + 3);
        c.lineTo(px, py - 3.5);
        c.stroke();

        // Segmented lower abdominal plates for visual grit and detail
        c.fillStyle = armorColorPrimary;
        c.fillRect(px - 4, py - 3.5, 8, 3.5);
        c.fillStyle = armorColorShadow;
        c.fillRect(px, py - 3.5, 4, 3.5);
        c.strokeStyle = '#0e0c0b';
        c.lineWidth = 0.8;
        c.strokeRect(px - 4, py - 3.5, 8, 3.5);

        // Ornate golden-buckled combat utility belt
        c.fillStyle = '#451a03'; // Heavy brown leather belt band
        c.fillRect(px - 5, py, 10, 2);
        c.fillStyle = '#fbbf24'; // Shiny golden buckle shield
        c.fillRect(px - 2, py - 0.5, 4, 3);
        c.strokeStyle = '#d97706';
        c.lineWidth = 0.6;
        c.strokeRect(px - 2, py - 0.5, 4, 3);

        // Small detailed belt-mounted utility pouch attachments
        c.fillStyle = '#271201';
        c.fillRect(px - 4.5, py, 1.8, 2.5);
        c.fillRect(px + 2.7, py, 1.8, 2.5);

        // 3. Knightly Shoulder Pauldrons (curved with detailed trims)
        let padColor = '#44403c';
        let padGlowColor = activeW.color;
        if (equippedArmor) {
          const rarity = (equippedArmor.rarity || '').toLowerCase();
          if (rarity === 'ancient' || rarity === 'mythic') { padColor = '#fbbf24'; padGlowColor = '#fbbf24'; }
          else if (rarity === 'legendary') { padColor = '#22d3ee'; padGlowColor = '#22d3ee'; }
          else if (rarity === 'epic') { padColor = '#a855f7'; padGlowColor = '#c084fc'; }
          else if (rarity === 'rare') { padColor = '#3b82f6'; padGlowColor = '#60a5fa'; }
          else if (rarity === 'uncommon') { padColor = '#22c55e'; padGlowColor = '#4ade80'; }
        }

        // Left Heavy Pauldron
        c.fillStyle = padColor;
        c.strokeStyle = '#0e0c0b';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(px - 7.5, py - bodyH + 6, 4.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.strokeStyle = padGlowColor;
        c.lineWidth = 0.8;
        c.beginPath();
        c.arc(px - 7.5, py - bodyH + 6, 2.5, 0, Math.PI * 2);
        c.stroke();

        // Right Heavy Pauldron
        c.fillStyle = padColor;
        c.strokeStyle = '#0e0c0b';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(px + 7.5, py - bodyH + 6, 4.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.strokeStyle = padGlowColor;
        c.lineWidth = 0.8;
        c.beginPath();
        c.arc(px + 7.5, py - bodyH + 6, 2.5, 0, Math.PI * 2);
        c.stroke();

        // 4. Glowing Arc Reactor chest core (pulsing actively)
        const corePulse = 3.5 + Math.sin(performance.now() * 0.008) * 1.5;
        c.shadowColor = padGlowColor;
        c.shadowBlur = 10;
        c.fillStyle = padGlowColor;
        c.beginPath();
        c.arc(px, py - bodyH + 11, corePulse / 2, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;

        // 5. Elite Battle Helmet & Floating Feathered Plume
        let helmetColor = '#44403c';
        let metalShine = '#78716c';
        let visorColor = '#ef4444'; // Red starting optics
        let hasCrown = false;
        let crownColor = '#fbbf24';
        let plumeColor = '#dc2626'; // Red active feather crest

        if (equippedArmor) {
          const nameLower = (equippedArmor.name || '').toLowerCase();
          const rarity = (equippedArmor.rarity || '').toLowerCase();
          if (nameLower.includes('paladin') || rarity === 'ancient' || rarity === 'mythic') {
            helmetColor = '#facc15';
            metalShine = '#fef08a';
            visorColor = '#38bdf8';
            hasCrown = true;
            plumeColor = '#fbbf24';
          } else if (nameLower.includes('aegis') || rarity === 'legendary') {
            helmetColor = '#1e293b';
            metalShine = '#64748b';
            visorColor = '#22d3ee';
            hasCrown = true;
            crownColor = '#06b6d4';
            plumeColor = '#06b6d4';
          } else if (nameLower.includes('harness') || rarity === 'epic') {
            helmetColor = '#2e1065';
            metalShine = '#a78bfa';
            visorColor = '#f43f5e';
            plumeColor = '#ec4899';
          } else if (nameLower.includes('titanium') || rarity === 'rare') {
            helmetColor = '#334155';
            metalShine = '#94a3b8';
            visorColor = '#a855f7';
            plumeColor = '#3b82f6';
          } else if (nameLower.includes('kevlar') || rarity === 'uncommon') {
            helmetColor = '#0f172a';
            metalShine = '#475569';
            visorColor = '#10b981';
            plumeColor = '#16a34a';
          }
        }

        // Draw flowing wind-swept feather plume crest on helmet crown
        const plumeTime = performance.now() * 0.015;
        const plumeSway = Math.sin(plumeTime) * 1.8;
        const plumeAngle = player.facingAngle + Math.PI; // sweeps behind the direction of travel
        c.fillStyle = plumeColor;
        c.beginPath();
        c.moveTo(px, py - bodyH - 3 - headRadius);
        c.quadraticCurveTo(
          px + Math.cos(plumeAngle) * 9 + plumeSway,
          py - bodyH - 3 - headRadius - 5 + Math.sin(plumeTime * 0.8) * 1,
          px + Math.cos(plumeAngle) * 17 + plumeSway,
          py - bodyH - 3 - headRadius + 2 + plumeSway
        );
        c.quadraticCurveTo(
          px + Math.cos(plumeAngle) * 7,
          py - bodyH - 3 - headRadius + 2,
          px,
          py - bodyH - 3 - headRadius + 1
        );
        c.closePath();
        c.fill();

        // Main polished Helmet dome
        c.fillStyle = helmetColor;
        c.strokeStyle = '#0e0c0b';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(px, py - bodyH - 3, headRadius, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Shaded visor mouth jawguard
        c.fillStyle = '#1c1917';
        c.beginPath();
        c.arc(px, py - bodyH - 3, headRadius, player.facingAngle - 0.45, player.facingAngle + 0.45);
        c.lineTo(px, py - bodyH - 3 + headRadius);
        c.closePath();
        c.fill();

        // Metallic reflection shine arc
        c.fillStyle = metalShine;
        c.beginPath();
        c.arc(px - 1.8, py - bodyH - 5, 1.8, 0, Math.PI * 2);
        c.fill();

        // Heavy Crown/Wings overlay (Paladin/Legendary visual tier upgrades)
        if (hasCrown) {
          c.fillStyle = crownColor;
          c.shadowColor = crownColor;
          c.shadowBlur = 8;
          c.beginPath();
          c.moveTo(px - 5, py - bodyH - 8);
          c.lineTo(px - 8, py - bodyH - 12);
          c.lineTo(px - 3, py - bodyH - 9);
          c.lineTo(px, py - bodyH - 15); // Celestial crown peak
          c.lineTo(px + 3, py - bodyH - 9);
          c.lineTo(px + 8, py - bodyH - 12);
          c.lineTo(px + 5, py - bodyH - 8);
          c.closePath();
          c.fill();
          c.shadowBlur = 0;
        }

        // 6. Glowing visor optics (Sleek wrap-around glowing glass visor band)
        const visorAngle = player.facingAngle;
        const vx = px + Math.cos(visorAngle) * (headRadius - 1.2);
        const vy = py - bodyH - 3 + Math.sin(visorAngle) * (headRadius / 3);

        c.strokeStyle = visorColor;
        c.lineWidth = 1.8;
        c.shadowColor = visorColor;
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(px, py - bodyH - 3, headRadius - 0.5, visorAngle - 0.4, visorAngle + 0.4);
        c.stroke();
        c.shadowBlur = 0;

        // White glowing reflection focal laser optic core
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(vx, vy, 1.2, 0, Math.PI * 2);
        c.fill();

        // Draw orbital shield forcefield arcs around waist for advanced gear
        if (equippedArmor) {
          const rarity = (equippedArmor.rarity || '').toLowerCase();
          if (['rare', 'epic', 'legendary', 'mythic', 'ancient'].includes(rarity)) {
            c.save();
            const rotAngle = (performance.now() * 0.0018) % (Math.PI * 2);
            c.strokeStyle = padGlowColor;
            c.lineWidth = 1;
            c.shadowColor = padGlowColor;
            c.shadowBlur = 5;

            // Translucent ring
            c.beginPath();
            c.setLineDash([4, 6]);
            c.ellipse(px, py - bodyH + 13, 16, 8, rotAngle, 0, Math.PI * 2);
            c.stroke();

            // Orb satellites rotating
            c.fillStyle = padGlowColor;
            const satCount = rarity === 'legendary' || rarity === 'ancient' || rarity === 'mythic' ? 3 : 2;
            for (let s = 0; s < satCount; s++) {
              const satAngle = rotAngle + (s * Math.PI * 2) / satCount;
              const satX = px + Math.cos(satAngle) * 16;
              const satY = py - bodyH + 13 + Math.sin(satAngle) * 8;
              
              c.beginPath();
              c.arc(satX, satY, 1.8, 0, Math.PI * 2);
              c.fill();
            }
            c.restore();
          }
        }

        // 7. Tactical Companion Drone (orbits or hovers above)
        const droneAngle = (performance.now() * 0.0015) % (Math.PI * 2);
        const droneX = px + Math.cos(droneAngle) * 16;
        const droneY = py - bodyH - 12 + Math.sin(performance.now() * 0.004) * 3;

        // Mini shadow
        c.fillStyle = 'rgba(0,0,0,0.3)';
        c.beginPath();
        c.ellipse(droneX, sPos.y + ISO_TILE_HEIGHT / 2 + 5, 3, 1.5, 0, 0, Math.PI * 2);
        c.fill();

        // Draw upgraded Drone based on active accessory/level
        let droneColor = '#27272a';
        let droneEye = '#22d3ee';
        if (equippedAccessory) {
          const nameLower = (equippedAccessory.name || '').toLowerCase();
          if (nameLower.includes('core') || nameLower.includes('node') || nameLower.includes('amulet')) {
            droneColor = '#fbbf24'; // gold heavy mecha drone
            droneEye = '#f43f5e'; // ruby high-precision lens
          }
        }

        c.fillStyle = droneColor;
        c.beginPath();
        c.arc(droneX, droneY, 3, 0, Math.PI * 2);
        c.fill();

        // Mini wing rudders on drone
        c.strokeStyle = droneColor;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(droneX - 4.5, droneY);
        c.lineTo(droneX + 4.5, droneY);
        c.stroke();

        // Drone core lens glow
        c.fillStyle = droneEye;
        c.shadowColor = droneEye;
        c.shadowBlur = 4;
        c.beginPath();
        c.arc(droneX + Math.cos(droneAngle + Math.PI) * 1.2, droneY, 0.9, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;

        // Searchlight cone beam casting downwards
        const beamGrad = c.createLinearGradient(droneX, droneY, droneX, sPos.y + ISO_TILE_HEIGHT / 2 + 5);
        beamGrad.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
        beamGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
        c.fillStyle = beamGrad;
        c.beginPath();
        c.moveTo(droneX - 1.2, droneY);
        c.lineTo(droneX + 1.2, droneY);
        c.lineTo(droneX + 6, sPos.y + ISO_TILE_HEIGHT / 2 + 5);
        c.lineTo(droneX - 6, sPos.y + ISO_TILE_HEIGHT / 2 + 5);
        c.closePath();
        c.fill();

        // 8. Draw Weapon in Hand (Completely re-designed and visual-upgraded)
        const handX = px + Math.cos(visorAngle + 0.5) * 8;
        const handY = py - bodyH + 12 + Math.sin(visorAngle + 0.5) * 3;
        const wAngle = visorAngle;
        const isStaff = ['void_staff', 'fire_staff', 'ice_staff', 'wind_staff', 'chrono_repeater'].includes(activeW.id);

        // Visual weapon recoil bounce
        const recoilAmt = (weaponRecoilRef.current || 0) * 4.5;
        const rx = handX - Math.cos(wAngle) * recoilAmt;
        const ry = handY - Math.sin(wAngle) * recoilAmt * 0.7;

        c.shadowColor = activeW.color;
        c.shadowBlur = 6;

        if (isStaff) {
          // ELEVATED ELEMENTAL BLUEPRINT STAFFS & CHRONO COGS
          const tipLength = 19;
          const tipX = rx + Math.cos(wAngle) * tipLength;
          const tipY = ry + Math.sin(wAngle) * (tipLength * 0.7);

          // Shaft base
          c.strokeStyle = activeW.id === 'chrono_repeater' ? '#fbbf24' : '#78350f'; // gilded chrome or ancient redwood
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(rx, ry);
          c.lineTo(tipX, tipY);
          c.stroke();

          if (activeW.id === 'chrono_repeater') {
            // Clockwork Cog staff: draw rotating golden gears/cogs at the crest!
            const gearRot = (performance.now() * 0.003) % (Math.PI * 2);
            c.save();
            c.translate(tipX, tipY);
            c.rotate(gearRot);
            c.strokeStyle = '#d97706';
            c.lineWidth = 1.5;
            // Draw star wheel cog shape
            c.beginPath();
            for (let g = 0; g < 8; g++) {
              const a1 = (g * Math.PI * 2) / 8;
              const a2 = ((g + 0.5) * Math.PI * 2) / 8;
              c.lineTo(Math.cos(a1) * 5, Math.sin(a1) * 5);
              c.lineTo(Math.cos(a2) * 7, Math.sin(a2) * 7);
            }
            c.closePath();
            c.stroke();
            c.restore();

            // central core clock gem
            c.fillStyle = '#fbbf24';
            c.beginPath();
            c.arc(tipX, tipY, 3, 0, Math.PI * 2);
            c.fill();

          } else if (activeW.id === 'fire_staff') {
            // Fire staff: Blazing ruby with sparks
            c.strokeStyle = '#ef4444';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
            c.stroke();

            // Glowing hot core
            c.fillStyle = '#f97316';
            c.beginPath();
            c.arc(tipX, tipY, 3, 0, Math.PI * 2);
            c.fill();

            // Miniature rising embers at tip
            const emberX = tipX + (Math.sin(performance.now() * 0.1) * 2);
            const emberY = tipY - 4 - ((performance.now() * 0.05) % 6);
            c.fillStyle = 'rgba(253, 186, 116, 0.8)';
            c.fillRect(emberX - 0.5, emberY - 0.5, 1, 1);

          } else if (activeW.id === 'ice_staff') {
            // Ice Staff: Frost crystal star crown
            c.strokeStyle = '#06b6d4';
            c.lineWidth = 1.2;
            c.beginPath();
            // Draw diamond snowflake shape
            c.moveTo(tipX, tipY - 5);
            c.lineTo(tipX + 3.5, tipY);
            c.lineTo(tipX, tipY + 5);
            c.lineTo(tipX - 3.5, tipY);
            c.closePath();
            c.stroke();

            c.fillStyle = '#e0f2fe';
            c.beginPath();
            c.arc(tipX, tipY, 2, 0, Math.PI * 2);
            c.fill();

          } else if (activeW.id === 'wind_staff') {
            // Wind Staff: Spiral swirling vortex wings
            c.strokeStyle = '#10b981';
            c.lineWidth = 1.2;
            c.beginPath();
            // Swirling crescent arcs
            c.arc(tipX, tipY, 4.5, performance.now() * 0.01, performance.now() * 0.01 + Math.PI);
            c.stroke();

            c.fillStyle = '#34d399';
            c.beginPath();
            c.arc(tipX, tipY, 2, 0, Math.PI * 2);
            c.fill();

          } else if (activeW.id === 'void_staff') {
            // Void Staff: Orbiting gravity rings
            c.strokeStyle = '#a855f7';
            c.lineWidth = 1;
            c.beginPath();
            c.ellipse(tipX, tipY, 5, 2.5, performance.now() * 0.005, 0, Math.PI * 2);
            c.stroke();

            c.fillStyle = '#020617'; // absolute black singularity
            c.beginPath();
            c.arc(tipX, tipY, 3.2, 0, Math.PI * 2);
            c.fill();
          }

          // Staff elemental muzzle flash
          if (muzzleFlashTimerRef.current > 0) {
            c.save();
            c.shadowColor = activeW.color;
            c.shadowBlur = 15;
            c.fillStyle = '#ffffff';
            const flashSize = 4.5 + Math.random() * 4;
            c.beginPath();
            c.arc(tipX, tipY, flashSize, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }

        } else {
          // GUNS & TECHNOLOGY UPGRADES (Pistol, Shotgun, Sniper, Tesla, rocket, etc)
          const barrelLength = ['sniper_rifle', 'laser_cannon', 'rocket_launcher'].includes(activeW.id) ? 18 : 12;
          const barrelWidth = ['rocket_launcher', 'shotgun', 'flamethrower'].includes(activeW.id) ? 4.5 : 2.5;
          const endX = rx + Math.cos(wAngle) * barrelLength;
          const endY = ry + Math.sin(wAngle) * (barrelLength * 0.7);

          // Render Gun sights lasers for pistol/sniper
          if (activeW.id === 'pistol' || activeW.id === 'sniper_rifle') {
            c.save();
            c.strokeStyle = 'rgba(239, 68, 68, 0.45)'; // tattered laser trace
            c.lineWidth = 0.8;
            c.beginPath();
            c.setLineDash([2, 4]);
            c.moveTo(endX, endY);
            c.lineTo(endX + Math.cos(wAngle) * 50, endY + Math.sin(wAngle) * 35);
            c.stroke();
            c.restore();
          }

          // Special Tesla electricity arcs drawing
          if (activeW.id === 'tesla_carbine') {
            // Draw dual copper prong rods
            c.strokeStyle = '#ca8a04'; // polished brass rods
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(rx, ry - 1.5);
            c.lineTo(endX, endY - 1);
            c.moveTo(rx, ry + 1.5);
            c.lineTo(endX, endY + 1);
            c.stroke();

            // Crackling sparks in-between rods
            c.strokeStyle = '#ffffff';
            c.shadowColor = '#38bdf8';
            c.shadowBlur = 6;
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(rx, ry);
            // Random lightning point
            const midX = rx + Math.cos(wAngle) * (barrelLength * 0.5) + (Math.random() * 3 - 1.5);
            const midY = ry + Math.sin(wAngle) * (barrelLength * 0.35) + (Math.random() * 3 - 1.5);
            c.lineTo(midX, midY);
            c.lineTo(endX, endY);
            c.stroke();
            c.shadowBlur = 0;

          } else if (activeW.id === 'rocket_launcher') {
            // Thick shoulder launcher tubes with warning marks
            c.strokeStyle = '#1e293b'; // military gunmetal
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(endX, endY);
            c.stroke();

            // Hazard warning stripes
            c.strokeStyle = '#eab308'; // yellow bands
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(rx + Math.cos(wAngle) * 4, ry + Math.sin(wAngle) * 3);
            c.lineTo(rx + Math.cos(wAngle) * 4 - Math.sin(wAngle) * 2, ry + Math.sin(wAngle) * 3 + Math.cos(wAngle) * 2);
            c.moveTo(rx + Math.cos(wAngle) * 8, ry + Math.sin(wAngle) * 6);
            c.lineTo(rx + Math.cos(wAngle) * 8 - Math.sin(wAngle) * 2, ry + Math.sin(wAngle) * 6 + Math.cos(wAngle) * 2);
            c.stroke();

            // Loaded micro rocket warhead tip sticking out
            c.fillStyle = '#ef4444'; // Red warhead
            c.beginPath();
            c.arc(endX, endY, 1.8, 0, Math.PI * 2);
            c.fill();

          } else if (activeW.id === 'flamethrower') {
            // Gray cylinder frame with copper fuel tubes wrapping it
            c.strokeStyle = '#475569';
            c.lineWidth = 3.5;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(endX, endY);
            c.stroke();

            // Two red gas cylinders attached underneath
            c.fillStyle = '#ef4444';
            c.fillRect(rx + Math.cos(wAngle) * 4 - 1.5, ry + Math.sin(wAngle) * 3, 3, 4);

            // Tiny pilot spark flame flickering at nozzle
            c.fillStyle = '#f97316';
            c.beginPath();
            c.arc(endX + Math.cos(wAngle) * 2, endY + Math.sin(wAngle) * 1.5, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
            c.fill();

          } else if (activeW.id === 'plasma_rifle') {
            // Double chamber cyan repeater
            c.strokeStyle = '#0f172a';
            c.lineWidth = 4;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(endX, endY);
            c.stroke();

            // Neon cyan power cells
            c.strokeStyle = '#22d3ee';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(rx + Math.cos(wAngle) * 3, ry + Math.sin(wAngle) * 2);
            c.lineTo(endX, endY);
            c.stroke();

          } else if (activeW.id === 'submachine_gun') {
            // Compact frame with green drum-clip magazine
            c.strokeStyle = '#334155';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(endX, endY);
            c.stroke();

            // Curved ammo magazine
            c.strokeStyle = '#22c55e'; // neon green clip
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(rx + Math.cos(wAngle) * 4, ry + Math.sin(wAngle) * 3, 3.5, wAngle + 0.5, wAngle + 1.8);
            c.stroke();

          } else {
            // Standard gun barrel frame
            c.strokeStyle = '#334155'; // gunmetal steel
            c.lineWidth = barrelWidth;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(endX, endY);
            c.stroke();
            
            // Neon charging tube
            c.strokeStyle = activeW.color;
            c.lineWidth = barrelWidth * 0.45;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(endX, endY);
            c.stroke();
          }

          // Scope sights lens for Sniper Rifle / Laser Cannon
          if (['sniper_rifle', 'laser_cannon'].includes(activeW.id)) {
            c.fillStyle = '#10b981'; // green crystal targeting lens
            c.beginPath();
            c.arc(rx + Math.cos(wAngle) * (barrelLength * 0.55), ry + Math.sin(wAngle) * (barrelLength * 0.4) - 2.5, 2, 0, Math.PI * 2);
            c.fill();
          }

          // Energetic tactical muzzle flashes
          if (muzzleFlashTimerRef.current > 0) {
            c.save();
            c.shadowColor = activeW.color;
            c.shadowBlur = 18;
            c.fillStyle = '#ffffff'; // white hot flame
            const flashSize = 3.5 + Math.random() * 5;
            c.beginPath();
            c.arc(endX, endY, flashSize, 0, Math.PI * 2);
            c.fill();

            // Linear sparkles
            c.strokeStyle = activeW.color;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(endX - flashSize * 1.5, endY);
            c.lineTo(endX + flashSize * 1.5, endY);
            c.moveTo(endX, endY - flashSize * 1.5);
            c.lineTo(endX, endY + flashSize * 1.5);
            c.stroke();
            c.restore();
          }
        }

        c.shadowBlur = 0;

        c.filter = originalFilter || 'none';
        c.restore();

        // Floating Player Username tag (drawn outside transformation matrix)
        c.fillStyle = '#ffffff';
        c.font = 'bold 9px monospace';
        c.textAlign = 'center';
        c.fillText('HERO', sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - bodyH - 14);
      },
    });

    // D. Add Zombies
    enemiesRef.current.forEach((zombie) => {
      renderQueue.push({
        depth: zombie.x + zombie.y,
        draw: (c) => {
          const sPos = gridToScreen(zombie.x, zombie.y, renderOffsetX, renderOffsetY);
          const mult = zombie.sizeMultiplier;

          // Animated zombie walk bobbing synced to their individual ID
          const uniqueOffset = zombie.id.charCodeAt(zombie.id.length - 1) * 0.1;
          const zBob = Math.sin(performance.now() * 0.012 + uniqueOffset) * 1.8 * mult;
          const armsShake = Math.sin(performance.now() * 0.024 + uniqueOffset) * 1.5;

          // Draw base shadow (drawn in world coordinates, stays stationary on floor!)
          c.fillStyle = 'rgba(0,0,0,0.45)';
          c.beginPath();
          c.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 + 4, 10 * mult, 5 * mult, 0, 0, Math.PI * 2);
          c.fill();

          // Combat squash & stretch scales for zombie
          let zScaleX = 1;
          let zScaleY = 1;
          if (zombie.damageFlash && zombie.damageFlash > 0) {
            const t = zombie.damageFlash / 0.15; // 1 -> 0
            zScaleY = 1 - Math.sin(t * Math.PI) * 0.28;
            zScaleX = 1 + Math.sin(t * Math.PI) * 0.28;
          }

          // Walk tilt/sway rotation
          const zombieTilt = Math.sin(performance.now() * 0.012 + uniqueOffset) * 0.06;

          c.save();

          // Translate, scale, rotate around the base pivot
          const pivotX = sPos.x;
          const pivotY = sPos.y + ISO_TILE_HEIGHT / 2 + 4;
          c.translate(pivotX, pivotY);
          c.scale(zScaleX, zScaleY);
          c.rotate(zombieTilt);
          c.translate(-pivotX, -pivotY);

          // Apply filter for flash
          const originalFilter = c.filter;
          if (zombie.damageFlash && zombie.damageFlash > 0) {
            c.filter = 'brightness(3) sepia(1) hue-rotate(-50deg) saturate(8)';
          }

          const px = sPos.x;
          const py = sPos.y + ISO_TILE_HEIGHT / 2 - 2 + zBob;
          const bodyH = 22 * mult;

          const nameLower = (zombie.name || '').toLowerCase();

          // Render based on zombie class and custom named sub-styles
          if (!zombie.isBoss && nameLower.includes('slime')) {
            // A. JELLY-BOUNCING PULSING SLIME
            const pulse = 1 + Math.sin(performance.now() * 0.015 + uniqueOffset) * 0.12;
            const sw = 10 * mult * pulse;
            const sh = 8 * mult / pulse;

            // Jelly dome body
            c.fillStyle = zombie.color;
            c.shadowColor = zombie.color;
            c.shadowBlur = 8;
            c.beginPath();
            c.ellipse(px, py - sh, sw, sh, 0, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;

            // Translucent dome highlight shiny
            c.fillStyle = 'rgba(255, 255, 255, 0.45)';
            c.beginPath();
            c.ellipse(px - sw / 2.5, py - sh - sh / 3, sw / 3.5, sh / 3.5, 0, 0, Math.PI * 2);
            c.fill();

            // Two cute black beads eyes
            c.fillStyle = '#090d16';
            c.beginPath();
            c.arc(px - sw / 4, py - sh - sh / 8, 1.6 * mult, 0, Math.PI * 2);
            c.arc(px + sw / 4, py - sh - sh / 8, 1.6 * mult, 0, Math.PI * 2);
            c.fill();

          } else if (!zombie.isBoss && (nameLower.includes('wolf') || nameLower.includes('hound') || nameLower.includes('panther') || nameLower.includes('stalker') || nameLower.includes('pup') || nameLower.includes('beast') || nameLower.includes('dog'))) {
            // B. SLEEK LEAPING QUADRUPED BEAST / WOLF
            const bodyW = 16 * mult;
            const bodyHeight = 10 * mult;
            const bY = py - bodyHeight;

            c.fillStyle = zombie.color;
            // Torso
            c.beginPath();
            c.ellipse(px, bY + 3 * mult, bodyW / 2, bodyHeight / 2, 0, 0, Math.PI * 2);
            c.fill();

            // Collar spike fur ruff
            c.fillStyle = '#1e293b';
            c.beginPath();
            c.moveTo(px - bodyW / 3, bY);
            c.lineTo(px + bodyW / 3, bY);
            c.lineTo(px, bY - 3 * mult);
            c.closePath();
            c.fill();

            // Wolf Snout Head facing movement direction
            const fDir = Math.cos(zombie.facingAngle) >= 0 ? 1 : -1;
            const headX = px + fDir * (bodyW / 2.2);
            const headY = bY - 1 * mult;

            c.fillStyle = zombie.color;
            c.beginPath();
            c.arc(headX, headY, 4.5 * mult, 0, Math.PI * 2);
            c.fill();

            // Pointy ears
            c.beginPath();
            c.moveTo(headX - 1.5 * mult, headY - 3.5 * mult);
            c.lineTo(headX - 3.5 * mult, headY - 8 * mult);
            c.lineTo(headX + 1 * mult, headY - 4.5 * mult);
            c.closePath();
            c.fill();

            // Snout mouth
            c.fillRect(headX, headY - 1, fDir * 4.5 * mult, 2.5 * mult);

            // Shaking dynamic legs (quadruped style)
            c.strokeStyle = zombie.color;
            c.lineWidth = 1.8 * mult;
            const legSwing = Math.sin(performance.now() * 0.015 + uniqueOffset) * 5;

            // Left leg pair
            c.beginPath();
            c.moveTo(px - 4 * mult, bY + 3 * mult);
            c.lineTo(px - 4 * mult + legSwing, py);
            c.stroke();
            // Right leg pair
            c.beginPath();
            c.moveTo(px + 4 * mult, bY + 3 * mult);
            c.lineTo(px + 4 * mult - legSwing, py);
            c.stroke();

            // Wagging tail ruff
            const tailWave = Math.sin(performance.now() * 0.02 + uniqueOffset) * 4;
            c.strokeStyle = zombie.color;
            c.lineWidth = 1.6 * mult;
            c.beginPath();
            c.moveTo(px - bodyW / 2, bY + 2 * mult);
            c.quadraticCurveTo(px - bodyW / 2 - 5 * mult, bY - tailWave, px - bodyW / 2 - 10 * mult, bY - tailWave * 1.5);
            c.stroke();

          } else if (!zombie.isBoss && (nameLower.includes('scorpion') || nameLower.includes('spider') || nameLower.includes('reaver') || nameLower.includes('creeper') || nameLower.includes('arachnid'))) {
            // C. CRAWLING SEGMENTED MULTI-LEG ARACHNID SCORPION
            const bRadius = 5.5 * mult;
            const bY = py - 3 * mult;

            c.fillStyle = zombie.color;
            c.beginPath();
            c.arc(px, bY, bRadius, 0, Math.PI * 2);
            c.fill();

            // Spindly moving legs splayed symmetrically
            c.strokeStyle = zombie.color;
            c.lineWidth = 1.4 * mult;
            const legFreq = performance.now() * 0.018 + uniqueOffset;

            for (let leg = 0; leg < 3; leg++) {
              const legCycle = Math.sin(legFreq + leg * (Math.PI / 3)) * 3;
              // Left side
              c.beginPath();
              c.moveTo(px - 2, bY);
              c.quadraticCurveTo(px - 9 * mult, bY - 5 * mult + legCycle, px - 12 * mult, py);
              c.stroke();

              // Right side
              c.beginPath();
              c.moveTo(px + 2, bY);
              c.quadraticCurveTo(px + 9 * mult, bY - 5 * mult - legCycle, px + 12 * mult, py);
              c.stroke();
            }

            if (nameLower.includes('scorpion')) {
              // Tail with stinger needle arched over
              c.strokeStyle = zombie.color;
              c.lineWidth = 1.8 * mult;
              c.beginPath();
              c.moveTo(px, bY);
              const curveX = px - 5 * mult;
              const curveY = bY - 9 * mult;
              const tipX = px + 3 * mult + Math.sin(performance.now() * 0.008) * 2.5;
              const tipY = bY - 14 * mult;
              c.quadraticCurveTo(curveX, curveY, tipX, tipY);
              c.stroke();

              // Glowing stinger bulb
              const bulbColor = zombie.glowColor || '#ef4444';
              c.fillStyle = bulbColor;
              c.shadowColor = bulbColor;
              c.shadowBlur = 6;
              c.beginPath();
              c.arc(tipX, tipY - 1, 1.8 * mult, 0, Math.PI * 2);
              c.fill();
              c.shadowBlur = 0;
            } else {
              // Spider red fangs clickers
              c.fillStyle = '#ef4444';
              c.fillRect(px - 1.8, bY + 1.5, 0.8, 2.5);
              c.fillRect(px + 1, bY + 1.5, 0.8, 2.5);
            }

          } else if (!zombie.isBoss && (nameLower.includes('shade') || nameLower.includes('specter') || nameLower.includes('void') || nameLower.includes('ghost') || nameLower.includes('shadow') || nameLower.includes('wraith'))) {
            // D. FLOATING HOODED ETHEREAL SPECTER GHOST
            const floatBob = Math.sin(performance.now() * 0.003 + uniqueOffset) * 4.5;
            const sY = py - floatBob;

            c.save();
            c.fillStyle = zombie.color;
            c.shadowColor = zombie.color;
            c.shadowBlur = 10;

            // Hood void
            c.beginPath();
            c.arc(px, sY - bodyH + 4 * mult, 5.5 * mult, Math.PI, 0, false);
            // Whispy trailing vapor bottom
            c.lineTo(px + 3 * mult, sY + 1 * mult);
            const wisp = Math.sin(performance.now() * 0.012) * 2.5;
            c.quadraticCurveTo(px + wisp, sY - bodyH / 2, px - 3 * mult, sY + 1 * mult);
            c.closePath();
            c.fill();

            // Ethereal floating sleeves
            c.beginPath();
            c.moveTo(px - 4 * mult, sY - bodyH + 7 * mult);
            c.lineTo(px - 9 * mult, sY - bodyH + 11 * mult + wisp);
            c.lineTo(px - 5 * mult, sY - bodyH + 10 * mult);
            c.closePath();
            c.fill();

            c.beginPath();
            c.moveTo(px + 4 * mult, sY - bodyH + 7 * mult);
            c.lineTo(px + 9 * mult, sY - bodyH + 11 * mult - wisp);
            c.lineTo(px + 5 * mult, sY - bodyH + 10 * mult);
            c.closePath();
            c.fill();

            c.restore();

          } else if (!zombie.isBoss && (nameLower.includes('fungus') || nameLower.includes('spore') || nameLower.includes('mushroom') || nameLower.includes('mycelium'))) {
            // E. BIOLUMINESCENT TOXIC MUSHROOM / SPORE CAPSULE
            const capW = 12 * mult;
            const capH = 8 * mult;
            const capY = py - bodyH + 4 * mult;

            // Stem
            c.fillStyle = '#e2e8f0';
            c.fillRect(px - 3 * mult, capY, 6 * mult, bodyH - 4 * mult);

            // Shading of gills under cap
            c.fillStyle = '#94a3b8';
            c.fillRect(px - capW + 1.5 * mult, capY, (capW * 2) - 3 * mult, 1.8 * mult);

            // Glowing cap dome
            c.fillStyle = zombie.color;
            c.shadowColor = zombie.color;
            c.shadowBlur = 8;
            c.beginPath();
            c.ellipse(px, capY, capW, capH, 0, Math.PI, 0, false);
            c.closePath();
            c.fill();
            c.shadowBlur = 0;

            // Bioluminescent glow dots
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.arc(px - 4 * mult, capY - 4 * mult, 1.8 * mult, 0, Math.PI * 2);
            c.arc(px + 4 * mult, capY - 4 * mult, 1.6 * mult, 0, Math.PI * 2);
            c.arc(px, capY - 5 * mult, 1.8 * mult, 0, Math.PI * 2);
            c.fill();

            // Drop tiny spore embers
            if (Math.random() < 0.12) {
              const sporeX = px + (Math.random() * capW * 1.5 - capW * 0.75);
              const sporeY = capY + 3 + Math.random() * 7;
              c.fillStyle = zombie.color;
              c.fillRect(sporeX, sporeY, 1, 1);
            }

          } else if (zombie.type === 'boss_necromancer') {
            // FLOATING SKULL LICH
            const floatBob = Math.sin(performance.now() * 0.003) * 4;
            const lpy = py - floatBob;

            // 1. Purple skeletal robe gown
            c.fillStyle = '#4c1d95'; // deep royal purple
            c.beginPath();
            c.moveTo(px - 7, lpy);
            c.lineTo(px + 7, lpy);
            c.lineTo(px + 4, lpy - bodyH);
            c.lineTo(px - 4, lpy - bodyH);
            c.closePath();
            c.fill();

            // Hood cowl (pink interior, dark skull face)
            c.fillStyle = '#1e1b4b'; // outer hood
            c.beginPath();
            c.arc(px, lpy - bodyH - 3, 6, 0, Math.PI * 2);
            c.fill();
            
            c.fillStyle = '#f472b6'; // glowing hot pink cowl border
            c.beginPath();
            c.arc(px, lpy - bodyH - 3, 4.5, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = '#0f172a'; // dark skull shadow void
            c.beginPath();
            c.arc(px, lpy - bodyH - 3, 3.5, 0, Math.PI * 2);
            c.fill();

            // Glowing pink eyes
            c.fillStyle = '#f472b6';
            c.shadowColor = '#f472b6';
            c.shadowBlur = 8;
            c.fillRect(px - 2, lpy - bodyH - 4.5, 1.5, 1.5);
            c.fillRect(px + 0.5, lpy - bodyH - 4.5, 1.5, 1.5);
            c.shadowBlur = 0;

            // Holding a glowing pink staff of Necromancy
            c.strokeStyle = '#27272a'; // obsidian staff rod
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(px - 8, lpy + 5);
            c.lineTo(px - 8, lpy - bodyH - 5);
            c.stroke();

            // Staff core fire
            c.fillStyle = '#f472b6';
            c.shadowColor = '#f472b6';
            c.shadowBlur = 10;
            c.beginPath();
            c.arc(px - 8, lpy - bodyH - 7, 3, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;

          } else if (zombie.type === 'boss_goliath') {
            // COLOSSAL VOLCANIC PLATED GOLIATH
            c.fillStyle = '#1c1917'; // coal skin
            c.fillRect(px - 14, py - bodyH, 28, bodyH);

            // Magma magma streams cracks
            c.fillStyle = '#f97316'; // orange hot lava
            c.shadowColor = '#ef4444';
            c.shadowBlur = 6;
            c.fillRect(px - 10, py - bodyH + 4, 3, 10);
            c.fillRect(px + 7, py - bodyH + 6, 3, 8);
            c.fillRect(px - 3, py - bodyH + 2, 6, 4);

            // Heavy rock shoulders
            c.fillStyle = '#44403c';
            c.fillRect(px - 16, py - bodyH - 3, 6, 8);
            c.fillRect(px + 10, py - bodyH - 3, 6, 8);
            c.shadowBlur = 0;

            // Giant red head with small orange eyes
            c.fillStyle = '#7f1d1d';
            c.beginPath();
            c.arc(px, py - bodyH - 6, 8, 0, Math.PI * 2);
            c.fill();

            // Glowing volcanic eyes
            c.fillStyle = '#fbbf24';
            c.fillRect(px - 3, py - bodyH - 7, 1.5, 1.5);
            c.fillRect(px + 1.5, py - bodyH - 7, 1.5, 1.5);

          } else if (zombie.type === 'boss_frostlord') {
            // TOWERING GLOWING ICE ARCHON
            c.fillStyle = '#0284c7'; // Deep frozen sapphire body
            c.fillRect(px - 12, py - bodyH, 24, bodyH);

            // Shimmering ice shards on shoulders
            c.fillStyle = '#38bdf8'; // Light cyan
            c.beginPath();
            c.moveTo(px - 14, py - bodyH - 2);
            c.lineTo(px - 6, py - bodyH + 4);
            c.lineTo(px - 16, py - bodyH + 1);
            c.closePath();
            c.fill();

            c.beginPath();
            c.moveTo(px + 14, py - bodyH - 2);
            c.lineTo(px + 6, py - bodyH + 4);
            c.lineTo(px + 16, py - bodyH + 1);
            c.closePath();
            c.fill();

            // Frozen crown head
            c.fillStyle = '#e0f2fe'; // Frost white
            c.beginPath();
            c.arc(px, py - bodyH - 6, 7, 0, Math.PI * 2);
            c.fill();

            // Sharp crown spires
            c.fillStyle = '#06b6d4';
            c.beginPath();
            c.moveTo(px - 6, py - bodyH - 12);
            c.lineTo(px - 3, py - bodyH - 6);
            c.lineTo(px, py - bodyH - 15); // Central spike
            c.lineTo(px + 3, py - bodyH - 6);
            c.lineTo(px + 6, py - bodyH - 12);
            c.closePath();
            c.fill();

            // Glowing ice-blue eyes
            c.fillStyle = '#22d3ee';
            c.shadowColor = '#22d3ee';
            c.shadowBlur = 8;
            c.fillRect(px - 2.5, py - bodyH - 7, 1.5, 1.5);
            c.fillRect(px + 1, py - bodyH - 7, 1.5, 1.5);
            c.shadowBlur = 0;

          } else if (zombie.type === 'boss_abomination') {
            // MUTATED STITCHED SLUDGE ABOMINATION
            c.fillStyle = '#047857'; // Decay forest green
            c.fillRect(px - 13, py - bodyH, 26, bodyH);

            // Asymmetrical mutant shoulder (left)
            c.fillStyle = '#065f46';
            c.beginPath();
            c.arc(px - 12, py - bodyH + 4, 9, 0, Math.PI * 2);
            c.fill();

            // Stitched lines
            c.strokeStyle = '#b45309'; // Stitches thread
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(px - 5, py - bodyH + 4);
            c.lineTo(px + 5, py - bodyH + 12);
            c.stroke();

            // Glowing green toxic pustules
            c.fillStyle = '#10b981';
            c.shadowColor = '#10b981';
            c.shadowBlur = 6;
            c.beginPath();
            c.arc(px - 8, py - bodyH + 12, 3, 0, Math.PI * 2);
            c.arc(px + 7, py - bodyH + 3, 2.5, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;

            // Bloated yellow mutant skull head
            c.fillStyle = '#854d0e';
            c.beginPath();
            c.arc(px, py - bodyH - 5, 8, 0, Math.PI * 2);
            c.fill();

            // Stitched rotten eye patch and yellow pupil
            c.fillStyle = '#eab308';
            c.fillRect(px - 3, py - bodyH - 6, 2, 2);
            c.strokeStyle = '#000';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(px + 1, py - bodyH - 8);
            c.lineTo(px + 4, py - bodyH - 4);
            c.stroke();

          } else if (zombie.type === 'boss_cyber_overlord') {
            // MECHA CYBER SENTINEL WITH SHIELDED PLATES
            c.fillStyle = '#1e293b'; // Slate metal steel torso
            c.fillRect(px - 11, py - bodyH, 22, bodyH);

            // Chrome plate stripes
            c.fillStyle = '#64748b';
            c.fillRect(px - 8, py - bodyH + 3, 16, 3);
            c.fillRect(px - 8, py - bodyH + 9, 16, 3);

            // Shoulder-mounted laser battery
            c.fillStyle = '#475569';
            c.fillRect(px + 10, py - bodyH - 4, 5, 10);
            c.fillStyle = '#f43f5e'; // laser lens
            c.fillRect(px + 11, py - bodyH - 6, 3, 2);

            // Sleek digital mask head
            c.fillStyle = '#0f172a';
            c.fillRect(px - 6, py - bodyH - 10, 12, 10);

            // Neon pink visor horizontal bar
            c.fillStyle = '#f43f5e';
            c.shadowColor = '#f43f5e';
            c.shadowBlur = 10;
            c.fillRect(px - 4, py - bodyH - 6, 8, 1.8);
            c.shadowBlur = 0;

            // Micro-chip circuitry detail on body
            c.strokeStyle = '#a855f7'; // purple trace line
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(px - 6, py - bodyH + 16);
            c.lineTo(px, py - bodyH + 12);
            c.lineTo(px + 6, py - bodyH + 14);
            c.stroke();

          } else if (zombie.type === 'tank') {
            // BRUTISH RED TANK ZOMBIE (Behemoth) - CUSTOMIZED BY ACTIVE LEVEL ARCHETYPE
            const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
            let muscleColor = '#450a0a'; // dark red default
            let pantsColor = '#1e293b'; // tattered grey default
            let scarColor = '#ef4444'; // glowing red scars default
            let metalColor = '#9ca3af'; // steel plate default

            switch (activeLevelIndex) {
              case 1: // Grasslands
                muscleColor = '#450a0a'; pantsColor = '#1e293b'; scarColor = '#ef4444';
                break;
              case 2: // Obsidian Crypts
                muscleColor = '#1c1917'; pantsColor = '#451a03'; scarColor = '#f97316'; metalColor = '#4b5563';
                break;
              case 3: // Cryo Glaciers
                muscleColor = '#0284c7'; pantsColor = '#eff6ff'; scarColor = '#38bdf8'; metalColor = '#93c5fd';
                break;
              case 4: // Toxic Refineries
                muscleColor = '#065f46'; pantsColor = '#451a03'; scarColor = '#a3e635'; metalColor = '#6b7280';
                break;
              case 5: // Plasma Core
                muscleColor = '#581c87'; pantsColor = '#030712'; scarColor = '#ec4899'; metalColor = '#c084fc';
                break;
              case 6: // Ancient Sanctum
                muscleColor = '#78350f'; pantsColor = '#ca8a04'; scarColor = '#eab308'; metalColor = '#fbbf24';
                break;
              case 7: // Sub-Zero Core
                muscleColor = '#1e3a8a'; pantsColor = '#38bdf8'; scarColor = '#60a5fa'; metalColor = '#93c5fd';
                break;
              case 8: // Gilded Vaults
                muscleColor = '#b45309'; pantsColor = '#1c1917'; scarColor = '#eab308'; metalColor = '#fbbf24';
                break;
              case 9: // Deep Void Abyss
                muscleColor = '#2e1065'; pantsColor = '#020617'; scarColor = '#c084fc'; metalColor = '#a855f7';
                break;
              case 10: // Volcanic Fissures
                muscleColor = '#991b1b'; pantsColor = '#1c1917'; scarColor = '#ea580c'; metalColor = '#78716c';
                break;
              case 11: // Cyber Graveyard
                muscleColor = '#334155'; pantsColor = '#0f172a'; scarColor = '#14b8a6'; metalColor = '#0d9488';
                break;
              case 12: // Shadow Realm
                muscleColor = '#090514'; pantsColor = '#475569'; scarColor = '#a855f7'; metalColor = '#312e81';
                break;
              case 13: // Storm Peaks
                muscleColor = '#0891b2'; pantsColor = '#020617'; scarColor = '#22d3ee'; metalColor = '#06b6d4';
                break;
              case 14: // Dread Swamps
                muscleColor = '#165b33'; pantsColor = '#451a03'; scarColor = '#84cc16'; metalColor = '#52525b';
                break;
              case 15: // Chrono Nexus
                muscleColor = '#ea580c'; pantsColor = '#2e1065'; scarColor = '#eab308'; metalColor = '#f59e0b';
                break;
              case 16: // Hyperion Citadel
                muscleColor = '#1e1b4b'; pantsColor = '#eab308'; scarColor = '#f43f5e'; metalColor = '#fb7185';
                break;
            }

            c.fillStyle = muscleColor;
            c.fillRect(px - 8 * mult, py - bodyH, 16 * mult, bodyH);

            // Ripped leather trousers pants belt
            c.fillStyle = pantsColor;
            c.fillRect(px - 9 * mult, py - bodyH + 10 * mult, 18 * mult, bodyH - 10 * mult);

            // Exposed glowing infected tissue cracks / scars on chest
            c.strokeStyle = scarColor;
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(px - 4 * mult, py - bodyH + 4 * mult);
            c.lineTo(px + 4 * mult, py - bodyH + 6 * mult);
            c.stroke();

            // Steel shoulder plate rivets
            c.fillStyle = metalColor;
            c.fillRect(px - 10 * mult, py - bodyH + 1, 3 * mult, 4 * mult);
            c.fillRect(px + 7 * mult, py - bodyH + 1, 3 * mult, 4 * mult);

            // Hulking head
            c.fillStyle = muscleColor;
            c.beginPath();
            c.arc(px, py - bodyH - 3 * mult, 5.8 * mult, 0, Math.PI * 2);
            c.fill();

            // Metal jaw mask brace bolted on
            c.fillStyle = metalColor;
            c.fillRect(px - 4 * mult, py - bodyH - 2 * mult, 8 * mult, 3 * mult);

            // Reachy heavy fist arms
            c.fillStyle = muscleColor;
            c.fillRect(px - 12 * mult, py - bodyH + 6 * mult + armsShake, 3.5 * mult, 12 * mult);
            c.fillRect(px + 8.5 * mult, py - bodyH + 6 * mult - armsShake, 3.5 * mult, 12 * mult);

          } else if (zombie.type === 'fast') {
            // AGILE CROUCHING CRAWLER ZOMBIE - CUSTOMIZED BY ACTIVE LEVEL ARCHETYPE
            const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
            let suitColor = '#1c1917'; // ninja suit black default
            let headColor = '#3f6212'; // green head default
            let clawsColor = '#ef4444'; // red default

            switch (activeLevelIndex) {
              case 1: // Grasslands
                suitColor = '#1c1917'; headColor = '#3f6212'; clawsColor = '#ef4444';
                break;
              case 2: // Obsidian Crypts
                suitColor = '#1a0f24'; headColor = '#e11d48'; clawsColor = '#f97316';
                break;
              case 3: // Cryo Glaciers
                suitColor = '#eff6ff'; headColor = '#0891b2'; clawsColor = '#38bdf8';
                break;
              case 4: // Toxic Refineries
                suitColor = '#1e293b'; headColor = '#84cc16'; clawsColor = '#22c55e';
                break;
              case 5: // Plasma Core
                suitColor = '#0f172a'; headColor = '#f43f5e'; clawsColor = '#a855f7';
                break;
              case 6: // Ancient Sanctum
                suitColor = '#451a03'; headColor = '#eab308'; clawsColor = '#ca8a04';
                break;
              case 7: // Sub-Zero Core
                suitColor = '#1e3a8a'; headColor = '#38bdf8'; clawsColor = '#60a5fa';
                break;
              case 8: // Gilded Vaults
                suitColor = '#334155'; headColor = '#eab308'; clawsColor = '#facc15';
                break;
              case 9: // Deep Void Abyss
                suitColor = '#020617'; headColor = '#7c3aed'; clawsColor = '#c084fc';
                break;
              case 10: // Volcanic Fissures
                suitColor = '#3a110c'; headColor = '#dc2626'; clawsColor = '#ea580c';
                break;
              case 11: // Cyber Graveyard
                suitColor = '#0f172a'; headColor = '#14b8a6'; clawsColor = '#06b6d4';
                break;
              case 12: // Shadow Realm
                suitColor = '#030712'; headColor = '#3b0764'; clawsColor = '#a855f7';
                break;
              case 13: // Storm Peaks
                suitColor = '#0f172a'; headColor = '#22d3ee'; clawsColor = '#06b6d4';
                break;
              case 14: // Dread Swamps
                suitColor = '#27272a'; headColor = '#a3e635'; clawsColor = '#16a34a';
                break;
              case 15: // Chrono Nexus
                suitColor = '#2e1065'; headColor = '#ea580c'; clawsColor = '#eab308';
                break;
              case 16: // Hyperion Citadel
                suitColor = '#1e1b4b'; headColor = '#db2777'; clawsColor = '#f43f5e';
                break;
            }

            c.fillStyle = suitColor;
            c.fillRect(px - 4, py - bodyH, 8, bodyH);

            // Exposed skeletal white spine bones
            c.fillStyle = '#f1f5f9';
            c.fillRect(px - 1, py - bodyH + 2, 2, 2);
            c.fillRect(px - 1, py - bodyH + 6, 2, 2);
            c.fillRect(px - 1, py - bodyH + 10, 2, 2);

            // Spike blade arm mutation
            c.strokeStyle = clawsColor;
            c.lineWidth = 2.2;
            c.beginPath();
            c.moveTo(px - 4, py - bodyH + 8);
            c.lineTo(px - 12, py - bodyH + 15);
            c.moveTo(px + 4, py - bodyH + 8);
            c.lineTo(px + 12, py - bodyH + 15);
            c.stroke();

            // Glowing infected head
            c.fillStyle = headColor;
            c.beginPath();
            c.arc(px, py - bodyH - 1, 4.2, 0, Math.PI * 2);
            c.fill();

            // Multiple glowing spider-like sensory eyes (infection cluster)
            c.fillStyle = clawsColor;
            c.fillRect(px - 1.8, py - bodyH - 2, 1, 1);
            c.fillRect(px + 0.8, py - bodyH - 2, 1, 1);
            c.fillRect(px - 0.5, py - bodyH, 1, 1);

          } else if (zombie.type === 'spitter') {
            // PULSING BIOHAZARD GLAND SPITTER - CUSTOMIZED BY ACTIVE LEVEL ARCHETYPE
            const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
            let jumpsuitColor = '#1e293b'; // dirty toxic waste jumpsuit default
            let stripeColor = '#eab308'; // hazard yellow default
            let sacColor = '#22c55e'; // green toxic sac default
            let headColor = '#14532d'; // dark green default

            switch (activeLevelIndex) {
              case 1: // Grasslands
                jumpsuitColor = '#1e293b'; stripeColor = '#eab308'; sacColor = '#22c55e'; headColor = '#14532d';
                break;
              case 2: // Obsidian Crypts
                jumpsuitColor = '#3f1b1b'; stripeColor = '#000000'; sacColor = '#ea580c'; headColor = '#7f1d1d';
                break;
              case 3: // Cryo Glaciers
                jumpsuitColor = '#eff6ff'; stripeColor = '#38bdf8'; sacColor = '#06b6d4'; headColor = '#0891b2';
                break;
              case 4: // Toxic Refineries
                jumpsuitColor = '#14532d'; stripeColor = '#facc15'; sacColor = '#a3e635'; headColor = '#022c22';
                break;
              case 5: // Plasma Core
                jumpsuitColor = '#1e1b4b'; stripeColor = '#a855f7'; sacColor = '#db2777'; headColor = '#3b0764';
                break;
              case 6: // Ancient Sanctum
                jumpsuitColor = '#451a03'; stripeColor = '#ca8a04'; sacColor = '#eab308'; headColor = '#1c1917';
                break;
              case 7: // Sub-Zero Core
                jumpsuitColor = '#0a1d37'; stripeColor = '#eff6ff'; sacColor = '#00bfff'; headColor = '#1d4ed8';
                break;
              case 8: // Gilded Vaults
                jumpsuitColor = '#1e293b'; stripeColor = '#facc15'; sacColor = '#eab308'; headColor = '#b45309';
                break;
              case 9: // Deep Void Abyss
                jumpsuitColor = '#030712'; stripeColor = '#818cf8'; sacColor = '#c084fc'; headColor = '#120724';
                break;
              case 10: // Volcanic Fissures
                jumpsuitColor = '#1c1917'; stripeColor = '#ea580c'; sacColor = '#ff4500'; headColor = '#3a110c';
                break;
              case 11: // Cyber Graveyard
                jumpsuitColor = '#334155'; stripeColor = '#14b8a6'; sacColor = '#2dd4bf'; headColor = '#0f172a';
                break;
              case 12: // Shadow Realm
                jumpsuitColor = '#090514'; stripeColor = '#475569'; sacColor = '#818cf8'; headColor = '#312e81';
                break;
              case 13: // Storm Peaks
                jumpsuitColor = '#020617'; stripeColor = '#22d3ee'; sacColor = '#00ffff'; headColor = '#0891b2';
                break;
              case 14: // Dread Swamps
                jumpsuitColor = '#27272a'; stripeColor = '#a3e635'; sacColor = '#16a34a'; headColor = '#151e18';
                break;
              case 15: // Chrono Nexus
                jumpsuitColor = '#2e1065'; stripeColor = '#fbbf24'; sacColor = '#ea580c'; headColor = '#9a3412';
                break;
              case 16: // Hyperion Citadel
                jumpsuitColor = '#1e1b4b'; stripeColor = '#f43f5e'; sacColor = '#ec4899'; headColor = '#1e293b';
                break;
            }

            c.fillStyle = jumpsuitColor;
            c.fillRect(px - 5, py - bodyH, 10, bodyH);

            // Warning stripes tattered gear detailing
            c.strokeStyle = stripeColor;
            c.lineWidth = 0.8;
            c.strokeRect(px - 5, py - bodyH, 10, bodyH);

            // Glowing toxic chemical sac on back (pulsing)
            const sacPulse = 3.5 + Math.sin(performance.now() * 0.01 + uniqueOffset) * 1.5;
            c.fillStyle = sacColor;
            c.shadowColor = sacColor;
            c.shadowBlur = sacPulse * 2.5;
            c.beginPath();
            c.arc(px + 5, py - bodyH + 6, sacPulse, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;

            // Spit head oozing fluid
            c.fillStyle = headColor;
            c.beginPath();
            c.arc(px, py - bodyH - 2, 4.5, 0, Math.PI * 2);
            c.fill();

            // Gaping jaw with dripping acid slime trails falling down
            c.fillStyle = sacColor;
            c.fillRect(px - 1, py - bodyH + 1, 2, 3 + Math.sin(performance.now() * 0.008) * 1.5);

          } else {
            // CLASSIC DECAYING BASIC ZOMBIE (CUSTOMIZED BY ACTIVE LEVEL ARCHETYPE)
            const activeLevelIndex = ((gameState.level - 1) % LEVEL_THEMES.length) + 1;
            let skinColor = '#065f46'; // moldy skin default
            let headColor = '#14532d'; // dark head default
            let shirtColor = '#1e3a8a'; // blue shirt default
            let pantsColor = '#7c2d12'; // brown trousers default
            let hairColor = '#18181b'; // dark hair default

            switch (activeLevelIndex) {
              case 1: // Grasslands - Traditional Rotten
                skinColor = '#065f46'; headColor = '#14532d'; shirtColor = '#1e3a8a'; pantsColor = '#7c2d12';
                break;
              case 2: // Obsidian Crypts - Ash Husk
                skinColor = '#4b5563'; headColor = '#374151'; shirtColor = '#b91c1c'; pantsColor = '#1f2937';
                break;
              case 3: // Cryo Glaciers - Frostbitten
                skinColor = '#38bdf8'; headColor = '#0284c7'; shirtColor = '#e0f2fe'; pantsColor = '#1e3a8a';
                break;
              case 4: // Toxic Refineries - Radioactive Ooze
                skinColor = '#10b981'; headColor = '#065f46'; shirtColor = '#854d0e'; pantsColor = '#1e293b';
                break;
              case 5: // Plasma Core - Neon Void-touched
                skinColor = '#a855f7'; headColor = '#6b21a8'; shirtColor = '#f43f5e'; pantsColor = '#0f172a';
                break;
              case 6: // Ancient Sanctum - Golden Cursed Dust mummy
                skinColor = '#ca8a04'; headColor = '#854d0e'; shirtColor = '#451a03'; pantsColor = '#1c1917';
                break;
              case 7: // Sub-Zero Core - Deep Ice Revenant
                skinColor = '#60a5fa'; headColor = '#1d4ed8'; shirtColor = '#eff6ff'; pantsColor = '#1e3a8a';
                break;
              case 8: // Gilded Vaults - Gilded Golem
                skinColor = '#eab308'; headColor = '#b45309'; shirtColor = '#334155'; pantsColor = '#1e293b';
                break;
              case 9: // Deep Void Abyss - Abyssal Shade
                skinColor = '#581c87'; headColor = '#3b0764'; shirtColor = '#312e81'; pantsColor = '#020617';
                break;
              case 10: // Volcanic Fissures - Molten Charred
                skinColor = '#dc2626'; headColor = '#7f1d1d'; shirtColor = '#ea580c'; pantsColor = '#172554';
                break;
              case 11: // Cyber Graveyard - Android Zombie
                skinColor = '#14b8a6'; headColor = '#0f766e'; shirtColor = '#475569'; pantsColor = '#0f172a';
                break;
              case 12: // Shadow Realm - Nightwalker
                skinColor = '#1e1b4b'; headColor = '#090514'; shirtColor = '#6b21a8'; pantsColor = '#030712';
                break;
              case 13: // Storm Peaks - Charged Static
                skinColor = '#06b6d4'; headColor = '#0891b2'; shirtColor = '#020617'; pantsColor = '#1e3a8a';
                break;
              case 14: // Dread Swamps - Bog Mummy
                skinColor = '#52525b'; headColor = '#27272a'; shirtColor = '#166534'; pantsColor = '#451a03';
                break;
              case 15: // Chrono Nexus - Clockwork Construct
                skinColor = '#ea580c'; headColor = '#9a3412'; shirtColor = '#2e1065'; pantsColor = '#020617';
                break;
              case 16: // Hyperion Citadel - Starborn Zombie
                skinColor = '#1e293b'; headColor = '#0f172a'; shirtColor = '#eab308'; pantsColor = '#1e1b4b';
                break;
            }

            c.fillStyle = pantsColor; // dirty decaying trousers
            c.fillRect(px - 4.5, py - bodyH + 11, 9, bodyH - 11);

            c.fillStyle = shirtColor; // t-shirt
            c.fillRect(px - 5, py - bodyH, 10, 12);

            // Decaying flesh showing through rips
            c.fillStyle = skinColor; // moldy skin
            c.fillRect(px - 3, py - bodyH + 4, 2.5, 3); // ripped shirt chest
            c.fillStyle = '#b91c1c'; // chest bite wound
            c.fillRect(px + 1, py - bodyH + 5, 2, 2.5);

            // Left/Right reachy-shaky grab arms
            // Left arm is fully extended forward and shaking
            c.fillStyle = skinColor;
            c.fillRect(px - 8.5, py - bodyH + 5 + armsShake, 3.5, 9);
            // Right arm is broken, crooked sideways at a weird joint
            c.fillStyle = skinColor;
            c.fillRect(px + 5, py - bodyH + 5 - armsShake, 3.5, 5);
            c.fillStyle = headColor;
            c.fillRect(px + 6.5, py - bodyH + 9 - armsShake, 2, 3.5);

            // Dark moldy head
            const headY = py - bodyH - 2;
            c.fillStyle = headColor;
            c.beginPath();
            c.arc(px, headY, 4.5, 0, Math.PI * 2);
            c.fill();

            // Sparse tattered hair strands on rotting skull
            c.strokeStyle = hairColor;
            c.lineWidth = 0.8;
            c.beginPath();
            c.moveTo(px - 3.5, headY - 4);
            c.quadraticCurveTo(px - 5, headY - 8, px - 6, headY - 5);
            c.moveTo(px + 1, headY - 4);
            c.quadraticCurveTo(px + 3, headY - 7, px + 4, headY - 6);
            c.stroke();
          }

          // Glowing neon zombie eyes (unless custom override like Lich/Goliath)
          if (zombie.type !== 'boss_necromancer' && zombie.type !== 'boss_goliath') {
            const zVisorX = px + Math.cos(zombie.facingAngle) * (3 * mult);
            const zVisorY = py - bodyH - 3 * mult + Math.sin(zombie.facingAngle) * 1.5;

            c.fillStyle = '#a3e635'; // lime glow eyes
            c.shadowColor = zombie.glowColor;
            c.shadowBlur = 6;
            c.beginPath();
            c.arc(zVisorX, zVisorY, 1.2 * mult, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }

          // Restore canvas transforms before drawing UI overlays (HP and boss tags)
          c.filter = originalFilter || 'none';
          c.restore();

          // Boss name & Health bar overlay (drawn outside squash & stretch)
          const hpPercent = Math.max(0, zombie.health / zombie.maxHealth);
          const barW = 28 * mult;
          const barH = 3;

          const hpy = py - bodyH - 16 * mult;

          // Draw HP background red
          c.fillStyle = '#7f1d1d';
          c.fillRect(px - barW / 2, hpy, barW, barH);
          // Draw actual HP green
          c.fillStyle = '#22c55e';
          c.fillRect(px - barW / 2, hpy, barW * hpPercent, barH);

          // Status effect timers indicators next to HP bars (NO EMOJIS)
          if (zombie.slowTimer && zombie.slowTimer > 0) {
            c.font = 'bold 6.5px monospace';
            c.textAlign = 'left';
            c.fillStyle = '#38bdf8';
            c.fillText('SLOW', px + barW / 2 + 3, hpy + 3.5);
          }
          if (zombie.decayTimer && zombie.decayTimer > 0) {
            c.font = 'bold 6.5px monospace';
            c.textAlign = 'right';
            c.fillStyle = '#c084fc';
            c.fillText('DECAY', px - barW / 2 - 3, hpy + 3.5);
          }

          // Name label above boss
          if (zombie.isBoss) {
            c.fillStyle = zombie.color;
            c.font = 'bold 9px monospace';
            c.textAlign = 'center';
            c.fillText(zombie.name, px, py - bodyH - 20 * mult);
          }
        },
      });
    });

    // E. Add Projectiles
    projectilesRef.current.forEach((proj) => {
      renderQueue.push({
        depth: proj.x + proj.y,
        draw: (c) => {
          const sPos = gridToScreen(proj.x, proj.y, renderOffsetX, renderOffsetY);
          const pCenterX = sPos.x;
          const pCenterY = sPos.y + ISO_TILE_HEIGHT / 2 - 4;
          const angle = Math.atan2(proj.vy, proj.vx);
          const idLower = proj.id.toLowerCase();

          // Save state to avoid bleeding context styles
          c.save();

          if (idLower.startsWith('pistol-')) {
            // Pistol: Sharp cyber-bullet tracer
            const len = 12;
            c.strokeStyle = proj.color;
            c.shadowColor = proj.color;
            c.shadowBlur = 8;
            c.lineWidth = 2.5;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(pCenterX - Math.cos(angle) * len, pCenterY - Math.sin(angle) * len);
            c.lineTo(pCenterX, pCenterY);
            c.stroke();

            // Core high-energy line
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1.0;
            c.beginPath();
            c.moveTo(pCenterX - Math.cos(angle) * (len * 0.6), pCenterY - Math.sin(angle) * (len * 0.6));
            c.lineTo(pCenterX, pCenterY);
            c.stroke();

          } else if (idLower.startsWith('plasma-')) {
            // Plasma Rifle: Double-concentric glowing plasma orb with trail rings
            c.fillStyle = proj.color;
            c.shadowColor = proj.color;
            c.shadowBlur = 12;
            c.beginPath();
            c.arc(pCenterX, pCenterY, proj.radius * 24, 0, Math.PI * 2);
            c.fill();

            // White hot core
            c.fillStyle = '#ffffff';
            c.shadowBlur = 4;
            c.beginPath();
            c.arc(pCenterX, pCenterY, proj.radius * 12, 0, Math.PI * 2);
            c.fill();

            // Fading trail globules
            c.fillStyle = proj.color;
            c.globalAlpha = 0.4;
            c.shadowBlur = 0;
            c.beginPath();
            c.arc(pCenterX - Math.cos(angle) * 9, pCenterY - Math.sin(angle) * 9, proj.radius * 16, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(pCenterX - Math.cos(angle) * 16, pCenterY - Math.sin(angle) * 16, proj.radius * 10, 0, Math.PI * 2);
            c.fill();

          } else if (idLower.startsWith('shotgun-')) {
            // Shotgun: Jagged hot iron shrapnel sparks
            c.fillStyle = '#f97316';
            c.shadowColor = '#f97316';
            c.shadowBlur = 6;
            c.beginPath();
            c.moveTo(pCenterX + Math.cos(angle) * 5, pCenterY + Math.sin(angle) * 5);
            c.lineTo(pCenterX + Math.cos(angle + Math.PI / 2) * 2, pCenterY + Math.sin(angle + Math.PI / 2) * 2);
            c.lineTo(pCenterX - Math.cos(angle) * 5, pCenterY - Math.sin(angle) * 5);
            c.lineTo(pCenterX + Math.cos(angle - Math.PI / 2) * 2, pCenterY + Math.sin(angle - Math.PI / 2) * 2);
            c.closePath();
            c.fill();

          } else if (idLower.startsWith('smg-')) {
            // SMG: Sleek amber tracing needles
            const len = 14;
            c.strokeStyle = '#f59e0b';
            c.shadowColor = '#f59e0b';
            c.shadowBlur = 6;
            c.lineWidth = 1.8;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(pCenterX - Math.cos(angle) * len, pCenterY - Math.sin(angle) * len);
            c.lineTo(pCenterX, pCenterY);
            c.stroke();

          } else if (idLower.startsWith('sniper-')) {
            // Sniper: Precision emerald-green armor-piercing beam ray
            const len = 24;
            c.strokeStyle = '#10b981';
            c.shadowColor = '#10b981';
            c.shadowBlur = 15;
            c.lineWidth = 3.5;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(pCenterX - Math.cos(angle) * len, pCenterY - Math.sin(angle) * len);
            c.lineTo(pCenterX, pCenterY);
            c.stroke();

            // Inner superlaser spike
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(pCenterX - Math.cos(angle) * (len * 0.75), pCenterY - Math.sin(angle) * (len * 0.75));
            c.lineTo(pCenterX, pCenterY);
            c.stroke();

          } else if (idLower.startsWith('rocket-')) {
            // Rocket Launcher: Heavy 2D Missile with flame ignition and fins!
            c.translate(pCenterX, pCenterY);
            c.rotate(angle);

            // Engine Flame
            c.fillStyle = '#ef4444';
            c.shadowColor = '#f97316';
            c.shadowBlur = 12;
            c.beginPath();
            c.moveTo(-7, -2);
            c.lineTo(-14 - Math.random() * 5, 0);
            c.lineTo(-7, 2);
            c.closePath();
            c.fill();

            // Rocket Body
            c.fillStyle = '#64748b';
            c.shadowBlur = 0;
            c.fillRect(-7, -3, 13, 6);

            // Red Nose Cone
            c.fillStyle = '#ef4444';
            c.beginPath();
            c.moveTo(6, -3);
            c.lineTo(12, 0);
            c.lineTo(6, 3);
            c.closePath();
            c.fill();

            // Fins
            c.fillStyle = '#1e293b';
            c.beginPath();
            c.moveTo(-7, -3);
            c.lineTo(-11, -6);
            c.lineTo(-4, -3);
            c.closePath();
            c.fill();

            c.beginPath();
            c.moveTo(-7, 3);
            c.lineTo(-11, 6);
            c.lineTo(-4, 3);
            c.closePath();
            c.fill();

          } else if (idLower.startsWith('flame-') || idLower.startsWith('firestaff-')) {
            // Flamethrower/Fire Staff: Expanding, hot liquid plasma/fire comet
            const ratio = Math.min(1.0, proj.life / proj.maxLife);
            const currentRadius = proj.radius * 24 * (1.0 + ratio * 1.5);
            const hue = 40 - ratio * 40; // shift from yellow-orange down to crimson red
            c.fillStyle = `hsla(${hue}, 100%, 55%, ${1.0 - ratio * 0.6})`;
            c.shadowColor = `hsl(${hue}, 100%, 50%)`;
            c.shadowBlur = 14;
            c.beginPath();
            c.arc(pCenterX, pCenterY, currentRadius, 0, Math.PI * 2);
            c.fill();

            // Extra hot white core for firestaff projectiles (longer life)
            if (idLower.startsWith('firestaff-') && ratio < 0.5) {
              c.fillStyle = '#ffffff';
              c.shadowBlur = 4;
              c.beginPath();
              c.arc(pCenterX, pCenterY, currentRadius * 0.4, 0, Math.PI * 2);
              c.fill();
            }

          } else if (idLower.startsWith('laser-')) {
            // Laser Cannon: Heavy cyber laser core bolt
            const len = 18;
            c.translate(pCenterX, pCenterY);
            c.rotate(angle);
            c.strokeStyle = proj.color;
            c.shadowColor = proj.color;
            c.shadowBlur = 12;
            c.lineWidth = 5.0;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(-len, 0);
            c.lineTo(0, 0);
            c.stroke();

            // Cyber Core
            c.strokeStyle = '#ffffff';
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(-len * 0.8, 0);
            c.lineTo(0, 0);
            c.stroke();

          } else if (idLower.startsWith('grenade-')) {
            // Grenade Launcher: Dark iron fragment capsule with a flashing red LED fuse!
            const blink = Math.floor(Date.now() / 150) % 2 === 0;
            
            // Capsule base
            c.fillStyle = '#334155';
            c.strokeStyle = proj.color;
            c.lineWidth = 1.8;
            c.shadowColor = proj.color;
            c.shadowBlur = 6;
            c.beginPath();
            c.arc(pCenterX, pCenterY, proj.radius * 24, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            // Flashing fuse dot
            c.fillStyle = blink ? '#ef4444' : '#1e293b';
            c.shadowColor = '#ef4444';
            c.shadowBlur = blink ? 8 : 0;
            c.beginPath();
            c.arc(pCenterX, pCenterY, 2.5, 0, Math.PI * 2);
            c.fill();

          } else if (idLower.startsWith('tesla-')) {
            // Tesla Carbine: Unstable jagged electric lightning arc
            c.strokeStyle = '#22d3ee';
            c.shadowColor = '#22d3ee';
            c.shadowBlur = 12;
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(pCenterX - Math.cos(angle) * 16, pCenterY - Math.sin(angle) * 16);

            // Generate an electric jagged knee point
            const midDist = 8;
            const midX = pCenterX - Math.cos(angle) * midDist + (Math.random() - 0.5) * 5;
            const midY = pCenterY - Math.sin(angle) * midDist + (Math.random() - 0.5) * 5;
            
            c.lineTo(midX, midY);
            c.lineTo(pCenterX, pCenterY);
            c.stroke();

            // Electric white flare
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.arc(pCenterX, pCenterY, 3, 0, Math.PI * 2);
            c.fill();

          } else if (idLower.startsWith('void-')) {
            // Void Staff: Miniature black hole swirl portal
            const rot = (Date.now() / 250) % (Math.PI * 2);
            c.translate(pCenterX, pCenterY);
            c.rotate(rot);

            // Swirling gravity accretion trail
            c.strokeStyle = proj.color;
            c.shadowColor = proj.color;
            c.shadowBlur = 16;
            c.lineWidth = 3.0;
            c.beginPath();
            c.arc(0, 0, proj.radius * 24, 0, Math.PI * 1.5);
            c.stroke();

            // Pitch-black vortex core
            c.fillStyle = '#0a0a16';
            c.shadowBlur = 0;
            c.beginPath();
            c.arc(0, 0, proj.radius * 12, 0, Math.PI * 2);
            c.fill();

            // Small vortex spark
            c.fillStyle = proj.color;
            c.beginPath();
            c.arc(Math.cos(rot + Math.PI) * 4, Math.sin(rot + Math.PI) * 4, 1.5, 0, Math.PI * 2);
            c.fill();

          } else if (idLower.startsWith('icestaff-')) {
            // Ice Staff: Sharp rotating cryogenic glacier shard
            c.translate(pCenterX, pCenterY);
            c.rotate(angle + (Date.now() / 220));

            c.fillStyle = '#7dd3fc';
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1.0;
            c.shadowColor = '#38bdf8';
            c.shadowBlur = 10;

            c.beginPath();
            c.moveTo(11, 0); // elongated sharp icicle tip
            c.lineTo(0, -3.5);
            c.lineTo(-7, 0); // flat back
            c.lineTo(0, 3.5);
            c.closePath();
            c.fill();
            c.stroke();

          } else if (idLower.startsWith('windstaff-')) {
            // Wind Staff: Aerodynamic slicing crescent air blade
            c.translate(pCenterX, pCenterY);
            c.rotate(angle + Math.PI / 2); // orient crescent perpendicular to flight

            c.strokeStyle = '#f1f5f9';
            c.shadowColor = '#cbd5e1';
            c.shadowBlur = 10;
            c.lineWidth = 3.5;
            c.lineCap = 'round';
            c.beginPath();
            c.arc(0, -9, 16, Math.PI * 0.22, Math.PI * 0.78);
            c.stroke();

          } else if (idLower.startsWith('chronostaff-')) {
            // Chrono Repeater: Golden rotating clockwork gear dial
            const rot = (Date.now() / 320) % (Math.PI * 2);
            c.translate(pCenterX, pCenterY);
            c.rotate(rot);

            // Golden ring
            c.strokeStyle = '#fbbf24';
            c.shadowColor = '#fbbf24';
            c.shadowBlur = 12;
            c.lineWidth = 1.8;
            c.beginPath();
            c.arc(0, 0, proj.radius * 24, 0, Math.PI * 2);
            c.stroke();

            // Clock indicators hands
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1.4;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(0, -proj.radius * 16); // Hour hand
            c.moveTo(0, 0);
            c.lineTo(proj.radius * 12, proj.radius * 4); // Minute hand
            c.stroke();

            // 4 external gear spokes
            c.fillStyle = '#fbbf24';
            for (let s = 0; s < 4; s++) {
              const sa = s * (Math.PI / 2);
              c.beginPath();
              c.arc(Math.cos(sa) * proj.radius * 24, Math.sin(sa) * proj.radius * 24, 2, 0, Math.PI * 2);
              c.fill();
            }

          } else {
            // Fallback: Standard high-performance glowing laser bullet
            c.fillStyle = proj.color;
            c.shadowColor = proj.color;
            c.shadowBlur = 10;
            c.beginPath();
            c.arc(pCenterX, pCenterY, proj.radius * 24, 0, Math.PI * 2);
            c.fill();
          }

          // Restore styles
          c.restore();
        },
      });
    });

    // Sort Queue by depth ascending (Painter's Algorithm) and render
    renderQueue.sort((a, b) => a.depth - b.depth);
    renderQueue.forEach((item) => item.draw(ctx));

    // 2. PARTICLES & EXPLOSIONS
    particlesRef.current.forEach((p) => {
      const sPos = gridToScreen(p.x, p.y, renderOffsetX, renderOffsetY);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(sPos.x - p.size / 2, sPos.y + ISO_TILE_HEIGHT / 2 - 6, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // 3. DARK ATMOSPHERIC RADIAL GLOW FOG MASK
    // Carve light mask for glowing features using destination-out overlay
    if (graphicsQuality !== 'low') {
      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement('canvas');
      }
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas.width !== canvas.width || maskCanvas.height !== canvas.height) {
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
      }
      const mctx = maskCanvas.getContext('2d');

      if (mctx) {
        // fill with atmospheric total fog darkness
        mctx.fillStyle = levelTheme.fogColor;
        mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // set destination-out to erase darkness with lights
        mctx.globalCompositeOperation = 'destination-out';

        // Player light circle
        const pS = gridToScreen(player.x, player.y, renderOffsetX, renderOffsetY);
        const gradPlayer = mctx.createRadialGradient(pS.x, pS.y, 5, pS.x, pS.y, 160);
        gradPlayer.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradPlayer.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
        gradPlayer.addColorStop(1, 'rgba(255, 255, 255, 0)');
        mctx.fillStyle = gradPlayer;
        mctx.beginPath();
        mctx.arc(pS.x, pS.y, 160, 0, Math.PI * 2);
        mctx.fill();

        // Projectiles lights
        projectilesRef.current.forEach((proj) => {
          const pS2 = gridToScreen(proj.x, proj.y, renderOffsetX, renderOffsetY);
          const gradP = mctx.createRadialGradient(pS2.x, pS2.y, 2, pS2.x, pS2.y, 35);
          gradP.addColorStop(0, 'rgba(255,255,255,1)');
          gradP.addColorStop(1, 'rgba(255,255,255,0)');
          mctx.fillStyle = gradP;
          mctx.beginPath();
          mctx.arc(pS2.x, pS2.y, 35, 0, Math.PI * 2);
          mctx.fill();
        });

        // Ground drops/gems lights
        groundItemsRef.current.forEach((item) => {
          if (item.type === 'gem') {
            const pS3 = gridToScreen(item.x, item.y, renderOffsetX, renderOffsetY);
            const gradG = mctx.createRadialGradient(pS3.x, pS3.y, 2, pS3.x, pS3.y, 40);
            gradG.addColorStop(0, 'rgba(255,255,255,0.9)');
            gradG.addColorStop(1, 'rgba(255,255,255,0)');
            mctx.fillStyle = gradG;
            mctx.beginPath();
            mctx.arc(pS3.x, pS3.y, 40, 0, Math.PI * 2);
            mctx.fill();
          }
        });

        // Bosses lights
        enemiesRef.current.forEach((zombie) => {
          if (zombie.isBoss) {
            const zS = gridToScreen(zombie.x, zombie.y, renderOffsetX, renderOffsetY);
            const gradBoss = mctx.createRadialGradient(zS.x, zS.y, 5, zS.x, zS.y, 80);
            gradBoss.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            gradBoss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            mctx.fillStyle = gradBoss;
            mctx.beginPath();
            mctx.arc(zS.x, zS.y, 80, 0, Math.PI * 2);
            mctx.fill();
          }
        });

        // Draw compiled light fog mask onto main canvas
        ctx.drawImage(maskCanvas, 0, 0);
      }
    }

    // 4. FLOATING TEXT DAMAGE/EXPERIENCE NUMBERS (Rendered on top of fog mask)
    textPopsRef.current.forEach((pop) => {
      const sPos = gridToScreen(pop.x, pop.y, renderOffsetX, renderOffsetY);
      ctx.fillStyle = pop.color;
      ctx.font = 'bold 11px monospace';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 8);
      ctx.shadowBlur = 0;
    });

    // 5. SCREEN-SPACE HUD RADAR OVERLAY (Top Right)
    const rx = canvas.width - 80;
    const ry = 80;
    const rRadius = 55;

    // Radar circular base
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.arc(rx, ry, rRadius, 0, Math.PI * 2);
    ctx.fill();

    // Radar border grid
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx, ry, rRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(rx, ry, rRadius, 0, Math.PI * 2);
    ctx.moveTo(rx - rRadius, ry);
    ctx.lineTo(rx + rRadius, ry);
    ctx.moveTo(rx, ry - rRadius);
    ctx.lineTo(rx, ry + rRadius);
    ctx.stroke();

    // Sonar sweeping beam line
    const sweepAngle = (Date.now() * 0.0035) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(sweepAngle) * rRadius, ry + Math.sin(sweepAngle) * rRadius);
    ctx.stroke();

    // Draw Chests & Resources as yellow/cyan blips on radar
    const radarRangeMax = 18; // tiles radius
    resourceNodesRef.current.forEach((node) => {
      if (node.health <= 0) return;
      const ndx = node.x - player.x;
      const ndy = node.y - player.y;
      const dist = Math.sqrt(ndx * ndx + ndy * ndy);
      if (dist < radarRangeMax) {
        // Isometric radar angles correspond to simple cartesian representation
        const angle = Math.atan2(ndy, ndx);
        const blipDist = (dist / radarRangeMax) * rRadius;
        const bx = rx + Math.cos(angle) * blipDist;
        const by = ry + Math.sin(angle) * blipDist;

        ctx.fillStyle = node.type === 'chest' ? '#eab308' : '#38bdf8'; // yellow for chest, blue for resource
        ctx.beginPath();
        ctx.arc(bx, by, node.type === 'chest' ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Zombie enemies as red blips on radar
    enemiesRef.current.forEach((zombie) => {
      const zdx = zombie.x - player.x;
      const zdy = zombie.y - player.y;
      const dist = Math.sqrt(zdx * zdx + zdy * zdy);
      if (dist < radarRangeMax) {
        const angle = Math.atan2(zdy, zdx);
        const blipDist = (dist / radarRangeMax) * rRadius;
        const bx = rx + Math.cos(angle) * blipDist;
        const by = ry + Math.sin(angle) * blipDist;

        ctx.fillStyle = zombie.isBoss ? '#f43f5e' : '#ef4444'; // rose for bosses, solid red for normal
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = zombie.isBoss ? 4 : 0;
        ctx.beginPath();
        ctx.arc(bx, by, zombie.isBoss ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw Player dot in direct center (Cyan)
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Clean text overlay labeling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("RADAR HUD", rx, ry - rRadius - 5);
    ctx.restore();

    // 6. SCREEN-SPACE COMBO SYSTEM STREAK BAR (Top Center)
    if (player.comboCount && player.comboCount > 0) {
      const cx = canvas.width / 2;
      const cy = 45;
      
      ctx.save();
      const comboPulse = Math.sin(Date.now() * 0.01) * 3;
      
      // Draw neon pink background aura
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12 + comboPulse;
      ctx.fillStyle = '#ec4899';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${player.comboCount}x COMBO`, cx, cy);
      ctx.shadowBlur = 0;

      // Inner text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(`${player.comboCount}x COMBO`, cx, cy - 0.5);

      // Multiplier effect subtitle (e.g. "+35% Damage")
      const bonusDmg = Math.round(player.comboCount * 5);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`+${bonusDmg}% DAMAGE BOOST`, cx, cy + 12);

      // Decaying combo timer bar
      const barW = 100;
      const barH = 4;
      const bx = cx - barW / 2;
      const by = cy + 18;
      const fillPct = Math.max(0, Math.min(1, player.comboTimer / 3.5));

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, barW, barH);
      
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(bx, by, barW * fillPct, barH);
      ctx.restore();
    }

    // --- 7. DYNAMIC PLACEMENT GRID PREVIEW ---
    if (activePlacement && mouseGridPosRef.current) {
      const gx = mouseGridPosRef.current.x;
      const gy = mouseGridPosRef.current.y;
      const cellX = Math.floor(gx);
      const cellY = Math.floor(gy);
      
      if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
        const player = playerRef.current;
        const dist = Math.sqrt((player.x - cellX) ** 2 + (player.y - cellY) ** 2);
        const inRange = dist <= 5.0;
        
        const pTop = gridToScreen(cellX, cellY, renderOffsetX, renderOffsetY);
        const pRight = gridToScreen(cellX + 1, cellY, renderOffsetX, renderOffsetY);
        const pBottom = gridToScreen(cellX + 1, cellY + 1, renderOffsetX, renderOffsetY);
        const pLeft = gridToScreen(cellX, cellY + 1, renderOffsetX, renderOffsetY);
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pTop.x, pTop.y + ISO_TILE_HEIGHT / 2);
        ctx.lineTo(pRight.x, pRight.y + ISO_TILE_HEIGHT / 2);
        ctx.lineTo(pBottom.x, pBottom.y + ISO_TILE_HEIGHT / 2);
        ctx.lineTo(pLeft.x, pLeft.y + ISO_TILE_HEIGHT / 2);
        ctx.closePath();
        
        if (inRange) {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; // 20% cyan for valid
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // 20% red for invalid/too far
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
        }
        
        ctx.setLineDash([4, 2]); // dashed style
        ctx.fill();
        ctx.stroke();
        
        // Label above placement
        ctx.shadowBlur = 0;
        ctx.fillStyle = inRange ? '#22d3ee' : '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        
        const labelText = inRange 
          ? `DEPLOY ${activePlacement === 'spike_trap' ? 'SPIKES' : 'TURRET'}`
          : 'OUT OF RANGE';
        ctx.fillText(labelText, pTop.x, pTop.y - 12);
        
        // Render 3D Isometric Ghost Model Preview
        ctx.save();
        ctx.globalAlpha = 0.55; // semi-transparent blueprint aesthetic
        
        const sPos = gridToScreen(cellX + 0.5, cellY + 0.5, renderOffsetX, renderOffsetY);
        
        if (activePlacement === 'spike_trap') {
          // Spike Trap Ghost Preview
          ctx.shadowColor = inRange ? '#22d3ee' : '#ef4444';
          ctx.shadowBlur = 8;
          
          ctx.fillStyle = inRange ? '#0e7490' : '#991b1b'; // Cyan vs Dark Red
          ctx.beginPath();
          ctx.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 22, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = inRange ? '#22d3ee' : '#ef4444';
          ctx.strokeStyle = inRange ? '#0891b2' : '#7f1d1d';
          ctx.lineWidth = 1;
          for (let i = -2; i <= 2; i++) {
            const sx = sPos.x + i * 7;
            const sy = sPos.y + ISO_TILE_HEIGHT / 2 + Math.abs(i) * 2;
            ctx.beginPath();
            ctx.moveTo(sx - 3, sy);
            ctx.lineTo(sx, sy - 14);
            ctx.lineTo(sx + 3, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else if (activePlacement === 'tesla_turret') {
          // Tesla Turret Ghost Preview
          ctx.shadowColor = inRange ? '#22d3ee' : '#ef4444';
          ctx.shadowBlur = 10;
          
          ctx.fillStyle = inRange ? '#334155' : '#7f1d1d';
          ctx.strokeStyle = inRange ? '#22d3ee' : '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2, 20, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = inRange ? '#475569' : '#991b1b';
          ctx.fillRect(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2 - 25, 6, 25);
          ctx.strokeRect(sPos.x - 3, sPos.y + ISO_TILE_HEIGHT / 2 - 25, 6, 25);
          
          // Pulsing coils
          ctx.fillStyle = inRange ? '#fbbf24' : '#ef4444';
          for (let i = 0; i < 3; i++) {
            const coilY = sPos.y + ISO_TILE_HEIGHT / 2 - 12 - i * 5;
            ctx.beginPath();
            ctx.ellipse(sPos.x, coilY, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Top sphere
          ctx.fillStyle = inRange ? '#22d3ee' : '#ef4444';
          ctx.beginPath();
          ctx.arc(sPos.x, sPos.y + ISO_TILE_HEIGHT / 2 - 28, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
        
        ctx.restore();
      }
    }

    // --- 8. FULL-SCREEN ATMOSPHERIC WEATHER OVERLAYS ---
    if (graphicsQuality !== 'low') {
      const curW = currentWeatherRef.current;
      if (curW && curW !== 'clear') {
        ctx.save();
        
        const width = canvas.width;
        const height = canvas.height;
        
        if (curW === 'storm') {
          // Rainstorm atmospheric overlays: falling drops
          ctx.strokeStyle = 'rgba(165, 243, 252, 0.22)';
          ctx.lineWidth = 1;
          
          const now = Date.now();
          // Generate pseudo-random lines using time seeds
          for (let i = 0; i < 30; i++) {
            const rx = ((now * (i + 1) * 33) % width);
            const ry = ((now * (i + 1) * 11) % height);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 10, ry + 25);
            ctx.stroke();
          }
          
          // Occasional thunder sheet lightning effect
          const lightningFlash = (now % 4200) < 60; // flash for 60ms every 4.2s
          if (lightningFlash) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(0, 0, width, height);
          }
        } else if (curW === 'blizzard') {
          // Frost Blizzard atmospheric overlays: drifting snow and frozen vignette
          const now = Date.now();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          for (let i = 0; i < 40; i++) {
            const rx = (((now * 0.15) + (i * 45)) % (width + 50)) - 25;
            const ry = (((now * 0.1) + (i * 90)) % (height + 50)) - 25;
            const rSize = 1.2 + ((i * 7) % 2.5);
            ctx.beginPath();
            ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Frozen Cyan Screen Border Vignette
          const gradient = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width/1.2);
          gradient.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0.18)'); // frozen cyan outer
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else if (curW === 'toxic_fog') {
          // Toxic Green Corrosive Fog rolling waves
          const now = Date.now();
          const wave = Math.sin(now / 1500) * 0.02;
          
          const gradient = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width/1.1);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.0)');
          gradient.addColorStop(1, `rgba(16, 185, 129, ${0.12 + wave})`); // rolling green fog
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else if (curW === 'ashfall') {
          // Volcanic Ashfall drifting gray ash and deep red embers
          const now = Date.now();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.55)'; // glowing embers
          for (let i = 0; i < 20; i++) {
            const rx = (((now * 0.08) + (i * 65)) % (width + 40)) - 20;
            const ry = (((now * 0.05) + (i * 120)) % (height + 40)) - 20;
            const rSize = 1.5;
            ctx.beginPath();
            ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'; // gray ash particles
          for (let i = 0; i < 20; i++) {
            const rx = (((now * 0.05) + (i * 73)) % (width + 40)) - 20;
            const ry = (((now * 0.07) + (i * 105)) % (height + 40)) - 20;
            const rSize = 2.0;
            ctx.beginPath();
            ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Volcanic ash deep copper red/brown vignette
          const gradient = ctx.createRadialGradient(width/2, height/2, width/3.5, width/2, height/2, width/1.1);
          gradient.addColorStop(0, 'rgba(120, 53, 15, 0.0)');
          gradient.addColorStop(1, 'rgba(120, 53, 15, 0.16)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else if (curW === 'plasma_tempest') {
          // Plasma Tempest violet vignette & electrical sparkles
          const now = Date.now();
          const spark = Math.sin(now / 50) * 0.03;
          
          const gradient = ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width/1.15);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.0)');
          gradient.addColorStop(1, `rgba(168, 85, 247, ${0.14 + spark})`); // pulsing violet plasma
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          
          // Plasma electrical sparkles popping up occasionally
          if (Math.random() < 0.08) {
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + (Math.random() - 0.5) * 15, ry - 10 - Math.random() * 15);
            ctx.stroke();
          }
        }
        
        ctx.restore();
      }
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePlacement) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const { x: gx, y: gy } = screenToGrid(sx, sy);
    const cellX = Math.floor(gx);
    const cellY = Math.floor(gy);

    // Check if cell is in bounds
    if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
      // Check distance from player
      const player = playerRef.current;
      const dist = Math.sqrt((player.x - cellX) ** 2 + (player.y - cellY) ** 2);
      if (dist <= 5.0) {
        // Deploy trap or turret!
        if (activePlacement === 'spike_trap') {
          if (player.spikeTrapsCount && player.spikeTrapsCount > 0) {
            deployablesRef.current.push({
              id: `spike-${Date.now()}-${Math.random()}`,
              type: 'spike_trap',
              x: cellX + 0.5,
              y: cellY + 0.5,
              health: 100,
              maxHealth: 100,
              attackCooldown: 0,
            });
            player.spikeTrapsCount -= 1;
            setPlayerState({ ...player });
            audio.playSfx('craft');
            spawnTextPop(cellX + 0.5, cellY + 0.5 - 1.2, "SPIKE TRAP PLACED!", "#f97316");
            spawnParticles(cellX + 0.5, cellY + 0.5, "#f97316", 8, 0.8);
          }
        } else if (activePlacement === 'tesla_turret') {
          if (player.teslaTurretsCount && player.teslaTurretsCount > 0) {
            deployablesRef.current.push({
              id: `tesla-${Date.now()}-${Math.random()}`,
              type: 'tesla_turret',
              x: cellX + 0.5,
              y: cellY + 0.5,
              health: 120,
              maxHealth: 120,
              attackCooldown: 1.0,
            });
            player.teslaTurretsCount -= 1;
            setPlayerState({ ...player });
            audio.playSfx('craft');
            spawnTextPop(cellX + 0.5, cellY + 0.5 - 1.2, "TESLA TURRET ACTIVE!", "#06b6d4");
            spawnParticles(cellX + 0.5, cellY + 0.5, "#06b6d4", 12, 1.0);
          }
        }
        // Stop placement mode
        setActivePlacement(null);
      } else {
        spawnTextPop(player.x, player.y - 1.2, "TOO FAR TO DEPLOY!", "#f87171");
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const { x: gx, y: gy } = screenToGrid(sx, sy);
    mouseGridPosRef.current = { x: gx, y: gy };
  };

  // Callback from mobile touch joysticks
  const handleJoystickMove = useCallback((vector: { x: number; y: number }) => {
    targetJoystickVectorRef.current = vector;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* 2.5D Canvas Element */}
      <canvas
        id="isometric-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block bg-transparent cursor-crosshair"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
      />

      {/* GAME STATUS OVERLAYS */}
      {/* A. GAMEOVER DIALOG */}
      {gameState.gameStatus === 'gameover' && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in select-none">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center space-y-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mx-auto shadow-md">
              <Skull className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-red-400 font-sans uppercase">
                Defeated!
              </h2>
              <p className="text-xs font-mono text-slate-300">
                The horde overwhelmed you in Level {gameState.level}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-left font-mono text-xs shadow-inner">
              <div>
                <span className="text-slate-400 block">WAVE REACHED</span>
                <span className="text-red-400 font-bold text-sm">Wave {gameState.currentWave}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ZOMBIES CRUSHED</span>
                <span className="text-slate-200 font-bold text-sm">{gameState.zombiesKilled}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  restartLevel();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white border border-red-400/30 font-sans text-sm font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/15 hover:scale-[1.01] active:scale-95 transition-all"
              >
                Restart This Zone
              </button>
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  persistActiveInventory();
                  onReturnToMenu();
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs uppercase cursor-pointer transition-all"
              >
                Exit to HQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. LEVEL VICTORY DIALOG */}
      {gameState.gameStatus === 'victory' && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in select-none">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center space-y-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto shadow-md">
              <Crown className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-emerald-400 font-sans uppercase">
                Zone Cleared!
              </h2>
              <p className="text-xs font-mono text-slate-300">
                You survived the level and defeated the legendary Boss!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-left font-mono text-xs shadow-inner">
              <div>
                <span className="text-slate-400 block">SOLDIER RANK</span>
                <span className="text-emerald-400 font-bold text-sm">LVL {playerState.level}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ZOMBIES KILLED</span>
                <span className="text-slate-200 font-bold text-sm">{gameState.zombiesKilled}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {currentLevel < LEVEL_THEMES.length ? (
                <button
                  onClick={() => {
                    audio.playSfx('loot');
                    persistActiveInventory();
                    setCurrentLevel(currentLevel + 1);
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white border border-emerald-400/30 font-sans text-sm font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Next Zone (0{currentLevel + 1})
                </button>
              ) : (
                <div className="text-center font-mono text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 mb-1 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 animate-pulse" /> Campaign Fully Completed! You are a Legendary Survivor!
                </div>
              )}
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  persistActiveInventory();
                  restartLevel();
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-sans text-xs uppercase cursor-pointer transition-all"
              >
                Replay This Map
              </button>
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  persistActiveInventory();
                  onReturnToMenu();
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-sans text-xs uppercase cursor-pointer transition-all"
              >
                Return to HQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. GAME PAUSE DIALOG */}
      {gameState.gameStatus === 'paused' && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in select-none">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center space-y-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto shadow-md">
              <Pause className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-amber-400 font-sans uppercase">
                Tactical Pause
              </h2>
              <p className="text-xs font-mono text-slate-300">
                Deployment is frozen. Review your strategy, Soldier.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-left font-mono text-xs shadow-inner">
              <div>
                <span className="text-slate-400 block uppercase">CURRENT LEVEL</span>
                <span className="text-amber-400 font-bold text-sm">Zone 0{currentLevel}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">ZOMBIES CRUSHED</span>
                <span className="text-slate-200 font-bold text-sm">{gameState.zombiesKilled}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  setGameState((prev) => ({ ...prev, gameStatus: 'playing' }));
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-400/30 font-sans text-sm font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                ▶ Resume Battle
              </button>
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  restartLevel();
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-mono text-xs uppercase cursor-pointer transition-all"
              >
                🔄 Restart This Zone
              </button>
              <button
                onClick={() => {
                  audio.playSfx('loot');
                  persistActiveInventory();
                  onReturnToMenu();
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 font-mono text-xs uppercase cursor-pointer transition-all"
              >
                🚪 Abort to HQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL GAME HUD (Only when actively playing or paused) */}
      {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'paused') && (
        <HUD
          player={playerState}
          currentWave={gameState.currentWave}
          waveActive={gameState.waveActive}
          waveTimer={gameState.waveTimer}
          totalWaves={totalWaves}
          level={currentLevel}
          levelName={levelTheme.name}
          zombiesKilled={gameState.zombiesKilled}
          currentWeather={currentWeather}
          weatherTimer={weatherTimer}
          activePowerups={activePowerupsState}
          activePlacement={activePlacement}
          onTogglePlacement={(type) => {
            if (type === 'spike_trap' && (playerState.spikeTrapsCount || 0) <= 0) {
              spawnTextPop(playerState.x, playerState.y - 1, 'No Spike Traps! Forge some in Forge Menu (C Key).', '#f97316');
              return;
            }
            if (type === 'tesla_turret' && (playerState.teslaTurretsCount || 0) <= 0) {
              spawnTextPop(playerState.x, playerState.y - 1, 'No Tesla Turrets! Forge some in Forge Menu (C Key).', '#06b6d4');
              return;
            }
            setActivePlacement((prev) => (prev === type ? null : type));
          }}
          onOpenCrafting={() => setIsCraftingOpen(true)}
          onOpenInventory={() => {}} // Disabled mid-game as inventory equipment management is strictly in main menu
          onUsePotion={triggerPotionUse}
          onEquipWeapon={equipWeapon}
          onPauseToggle={() => {
            setGameState((prev) => ({
              ...prev,
              gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing',
            }));
          }}
        />
      )}

      {/* FLOATING VIRTUAL JOYSTICK (Only when actively playing, positioned at bottom left overlay) */}
      {gameState.gameStatus === 'playing' && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 pointer-events-auto flex flex-col items-center">
          <Joystick onMove={handleJoystickMove} />
        </div>
      )}

      {/* FORGE CRAFTING MODAL SIDEBAR */}
      <CraftingMenu
        isOpen={isCraftingOpen}
        onClose={() => setIsCraftingOpen(false)}
        inventory={playerState.inventory}
        craftedWeapons={playerState.craftedWeapons}
        activeWeapon={playerState.activeWeapon}
        potionsCount={playerState.potionsCount}
        spikeTrapsCount={playerState.spikeTrapsCount}
        teslaTurretsCount={playerState.teslaTurretsCount}
        hasCompanionDrone={playerState.hasCompanionDrone}
        onCraft={handleCraft}
        onEquip={equipWeapon}
      />

      {/* BOSS LOOT REWARD MODAL */}
      <LootRewardModal
        isOpen={activeBossLoot !== null}
        bossName={activeBossName}
        rewards={activeBossLoot || []}
        onClose={() => {
          setActiveBossLoot(null);
          setActiveBossName("");
          
          // Check if the boss was defeated on Wave 10. If so, finish the campaign level with victory!
          if (gameState.currentWave === 10) {
            setGameState((prev) => ({ ...prev, gameStatus: 'victory' }));
          }
        }}
      />
    </div>
  );
}
