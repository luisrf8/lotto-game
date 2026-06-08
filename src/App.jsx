import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/features/games/components/Sidebar'
import { TopResultsBar } from '@/features/games/components/TopResultsBar'
import { SimultaneousGameView } from '@/features/games/components/SimultaneousGameView'
import { SingleGameView } from '@/features/games/components/SingleGameView'
import { GameGrid } from '@/features/games/components/GameGrid'
import { useGameData } from '@/features/games/hooks/useGameData'
import { useGameSync } from '@/features/games/hooks/useGameSync'
import { SIMULTANEOUS } from '@/store/useGameStore'
import { WinnerRouletteOverlay } from '@/features/streaming/components/WinnerRouletteOverlay'

function App() {
  const { games, currentGame, currentGameData, gameDataById, loadingByGame, errorByGame } =
    useGameData()
  const { resultsByGame, syncMeta, winnerEvent } = useGameSync(games, gameDataById)
  const [betGameId, setBetGameId] = useState(games[0].id)
  const [rouletteEvent, setRouletteEvent] = useState(null)

  const gameForBets = useMemo(() => {
    if (currentGame === SIMULTANEOUS) {
      return games.find((game) => game.id === betGameId) || games[0]
    }

    return currentGameData
  }, [betGameId, currentGame, currentGameData, games])

  const isLoadingGrid = !!loadingByGame[gameForBets.id]
  const gridError = errorByGame[gameForBets.id]
  const latestWinnerNumber = resultsByGame[gameForBets.id]?.[0]?.animal?.number ?? null
  const rouletteGame = rouletteEvent
    ? games.find((game) => game.id === rouletteEvent.gameId)
    : null

  useEffect(() => {
    if (!winnerEvent) return

    const activeGameMatches =
      currentGame === SIMULTANEOUS || currentGame === winnerEvent.gameId

    if (activeGameMatches) {
      setRouletteEvent(winnerEvent)
    }
  }, [currentGame, winnerEvent])

  return (
    <div className="min-h-screen bg-halo bg-lotto-bg text-lotto-text">
      <Sidebar games={games} />

      <div className="ml-0 min-h-screen lg:ml-64">
        <TopResultsBar
          games={games}
          currentGame={currentGame}
          resultsByGame={resultsByGame}
          lastUpdate={syncMeta.lastUpdate}
        />

        <main className="space-y-6 px-4 py-5 md:px-6">
          {currentGame === SIMULTANEOUS ? (
            <SimultaneousGameView games={games} />
          ) : (
            <SingleGameView game={currentGameData} />
          )}

          <section className="rounded-xl border border-lotto-border bg-lotto-panel/60 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-heading text-sm uppercase tracking-[0.22em] text-lotto-muted">
                Grilla de Animalitos
              </p>

              {currentGame === SIMULTANEOUS && (
                <div className="flex flex-wrap gap-2">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => setBetGameId(game.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        gameForBets.id === game.id
                          ? 'border-lotto-neon bg-lotto-neon/10 text-lotto-text'
                          : 'border-lotto-border text-lotto-muted hover:border-lotto-gold/50'
                      }`}
                    >
                      {game.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoadingGrid ? (
              <p className="rounded-lg border border-dashed border-lotto-border p-5 text-sm text-lotto-muted">
                Cargando datos del juego...
              </p>
            ) : gridError ? (
              <p className="rounded-lg border border-red-300/30 bg-red-500/10 p-5 text-sm text-red-200">
                {gridError}
              </p>
            ) : (
              <GameGrid game={gameForBets} winnerNumber={latestWinnerNumber} />
            )}
          </section>
        </main>
      </div>

      <WinnerRouletteOverlay
        event={rouletteEvent}
        game={rouletteGame}
        onClose={() => setRouletteEvent(null)}
      />
    </div>
  )
}

export default App
