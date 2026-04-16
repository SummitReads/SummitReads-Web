import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role key here — this runs server-side and needs to create users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')!

  // ── Verify the webhook is genuinely from Stripe ──────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Handle events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // Fires when checkout is completed — create the user account
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const email       = session.customer_details?.email
        const metadata    = session.metadata || {}
        const planType    = metadata.type as 'individual' | 'team'
        const seatCount   = parseInt(metadata.seats || '1')
        const customerId  = session.customer as string
        const subId       = session.subscription as string

        if (!email) {
          console.error('No email in checkout session')
          break
        }

        // Get trial end date from the subscription
        let trialEndsAt: string | null = null
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId)
          if (subscription.trial_end) {
            trialEndsAt = new Date(subscription.trial_end * 1000).toISOString()
          }
        }

        // ── Create the Supabase user via admin API ──────────────────────────
        const { data: userData, error: userError } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            plan_type:  planType,
            seat_count: seatCount,
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token_hash=TOKEN&type=invite`,
        })

        if (userError) {
          console.error('Error creating user:', userError)
          break
        }

        const userId = userData.user.id

        // ── Write billing info to profiles ──────────────────────────────────
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email,
            plan_type:               planType,
            seat_count:              seatCount,
            seats_used:              0,
            stripe_customer_id:      customerId,
            stripe_subscription_id:  subId,
            trial_ends_at:           trialEndsAt,
            subscription_status:     'trialing',
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }

        console.log(`✓ Created ${planType} account for ${email}`)
        break
      }

      // Fires when a trial ends and payment succeeds — mark as active
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: subscription.status })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('Error updating subscription status:', error)
        break
      }

      // Fires when a subscription is cancelled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('Error marking subscription canceled:', error)
        break
      }

      // Fires when a payment fails — flag the account
      case 'invoice.payment_failed': {
        const invoice      = event.data.object as Stripe.Invoice
        const subscription = (typeof invoice.subscription === "string" ? invoice.subscription : (invoice.subscription as any)?.id ?? null)

        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_subscription_id', subscription)

        if (error) console.error('Error marking payment failed:', error)
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
