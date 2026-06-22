const env = import.meta.env

export const API_BASE_URL = env.VITE_API_BASE_URL || ''

export const REALTIME_CONFIG_ENDPOINT =
  env.VITE_API_REALTIME_CONFIG || '/mock-api/config/realtime.json'

export const GAME_API_ENDPOINTS = {
  LOTTO_ACTIVO: env.VITE_API_GAME_LOTTO_ACTIVO || '/mock-api/games/lotto-activo.json',
  LOTTO_INTER: env.VITE_API_GAME_LOTTO_INTER || '/mock-api/games/lotto-inter.json',
  MONJE_MILLONARIO:
    env.VITE_API_GAME_MONJE_MILLONARIO || '/mock-api/games/monje-millonario.json',
}

export const PRODUCT_API_ENDPOINTS = {
  LIST: env.VITE_API_PRODUCTS_LIST || '/mock-api/products/list.json',
  CATALOG: env.VITE_API_PRODUCTS_CATALOG || '/mock-api/products/catalog.json',
  PRICING: env.VITE_API_PRODUCTS_PRICING || '/mock-api/products/pricing.json',
  AVAILABILITY:
    env.VITE_API_PRODUCTS_AVAILABILITY || '/mock-api/products/availability.json',
}
