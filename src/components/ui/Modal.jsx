'use client'

import { X } from "lucide-react";
import { C, font } from "@/lib/admin/constants";

export default function Modal({ children, onClose, title, subtitle }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,10,20,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div style={{
        background: C.card,
        border: `1px solid ${C.borderHov}`,
        borderRadius: 10,
        padding: 24,
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            {title    && <div style={{ fontFamily: font.serif, fontSize: "1.05rem", color: C.text, marginBottom: 3, letterSpacing: "-0.01em" }}>{title}</div>}
            {subtitle && <div style={{ fontSize: "0.74rem", color: C.sub, lineHeight: 1.5 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", display: "flex", padding: 2, marginLeft: 12 }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
