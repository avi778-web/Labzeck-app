import { NextResponse } from 'next/server'
import { createHmac, randomInt } from 'node:crypto'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({ email: z.string().email().transform(value => value.trim().toLowerCase()) })
const secret = () => process.env.BETTER_AUTH_SECRET || process.env.RESEND_API_KEY || 'labzeck-otp-secret'

function sign(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url') }

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json())
    const code = randomInt(100000, 1000000).toString()
    const expires = Date.now() + 10 * 60 * 1000
    const payload = `${email}.${code}.${expires}`
    const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'Labzeck <labzeck@zohomail.in>',
      to: [email],
      subject: 'Your Labzeck verification code',
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto"><h1 style="color:#2563eb">Labzeck</h1><p>Your secure verification code is:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</div><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
    }, { idempotencyKey: `email-otp/${email}/${Math.floor(Date.now() / 60000)}` })
    if (error) return NextResponse.json({ ok: false, error: 'We could not send the verification email. Please try again.' }, { status: 502 })
    return NextResponse.json({ ok: true, token, expiresAt: expires })
  } catch { return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 }) }
}

export async function PUT(request: Request) {
  try {
    const body = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/), token: z.string().min(20) }).parse(await request.json())
    const [encoded, signature] = body.token.split('.')
    const payload = Buffer.from(encoded, 'base64url').toString()
    if (sign(payload) !== signature) throw new Error('invalid token')
    const [tokenEmail, tokenCode, expires] = payload.split('.')
    if (tokenEmail !== body.email.trim().toLowerCase() || tokenCode !== body.code || Number(expires) < Date.now()) throw new Error('invalid code')
    return NextResponse.json({ ok: true, verified: true })
  } catch { return NextResponse.json({ ok: false, error: 'That code is invalid or expired.' }, { status: 400 }) }
}
