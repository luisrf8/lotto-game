import { VideoPlayer } from '@/features/streaming/components/VideoPlayer'

export const SimultaneousGameView = ({ games, resultsByGame, syncMeta }) => {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {games.map((game, index) => (
        <div key={game.id} className="animate-slideIn" style={{ animationDelay: `${index * 90}ms` }}>
          <VideoPlayer
            game={game}
            latestResult={resultsByGame[game.id]?.[0]}
            syncMeta={syncMeta}
          />
        </div>
      ))}
    </section>
  )
}
