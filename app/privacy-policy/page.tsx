import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <main className="policy-page">
      <div className="policy-inner">
        <Link href="/" className="back"><ArrowLeft size={17}/> Back to Labzeck</Link>
        <div className="policy-icon"><ShieldCheck size={25}/></div>
        <p className="eyebrow">LABZECK TRUST CENTRE</p>
        <h1>Privacy Policy</h1>
        <p className="policy-intro">Your trust matters. This policy explains what Labzeck collects, why we use it, and the choices you have.</p>
        <section className="policy-card"><h2>1. Information we collect</h2><p>We collect your name, phone number, email address, city, occupation, profile details and location when you choose to share them. We also receive payment reference details when you submit a subscription request.</p></section>
        <section className="policy-card"><h2>2. How we use information</h2><p>We use this information to create your account, show relevant nearby work, connect hirers and workers, verify requests, improve safety, and process subscription approvals.</p></section>
        <section className="policy-card"><h2>3. Location and visibility</h2><p>Location helps us show nearby opportunities. You control whether your profile is online and whether contact details are visible. You can turn these controls off from your profile.</p></section>
        <section className="policy-card"><h2>4. Payments and security</h2><p>Labzeck stores payment references for review. We do not store UPI passwords, PINs, or bank login details. Never share your UPI PIN with anyone.</p></section>
        <section className="policy-card"><h2>5. Your choices</h2><p>You may update your profile, request account help, or ask us to remove your information. Contact support through the Labzeck app for assistance.</p></section>
        <p className="policy-updated">Last updated: September 2026</p>
      </div>
    </main>
  )
}
