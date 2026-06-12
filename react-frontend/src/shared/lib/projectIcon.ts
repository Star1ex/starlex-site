// Project icon system — Linear-style "icon + colour" picked from a curated set.
//
// The backend stores `project.icon` as a free string, so we overload it with a
// small token grammar instead of adding a colour column:
//
//   'lucide:<Name>:<#hex>'  → a curated Lucide glyph tinted with <#hex>
//   '<emoji>'               → an emoji (rendered as text)
//   '<X>' (legacy)          → any other short string, rendered as text
//   ''                      → no icon (caller shows the name initial)

import {
  Code2, Terminal, Database, Server, Cloud, Cpu, HardDrive, Bug, GitBranch,
  Boxes, Box, Package, Layers, Component, Braces, Binary, FileCode, Folder,
  Globe, Rocket, Zap, Flame, Sparkles, Star, Target, Flag, Bookmark, Beaker,
  FlaskConical, Microscope, Brain, Lightbulb, PenTool, Palette, Camera, Image,
  Music, Film, ChartBar, ChartLine, ChartPie, TrendingUp, Activity, Briefcase,
  Building2, ShoppingCart, CreditCard, DollarSign, Mail, MessageSquare, Bell,
  Calendar, Clock, Map, Compass, Shield, Lock, Key, Settings, Wrench, Hammer,
  Plug, Wifi, Smartphone, Monitor, Heart, Users, Home, Leaf, Sun, Moon, Droplet,
  Anchor, Plane, Trophy, Gift, Coffee, Book, GraduationCap, ListTodo,
  CircleCheck, Hash, Link, Puzzle, Wand2, Atom, Crown, Gem, Feather, Bot,
  type LucideIcon,
} from 'lucide-react';

/** Curated icon catalogue. Order is the grid order in the picker. */
export const PROJECT_ICONS: Record<string, LucideIcon> = {
  Code2, Terminal, Database, Server, Cloud, Cpu, HardDrive, Bug, GitBranch,
  Boxes, Box, Package, Layers, Component, Braces, Binary, FileCode, Folder,
  Globe, Rocket, Zap, Flame, Sparkles, Star, Target, Flag, Bookmark, Beaker,
  FlaskConical, Microscope, Brain, Lightbulb, PenTool, Palette, Camera, Image,
  Music, Film, ChartBar, ChartLine, ChartPie, TrendingUp, Activity, Briefcase,
  Building2, ShoppingCart, CreditCard, DollarSign, Mail, MessageSquare, Bell,
  Calendar, Clock, Map, Compass, Shield, Lock, Key, Settings, Wrench, Hammer,
  Plug, Wifi, Smartphone, Monitor, Heart, Users, Home, Leaf, Sun, Moon, Droplet,
  Anchor, Plane, Trophy, Gift, Coffee, Book, GraduationCap, ListTodo,
  CircleCheck, Hash, Link, Puzzle, Wand2, Atom, Crown, Gem, Feather, Bot,
};

export const PROJECT_ICON_NAMES = Object.keys(PROJECT_ICONS);

/** Linear-style colour swatches for tinting project icons. */
export const PROJECT_ICON_COLORS: { label: string; value: string }[] = [
  { label: 'Gray', value: '#8b8d98' },
  { label: 'Steel', value: '#5c6b80' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Lime', value: '#84cc16' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Crimson', value: '#e6455a' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Purple', value: '#a855f7' },
];

export const DEFAULT_PROJECT_ICON_COLOR = PROJECT_ICON_COLORS[3].value; // blue

const LUCIDE_PREFIX = 'lucide:';

export interface ProjectIconToken {
  kind: 'lucide' | 'emoji' | 'empty';
  name?: string;
  color?: string;
  emoji?: string;
}

export function parseProjectIcon(icon?: string | null): ProjectIconToken {
  const value = (icon ?? '').trim();
  if (!value) return { kind: 'empty' };
  if (value.startsWith(LUCIDE_PREFIX)) {
    const rest = value.slice(LUCIDE_PREFIX.length);
    const idx = rest.lastIndexOf(':');
    const name = idx >= 0 ? rest.slice(0, idx) : rest;
    const color = idx >= 0 ? rest.slice(idx + 1) : DEFAULT_PROJECT_ICON_COLOR;
    if (PROJECT_ICONS[name]) return { kind: 'lucide', name, color };
    // unknown name → treat the raw value as text so nothing disappears
    return { kind: 'emoji', emoji: value };
  }
  return { kind: 'emoji', emoji: value };
}

export function buildLucideIcon(name: string, color: string): string {
  return `${LUCIDE_PREFIX}${name}:${color}`;
}
