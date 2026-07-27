# Practice loop (return loop)

**Full strategy, marketing, and “why”:** see **`PRACTICE_FRAMEWORK.md`**.

**Product principle:** Skill change needs contact with reality. We invite plan → try → what happened → adjust. We never block progress if fields are empty.

## Behavior change link

This is standard **behavior / change management practice**:

- **Action learning** — try in real work, reflect, try again  
- **Kolb** — experience → reflect → conceptualize → experiment  
- **After-action review** — intended vs what happened vs next  
- **HBR-adjacent leadership practice** — knowing–doing gap; on-the-job application  

Not “course completion.” **Transfer.**

## What the product does

| Field | DB column | When shown |
|-------|-----------|------------|
| Situation this week | Day 1 `progress_notes` | Day 1 prompt; Days 2–7 only if set |
| What I did | `action_commitment` | Optional on every day; next day only if filled |
| What happened | `evening_reflection` | Next day only if “What I did” exists; optional same-day if “What I did” filled |

**Gates:** none. “Mark day complete” never requires these fields.

**Empty chrome:** if nothing was filled yesterday, no blank “What happened?” box.

## Who else does this

Coaching platforms, action-learning programs, deliberate-practice systems.  
Summary/course catalogs generally do **not**.

## MVP shipped

- Summit day UI (non-blocking)  
- Coach receives practice trail when data exists  
- Flag: `RETURN_LOOP_V1` in `summit/[id]/day/[dayNum]/page.jsx`
