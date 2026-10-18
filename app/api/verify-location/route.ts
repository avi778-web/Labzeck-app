import { NextResponse } from 'next/server'

const unavailable = 'Service Not Available in Your Area. We currently operate only in New Kondli, Delhi NCR, and Khoda.'
const regions = [
  { name: 'New Kondli', keywords: ['new kondli', 'kondli'], lat: [28.58, 28.66], lng: [77.28, 77.37] },
  { name: 'Delhi NCR', keywords: ['delhi', 'delhi ncr', 'noida', 'ghaziabad', 'mayur vihar'], lat: [28.35, 28.88], lng: [76.84, 77.55] },
  { name: 'Khoda', keywords: ['khoda', 'khora'], lat: [28.60, 28.67], lng: [77.34, 77.42] },
]

export async function POST(request: Request) {
  try {
    const body = await request.json() as { lat?: number; lng?: number; address?: string }
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    const text = String(body.address || '').trim().toLowerCase()
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return NextResponse.json({ serviceable: false, error: unavailable }, { status: 403 })
    const region = regions.find(item => item.keywords.some(keyword => text.includes(keyword)) || (Number.isFinite(lat) && Number.isFinite(lng) && lat >= item.lat[0] && lat <= item.lat[1] && lng >= item.lng[0] && lng <= item.lng[1]))
    if (!region) return NextResponse.json({ serviceable: false, error: unavailable }, { status: 403 })
    return NextResponse.json({ serviceable: true, region: region.name, coordinates: { lat, lng } })
  } catch { return NextResponse.json({ serviceable: false, error: unavailable }, { status: 403 }) }
}
