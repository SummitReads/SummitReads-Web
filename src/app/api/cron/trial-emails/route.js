import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Returns orgs where trial_start_date is exactly N days ago (within today's window)
function dateWindowForDay(daysAgo) {
  const target = new Date()
  target.setDate(target.getDate() - daysAgo)
  const start = new Date(target)
  start.setHours(0, 0, 0, 0)
  const end = new Date(target)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function getActivityForOrg(orgId) {
  const { data: users, error } = await supabase
    .from('user_progress')
    .select('stages_completed, reflections_submitted')
    .eq('org_id', orgId)
    .eq('is_trial_user', true)

  if (error || !users) return { totalStages: 0, totalReflections: 0, fullyCompleted: 0 }

  return {
    totalStages:      users.reduce((sum, u) => sum + (u.stages_completed || 0), 0),
    totalReflections: users.reduce((sum, u) => sum + (u.reflections_submitted || 0), 0),
    fullyCompleted:   users.filter(u => u.stages_completed === 7).length,
  }
}

async function sendTrialEmail(payload) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/send-trial-email`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }
  )
  return res.json()
}

export async function GET(request) {
  // Verify this is Vercel Cron, not a random request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []
  const emailDays = [1, 3, 7, 11, 14]

  for (const day of emailDays) {
    const { start, end } = dateWindowForDay(day)

    // Fetch orgs whose trial started exactly `day` days ago
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, manager_email, manager_name, trial_start_date')
      .eq('is_trial', true)
      .eq('is_converted', false)       // skip orgs that already paid
      .gte('trial_start_date', start)
      .lte('trial_start_date', end)

    if (error) {
      console.error(`Error fetching orgs for day ${day}:`, error)
      continue
    }

    if (!orgs || orgs.length === 0) continue

    for (const org of orgs) {
      // Day 3 only fires if the team hasn't started yet
      if (day === 3) {
        const { totalStages } = await getActivityForOrg(org.id)
        if (totalStages > 0) {
          results.push({ orgId: org.id, day, skipped: true, reason: 'team already active' })
          continue
        }
      }

      // Days 7 and 11 include activity stats
      let activityStats = {}
      if (day === 7 || day === 11) {
        activityStats = await getActivityForOrg(org.id)
      }

      const result = await sendTrialEmail({
        day,
        managerEmail: org.manager_email,
        managerName:  org.manager_name,
        orgId:        org.id,
        ...activityStats,
      })

      results.push({ orgId: org.id, day, ...result })
    }
  }

  return NextResponse.json({ success: true, results })
}
