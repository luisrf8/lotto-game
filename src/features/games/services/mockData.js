import { API_BASE_URL, GAME_API_ENDPOINTS } from '@/config/apiConfig'

export const GAME_IDS = {
  LOTTO_ACTIVO: 'LOTTO_ACTIVO',
  LOTTO_INTER: 'LOTTO_INTER',
  MONJE_MILLONARIO: 'MONJE_MILLONARIO',
}

const buildApiPath = (pathValue, fallbackPath) => {
  const rawPath = pathValue || fallbackPath
  const apiBase = API_BASE_URL

  if (/^https?:\/\//.test(rawPath)) {
    return rawPath
  }

  if (!apiBase) {
    return rawPath
  }

  const normalizedBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`

  return `${normalizedBase}${normalizedPath}`
}

export const mockGames = [
  {
    id: GAME_IDS.LOTTO_ACTIVO,
    name: 'Lotto Activo',
    accent: 'neon',
    streamLabel: 'Canal Principal',
    logo: '/mock-api/games/LottoActivoElPatronus.png',
    apiPath: buildApiPath(
      GAME_API_ENDPOINTS.LOTTO_ACTIVO,
      '/mock-api/games/lotto-activo.json',
    ),
  },
  {
    id: GAME_IDS.LOTTO_INTER,
    name: 'Lotto Inter',
    accent: 'gold',
    streamLabel: 'Canal Inter',
    logo: '/mock-api/games/TrioActivo_LA.png',
    apiPath: buildApiPath(
      GAME_API_ENDPOINTS.LOTTO_INTER,
      '/mock-api/games/lotto-inter.json',
    ),
  },
  {
    id: GAME_IDS.MONJE_MILLONARIO,
    name: 'Monje Millonario',
    accent: 'neon',
    streamLabel: 'Canal Monje',
    logo: '/mock-api/games/IMG_6868.PNG',
    apiPath: buildApiPath(
      GAME_API_ENDPOINTS.MONJE_MILLONARIO,
      '/mock-api/games/monje-millonario.json',
    ),
  },
]

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)]

export const pickUniqueResults = (items, count = 3) => {
  if (!items?.length || items.length < count) return []

  const picked = []

  while (picked.length < count) {
    const candidate = pickRandom(items)
    const exists = picked.some((item) => item.number === candidate.number)

    if (!exists) {
      picked.push(candidate)
    }
  }

  return picked
}

const gameMap = mockGames.reduce((acc, game) => {
  acc[game.id] = game
  return acc
}, {})

export const fetchGamePayload = async (gameId) => {
  const game = gameMap[gameId]

  if (!game) {
    throw new Error(`Juego no configurado para id: ${gameId}`)
  }

  const response = await fetch(game.apiPath, { method: 'GET', cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${game.apiPath}`)
  }

  const payload = await response.json()

  return {
    ...game,
    ...payload,
    id: game.id,
    name: payload.name || game.name,
    streamLabel: payload.streamLabel || game.streamLabel,
  }
}
