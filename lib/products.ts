export const SUBSCRIPTION_PLANS = { basic: { id: 'labzeck-basic', name: 'Labzeck Basic', description: 'Verified profile and personal AI access', amountInr: 399, priceInCents: 39900 }, pro: { id: 'labzeck-pro', name: 'Labzeck Pro', description: 'Priority discovery, verified profile and personal AI access', amountInr: 699, priceInCents: 69900 } } as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS

export function getSubscriptionPlan(value: unknown) {
  return typeof value === 'string' && value in SUBSCRIPTION_PLANS ? SUBSCRIPTION_PLANS[value as SubscriptionPlan] : null
}

export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return getSubscriptionPlan(value) !== null
}

export function getSubscriptionPlanKey(value: unknown): SubscriptionPlan | null {
  return isSubscriptionPlan(value) ? value : null
}

export function getPlanById(id: string) {
  return Object.values(SUBSCRIPTION_PLANS).find((plan) => plan.id === id) ?? null
} 
