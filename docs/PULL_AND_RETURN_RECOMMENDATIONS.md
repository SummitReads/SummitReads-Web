# SummitSkills — Pull & Return Recommendations

**Purpose:** Decision brief for feedback (product, design, investors, advisors).  
**Date:** 2026-07-17  
**Context:** Email / trial sequences largely exist. Goal is **in-product pull** — reasons people *want* to come back, not only reminders to log in.

---

## One-sentence thesis

> Pull for SummitSkills should come from **an unfinished personal practice thread** (their situation + write-ups + Day N of 7 toward a real Day 7 output) — not from points, a content feed, or generic “engagement” chrome.

---

## Problem we’re solving

| We have | We underuse |
|---------|-------------|
| 7-day skill sprints | Mid-sprint story continuity |
| Write it down / Do it now | Showing *their* words on return |
| Summit Coach | Coach as ongoing relationship |
| Email sequences | Hook emails to *thread*, not only “open the app” |
| Dashboard (progress) | Dashboard as *control panel*, not *hook* |

People leave knowing *what* the product is. They don’t always leave with a **burning unfinished sentence** about *their* work.

---

## What similar products do (steal / ignore)

| Pattern | Who uses it | Steal for SS? | Why |
|---------|-------------|---------------|-----|
| Open loop / mid-path | Duolingo, good coaches | **Yes** | Day N of 7 is built for this |
| Streaks | Duolingo, habit apps | **Yes, carefully** | Streak on *completed practice days*, adult tone |
| Manager / assignment | LinkedIn Learning, LMS | **Yes (teams)** | B2B natural gravity |
| Coach continuity | BetterUp-class | **Yes** | Coach + prior write-ups |
| Recommendations | LXPs | Later | Stronger at 50+ sprints |
| Points / leaderboards | Consumer apps | **Mostly no** | Off-brand for professional practice |
| Content volume | Catalog LMS | **No as primary pull** | Quality + unfinished work wins |

---

## Recommended build order (impact × effort)

### Priority 1 — **Continue hero** (highest impact, lowest risk)

**What:** Dashboard (and optional library top) leads with **one** primary sprint, not three equal cards.

**Show:**
1. Sprint name  
2. **Continue · Day N of 7** (accurate next day)  
3. One line of **their last write-it-down** (or Day 0 situation if no write yet)  
4. Single CTA: **Continue Day N →**

**Copy example:**
> **Make Good Work Automatic**  
> Continue · Day 4 of 7  
> Last time you wrote: *“The 2pm slack thread is where I go reactive…”*  
> [Continue Day 4 →]

**Why it creates pull:** Unfinished personal work + clear next step. Same psychology as mid-lesson / mid-coaching arc.

**Effort:** Small–medium (dashboard UI + reuse progress helpers already shipped).  
**Success signal:** Higher % of dashboard visits → day page within same session.

---

### Priority 2 — **Midpoint & Summit tension** (copy + light UI)

**What:** Language that names the arc, not only % complete.

| When | Message |
|------|---------|
| Days 1–2 | “You’re laying the foundation.” |
| Days 3–4 | “Halfway. This is where it sticks or stays theory.” |
| Day 6 | “Tomorrow is Summit — you produce the real output.” |
| Day 7 | Finish ceremony → “Here’s what you built” + next sprint |

**Why:** Adults return when a **finish line is close and meaningful**. Day 7 is the product climax; make it felt earlier.

**Effort:** Low (copy on continue cards + day chrome).  
**Success signal:** Day 5–7 completion rates; time-to-Day-7.

---

### Priority 3 — **Practice streak** (adult-friendly)

**What:** Count consecutive calendar days where they **completed a practice day** (not mere login).

**UI:** Small chip on dashboard: `🔥 3-day practice streak`  
**Break tone:** Soft — “Streak paused · Day 4 is still waiting” (no shame spiral).

