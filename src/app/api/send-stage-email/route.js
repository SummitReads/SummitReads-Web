import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, bookTitle, currentStage, nextStage, nextStageTitle, bookId, reflection } = await request.json();

    if (!email || !bookTitle || !currentStage || !nextStage || !bookId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stageUrl    = `${process.env.NEXT_PUBLIC_APP_URL}/summit/${bookId}/day/${nextStage}`;
    const isLastStage = nextStage === 7;

    const subject = isLastStage
      ? `Stage ${nextStage} is ready — your final stage awaits`
      : `Stage ${nextStage} is ready — ${bookTitle}`;

    const reflectionBlock = reflection ? `
      <div style="margin:24px 0;padding:16px 20px;background:rgba(23,184,224,0.06);border-left:3px solid #17B8E0;border-radius:0 8px 8px 0;">
        <p style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#17B8E0;margin:0 0 8px;">Your Stage ${currentStage} reflection</p>
        <p style="font-size:0.88rem;color:rgba(238,242,247,0.7);line-height:1.7;margin:0;font-style:italic;">"${reflection}"</p>
      </div>` : '';

    const { data, error } = await resend.emails.send({
      from:    'SummitSkills <notifications@summitskills.io>',
      to:      email,
      subject,
      html: `<div style="font-family:sans-serif;background:#0D1520;color:#EEF2F7;padding:40px;border-radius:12px;max-width:560px;margin:0 auto;">
        <p style="font-size:1.1rem;font-weight:800;margin:0 0 24px;">Summit<span style="color:#17B8E0;">Reads</span></p>
        <p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#17B8E0;margin:0 0 12px;">${isLastStage ? 'Final Stage' : `Stage ${nextStage} of 7`}</p>
        <h1 style="font-size:1.6rem;font-weight:800;margin:0 0 8px;">${isLastStage ? 'Your Summit awaits.' : `Stage ${nextStage} is ready.`}</h1>
        <p style="color:rgba(238,242,247,0.5);margin:0 0 8px;font-size:0.85rem;">${bookTitle}</p>
        ${nextStageTitle ? `<p style="color:rgba(238,242,247,0.7);margin:0 0 16px;">Next up: <em>${nextStageTitle}</em></p>` : ''}
        <p style="color:rgba(238,242,247,0.6);margin:0 0 8px;line-height:1.7;">${isLastStage ? `You've completed 6 stages. Stage 7 is your Summit — where everything comes together into a real deliverable.` : `You completed Stage ${currentStage} and unlocked the next one. 15 minutes is all it takes.`}</p>
        ${reflectionBlock}
        <a href="${stageUrl}" style="display:inline-block;padding:14px 32px;background:#17B8E0;color:#0D1520;font-weight:700;text-decoration:none;border-radius:8px;margin-top:8px;">${isLastStage ? 'Complete Your Sprint →' : `Start Stage ${nextStage} →`}</a>
        <p style="margin:32px 0 0;font-size:0.72rem;color:rgba(238,242,247,0.25);">Questions? <a href="mailto:support@summitskills.io" style="color:#17B8E0;text-decoration:none;">support@summitskills.io</a></p>
      </div>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });

  } catch (err) {
    console.error('Send stage email error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
