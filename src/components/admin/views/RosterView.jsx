'use client'

import { useState } from "react";
import { Search, UserX, UserPlus, Check, X } from "lucide-react";
import { C, font, ROLE_META } from "@/lib/admin/constants";
import { Card, SectionTitle, EmptyState } from "@/components/ui/Card";
import { RoleBadge, StatusPip, TrackBadge } from "@/components/ui/Badges";
import Avatar from "@/components/ui/Avatar";
import Btn from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function RosterView({ team, setTeam }) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(null);
  const [newRole,  setNewRole]  = useState("Member");
  const [inviting, setInviting] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invSent,  setInvSent]  = useState(false);

  const filtered  = team.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const allChk    = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const toggle    = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChk ? new Set() : new Set(filtered.map(u => u.id)));
  const clear     = () => setSelected(new Set());

  const doRevoke = () => { setTeam(p => p.filter(u => !selected.has(u.id))); clear(); setBulkMode(null); };
  const doRole   = () => { setTeam(p => p.map(u => selected.has(u.id) ? { ...u, role: newRole } : u)); clear(); setBulkMode(null); };
  const sendInvite = () => {
    if (!invEmail) return;
    setInvSent(true);
    setTimeout(() => { setInviting(false); setInvEmail(""); setInvSent(false); }, 1600);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <SectionTitle sub={`${team.length} members · Acme Corp`}>Team Roster</SectionTitle>
        <Btn onClick={() => setInviting(true)} icon={UserPlus}>Invite member</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11, marginBottom: 20 }}>
        {[
          { label: "Active members",  value: team.filter(u => u.status === "active").length,  sub: `of ${team.length}` },
          { label: "Pending invites", value: team.filter(u => u.status === "pending").length, sub: "awaiting signup"   },
          { label: "Tracks assigned", value: 14,                                               sub: "learning tracks"   },
        ].map(c => (
          <Card key={c.label}>
            <div style={{ fontFamily: font.mono, fontSize: "1.8rem", fontWeight: 700, color: C.text, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: "0.72rem", color: C.text, fontWeight: 500, marginTop: 6 }}>{c.label}</div>
            <div style={{ fontSize: "0.65rem", color: C.sub, marginTop: 3 }}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.sub, pointerEvents: "none" }} />
          <Input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.tealBd}`, borderRadius: 6, padding: "5px 10px", animation: "fadeUp 0.15s ease" }}>
            <span style={{ fontSize: "0.72rem", color: C.teal, fontWeight: 600, fontFamily: font.sans, whiteSpace: "nowrap" }}>{selected.size} selected</span>
            <div style={{ width: 1, height: 14, background: C.border, margin: "0 2px" }} />
            <Btn sm variant="ghost" onClick={() => setBulkMode("role")}>Change role</Btn>
            <Btn sm variant="danger" onClick={() => setBulkMode("revoke")}>Revoke all</Btn>
            <button onClick={clear} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", display: "flex", padding: 2 }}><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <Card noPad>
          <EmptyState
            Icon={search ? Search : UserPlus}
            title={search ? `No results for "${search}"` : "No team members yet"}
            body={search ? "Try a different name or email address." : "Invite your first team member to get started."}
            cta={!search ? "Invite first member" : undefined}
            onCta={() => setInviting(true)}
          />
        </Card>
      ) : (
        <Card noPad>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ width: 44, padding: "11px 0 11px 18px" }}>
                  <div onClick={toggleAll} style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${allChk ? C.teal : C.dim}`, background: allChk ? C.teal : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allChk && <Check size={9} color={C.bg} strokeWidth={3} />}
                  </div>
                </th>
                {["Member", "Email", "Role", "Track", "Status", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "11px 14px 11px 0", fontSize: "0.62rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const [hov, setHov] = useState(false);
                const chk = selected.has(u.id);
                return (
                  <tr key={u.id} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: chk ? "rgba(25,190,227,0.03)" : hov ? "rgba(255,255,255,0.015)" : "transparent", transition: "background 0.1s" }}
                  >
                    <td style={{ padding: "12px 0 12px 18px" }}>
                      <div onClick={() => toggle(u.id)} style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${chk ? C.teal : C.dim}`, background: chk ? C.teal : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {chk && <Check size={9} color={C.bg} strokeWidth={3} />}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px 12px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar initials={u.avatar} />
                        <span style={{ fontWeight: 600, color: C.text, fontSize: "0.8rem" }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px 12px 0", color: C.sub, fontSize: "0.76rem" }}>{u.email}</td>
                    <td style={{ padding: "12px 14px 12px 0" }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: "12px 14px 12px 0" }}><TrackBadge name={u.track} /></td>
                    <td style={{ padding: "12px 14px 12px 0" }}><StatusPip status={u.status} /></td>
                    <td style={{ padding: "12px 18px 12px 0", textAlign: "right" }}>
                      <Btn sm variant="ghost" icon={UserX} onClick={() => setTeam(p => p.filter(x => x.id !== u.id))}>Revoke</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invite modal */}
      {inviting && (
        <Modal onClose={() => { setInviting(false); setInvEmail(""); setInvSent(false); }} title="Invite a team member" subtitle="They'll receive an email with a link to join your workspace.">
          {invSent ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.greenSub, border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} color={C.green} />
              </div>
              <span style={{ fontWeight: 600, fontSize: "0.88rem", color: C.text }}>Invite sent</span>
              <span style={{ fontSize: "0.74rem", color: C.sub }}>{invEmail}</span>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 500, color: C.sub, display: "block", marginBottom: 6 }}>Email address</label>
                <Input type="email" placeholder="colleague@company.com" value={invEmail} onChange={e => setInvEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendInvite()} autoFocus />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setInviting(false)} full>Cancel</Btn>
                <Btn onClick={sendInvite} full icon={UserPlus}>Send invite</Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Bulk revoke */}
      {bulkMode === "revoke" && (
        <Modal onClose={() => setBulkMode(null)} title={`Revoke ${selected.size} member${selected.size > 1 ? "s" : ""}`} subtitle="Their access will be removed immediately. This cannot be undone.">
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {team.filter(u => selected.has(u.id)).map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.redSub, border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6 }}>
                <Avatar initials={u.avatar} size={24} />
                <span style={{ fontSize: "0.8rem", color: C.text, flex: 1 }}>{u.name}</span>
                <RoleBadge role={u.role} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setBulkMode(null)} full>Cancel</Btn>
            <Btn variant="danger" onClick={doRevoke} full icon={UserX}>Revoke access</Btn>
          </div>
        </Modal>
      )}

      {/* Bulk role change */}
      {bulkMode === "role" && (
        <Modal onClose={() => setBulkMode(null)} title={`Change role for ${selected.size} member${selected.size > 1 ? "s" : ""}`} subtitle="Select the new role to assign to all selected members.">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {Object.entries(ROLE_META).map(([role, m]) => (
              <button key={role} onClick={() => setNewRole(role)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: newRole === role ? m.bg : "transparent", border: `1px solid ${newRole === role ? m.bd : C.border}`, borderRadius: 7, cursor: "pointer", transition: "all 0.12s", textAlign: "left" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: newRole === role ? m.color : C.sub }}>{role}</span>
                {newRole === role && <Check size={14} color={m.color} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setBulkMode(null)} full>Cancel</Btn>
            <Btn onClick={doRole} full>Apply to {selected.size} member{selected.size > 1 ? "s" : ""}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
