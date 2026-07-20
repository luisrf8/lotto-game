import { GameSelectorButton } from '@/features/games/components/GameSelectorButton'
import { useGameVisuals } from '@/features/games/hooks/useGameVisuals'
import { SIMULTANEOUS, useGameStore } from '@/store/useGameStore'

export const Sidebar = ({ games, isOpen, onClose }) => {
  const currentGame = useGameStore((state) => state.currentGame)
  const setCurrentGame = useGameStore((state) => state.setCurrentGame)
  const visualGames = useGameVisuals(games)

  const handleSelect = (gameId) => {
    setCurrentGame(gameId)
    onClose()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#d8dde5] bg-[#f1f3f6] px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.3em] text-lotto-neon">Lotto Activo</p>
            <p className="text-sm text-lotto-muted">Control de juegos en vivo</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-lotto-border px-2 py-1 text-xs text-lotto-muted hover:text-lotto-text lg:hidden"
          >
            Cerrar
          </button>
        </div>

        <nav className="space-y-2 h-screen rounded-xl border border-[#d6dbe4] bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => handleSelect(SIMULTANEOUS)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-black transition ${
              currentGame === SIMULTANEOUS
                ? 'border-lotto-neon bg-lotto-neon/10'
                : 'border-[#d2d8e1] bg-[#f7f8fb] hover:border-lotto-gold/60'
            }`}
          >
            Vista Simultanea
          </button>

          {visualGames.map((game) => (
            <GameSelectorButton
              key={game.id}
              game={game}
              active={currentGame === game.id}
              onClick={() => handleSelect(game.id)}
            />
          ))}
        </nav>

        <div className="mt-auto rounded-lg border border-[#d0d6e0] bg-[#e9edf3] p-3 text-xs text-lotto-muted">
          Datos en vivo por WebSocket simulado cada 90 segundos para preproduccion Vercel.
        </div>
      </aside>
    </>
  )
}
