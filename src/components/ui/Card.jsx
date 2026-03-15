'use client'

import { Search, UserPlus } from "lucide-react";
import { C, font } from "@/lib/admin/constants";
import Btn from "./Button";

export function Card({ children, style = {}, noPad }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      ...(noPad ? {} : { padding: "20px 22px" }),
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{
        fontFamily: font.serif,
        fontSize: "1.65rem",
        color: C.text,
        margin: 0,
        letterSpacing: "-0.02em",
        fontWeight: 600,
      }}>
        {children}
      </h1>
      {sub && (
        <p style={{ fontSize: "0.78rem", color: C.sub, margin: "5px 0 0", lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ Icon: Ico = Search, title, body, cta, onCta }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "56px 24px",
      gap: 10,
      textAlign: "center",
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
      }}>
        <Ico size={20} color={C.dim} />
      </div>
      <div style={{ fontFamily: font.serif, fontSize: "1.1rem", color: C.text }}>{title}</div>
      <div style={{ fontSize: "0.78rem", color: C.sub, maxWidth: 300, lineHeight: 1.6 }}>{body}</div>
      {cta && (
        <div style={{ marginTop: 8 }}>
          <Btn onClick={onCta} icon={UserPlus}>{cta}</Btn>
        </div>
      )}
    </div>
  );
}
