import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Uses service role key — never exposed to the browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Verify this is being called by Vercel Cron, not a random request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find orgs whose trial expires tomorrow (within the next 24-48 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Query orgs with trials expiring tomorrow
    // Adjust table/column names to match your actual Supabase schema
    const { data: expiringOrgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, manager_email, manager_name, trial_expires_at')
      .eq('is_trial', true)
      .gte('trial_expires_at', tomorrowStart.toISOString())
      .lte('trial_expires_at', tomorrowEnd.toISOString());

    if (orgsError) {
      console.error('Error fetching expiring orgs:', orgsError);
      return NextResponse.json({ error: orgsError.message }, { status: 500 });
    }

    if (!expiringOrgs || expiringOrgs.length === 0) {
      return NextResponse.json({ success: true, message: 'No trials expiring tomorrow' });
    }

    const results = [];

    for (const org of expiringOrgs) {
      // Get team activity for this org
      // Adjust table/column names to match your actual Supabase schema
      const { data: users, error: usersError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          stages_completed,
          reflections_submitted,
          users (
            full_name,
            email
          ),
          books (
            title
          )
        `)
        .eq('org_id', org.id)
        .eq('is_trial_user', true);

      if (usersError) {
        console.error(`Error fetching users for org ${org.id}:`, usersError);
        continue;
      }

      const teamActivity = (users || []).map(u => ({
        name: u.users?.full_name || 'Team Member',
        stages_completed: u.stages_completed || 0,
        reflections_submitted: u.reflections_submitted || 0,
        sprint_title: u.books?.title || 'Active Sprint',
      }));

      // Fire the email
      const emailRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-trial-expiration`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            managerEmail:   org.manager_email,
            managerName:    org.manager_name,
            teamActivity,
            trialExpiresAt: org.trial_expires_at,
            orgId:          org.id,
          }),
        }
      );

      const emailResult = await emailRes.json();
      results.push({ orgId: org.id, ...emailResult });
    }

    return NextResponse.json({ success: true, results });

  } catch (err) {
    console.error('Trial expiration cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
