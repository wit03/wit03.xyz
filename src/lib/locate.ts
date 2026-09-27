// Rough visitor location from the browser's time zone, so the sky can be placed without
// asking for geolocation. City-level accuracy is plenty for where the sun and moon sit.

export type LatLng = { lat: number; lng: number }

const ZONES: Record<string, LatLng> = {
  'Asia/Bangkok': { lat: 13.75, lng: 100.5 },
  'Asia/Ho_Chi_Minh': { lat: 10.8, lng: 106.7 },
  'Asia/Jakarta': { lat: -6.2, lng: 106.8 },
  'Asia/Singapore': { lat: 1.35, lng: 103.8 },
  'Asia/Kuala_Lumpur': { lat: 3.14, lng: 101.7 },
  'Asia/Manila': { lat: 14.6, lng: 121 },
  'Asia/Hong_Kong': { lat: 22.3, lng: 114.2 },
  'Asia/Shanghai': { lat: 31.2, lng: 121.5 },
  'Asia/Taipei': { lat: 25, lng: 121.5 },
  'Asia/Seoul': { lat: 37.6, lng: 127 },
  'Asia/Tokyo': { lat: 35.7, lng: 139.7 },
  'Asia/Kolkata': { lat: 22.6, lng: 88.4 },
  'Asia/Calcutta': { lat: 22.6, lng: 88.4 },
  'Asia/Dubai': { lat: 25.2, lng: 55.3 },
  'Asia/Yangon': { lat: 16.8, lng: 96.2 },
  'Australia/Perth': { lat: -31.95, lng: 115.9 },
  'Australia/Adelaide': { lat: -34.9, lng: 138.6 },
  'Australia/Brisbane': { lat: -27.5, lng: 153 },
  'Australia/Sydney': { lat: -33.9, lng: 151.2 },
  'Australia/Melbourne': { lat: -37.8, lng: 145 },
  'Pacific/Auckland': { lat: -36.85, lng: 174.8 },
  'Europe/London': { lat: 51.5, lng: -0.1 },
  'Europe/Dublin': { lat: 53.35, lng: -6.3 },
  'Europe/Lisbon': { lat: 38.7, lng: -9.1 },
  'Europe/Paris': { lat: 48.9, lng: 2.35 },
  'Europe/Berlin': { lat: 52.5, lng: 13.4 },
  'Europe/Amsterdam': { lat: 52.4, lng: 4.9 },
  'Europe/Madrid': { lat: 40.4, lng: -3.7 },
  'Europe/Rome': { lat: 41.9, lng: 12.5 },
  'Europe/Stockholm': { lat: 59.3, lng: 18.1 },
  'Europe/Istanbul': { lat: 41, lng: 29 },
  'Europe/Moscow': { lat: 55.75, lng: 37.6 },
  'Africa/Cairo': { lat: 30, lng: 31.2 },
  'Africa/Lagos': { lat: 6.5, lng: 3.4 },
  'Africa/Johannesburg': { lat: -26.2, lng: 28 },
  'Africa/Nairobi': { lat: -1.3, lng: 36.8 },
  'America/New_York': { lat: 40.7, lng: -74 },
  'America/Toronto': { lat: 43.7, lng: -79.4 },
  'America/Chicago': { lat: 41.9, lng: -87.6 },
  'America/Denver': { lat: 39.7, lng: -105 },
  'America/Phoenix': { lat: 33.4, lng: -112.1 },
  'America/Los_Angeles': { lat: 34.05, lng: -118.25 },
  'America/Vancouver': { lat: 49.3, lng: -123.1 },
  'America/Anchorage': { lat: 61.2, lng: -149.9 },
  'Pacific/Honolulu': { lat: 21.3, lng: -157.9 },
  'America/Mexico_City': { lat: 19.4, lng: -99.1 },
  'America/Bogota': { lat: 4.7, lng: -74.1 },
  'America/Lima': { lat: -12.05, lng: -77 },
  'America/Santiago': { lat: -33.45, lng: -70.7 },
  'America/Sao_Paulo': { lat: -23.55, lng: -46.6 },
  'America/Argentina/Buenos_Aires': { lat: -34.6, lng: -58.4 },
  UTC: { lat: 51.5, lng: 0 },
}

// Zones outside the table: longitude from the UTC offset (15° per hour), a mid latitude.
const FALLBACK_LAT = 20

function utcOffsetMinutes(timeZone: string, date: Date): number | null {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value
    if (!name || name === 'GMT') return 0
    const m = name.match(/^GMT([+-])(\d{2}):(\d{2})$/)
    if (!m) return null
    const minutes = Number(m[2]) * 60 + Number(m[3])
    return m[1] === '-' ? -minutes : minutes
  } catch {
    return null // unknown zone: Intl throws a RangeError
  }
}

export function locate(timeZone: string, date: Date): LatLng {
  const known = ZONES[timeZone]
  if (known) return known
  const offset = utcOffsetMinutes(timeZone, date) ?? 0
  return { lat: FALLBACK_LAT, lng: (offset / 60) * 15 }
}
