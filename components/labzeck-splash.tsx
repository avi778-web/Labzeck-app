'use client'

import { useEffect, useState } from 'react'

export function LabzeckSplash() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 700)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return <div className="labzeck-splash" role="status" aria-label="Loading Labzeck"><div className="labzeck-splash-mark"><img src="/labzeck-logo.png" alt="Labzeck" /></div><strong><span>Lab</span>zeck</strong><i /></div>
}
