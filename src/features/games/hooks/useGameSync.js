import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_REALTIME_CONFIG,
  fetchRealtimeConfig,
} from '../services/realtimeConfig'

const toResultEntry = (animal, fallbackDrawnAt) => {
  const resolvedDrawnAt =
    animal?.drawnAt ||
    (animal?.horario && animal?.fecha ? `${animal.fecha}T${animal.horario}` : null) ||
    animal?.horario ||
    fallbackDrawnAt ||
    new Date().toISOString()

  return {
    animal,
    drawnAt: resolvedDrawnAt,
  }
}

export const useGameSync = (games, gameDataById, pollingMeta) => {
  const [resultsByGame, setResultsByGame] = useState({})
  const [lastUpdate, setLastUpdate] = useState(() => new Date())
  const [winnerEvent, setWinnerEvent] = useState(null)
  const [nextDrawAt, setNextDrawAt] = useState(() => pollingMeta?.nextDrawAt || Date.now())
  const [remainingMs, setRemainingMs] = useState(0)
  const [realtimeConfig, setRealtimeConfig] = useState(DEFAULT_REALTIME_CONFIG)
  const previousTopResultByGameRef = useRef({})

  useEffect(() => {
    let mounted = true

    fetchRealtimeConfig().then((config) => {
      if (!mounted) return
      setRealtimeConfig(config)
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setResultsByGame((prev) => {
      const next = { ...prev }

      games.forEach((game) => {
        const initialResults = gameDataById[game.id]?.lastResults

        if (initialResults?.length) {
          next[game.id] = initialResults.map((animal) => toResultEntry(animal))
        } else if (gameDataById[game.id]) {
          next[game.id] = []
        } else if (!next[game.id]) {
          next[game.id] = []
        }
      })

      return next
    })
  }, [games, gameDataById])

  useEffect(() => {
    let latestEvent = null

    games.forEach((game) => {
      const topResult = gameDataById[game.id]?.lastResults?.[0]
      if (!topResult) return

      const topResultKey = `${String(topResult.number)}-${topResult.name || ''}`
      const previousKey = previousTopResultByGameRef.current[game.id]

      previousTopResultByGameRef.current[game.id] = topResultKey

      if (!previousKey || previousKey === topResultKey) return

      latestEvent = {
        type: 'winner',
        gameId: game.id,
        gameName: game.name,
        winner: topResult,
        at: new Date().toISOString(),
      }
    })

    if (latestEvent) {
      setWinnerEvent(latestEvent)
      setLastUpdate(new Date())
    }
  }, [games, gameDataById])

  useEffect(() => {
    if (!pollingMeta?.nextDrawAt) return
    setNextDrawAt(pollingMeta.nextDrawAt)
  }, [pollingMeta?.nextDrawAt])

  useEffect(() => {
    setRemainingMs(Math.max(nextDrawAt - Date.now(), 0))
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) return 0
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [nextDrawAt])

  const syncMeta = useMemo(
    () => ({
      intervalMs: pollingMeta?.pollIntervalMs || realtimeConfig.winnerIntervalMs,
      adThresholdMs: realtimeConfig.adThresholdMs,
      ads: realtimeConfig.ads,
      winnerVideosByGame: realtimeConfig.winnerVideosByGame,
      lastUpdate,
      nextDrawAt,
      remainingMs,
      transport: 'official-api-polling',
    }),
    [lastUpdate, nextDrawAt, pollingMeta?.pollIntervalMs, realtimeConfig, remainingMs],
  )

  return { resultsByGame, syncMeta, winnerEvent }
}
