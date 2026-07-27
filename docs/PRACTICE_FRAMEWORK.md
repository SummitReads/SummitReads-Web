# SummitSkills practice framework

**Purpose:** Internal reference for product, content, coaching, and marketing.  
**Last updated:** 2026-07-27  

Related: `docs/PRACTICE_LOOP.md` (implementation), summit-admin `SHIP_GATE.md` / `HANDOFF_CODEX.md` (quality bar).

---

## One-line summary

> We use the same cycle coaching and action learning use — **try it at work, report what happened, adjust** — structured into a **seven-day skill sprint**, not a course completion.

**Shorter (marketing):**  
> Not another module to finish. A week of real practice: try it, see what happened, adjust.

---

## What we mean by “the framework”

Two layers that work together:

| Layer | What it is | Product expression |
|-------|------------|--------------------|
| **A. Practice loop** | Situation → try → what happened → adjust → try again | Optional fields + coach context (non-blocking) |
| **B. 7-day skill arc** | One workplace skill installed over seven roles | Day content (behavioral arc) |

**A** is the behavior-change engine.  
**B** is the curriculum that sequences the week so the loop has something real to work on.

---

## Layer A — Practice loop (return loop)

### The cycle

```text
SITUATION (this week’s real thread)
    ↓
TODAY’S MOVE (mission)
    ↓
WHAT I DID (attempt)
    ↓
[real world overnight]
    ↓
WHAT HAPPENED (observed outcome)
    ↓
ADJUST / NEXT TRY
```

**Closed loop** means the next day can work from **reality**, not only a new concept.

### Product rules (non-negotiable UX)

| Rule | Why |
|------|-----|
| **Never a gate** | Completing a day does not require situation / did / happened |
| **No blank chrome** | Do not show “What happened?” if there was no prior “What I did” |
| **Optional fields** | Invite honesty; forced fields produce fake HR language |
| **Same for every sprint** | App-level, not custom per book |

### Field map

| Learner language | When it shows | Storage (current) |
|------------------|---------------|-------------------|
| Situation this week | Day 1; echoed later only if set | Day 1 `progress_notes` |
| What I did | Optional every day | `action_commitment` |
| What happened? | Next day **only if** yesterday had What I did; optional same-day if What I did is filled | `evening_reflection` |
| What will you change? | **Primarily Day 6 content** (ADJUST role), not a global required field | Day 6 milepost / mission |

### If they skip previous fields

| Gap | Product behavior |
|-----|------------------|
| No situation | No fake history; optional re-anchor when useful |
| No “What I did” | No empty “What happened?” box next day |
| Did try, no outcome | Prompt optional outcome next day; “missed / not yet” is valid |
| Skipped a whole day | Today stands alone; loop restarts on first real attempt |

Empty fields mean **no sample yet**, not a broken product.

---

## Layer B — Seven-day behavioral arc

| Day | Role | Job | Loop emphasis |
|-----|------|-----|----------------|
| 1 | **ANCHOR** | Locate where the skill fits in the real workday | Situation |
| 2 | **ENVIRONMENT** | Put the cue/signal at the decision moment | Try + setup |
| 3 | **SMALL START** | Floor version that still runs on a hard day | Try under constraint |
| 4 | **SPECIFY** | Diagnose one real miss → one fix | Early single fix |
| 5 | **TRACK** | Log the rep (evidence, not memory) | Evidence trail |
| 6 | **ADJUST** | One change the evidence shows | **What will you change** |
| 7 | **COMMIT** | Run once more now + plant next use | Continue the practice |

### Why “what will you change” is Day 6 (not every day)

```text
Try across the week (D1–D5)
  → collect evidence (especially D5)
    → adjust once with signal (D6)
      → run and plant next (D7)
```

Asking for a redesign every day before evidence produces noise and nagging. Day 6 is when the arc says: **you have enough to change one real condition.**

Day 4 can still name a single skip/fix earlier; Day 6 is the **week-level** adjust from the trail.

---

## Why this framework (reasoning)

1. **Skills aren’t knowledge** — Knowing the move is cheap; using it in a live work moment is the skill.  
2. **The attempt produces information content can’t** — Cue late, wrong expectation, meeting ran long, softened under pressure, worked but caused a side effect.  
3. **Adjustment needs evidence** — Day 6 only works if Days 1–5 left a readable trail.  
4. **Memory lies; short records don’t** — “I handled it” vs “softened; no date.”  
5. **Coach (human or AI) needs a case file** — Situation + did + happened → specific help, not generic tips.  
6. **B2B buyers buy transfer, not completion** — “Tried it and adjusted” beats “finished the module.”  
7. **Makes “we require the work” true** — Positioning becomes architecture, not a slogan.

---

## How this ties to behavior & change management

This is not a fringe UX idea. It sits in the same family as:

| Tradition | Idea |
|-----------|------|
| **Behavior / change management** | Interventions fail without feedback from the field |
| **Action learning** | Real problem → act → reflect → next act |
| **Kolb experiential learning** | Experience → reflect → conceptualize → experiment |
| **After-action review** | Intended vs actual vs next |
| **Knowing–doing gap** (HBR-adjacent) | Knowledge without application doesn’t move orgs |
| **Deliberate practice** | Attempt + feedback on result + adjust |
| **Managerial / executive coaching** | Commit → try → debrief → replan |

**HBR** typically teaches apply-at-work + reflect + iterate; it does not usually ship software that stores “what happened.” SummitSkills **productizes** that pedagogy.

---

## Who else does this?

