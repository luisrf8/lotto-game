import { useEffect, useMemo, useState } from 'react'

const SPIN_MS = 5200
const TICK_MS = 120
const CELEBRATION_MS = 5000

const confettiPalette = ['#39ff9b', '#f4c76c', '#6ce7ff', '#ff6aa2']
const confettiItems = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: `${4 + (index * 4.2) % 92}%`,
  delay: `${(index % 7) * 0.18}s`,
  duration: `${1.4 + (index % 4) * 0.35}s`,
  color: confettiPalette[index % confettiPalette.length],
}))

const fireworks = [
  { id: 'fw-l', left: '14%', top: '18%' },
  { id: 'fw-r', left: '86%', top: '20%' },
  { id: 'fw-b', left: '50%', top: '78%' },
]

const uniqueByNumber = (items) => {
  const visited = new Set()
  return items.filter((item) => {
    if (visited.has(item.number)) return false
    visited.add(item.number)
    return true
  })
}

export const WinnerRouletteOverlay = ({ event, game, onClose }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [current, setCurrent] = useState(null)

  const rouletteList = useMemo(() => {
    const animalitos = game?.animalitos || []
    const winner = event?.winner
    if (!winner) return animalitos
    return uniqueByNumber([...animalitos, winner])
  }, [event?.winner, game?.animalitos])

  useEffect(() => {
    if (!event?.winner || rouletteList.length === 0) return

    setIsRunning(true)
    let index = 0
    let ticker = null

    ticker = setInterval(() => {
      setCurrent(rouletteList[index % rouletteList.length])
      index += 1
    }, TICK_MS)

    const stopSpin = setTimeout(() => {
      clearInterval(ticker)
      ticker = null
      setCurrent(event.winner)
      setIsRunning(false)
    }, SPIN_MS)

    const autoClose = setTimeout(() => {
      onClose()
    }, SPIN_MS + CELEBRATION_MS)

    return () => {
      if (ticker) {
        clearInterval(ticker)
      }
      clearTimeout(stopSpin)
      clearTimeout(autoClose)
    }
  }, [event, onClose, rouletteList])

  if (!event?.winner) return null

  const showCelebration = !isRunning && !!current

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#01050d]/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-lotto-gold/50 bg-[#09101d] p-6 shadow-neon">
        <p className="font-heading text-center text-xs uppercase tracking-[0.25em] text-lotto-neon">
          Flujo de Sorteo en Vivo
        </p>
        <h2 className="mt-2 text-center font-heading text-2xl text-lotto-text">{game?.name}</h2>

        <div className="mt-6 rounded-xl border border-lotto-border bg-[#111a2a] p-5">
          <p className="mb-3 text-center text-sm text-lotto-muted">
            {isRunning
              ? 'Ruleta girando... esperando ganador confirmado'
              : 'Ganador confirmado'}
          </p>

          <div className="relative mx-auto flex max-w-md items-center justify-center gap-4 overflow-hidden rounded-xl border border-lotto-neon/30 bg-[#0a162a] py-6">
            {showCelebration && (
              <>
                {confettiItems.map((piece) => (
                  <span
                    key={`confetti-${piece.id}`}
                    className="pointer-events-none absolute top-0 h-2 w-1 animate-confettiFall rounded-sm"
                    style={{
                      left: piece.left,
                      animationDelay: piece.delay,
                      animationDuration: piece.duration,
                      backgroundColor: piece.color,
                    }}
                  />
                ))}

                {fireworks.map((burst) => (
                  <span
                    key={burst.id}
                    className="pointer-events-none absolute h-20 w-20 animate-fireworkBurst rounded-full border border-lotto-gold/45"
                    style={{ left: burst.left, top: burst.top, transform: 'translate(-50%, -50%)' }}
                  />
                ))}
              </>
            )}

            <span className={`text-6xl ${isRunning ? 'animate-pulse' : ''}`}>{current?.icon || '🎯'}</span>
            <div>
              <p className="font-heading text-3xl text-lotto-gold">
                {(current?.number ?? 0).toString().padStart(2, '0')}
              </p>
              <p className="text-lg text-lotto-text">{current?.name || 'Procesando...'}</p>
              {showCelebration && (
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-lotto-neon">Ganador del sorteo</p>
              )}
            </div>
          </div>

          {isRunning ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {rouletteList.slice(0, 12).map((item) => (
                <span
                  key={`roulette-${item.number}`}
                  className="rounded-full border border-lotto-border bg-[#0d182c] px-2 py-1 text-xs text-lotto-muted"
                >
                  {item.icon} {item.number.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex justify-center">
              <span className="rounded-full border border-lotto-gold/50 bg-[#13263d] px-4 py-2 text-sm text-lotto-gold">
                Ganador final: {current?.icon} #{(current?.number ?? 0).toString().padStart(2, '0')} {current?.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
