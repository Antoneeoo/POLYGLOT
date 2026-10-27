/**
 * Avatar customization and appearance options
 */

export interface AvatarConfig {
  name: string;
  skinTone: string;
  hairStyle: 'fade' | 'short_curly' | 'sleek_back' | 'long_wavy' | 'bob' | 'buzz';
  hairColor: string;
  outfitType: 'hoodie' | 'blazer' | 'tshirt' | 'scrubs' | 'athletic';
  outfitColor: string;
  eyeColor: string;
  glasses: 'none' | 'modern_round' | 'classic_square' | 'wireframe';
  facialHair: 'none' | 'stubble' | 'beard';
}

export const SKIN_TONE_PRESETS = [
  { id: 'porcelain', label: 'Fair Porcelain', hex: '#f7d3c0' },
  { id: 'peach', label: 'Warm Peach', hex: '#f2c1a4' },
  { id: 'olive', label: 'Olive Beige', hex: '#d9a779' },
  { id: 'golden', label: 'Golden Tan', hex: '#c58b59' },
  { id: 'bronze', label: 'Warm Bronze', hex: '#99633e' },
  { id: 'mahogany', label: 'Deep Mahogany', hex: '#63381e' },
  { id: 'espresso', label: 'Rich Espresso', hex: '#402313' }
];

export const HAIR_COLOR_PRESETS = [
  { id: 'dark_black', label: 'Jet Black', hex: '#1c1b1b' },
  { id: 'dark_brown', label: 'Dark Brown', hex: '#3d2b1f' },
  { id: 'chestnut', label: 'Chestnut', hex: '#5c3a21' },
  { id: 'honey_blonde', label: 'Honey Blonde', hex: '#c79c5e' },
  { id: 'platinum', label: 'Platinum Silver', hex: '#d9dce0' },
  { id: 'copper_red', label: 'Copper Auburn', hex: '#8a3324' },
  { id: 'cyber_cyan', label: 'Electric Blue', hex: '#2563eb' }
];

export const OUTFIT_COLOR_PRESETS = [
  { id: 'navy', label: 'Deep Navy', hex: '#1e293b' },
  { id: 'indigo', label: 'Royal Indigo', hex: '#4338ca' },
  { id: 'emerald', label: 'Emerald Teal', hex: '#065f46' },
  { id: 'burgundy', label: 'Burgundy Crimson', hex: '#881337' },
  { id: 'charcoal', label: 'Slate Charcoal', hex: '#334155' },
  { id: 'lavender', label: 'Soft Lavender', hex: '#7c3aed' },
  { id: 'cream', label: 'Warm Sand', hex: '#e2e8f0' }
];

export const EYE_COLOR_PRESETS = [
  { id: 'brown', label: 'Deep Brown', hex: '#452b1b' },
  { id: 'hazel', label: 'Golden Hazel', hex: '#615332' },
  { id: 'green', label: 'Emerald Green', hex: '#2b5f3a' },
  { id: 'blue', label: 'Ocean Blue', hex: '#2b6cb0' },
  { id: 'gray', label: 'Steel Gray', hex: '#4a5568' }
];

export const DEFAULT_AVATAR: AvatarConfig = {
  name: 'Maya',
  skinTone: '#f2c1a4',
  hairStyle: 'short_curly',
  hairColor: '#3d2b1f',
  outfitType: 'hoodie',
  outfitColor: '#4338ca',
  eyeColor: '#452b1b',
  glasses: 'modern_round',
  facialHair: 'none'
};
