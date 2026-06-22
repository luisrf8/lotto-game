import { useMemo } from 'react'
import { SingleGameView } from '@/features/games/components/SingleGameView'
import { useGameData } from '@/features/games/hooks/useGameData'
import { useGameSync } from '@/features/games/hooks/useGameSync'
import { SIMULTANEOUS, useGameStore } from '@/store/useGameStore'

function App() {
  const { games, currentGame, currentGameData, gameDataById } = useGameData()
  const { resultsByGame, syncMeta } = useGameSync(games, gameDataById)
  const setCurrentGame = useGameStore((state) => state.setCurrentGame)

  const activeGame = useMemo(() => {
    if (currentGame === SIMULTANEOUS) {
      return games[0]
    }
    return currentGameData
  }, [currentGame, currentGameData, games])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(219,188,92,0.14),transparent_35%),radial-gradient(circle_at_95%_35%,rgba(33,178,94,0.12),transparent_42%),#111824] p-3 md:p-4">
          <SingleGameView
            game={activeGame}
            latestResult={resultsByGame[activeGame.id]?.[0]}
            resultsByGame={resultsByGame}
            syncMeta={syncMeta}
            games={games}
            currentGame={currentGame}
            onSelectGame={setCurrentGame}
          />
        </div>
  )
}

export default App
