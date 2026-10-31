import Link from 'next/link'
import { ArrowLeft, HelpCircle, Mail, ShieldCheck } from 'lucide-react'

const faqs = [
  ['How do I verify my account?', 'Choose phone or email verification, enter the one-time code sent to you, and continue when it is confirmed.'],
  ['How do I update my availability?', 'Open your profile and adjust your work preferences. Keeping your availability current helps people find you.'],
  ['How do I report a problem?', 'Use the in-app support route or contact the Labzeck team with the account email and a short description of the issue.'],
]

export default function HelpPage() {
  return <main className="policy-page"><div className="policy-inner"><Link className="policy-back" href="/"> <ArrowLeft size={16}/> Back to Labzeck</Link><div className="policy-icon"><HelpCircle size={25}/></div><p className="eyebrow">LABZECK SUPPORT</p><h1>How can we help?</h1><p className="policy-intro">Quick answers for accounts, verification, work discovery, and safety.</p><div className="support-contact"><Mail size={18}/><div><strong>Need more help?</strong><p>Reach out through the app with your registered email.</p></div></div>{faqs.map(([question, answer]) => <section className="policy-card" key={question}><h2>{question}</h2><p>{answer}</p></section>)}<section className="support-safe"><ShieldCheck size={18}/><span>Never share your password, OTP, UPI PIN, or bank login details.</span></section></div></main>
}
