# Pull & return — what brings people back

**Purpose:** Inventory of mechanisms that pull learners back into SummitSkills, and honest gaps.  
**Related:** `PRACTICE_FRAMEWORK.md`, `PRACTICE_LOOP.md`

---

## What “pull” means here

Not vanity notifications. **A reason to open the product again** because something unfinished, personal, or sequential is waiting.

Feedback you received: *nothing strong enough to make someone want to come back.*  
This doc maps **what already exists** vs **what still feels missing**.

---

## What you already have (built)

### 1. In-product “Continue” / **Today’s practice** pull (strongest today)

| Surface | Behavior |
|---------|----------|
| **Library “Today’s practice” hero** | Open-loop card: Day N job, personal situation / last try / what happened?, 7-day dots, hard CTA |
| **Dashboard Continue hero** | Most recently touched open sprint → Day N of 7, arc line, CTA |
| **`sprintArcLine` / `sprintDayJobLine` / `sprintOpenLoopLine`** | Progress + role job + personal thread |
| **Practice streak** | On library hero when active; paused state |

Files: `dashboard/page.jsx`, `library/LibraryClient.jsx`, `library/page.jsx`, `lib/sprintDisplay.js`

### 2. Practice / return loop (continuity inside a sprint)

| Piece | Behavior |
|-------|----------|
| **Situation this week** | Day 1 thread; echoed on later days if set |
| **What I did** | Optional attempt note |
| **What happened?** | Optional outcome next day *only if* they logged a try |
| **Coach practice trail** | Coach sees tries + outcomes when present |

This is the **skill-learning pull**: “my week with Maya is unfinished.”  
Flag: `RETURN_LOOP_V1` on summit day page.

### 3. Day-complete celebration → next day

| Piece | Behavior |
|-------|----------|
| **CompletionCelebration** | After mark complete → preview next day (1–6) or next skill (7) |
| **Suggested next sprint** | Day 7 → another `approved` sprint |

### 4. Email: stage unlock (`/api/send-stage-email`)

On day complete (if next day exists), fires email:

- Subject: “Stage N is ready…”
- Deep link to next day  
- Optional reflection snippet  

**This is a real return pull** — if Resend + env are configured and the call succeeds.

### 5. Settings: email reminders (partial)

| Piece | Status |
|-------|--------|
| UI toggle + preferred time | **Exists** in settings |
| Storage | **localStorage only** (`ss_reminder_enabled`) |
| Actual daily email cron | **Not wired to send practice reminders** |

So users can *think* reminders are on, but **no backend daily “come practice” email** is guaranteed from that toggle.

### 6. Trial lifecycle emails

`trial-emails.js` + cron: day 1/3/7/11/14 for **conversion**, not daily practice pull.

### 7. StreakCounter component

Older/alternate streak UI + continue URL; dashboard also computes streak via `computePracticeStreak`.

---

## Why feedback still said “no pull”

You have **pieces of a return system**, but several are easy to miss or incomplete:

| Gap | Why it weakens return |
|-----|------------------------|
| **Reminders UI without delivery** | Expectation without the email arriving |
| **Stage email easy to miss** | Depends on complete flow + Resend; not a daily cadence |
| **Pull is strongest only if they started** | Cold users after signup get little “unfinished thread” |
| **Loop fields optional** | If they never log “What I did,” next day feels like a new lesson, not *their* story |
| **Streak not always front-and-center** | Dashboard has it; not every entry path sells it |
| **No “open loop” outside the app** | No SMS/push; web-only means email must carry weight |
| **Arc lines only when they open dashboard/library** | No pull if they never come back to those pages |

So the feedback is fair: **in-session pull is decent; between-session pull is thin.**

---

## What actually creates desire to return (priority)

| Rank | Mechanism | Status | Notes |
|------|-----------|--------|-------|
| 1 | **Unfinished personal situation + next day ready** | Partial | Loop + Continue hero — strengthen visibility |
| 2 | **Email: “Day N waiting + your last line”** | Partial | Stage email exists; make reliable + richer |
| 3 | **True daily practice reminder** | **Missing** | Wire settings toggle → cron → email |
| 4 | **Practice streak at risk** | Partial | Show on dashboard; optional email “streak pauses tonight” |
| 5 | **What happened? unfinished** | New | Soft prompt if they logged did but no outcome |
| 6 | **Day 7 → next skill** | Exists | Needs 2+ approved sprints (now AH + CA) |

---

## Shipped: UI-first pull stack (primary)

| Item | Where |
|------|--------|
| **Today's practice hero** | Library + Dashboard — open loop, day job, CTA, 7 dots |
| **Browse secondary** | Library: when in progress → “Explore when ready”; Featured hidden; “More sprints” |
| **Tomorrow plant** | Completion celebration: tomorrow job + situation/did + dual CTA |
| **Login default** | `/dashboard` (practice-first home) |

Email remains **secondary** (stage email exists; daily reminder cron still optional later).

---

## Honest product verdict

| Question | Answer |
|----------|--------|
| Did we build *any* pull? | **Yes** — practice hero, open loop, tomorrow plant, streak, stage email |
| Primary strategy | **UI open loop first**; email only reinforces |
| Best unique pull vs generic apps? | **Their unfinished work week**, not streak alone |

**Streaks are commodity. Unfinished real work is SummitSkills.**

---

## Link to content factory

Pull only matters if **content is worth returning to**.  
Batch ship pipeline (`summit-admin/batch_ship_pipeline.py`) grows the library so Day 7 “next skill” and multi-sprint continue paths stay full.

---

*Update when reminder cron ships or stage-email copy changes.*
