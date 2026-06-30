import { Panel } from '@/components/ui/Panel'
import { useEffect, useMemo, useState } from 'react'
import playClothImage from '@/assets/PAÑO -2 ajustado.png'
import { GAME_IDS } from '@/features/games/services/mockData'

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

const DRIVE_FILE_ID_PATTERNS = [/\/file\/d\/([^/]+)/i, /[?&]id=([^&#]+)/i]
const DEFAULT_WINNER_MEDIA_DURATION_MS = 25000
const WINNER_MEDIA_REPEAT_COUNT = 2
const WINNER_MODAL_ANIMATION_MS = 360
const DEFAULT_AD_ROTATION_MS = 12000

const getDriveFileId = (source) => {
  if (!source) return null

  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = source.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

const buildWinnerMediaSource = (source) => {
  const driveFileId = getDriveFileId(source)

  if (driveFileId) {
    return {
      kind: 'video',
      src: `https://drive.google.com/uc?export=download&id=${driveFileId}`,
      fallbackKind: 'iframe',
      fallbackSrc: `https://drive.google.com/file/d/${driveFileId}/preview?autoplay=1&rm=minimal`,
      durationMs: DEFAULT_WINNER_MEDIA_DURATION_MS,
    }
  }

  return {
    kind: 'video',
    src: source,
  }
}

const resolveWinnerVideoSource = (winnerVideos, winnerNumber) => {
  if (!winnerVideos || winnerNumber === undefined || winnerNumber === null) return null

  if (Array.isArray(winnerVideos)) {
    const numericIndex = Number(winnerNumber)
    const nextVideo = Number.isNaN(numericIndex) ? null : winnerVideos[numericIndex]
    return typeof nextVideo === 'string' ? nextVideo : nextVideo?.url || null
  }

  const normalizedNumber = String(winnerNumber)
  const paddedNumber = normalizedNumber.padStart(2, '0')
  const candidates = [normalizedNumber, paddedNumber]

  for (const key of candidates) {
    const entry = winnerVideos[key]
    if (!entry) continue
    return typeof entry === 'string' ? entry : entry?.url || null
  }

  return null
}

const PLAY_CLOTH_IMAGE = playClothImage

export const VideoPlayer = ({
  game,
  latestResult,
  resultsByGame,
  syncMeta,
  winnerEvent,
  games = [],
  currentGame,
  onSelectGame,
}) => {
  const [adIndex, setAdIndex] = useState(0)
  const [displayAdImage, setDisplayAdImage] = useState(null)
  const [winnerVideoPlayback, setWinnerVideoPlayback] = useState(null)
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false)

  const animalitos = game?.animalitos || []
  const countdown = formatCountdown(syncMeta.remainingMs)
  const showAds = syncMeta.ads.length > 0
  const adRotationMs =
    typeof syncMeta.adRotationMs === 'number' && syncMeta.adRotationMs > 0
      ? syncMeta.adRotationMs
      : DEFAULT_AD_ROTATION_MS
  const winnerVideos = syncMeta.winnerVideosByGame?.[GAME_IDS.LOTTO_ACTIVO] || {}
  const selectedGameId = currentGame && currentGame !== 'SIMULTANEOUS' ? currentGame : game?.id
  const selectedGame = useMemo(
    () => games.find((item) => item.id === selectedGameId) || game,
    [game, games, selectedGameId],
  )

  const winnerFeed = useMemo(() => {
    const now = syncMeta.lastUpdate instanceof Date ? syncMeta.lastUpdate : new Date()
    const gameResults = resultsByGame?.[selectedGame?.id] || []
    const resultFeed = gameResults
      .slice(0, 5)
      .map((entry, index) => ({
        ...entry.animal,
        time: entry.drawnAt
          ? drawTimeFormat.format(new Date(entry.drawnAt))
          : buildFallbackTime(now, index),
      }))

    if (resultFeed.length >= 5) {
      return resultFeed
    }

    const fallbackAnimals = selectedGame?.animalitos || animalitos
    for (const candidate of fallbackAnimals) {
      if (resultFeed.some((item) => item.number === candidate.number)) continue
      resultFeed.push({
        ...candidate,
        time: buildFallbackTime(now, resultFeed.length),
      })
      if (resultFeed.length === 5) break
    }

    return resultFeed
  }, [animalitos, resultsByGame, selectedGame, syncMeta.lastUpdate])

  useEffect(() => {
    if (syncMeta.ads.length === 0) {
      setDisplayAdImage(null)
      return
    }

    syncMeta.ads.forEach((ad) => {
      if (!ad?.image) return
      const img = new Image()
      img.src = encodeURI(ad.image)
    })
  }, [syncMeta.ads])

  useEffect(() => {
    if (!showAds || syncMeta.ads.length < 2) return
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % syncMeta.ads.length)
    }, adRotationMs)
    return () => clearInterval(timer)
  }, [adRotationMs, showAds, syncMeta.ads])

  useEffect(() => {
    if (!winnerEvent || winnerEvent.type !== 'winner') return
    if (winnerEvent.gameId !== GAME_IDS.LOTTO_ACTIVO) return
    const src = resolveWinnerVideoSource(winnerVideos, winnerEvent.winner?.number)

    if (!src) return

    setWinnerVideoPlayback({
      ...buildWinnerMediaSource(src),
      key: `${winnerEvent.at || Date.now()}-${winnerEvent.winner?.number ?? 'winner'}`,
      playCount: 1,
      status: 'enter',
    })
  }, [winnerEvent, winnerVideos])

  useEffect(() => {
    if (!winnerVideoPlayback || winnerVideoPlayback.status !== 'enter') return

    const timer = setTimeout(() => {
      setWinnerVideoPlayback((current) => {
        if (!current || current.status !== 'enter') return current
        return {
          ...current,
          status: 'open',
        }
      })
    }, 20)

    return () => clearTimeout(timer)
  }, [winnerVideoPlayback])

  useEffect(() => {
    if (!winnerVideoPlayback || winnerVideoPlayback.kind !== 'iframe' || winnerVideoPlayback.status !== 'open') {
      return
    }

    const timer = setTimeout(() => {
      setWinnerVideoPlayback((current) => {
        if (!current || current.kind !== 'iframe' || current.status !== 'open') return current
        if (current.playCount >= WINNER_MEDIA_REPEAT_COUNT) {
          return {
            ...current,
            status: 'exit',
          }
        }

        return {
          ...current,
          playCount: current.playCount + 1,
          key: `${current.key}-loop-${current.playCount + 1}`,
          src: `${current.src.split('&loopToken=')[0]}&loopToken=${current.playCount + 1}`,
        }
      })
    }, winnerVideoPlayback.durationMs || DEFAULT_WINNER_MEDIA_DURATION_MS)

    return () => clearTimeout(timer)
  }, [winnerVideoPlayback])

  useEffect(() => {
    if (!winnerVideoPlayback || winnerVideoPlayback.status !== 'exit') return

    const timer = setTimeout(() => {
      setWinnerVideoPlayback((current) => (current?.status === 'exit' ? null : current))
    }, WINNER_MODAL_ANIMATION_MS)

    return () => clearTimeout(timer)
  }, [winnerVideoPlayback])

  const handleWinnerVideoError = () => {
    setWinnerVideoPlayback((current) => {
      if (!current) return null
      if (current.kind === 'video' && current.fallbackKind && current.fallbackSrc) {
        return {
          ...current,
          kind: current.fallbackKind,
          src: current.fallbackSrc,
          fallbackKind: null,
          fallbackSrc: null,
          key: `${current.key}-fallback`,
          status: 'open',
        }
      }

      return {
        ...current,
        status: 'exit',
      }
    })
  }

  const handleWinnerVideoEnded = () => {
    setWinnerVideoPlayback((current) => {
      if (!current || current.kind !== 'video') return null
      if (current.playCount >= WINNER_MEDIA_REPEAT_COUNT) {
        return {
          ...current,
          status: 'exit',
        }
      }

      return {
        ...current,
        playCount: current.playCount + 1,
        key: `${current.key}-loop-${current.playCount + 1}`,
      }
    })
  }

  const activeAd = showAds ? syncMeta.ads[adIndex % syncMeta.ads.length] : null
  useEffect(() => {
    if (!activeAd?.image) return

    const nextImage = encodeURI(activeAd.image)
    const preload = new Image()
    preload.onload = () => setDisplayAdImage(nextImage)
    preload.onerror = () => setDisplayAdImage((current) => current || nextImage)
    preload.src = nextImage
  }, [activeAd])

  const adBackgroundImage = displayAdImage || (activeAd?.image ? encodeURI(activeAd.image) : null)
  const paddedCountdown = `${countdown}:00`.split(':')
  const winnerModalClassName = winnerVideoPlayback?.status === 'open'
    ? 'scale-100 opacity-100 rotate-0'
    : winnerVideoPlayback?.status === 'exit'
      ? 'scale-50 opacity-0 rotate-[-4deg]'
      : 'scale-50 opacity-0 rotate-[4deg]'

  return (
    <Panel className="h-[calc(100vh-1.5rem)] w-full overflow-hidden border border-[#2f8f4f] bg-[#f4f5f7]">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f5f7]">
        <header className="border-b border-[#d4d8df] bg-[#fdfdfd] px-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a022]">
                Loteria registre
              </p>
              <button
                type="button"
                onClick={() => setIsGameMenuOpen((prev) => !prev)}
                className="mt-1 inline-flex items-center gap-2 rounded-md border border-[#cbd3dc] bg-[#dcefdc] px-3 py-2 font-heading text-xl uppercase text-[#0f6f42]"
              >
                {selectedGame?.logo ? (
                  <img
                    src={selectedGame.logo}
                    alt={`Logo ${selectedGame?.name || 'Lotto Activo'}`}
                    className="h-9 w-auto object-contain"
                    loading="lazy"
                  />
                ) : null}
                {selectedGame?.name || 'Lotto Activo'}
                <span className="text-sm text-[#4b6b57]">▼</span>
              </button>

              {isGameMenuOpen ? (
                <div className="absolute z-30 mt-2 min-w-[260px] rounded-md border border-[#c9d2de] bg-white p-1 shadow-[0_12px_28px_rgba(15,28,45,0.16)]">
                  {games.map((item) => (
                    <button
                      key={`selector-${item.id}`}
                      type="button"
                      onClick={() => {
                        onSelectGame?.(item.id)
                        setIsGameMenuOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left transition ${
                        item.id === selectedGame?.id ? 'bg-[#e6f4ea]' : 'hover:bg-[#f4f7fb]'
                      }`}
                    >
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt={`Logo ${item.name}`}
                          className="h-8 w-auto object-contain"
                          loading="lazy"
                        />
                      ) : null}
                      <span className="font-heading text-lg uppercase text-[#1a3f35]">{item.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
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
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-2xl ${
                        index === 0
                          ? 'border-[#1c7d50] bg-[#e3f4eb] text-[#1c7d50]'
                          : 'border-[#d0d8e2] bg-[#eef2f7] text-[#283444]'
                      }`}
                    >
                      {item.icon || '🐾'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <div className="flex min-w-0 items-center gap-1">
                          <p className="font-heading text-xl uppercase leading-none text-[#2d3d52] sm:text-2xl">
                            {item.name}
                          </p>
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1c7d50] font-heading text-base leading-none text-white sm:h-9 sm:w-9 sm:text-lg">
                            {item.number.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 font-heading text-base text-[#7d8798]">{item.time}</p>
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
            <section className="relative min-h-[300px] max-h-[60vh] flex-1 overflow-hidden border-b border-[#d7dce4] bg-[#edf1f6]">
              {adBackgroundImage ? (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("${adBackgroundImage}")`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(81,147,141,0.38),transparent_25%),radial-gradient(circle_at_85%_65%,rgba(246,243,233,0.88),transparent_24%),linear-gradient(180deg,#335969_0%,#9eb4c1_100%)]" />
              )}

              {winnerVideoPlayback ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1220]/45 backdrop-blur-[2px]">
                  <div
                    className={`relative h-[94%] w-[96%] overflow-hidden rounded-[28px] border border-white/20 bg-black shadow-[0_28px_80px_rgba(3,8,20,0.62)] transition-all duration-300 ease-out ${winnerModalClassName}`}
                  >
                    {winnerVideoPlayback.kind === 'iframe' ? (
                      <div className="relative h-full w-full overflow-hidden bg-black pointer-events-none">
                        <iframe
                          key={winnerVideoPlayback.key}
                          src={winnerVideoPlayback.src}
                          title="Animacion ganadora Lotto Activo"
                          className="h-full w-full"
                          allow="autoplay; fullscreen"
                        />
                      </div>
                    ) : (
                      <video
                        key={winnerVideoPlayback.key}
                        src={winnerVideoPlayback.src}
                        className="winner-video-el pointer-events-none h-full w-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        controls={false}
                        tabIndex={-1}
                        disablePictureInPicture
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        onEnded={handleWinnerVideoEnded}
                        onError={handleWinnerVideoError}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="border-t border-[#d8dde6] bg-[#f8fafc] px-2">
              <div className="flex items-center justify-between gap-3">
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

              <div className="h-[30vh] overflow-hidden rounded-md border border-[#cfd6e0] bg-[#f5f7fb] p-1">
                <img
                  src={PLAY_CLOTH_IMAGE}
                  alt="Pano de jugadas Lotto Activo"
                  className="block h-full w-full rounded-sm object-center"
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