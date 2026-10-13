export const SUBSCRIPTION_PLANS = { basic: { id: 'labzeck-basic', name: 'Labzeck Verified', description: 'Blue tick, top search rank, ad-free experience and unlimited AI assistant', amountInr: 399, priceInCents: 39900, hasBlueTick: true, adFree: true, unlimitedAi: true }, pro: { id: 'labzeck-pro', name: 'Labzeck VIP Gold', description: 'Everything in Verified plus profile views, gold frame and direct CEO & CTO access', amountInr: 699, priceInCents: 69900, hasBlueTick: true, adFree: true, unlimitedAi: true, goldFrame: true, profileViews: true, ceoCtoAccess: true } } as const

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
