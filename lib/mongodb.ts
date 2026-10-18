import { MongoClient } from 'mongodb'
import { ensureMongoSchema } from '@/lib/mongo-models'

const globalForMongo = globalThis as typeof globalThis & { labzeckMongo?: MongoClient; labzeckMongoPromise?: Promise<MongoClient> }

export async function getMongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_CONNECTION_STRING_3
  if (!uri) throw new Error('MongoDB is not configured. Set MONGODB_URI or MONGODB_CONNECTION_STRING.')
  const client = globalForMongo.labzeckMongo ?? new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
  if (!globalForMongo.labzeckMongoPromise) {
    globalForMongo.labzeckMongoPromise = client.connect().then((connected) => {
      globalForMongo.labzeckMongo = connected
      console.log('[Labzeck] Database connected successfully')
      return connected
    }).catch((error) => {
      globalForMongo.labzeckMongoPromise = undefined
      console.error('[Labzeck] Database connection failed:', error instanceof Error ? error.message : error)
      throw error
    })
  }
  const connectedClient = await globalForMongo.labzeckMongoPromise
  const db = connectedClient.db(process.env.MONGODB_DATABASE || 'labzeck')
  await ensureMongoSchema(db)
  return {
    db,
    users: db.collection('users'),
    hirers: db.collection('hirers'),
    labourers: db.collection('labourers'),
    locations: db.collection('user_locations'),
    payoutMethods: db.collection('payout_methods'),
    subscriptions: db.collection('subscriptions'),
    jobs: db.collection('job_requests'),
    aiUsage: db.collection('ai_usage'),
    avatars: db.collection('profile_avatars'),
    devices: db.collection('user_devices'),
    notifications: db.collection('notifications'),
  }
}
