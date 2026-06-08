import { useMemo } from 'react'
import { useGameStore } from '@/store/useGameStore'

export const useBetCart = () => {
  const selectedBets = useGameStore((state) => state.selectedBets)
  const clearBets = useGameStore((state) => state.clearBets)
  const removeBet = useGameStore((state) => state.removeBet)

  const grouped = useMemo(() => {
    return selectedBets.reduce((acc, bet) => {
      if (!acc[bet.gameId]) {
        acc[bet.gameId] = []
      }
      acc[bet.gameId].push(bet)
      return acc
    }, {})
  }, [selectedBets])

  return {
    selectedBets,
    grouped,
    totalBets: selectedBets.length,
    clearBets,
    removeBet,
  }
}
