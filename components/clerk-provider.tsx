'use client'

import { ClerkProvider } from '@clerk/nextjs'

export function LabzeckClerkProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>
}
