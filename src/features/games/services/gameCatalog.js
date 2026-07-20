import {
  API_BASE_URL,
  GAME_API_ENDPOINTS,
  LOTTO_ACTIVO_OFFICIAL_API,
} from '@/config/apiConfig'

export const GAME_IDS = {
  LOTTO_ACTIVO: 'LOTTO_ACTIVO',
  LOTTO_INTER: 'LOTTO_INTER',
  PATRONUS: 'PATRONUS',
  TRIO_ACTIVO: 'TRIO_ACTIVO',
}

const OFFICIAL_API_BY_GAME = {
  [GAME_IDS.LOTTO_ACTIVO]: {
    type: 2,
    idgame: 1,
  },
  [GAME_IDS.LOTTO_INTER]: {
    type: 2,
    idgame: 2,
  },
  [GAME_IDS.PATRONUS]: {
    type: 2,
    idgame: 3,
  },
  [GAME_IDS.TRIO_ACTIVO]: {
    type: 1,
    idgame: 4,
  },
}

export const OFFICIAL_API_MONITOR_DEFINITIONS = [
  {
    key: 'LOTTO_ACTIVO_ANIMALITOS',
    gameId: GAME_IDS.LOTTO_ACTIVO,
    gameName: 'Lotto Activo',
    type: 2,
    idgame: 1,
    resultKind: 'Animalitos',
  },
  {
    key: 'LOTTO_INTER_ANIMALITOS',
    gameId: GAME_IDS.LOTTO_INTER,
    gameName: 'Lotto Activo RD Internacional',
    type: 2,
    idgame: 2,
    resultKind: 'Animalitos',
  },
  {
    key: 'PATRONUS_ANIMALITOS',
    gameId: GAME_IDS.PATRONUS,
    gameName: 'Lotto Activo Republica Dominicana',
    type: 2,
    idgame: 3,
    resultKind: 'Animalitos',
  },
  {
    key: 'TRIO_ACTIVO_TRIPLES',
    gameId: GAME_IDS.TRIO_ACTIVO,
    gameName: 'Trio Activo',
    type: 1,
    idgame: 4,
    resultKind: 'Triples',
  },
  {
    key: 'TERMINAL_TRIO_TERMINALES',
    gameId: null,
    gameName: 'Terminal Trio',
    type: 1,
    idgame: 5,
    resultKind: 'Terminales',
  },
]

const MONITOR_MAX_HISTORY = 50
const monitorListeners = new Set()

const apiMonitorState = {
  requestsByKey: {},
  recentRequests: [],
  totalRequests: 0,
  lastUpdatedAt: null,
}

const cloneMonitorState = () => ({
  requestsByKey: { ...apiMonitorState.requestsByKey },
  recentRequests: [...apiMonitorState.recentRequests],
  totalRequests: apiMonitorState.totalRequests,
  lastUpdatedAt: apiMonitorState.lastUpdatedAt,
})

const emitMonitorState = () => {
  const snapshot = cloneMonitorState()
  monitorListeners.forEach((listener) => listener(snapshot))
}

const buildRequestMonitorKey = (type, idgame) => `${type}-${idgame}`

const resolveMonitorDefinition = ({ gameId, type, idgame }) => {
  if (gameId) {
    const byGame = OFFICIAL_API_MONITOR_DEFINITIONS.find((entry) => entry.gameId === gameId)
    if (byGame) return byGame
  }

  return OFFICIAL_API_MONITOR_DEFINITIONS.find(
    (entry) => entry.type === type && entry.idgame === idgame,
  )
}

