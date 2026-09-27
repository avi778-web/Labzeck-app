import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const plan = body.plan === '₹699' ? '699' : body.plan === '₹399' ? '399' : ''
    const payerName = typeof body.payerName === 'string' ? body.payerName.trim() : ''
    const utr = typeof body.utr === 'string' ? body.utr.trim() : ''
    const userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : 'demo-user'
    if (!plan || !payerName || !utr || utr.length < 6) return NextResponse.json({ ok: false, error: 'Plan, payer name and valid UTR are required.' }, { status: 400 })
    await pool.query('INSERT INTO subscription_requests (user_id, plan, payer_name, utr) VALUES ($1, $2, $3, $4)', [userId, plan, payerName, utr])
    return NextResponse.json({ ok: true, status: 'pending' })
  } catch (error) {
    console.error('[v0] subscription request failed', error)
    return NextResponse.json({ ok: false, error: 'Could not submit request. Please try again.' }, { status: 500 })
  }
}
