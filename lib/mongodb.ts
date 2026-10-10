import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & { mongoClient?: MongoClient }

function getMongoClient() {
  const uri = process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI
  if (!uri) throw new Error('MongoDB connection string is not configured')
  const client = globalForMongo.mongoClient ?? new MongoClient(uri)
  if (process.env.NODE_ENV !== 'production') globalForMongo.mongoClient = client
  return client
}

export async function ensureMongoConnection() {
  const client = getMongoClient()
  await client.connect()
  const db = client.db(process.env.MONGODB_DATABASE || 'labzeck')
  return {
    db,
    users: db.collection('users'),
    aiUsage: db.collection('ai_usage'),
    feedback: db.collection('feedback'),
    payments: db.collection('payments'),
  }
}
