import { useGameStore } from '@/store/useGameStore'

export const MicroCard = ({ animal, gameId, isWinner = false }) => {
  const selectedBets = useGameStore((state) => state.selectedBets)
  const toggleBet = useGameStore((state) => state.toggleBet)

  const isSelected = selectedBets.some(
    (item) => item.gameId === gameId && item.number === animal.number,
  )

  const handleClick = () => {
    toggleBet({
      gameId,
      number: animal.number,
      name: animal.name,
      icon: animal.icon,
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex min-h-24 flex-col justify-between rounded-lg border p-3 text-left transition duration-200 ${
        isWinner
          ? 'animate-pulseGlow border-lotto-neon bg-lotto-neon/15 text-lotto-text shadow-neon'
          : isSelected
          ? 'border-lotto-neon bg-lotto-neon/10 text-lotto-text shadow-neon'
          : 'border-lotto-border bg-[#101a2d]/80 text-lotto-text hover:border-lotto-gold/70'
      }`}
    >
      <span className="text-2xl leading-none">{animal.icon}</span>
      <div>
        <p className="font-heading text-xs tracking-wider text-lotto-muted">
          {animal.number.toString().padStart(2, '0')}
        </p>
        <p className="text-base leading-tight">{animal.name}</p>
        {isWinner && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-lotto-neon">Ganador</p>
        )}
      </div>
    </button>
  )
}