const updateRequestMonitor = ({
  gameId,
  type,
  idgame,
  status,
  requestUrl,
  date,
  queuedAt,
  sentAt,
  completedAt,
  waitMs,
  durationMs,
  entriesCount,
  latestResults,
  error,
}) => {
  const definition = resolveMonitorDefinition({ gameId, type, idgame })
  const requestKey = buildRequestMonitorKey(type, idgame)
  const previous = apiMonitorState.requestsByKey[requestKey] || {
    requestKey,
    gameId: definition?.gameId || gameId || null,
    gameName: definition?.gameName || gameId || `Juego ${idgame}`,
    resultKind: definition?.resultKind || (type === 1 ? 'Triples/Terminales' : 'Animalitos'),
    type,
    idgame,
    requestCount: 0,
  }

  const requestCount = status === 'ok' || status === 'error' ? previous.requestCount + 1 : previous.requestCount

  apiMonitorState.requestsByKey[requestKey] = {
    ...previous,
    status,
    requestUrl: requestUrl || previous.requestUrl,
    date: date || previous.date || 'hoy',
    lastAttemptAt: queuedAt || previous.lastAttemptAt || null,
    lastQueuedAt: queuedAt || previous.lastQueuedAt || null,
    lastSentAt: sentAt || previous.lastSentAt || null,
    lastCompletedAt: completedAt || previous.lastCompletedAt || null,
    lastWaitMs: typeof waitMs === 'number' ? waitMs : previous.lastWaitMs,
    lastDurationMs: typeof durationMs === 'number' ? durationMs : previous.lastDurationMs,
    entriesCount: typeof entriesCount === 'number' ? entriesCount : previous.entriesCount,
    latestResults: latestResults || previous.latestResults || [],
    lastError: error || (status === 'ok' ? null : previous.lastError),
    requestCount,
  }

  if (status === 'ok' || status === 'error') {
    apiMonitorState.totalRequests += 1
    apiMonitorState.recentRequests = [
      {
        id: `${requestKey}-${completedAt || Date.now()}`,
        requestKey,
        gameName: apiMonitorState.requestsByKey[requestKey].gameName,
        status,
        queuedAt: queuedAt || null,
        sentAt: sentAt || null,
        completedAt: completedAt || Date.now(),
        waitMs: typeof waitMs === 'number' ? waitMs : null,
        durationMs: typeof durationMs === 'number' ? durationMs : null,
        entriesCount: typeof entriesCount === 'number' ? entriesCount : 0,
        error: error || null,
      },
      ...apiMonitorState.recentRequests,
    ].slice(0, MONITOR_MAX_HISTORY)
  }

  apiMonitorState.lastUpdatedAt = Date.now()
  emitMonitorState()
}

export const getApiMonitorSnapshot = () => cloneMonitorState()

export const subscribeApiMonitor = (listener) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  monitorListeners.add(listener)
  listener(cloneMonitorState())

  return () => {
    monitorListeners.delete(listener)
  }
}

let officialRequestQueue = Promise.resolve()
let lastOfficialRequestAt = 0

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const resolveAnimalitoCandidates = (number, digits = 2) => {
  const rawValue = String(number)
  const numericValue = Number(rawValue)
  const paddedValue = Number.isNaN(numericValue) ? rawValue : numericValue.toString().padStart(digits, '0')
  const zeroValue = Number.isNaN(numericValue) ? rawValue : '0'.repeat(digits)

  return [...new Set([rawValue, paddedValue, zeroValue])]
}

const createAnimalitoImageResolver = (basePath, options = {}) => {
  const { digits = 2, formats = ['png'] } = options

  return (number) =>
    resolveAnimalitoCandidates(number, digits).flatMap((candidate) =>
      formats.map((format) => {
        if (basePath.includes('/patronus/animalitos')) {
          if (format === 'webp') {
            return `${basePath}/Webp/${candidate}.webp`
          }

          return `${basePath}/png/${candidate}.png`
        }

        return `${basePath}/${candidate}.${format}`
      }),
    )
}

