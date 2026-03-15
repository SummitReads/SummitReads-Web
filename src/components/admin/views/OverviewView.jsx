'use client'

import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { C, font } from "@/lib/admin/constants";
import { CHART_DATA, FEED } from "@/lib/admin/mockData";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Pbar, TrendChip } from "@/components/ui/Badges";
import Avatar from "@/components/ui/Avatar";
import ChartTooltip from "@/components/admin/ChartTooltip";

export default function OverviewView({ team }) {
  const [range,   setRange]   = useState(30);
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const active     = team.filter(u => u.status === "active");
  const totalAI    = active.reduce((a, u) => a + u.aiSessWeek, 0);
  const avgComp    = Math.round(active.reduce((a, u) => a + u.completionRate, 0) / (active.length || 1));
  const totalBooks = active.reduce((a, u) => a + u.completedBooks, 0);
  const chartData  = CHART_DATA.slice(-range);

  const stagger = i => ({
    opacity:   visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 0.35s ease ${i * 55}ms, transform 0.35s ease ${i * 55}ms`,
  });

  const kpis = [
    { label: "Active members",     value: active.length, sub: `of ${team.length} total seats`, trend: 20, barValue: null },
    { label: "AI sessions / week", value: totalAI,       sub: "vs last week",                  trend: 34, barValue: totalAI, barMax: 80 },
    { label: "Avg. completion",    value: avgComp,       sub: "across all tracks",             trend: 8,  barValue: avgComp, barMax: 100, pct: true },
    { label: "Sprints completed",  value: totalBooks,    sub: "this month",                    trend: 15, barValue: null },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ ...stagger(0), display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Acme Corp</div>
          <h1 style={{ fontFamily: font.serif, fontSize: "1.7rem", color: C.text, margin: 0, letterSpacing: "-0.02em" }}>Good morning, Paul</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 20, padding: "5px 12px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "livePulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: "0.7rem", color: C.green, fontWeight: 500 }}>3 members active now</span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ ...stagger(1), display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <Card key={k.label}>
            <div style={{ fontSize: "0.68rem", color: C.sub, fontWeight: 500, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{k.label}</span>
              <TrendChip value={k.trend} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
              <div style={{ fontFamily: font.mono, fontSize: "2.2rem", fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{k.value}</div>
              {k.pct && <div style={{ fontFamily: font.mono, fontSize: "1rem", color: C.sub, marginBottom: 4 }}>%</div>}
            </div>
            <div style={{ fontSize: "0.68rem", color: C.dim, marginTop: 4 }}>{k.sub}</div>
            {k.barValue !== null && <div style={{ marginTop: 10 }}><Pbar value={k.barValue} max={k.barMax} h={2} color={C.teal} /></div>}
          </Card>
        ))}
      </div>

      {/* Chart + leaderboard */}
      <div style={{ ...stagger(2), display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, marginBottom: 12 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Team engagement</div>
              <div style={{ fontSize: "0.7rem", color: C.sub, marginTop: 2 }}>AI sessions and active users over time</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[7, 14, 30].map(r => (
                <button key={r} onClick={() => setRange(r)}
                  style={{ background: range === r ? C.tealSub : "transparent", border: `1px solid ${range === r ? C.tealBd : C.border}`, color: range === r ? C.teal : C.sub, padding: "3px 9px", borderRadius: 4, fontSize: "0.66rem", fontWeight: 600, cursor: "pointer", fontFamily: font.sans, transition: "all 0.12s" }}
                >{r}d</button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={186}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.teal}   stopOpacity={0.18} />
                  <stop offset="100%" stopColor={C.teal}   stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.035)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: C.sub, fontFamily: font.sans }} tickLine={false} axisLine={false} interval={range === 7 ? 0 : range === 14 ? 1 : 4} />
              <YAxis tick={{ fontSize: 9, fill: C.sub, fontFamily: font.sans }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="sessions"    stroke={C.teal}   strokeWidth={1.5} fill="url(#gT)" dot={false} />
              <Area type="monotone" dataKey="activeUsers" stroke="#818cf8" strokeWidth={1.5} fill="url(#gP)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
            {[{ color: C.teal, label: "AI Sessions" }, { color: "#818cf8", label: "Active Users" }].map(x => (
              <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 16, height: 2, background: x.color, borderRadius: 2, opacity: 0.8 }} />
                <span style={{ fontSize: "0.66rem", color: C.sub }}>{x.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card style={{ padding: "20px" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, marginBottom: 4 }}>Top learners</div>
          <div style={{ fontSize: "0.7rem", color: C.sub, marginBottom: 18 }}>By AI coach sessions this week</div>

          {[...team].filter(u => u.status === "active").sort((a, b) => b.aiSessWeek - a.aiSessWeek).map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 18, textAlign: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: font.mono, fontSize: "0.72rem", fontWeight: 600, color: i === 0 ? C.teal : i === 1 ? "#818cf8" : C.sub }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <Avatar initials={u.avatar} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: C.text, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name.split(" ")[0]}</div>
                <div style={{ fontSize: "0.65rem", color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{u.currentBook}</div>
              </div>
              <div style={{ fontFamily: font.mono, fontWeight: 700, color: i === 0 ? C.teal : C.text, fontSize: "0.82rem", flexShrink: 0 }}>{u.aiSessWeek}</div>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 2 }}>
            <div style={{ fontSize: "0.64rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Completion rates</div>
            {team.filter(u => u.status === "active").map(u => (
              <div key={u.id} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.66rem", color: C.sub }}>{u.name.split(" ")[0]}</span>
                  <span style={{ fontFamily: font.mono, fontSize: "0.66rem", color: C.text, fontWeight: 500 }}>{u.completionRate}%</span>
                </div>
                <Pbar value={u.completionRate} max={100} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ ...stagger(3), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Sprints in progress */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Sprints in progress</div>
              <div style={{ fontSize: "0.7rem", color: C.sub, marginTop: 2 }}>Across your team right now</div>
            </div>
            <div style={{ fontFamily: font.mono, fontSize: "0.72rem", color: C.teal, background: C.tealSub, border: `1px solid ${C.tealBd}`, padding: "2px 8px", borderRadius: 4 }}>
              {team.filter(u => u.bookDay > 0 && u.status === "active").length} active
            </div>
          </div>

          {team.filter(u => u.status === "active" && u.bookDay > 0).map((u, i, arr) => (
            <div key={u.id} style={{ marginBottom: i < arr.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar initials={u.avatar} size={20} />
                  <span style={{ fontSize: "0.76rem", color: C.text, fontWeight: 500 }}>{u.currentBook}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: "0.65rem", color: C.sub }}>Stage {u.bookDay}/{u.bookTotal}</span>
                  <span style={{ fontFamily: font.mono, fontSize: "0.68rem", color: C.teal }}>{Math.round((u.bookDay / u.bookTotal) * 100)}%</span>
                </div>
              </div>
              <Pbar value={u.bookDay} max={u.bookTotal} h={3} />
            </div>
          ))}

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.64rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Daily completions — last 14 days</div>
            <ResponsiveContainer width="100%" height={52}>
              <BarChart data={CHART_DATA.slice(-14)} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: C.sub, fontFamily: font.sans }} tickLine={false} axisLine={false} interval={2} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completions" fill={C.teal} radius={[2, 2, 0, 0]} maxBarSize={12} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Activity feed</div>
              <div style={{ fontSize: "0.7rem", color: C.sub, marginTop: 2 }}>Recent team actions</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "livePulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.68rem", color: C.green, fontWeight: 500 }}>Live</span>
            </div>
          </div>

          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1, background: C.border }} />
            {FEED.map((item, i) => {
              const dotColor = { completion: C.green, ai: C.teal, start: "#818cf8", progress: C.amber, login: C.sub }[item.type];
              return (
                <div key={item.id} style={{ display: "flex", gap: 10, paddingBottom: i < FEED.length - 1 ? 14 : 0, position: "relative" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, border: `2px solid ${C.card}`, position: "absolute", left: -16, top: 5, flexShrink: 0, zIndex: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.76rem", color: C.text, lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 600 }}>{item.name.split(" ")[0]}</span>
                      <span style={{ color: C.sub }}> {item.verb} </span>
                      <span style={{ color: C.text }}>{item.detail}</span>
                    </div>
                    <div style={{ fontSize: "0.63rem", color: C.dim, marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
