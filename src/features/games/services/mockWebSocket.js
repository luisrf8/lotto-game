const DEFAULT_INTERVAL_MS = 90000
const RETRY_WHEN_EMPTY_MS = 3000

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)]

export const createGameWinnerSocket = ({ intervalMs = DEFAULT_INTERVAL_MS } = {}) => {
  const listeners = new Set()
  let timer = null
  let running = false

  const emit = (payload) => {
    listeners.forEach((listener) => listener(payload))
  }

  const start = ({ games, getGameData }) => {
    if (running) return
    running = true

    const scheduleNext = (delayMs) => {
      timer = setTimeout(tick, delayMs)
    }

    const tick = () => {
      if (!running) return

      const eligibleGames = games.filter((game) => {
        const animalitos = getGameData(game.id)?.animalitos || []
        return animalitos.length > 0
      })

      if (eligibleGames.length === 0) {
        scheduleNext(RETRY_WHEN_EMPTY_MS)
        return
      }

      const game = pickRandom(eligibleGames)
      const animalitos = getGameData(game.id)?.animalitos || []
      const winner = pickRandom(animalitos)

      if (!winner) {
        scheduleNext(RETRY_WHEN_EMPTY_MS)
        return
      }

      emit({
        type: 'winner',
        gameId: game.id,
        gameName: game.name,
        winner,
        at: new Date().toISOString(),
      })

      scheduleNext(intervalMs)
    }

    tick()
  }

  const stop = () => {
    running = false
    if (!timer) return
    clearTimeout(timer)
    timer = null
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return {
    subscribe,
    start,
    stop,
    intervalMs,
  }
}

export const GAME_WINNER_INTERVAL_MS = DEFAULT_INTERVAL_MS
