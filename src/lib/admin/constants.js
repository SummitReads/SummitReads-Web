import {
  LayoutDashboard, Users, Activity, Layers, CreditCard,
} from "lucide-react";

// ─── Color tokens ──────────────────────────────────────────────────────────
export const C = {
  bg:        "#0F172A",
  surface:   "#161f30",
  card:      "#1a2540",
  cardHover: "#1e2d4a",
  border:    "rgba(255,255,255,0.06)",
  borderHov: "rgba(255,255,255,0.1)",
  teal:      "#19bee3",
  tealSub:   "rgba(25,190,227,0.1)",
  tealBd:    "rgba(25,190,227,0.2)",
  text:      "#e8edf5",
  sub:       "#64748b",
  dim:       "#3d5068",
  green:     "#22c55e",
  greenSub:  "rgba(34,197,94,0.1)",
  amber:     "#f59e0b",
  amberSub:  "rgba(245,158,11,0.1)",
  red:       "#ef4444",
  redSub:    "rgba(239,68,68,0.1)",
};

// ─── Font stack ────────────────────────────────────────────────────────────
export const font = {
  sans:  "'DM Sans', system-ui, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  mono:  "'DM Mono', 'Fira Mono', monospace",
};

// ─── Navigation items ──────────────────────────────────────────────────────
export const NAV = [
  { id: "overview",  label: "Overview",        Icon: LayoutDashboard             },
  { id: "roster",    label: "Team Roster",      Icon: Users                       },
  { id: "activity",  label: "Usage & Activity", Icon: Activity,      live: true   },
  { id: "tracks",    label: "Learning Tracks",  Icon: Layers                      },
  { id: "billing",   label: "Billing",          Icon: CreditCard                  },
];

// ─── Role colors ───────────────────────────────────────────────────────────
export const ROLE_META = {
  Admin:   { color: "#19bee3", bg: "rgba(25,190,227,0.08)",   bd: "rgba(25,190,227,0.2)"   },
  Manager: { color: "#818cf8", bg: "rgba(129,140,248,0.08)",  bd: "rgba(129,140,248,0.2)"  },
  Member:  { color: "#64748b", bg: "rgba(100,116,139,0.08)",  bd: "rgba(100,116,139,0.18)" },
  Viewer:  { color: "#475569", bg: "rgba(71,85,105,0.06)",    bd: "rgba(71,85,105,0.15)"   },
};