| Segment | Loop strength | Notes |
|---------|---------------|--------|
| Coaching platforms & human coaching | **Strong** | Core method: action commitment + debrief on result |
| Action-learning / serious leadership programs | **Strong** | On-the-job + structured reflection |
| Deliberate-practice systems | **Strong** | Result feedback is the point |
| Habit trackers | **Weak–medium** | Often only did / didn’t, not outcome |
| Course / video libraries | **Weak** | Completions and quizzes; transfer optional |
| Book summary apps | **Weak** | Exposure, not install |

**Professionally common; commercially under-built** in software — especially vs content catalogs.

---

## Would professionals agree?

### Why yes (majority view among coaching / OD / serious L&D)

- Transfer over completion is mainstream among people who care about behavior.  
- Feedback after attempt is required for skill.  
- Adjust-after-evidence matches coaching sequence.  
- Environment / small-start / cue work is mainstream habit and behavior design.  
- Privacy for honest reflection is expected in serious programs.  
- Non-gating early is good adoption design.

### Where they may push back (design tensions, not fatal flaws)

| Pushback | Response we can own |
|----------|---------------------|
| Seven days is arbitrary | A product rhythm, not a law of nature — works for B2B weeks |
| Rigid day roles | Curriculum clarity; real life is messier — optional loop absorbs skips |
| Self-report is biased | Better than no signal; “missed / not yet” is valid data |
| Managers should see everything | We prefer aggregates + consent; surveillance kills honesty |
| Optional fields weaken impact | v1 prioritizes truth and adoption; nudges can tighten later |
| AI coach isn’t a human coach | Trail-grounded coach is defensible; still not a replacement for 1:1 |

**Bottom line:** Pros will agree with the **core**. They’ll treat the **7-day map** as strong curriculum packaging, not holy writ.

---

## Competitive position (for messaging)

```text
CONTENT LIBRARIES          SUMMITSKILLS              HIGH-TOUCH COACHING
(completions)              (practice sprints)        (human debrief)
     |                            |                          |
  weak loop                  productized loop           strong loop
  broad catalog              thin, quality-gated        expensive, scarce
```

**We sit in the middle:** coaching-grade method, software-scale delivery, quality bar on what ships.

---

## Ship quality (related but separate)

A sprint is **public only** when:

- Every day sticky **core** mean ≥ **8.5**, and  
- L1 structure FAIL = 0  

One weak day holds the whole sprint.  
Lean product grades teaching fields only — **not bonus content**.

See summit-admin `SHIP_GATE.md`.

---

## Marketing & sales language (usable snippets)

### Positioning

- Not a book summary app. A **7-day skill install** inspired by great books.  
- Not “finish the course.” **Try it at work, see what happened, adjust.**  
- Built like **coaching practice**, delivered as a **web sprint** (B2B-first; individuals can buy too).  
- We only publish sprints that clear a **hard quality bar** — every day, not just the average.

### Problem

- Teams complete modules and nothing changes.  
- People remember the idea and forget the moment.  
- AI coaches give generic advice because they have no evidence from the learner’s week.

### Solution

- One real situation for the week.  
- Daily practice with a clear job (cue, floor, log, adjust, commit).  
- Optional capture of **what you did** and **what happened**.  
- Coach and Day 6 adjust grounded in that trail.

### Proof-style claims (use only when true)

- “Every published day meets our quality threshold.”  
- “Practice trail: attempts and outcomes, not just clicks.”  
- “Optional by design so people write truth, not performance.”  

### Avoid

- “AI-powered learning” as the headline (stigma; method first).  
- “Replace your coach” (we scale the *cycle*, not full human coaching).  
- “Book summaries in 15 minutes” (wrong category).

### Elevator (30 seconds)

> SummitSkills turns a serious business book into a seven-day skill sprint people do at work. Each day has one job — set the cue, run the floor version, log the attempt, adjust from evidence. Between days we invite them to note what they did and what happened, the same loop coaching uses, without blocking progress if they skip. We only put a sprint in the library when every day clears a hard quality bar. B2B first; individuals can buy too. Web, not an app.

### Elevator (10 seconds)

> Seven-day skill sprints: try it at work, see what happened, adjust — quality-gated, not another content library.

---

## Metrics that match the framework (future B2B)

Prefer these over vanity completions alone:

| Signal | Why it matters |
|--------|----------------|
| % who logged at least one attempt | Real try rate |
| % who logged an outcome | Loop closed |
| % who adjusted after an unsuccessful attempt | Learning from reality |
| % who planted a next use (Day 7) | Continuation |
| Self-reported workplace change (optional) | Transfer narrative |

**Admin default:** aggregates, not raw coaching text.  
**Shareable with consent:** final commitments, process changes.  
**Private by default:** full reflections, coach chats, names, sensitive interpersonal detail.

---

## Implementation status (product)

| Piece | Status |
|-------|--------|
| Situation + What I did | Live (`RETURN_LOOP_V1`) |
| What happened (outcome) | Live, optional, non-gating |
| No empty outcome chrome | Live |
| Coach practice trail | Live when data exists |
| Day 7 week artifact strip | Future |
| B2B aggregate dashboards | Future |

Details: `docs/PRACTICE_LOOP.md`.

---

## Quick FAQ

**Is this only Day 6?**  
No. **What happened** can appear any day after a logged try. **What will you change** is Day 6’s designed teaching job.

**Is this unique?**  
The *method* is not unique — coaching and action learning own it. The *product packaging* (quality-gated 7-day book-inspired sprints + optional practice trail) is distinctive.

**Does HBR teach this?**  
In spirit yes (apply, reflect, iterate). We turn it into a daily product loop.

**Will L&D agree?**  
Serious transfer-focused L&D and coaches: yes on the loop. Catalog-first L&D may still optimize for completions — different game.

---

*Update this file when the loop, day roles, or positioning language changes.*
