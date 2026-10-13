import { NextResponse } from 'next/server'
import { Stripe } from 'stripe'
import { auth } from '@/lib/auth'
import { getMongo } from '@/lib/mongodb'
import { getSubscriptionPlanKey, getSubscriptionPlan } from '@/lib/products'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const planKey = getSubscriptionPlanKey(body.plan)
    const plan = getSubscriptionPlan(planKey)
    if (!plan) return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 })
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = request.headers.get('origin') ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const { subscriptions } = await getMongo()
    const payment = await subscriptions.insertOne({ userId: session.user.id, email: session.user.email, plan: planKey, provider: 'stripe', status: 'checkout_started', amountInr: plan.amountInr, plan_amount: plan.amountInr, subscription_tier: plan.amountInr === 399 ? '399' : '699', payment_status: 'pending', hasBlueTick: true, isAdFree: true, unlimitedAi: true, ceo_cto_access: plan.amountInr === 699, createdAt: new Date() })
    const checkout = await stripe.checkout.sessions.create({ mode: 'payment', customer_email: session.user.email, line_items: [{ price_data: { currency: 'inr', product_data: { name: plan.name, description: plan.description }, unit_amount: plan.priceInCents }, quantity: 1 }], metadata: { subscriptionId: payment.insertedId.toString(), userId: session.user.id, plan: planKey, subscription_tier: plan.amountInr === 399 ? '399' : '699', hasBlueTick: 'true', isAdFree: 'true', unlimitedAi: 'true', ceoCtoAccess: plan.amountInr === 699 ? 'true' : 'false' }, success_url: `${origin}/?payment=success`, cancel_url: `${origin}/?payment=cancelled`, integration_identifier: `labzeck_${Math.random().toString(36).slice(2, 10)}` })
    await subscriptions.updateOne({ _id: payment.insertedId }, { $set: { stripeSessionId: checkout.id } })
    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('[v0] checkout failed', error)
    return NextResponse.json({ error: 'Unable to start secure checkout' }, { status: 500 })
  }
}