const GAME_ASSETS = {
  [GAME_IDS.LOTTO_ACTIVO]: {
    logo: '/mock-api/games/lotto-activo/logo/logo.webp',
    pano: '/mock-api/games/lotto-activo/pano/pano.png',
    animalitoDigits: 2,
    animalitoImageResolver: createAnimalitoImageResolver('/mock-api/games/lotto-activo/animalitos', {
      digits: 2,
      formats: ['png'],
    }),
  },
  [GAME_IDS.LOTTO_INTER]: {
    logo: '/mock-api/games/lotto-internacional/logo/logo.webp',
    pano: '/mock-api/games/lotto-internacional/pano/pano.png',
    animalitoDigits: 2,
    animalitoImageResolver: createAnimalitoImageResolver(
      '/mock-api/games/lotto-internacional/animalitos',
      {
        digits: 2,
        formats: ['png'],
      },
    ),
  },
  [GAME_IDS.PATRONUS]: {
    logo: '/mock-api/games/patronus/logo/logo.png',
    pano: '/mock-api/games/patronus/pano/pano.png',
    ruleta: '/mock-api/games/patronus/ruleta/ruleta.png',
    tabloide: ['/mock-api/games/patronus/tabloide/tabloide.png', '/mock-api/games/patronus/tabloide/tabloide2.png'],
    animalitoDigits: 2,
    animalitoImageResolver: createAnimalitoImageResolver('/mock-api/games/patronus/animalitos', {
      digits: 2,
      formats: ['png', 'webp'],
    }),
  },
  [GAME_IDS.TRIO_ACTIVO]: {
    logo: '/mock-api/games/trio-activo/logo/logo.png',
    ruleta: '/mock-api/games/trio-activo/ruleta/ruleta.png',
    animalitoDigits: 3,
    animalitoImageResolver: createAnimalitoImageResolver('/mock-api/games/trio-activo/animalitos', {
      digits: 3,
      formats: ['png', 'webp'],
    }),
  },
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

const buildAnimalito = ({ number, name, icon }) => ({ number, name, icon })

const PATRIUS_ANIMALITO_FILES = [
  '0-Delfin.webp',
  '00-Ballena.webp',
  '1-Carnero.webp',
  '2-Toro.webp',
  '3-Ciempiés.webp',
  '4-Alacran.webp',
  '5-Leon.webp',
  '6-Rana.webp',
  '7-Perico.webp',
  '8-Raton.webp',
  '9-Aguila.webp',
  '10-Tigre.webp',
  '11-Gato.webp',
  '12-Caballo.webp',
  '13-Mono.webp',
  '14-Paloma.webp',
  '15-Zorro.webp',
  '16-Oso.webp',
  '17-Pavo.webp',
  '18-Burro.webp',
  '19-Chivo.webp',
  '20-Cochino.webp',
  '21-Gallo.webp',
  '22-Camello.webp',
  '23-Cebra.webp',
  '24-Iguana.webp',
  '25-Gallina.webp',
  '26-Vaca.webp',
  '27-Perro.webp',
  '28-Zamuro.webp',
  '29-Elefante.webp',
  '30-Caiman.webp',
  '31-Lapa.webp',
  '32-Ardilla.webp',
  '33-Pescado.webp',
  '34-Venado.webp',
  '35-Jirafa.webp',
  '36-Culebra.webp',
  '37-Tortuga.webp',
  '38-Bufalo.webp',
  '39-Lechuza.webp',
  '40-Abeja.webp',
  '41-Canguro.webp',
  '42-Tucan.webp',
  '43-Mariposa.webp',
  '44-Chiguire.webp',
  '45-Garza.webp',
  '46-Puma.webp',
  '47-Pavoreal.webp',
  '48-Puercoespin.webp',
  '49-Pereza.webp',
  '50-Canario.webp',
  '51-Pelicano.webp',
  '52-Pulpo.webp',
  '53-Caracol.webp',
  '54-Grillo.webp',
  '55-Osohormiguero.webp',
  '56-Tiburon.webp',
  '57-Pato.webp',
  '58-Hormiga.webp',
  '59-Pantera.webp',
  '60-Camaleon.webp',
  '61-Panda.webp',
  '62-Cachicamo.webp',
  '63-Cangrejo.webp',
  '64-Gavilan.webp',
  '65-Arana.webp',
  '66-Lobo.webp',
  '67-Avestruz.webp',
  '68-Jaguar.webp',
  '69-Conejo.webp',
  '70-Bisonte.webp',
  '71-Guacamayo.webp',
  '72-Gorila.webp',
  '73-Hipopotamo.webp',
  '74-Turpial.webp',
  '75-Patronus.webp',
]

const buildPatronusAnimalitos = () =>
  PATRIUS_ANIMALITO_FILES.map((fileName) => {
    const match = fileName.match(/^([0-9]{1,2}|00)-(.+)\.webp$/i)

    if (!match) {
      return null
    }

    const rawNumber = match[1]
    const rawName = match[2]

    return buildAnimalito({
      number: rawNumber === '00' ? '00' : Number(rawNumber),
      name: rawName,
      icon: '🐾',
    })
  }).filter(Boolean)

const buildTrioAnimalitos = () =>
  Array.from({ length: 1000 }, (_, index) => {
    const number = index.toString().padStart(3, '0')

    return buildAnimalito({
      number,
      name: `Competidor ${number}`,
      icon: '🎲',
    })
  })

const buildPatronusPayload = () => ({
  id: GAME_IDS.PATRONUS,
  name: 'Patronus',
  streamLabel: 'Canal Patronus',
  animalitos: buildPatronusAnimalitos(),
  lastResults: buildPatronusAnimalitos().slice(0, 3),
})

const buildTrioPayload = () => ({
  id: GAME_IDS.TRIO_ACTIVO,
  name: 'Trio Activo',
  streamLabel: 'Canal Trio',
  animalitos: buildTrioAnimalitos(),
  lastResults: buildTrioAnimalitos().slice(0, 3),
})

const normalizeApiEntries = (payload) => {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload
  }

  const arrayCandidateKeys = ['results', 'resultados', 'data', 'items', 'draws', 'rows']

  for (const key of arrayCandidateKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key]
    }
  }

  const objectValues = Object.values(payload)
  return objectValues.filter((entry) => entry && typeof entry === 'object')
}

