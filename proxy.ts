import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/api/profile/(.*)', '/api/addresses/(.*)', '/api/payout-method/(.*)', '/api/payments/(.*)', '/api/admin/(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/(.*)'],
}
