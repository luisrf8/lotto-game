import { useEffect, useMemo, useState } from 'react'
import { pickUniqueResults } from '../services/mockData'
import {
  createGameWinnerSocket,
  GAME_WINNER_INTERVAL_MS,
} from '../services/mockWebSocket'

const INTERVAL_MS = GAME_WINNER_INTERVAL_MS

const toResultEntry = (animal, drawnAt = new Date().toISOString()) => ({
  animal,
  drawnAt,
})

export const useGameSync = (games, gameDataById) => {
  const [resultsByGame, setResultsByGame] = useState({})
  const [lastUpdate, setLastUpdate] = useState(() => new Date())
  const [winnerEvent, setWinnerEvent] = useState(null)

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
    const socket = createGameWinnerSocket({ intervalMs: INTERVAL_MS })

    const unsubscribe = socket.subscribe((event) => {
      if (event.type !== 'winner') return

      setWinnerEvent(event)
      setLastUpdate(new Date())
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
  }, [games, gameDataById])

  const syncMeta = useMemo(
    () => ({ intervalMs: INTERVAL_MS, lastUpdate, transport: 'websocket-mock' }),
    [lastUpdate],
  )

  return { resultsByGame, syncMeta, winnerEvent }
}
