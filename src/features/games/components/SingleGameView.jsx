import { VideoPlayer } from '@/features/streaming/components/VideoPlayer'

export const SingleGameView = ({ game }) => {
  return <VideoPlayer title={game.name} subtitle={game.streamLabel} />
}
