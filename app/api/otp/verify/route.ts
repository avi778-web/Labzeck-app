import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { getMongo } from '@/lib/mongodb'

const schema = z.object({ phone: z.string(), code: z.string().regex(/^\d{6}$/) })

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const mongo = await getMongo()
    let approved = false
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      const result = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: body.phone, code: body.code })
      approved = result.status === 'approved'
    } else {
      const record = await mongo.otpVerifications.findOne({ identifier: body.phone, channel: 'phone', expiresAt: { $gt: new Date() } })
      const submittedHash = createHash('sha256').update(body.code).digest('hex')
      approved = Boolean(record && record.attempts < 5 && timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(submittedHash)))
      if (record && !approved) await mongo.otpVerifications.updateOne({ identifier: body.phone, channel: 'phone' }, { $inc: { attempts: 1 } })
    }
    if (!approved) return NextResponse.json({ ok: false, error: 'That code is not valid.' }, { status: 401 })
    await mongo.users.updateOne({ phone: body.phone }, { $set: { verifiedStatus: true, updatedAt: new Date() }, $setOnInsert: { phone: body.phone, name: body.phone, authProvider: 'credentials', createdAt: new Date() } }, { upsert: true })
    const user = await mongo.users.findOne({ phone: body.phone }, { projection: { _id: 1 } })
    await mongo.otpVerifications.updateOne({ identifier: body.phone, channel: 'phone' }, { $set: { verifiedAt: new Date() }, $unset: { codeHash: '' } })
    const response = NextResponse.json({ ok: true, verified: true })
    if (user?._id) response.cookies.set('labzeck_user_id', user._id.toString(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return response
  } catch (error) {
    console.error('❌ Phone OTP verification error:', error)
    return NextResponse.json({ ok: false, error: 'Verification failed. Please request a new code.' }, { status: 400 })
  }
}
