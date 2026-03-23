import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import {
  emailDay1,
  emailDay3,
  emailDay7,
  emailDay11,
  emailDay14,
} from '@/lib/trial-emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const {
      day,
      managerEmail,
      managerName,
      orgId,
      // Activity stats (used by day 7 and 11)
      totalStages       = 0,
      totalReflections  = 0,
      fullyCompleted    = 0,
    } = await request.json()

    if (!day || !managerEmail || !managerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appUrl            = process.env.NEXT_PUBLIC_SITE_URL || 'https://summitskills.io'
    const managerDashboardUrl = `${appUrl}/dashboard`
    const pricingUrl        = `${appUrl}/#pricing`

    // Pick the right template based on which day of the trial we're on
    let email
    switch (day) {
      case 1:
        email = emailDay1({ firstName: managerName, appUrl, managerDashboardUrl })
        break
      case 3:
        email = emailDay3({ firstName: managerName, managerDashboardUrl })
        break
      case 7:
        email = emailDay7({ firstName: managerName, totalStages, totalReflections, fullyCompleted, pricingUrl })
        break
      case 11:
        email = emailDay11({ firstName: managerName, pricingUrl, totalStages, totalReflections })
        break
      case 14:
        email = emailDay14({ firstName: managerName, pricingUrl })
        break
      default:
        return NextResponse.json({ error: `No email template for day ${day}` }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from:    'SummitSkills <notifications@summitskills.io>',
      to:      managerEmail,
      subject: email.subject,
      html:    email.html,
    })

    if (error) {
      console.error(`Resend error (day ${day}, org ${orgId}):`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id, day, orgId })

  } catch (err) {
    console.error('send-trial-email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
