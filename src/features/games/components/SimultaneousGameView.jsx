import { VideoPlayer } from '@/features/streaming/components/VideoPlayer'

export const SimultaneousGameView = ({ games }) => {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {games.map((game, index) => (
        <div key={game.id} className="animate-slideIn" style={{ animationDelay: `${index * 90}ms` }}>
          <VideoPlayer title={game.name} subtitle={game.streamLabel} />
        </div>
      ))}
    </section>
  )
}
