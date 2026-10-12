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
        const { subscriptions } = await getMongo()
        await subscriptions.updateOne({ stripeSessionId: checkout.id }, { $set: { status: 'paid', paymentStatus: checkout.payment_status, paidAt: new Date(), providerPaymentId: checkout.payment_intent } })
      }
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] webhook failed', error)
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }
}
