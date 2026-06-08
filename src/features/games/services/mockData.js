export const GAME_IDS = {
  LOTTO_ACTIVO: 'LOTTO_ACTIVO',
  LOTTO_INTER: 'LOTTO_INTER',
  MONJE_MILLONARIO: 'MONJE_MILLONARIO',
}

export const mockGames = [
  {
    id: GAME_IDS.LOTTO_ACTIVO,
    name: 'Lotto Activo',
    accent: 'neon',
    streamLabel: 'Canal Principal',
    apiPath: '/mock-api/games/lotto-activo.json',
  },
  {
    id: GAME_IDS.LOTTO_INTER,
    name: 'Lotto Inter',
    accent: 'gold',
    streamLabel: 'Canal Inter',
    apiPath: '/mock-api/games/lotto-inter.json',
  },
  {
    id: GAME_IDS.MONJE_MILLONARIO,
    name: 'Monje Millonario',
    accent: 'neon',
    streamLabel: 'Canal Monje',
    apiPath: '/mock-api/games/monje-millonario.json',
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
