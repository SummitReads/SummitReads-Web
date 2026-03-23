import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { managerEmail, managerName, teamActivity, trialExpiresAt, orgId } = await request.json();

    if (!managerEmail || !managerName || !teamActivity || !trialExpiresAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalStages      = teamActivity.reduce((sum, u) => sum + (u.stages_completed || 0), 0);
    const totalReflections = teamActivity.reduce((sum, u) => sum + (u.reflections_submitted || 0), 0);
    const fullyCompleted   = teamActivity.filter(u => u.stages_completed === 7).length;
    const expiresDate      = new Date(trialExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const pricingUrl       = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`;

    const teamRows = teamActivity.map(user => {
      const isComplete = user.stages_completed === 7;
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:0.88rem;font-weight:600;color:#EEF2F7;">${user.name}</div>
            <div style="font-size:0.75rem;color:rgba(238,242,247,0.35);margin-top:2px;">${user.sprint_title || 'Active Sprint'}</div>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;">
            <span style="background:${isComplete ? 'rgba(23,184,224,0.15)' : 'rgba(255,255,255,0.06)'};color:${isComplete ? '#17B8E0' : 'rgba(238,242,247,0.7)'};border-radius:20px;padding:3px 10px;font-size:0.82rem;font-weight:600;">
              ${user.stages_completed}/7${isComplete ? ' ✓' : ''}
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;font-size:0.88rem;color:rgba(238,242,247,0.6);">
            ${user.reflections_submitted || 0}
          </td>
        </tr>`;
    }).join('');

    const { data, error } = await resend.emails.send({
      from:    'SummitSkills <notifications@summitskills.io>',
      to:      managerEmail,
      subject: `${managerName}, your team's trial ends ${expiresDate}`,
      html: `
        <div style="font-family:sans-serif;background:#0D1520;color:#EEF2F7;border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden;">

          <!-- Header -->
          <div style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <p style="font-size:1.1rem;font-weight:800;margin:0;">Summit<span style="color:#17B8E0;font-style:italic;">Skills</span></p>
          </div>

          <!-- Body -->
          <div style="padding:40px;">
            <p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(238,242,247,0.4);margin:0 0 8px;">Your trial ends ${expiresDate}</p>
            <h1 style="font-size:1.6rem;font-weight:800;margin:0 0 12px;letter-spacing:-0.02em;line-height:1.3;">${managerName}, here's what your team accomplished</h1>
            <p style="color:rgba(238,242,247,0.58);font-size:0.95rem;line-height:1.7;margin:0 0 32px;">Over the past 14 days, your team hasn't been watching videos — they've been writing, reflecting, and practicing real skills. Here's what they did.</p>

            <!-- Stats -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
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

            <!-- Team Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;margin-bottom:32px;overflow:hidden;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.07);">
                  <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:rgba(238,242,247,0.3);text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Team Member</th>
                  <th style="padding:10px 16px;text-align:center;font-size:0.72rem;color:rgba(238,242,247,0.3);text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Stages</th>
                  <th style="padding:10px 16px;text-align:center;font-size:0.72rem;color:rgba(238,242,247,0.3);text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Reflections</th>
                </tr>
              </thead>
              <tbody>
                ${teamRows}
              </tbody>
            </table>

            <!-- CTA -->
            <div style="background:rgba(23,184,224,0.08);border:1px solid rgba(23,184,224,0.2);border-radius:10px;padding:24px;margin-bottom:32px;">
              <p style="font-size:0.95rem;line-height:1.7;color:rgba(238,242,247,0.8);margin:0 0 20px;">Your team's trial ends on <strong style="color:#EEF2F7;">${expiresDate}</strong>. To keep their momentum going — and unlock the full sprint library for your entire team — activate your plan today.</p>
              <a href="${pricingUrl}" style="display:inline-block;background:#17B8E0;color:#0D1520;font-weight:700;font-size:0.95rem;padding:12px 28px;border-radius:6px;text-decoration:none;">Activate Your Team Plan →</a>
            </div>

            <p style="font-size:0.84rem;color:rgba(238,242,247,0.35);line-height:1.7;margin:0;">Questions before you commit? Just reply to this email — Paul will get back to you personally within one business day.</p>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid rgba(255,255,255,0.07);padding:24px 40px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.78rem;color:rgba(238,242,247,0.25);">© 2026 SummitSkills. A brand of SSK LLC.</span>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });

  } catch (err) {
    console.error('Send trial expiration email error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
