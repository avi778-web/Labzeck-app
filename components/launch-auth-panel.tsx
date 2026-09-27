'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, Sparkles, UsersRound } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

type Role = 'labour' | 'hirer'

export function LaunchAuthPanel({ onSuccess, onRole }: { language?: string; onSuccess?: (name?: string) => void; onRole?: (role: Role) => void }) {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(false)
  const [role, setRole] = useState<Role | ''>('')
  const [occupation, setOccupation] = useState('')
  const [experience, setExperience] = useState('')

  function changeMode(next: 'sign-in' | 'sign-up') {
    setMode(next); setError(''); setPassword('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = mode === 'sign-in'
        ? await authClient.signIn.email({ email: email.trim().toLowerCase(), password })
        : await authClient.signUp.email({ email: email.trim().toLowerCase(), password, name: name.trim() })
      if (result.error) {
        setError(mode === 'sign-in' ? 'Email or password is incorrect.' : 'This email may already be registered, or the details are invalid.')
        return
      }
      setName((mode === 'sign-in' ? result.data?.user?.name : name) || 'Labzeck member')
      setProfile(true)
    } catch {
      setError('Unable to connect. Please check your internet and try again.')
    } finally { setLoading(false) }
  }

  function chooseRole(nextRole: Role) {
    setRole(nextRole)
    if (nextRole === 'hirer') finish(nextRole)
  }

  function finish(nextRole: Role = role as Role) {
    onRole?.(nextRole)
    document.cookie = `labzeck_role=${nextRole}; path=/; max-age=31536000; samesite=lax`
    onSuccess?.(name)
    router.push('/')
    router.refresh()
  }

  if (profile) return <div className="auth-panel profile-onboarding auth-motion">
    <div className="role-welcome"><span className="step-chip"><Sparkles size={12} /> PERSONALIZE YOUR START</span><h2>How will you use <em>Labzeck</em>?</h2><p>Pick your path and we&apos;ll tailor your experience.</p></div>
    <div className="role-choice">
      <button type="button" className={`role-card ${role === 'labour' ? 'selected' : ''}`} onClick={() => chooseRole('labour')}><span className="role-icon"><BriefcaseBusiness size={21} /></span><span><strong>I&apos;m a Labour</strong><small>Find work, show your skills, earn more</small></span><ArrowRight size={18} /></button>
      <button type="button" className="role-card" onClick={() => chooseRole('hirer')}><span className="role-icon"><UsersRound size={21} /></span><span><strong>I want to Hire</strong><small>Find trusted help for your next job</small></span><ArrowRight size={18} /></button>
    </div>
    {role === 'labour' && <form className="form-stack auth-detail-form" onSubmit={(event) => { event.preventDefault(); if (!occupation || !experience) return setError('Please complete your work details.'); finish('labour') }}><label>Occupation<select value={occupation} onChange={event => setOccupation(event.target.value)} required><option value="">Select occupation</option><option>Electrician</option><option>Plumber</option><option>Mason</option><option>Chef</option><option>Other</option></select></label><label>Experience<select value={experience} onChange={event => setExperience(event.target.value)} required><option value="">Select experience</option><option>Less than 1 year</option><option>1–5 years</option><option>5–10 years</option><option>10+ years</option></select></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit">Continue to Labzeck <ArrowRight size={17} /></button></form>}
  </div>

  return <div className="auth-panel auth-motion">
    <div className="auth-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'active' : ''} onClick={() => changeMode('sign-in')}>Sign in</button><button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'active' : ''} onClick={() => changeMode('sign-up')}>Sign up</button></div>
    <form onSubmit={submit} className="form-stack auth-form">
      {mode === 'sign-up' && <label>Full name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Riya Sharma" autoComplete="name" required /></label>}
      <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
      <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      {mode === 'sign-up' && <label className="consent-row"><input type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} required /><span>I agree to the Privacy Policy and Terms of Service.</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="primary wide auth-submit" disabled={loading}>{loading ? <><span className="button-spinner" /> Signing you in…</> : mode === 'sign-in' ? 'Sign in securely' : 'Create my account'} {!loading && <ArrowRight size={17} />}</button>
    </form>
  </div>
}
