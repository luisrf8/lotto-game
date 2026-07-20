import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGamePayload, mockGames } from '../services/mockData'
import { SIMULTANEOUS, useGameStore } from '@/store/useGameStore'

const DRAW_START_HOUR = 8
const DRAW_END_HOUR = 19
const DRAW_WINDOW_MINUTES = 5
const POLL_NEAR_DRAW_MS = 30000
const POLL_IDLE_MS = 180000

const toDrawTimestamps = (baseDate) => {
  const draws = []

  for (let hour = DRAW_START_HOUR; hour <= DRAW_END_HOUR; hour += 1) {
    draws.push(new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour,
      0,
      0,
      0,
    ).getTime())
  }

  return draws
}

const buildPollingMeta = (nowDate = new Date()) => {
  const nowMs = nowDate.getTime()
  const windowMs = DRAW_WINDOW_MINUTES * 60 * 1000
  const todayDraws = toDrawTimestamps(nowDate)
  const nearestDraw = todayDraws.reduce(
    (closest, drawAt) => {
      const distance = Math.abs(drawAt - nowMs)

      if (!closest || distance < closest.distance) {
        return { drawAt, distance }
      }

      return closest
    },
    null,
  )

  const withinWindow = Boolean(nearestDraw && nearestDraw.distance <= windowMs)
  const nextToday = todayDraws.find((drawAt) => drawAt >= nowMs)

  if (nextToday) {
    return {
      nextDrawAt: nextToday,
      pollIntervalMs: withinWindow ? POLL_NEAR_DRAW_MS : POLL_IDLE_MS,
      withinWindow,
    }
  }

  const tomorrow = new Date(nowDate)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowFirstDraw = toDrawTimestamps(tomorrow)[0]

  return {
    nextDrawAt: tomorrowFirstDraw,
    pollIntervalMs: POLL_IDLE_MS,
    withinWindow: false,
  }
}

export const useGameData = () => {
  const currentGame = useGameStore((state) => state.currentGame)
  const [gameDataById, setGameDataById] = useState({})
  const [loadingByGame, setLoadingByGame] = useState({})
  const [errorByGame, setErrorByGame] = useState({})
  const [pollingMeta, setPollingMeta] = useState(() => buildPollingMeta())

  const loadGameData = useCallback(async (gameId) => {
    setLoadingByGame((prev) => ({ ...prev, [gameId]: true }))
    setErrorByGame((prev) => ({ ...prev, [gameId]: null }))

    try {
      const payload = await fetchGamePayload(gameId)
      setGameDataById((prev) => ({ ...prev, [gameId]: payload }))
    } catch (error) {
      setErrorByGame((prev) => ({
        ...prev,
        [gameId]: error instanceof Error ? error.message : 'Error cargando juego',
      }))
    } finally {
      setLoadingByGame((prev) => ({ ...prev, [gameId]: false }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer = null

    const gameIdsToRefresh =
      currentGame === SIMULTANEOUS
        ? mockGames.map((item) => item.id)
        : [currentGame]

    const runRefreshCycle = async () => {
      for (const gameId of gameIdsToRefresh) {
        if (cancelled) return
        await loadGameData(gameId)
      }
    }

    const scheduleNext = () => {
      const nextMeta = buildPollingMeta(new Date())
      setPollingMeta(nextMeta)

      timer = setTimeout(async () => {
        await runRefreshCycle()

        if (cancelled) return
        scheduleNext()
      }, nextMeta.pollIntervalMs)
    }

    runRefreshCycle().then(() => {
      if (cancelled) return
      scheduleNext()
    })

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [currentGame, loadGameData])

  const games = useMemo(
    () =>
      mockGames.map((game) => ({
        ...game,
        ...(gameDataById[game.id] || {}),
      })),
    [gameDataById],
  )

  const currentGameData = useMemo(() => {
    const baseGame = games[0]

    if (currentGame === SIMULTANEOUS) {
      return baseGame
    }

    return games.find((game) => game.id === currentGame) || baseGame
  }, [currentGame, games])

  return {
    games,
    currentGame,
    currentGameData,
    gameDataById,
    loadingByGame,
    errorByGame,
    pollingMeta,
    refetchGame: loadGameData,
  }
}
