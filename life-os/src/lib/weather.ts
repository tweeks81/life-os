export interface DayForecast {
  date: string          // YYYY-MM-DD
  maxTemp: number
  minTemp: number
  weatherCode: number
  emoji: string
  description: string
}

export interface LocationWeather {
  locationName: string
  days: DayForecast[]
}

// WMO weather interpretation codes → emoji + description
const WMO: Record<number, [string, string]> = {
  0:  ['☀️', 'Clear sky'],
  1:  ['🌤️', 'Mainly clear'],
  2:  ['⛅', 'Partly cloudy'],
  3:  ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Freezing fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌧️', 'Heavy drizzle'],
  61: ['🌧️', 'Slight rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  71: ['🌨️', 'Slight snow'],
  73: ['🌨️', 'Snow'],
  75: ['❄️', 'Heavy snow'],
  77: ['🌨️', 'Snow grains'],
  80: ['🌦️', 'Slight showers'],
  81: ['🌧️', 'Showers'],
  82: ['⛈️', 'Heavy showers'],
  85: ['🌨️', 'Snow showers'],
  86: ['❄️', 'Heavy snow showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm + hail'],
  99: ['⛈️', 'Thunderstorm + hail'],
}

function wmo(code: number): { emoji: string; description: string } {
  const entry = WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? ['🌡️', 'Unknown']
  return { emoji: entry[0], description: entry[1] }
}

export async function geocode(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  if (!query?.trim()) return null
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=1&language=en&format=json`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const r = data.results?.[0]
    if (!r) return null
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    return { lat: r.latitude, lon: r.longitude, name }
  } catch {
    return null
  }
}

export async function fetchWeather(lat: number, lon: number, days = 7): Promise<DayForecast[] | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${days}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const d = data.daily
    if (!d?.time) return null
    return d.time.map((date: string, i: number) => {
      const code: number = d.weathercode[i] ?? 0
      const w = wmo(code)
      return {
        date,
        maxTemp: Math.round(d.temperature_2m_max[i] ?? 0),
        minTemp: Math.round(d.temperature_2m_min[i] ?? 0),
        weatherCode: code,
        emoji: w.emoji,
        description: w.description,
      } satisfies DayForecast
    })
  } catch {
    return null
  }
}

export async function getWeatherForLocation(query: string): Promise<LocationWeather | null> {
  const geo = await geocode(query)
  if (!geo) return null
  const days = await fetchWeather(geo.lat, geo.lon, 7)
  if (!days) return null
  return { locationName: geo.name, days }
}

export async function getWeatherByCoords(lat: number, lon: number, locationName: string, days = 7): Promise<LocationWeather | null> {
  const forecasts = await fetchWeather(lat, lon, days)
  if (!forecasts) return null
  return { locationName, days: forecasts }
}
