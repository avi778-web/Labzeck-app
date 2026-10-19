import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getMongo } from '@/lib/mongodb'

const addressSchema = z.object({
  addressType: z.enum(['Home', 'Office', 'Company Residence']),
  friendlyName: z.string().trim().min(1).max(80),
  addressDetails: z.string().trim().min(5).max(500),
  homeOwnerName: z.string().trim().max(120).optional(),
  officeContactPerson: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(160).optional(),
  residentEmployeeName: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    const address = addressSchema.parse(await request.json())
    const mongo = await getMongo()
    await mongo.users.updateOne({ email: session.user.email }, { $push: { savedAddresses: { addressId: randomUUID(), ...address } }, $set: { updatedAt: new Date() } })
    return NextResponse.json({ success: true, message: 'Address saved successfully' })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof z.ZodError ? 'Invalid address details' : 'Address could not be saved' }, { status: 400 })
  }
}
