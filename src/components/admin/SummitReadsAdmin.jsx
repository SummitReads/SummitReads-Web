'use client'

import { useState, useEffect, useRef } from "react";
import { Bell, Search, ChevronDown, Settings, LogOut, Menu } from "lucide-react";
import { C, font } from "@/lib/admin/constants";
import { INITIAL_TEAM } from "@/lib/admin/mockData";
import Sidebar from "@/components/admin/Sidebar";
import Avatar from "@/components/ui/Avatar";
import OverviewView  from "@/components/admin/views/OverviewView";
import RosterView    from "@/components/admin/views/RosterView";
import ActivityView  from "@/components/admin/views/ActivityView";
import TracksView    from "@/components/admin/views/TracksView";
import BillingView   from "@/components/admin/views/BillingView";

export default function SummitSkillsAdmin({ initialView = "overview" }) {
  const [nav,         setNav]         = useState(initialView);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [team,        setTeam]        = useState(INITIAL_TEAM);
  const drawerRef = useRef(null);

  // Close mobile drawer on outside click
  useEffect(() => {
    const handler = e => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: font.sans, color: C.text, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }
        @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .mobile-only { display: none; }
        @media (max-width: 820px) {
          .desktop-sidebar { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>

      {/* Ambient glow — very subtle */}
      <div style={{ position: "fixed", top: 0, left: "35%", width: "60vw", height: "40vh", pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse,rgba(25,190,227,0.04) 0%,transparent 65%)", filter: "blur(40px)" }} />

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{ width: 208, background: "rgba(12,18,32,0.98)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10, position: "relative" }}>
        <Sidebar activeNav={nav} setActiveNav={setNav} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, backdropFilter: "blur(3px)" }} />
      )}
      <aside ref={drawerRef} style={{ width: 208, background: "rgba(12,18,32,0.99)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 60, transform: drawerOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.22s ease", boxShadow: drawerOpen ? "4px 0 32px rgba(0,0,0,0.5)" : "none" }}>
        <Sidebar activeNav={nav} setActiveNav={setNav} onNav={() => setDrawerOpen(false)} />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* Header */}
        <header style={{ height: 50, background: "rgba(12,18,32,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 12, flexShrink: 0 }}>

          {/* Hamburger — mobile only */}
          <button className="mobile-only" onClick={() => setDrawerOpen(o => !o)}
            style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", display: "none", alignItems: "center", padding: 4, flexShrink: 0 }}>
            <Menu size={18} />
          </button>

          {/* Search */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9 }}>
            <Search size={13} color={C.sub} />
            <input type="text" placeholder="Search…" style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "0.8rem", fontFamily: font.sans, width: "100%", maxWidth: 180 }} />
          </div>

          {/* Notifications */}
          <button
            style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", padding: 6, borderRadius: 6, position: "relative" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Bell size={16} />
            <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, background: C.teal, borderRadius: "50%", border: `2px solid ${C.bg}` }} />
          </button>

          {/* Profile dropdown */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setProfileOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <Avatar initials="PA" size={26} />
              <span style={{ fontSize: "0.78rem", color: C.text, fontWeight: 500 }}>Paul</span>
              <ChevronDown size={12} color={C.sub} style={{ transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 0.16s" }} />
            </button>

            {profileOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 5px)", width: 172, background: C.card, border: `1px solid ${C.borderHov}`, borderRadius: 8, padding: "5px 0", zIndex: 100, boxShadow: "0 16px 40px rgba(0,0,0,0.45)", animation: "fadeUp 0.14s ease" }}>
                <div style={{ padding: "8px 13px", borderBottom: `1px solid ${C.border}`, marginBottom: 3 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.text }}>paul@acme.co</div>
                  <div style={{ fontSize: "0.63rem", color: C.sub, marginTop: 1 }}>Admin</div>
                </div>
                {[
                  { Icon: Settings, label: "Settings"             },
                  { Icon: LogOut,   label: "Sign out", red: true   },
                ].map(({ Icon: Ico, label, red }) => (
                  <button key={label}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 13px", background: "none", border: "none", color: red ? C.red : C.sub, fontSize: "0.76rem", cursor: "pointer", fontFamily: font.sans, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = red ? C.redSub : "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Ico size={14} />{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* View content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 24px" }}>
          {nav === "overview" && <OverviewView  team={team} />}
          {nav === "roster"   && <RosterView    team={team} setTeam={setTeam} />}
          {nav === "activity" && <ActivityView  team={team} />}
          {nav === "tracks"   && <TracksView    team={team} />}
          {nav === "billing"  && <BillingView />}
        </main>
      </div>
    </div>
  );
}
