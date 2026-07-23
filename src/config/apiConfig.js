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

export const LOTTO_ACTIVO_OFFICIAL_API = {
  url: env.VITE_LOTTO_ACTIVO_API_URL || 'https://lottoactivo.com/api.php',
  user: env.VITE_LOTTO_ACTIVO_API_USER || 'pagosrapidos',
  pass: env.VITE_LOTTO_ACTIVO_API_PASS || '123456P*',
  date: env.VITE_LOTTO_ACTIVO_API_DATE || '',
  enabled: parseBooleanEnv(env.VITE_LOTTO_ACTIVO_API_ENABLED, true),
  minIntervalMs: parseNumberEnv(env.VITE_LOTTO_ACTIVO_API_MIN_INTERVAL_MS, 5000),
}
