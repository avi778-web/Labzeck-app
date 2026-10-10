import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { z } from 'zod'

const schema = z.object({ phone: z.string(), code: z.string().regex(/^\d{4,8}$/) })

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const result = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!).verificationChecks.create({ to: body.phone, code: body.code })
    if (result.status !== 'approved') return NextResponse.json({ ok: false, error: 'That code is not valid.' }, { status: 401 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] OTP verification failed', error)
    return NextResponse.json({ ok: false, error: 'Verification failed. Please request a new code.' }, { status: 400 })
  }
}
