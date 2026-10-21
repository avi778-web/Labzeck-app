import { MongoClient } from 'mongodb'

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGO_URI
const options = {
  serverSelectionTimeoutMS: 5000, // 5 सेकंड में टाइमआउट हैंडल करने के लिए
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getMongo() {
  const dbClient = await clientPromise
  const db = dbClient.db('labzeck') // अपना डेटाबेस नाम यहाँ चेक कर लो
  return {
    client: dbClient,
    db,
    users: db.collection('users'),
  }
}