**Why:** Proven habit loop in learning apps; keep dignity for managers.

**Effort:** Medium (store last-practice date / compute from `completed_at`).  
**Success signal:** Return within 24–48h after a completed day.

---

### Priority 4 — **Wire emails to the thread** (you already have email)

**What:** Existing sequences emphasize *content of their sprint*, not only login.

**Subject / body hooks:**
- “Day 4 is open — yesterday you wrote about [snippet]…”  
- “2 days to your Summit on [sprint name]”  
- Manager: “3 people finished Day 3 of [sprint] this week”

**Why:** Email = knock; thread = reason to enter. You already paid for the knock.

**Effort:** Low–medium (template copy + optional progress fields).  
**Success signal:** Email → day page conversion.

---

### Priority 5 — **Day 7 finish moment → next loop**

**What:** After Summit deliverable:
1. Clear celebration (you have pieces of this)  
2. One-screen **“what you built”** (skill + their own line)  
3. **One** recommended next sprint (not a wall of cards)

**Why:** Closing one loop without opening the next is where libraries die.

**Effort:** Medium.  
**Success signal:** Second sprint start within 7–14 days of first completion.

---

### Priority 6 — **Team / manager gravity** (if B2B is primary)

**What:**  
- Assigned sprint surfaces as default continue  
- Manager sees who is mid-sprint / stalled (not public shaming)  
- Optional shared sprint (“team is on Day 3 of X”)

**Why:** Enterprise pull often beats solo motivation; competitors win with org accountability.

**Effort:** Medium–large.  
**Success signal:** Team pilot completion rates vs self-serve.

---

## Explicitly *not* recommended first

| Skip for now | Reason |
|--------------|--------|
| Points, coins, generic badges | Cheap dopamine; weak for professional brand |
| Public learner leaderboards | Shame risk; wrong culture for reflection work |
| Infinite content feed as hook | Becomes LinkedIn Learning clone; dilutes practice thesis |
| Heavy AI path engine | Premature until catalog + activation are solid |

---

## Proposed “minimum lovable pull” (MLP)

If we only ship **three** things for the next feedback cycle:

| # | Deliverable | Owner sketch |
|---|-------------|--------------|
| 1 | **Continue hero** with last write-up snippet + Day N | Product / eng |
| 2 | **Arc language** (halfway / summit tomorrow) | Product / copy |
| 3 | **Practice streak** chip (completed days) | Eng |

Emails keep running; rewrite 1–2 templates to reference Day N + sprint name (+ snippet when safe).

---

## How we’ll know it worked

| Metric | Baseline ask | Direction |
|--------|--------------|-----------|
| Dashboard → day click-through | Measure now | ↑ |
| Day completion within 48h of prior day | Measure now | ↑ |
| % users reaching Day 7 of first sprint | Measure now | ↑ |
| Second sprint started within 14 days of first finish | Measure now | ↑ |
| Email click → day page | Measure now | ↑ |

---

## Feedback questions for reviewers

1. Does **Continue hero + their own words** feel more motivating than stats cards alone?  
2. Is a **practice streak** on-brand for managers, or too consumer?  
3. Should **team assignment** outrank solo streak for v1 of pull?  
4. What would make *you* open the app tomorrow morning without an email?  
5. Any pull mechanic here that feels gimmicky or off-mission?

---

## Bottom line for stakeholders

SummitSkills does not need to out-Duolingo Duolingo or out-library LinkedIn Learning.

It needs to win on:

**Unfinished practice that is personally theirs, aimed at a real Day 7 output, optionally visible to a manager.**

That is the pull.

---

## Appendix — Product principles

1. Excitement = unfinished *personal* work, not louder UI.  
2. One primary return action every session.  
3. Show their words back to them.  
4. Day 7 is the emotional peak of the week.  
5. For teams: accountability without humiliation.  
6. Streaks track practice, not logins.  
7. Email knocks; the thread is why they walk in.
