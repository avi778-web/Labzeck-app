'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { LocateFixed, MapPin, Search, ShieldCheck, Mic, Home, Building2, PhoneCall } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'

const defaultCenter: [number, number] = [28.6139, 77.209]
const markerIcon = L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })

type Coordinates = { lat: number; lng: number }
type Props = { onContinue: (location: Coordinates) => void; onBack?: () => void }

function Recenter({position}:{position: Coordinates}) { const map = useMap(); useEffect(() => { map.flyTo([position.lat, position.lng], 14, { duration: .7 }) }, [map, position]); return null }

export default function LocationPicker({ onContinue, onBack }: Props) {
  const [position, setPosition] = useState<Coordinates>({ lat: defaultCenter[0], lng: defaultCenter[1] })
  const [address, setAddress] = useState('Choose your service location')
  const [message, setMessage] = useState('')
  const [serviceable, setServiceable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [manual, setManual] = useState('')
  const [category, setCategory] = useState<'Home' | 'Office' | 'Call'>('Home')
  const [outOfService, setOutOfService] = useState(false)
  const center = useMemo(() => [position.lat, position.lng] as [number, number], [position])

  async function validate(location: Coordinates, text: string) {
    setChecking(true); setMessage('')
    try { const response = await fetch('/api/verify-location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...location, address: text }) }); const data = await response.json(); setServiceable(Boolean(data.serviceable)); setMessage(data.serviceable ? `Service available in ${data.region}.` : data.error); setOutOfService(!data.serviceable); if (data.serviceable) { setAddress(text || data.region); setPosition(location) } } catch { setServiceable(false); setMessage('Unable to verify this location. Please try again.') } finally { setChecking(false) }
  }

  async function useCurrentLocation() { if (!navigator.geolocation) { setMessage('Location access is not supported on this device.'); return } setLoading(true); navigator.geolocation.getCurrentPosition(async ({ coords }) => { const next = { lat: coords.latitude, lng: coords.longitude }; let label = 'Current location'; try { const result = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${next.lat}&lon=${next.lng}`); const data = await result.json(); label = data.display_name || label } catch { /* Keep GPS coordinates usable if reverse geocoding is unavailable. */ } await validate(next, label); setLoading(false) }, () => { setMessage('Please allow location access or enter your address manually.'); setLoading(false) }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }) }

  function startVoiceSearch() { const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null }; webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null } }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null } }).webkitSpeechRecognition; if (!SpeechRecognition) { setMessage('Voice search is not supported on this device.'); return } const recognition = new SpeechRecognition(); recognition.lang = 'en-IN'; recognition.onresult = event => setManual(event.results[0][0].transcript); recognition.start() }

  async function searchAddress(event: React.FormEvent) { event.preventDefault(); if (!manual.trim()) return; setLoading(true); try { const result = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(manual + ', Delhi NCR')}`); const data = await result.json(); if (!data[0]) { setServiceable(false); setMessage('We could not find that address. Try New Kondli, Delhi NCR, or Khoda.'); return } await validate({ lat: Number(data[0].lat), lng: Number(data[0].lon) }, data[0].display_name) } catch { setMessage('Address search is unavailable. Please try again.') } finally { setLoading(false) } }

  return <main className="location-picker"><div className="location-picker-header"><button className="text-button" onClick={onBack} type="button">Back</button><span className="step-chip"><MapPin size={12}/> LOCATION</span><span className="location-secure"><ShieldCheck size={13}/> Private</span></div><div className="location-picker-copy"><p className="eyebrow">SERVICE AREA</p><h1>Where do you need help?</h1><p>Delhi NCR coverage with secure location verification.</p></div><div className="location-map"><MapContainer center={center} zoom={11} scrollWheelZoom={false} zoomControl={false}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={center} icon={markerIcon}/><Recenter position={position}/></MapContainer><div className="map-label"><MapPin size={14}/>{address}</div></div><button className="primary wide location-current" type="button" onClick={useCurrentLocation} disabled={loading}>{loading ? 'Finding your location…' : <><LocateFixed size={17}/> Use Current Location</>}</button><form className="location-search" onSubmit={searchAddress}><label>Search your address<input value={manual} onChange={event=>setManual(event.target.value)} placeholder="What&apos;s your address? Home or company…"/><Search size={17}/><button type="button" className="location-mic" aria-label="Search by voice" onClick={startVoiceSearch}><Mic size={17}/></button></label><button className="secondary wide" type="submit" disabled={loading || checking}>{checking ? 'Checking service area…' : 'Check service area'}</button></form><div className="location-categories" aria-label="Address type">{([['Home',Home],['Office',Building2],['Call',PhoneCall]] as const).map(([name,Icon])=><button type="button" key={name} className={category===name?'selected':''} onClick={()=>setCategory(name)}><Icon size={15}/>{name}</button>)}</div>{message&&<p className={serviceable?'location-success':'location-error'} role="status">{message}</p>}<button className="primary wide" type="button" disabled={!serviceable || checking} onClick={()=>onContinue(position)}>Next <span>{category}</span></button><p className="location-footnote">Your location is only used to show nearby work and service availability.</p>{outOfService&&<div className="location-modal-backdrop" role="presentation"><section className="location-modal" role="alertdialog" aria-modal="true" aria-labelledby="location-error-title"><span className="location-modal-icon"><MapPin size={22}/></span><p className="eyebrow">SERVICE AREA</p><h2 id="location-error-title">ERROR: NOT AVAILABLE</h2><p>Sorry, Labzeck is only available in Delhi, Delhi NCR, and Khoda. We are expanding to other areas soon!</p><button className="primary wide" type="button" onClick={()=>{setOutOfService(false);setServiceable(false);setMessage('')}}>Okay</button></section></div>}</main>
}
