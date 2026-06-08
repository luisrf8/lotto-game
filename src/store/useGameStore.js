import { create } from 'zustand'

export const SIMULTANEOUS = 'SIMULTANEOUS'

export const useGameStore = create((set) => ({
  currentGame: SIMULTANEOUS,
  selectedBets: [],
  setCurrentGame: (gameId) => set({ currentGame: gameId }),
  toggleBet: (bet) =>
    set((state) => {
      const exists = state.selectedBets.some(
        (item) => item.gameId === bet.gameId && item.number === bet.number,
      )

      if (exists) {
        return {
          selectedBets: state.selectedBets.filter(
            (item) => !(item.gameId === bet.gameId && item.number === bet.number),
          ),
        }
      }

      return { selectedBets: [...state.selectedBets, bet] }
    }),
  clearBets: () => set({ selectedBets: [] }),
  removeBet: (gameId, number) =>
    set((state) => ({
      selectedBets: state.selectedBets.filter(
        (item) => !(item.gameId === gameId && item.number === number),
      ),
    })),
}))
