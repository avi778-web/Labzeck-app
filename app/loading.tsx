'use client'

export default function Loading() {
  return (
    <main className="app-loading" aria-live="polite" aria-busy="true">
      <div className="app-loading-card">
        <img src="/labzeck-logo.png" alt="Labzeck" />
        <div className="app-loading-spinner" aria-hidden="true" />
        <h1>Labzeck</h1>
        <p>Getting things ready for you…</p>
      </div>
    </main>
  )
}
