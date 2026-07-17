import React from 'react';
import {
  Swords,
  Sword,
  Shield,
  Hammer,
  Target,
  Zap,
  Wand,
  Sparkles,
  Heart,
  Gem,
  Crown,
  Cpu,
  Eye,
  Trophy,
  Award,
  Flame,
  Skull,
  Activity,
  Battery
} from 'lucide-react';
import { GameItem } from '../systems/lootSystem';

interface ItemIconProps {
  item: GameItem;
  className?: string;
  size?: number;
}

export default function ItemIcon({ item, className = "w-6 h-6", size = 20 }: ItemIconProps) {
  const nameLower = item.name.toLowerCase();
  const subTypeLower = (item.subType || '').toLowerCase();
  const type = item.type;

  // 1. Resolve matching Lucide icon based on name, subType, and item properties
  const getIconComponent = () => {
    // Trophies / Boss drops
    if (type === 'trophy') {
      if (nameLower.includes('crown')) return Crown;
      if (nameLower.includes('core') || nameLower.includes('processor')) return Cpu;
      if (nameLower.includes('chamber') || nameLower.includes('heart')) return Heart;
      if (nameLower.includes('scale') || nameLower.includes('horn')) return Flame;
      return Trophy;
    }

    // Materials
    if (type === 'material') {
      if (nameLower.includes('strand') || nameLower.includes('fiber')) return Sparkles;
      if (nameLower.includes('battery')) return Battery;
      if (nameLower.includes('shard') || nameLower.includes('glow')) return Gem;
      if (nameLower.includes('essence') || nameLower.includes('soul')) return Skull;
      if (nameLower.includes('powder') || nameLower.includes('fire')) return Flame;
      return Gem;
    }

    // Weapons
    if (type === 'weapon') {
      const isStaff = ['void_staff', 'fire_staff', 'ice_staff', 'wind_staff', 'chrono_repeater'].includes(subTypeLower);
      const isHeavy = ['rocket_launcher', 'shotgun', 'grenade_launcher'].includes(subTypeLower);
      const isEnergy = ['plasma_rifle', 'laser_cannon', 'tesla_carbine', 'sniper_rifle'].includes(subTypeLower);
      if (isStaff) return Wand;
      if (isHeavy) return Hammer;
      if (isEnergy) return Zap;
      if (subTypeLower === 'flamethrower') return Flame;
      return Swords;
    }

    // Armors
    if (type === 'armor') {
      if (nameLower.includes('barrier') || nameLower.includes('aegis')) return Shield;
      if (nameLower.includes('harness') || nameLower.includes('exosuit')) return Cpu;
      return Shield;
    }

    // Accessories
    if (type === 'accessory') {
      if (nameLower.includes('core') || nameLower.includes('generator')) return Battery;
      if (nameLower.includes('pendant') || nameLower.includes('eye')) return Eye;
      if (nameLower.includes('node') || nameLower.includes('shield')) return Shield;
      if (nameLower.includes('band') || nameLower.includes('ring')) return Sparkles;
      return Award;
    }

    return Gem;
  };

  // 2. Determine color palette for the vector drawing
  const getIconColor = () => {
    // Color matches item rarity or special theme keywords
    if (nameLower.includes('cryo') || nameLower.includes('ice') || nameLower.includes('frost')) {
      return 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]';
    }
    if (nameLower.includes('fire') || nameLower.includes('dragon') || nameLower.includes('plasma')) {
      return 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]';
    }
    if (nameLower.includes('lich') || nameLower.includes('soul') || nameLower.includes('necromancer')) {
      return 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]';
    }
    if (nameLower.includes('acid') || nameLower.includes('toxic') || nameLower.includes('poison')) {
      return 'text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]';
    }
    if (nameLower.includes('titanium') || nameLower.includes('cyber') || nameLower.includes('sentinel')) {
      return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]';
    }

    // Fallback to standard rarity colors
    switch (item.rarity) {
      case 'ancient': return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse';
      case 'mythic': return 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse';
      case 'legendary': return 'text-orange-400 drop-shadow-[0_0_6px_rgba(249,113,22,0.5)]';
      case 'epic': return 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]';
      case 'rare': return 'text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]';
      case 'uncommon': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const IconComp = getIconComponent();
  const iconColorClass = getIconColor();

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <IconComp size={size} className={iconColorClass} />
    </div>
  );
}
