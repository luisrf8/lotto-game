import { useMemo } from 'react'
import { SingleGameView } from '@/features/games/components/SingleGameView'
import { useGameData } from '@/features/games/hooks/useGameData'
import { useGameSync } from '@/features/games/hooks/useGameSync'
import { SIMULTANEOUS, useGameStore } from '@/store/useGameStore'

function App() {
  const { games, currentGame, currentGameData, gameDataById, pollingMeta } = useGameData()
  const { resultsByGame, syncMeta, winnerEvent } = useGameSync(games, gameDataById, pollingMeta)
  const setCurrentGame = useGameStore((state) => state.setCurrentGame)

  const activeGame = useMemo(() => {
    if (currentGame === SIMULTANEOUS) {
      return games[0]
    }
    return currentGameData
  }, [currentGame, currentGameData, games])

  return (
    <>
          <SingleGameView
            game={activeGame}
            latestResult={resultsByGame[activeGame.id]?.[0]}
            resultsByGame={resultsByGame}
            syncMeta={syncMeta}
            winnerEvent={winnerEvent}
            games={games}
            currentGame={currentGame}
            onSelectGame={setCurrentGame}
          />
    </>
  )
}

export default App
