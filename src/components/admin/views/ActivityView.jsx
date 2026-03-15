'use client'

import { useState } from "react";
import { BookOpen, Bot, Flame, TrendingUp, Star, ChevronRight, Activity } from "lucide-react";
import { C, font } from "@/lib/admin/constants";
import { Card } from "@/components/ui/Card";
import { Pbar } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";

export default function ActivityView({ team }) {
  const [expanded, setExpanded] = useState(null);

  const active    = team.filter(u => u.status === "active");
  const totalAI   = active.reduce((a, u) => a + u.aiSessWeek, 0);
  const top       = [...active].sort((a, b) => b.aiSessWeek - a.aiSessWeek)[0];
  const avgComp   = Math.round(active.reduce((a, u) => a + u.completionRate, 0) / (active.length || 1));
  const avgStreak = Math.round(active.reduce((a, u) => a + u.streak, 0) / (active.length || 1));

  if (!active.length) return (
    <EmptyState Icon={Activity} title="No activity yet" body="Once your team starts reading and using the AI coach, their activity will appear here." />
  );

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: font.serif, fontSize: "1.65rem", color: C.text, margin: 0, letterSpacing: "-0.02em", fontWeight: 600 }}>Usage & Activity</div>
        <p style={{ fontSize: "0.78rem", color: C.sub, margin: "5px 0 0" }}>Real-time engagement across your team</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 20 }}>
        {[
          { label: "AI sessions / wk", value: totalAI,                             Icon: Bot,        sub: "this week"               },
          { label: "Avg. streak",      value: `${avgStreak}`,  unit: "days",        Icon: Flame                                      },
          { label: "Avg. completion",  value: `${avgComp}`,    unit: "%", bar: true, Icon: TrendingUp                                 },
          { label: "Most active",      value: top?.name.split(" ")[0] || "—",       Icon: Star,       sub: `${top?.aiSessWeek} sessions` },
        ].map(k => (
          <Card key={k.label}>
            <div style={{ fontSize: "0.68rem", color: C.sub, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{k.label}</span>
              <k.Icon size={13} color={C.sub} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
              <div style={{ fontFamily: font.mono, fontSize: "2rem", fontWeight: 700, color: C.text, lineHeight: 1 }}>{k.value}</div>
              {k.unit && <div style={{ fontFamily: font.mono, fontSize: "0.9rem", color: C.sub, marginBottom: 3 }}>{k.unit}</div>}
            </div>
            {k.sub && <div style={{ fontFamily: font.mono, fontSize: "0.68rem", color: C.teal, marginTop: 3 }}>{k.sub}</div>}
            {k.bar && <div style={{ marginTop: 8 }}><Pbar value={avgComp} max={100} h={2} /></div>}
          </Card>
        ))}
      </div>

      {/* Live table */}
      <Card noPad>
        <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em" }}>Live activity</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "livePulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.65rem", color: C.green, fontWeight: 500 }}>Live</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 160px 110px 80px 90px 20px", padding: "7px 18px", borderBottom: `1px solid ${C.border}`, background: "rgba(10,16,28,0.3)" }}>
          {["Member", "Book progress", "AI coach", "Streak", "Last active", ""].map(h => (
            <span key={h} style={{ fontSize: "0.6rem", fontWeight: 600, color: C.dim, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>

        {team.map((u, i) => {
          const open = expanded === u.id;
          return (
            <div key={u.id}>
              <div
                onClick={() => setExpanded(open ? null : u.id)}
                onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
                style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 160px 110px 80px 90px 20px", alignItems: "center", padding: "13px 18px", cursor: "pointer", borderBottom: i < team.length - 1 ? `1px solid ${C.border}` : "none", background: open ? "rgba(25,190,227,0.025)" : "transparent", transition: "background 0.1s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={u.avatar} size={30} />
                  <div>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: "0.8rem" }}>{u.name}</div>
                    <div style={{ color: C.sub, fontSize: "0.65rem", marginTop: 2 }}>
                      {u.status === "pending"
                        ? <span style={{ color: C.amber }}>Invite pending</span>
                        : <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={10} />{u.currentBook}</span>
                      }
                    </div>
                  </div>
                </div>

                <div>
                  {u.bookDay > 0 ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: font.mono, fontSize: "0.62rem", color: C.sub }}>Day {u.bookDay}/{u.bookTotal}</span>
                        <span style={{ fontFamily: font.mono, fontSize: "0.62rem", color: C.teal }}>{Math.round((u.bookDay / u.bookTotal) * 100)}%</span>
                      </div>
                      <Pbar value={u.bookDay} max={u.bookTotal} />
                    </>
                  ) : <span style={{ fontSize: "0.65rem", color: C.dim }}>—</span>}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: font.mono, fontWeight: 700, color: u.aiSessToday > 0 ? C.teal : C.sub, fontSize: "0.88rem" }}>{u.aiSessToday}</span>
                    <span style={{ fontSize: "0.62rem", color: C.sub }}>today</span>
                  </div>
                  <div style={{ fontSize: "0.62rem", color: C.dim, marginTop: 1 }}>{u.aiSessWeek} this week</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Flame size={12} color={u.streak >= 7 ? "#f97316" : C.sub} />
                  <span style={{ fontFamily: font.mono, fontWeight: 600, color: u.streak >= 7 ? "#f97316" : C.text, fontSize: "0.8rem" }}>{u.streak}d</span>
                </div>

                <span style={{ fontSize: "0.72rem", color: C.sub }}>{u.lastActive}</span>
                <ChevronRight size={14} color={C.dim} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.18s" }} />
              </div>

              {open && (
                <div style={{ padding: "14px 18px 16px 78px", background: "rgba(10,16,28,0.35)", borderBottom: i < team.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                    {[
                      { label: "Books completed",  value: u.completedBooks,       Icon: BookOpen,   color: C.green   },
                      { label: "Completion rate",  value: `${u.completionRate}%`, Icon: TrendingUp, color: C.teal    },
                      { label: "AI sessions / wk", value: u.aiSessWeek,           Icon: Bot,        color: "#818cf8" },
                      { label: "Current streak",   value: `${u.streak}d`,         Icon: Flame,      color: "#f97316" },
                    ].map(x => (
                      <div key={x.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 13px" }}>
                        <x.Icon size={13} color={x.color} style={{ marginBottom: 7 }} />
                        <div style={{ fontFamily: font.mono, fontSize: "1rem", fontWeight: 700, color: x.color }}>{x.value}</div>
                        <div style={{ fontSize: "0.62rem", color: C.sub, marginTop: 3 }}>{x.label}</div>
                      </div>
                    ))}
                  </div>

                  {u.currentBook !== "—" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { Icon: BookOpen, label: "Reading",        value: `${u.currentBook} · Day ${u.bookDay} of ${u.bookTotal}` },
                        { Icon: Bot,      label: "AI coach today", value: `${u.aiSessToday} sessions` },
                      ].map(c => (
                        <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 11px" }}>
                          <c.Icon size={12} color={C.teal} />
                          <span style={{ fontSize: "0.7rem", color: C.sub }}>{c.label}:</span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: C.text }}>{c.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
}
