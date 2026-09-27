import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { z } from 'zod'

const schema = z.object({ phone: z.string().regex(/^\+?[1-9]\d{9,14}$/) })

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!).verifications.create({ to: body.phone, channel: 'sms' })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] OTP send failed', error)
    return NextResponse.json({ ok: false, error: 'Unable to send code. Check the number and try again.' }, { status: 400 })
  }
}
