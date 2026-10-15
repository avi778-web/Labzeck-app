import { NextResponse } from 'next/server'
import { Stripe } from 'stripe'
import { getMongo } from '@/lib/mongodb'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const checkout = event.data.object as Stripe.Checkout.Session
      if (checkout.payment_status === 'paid' || event.type === 'checkout.session.async_payment_succeeded') {
        const { subscriptions, users, labourers } = await getMongo()
        await subscriptions.findOneAndUpdate({ stripeSessionId: checkout.id }, { $set: { status: 'paid', paymentStatus: checkout.payment_status, payment_status: 'success', paidAt: new Date(), providerPaymentId: checkout.payment_intent, valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } }, { returnDocument: 'after' })
        const userId = checkout.metadata?.userId
        const tier = checkout.metadata?.subscription_tier
        if (userId) { const benefits = { subscription_tier: tier, hasBlueTick: true, isAdFree: true, unlimitedAi: true, rank_tier: tier === '699' ? 'vip-gold' : 'verified' }; await users.updateOne({ _id: userId }, { $set: benefits }); await labourers.updateOne({ userId }, { $set: benefits }) }
      }
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Labzeck] webhook failed', error)
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }
}
