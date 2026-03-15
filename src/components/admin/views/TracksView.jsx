'use client'

import { useState } from "react";
import { Layers, Plus, Check } from "lucide-react";
import { C, font } from "@/lib/admin/constants";
import { TRACKS } from "@/lib/admin/mockData";
import { Card } from "@/components/ui/Card";
import { Pbar, TrackBadge } from "@/components/ui/Badges";
import Avatar from "@/components/ui/Avatar";
import Btn from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function TracksView({ team }) {
  const [creating, setCreating] = useState(false);
  const [name,     setName]     = useState("");
  const [done,     setDone]     = useState(false);

  const submit = () => {
    if (!name) return;
    setDone(true);
    setTimeout(() => { setCreating(false); setName(""); setDone(false); }, 1600);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: font.serif, fontSize: "1.65rem", color: C.text, letterSpacing: "-0.02em", fontWeight: 600 }}>Learning Tracks</div>
          <p style={{ fontSize: "0.78rem", color: C.sub, margin: "5px 0 0" }}>Curated book sequences assigned to roles or teams.</p>
        </div>
        <Btn onClick={() => setCreating(true)} icon={Plus}>New track</Btn>
      </div>

      {/* Explainer */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "13px 16px", marginBottom: 22, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Layers size={16} color={C.teal} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: "0.76rem", color: C.sub, lineHeight: 1.65 }}>
          A learning track is a curated sequence of books tied to a role or goal — like a{" "}
          <span style={{ color: C.text, fontWeight: 500 }}>New Manager Track</span> with{" "}
          <span style={{ color: C.text }}>Radical Candor → The Making of a Manager → Good to Great</span>.
          Assign members to a track and they work through books in order, with AI coaching at every step.
        </div>
      </div>

      {/* Track cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 22 }}>
        {TRACKS.map(t => (
          <div key={t.id}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + "40"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: t.color, opacity: 0.05, filter: "blur(20px)", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: `${t.color}18`, border: `1px solid ${t.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={14} color={t.color} />
              </div>
              <span style={{ fontFamily: font.mono, fontSize: "0.65rem", color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}25`, padding: "2px 7px", borderRadius: 4 }}>
                {t.members} member{t.members !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ fontWeight: 700, color: C.text, fontSize: "0.88rem", marginBottom: 4 }}>{t.name} Track</div>
            <div style={{ fontSize: "0.68rem", color: C.sub, marginBottom: 14 }}>{t.books.length} books in sequence</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {t.books.map((b, bi) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: font.mono, width: 18, fontSize: "0.6rem", color: bi === 0 ? t.color : C.dim, fontWeight: 600, flexShrink: 0 }}>{String(bi + 1).padStart(2, "0")}</div>
                  <span style={{ fontSize: "0.72rem", color: bi === 0 ? C.text : C.sub }}>{b}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: "0.62rem", color: C.sub }}>Avg. team progress</span>
                <span style={{ fontFamily: font.mono, fontSize: "0.62rem", color: t.color, fontWeight: 600 }}>{t.avgProgress}%</span>
              </div>
              <Pbar value={t.avgProgress} max={100} color={t.color} />
            </div>
          </div>
        ))}

        {/* Add card */}
        <button onClick={() => setCreating(true)}
          style={{ background: "transparent", border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, transition: "all 0.18s", minHeight: 180 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.tealBd; e.currentTarget.style.background = C.tealSub; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 7, background: C.tealSub, border: `1px solid ${C.tealBd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={14} color={C.teal} />
          </div>
          <span style={{ fontSize: "0.76rem", color: C.sub, fontWeight: 500 }}>Create a track</span>
        </button>
      </div>

      {/* Assignment table */}
      <Card noPad>
        <div style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>Track assignments</div>
          <div style={{ fontSize: "0.68rem", color: C.sub, marginTop: 2 }}>Which members are on which track</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(10,16,28,0.3)" }}>
              {["Member", "Track", "Current book", "Progress", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontSize: "0.6rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.filter(u => u.status === "active").map((u, i, arr) => {
              const t = TRACKS.find(x => x.name === u.track);
              return (
                <tr key={u.id} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar initials={u.avatar} />
                      <span style={{ fontWeight: 600, color: C.text }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><TrackBadge name={u.track} /></td>
                  <td style={{ padding: "12px 16px", color: C.sub, fontSize: "0.74rem" }}>{u.currentBook}</td>
                  <td style={{ padding: "12px 16px", minWidth: 130 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ flex: 1 }}><Pbar value={u.completionRate} max={100} color={t?.color} /></div>
                      <span style={{ fontFamily: font.mono, fontSize: "0.65rem", color: t?.color || C.sub, flexShrink: 0 }}>{u.completionRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <Btn sm variant="ghost">Reassign</Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Create modal */}
      {creating && (
        <Modal onClose={() => { setCreating(false); setName(""); }} title="Create a learning track" subtitle="Name your track. You'll add books and assign members after.">
          {done ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.greenSub, border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} color={C.green} />
              </div>
              <span style={{ fontWeight: 600, fontSize: "0.88rem", color: C.text }}>Track created</span>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 500, color: C.sub, display: "block", marginBottom: 6 }}>Track name</label>
                <Input placeholder='e.g. "New Manager Track"' value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", color: C.sub, marginBottom: 5 }}>After creating, you'll be able to:</div>
                {["Add books in the order you want them read", "Assign team members to the track", "Track per-member completion progress"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <Check size={11} color={C.teal} />
                    <span style={{ fontSize: "0.7rem", color: C.sub }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setCreating(false)} full>Cancel</Btn>
                <Btn onClick={submit} full>Create track</Btn>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
