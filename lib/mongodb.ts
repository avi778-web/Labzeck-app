import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & { labzeckMongo?: MongoClient }

export async function getMongo() {
  const uri = process.env.MONGODB_CONNECTION_STRING_3 || process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI
  if (!uri) throw new Error('MongoDB is not configured')
  const client = globalForMongo.labzeckMongo ?? new MongoClient(uri)
  if (process.env.NODE_ENV !== 'production') globalForMongo.labzeckMongo = client
  await client.connect()
  const db = client.db(process.env.MONGODB_DATABASE || 'labzeck')
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
  }
}
