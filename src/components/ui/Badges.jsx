'use client'

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { C, font, ROLE_META } from "@/lib/admin/constants";
import { TRACKS } from "@/lib/admin/mockData";

export function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.Viewer;
  return (
    <span style={{
      background: m.bg,
      color: m.color,
      border: `1px solid ${m.bd}`,
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: "0.68rem",
      fontWeight: 500,
      fontFamily: font.sans,
      letterSpacing: "0.01em",
    }}>
      {role}
    </span>
  );
}

export function StatusPip({ status }) {
  const active = status === "active";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: active ? C.green : C.amber,
        boxShadow: active ? `0 0 0 2px ${C.greenSub}` : undefined,
      }} />
      <span style={{ color: C.sub, fontSize: "0.72rem", textTransform: "capitalize" }}>{status}</span>
    </div>
  );
}

export function TrendChip({ value }) {
  const up  = value >= 0;
  const Ico = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.68rem", fontWeight: 500, color: up ? C.green : C.red, fontFamily: font.sans }}>
      <Ico size={12} />{Math.abs(value)}%
    </span>
  );
}

export function Pbar({ value, max, h = 3, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const col = color || (pct >= 70 ? C.teal : pct >= 35 ? "#818cf8" : C.dim);
  return (
    <div style={{ height: h, background: "rgba(255,255,255,0.05)", borderRadius: h, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: h, transition: "width 0.5s ease" }} />
    </div>
  );
}

export function TrackBadge({ name }) {
  const t = TRACKS.find(x => x.name === name);
  if (!t || name === "—") return <span style={{ color: C.dim, fontSize: "0.72rem" }}>—</span>;
  return (
    <span style={{ color: t.color, fontSize: "0.72rem", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, flexShrink: 0, display: "inline-block" }} />
      {t.name}
    </span>
  );
}
