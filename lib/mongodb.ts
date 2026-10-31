import { MongoClient } from 'mongodb'
import { ensureMongoSchema } from '@/lib/mongo-models'

const globalForMongo = globalThis as typeof globalThis & {
  labzeckMongo?: MongoClient
  labzeckMongoPromise?: Promise<MongoClient>
}

export async function getMongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING_10 || process.env.MONGODB_CONNECTION_STRING
  if (!uri) throw new Error('MongoDB is not configured. Please set MONGODB_URI in environment variables.')

  if (!globalForMongo.labzeckMongoPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 })
    globalForMongo.labzeckMongoPromise = client.connect().then((connectedClient) => {
      globalForMongo.labzeckMongo = connectedClient
      return connectedClient
    }).catch((error) => {
      globalForMongo.labzeckMongoPromise = undefined
      globalForMongo.labzeckMongo = undefined
      throw error
    })
  }

  const client = await globalForMongo.labzeckMongoPromise
  const db = client.db(process.env.MONGODB_DATABASE || 'labzeck')
  ensureMongoSchema(db).catch((error) => console.error('[Labzeck] Mongo schema setup failed:', error))
  return {
    client,
    db,
    users: db.collection('users'),
    otpVerifications: db.collection('otp_verifications'),
    hirers: db.collection('hirers'),
    labourers: db.collection('labourers'),
    locations: db.collection('locations'),
    payoutMethods: db.collection('payout_methods'),
  }
}
