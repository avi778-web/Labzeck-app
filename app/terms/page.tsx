import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

const sections = [
  ['1. Using Labzeck', 'Labzeck helps people discover nearby work and trusted services. Use the platform honestly, provide accurate information, and respect other members.'],
  ['2. Accounts and verification', 'You are responsible for keeping your account details current and protecting access to your account. Verification codes must never be shared with another person.'],
  ['3. Work and payments', 'Agreements, pricing, timing, and payment terms are made between the people involved. Labzeck does not replace your own judgement or local legal obligations.'],
  ['4. Safe community', 'Do not post harmful, illegal, abusive, or misleading content. Report suspicious activity through support so we can review it promptly.'],
]

export default function TermsPage() {
  return <main className="policy-page"><div className="policy-inner"><Link className="policy-back" href="/"> <ArrowLeft size={16}/> Back to Labzeck</Link><div className="policy-icon"><FileText size={25}/></div><p className="eyebrow">LABZECK TRUST CENTRE</p><h1>Terms of Use</h1><p className="policy-intro">Clear, simple guidelines for using Labzeck safely and professionally.</p>{sections.map(([title, copy]) => <section className="policy-card" key={title}><h2>{title}</h2><p>{copy}</p></section>)}<p className="policy-updated">Last updated: September 2026</p></div></main>
}
