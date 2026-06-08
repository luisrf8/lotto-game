import { Panel } from '@/components/ui/Panel'
import { useBetCart } from '../hooks/useBetCart'

export const BetTicket = () => {
  const { selectedBets, totalBets, removeBet } = useBetCart()

  return (
    <Panel className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-sm uppercase tracking-widest text-lotto-neon">Ticket Activo</p>
        <span className="rounded-full border border-lotto-gold/50 px-2 py-1 text-xs text-lotto-gold">
          {totalBets} seleccion
        </span>
      </div>

      <div className="space-y-2 overflow-auto pr-1 text-sm">
        {selectedBets.length === 0 ? (
          <p className="rounded-md border border-dashed border-lotto-border p-3 text-lotto-muted">
            Selecciona animalitos para armar tu ticket.
          </p>
        ) : (
          selectedBets.map((bet) => (
            <div
              key={`${bet.gameId}-${bet.number}`}
              className="flex items-center justify-between rounded-md border border-lotto-border bg-[#101b2d] px-3 py-2"
            >
              <p>
                <span className="mr-2">{bet.icon}</span>
                {bet.name} #{bet.number.toString().padStart(2, '0')}
              </p>
              <button
                type="button"
                className="text-xs text-lotto-muted hover:text-red-300"
                onClick={() => removeBet(bet.gameId, bet.number)}
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}
