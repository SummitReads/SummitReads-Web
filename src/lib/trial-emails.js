// ─────────────────────────────────────────────────────────────────────────────
// SummitSkills Trial Email Sequence
// 5 emails · Sent via Resend · Triggered by trial_start_date
//
// Trigger logic (recommended):
//   Day 1  → send immediately on signup
//   Day 3  → send if stages_completed === 0
//   Day 7  → send always (primary conversion email)
//   Day 11 → send if subscription is still trial
//   Day 14 → send if subscription is still trial
// ─────────────────────────────────────────────────────────────────────────────

// Shared header/footer partials
const header = `
  <div style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
    <p style="font-size:1.1rem;font-weight:800;margin:0;font-family:sans-serif;">
      Summit<span style="color:#17B8E0;font-style:italic;">Skills</span>
    </p>
  </div>`

const footer = (unsubscribeUrl = '#') => `
  <div style="border-top:1px solid rgba(255,255,255,0.07);padding:24px 40px;">
    <p style="font-size:0.78rem;color:rgba(238,242,247,0.25);margin:0;font-family:sans-serif;">
      © 2026 SummitSkills. A brand of SSK LLC.<br/>
      <a href="${unsubscribeUrl}" style="color:rgba(238,242,247,0.25);text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>`

const wrap = (content) => `
  <div style="font-family:sans-serif;background:#0D1520;color:#EEF2F7;border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden;">
    ${header}
    <div style="padding:40px;">
      ${content}
    </div>
    ${footer()}
  </div>`

const ctaButton = (text, url) => `
  <a href="${url}" style="display:inline-block;background:#17B8E0;color:#0D1520;font-weight:700;font-size:0.95rem;padding:12px 28px;border-radius:6px;text-decoration:none;margin-top:8px;">
    ${text}
  </a>`

const eyebrow = (text) => `
  <p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(238,242,247,0.4);margin:0 0 8px;">
    ${text}
  </p>`

const h1 = (text) => `
  <h1 style="font-size:1.6rem;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em;line-height:1.3;">
    ${text}
  </h1>`

const body = (text) => `
  <p style="color:rgba(238,242,247,0.58);font-size:0.95rem;line-height:1.7;margin:0 0 20px;">
    ${text}
  </p>`

const note = (text) => `
  <p style="font-size:0.84rem;color:rgba(238,242,247,0.35);line-height:1.7;margin:24px 0 0;">
    ${text}
  </p>`

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 1 · Day 1 · Welcome
// Subject: Your SummitSkills trial is live, {firstName}
// Trigger: Immediately on trial signup
// Goal: Get them to assign their first sprint within 24 hours
// ─────────────────────────────────────────────────────────────────────────────

