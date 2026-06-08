import { SIMULTANEOUS, useGameStore } from '@/store/useGameStore'

export const Sidebar = ({ games }) => {
  const currentGame = useGameStore((state) => state.currentGame)
  const setCurrentGame = useGameStore((state) => state.setCurrentGame)

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-lotto-border bg-[#09111e] px-4 py-6">
      <div className="mb-8">
        <p className="font-heading text-xs uppercase tracking-[0.3em] text-lotto-neon">Lotto Activo</p>
        <p className="text-sm text-lotto-muted">Control de juegos en vivo</p>
      </div>

      <nav className="space-y-2">
        <button
          type="button"
          onClick={() => setCurrentGame(SIMULTANEOUS)}
          className={`w-full rounded-lg border px-3 py-2 text-left transition ${
            currentGame === SIMULTANEOUS
              ? 'border-lotto-neon bg-lotto-neon/10 text-lotto-text'
              : 'border-lotto-border text-lotto-muted hover:border-lotto-gold/60 hover:text-lotto-text'
          }`}
        >
          Vista Simultanea
        </button>

        {games.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => setCurrentGame(game.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left transition ${
              currentGame === game.id
                ? 'border-lotto-gold bg-lotto-gold/10 text-lotto-text'
                : 'border-lotto-border text-lotto-muted hover:border-lotto-neon/60 hover:text-lotto-text'
            }`}
          >
            {game.name}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-lotto-border bg-[#0f1b31] p-3 text-xs text-lotto-muted">
        Datos en vivo por WebSocket simulado cada 90 segundos para preproduccion Vercel.
      </div>
    </aside>
  )
}
