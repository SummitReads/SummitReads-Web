import Stripe from 'stripe'

// Tier pricing logic — mirrors the calculator on the landing page
function getTeamPricePerSeat(seats) {
  if (seats >= 500) return null  // custom pricing
  if (seats >= 100) return 11900 // $119.00
  if (seats >= 25)  return 14900 // $149.00
  return 17900                   // $179.00
}

export async function POST(req) {
  try {
    const key = process.env.STRIPE_SECRET_KEY
    console.log('STRIPE_SECRET_KEY present:', !!key)
    console.log('STRIPE_SECRET_KEY prefix:', key ? key.substring(0, 12) : 'MISSING')
    const stripe = new Stripe(key)
    const body = await req.json()
    const { type, seats, billingCycle } = body

    // ── Validate ────────────────────────────────────────────────────────────
    if (!type) {
      return Response.json({ error: 'Missing type' }, { status: 400 })
    }

    let lineItems
    let mode = 'subscription'

    // ── Individual plan ─────────────────────────────────────────────────────
    if (type === 'individual') {
      if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
        return Response.json({ error: 'Invalid billingCycle' }, { status: 400 })
      }

      const priceId = billingCycle === 'monthly'
        ? process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY
        : process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL

      lineItems = [{ price: priceId, quantity: 1 }]
    }

    // ── Team plan ────────────────────────────────────────────────────────────
    else if (type === 'team') {
      const seatCount = parseInt(seats)
      if (!seatCount || seatCount < 1) {
        return Response.json({ error: 'Invalid seat count' }, { status: 400 })
      }

      if (seatCount >= 500) {
        return Response.json(
          { error: 'Please contact sales for 500+ seats', contactSales: true },
          { status: 400 }
        )
      }

      const pricePerSeat = getTeamPricePerSeat(seatCount)

      lineItems = [{
        price_data: {
          currency: 'usd',
          product: process.env.STRIPE_PRICE_TEAM, // using price ID as product reference
          recurring: { interval: 'year' },
          unit_amount: pricePerSeat,
        },
        quantity: seatCount,
      }]

      // For team plan we use the price ID directly instead of price_data
      lineItems = [{
        price: process.env.STRIPE_PRICE_TEAM,
        quantity: seatCount,
      }]
    }

    else {
      return Response.json({ error: 'Invalid type' }, { status: 400 })
    }

    // ── Create Checkout Session ──────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://summitreads.io'}/auth/signup?checkout=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL || 'https://summitreads.io'}/#pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        type,
        seats: seats || '1',
        billingCycle: billingCycle || 'annual',
      },
    })

    return Response.json({ url: session.url })

  } catch (err) {
    console.error('Stripe checkout error:', err)
    return Response.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
// Mon Mar 16 21:59:37 MDT 2026
