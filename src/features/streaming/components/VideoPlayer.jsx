import { Panel } from '@/components/ui/Panel'
import { useEffect, useMemo, useState } from 'react'
import playClothImage from '@/assets/PAÑO -2 ajustado.png'

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const drawTimeFormat = new Intl.DateTimeFormat('es-VE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const buildFallbackTime = (baseDate, offsetIndex) => {
  const fallback = new Date(baseDate.getTime() - offsetIndex * 60 * 60 * 1000)
  return drawTimeFormat.format(fallback)
}

const PLAY_CLOTH_IMAGE = playClothImage

export const VideoPlayer = ({
  game,
  latestResult,
  resultsByGame,
  syncMeta,
  games = [],
  currentGame,
  onSelectGame,
}) => {
  const [adIndex, setAdIndex] = useState(0)

  const animalitos = game?.animalitos || []
  const countdown = formatCountdown(syncMeta.remainingMs)
  const showAds = syncMeta.remainingMs > syncMeta.adThresholdMs && syncMeta.ads.length > 0

  const allAnimalitos = useMemo(() => {
    const merged = games.flatMap((item) => item.animalitos || [])
    if (merged.length > 0) {
      return merged
    }
    return animalitos
  }, [animalitos, games])

  const winnerFeed = useMemo(() => {
    const now = syncMeta.lastUpdate instanceof Date ? syncMeta.lastUpdate : new Date()
    const feed = []

    if (latestResult?.animal) {
      feed.push({
        ...latestResult.animal,
        time: latestResult.drawnAt
          ? drawTimeFormat.format(new Date(latestResult.drawnAt))
          : buildFallbackTime(now, 0),
      })
    }

    const flatResults = Object.values(resultsByGame || {})
      .flat()
      .map((entry) => entry?.animal)
      .filter(Boolean)

    const fallbackPool = [...flatResults, ...allAnimalitos]
    for (const candidate of fallbackPool) {
      if (feed.some((item) => item.number === candidate.number)) continue
      feed.push({
        ...candidate,
        time: buildFallbackTime(now, feed.length),
      })
      if (feed.length === 5) break
    }

    return feed
  }, [allAnimalitos, latestResult, resultsByGame, syncMeta.lastUpdate])

  useEffect(() => {
    if (!showAds || syncMeta.ads.length < 2) return
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % syncMeta.ads.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [showAds, syncMeta.ads])

  const activeAd = showAds ? syncMeta.ads[adIndex % syncMeta.ads.length] : null
  const paddedCountdown = `${countdown}:00`.split(':')

  return (
    <Panel className="h-[calc(100vh-1.5rem)] w-full overflow-hidden border border-[#2f8f4f] bg-[#f4f5f7]">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f5f7]">
        <header className="border-b border-[#d4d8df] bg-[#fdfdfd] px-3 py-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a022]">
                Loteria registre
              </p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-2 rounded-md border border-[#cbd3dc] bg-[#dcefdc] px-4 py-2 font-heading text-xl uppercase text-[#0f6f42]"
              >
                {game?.name || 'Lotto Activo'}
                <span className="text-sm text-[#4b6b57]">▼</span>
              </button>
            </div>

            <div className="text-right">
              <p className="font-heading text-xs uppercase tracking-[0.22em] text-[#3e4554]">
                Siguiente sorteo
              </p>
              <div className="mt-1 flex items-center rounded-md border border-[#d0d5de] bg-white px-3 py-1.5">
                {paddedCountdown.map((chunk, index) => (
                  <div key={`clock-${chunk}-${index}`} className="flex items-center">
                    {index > 0 && <span className="px-0.5 font-heading text-4xl text-[#2c6a4a]">:</span>}
                    <span className="font-heading text-4xl leading-none text-[#2c6a4a]">{chunk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[230px_1fr]">
          <aside className="flex min-h-0 flex-col border-r border-[#d8dce3] bg-[#ebeef3]">
            <div className="border-b border-[#d8dce3] px-3 py-3">
              <p className="font-heading text-2xl uppercase tracking-[0.12em] text-[#1f7b5c]">Ganadores</p>
            </div>

            <div className="space-y-3 overflow-auto px-2 py-3">
              {winnerFeed.map((item, index) => (
                <button
                  key={`winner-${item.number}`}
                  type="button"
                  onClick={() => onSelectGame?.(currentGame || game?.id)}
                  className={`w-full rounded-md border px-2 py-2 text-left transition ${
                    index === 0
                      ? 'border-[#d7a72c] bg-white shadow-[0_3px_9px_rgba(21,30,43,0.12)]'
                      : 'border-[#d8dee7] bg-[#f2f4f8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-md font-heading text-2xl ${
                        index === 0 ? 'bg-[#1c7d50] text-white' : 'bg-[#dde3ea] text-[#1a2330]'
                      }`}
                    >
                      {item.number.toString().padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-xl uppercase text-[#2d3d52] sm:text-2xl">{item.name}</p>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                        {index === 0 ? (
                          <span className="font-semibold uppercase tracking-[0.08em] text-[#d49e1f]">
                            Ganador destacado
                          </span>
                        ) : (
                          <span className="font-semibold uppercase text-[#8792a3]">Resultado</span>
                        )}
                        <span className="font-heading text-base text-[#7d8798]">{item.time}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-auto border-t border-[#d8dce3] px-3 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7f65]">
                Servidor activo
              </p>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col">
            <section className="relative min-h-[300px] flex-1 overflow-hidden border-b border-[#d7dce4] bg-[#edf1f6]">
              {showAds && activeAd ? (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${activeAd.image})`,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover',
                    }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(81,147,141,0.38),transparent_25%),radial-gradient(circle_at_85%_65%,rgba(246,243,233,0.88),transparent_24%),linear-gradient(180deg,#335969_0%,#9eb4c1_100%)]" />
              )}
            </section>

            <section className="border-t border-[#d8dde6] bg-[#f8fafc] px-3 py-3 md:px-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-heading text-xs uppercase tracking-[0.15em] text-[#32485f]">
                  Pano de jugadas
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#cad3df] bg-white px-3 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4a5c73]">
                    Estado:
                  </span>
                  <span className="rounded-full bg-[#d7f0de] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#247549]">
                    Apuestas abiertas
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-[#cfd6e0] bg-[#f5f7fb] p-1">
                <img
                  src={PLAY_CLOTH_IMAGE}
                  alt="Pano de jugadas Lotto Activo"
                  className="h-[160px] w-full rounded-sm object-cover object-top md:h-[190px]"
                  loading="lazy"
                />
              </div>
            </section>
          </main>
        </div>
      </div>
    </Panel>
  )
}