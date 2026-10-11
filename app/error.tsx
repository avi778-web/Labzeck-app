'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the route recoverable after a transient network or server error.
    console.error('[v0] App route error', error)
  }, [error])

  return (
    <main className="app-loading" role="alert">
      <div className="app-loading-card">
        <img src="/labzeck-logo.png" alt="Labzeck" />
        <h1>Labzeck is reconnecting</h1>
        <p>There was a temporary network problem. Your data is safe.</p>
        <button className="primary loading-retry" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  )
}
