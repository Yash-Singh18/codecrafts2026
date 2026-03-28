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
} from "lucide-react";

export const DOMAIN_META = {
  science: {
    label: "Science",
    color: "#3b82f6",
    soft: "rgba(59,130,246,0.18)",
  },
  commerce: {
    label: "Commerce",
    color: "#22c55e",
    soft: "rgba(34,197,94,0.18)",
  },
  arts: {
    label: "Arts / Humanities",
    color: "#ec4899",
    soft: "rgba(236,72,153,0.18)",
  },
};

export const LEVEL_META = {
  basics: { label: "Foundation" },
  core: { label: "Core Path" },
  strong: { label: "Advanced" },
};

const iconMap = {
  Atom, BadgeDollarSign, BookText, Brain, BriefcaseBusiness, Calculator,
  CircleDollarSign, Compass, Cpu, DraftingCompass, FlaskConical, Gavel,
  Gem, Globe2, GraduationCap, HeartPulse, Landmark, Lightbulb, LineChart,
  Microscope, Network, Newspaper, Orbit, Palette, PenTool, Pill, Scale,
  Shield, Sparkles, TrendingUp, UserRoundSearch, Variable, Wallet, Waves,
};

export function resolveNodeIcon(icon) {
  if (icon && iconMap[icon]) return iconMap[icon];
  return GraduationCap;
}
