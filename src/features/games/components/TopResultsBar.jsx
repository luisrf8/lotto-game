import { SIMULTANEOUS } from '@/store/useGameStore'

const timeFormat = new Intl.DateTimeFormat('es-VE', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export const TopResultsBar = ({ games, currentGame, resultsByGame, lastUpdate }) => {
  const gameForResults =
    currentGame === SIMULTANEOUS
      ? games[0]
      : games.find((game) => game.id === currentGame) || games[0]

  const results = resultsByGame[gameForResults.id] || []
  const latest = results[0]
  const podium = results.slice(1, 3)

  return (
    <header className="sticky top-0 z-20 border-b border-[#d7dce5] bg-[#f4f5f7] px-4 py-3 backdrop-blur md:px-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-[0.2em] text-lotto-muted">
          Lotto Activo - Plataforma de Juegos
        </p>
        <h1 className="font-heading text-lg text-lotto-text md:text-xl">{gameForResults.name}</h1>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="rounded-2xl border border-lotto-neon/40 bg-[#edf5ef] p-3 text-lotto-text shadow-sm">
          <p className="font-heading text-xs uppercase tracking-widest text-lotto-neon">
            Ultimos 3 resultados
          </p>

          <div className="mt-2 grid gap-3 md:grid-cols-[1.5fr_1fr]">
            <div className="rounded-xl border border-lotto-gold/45 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-lotto-muted">Ultimo ganador</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-4xl">{latest?.animal?.icon || '🎯'}</span>
                <div>
                  <p className="font-heading text-2xl text-lotto-gold">
                    {(latest?.animal?.number ?? 0).toString().padStart(2, '0')}
                  </p>
                  <p className="text-sm text-lotto-text">{latest?.animal?.name || 'Esperando sorteo'}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-lotto-muted">
                Hora sorteo:{' '}
                {latest?.drawnAt ? timeFormat.format(new Date(latest.drawnAt)) : '--:--:--'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {podium.map((item, index) => (
                <div key={`podium-${item.animal.number}`} className="rounded-lg border border-[#d3d9e2] bg-[#f8f9fb] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-lotto-muted">
                    Puesto {index + 2}
                  </p>
                  <p className="text-sm text-lotto-text">
                    {item.animal.icon} #{item.animal.number.toString().padStart(2, '0')} {item.animal.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-lotto-muted">Hora</p>
          <p className="font-heading text-lg text-lotto-gold">{timeFormat.format(lastUpdate)}</p>
        </div>
      </div>
    </header>
  )
}
