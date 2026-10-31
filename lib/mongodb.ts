import { MongoClient } from 'mongodb'
<<<<<<< HEAD
import { ensureMongoSchema } from '@/lib/mongo-models'

const globalForMongo = globalThis as typeof globalThis & {
  labzeckMongo?: MongoClient
  labzeckMongoPromise?: Promise<MongoClient>
}

export async function getMongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING_10 || process.env.MONGODB_CONNECTION_STRING
  if (!uri) {
    throw new Error('MongoDB is not configured. Please set MONGODB_URI in environment variables.')
  }

  if (globalForMongo.labzeckMongo) {
    const db = globalForMongo.labzeckMongo.db(process.env.MONGODB_DATABASE || 'labzeck')
    return getCollections(db)
  }

  if (!globalForMongo.labzeckMongoPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    globalForMongo.labzeckMongoPromise = client.connect()
      .then((connectedClient) => {
        globalForMongo.labzeckMongo = connectedClient
        console.log('✅ MongoDB Connected Successfully')
        return connectedClient
      })
      .catch((error) => {
        globalForMongo.labzeckMongoPromise = undefined
        globalForMongo.labzeckMongo = undefined
        console.error('❌ MongoDB Connection Error:', error instanceof Error ? error.message : error)
        throw error
      })
  }

  const connectedClient = await globalForMongo.labzeckMongoPromise
  const db = connectedClient.db(process.env.MONGODB_DATABASE || 'labzeck')
  ensureMongoSchema(db).catch((error) => console.error('Schema ensure error:', error))

  return getCollections(db)
}

function getCollections(db: ReturnType<MongoClient['db']>) {
  return {
    client: dbClient,
    db,
    users: db.collection('users'),
  }
}
