'use client'

import { useState } from "react";
import { C, font } from "@/lib/admin/constants";

export default function Btn({ children, onClick, variant = "primary", sm, full, icon: Icon }) {
  const [hov, setHov] = useState(false);

  const pad    = sm ? "5px 12px" : "8px 16px";
  const fz     = sm ? "0.74rem"  : "0.8rem";
  let bg, color, border, shadow = "none";

  if (variant === "primary") {
    bg     = hov ? "#15a8cc" : C.teal;
    color  = "#0a1525";
    border = "none";
    shadow = hov ? "0 0 20px rgba(25,190,227,0.35)" : "none";
  } else if (variant === "ghost") {
    bg     = hov ? "rgba(255,255,255,0.05)" : "transparent";
    color  = hov ? C.text : C.sub;
    border = `1px solid ${hov ? C.borderHov : C.border}`;
  } else if (variant === "danger") {
    bg     = hov ? C.redSub : "transparent";
    color  = C.red;
    border = `1px solid ${hov ? "rgba(239,68,68,0.3)" : C.border}`;
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: pad,
        borderRadius: 6,
        border,
        background: bg,
        color,
        fontSize: fz,
        fontWeight: 600,
        fontFamily: font.sans,
        cursor: "pointer",
        boxShadow: shadow,
        transition: "all 0.15s",
        width: full ? "100%" : "auto",
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={sm ? 13 : 14} strokeWidth={2} />}
      {children}
    </button>
  );
}
