import { NextResponse } from 'next/server'
import { getMongo } from '@/lib/mongodb'

export async function GET(request: Request) { try { const userId = new URL(request.url).searchParams.get('userId'); if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 }); const { subscriptions } = await getMongo(); return NextResponse.json({ subscriptions: await subscriptions.find({ userId }).sort({ createdAt: -1 }).toArray() }) } catch { return NextResponse.json({ error: 'Unable to load subscriptions' }, { status: 500 }) } }
