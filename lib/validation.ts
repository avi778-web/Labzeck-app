import { z } from 'zod'

export const objectId = z.string().min(1).max(128)
export const coordinates = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
export const labourProfile = z.object({ name: z.string().trim().min(2).max(80), occupation: z.string().trim().min(2).max(80), skills: z.array(z.string().trim().min(1).max(50)).max(20).default([]), experience: z.string().max(40).default(''), dailyRate: z.number().int().min(500).max(100000), availabilityStatus: z.enum(['available','busy','offline']).default('available'), location: coordinates.optional(), verificationStatus: z.enum(['pending','verified','rejected']).default('pending'), avatar: z.string().max(200000).optional() })
export const jobRequest = z.object({ labourId: objectId, title: z.string().trim().min(3).max(120), description: z.string().trim().min(5).max(2000), proposedRate: z.number().int().min(500).max(100000), schedule: z.string().trim().min(2).max(120), location: coordinates })
export const jobDecision = z.object({ status: z.enum(['accepted','rejected','countered']), negotiatedRate: z.number().int().min(500).max(100000).optional() })
export const aiMessage = z.object({ message: z.string().trim().min(1).max(2000) })
export const avatarUpdate = z.object({ avatar: z.string().max(200000) })
