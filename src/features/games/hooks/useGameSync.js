import { useEffect, useMemo, useState } from 'react'
import {
  createGameWinnerSocket,
} from '../services/mockWebSocket'
import {
  DEFAULT_REALTIME_CONFIG,
  fetchRealtimeConfig,
} from '../services/realtimeConfig'

const toResultEntry = (animal, drawnAt = new Date().toISOString()) => ({
  animal,
  drawnAt,
})

export const useGameSync = (games, gameDataById) => {
  const [resultsByGame, setResultsByGame] = useState({})
  const [lastUpdate, setLastUpdate] = useState(() => new Date())
  const [winnerEvent, setWinnerEvent] = useState(null)
  const [nextDrawAt, setNextDrawAt] = useState(() => Date.now())
  const [remainingMs, setRemainingMs] = useState(0)
  const [realtimeConfig, setRealtimeConfig] = useState(DEFAULT_REALTIME_CONFIG)

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
          next[game.id] = initialResults.slice(0, 3).map((animal, index) =>
            toResultEntry(
              animal,
              new Date(Date.now() - (index + 1) * 60000).toISOString(),
            ),
          )
        } else if (!next[game.id]) {
          next[game.id] = []
        }
      })

      return next
    })
  }, [games, gameDataById])

  useEffect(() => {
    const intervalMs = realtimeConfig.winnerIntervalMs
    const socket = createGameWinnerSocket({ intervalMs })

    const unsubscribe = socket.subscribe((event) => {
      if (event.type !== 'winner') return

      setWinnerEvent(event)
      setLastUpdate(new Date())
      setNextDrawAt(Date.now() + intervalMs)
      setResultsByGame((prev) => {
        const previousResults = prev[event.gameId] || []
        const withoutWinner = previousResults.filter(
          (item) => item.animal.number !== event.winner.number,
        )

        return {
          ...prev,
          [event.gameId]: [toResultEntry(event.winner), ...withoutWinner].slice(0, 3),
        }
      })
    })

    socket.start({
      games,
      getGameData: (gameId) => gameDataById[gameId],
    })

    return () => {
      unsubscribe()
      socket.stop()
    }
  }, [games, gameDataById, realtimeConfig.winnerIntervalMs])

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
      intervalMs: realtimeConfig.winnerIntervalMs,
      adThresholdMs: realtimeConfig.adThresholdMs,
      ads: realtimeConfig.ads,
      winnerVideosByGame: realtimeConfig.winnerVideosByGame,
      lastUpdate,
      nextDrawAt,
      remainingMs,
      transport: 'websocket-mock',
    }),
    [lastUpdate, nextDrawAt, realtimeConfig, remainingMs],
  )

  return { resultsByGame, syncMeta, winnerEvent }
}
