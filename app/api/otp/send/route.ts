import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { randomInt, createHash } from 'node:crypto'
import { z } from 'zod'
import { getMongo } from '@/lib/mongodb'

const schema = z.object({ phone: z.string().regex(/^\+?[1-9]\d{9,14}$/), email: z.string().email().optional() })

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const mongo = await getMongo()
    const code = randomInt(100000, 1000000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await mongo.otpVerifications.updateOne({ identifier: body.phone, channel: 'phone' }, { $set: { identifier: body.phone, channel: 'phone', codeHash: createHash('sha256').update(code).digest('hex'), expiresAt, attempts: 0, createdAt: new Date() } }, { upsert: true })
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: body.phone, channel: 'sms' })
      return NextResponse.json({ ok: true, delivery: 'sms', expiresAt: expiresAt.getTime() })
    }
    if (body.email && (process.env.RESEND_API_KEY || process.env.RESEND_EMAIL_RESEND_API_KEY)) {
      const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_EMAIL_RESEND_API_KEY
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `phone-otp/${body.phone}/${Math.floor(Date.now() / 60000)}` }, body: JSON.stringify({ from: `Labzeck <${process.env.RESEND_FROM_EMAIL || 'labzeck-app@zohomail.in'}>`, to: [body.email], subject: 'Your Labzeck phone verification code', html: `<p>Your phone verification code is <strong>${code}</strong>. It expires in 5 minutes.</p>` }) })
      if (response.ok) return NextResponse.json({ ok: true, delivery: 'email-fallback', expiresAt: expiresAt.getTime() })
    }
    return NextResponse.json({ ok: false, error: 'Phone delivery is not configured.' }, { status: 503 })
  } catch (error) {
    console.error('❌ Phone OTP Error:', error)
    return NextResponse.json({ ok: false, error: 'Unable to send phone verification code.' }, { status: 500 })
  }
}
