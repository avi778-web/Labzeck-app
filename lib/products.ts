export const SUBSCRIPTION_PLANS = {
  basic: { id: 'labzeck-basic', name: 'Labzeck Basic', priceInCents: 39900, description: 'AI access and trusted profile features' },
  pro: { id: 'labzeck-pro', name: 'Labzeck Pro', priceInCents: 69900, description: 'Priority discovery, AI access, and premium profile features' },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