const normalizeWinnerNumber = (value, digits = 2) => {
  if (value === undefined || value === null) return null

  const asString = String(value).trim()
  if (!asString) return null

  const directDigits = asString.match(/\d+/g)
  const compact = directDigits ? directDigits.join('') : asString
  const numeric = Number(compact)

  if (digits >= 3) {
    if (Number.isNaN(numeric)) return compact.padStart(digits, '0')
    return numeric.toString().padStart(digits, '0')
  }

  if (compact === '00') return '00'
  if (Number.isNaN(numeric)) return compact
  if (numeric === 0 && compact.startsWith('00')) return '00'

  return numeric
}

const resolveAnimalByNumber = (animalitos = [], number, digits = 2) => {
  const normalized = normalizeWinnerNumber(number, digits)

  if (normalized === null || normalized === undefined) return null

  const candidateValues = [...new Set([
    normalized,
    String(normalized),
    String(normalized).padStart(digits, '0'),
    Number(normalized),
  ])]

  return animalitos.find((animal) => {
    const animalValues = [...new Set([
      animal.number,
      String(animal.number),
      String(animal.number).padStart(digits, '0'),
      Number(animal.number),
    ])]

    return candidateValues.some((candidate) => animalValues.includes(candidate))
  })
}

const normalizeOfficialResults = ({ entries, animalitos, digits = 2 }) => {
  const normalized = []

  entries.forEach((entry) => {
    const numberValue =
      entry?.number ??
      entry?.numero ??
      entry?.num ??
      entry?.result ??
      entry?.resultado ??
      entry?.winner ??
      entry?.animal

    const normalizedNumber = normalizeWinnerNumber(numberValue, digits)
    if (normalizedNumber === null || normalizedNumber === undefined) return

    const matchedAnimal = resolveAnimalByNumber(animalitos, normalizedNumber, digits)

    normalized.push(
      matchedAnimal || {
        number: normalizedNumber,
        name:
          entry?.name ||
          entry?.nombre ||
          entry?.animalName ||
          entry?.descripcion ||
          `Resultado ${String(normalizedNumber).padStart(digits, '0')}`,
        icon: digits >= 3 ? '🎲' : '🐾',
      },
    )
  })

  const seen = new Set()
  return normalized.filter((item) => {
    const key = String(item.number)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const loadBasePayload = async (game) => {
  if (typeof game.buildData === 'function') {
    return Promise.resolve(game.buildData())
  }

  const response = await fetch(game.apiPath, { method: 'GET', cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${game.apiPath}`)
  }

  return response.json()
}

const enqueueOfficialRequest = async (url) => {
  const queuedAt = Date.now()

  const run = async () => {
    const now = Date.now()
    const elapsed = now - lastOfficialRequestAt
    const waitMs = Math.max(LOTTO_ACTIVO_OFFICIAL_API.minIntervalMs - elapsed, 0)
    const startedAt = now

    if (waitMs > 0) {
      await delay(waitMs)
    }

    const sentAt = Date.now()
    lastOfficialRequestAt = sentAt
    const response = await fetch(url, { method: 'GET', cache: 'no-store' })

    return {
      response,
      queuedAt,
      startedAt,
      sentAt,
      waitMs,
    }
  }

  const execution = officialRequestQueue.then(run, run)
  officialRequestQueue = execution.then(() => undefined, () => undefined)
  return execution
}

const executeOfficialApiRequest = async ({
  gameId = null,
  type,
  idgame,
  animalitos = [],
  digits = 2,
}) => {
  const query = new URLSearchParams({
    user: LOTTO_ACTIVO_OFFICIAL_API.user,
    pass: LOTTO_ACTIVO_OFFICIAL_API.pass,
    type: String(type),
    idgame: String(idgame),
  })

  if (LOTTO_ACTIVO_OFFICIAL_API.date) {
    query.set('date', LOTTO_ACTIVO_OFFICIAL_API.date)
  }

  const requestUrl = `${LOTTO_ACTIVO_OFFICIAL_API.url}?${query.toString()}`
  const requestedAt = Date.now()

  updateRequestMonitor({
    gameId,
    type,
    idgame,
    status: 'queued',
    requestUrl,
    date: LOTTO_ACTIVO_OFFICIAL_API.date || 'hoy',
    queuedAt: requestedAt,
  })

  let queueResult

  try {
    queueResult = await enqueueOfficialRequest(requestUrl)
  } catch (error) {
    updateRequestMonitor({
      gameId,
      type,
      idgame,
      status: 'error',
      requestUrl,
      date: LOTTO_ACTIVO_OFFICIAL_API.date || 'hoy',
      queuedAt: requestedAt,
      completedAt: Date.now(),
      error: error instanceof Error ? error.message : 'Fallo de red',
    })
    throw error
  }

  const { response, queuedAt, sentAt, waitMs } = queueResult

  if (!response.ok) {
    updateRequestMonitor({
      gameId,
      type,
      idgame,
      status: 'error',
      requestUrl,
      date: LOTTO_ACTIVO_OFFICIAL_API.date || 'hoy',
      queuedAt,
      sentAt,
      completedAt: Date.now(),
      waitMs,
      durationMs: Date.now() - sentAt,
      error: `API oficial devolvio ${response.status}`,
    })
    throw new Error(`API oficial devolvio ${response.status}`)
  }

  const payload = await response.json()
  const entries = normalizeApiEntries(payload)
  const normalized = normalizeOfficialResults({ entries, animalitos, digits })

  updateRequestMonitor({
    gameId,
    type,
    idgame,
    status: 'ok',
    requestUrl,
    date: LOTTO_ACTIVO_OFFICIAL_API.date || 'hoy',
    queuedAt,
    sentAt,
    completedAt: Date.now(),
    waitMs,
    durationMs: Date.now() - sentAt,
    entriesCount: entries.length,
    latestResults: normalized.slice(0, 3).map((item) => ({
      number: String(item.number),
      name: item.name,
    })),
  })

  return normalized.slice(0, 3)
}

const fetchOfficialApiResults = async (gameId, animalitos = [], digits = 2) => {
  if (!LOTTO_ACTIVO_OFFICIAL_API.enabled) return null

  const gameConfig = OFFICIAL_API_BY_GAME[gameId]
  if (!gameConfig) return null

  return executeOfficialApiRequest({
    gameId,
    type: gameConfig.type,
    idgame: gameConfig.idgame,
    animalitos,
    digits,
  })
}

export const testOfficialApiRequestByDefinition = async (definitionKey) => {
  const definition = OFFICIAL_API_MONITOR_DEFINITIONS.find((entry) => entry.key === definitionKey)

  if (!definition) {
    throw new Error(`Definicion monitor no encontrada: ${definitionKey}`)
  }

  return executeOfficialApiRequest({
    gameId: definition.gameId,
    type: definition.type,
    idgame: definition.idgame,
    animalitos: [],
    digits: definition.type === 1 ? 3 : 2,
  })
}

export const testAllOfficialApiMonitorDefinitions = async () => {
  const results = []

  for (const definition of OFFICIAL_API_MONITOR_DEFINITIONS) {
    try {
      const latestResults = await testOfficialApiRequestByDefinition(definition.key)
      results.push({
        key: definition.key,
        status: 'ok',
        latestResults,
      })
    } catch (error) {
      results.push({
        key: definition.key,
        status: 'error',
        error: error instanceof Error ? error.message : 'Fallo de red',
      })
    }
  }

  return results
}

export const mockGames = [
  {
    id: GAME_IDS.LOTTO_ACTIVO,
    name: 'Lotto Activo',
    accent: 'neon',
    streamLabel: 'Canal Principal',
    logo: GAME_ASSETS[GAME_IDS.LOTTO_ACTIVO].logo,
    assets: GAME_ASSETS[GAME_IDS.LOTTO_ACTIVO],
    apiPath: buildApiPath(
      GAME_API_ENDPOINTS.LOTTO_ACTIVO,
      '/mock-api/games/lotto-activo.json',
    ),
  },
  {
    id: GAME_IDS.LOTTO_INTER,
    name: 'Lotto Internacional',
    accent: 'gold',
    streamLabel: 'Canal Internacional',
    logo: GAME_ASSETS[GAME_IDS.LOTTO_INTER].logo,
    assets: GAME_ASSETS[GAME_IDS.LOTTO_INTER],
    apiPath: buildApiPath(
      GAME_API_ENDPOINTS.LOTTO_INTER,
      '/mock-api/games/lotto-inter.json',
    ),
  },
  {
    id: GAME_IDS.PATRONUS,
    name: 'Patronus',
    accent: 'neon',
    streamLabel: 'Canal Patronus',
    logo: GAME_ASSETS[GAME_IDS.PATRONUS].logo,
    assets: GAME_ASSETS[GAME_IDS.PATRONUS],
    buildData: buildPatronusPayload,
  },
  {
    id: GAME_IDS.TRIO_ACTIVO,
    name: 'Trio Activo',
    accent: 'gold',
    streamLabel: 'Canal Trio',
    logo: GAME_ASSETS[GAME_IDS.TRIO_ACTIVO].logo,
    assets: GAME_ASSETS[GAME_IDS.TRIO_ACTIVO],
    buildData: buildTrioPayload,
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

  const payload = await loadBasePayload(game)
  const animalitos = Array.isArray(payload.animalitos) ? payload.animalitos : []
  const digits = game.assets?.animalitoDigits || 2

  let officialLastResults = null

  try {
    officialLastResults = await fetchOfficialApiResults(game.id, animalitos, digits)
  } catch {
    officialLastResults = null
  }

  return {
    ...game,
    ...payload,
    assets: game.assets,
    id: game.id,
    name: payload.name || game.name,
    streamLabel: payload.streamLabel || game.streamLabel,
    lastResults:
      officialLastResults && officialLastResults.length > 0
        ? officialLastResults
        : Array.isArray(payload.lastResults)
          ? payload.lastResults
          : [],
  }
}
