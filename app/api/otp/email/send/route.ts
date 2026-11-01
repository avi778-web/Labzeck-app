import { NextResponse } from 'next/server'
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { getMongo } from '@/lib/mongodb'

const schema = z.object({ email: z.string().email().transform(value => value.trim().toLowerCase()) })
const secret = () => process.env.BETTER_AUTH_SECRET || (() => { throw new Error('BETTER_AUTH_SECRET is not configured') })()

function sign(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url') }

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json())
    const code = randomInt(100000, 1000000).toString()
    const expires = Date.now() + 5 * 60 * 1000
    const payload = `${email}.${code}.${expires}`
    const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
    const resendKey = process.env.RESEND_EMAIL_RESEND_API_KEY || (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_resend_api_key_here') ? process.env.RESEND_API_KEY : undefined)
    const configuredDomain = (process.env.RESEND_EMAIL_DOMAIN?.trim() || 'labzeck.dpds.org').replace(/^https?:\/\//, '').replace(/\/$/, '')
    const sender = process.env.RESEND_FROM_EMAIL?.trim() || `Labzeck <no-reply@${configuredDomain}>`
    if (!resendKey || !sender) return NextResponse.json({ ok: false, error: 'Email delivery is not configured. Add a verified Resend sender domain.' }, { status: 503 })
    try {
      const domainsResponse = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${resendKey}` }, cache: 'no-store' })
      if (domainsResponse.ok) {
        const domains = await domainsResponse.json() as { data?: Array<{ name?: string; status?: string }> }
        const domain = domains.data?.find(item => item.name?.toLowerCase() === configuredDomain.toLowerCase())
        if (!domain || domain.status !== 'verified') return NextResponse.json({ ok: false, error: `Resend domain ${configuredDomain} is not verified yet. Complete its DNS verification before requesting an OTP.` }, { status: 503 })
      }
    } catch (error) { console.error('[Labzeck] Resend domain preflight failed:', error) }
    let deliveryError = ''
    try {
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `email-otp/${email}/${Math.floor(Date.now() / 60000)}` }, body: JSON.stringify({ from: sender, to: [email], subject: 'Your Labzeck verification code', html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto"><h1 style="color:#2563eb">Labzeck</h1><p>Your secure verification code is:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</div><p>This code expires in 5 minutes.</p></div>` }) })
      if (!response.ok) { const body = await response.text().catch(() => ''); console.error('[Labzeck] Resend OTP rejected:', response.status, body); let resendMessage = ''; try { const parsed = JSON.parse(body); resendMessage = parsed?.message || parsed?.name || '' } catch {} const domainFailed = /domain|sender|from/i.test(`${resendMessage} ${body}`) && /fail|verify|valid|not authorized/i.test(`${resendMessage} ${body}`); deliveryError = domainFailed ? 'Resend rejected the sender. Verify labzeck.dpds.org in Resend, then use a sender from that verified domain.' : response.status === 403 ? 'Resend rejected this sender. Verify the sender domain and DNS records.' : response.status === 401 ? 'The Resend API key is invalid.' : resendMessage ? `Resend: ${resendMessage}` : `Resend rejected the message (${response.status}).` }
    } catch (error) { deliveryError = error instanceof Error ? error.message : 'Resend request failed' }
    if (deliveryError) return NextResponse.json({ ok: false, error: deliveryError }, { status: 502 })
    const mongo = await getMongo()
    await mongo.otpVerifications.updateOne({ identifier: email, channel: 'email' }, { $set: { identifier: email, channel: 'email', codeHash: createHash('sha256').update(code).digest('hex'), expiresAt: new Date(expires), attempts: 0, createdAt: new Date() } }, { upsert: true })
    return NextResponse.json({ ok: true, token, expiresAt: expires, delivery: 'email' })
  } catch (error) {
    console.error('[Labzeck] Email OTP request failed:', error)
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, error: error.issues[0]?.message || 'Enter a valid email address.' }, { status: 422 })
    return NextResponse.json({ ok: false, error: 'Unable to send verification code. Please try again.' }, { status: 500 })
  }
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
    await mongo.users.updateOne({ email: tokenEmail }, { $set: { verifiedStatus: true, updatedAt: new Date() }, $setOnInsert: { email: tokenEmail, name: tokenEmail.split('@')[0], authProvider: 'credentials', createdAt: new Date() } }, { upsert: true })
    return NextResponse.json({ ok: true, verified: true })
  } catch (error) { console.error('[Labzeck] Email OTP verification failed:', error); return NextResponse.json({ ok: false, error: 'That code is invalid or expired.' }, { status: 400 }) }
}
