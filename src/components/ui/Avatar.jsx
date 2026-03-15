'use client'

import { C, font } from "@/lib/admin/constants";

export default function Avatar({ initials, size = 32 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "rgba(25,190,227,0.08)",
      border: "1px solid rgba(25,190,227,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.teal,
      fontSize: size * 0.31,
      fontWeight: 600,
      flexShrink: 0,
      fontFamily: font.mono,
      letterSpacing: "0.02em",
    }}>
      {initials}
    </div>
  );
}
