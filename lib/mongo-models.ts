import type { Db, ObjectId } from 'mongodb'

export type AuthProvider = 'credentials' | 'google'

export type UserDocument = {
  _id?: ObjectId
  name: string
  email: string
  phone?: string
  passwordHash?: string
  verifiedStatus: boolean
  authProvider: AuthProvider
  createdAt: Date
  updatedAt: Date
  location?: { address: string; city: string; region: string; coordinates: { lat: number; lng: number }; isServiceable: boolean; verifiedAt: Date }
  savedAddresses?: SavedAddress[]
  preferences?: { language?: string }
}

export type BankDetailDocument = {
  _id?: ObjectId
  userId: ObjectId
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  createdAt: Date
  updatedAt: Date
}

export type OtpVerificationDocument = {
  _id?: ObjectId
  identifier: string
  channel: 'email' | 'phone'
  codeHash: string
  expiresAt: Date
  attempts: number
  verifiedAt?: Date
  createdAt: Date
}

export type SavedAddress = {
  addressId: string
  addressType: 'Home' | 'Office' | 'Company Residence'
  friendlyName: string
  addressDetails: string
  homeOwnerName?: string
  officeContactPerson?: string
  companyName?: string
  residentEmployeeName?: string
}

export type PaymentDocument = {
  _id?: ObjectId
  userId: ObjectId
  transactionId: string
  amount: number
  paymentMethod: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: Date
  updatedAt: Date
}

export async function ensureMongoSchema(db: Db) {
  await Promise.all([
    db.collection<UserDocument>('users').createIndex({ email: 1 }, { unique: true, name: 'users_email_unique' }),
    db.collection<UserDocument>('users').createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'users_phone_unique' }),
    db.collection<BankDetailDocument>('bank_details').createIndex({ userId: 1 }, { unique: true, name: 'bank_details_user_unique' }),
    db.collection<PaymentDocument>('payments').createIndex({ userId: 1, createdAt: -1 }, { name: 'payments_user_created' }),
    db.collection<PaymentDocument>('payments').createIndex({ transactionId: 1 }, { unique: true, name: 'payments_transaction_unique' }),
    db.collection<OtpVerificationDocument>('otp_verifications').createIndex({ identifier: 1, channel: 1 }, { unique: true, name: 'otp_identifier_channel_unique' }),
    db.collection<OtpVerificationDocument>('otp_verifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'otp_expiry_ttl' }),
    db.createCollection('users').catch(() => undefined),
    db.createCollection('otps').catch(() => undefined),
    db.createCollection('addresses').catch(() => undefined),
  ])
}
