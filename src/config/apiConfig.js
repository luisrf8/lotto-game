const env = import.meta.env

export const API_BASE_URL = env.VITE_API_BASE_URL || ''

export const REALTIME_CONFIG_ENDPOINT =
  env.VITE_API_REALTIME_CONFIG || '/mock-api/config/realtime.json'

export const GAME_API_ENDPOINTS = {
  LOTTO_ACTIVO: env.VITE_API_GAME_LOTTO_ACTIVO || '/mock-api/games/lotto-activo.json',
  LOTTO_INTER: env.VITE_API_GAME_LOTTO_INTER || '/mock-api/games/lotto-inter.json',
  PATRONUS: env.VITE_API_GAME_PATRONUS || '/mock-api/games/patronus.json',
  TRIO_ACTIVO: env.VITE_API_GAME_TRIO_ACTIVO || '/mock-api/games/trio-activo.json',
}

export const PRODUCT_API_ENDPOINTS = {
  LIST: env.VITE_API_PRODUCTS_LIST || '/mock-api/products/list.json',
  CATALOG: env.VITE_API_PRODUCTS_CATALOG || '/mock-api/products/catalog.json',
  PRICING: env.VITE_API_PRODUCTS_PRICING || '/mock-api/products/pricing.json',
  AVAILABILITY:
    env.VITE_API_PRODUCTS_AVAILABILITY || '/mock-api/products/availability.json',
}

const parseBooleanEnv = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue
  return String(value).toLowerCase() === 'true'
}

const parseNumberEnv = (value, defaultValue) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

const formatIsoDate = (value) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const DEFAULT_OFFICIAL_API_DATE = formatIsoDate(new Date())

const OFFICIAL_API_PROXY_PREFIX = '/lotto-api'
const OFFICIAL_API_DEFAULT_URL = `${OFFICIAL_API_PROXY_PREFIX}/api.php`
const OFFICIAL_API_UPSTREAM_ORIGIN = 'https://lottoactivo.com'

const resolveOfficialApiUrl = (value) => {
  if (!value) return OFFICIAL_API_DEFAULT_URL

  const normalized = String(value).trim()
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized)

      if (parsed.origin === OFFICIAL_API_UPSTREAM_ORIGIN) {
        return `${OFFICIAL_API_PROXY_PREFIX}${parsed.pathname}${parsed.search}`
      }

      return normalized
    } catch {
      return OFFICIAL_API_DEFAULT_URL
    }
  }

  return normalized
}

export const LOTTO_ACTIVO_OFFICIAL_API = {
  url: resolveOfficialApiUrl(env.VITE_LOTTO_ACTIVO_API_URL),
  user: env.VITE_LOTTO_ACTIVO_API_USER || 'pagosrapidos',
  pass: env.VITE_LOTTO_ACTIVO_API_PASS || 'Test1234',
  date: env.VITE_LOTTO_ACTIVO_API_DATE || DEFAULT_OFFICIAL_API_DATE,
  enabled: parseBooleanEnv(env.VITE_LOTTO_ACTIVO_API_ENABLED, true),
  minIntervalMs: parseNumberEnv(env.VITE_LOTTO_ACTIVO_API_MIN_INTERVAL_MS, 5000),
}
