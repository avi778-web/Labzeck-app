import { NextResponse } from 'next/server'
import { createHmac, randomInt } from 'node:crypto'
import { Resend } from 'resend'
import { z } from 'zod'
import { createHash, timingSafeEqual } from 'node:crypto'
import { getMongo } from '@/lib/mongodb'

const schema = z.object({ email: z.string().email().transform(value => value.trim().toLowerCase()) })
const secret = () => process.env.BETTER_AUTH_SECRET || process.env.RESEND_API_KEY || 'labzeck-otp-secret'

function sign(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url') }

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json())
    const code = randomInt(100000, 1000000).toString()
    const expires = Date.now() + 5 * 60 * 1000
    const payload = `${email}.${code}.${expires}`
    const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
    const mongo = await getMongo()
    await mongo.otpVerifications.updateOne({ identifier: email, channel: 'email' }, { $set: { identifier: email, channel: 'email', codeHash: createHash('sha256').update(code).digest('hex'), expiresAt: new Date(expires), attempts: 0, createdAt: new Date() } }, { upsert: true })
    const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_EMAIL_RESEND_API_KEY
    let delivery: 'email' | 'demo' = 'demo'
    let deliveryError = ''
    if (resendKey) {
      const resend = new Resend(resendKey)
      const { error } = await resend.emails.send({
        from: 'Labzeck <labzeck@zohomail.in>',
        to: [email],
        subject: 'Your Labzeck verification code',
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto"><h1 style="color:#2563eb">Labzeck</h1><p>Your secure verification code is:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</div><p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p></div>`,
      }, { idempotencyKey: `email-otp/${email}/${Math.floor(Date.now() / 60000)}` })
      if (!error) delivery = 'email'
      else deliveryError = error.message
    } else {
      deliveryError = 'RESEND_API_KEY is not configured'
    }
    if (delivery === 'demo') console.info('[v0] Email OTP demo fallback', { email, code, reason: deliveryError })
    return NextResponse.json({ ok: true, token, expiresAt: expires, delivery, demoCode: delivery === 'demo' ? code : undefined })
  } catch { return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 }) }
}

export async function PUT(request: Request) {
  try {
    const body = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/), token: z.string().min(20) }).parse(await request.json())
    const [encoded, signature] = body.token.split('.')
    const payload = Buffer.from(encoded, 'base64url').toString()
    if (sign(payload) !== signature) throw new Error('invalid token')
    const [tokenEmail, tokenCode, expires] = payload.split('.')
    if (tokenEmail !== body.email.trim().toLowerCase() || Number(expires) < Date.now()) throw new Error('invalid code')
    const mongo = await getMongo()
    const verification = await mongo.otpVerifications.findOne({ identifier: tokenEmail, channel: 'email', expiresAt: { $gt: new Date() } })
    const submittedHash = createHash('sha256').update(body.code).digest('hex')
    if (!verification || verification.attempts >= 5 || !timingSafeEqual(Buffer.from(verification.codeHash), Buffer.from(submittedHash))) {
      await mongo.otpVerifications.updateOne({ identifier: tokenEmail, channel: 'email' }, { $inc: { attempts: 1 } })
      throw new Error('invalid code')
    }
    await mongo.otpVerifications.updateOne({ identifier: tokenEmail, channel: 'email' }, { $set: { verifiedAt: new Date() }, $unset: { codeHash: '' } })
    await mongo.users.updateOne({ email: tokenEmail }, { $set: { verifiedStatus: true, updatedAt: new Date() } })
    return NextResponse.json({ ok: true, verified: true })
  } catch { return NextResponse.json({ ok: false, error: 'That code is invalid or expired.' }, { status: 400 }) }
}
