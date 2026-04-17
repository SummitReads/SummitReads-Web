import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // ── Verify the user is authenticated ────────────────────────────────────
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Get the user's profile ───────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('stripe_subscription_id, stripe_customer_id, seat_count, plan_type, subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
  }

  const { action, seats } = await request.json()

  // ── Handle seat update ───────────────────────────────────────────────────
  if (action === 'update_seats') {
    if (!seats || seats < 1) {
      return NextResponse.json({ error: 'Invalid seat count' }, { status: 400 })
    }

    if (profile.plan_type !== 'team') {
      return NextResponse.json({ error: 'Seat management is only available on team plans' }, { status: 400 })
    }

    try {
      // Get current subscription to find the item ID
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      const subscriptionItemId = subscription.items.data[0]?.id

      if (!subscriptionItemId) {
        return NextResponse.json({ error: 'Subscription item not found' }, { status: 400 })
      }

      // Update quantity — Stripe handles prorated billing automatically
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{
          id: subscriptionItemId,
          quantity: seats,
        }],
        proration_behavior: 'create_prorations',
      })

      // Update seat count in Supabase
      await supabaseAdmin
        .from('profiles')
        .update({ seat_count: seats })
        .eq('id', user.id)

      return NextResponse.json({ success: true, seats })
    } catch (err: any) {
      console.error('Seat update error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // ── Handle cancellation ──────────────────────────────────────────────────
  if (action === 'cancel') {
    try {
      // Cancel at period end — user keeps access until trial/period ends
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      // Mark as canceling in Supabase — not fully canceled yet
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'canceling' })
        .eq('id', user.id)

      return NextResponse.json({ success: true })
    } catch (err: any) {
      console.error('Cancellation error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
