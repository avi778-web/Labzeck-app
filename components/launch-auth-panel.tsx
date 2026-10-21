'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, Mail, Phone, Sparkles, UsersRound } from 'lucide-react'


type Role = 'labour' | 'hirer'
type GoogleIdentity = { accounts: { id: { initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void; prompt: (listener?: (notification: { isNotDisplayed: () => boolean; getNotDisplayedReason: () => string; isSkippedMoment: () => boolean; getSkippedReason: () => string }) => void) => void; renderButton: (element: HTMLElement, options: { type: string; theme: string; size: string; text: string; width: number }) => void } } }
declare global { interface Window { google?: { accounts: { id: GoogleIdentity['accounts']['id'] } } } }

export function LaunchAuthPanel({ onSuccess, onRole }: { language?: string; onSuccess?: (name?: string) => void; onRole?: (role: Role) => void }) {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up')
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
  const [phoneSheet, setPhoneSheet] = useState(false)
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpToken, setEmailOtpToken] = useState('')
  const [emailCountdown, setEmailCountdown] = useState(300)
  const [emailVerified, setEmailVerified] = useState(false)
  const [countdown, setCountdown] = useState(300)
  const [googleLoading, setGoogleLoading] = useState(false)
  const emailFieldRef = useRef<HTMLInputElement>(null)
  const emailOtpPanelRef = useRef<HTMLDivElement>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim().replace(/^['"]|['"]$/g, '')

  async function handleGoogleCredential(credential: string) {
    setError(''); setGoogleLoading(true)
    try {
      const response = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Google sign-in failed.')
      setName(data.user?.name || 'Labzeck member'); setEmail(data.user?.email || ''); setProfile(true)
    } catch (error) { setError(error instanceof Error ? error.message : 'Google sign-in failed.') } finally { setGoogleLoading(false) }
  }

  function startGoogleSignIn() {
    setError('')
    if (!googleClientId) { setError('Google sign-in is not configured yet. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID.'); return }
      const google = window.google
    if (!google) { setError('Google sign-in is still loading. Please try again.'); return }
    google.accounts.id.initialize({ client_id: googleClientId, callback: response => void handleGoogleCredential(response.credential) })
    google.accounts.id.prompt(notification => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const reason = notification.getNotDisplayedReason() || notification.getSkippedReason()
        setError(reason === 'unregistered_origin' ? 'This domain is not authorized in Google Cloud Console.' : 'Google account picker could not open. Check the OAuth Client ID and authorized origins.')
      }
    })
  }

  useEffect(() => { if (!otpSent || countdown <= 0) return; const timer = window.setInterval(() => setCountdown(value => value - 1), 1000); return () => window.clearInterval(timer) }, [otpSent, countdown])
  useEffect(() => { if (!emailOtpSent || emailCountdown <= 0) return; const timer = window.setInterval(() => setEmailCountdown(value => value - 1), 1000); return () => window.clearInterval(timer) }, [emailOtpSent, emailCountdown])

  function scrollToAuthTarget(target: HTMLElement | null) {
    window.requestAnimationFrame(() => target?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  async function sendEmailOtp() {
    setError(''); setLoading(true)
    scrollToAuthTarget(emailFieldRef.current)
    try { const response = await fetch('/api/otp/email/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setEmailOtpToken(data.token); setEmailDelivery('email'); setEmailOtpSent(true); setEmailCountdown(300); window.requestAnimationFrame(() => emailOtpPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })) } catch (error) { setError(error instanceof Error ? error.message : 'Unable to send verification email.') } finally { setLoading(false) }
  }
  async function verifyEmailOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true)
    try { const response = await fetch('/api/otp/email/send', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, code:emailOtp, token:emailOtpToken }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setEmailVerified(true); setEmailOtpSent(false); setError('Email verified. You can now create your Labzeck account.') } catch (error) { setError(error instanceof Error ? error.message : 'Verification failed.') } finally { setLoading(false) }
  }

  async function sendOtp(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); try { const normalized = phone.replace(/\s/g, ''); const fullPhone = normalized.startsWith('+') ? normalized : `${countryCode}${normalized}`; const response = await fetch('/api/auth/send-phone-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fullPhone }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPhone(fullPhone); setOtpSent(true); setCountdown(300) } catch (error) { setError(error instanceof Error ? error.message : 'Unable to send code.') } }
  async function verifyOtp(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); try { const response = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code: otp }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPhoneSheet(false); setError('Phone verified successfully. You can finish account setup below.') } catch (error) { setError(error instanceof Error ? error.message : 'Verification failed.') } }

  function changeMode(next: 'sign-in' | 'sign-up') {
    setMode(next); setError(''); setPassword('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); if (mode === 'sign-up' && !emailVerified) { setError('Verify your email with OTP before creating your account.'); return } setLoading(true)
    try {
      const response = await fetch(mode === 'sign-in' ? '/api/mongo-auth/signin' : '/api/mongo-auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name.trim(), verifiedStatus: emailVerified, authProvider: 'credentials' }) })
      const result = await response.json() as { success?: boolean; message?: string; user?: { name?: string } }
      if (!response.ok || !result.success) { setError(result.message || (mode === 'sign-in' ? 'Email or password is incorrect.' : 'This email may already be registered, or the details are invalid.')); return }
      setName(result.user?.name || name || 'Labzeck member')
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


  if (emailOtpSent) return <div ref={emailOtpPanelRef} className="auth-panel auth-motion auth-sheet-view"><div className="sheet-grabber" /><span className="step-chip email-verification-badge"><span className="email-badge-icon"><Mail size={25}/></span><span>EMAIL VERIFICATION</span></span><h2>Verify your email</h2><p className="sheet-copy">We sent a secure 6-digit code to {email}.</p><form className="form-stack" onSubmit={verifyEmailOtp}><label>Verification code<input className="otp-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={emailOtp} onChange={event=>setEmailOtp(event.target.value.replace(/\D/g,''))} placeholder="000000" disabled={emailCountdown <= 0} required /></label><p className="otp-countdown">{emailCountdown > 0 ? `${String(Math.floor(emailCountdown / 60)).padStart(2,'0')}:${String(emailCountdown % 60).padStart(2,'0')} remaining` : <button type="button" className="text-button" onClick={sendEmailOtp}>Resend code</button>}</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit" disabled={loading}>{loading ? 'Checking code…' : 'Verify email'} <ArrowRight size={17}/></button></form></div>

  if (phoneSheet) return <div className="auth-panel auth-motion auth-sheet-view"><div className="sheet-grabber" /><h2>{otpSent ? 'Verify your phone' : 'Verify your phone number'}</h2><p className="sheet-copy">{otpSent ? `We sent a 6-digit code to ${phone}.` : 'Use your India mobile number to secure your Labzeck account.'}</p>{otpSent ? <form className="form-stack" onSubmit={verifyOtp}><label>6-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} disabled={countdown <= 0} onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="000000" required /></label><p className="otp-countdown">{countdown > 0 ? `Resend available in ${countdown}s` : <button type="button" className="text-button" onClick={() => { setOtpSent(false); setOtp('') }}>Resend code</button>}</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit">Verify phone <ArrowRight size={17}/></button></form> : <form className="form-stack" onSubmit={sendOtp}><label>Mobile number<div className="phone-number-row"><select aria-label="Country code" value={countryCode} onChange={event=>setCountryCode(event.target.value)}><option value="+91">IN +91</option><option value="+1">US +1</option><option value="+44">UK +44</option><option value="+971">UAE +971</option></select><input inputMode="tel" value={phone} onChange={event => setPhone(event.target.value.replace(/[^0-9+ ]/g, ''))} placeholder="98765 43210" required /></div></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit">Send verification code <ArrowRight size={17}/></button></form>}</div>

  return <div className={`auth-panel auth-motion auth-${mode}`}>
    <div className="auth-provider-heading"><h2>Welcome to <em>Labzeck</em></h2><p>Get started by signing in to your account</p></div>
    <div className="auth-providers"><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" /><button type="button" className="provider-button" onClick={startGoogleSignIn} disabled={googleLoading}><span className="google-mark">G</span> {googleLoading ? 'Opening Google…' : 'Continue with Google'}</button><button type="button" className="provider-button" onClick={() => { setError(''); if (!email.trim()) { scrollToAuthTarget(emailFieldRef.current); setError('Enter a valid email address.'); } else void sendEmailOtp() }} disabled={loading}><Mail size={17}/> {loading ? 'Sending verification…' : 'Verify email with OTP'}</button><button type="button" className="provider-button" onClick={() => { setError(''); setPhoneSheet(true) }}><Phone size={17}/> Continue with phone</button></div>
    <div className="auth-divider"><span>or use email</span></div>
    <div className="auth-tabs" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'active' : ''} onClick={() => changeMode('sign-in')}>Sign in</button><button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'active' : ''} onClick={() => changeMode('sign-up')}>Sign up</button></div>
    <div className="auth-heading"><span className="auth-status-dot" /> <span>{mode === 'sign-in' ? 'Access your account' : 'Create your account'}</span></div>
    <form onSubmit={submit} className="form-stack auth-form">
      {mode === 'sign-up' && <label className="auth-field auth-field-one">Full name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Riya Sharma" autoComplete="name" required /></label>}
      <label className="auth-field auth-field-two">Email address<input ref={emailFieldRef} type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
      <label className="auth-field auth-field-three">Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      {mode === 'sign-up' && <label className="consent-row"><input type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} required /><span>I agree to the Privacy Policy and Terms of Service.</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="primary wide auth-submit" disabled={loading}>{loading ? <><span className="button-spinner" /> {mode === 'sign-in' ? 'Signing you in…' : 'Creating account…'}</> : mode === 'sign-in' ? 'Sign in securely' : 'Create my account'} {!loading && <ArrowRight size={17} />}</button>
    </form>
  </div>
}
