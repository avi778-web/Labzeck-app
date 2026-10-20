'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, CreditCard, QrCode, Smartphone, X } from 'lucide-react'

type PaymentModalProps = { open: boolean; amount: number; onClose: () => void }

export function PaymentModal({ open, amount, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<'razorpay' | 'upi'>('razorpay')
  const [copied, setCopied] = useState(false)
  const upiUrl = `upi://pay?pa=labzeck@upi&pn=Labzeck&am=${amount}&cu=INR`

  useEffect(() => {
    if (!open) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => script.remove()
  }, [open])

  if (!open) return null
  const pay = () => {
    if (method === 'upi') { window.location.href = upiUrl; return }
    const Razorpay = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay
    if (!Razorpay) return
    new Razorpay({ key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', amount: amount * 100, currency: 'INR', name: 'Labzeck', description: 'Labzeck plan upgrade', handler: () => onClose() }).open()
  }
  return <div className="payment-backdrop" role="dialog" aria-modal="true" aria-labelledby="payment-title"><section className="payment-modal"><button className="payment-close" onClick={onClose} aria-label="Close payment"><X size={18}/></button><p className="eyebrow">SECURE CHECKOUT</p><h2 id="payment-title">Complete payment</h2><strong className="payment-amount">₹{amount}</strong><div className="payment-methods"><button className={method === 'razorpay' ? 'selected' : ''} onClick={() => setMethod('razorpay')}><CreditCard size={18}/> Razorpay</button><button className={method === 'upi' ? 'selected' : ''} onClick={() => setMethod('upi')}><Smartphone size={18}/> UPI / PhonePe</button></div>{method === 'upi' && <div className="payment-qr"><div className="qr-placeholder"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`} alt="UPI payment QR code" /></div><p>Scan with any UPI app</p><button className="copy-upi" onClick={() => { void navigator.clipboard?.writeText(upiUrl); setCopied(true) }}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy UPI link'}</button></div>}<button className="primary wide" onClick={pay}>Pay ₹{amount}</button><small>Payments are processed securely. Labzeck never stores card details.</small></section></div>
}
