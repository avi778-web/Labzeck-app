import Stripe from 'stripe'
import { ensureMongoConnection } from '@/lib/mongodb'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe is not configured')
  return new Stripe(key)
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return new Response('Webhook not configured', { status: 400 })
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET) } catch { return new Response('Invalid signature', { status: 400 }) }

  if (event.type === 'checkout.session.completed') {
    const checkout = event.data.object as Stripe.Checkout.Session
    const userId = checkout.metadata?.userId
    const plan = checkout.metadata?.plan
    if (userId && plan) {
      const mongo = await ensureMongoConnection()
      await mongo.users.updateOne({ userId }, { $set: { activeSubscription: true, subscriptionPlan: plan, subscriptionUpdatedAt: new Date() } }, { upsert: true })
      await mongo.payments.updateOne({ stripeSessionId: checkout.id }, { $set: { userId, plan, stripeSessionId: checkout.id, amountTotal: checkout.amount_total, currency: checkout.currency, status: 'paid', updatedAt: new Date() } }, { upsert: true })
    }
  }
  return Response.json({ received: true })
}
