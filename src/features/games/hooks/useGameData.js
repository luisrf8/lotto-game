import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGamePayload, mockGames } from '../services/mockData'
import { SIMULTANEOUS, useGameStore } from '@/store/useGameStore'

export const useGameData = () => {
  const currentGame = useGameStore((state) => state.currentGame)
  const [gameDataById, setGameDataById] = useState({})
  const [loadingByGame, setLoadingByGame] = useState({})
  const [errorByGame, setErrorByGame] = useState({})

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
    if (currentGame === SIMULTANEOUS) {
      mockGames.forEach((game) => {
        loadGameData(game.id)
      })
      return
    }

    loadGameData(currentGame)
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
    refetchGame: loadGameData,
  }
}
