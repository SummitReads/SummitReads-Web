'use client'

import { C, font } from "@/lib/admin/constants";

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a2540",
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      padding: "9px 13px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontSize: "0.65rem", color: C.sub, marginBottom: 5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: C.sub, textTransform: "capitalize" }}>{p.dataKey}:</span>
          <span style={{ fontSize: "0.74rem", fontWeight: 600, color: C.text, fontFamily: font.mono }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}
