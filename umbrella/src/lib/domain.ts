import {
  Atom,
  BadgeDollarSign,
  BookText,
  Brain,
  BriefcaseBusiness,
  Calculator,
  CircleDollarSign,
  Compass,
  Cpu,
  DraftingCompass,
  FlaskConical,
  Gavel,
  Gem,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Lightbulb,
  LineChart,
  Microscope,
  Network,
  Newspaper,
  Orbit,
  Palette,
  PenTool,
  Pill,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
  UserRoundSearch,
  Variable,
  Wallet,
  Waves,
  type LucideIcon
} from "lucide-react";
import type { Domain, RoadmapLevel } from "../types/knowledge";

export const DOMAIN_META: Record<
  Domain,
  { label: string; color: string; soft: string; accent: string }
> = {
  science: {
    label: "Science",
    color: "#3b82f6",
    soft: "rgba(59,130,246,0.18)",
    accent: "shadow-[0_0_36px_rgba(59,130,246,0.24)]"
  },
  commerce: {
    label: "Commerce",
    color: "#22c55e",
    soft: "rgba(34,197,94,0.18)",
    accent: "shadow-[0_0_36px_rgba(34,197,94,0.22)]"
  },
  arts: {
    label: "Arts / Humanities",
    color: "#ec4899",
    soft: "rgba(236,72,153,0.18)",
    accent: "shadow-[0_0_36px_rgba(236,72,153,0.22)]"
  }
};

export const LEVEL_META: Record<
  RoadmapLevel,
  { label: string; ring: string; glow: string; badge: string }
> = {
  basics: {
    label: "Foundation",
    ring: "rgba(255,255,255,0.08)",
    glow: "0 0 18px rgba(255,255,255,0.08)",
    badge: "text-slate-300"
  },
  core: {
    label: "Core Path",
    ring: "rgba(255,255,255,0.14)",
    glow: "0 0 26px rgba(255,255,255,0.14)",
    badge: "text-slate-200"
  },
  strong: {
    label: "Advanced",
    ring: "rgba(255,255,255,0.22)",
    glow: "0 0 34px rgba(255,255,255,0.18)",
    badge: "text-white"
  }
};

const iconMap: Record<string, LucideIcon> = {
  Atom,
  BadgeDollarSign,
  BookText,
  Brain,
  BriefcaseBusiness,
  Calculator,
  CircleDollarSign,
  Compass,
  Cpu,
  DraftingCompass,
  FlaskConical,
  Gavel,
  Gem,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Lightbulb,
  LineChart,
  Microscope,
  Network,
  Newspaper,
  Orbit,
  Palette,
  PenTool,
  Pill,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
  UserRoundSearch,
  Variable,
  Wallet,
  Waves
};

export function resolveNodeIcon(icon?: string): LucideIcon {
  if (icon && iconMap[icon]) {
    return iconMap[icon];
  }
  return GraduationCap;
}
