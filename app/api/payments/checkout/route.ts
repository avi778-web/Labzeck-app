import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/products'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe is not configured')
  return new Stripe(key)
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Please sign in first.' }, { status: 401 })
  const { plan } = await request.json() as { plan?: SubscriptionPlan }
  const selected = plan ? SUBSCRIPTION_PLANS[plan] : undefined
  if (!selected) return Response.json({ error: 'Invalid subscription plan.' }, { status: 400 })

  const origin = request.headers.get('origin') || `https://${process.env.VERCEL_URL}`
  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: session.user.email,
    line_items: [{ price_data: { currency: 'inr', product_data: { name: selected.name, description: selected.description }, unit_amount: selected.priceInCents }, quantity: 1 }],
    metadata: { userId: session.user.id, plan },
    success_url: `${origin}/?payment=success`,
    cancel_url: `${origin}/?payment=cancelled`,
  })
  return Response.json({ url: checkout.url })
}
