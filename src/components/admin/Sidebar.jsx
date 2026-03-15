'use client'

import { useState } from "react";
import { Mountain } from "lucide-react";
import { C, font, NAV } from "@/lib/admin/constants";

function NavItem({ active, onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 10px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        fontFamily: font.sans,
        fontSize: "0.8rem",
        fontWeight: active ? 600 : 400,
        background: active ? "rgba(25,190,227,0.08)" : hov ? "rgba(255,255,255,0.04)" : "transparent",
        color: active ? C.teal : hov ? C.text : C.sub,
        borderLeft: active ? `2px solid ${C.teal}` : "2px solid transparent",
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

export default function Sidebar({ activeNav, setActiveNav, onNav }) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: C.tealSub,
            border: `1px solid ${C.tealBd}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Mountain size={15} color={C.teal} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: C.text, letterSpacing: "-0.4px", fontFamily: font.sans }}>
              Summit<span style={{ color: C.teal }}>Reads</span>
            </div>
            <div style={{ fontSize: "0.56rem", color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 1 }}>
              Admin
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
        {NAV.map(({ id, label, Icon, live }) => {
          const active = activeNav === id;
          return (
            <NavItem key={id} active={active} onClick={() => { setActiveNav(id); onNav && onNav(); }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 2} color={active ? C.teal : C.sub} />
              <span style={{ flex: 1 }}>{label}</span>
              {live && (
                <div style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: C.green,
                  animation: "livePulse 2s ease-in-out infinite",
                }} />
              )}
            </NavItem>
          );
        })}
      </nav>


    </>
  );
}