export function emailDay1({ firstName, appUrl, managerDashboardUrl }) {
  const subject = `Your SummitSkills trial is live, ${firstName}`
  const html = wrap(`
    ${eyebrow('Your 14-day trial has started')}
    ${h1(`Welcome, ${firstName}. Here's your one task for today.`)}
    ${body(`Your team now has full access to SummitSkills for the next 14 days. All 295 skill sprints are available. The manager dashboard is live. Everything is ready.`)}
    ${body(`The one thing that matters right now: assign a sprint to your team. It takes about two minutes, and once they get the invite email they're in with no further setup required.`)}

    <div style="background:rgba(23,184,224,0.06);border:1px solid rgba(23,184,224,0.2);border-radius:10px;padding:24px;margin:24px 0;">
      <p style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#17B8E0;margin:0 0 8px;">Recommended first sprint</p>
      <p style="font-size:1rem;font-weight:700;color:#EEF2F7;margin:0 0 6px;">Building Consistent Habits</p>
      <p style="font-size:0.88rem;color:rgba(238,242,247,0.55);margin:0;">Productivity and Habits · 7 stages · 15 min/day. A good first sprint for any team because the skill is universal and the deliverable is immediately useful.</p>
    </div>

    ${ctaButton('Go to your dashboard →', managerDashboardUrl)}
    ${note(`Questions about setup? Reply to this email. Paul reads and responds to every one.`)}
  `)
  return { subject, html }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 2 · Day 3 · Re-engagement
// Subject: Your team hasn't started yet, {firstName}
// Trigger: ONLY if stages_completed === 0 across all team members
// Goal: Remove whatever friction is blocking the first action
// ─────────────────────────────────────────────────────────────────────────────

export function emailDay3({ firstName, managerDashboardUrl }) {
  const subject = `Your team hasn't started yet, ${firstName}`
  const html = wrap(`
    ${eyebrow('Day 3 of your trial')}
    ${h1(`Nothing's broken. Here's what usually happens.`)}
    ${body(`Most managers who sign up intending to start a sprint hit a small friction point on day one or two. They get pulled into something else, close the tab, and mean to come back. You have 11 days left in your trial.`)}
    ${body(`The fastest path forward is to assign one sprint to two or three people you trust to try something new. Not your whole team. Just a few people. The dashboard will show you what they write within the first two days and you'll have a real sense of whether this works for your team.`)}
    ${body(`If you hit a specific issue with setup, reply to this email and tell me what happened. I'll fix it.`)}
    ${ctaButton('Assign your first sprint →', managerDashboardUrl)}
    ${note(`If now isn't the right time and you'd prefer to restart your trial later, reply and let me know. I'll sort it out.`)}
  `)
  return { subject, html }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 3 · Day 7 · Conversion (primary)
// Subject: {firstName}, your team just crossed the halfway point
// Trigger: Always send on day 7
// Goal: Ask for the card at the moment the product has proven itself
// ─────────────────────────────────────────────────────────────────────────────

export function emailDay7({ firstName, totalStages, totalReflections, fullyCompleted, pricingUrl }) {
  const hasActivity = totalStages > 0

  const activitySection = hasActivity ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="width:33%;padding:0 6px 0 0;">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:700;color:#17B8E0;line-height:1;">${totalStages}</div>
            <div style="font-size:0.72rem;color:rgba(238,242,247,0.4);margin-top:6px;text-transform:uppercase;letter-spacing:0.06em;">Stages Completed</div>
          </div>
        </td>
        <td style="width:33%;padding:0 3px;">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:700;color:#17B8E0;line-height:1;">${totalReflections}</div>
            <div style="font-size:0.72rem;color:rgba(238,242,247,0.4);margin-top:6px;text-transform:uppercase;letter-spacing:0.06em;">Reflections Written</div>
          </div>
        </td>
        <td style="width:33%;padding:0 0 0 6px;">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:700;color:#17B8E0;line-height:1;">${fullyCompleted}</div>
            <div style="font-size:0.72rem;color:rgba(238,242,247,0.4);margin-top:6px;text-transform:uppercase;letter-spacing:0.06em;">Sprints Finished</div>
          </div>
        </td>
      </tr>
    </table>
    <p style="color:rgba(238,242,247,0.58);font-size:0.95rem;line-height:1.7;margin:0 0 20px;">
      Those reflections are written responses from your team connecting the concepts to their actual work. That's not a completion rate. That's evidence of engagement.
    </p>` : `
    <p style="color:rgba(238,242,247,0.58);font-size:0.95rem;line-height:1.7;margin:24px 0;">
      If your team hasn't started yet, there are still 7 days left in the trial. Assign one sprint today and you'll see responses from your team in the dashboard within 48 hours.
    </p>`

  const subject = `${firstName}, your team just crossed the halfway point`
  const html = wrap(`
    ${eyebrow('Day 7 of your trial')}
    ${h1(`Seven days in. Here's what happened.`)}
    ${body(`You're at the halfway point of your trial. ${hasActivity ? `Here's what your team has done so far.` : `Here's what the system is built to produce.`}`)}
    ${activitySection}

    <div style="background:rgba(23,184,224,0.08);border:1px solid rgba(23,184,224,0.2);border-radius:10px;padding:24px;margin:24px 0;">
      <p style="font-size:0.95rem;line-height:1.7;color:rgba(238,242,247,0.8);margin:0 0 16px;">
        To keep your team's access and unlock all 295 sprints for the year, activate your plan before day 14. Volume pricing starts at $179 per seat annually, with discounts from 25 seats.
      </p>
      ${ctaButton('Activate your team plan →', pricingUrl)}
    </div>

    ${note(`Not ready yet? No pressure. Your trial runs through day 14 and nothing changes until then. If you have questions about pricing or want to talk through whether this is the right fit for your team, just reply.`)}
  `)
  return { subject, html }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 4 · Day 11 · Soft urgency
// Subject: 3 days left in your SummitSkills trial
// Trigger: Only if still on trial (not yet converted)
// Goal: Create urgency without being pushy
// ─────────────────────────────────────────────────────────────────────────────

export function emailDay11({ firstName, pricingUrl, totalStages, totalReflections }) {
  const hasActivity = totalStages > 0
  const subject = `3 days left in your SummitSkills trial`
  const html = wrap(`
    ${eyebrow('Day 11 of your trial')}
    ${h1(`Your trial ends in 3 days, ${firstName}.`)}
    ${hasActivity
      ? body(`Your team has completed ${totalStages} stages and written ${totalReflections} reflections during the trial. When the trial ends, their progress is saved but access is suspended until a plan is activated.`)
      : body(`Your trial ends on day 14. If you haven't had a chance to run a sprint yet, there's still time. Assign one today and your team will have two full days to work through the first few stages.`)
    }
    ${body(`If you've seen enough to know this works for your team, activating today locks your per-seat rate and keeps everything running without interruption.`)}

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:24px;margin:24px 0;">
      <p style="font-size:0.88rem;font-weight:700;color:#EEF2F7;margin:0 0 12px;">What activating includes:</p>
      <ul style="color:rgba(238,242,247,0.58);font-size:0.88rem;line-height:2;padding-left:20px;margin:0;">
        <li>Full access to all 295 skill sprints</li>
        <li>Manager dashboard with reflection logs</li>
        <li>Sprint assignment by individual or team group</li>
        <li>Per-seat rate locked for your full contract term</li>
        <li>Live within 24 hours of signing</li>
      </ul>
    </div>

    ${ctaButton('See team pricing →', pricingUrl)}
    ${note(`Questions before committing? Reply here. Paul responds personally within one business day.`)}
  `)
  return { subject, html }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 5 · Day 14 · Final call
// Subject: Your SummitSkills trial ends today
// Trigger: Only if still on trial (not yet converted)
// Goal: Final direct ask, no fluff
// ─────────────────────────────────────────────────────────────────────────────

export function emailDay14({ firstName, pricingUrl }) {
  const subject = `Your SummitSkills trial ends today`
  const html = wrap(`
    ${eyebrow('Final day of your trial')}
    ${h1(`Last chance to keep your team's access, ${firstName}.`)}
    ${body(`Your trial ends today. After midnight, your team's access is suspended. Their progress is saved for 30 days if you decide to activate later, but they won't be able to continue their sprints until a plan is in place.`)}
    ${body(`If SummitSkills was useful during the trial, this is the moment to lock it in. The process is straightforward: select your seat count, sign the MSA, and your team is back up within 24 hours.`)}

    ${ctaButton('Activate your plan now →', pricingUrl)}

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px;margin:24px 0;">
      <p style="font-size:0.88rem;color:rgba(238,242,247,0.55);line-height:1.7;margin:0;">
        Not ready? No problem. You can restart at any time at the same pricing. Just reply to this email and I'll set it up.
      </p>
    </div>

    ${note(`If the trial wasn't what you expected, I'd genuinely like to know why. A one-line reply is enough. It helps me make it better for the next team.`)}
  `)
  return { subject, html }
}
