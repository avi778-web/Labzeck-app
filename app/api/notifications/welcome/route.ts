import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()
    if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ success: false, error: 'Valid email required.' }, { status: 400 })
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ success: false, configured: false, error: 'Email service is not configured.' }, { status: 503 })
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || 'Labzeck <no-reply@labzeck.dpds.org>', to: [email], subject: 'Welcome to Labzeck', html: `<div style="font-family:Arial,sans-serif"><h1>Welcome${name ? `, ${String(name).replace(/[<>]/g, '')}` : ''}</h1><p>Explore reliable work and trusted help on Labzeck.</p></div>` }) })
    const result = await response.json()
    if (!response.ok) return NextResponse.json({ success: false, error: result?.message || 'Email delivery failed.' }, { status: 502 })
    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('[Labzeck] welcome email failed', error)
    return NextResponse.json({ success: false, error: 'Email delivery failed.' }, { status: 500 })
  }
}
