import { VideoPlayer } from '@/features/streaming/components/VideoPlayer'

export const SingleGameView = ({
  game,
  latestResult,
  resultsByGame,
  syncMeta,
  winnerEvent,
  games,
  currentGame,
  onSelectGame,
}) => {
  return (
    <VideoPlayer
      game={game}
      latestResult={latestResult}
      resultsByGame={resultsByGame}
      syncMeta={syncMeta}
      winnerEvent={winnerEvent}
      games={games}
      currentGame={currentGame}
      onSelectGame={onSelectGame}
    />
  )
}
