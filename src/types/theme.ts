export type ThemeVibe = 'studio-light' | 'cyberpunk-2047' | 'mpc-vintage' | 'midnight-obsidian';

export interface ThemeConfig {
  id: ThemeVibe;
  name: string;
  tagline: string;
  isDark: boolean;
  previewBg: string;
  previewAccent: string;
  previewBorder: string;
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'studio-light',
    name: 'Studio Daylight',
    tagline: 'Precision Slate & Warm Amber (Default)',
    isDark: false,
    previewBg: '#f8fafc',
    previewAccent: '#d97706',
    previewBorder: '#cbd5e1',
  },
  {
    id: 'cyberpunk-2047',
    name: 'Cyberpunk 2047',
    tagline: 'OLED Black, Electric Yellow & Cyan',
    isDark: true,
    previewBg: '#0a0a0f',
    previewAccent: '#facc15',
    previewBorder: 'rgba(250, 204, 21, 0.4)',
  },
  {
    id: 'mpc-vintage',
    name: 'MPC 3000 Vintage',
    tagline: 'Classic 1990s Travertine Cream & Akai Rust',
    isDark: false,
    previewBg: '#f4f1ea',
    previewAccent: '#ea580c',
    previewBorder: '#d6cfc2',
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    tagline: 'Stealth Carbon & Ice Turquoise Glow',
    isDark: true,
    previewBg: '#0b0d13',
    previewAccent: '#38bdf8',
    previewBorder: 'rgba(56, 189, 248, 0.4)',
  },
];
