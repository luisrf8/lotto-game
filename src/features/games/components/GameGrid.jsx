import { MicroCard } from './MicroCard'

export const GameGrid = ({ game, winnerNumber = null }) => {
  const animalitos = game?.animalitos || []

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {animalitos.map((animal) => (
        <MicroCard
          key={`${game.id}-${animal.number}`}
          animal={animal}
          gameId={game.id}
          isWinner={winnerNumber === animal.number}
        />
      ))}
    </div>
  )
}
