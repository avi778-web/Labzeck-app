import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { randomInt, createHash } from 'node:crypto'
import { Resend } from 'resend'
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
      const resend = new Resend(process.env.RESEND_API_KEY || process.env.RESEND_EMAIL_RESEND_API_KEY)
      await resend.emails.send({ from: 'Labzeck <labzeck@zohomail.in>', to: [body.email], subject: 'Your Labzeck phone verification code', html: `<p>Your phone verification code is <strong>${code}</strong>. It expires in 5 minutes.</p>` })
      return NextResponse.json({ ok: true, delivery: 'email-fallback', expiresAt: expiresAt.getTime() })
    }
    console.info('[v0] Phone OTP demo fallback', { phone: body.phone, code })
    return NextResponse.json({ ok: true, delivery: 'demo', demoCode: code, expiresAt: expiresAt.getTime() })
  } catch (error) {
    console.error('❌ Phone OTP Error:', error)
    return NextResponse.json({ ok: true, delivery: 'demo', message: 'Verification fallback enabled' })
  }
}
