import { Panel } from '@/components/ui/Panel'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GameSelectorButton } from '@/features/games/components/GameSelectorButton'
import { ApiMonitorView } from '@/features/games/components/ApiMonitorView'
import { useGameVisuals } from '@/features/games/hooks/useGameVisuals'
import playClothImage from '@/assets/PAÑO -2 ajustado.png'

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
const GAME_SWITCH_LOADING_MS = 650
const FORCE_WINNER_MODAL_FOR_EDIT = false
// const FORCE_WINNER_MODAL_FOR_EDIT = true // Activa esta linea (y comenta la de arriba) para modo edicion.

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

const resolveFirstWinnerVideoSource = (winnerVideos) => {
  if (!winnerVideos) return null

  if (Array.isArray(winnerVideos)) {
    const firstEntry = winnerVideos.find(Boolean)
    return typeof firstEntry === 'string' ? firstEntry : firstEntry?.url || null
  }

  const firstEntry = Object.values(winnerVideos).find(Boolean)
  return typeof firstEntry === 'string' ? firstEntry : firstEntry?.url || null
}

const buildPatronusNameVariants = (winnerName) => {
  if (!winnerName) return []

  const raw = String(winnerName).trim()
  const compact = raw.replace(/\s+/g, '')
  const titleCase = compact
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
  const plain = compact.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const plainTitleCase = plain
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

  return [...new Set([compact, titleCase, plain, plainTitleCase])].filter(Boolean)
}

const resolveWinnerAnimalImageSources = (selectedGame, winnerNumber, winnerName) => {
  const resolver = selectedGame?.assets?.animalitoImageResolver
  const defaultSources = typeof resolver === 'function' ? resolver(winnerNumber).filter(Boolean) : []

  if (selectedGame?.id !== 'PATRONUS') {
    return defaultSources
  }

  const winnerNumberLabel = String(winnerNumber ?? '').padStart(selectedGame?.assets?.animalitoDigits || 2, '0')
  const patronusBasePath = '/mock-api/games/patronus/animalitos'
  const nameVariants = buildPatronusNameVariants(winnerName)
  const numberVariants = [...new Set([String(winnerNumber ?? ''), winnerNumberLabel])].filter(Boolean)

  const numberAndNameSources = numberVariants.flatMap((numberCandidate) =>
    nameVariants.flatMap((nameCandidate) => [
      `${patronusBasePath}/Webp/${numberCandidate}-${nameCandidate}.webp`,
      `${patronusBasePath}/png/${numberCandidate}-${nameCandidate}.png`,
    ]),
  )

  return [...new Set([...numberAndNameSources, ...defaultSources])]
}

const buildHeroSlides = (game, ads = []) => {
  const adSlides = (Array.isArray(ads) ? ads : [])
    .filter((ad) => ad?.image)
    .map((ad) => ({
      id: ad.id || ad.title || ad.image,
      type: 'ad',
      title: ad.title || 'Publicidad',
      image: ad.image,
    }))

  const gameAssets = game?.assets || {}
  const gameSlides = []

  if (gameAssets.ruleta) {
    gameSlides.push({
      id: `${game.id}-ruleta`,
      type: 'ruleta',
      title: 'Ruleta del juego',
      image: gameAssets.ruleta,
    })
  }

  if (Array.isArray(gameAssets.tabloide)) {
    gameAssets.tabloide.forEach((tabloideImage, index) => {
      if (!tabloideImage) return
      gameSlides.push({
        id: `${game.id}-tabloide-${index}`,
        type: 'tabloide',
        title: `Tabloide ${index + 1}`,
        image: tabloideImage,
      })
    })
  }

  const slides = []

  if (gameSlides[0]) {
    slides.push(gameSlides[0])
  }

  const remainingGameSlides = gameSlides.slice(1)
  const maxLength = Math.max(adSlides.length, remainingGameSlides.length)

  for (let index = 0; index < maxLength; index += 1) {
    if (adSlides[index]) slides.push(adSlides[index])
    if (remainingGameSlides[index]) slides.push(remainingGameSlides[index])
  }

  return slides.length > 0 ? slides : adSlides
}

const PLAY_CLOTH_IMAGE = playClothImage
const VIEW_MODES = {
  GAME: 'GAME',
  API_MONITOR: 'API_MONITOR',
}

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
  const [heroIndex, setHeroIndex] = useState(0)
  const [winnerVideoPlayback, setWinnerVideoPlayback] = useState(null)
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false)
  const [isSwitchingGame, setIsSwitchingGame] = useState(false)
  const [viewMode, setViewMode] = useState(VIEW_MODES.GAME)
  const previousSelectedGameIdRef = useRef(null)

  const visualGames = useGameVisuals(games)

  const animalitos = game?.animalitos || []
  const countdown = formatCountdown(syncMeta.remainingMs)
  const adRotationMs =
    typeof syncMeta.adRotationMs === 'number' && syncMeta.adRotationMs > 0
      ? syncMeta.adRotationMs
      : DEFAULT_AD_ROTATION_MS
  const selectedGameId = currentGame && currentGame !== 'SIMULTANEOUS' ? currentGame : game?.id
  const selectedGame = useMemo(
    () => visualGames.find((item) => item.id === selectedGameId) || game,
    [game, selectedGameId, visualGames],
  )
  const winnerVideos = syncMeta.winnerVideosByGame?.[selectedGame?.id] || {}
  const heroSlides = useMemo(() => buildHeroSlides(selectedGame, syncMeta.ads), [selectedGame, syncMeta.ads])
  const activeHeroSlide = heroSlides.length > 0 ? heroSlides[heroIndex % heroSlides.length] : null
  const heroPalette = selectedGame?.palette || {
    primary: '#1c7d50',
    secondary: '#d7a72c',
    accent: '#0f6f42',
    surface: '#f8fbff',
    text: '#081016',
  }
  const isTrioActivo = selectedGame?.id === 'TRIO_ACTIVO'
  const countdownNumberColor = heroPalette.accent || heroPalette.primary

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
  const gamePanoImage = selectedGame?.assets?.pano || PLAY_CLOTH_IMAGE

  const handleSelectGame = (gameId) => {
    if (!gameId) {
      setIsGameMenuOpen(false)
      return
    }

    if (gameId === selectedGameId) {
      setViewMode(VIEW_MODES.GAME)
      setIsGameMenuOpen(false)
      return
    }

    setViewMode(VIEW_MODES.GAME)
    setIsSwitchingGame(true)
    onSelectGame?.(gameId)
    setIsGameMenuOpen(false)
  }

  const handleOpenApiMonitor = () => {
    setViewMode(VIEW_MODES.API_MONITOR)
    setIsGameMenuOpen(false)
  }

  useEffect(() => {
    if (heroSlides.length <= 1) return
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length)
    }, adRotationMs)
    return () => clearInterval(timer)
  }, [adRotationMs, heroSlides.length])

  useEffect(() => {
    setHeroIndex(0)
  }, [selectedGameId, heroSlides.length])

  useEffect(() => {
    if (!selectedGameId) return

    if (!previousSelectedGameIdRef.current) {
      previousSelectedGameIdRef.current = selectedGameId
      return
    }

    if (previousSelectedGameIdRef.current === selectedGameId) return

    previousSelectedGameIdRef.current = selectedGameId
    setIsSwitchingGame(true)

    const timer = setTimeout(() => {
      setIsSwitchingGame(false)
    }, GAME_SWITCH_LOADING_MS)

    return () => clearTimeout(timer)
  }, [selectedGameId])

  useEffect(() => {
    if (!FORCE_WINNER_MODAL_FOR_EDIT || winnerVideoPlayback) return

    const firstVideoSrc = resolveFirstWinnerVideoSource(winnerVideos)
    if (!firstVideoSrc) return

    setWinnerVideoPlayback({
      ...buildWinnerMediaSource(firstVideoSrc),
      key: 'forced-preview-winner-video',
      playCount: 1,
      status: 'open',
    })
  }, [winnerVideoPlayback, winnerVideos])

  useEffect(() => {
    if (FORCE_WINNER_MODAL_FOR_EDIT) return
    if (!winnerEvent || winnerEvent.type !== 'winner') return
    if (winnerEvent.gameId !== selectedGame?.id) return
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
    if (!winnerVideoPlayback || winnerVideoPlayback.status !== 'exit') return

    const timer = setTimeout(() => {
      setWinnerVideoPlayback((current) => (current?.status === 'exit' ? null : current))
    }, WINNER_MODAL_ANIMATION_MS)

    return () => clearTimeout(timer)
  }, [winnerVideoPlayback])

  const handleWinnerVideoError = () => {
    setWinnerVideoPlayback((current) => {
      if (!current) return null
      if (FORCE_WINNER_MODAL_FOR_EDIT && current.key === 'forced-preview-winner-video') {
        return current
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
      if (FORCE_WINNER_MODAL_FOR_EDIT && current.key === 'forced-preview-winner-video') {
        return current
      }
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

  useEffect(() => {
    if (!activeHeroSlide?.image) return

    const preload = new Image()
    preload.src = encodeURI(activeHeroSlide.image)
  }, [activeHeroSlide])

  const paddedCountdown = countdown.split(':')
  const winnerModalClassName = winnerVideoPlayback?.status === 'open'
    ? 'scale-100 opacity-100 rotate-0'
    : winnerVideoPlayback?.status === 'exit'
      ? 'scale-50 opacity-0 rotate-[-4deg]'
      : 'scale-50 opacity-0 rotate-[4deg]'

  return (
    <Panel className="h-[calc(100vh-1.5rem)] w-full overflow-hidden border border-[#2f8f4f] bg-[#f4f5f7]">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f5f7]">
        {isSwitchingGame ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#f4f5f7]/85 backdrop-blur-[2px]">
            <span
              className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: `${heroPalette.primary}66`, borderTopColor: 'transparent' }}
            />
            <p className="font-heading text-xs uppercase tracking-[0.2em] text-[#1f2f42]">Cargando juego...</p>
          </div>
        ) : null}

        <header className="border-b border-[#d4d8df] bg-[#fdfdfd] px-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a022]">
                Loteria registre
              </p>
              <button
                type="button"
                onClick={() => setIsGameMenuOpen((prev) => !prev)}
                className="mt-1 inline-flex w-full items-center gap-3 rounded-xl border px-3 py-2 font-heading text-xl uppercase transition"
                style={{
                  borderColor: heroPalette.primary,
                  background: `linear-gradient(135deg, ${heroPalette.primary}22 0%, ${heroPalette.secondary}18 100%)`,
                  color: '#000000',
                  boxShadow: `0 12px 24px ${heroPalette.primary}1f`,
                }}
              >
                {selectedGame?.logo ? (
                  <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/70 bg-white/85 p-1 shadow-sm">
                    <img
                      src={selectedGame.logo}
                      alt={`Logo ${selectedGame?.name || 'Lotto Activo'}`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-left text-black">
                  {viewMode === VIEW_MODES.API_MONITOR ? 'Monitor API' : selectedGame?.name || 'Lotto Activo'}
                </span>
              </button>

              {isGameMenuOpen ? (
                <div className="absolute z-30 mt-2 min-w-[260px] rounded-md border border-[#c9d2de] bg-white p-1 shadow-[0_12px_28px_rgba(15,28,45,0.16)]">
                  <button
                    type="button"
                    onClick={handleOpenApiMonitor}
                    className={`mb-1 w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold uppercase tracking-[0.12em] transition ${
                      viewMode === VIEW_MODES.API_MONITOR
                        ? 'border-[#1f7b5c] bg-[#e2f3ec] text-[#1f6d52]'
                        : 'border-[#d2d8e1] bg-[#f7f8fb] text-[#334a62] hover:border-[#96b8a8]'
                    }`}
                  >
                    Monitor API
                  </button>

                  {visualGames.map((item) => (
                    <GameSelectorButton
                      key={`selector-${item.id}`}
                      game={item}
                      active={item.id === selectedGame?.id}
                      compact
                      onClick={() => handleSelectGame(item.id)}
                    />
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
                    {index > 0 && (
                      <span className="px-0.5 font-heading text-4xl" style={{ color: countdownNumberColor }}>
                        :
                      </span>
                    )}
                    <span className="font-heading text-4xl leading-none" style={{ color: countdownNumberColor }}>
                      {chunk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {viewMode === VIEW_MODES.API_MONITOR ? (
          <ApiMonitorView />
        ) : (
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[230px_1fr]">
          <aside className="flex min-h-0 flex-col border-r border-[#d8dce3] bg-[#ebeef3]">
            <div className="border-b border-[#d8dce3] px-3 py-3">
              <p className="font-heading text-2xl uppercase tracking-[0.12em] text-[#1f7b5c]">Ganadores</p>
            </div>

            <div className="space-y-3 overflow-auto px-2 py-3">
              {winnerFeed.map((item, index) => {
                const winnerImageSources = resolveWinnerAnimalImageSources(selectedGame, item.number, item.name)
                const winnerImageSource = winnerImageSources[0]
                const winnerNumberLabel = String(item.number).padStart(
                  selectedGame?.assets?.animalitoDigits || 2,
                  '0',
                )

                return (
                <button
                  key={`winner-${item.number}`}
                  type="button"
                  onClick={() => handleSelectGame(currentGame || game?.id)}
                  className={`w-full rounded-md border px-2 py-2 text-left transition ${
                    index === 0
                      ? 'border-[#d7a72c] bg-white shadow-[0_3px_9px_rgba(21,30,43,0.12)]'
                      : 'border-[#d8dee7] bg-[#f2f4f8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#d0d8e2] bg-white shadow-sm">
                      {winnerImageSource ? (
                        <img
                          src={winnerImageSource}
                          alt={item.name || `Ganador ${winnerNumberLabel}`}
                          className="absolute inset-0 h-full w-full object-cover"
                          data-fallback-index="0"
                          loading="lazy"
                          onError={(event) => {
                            const currentIndex = Number(event.currentTarget.dataset.fallbackIndex || '0')
                            const nextIndex = currentIndex + 1
                            const nextSource = winnerImageSources[nextIndex]

                            if (nextSource) {
                              event.currentTarget.dataset.fallbackIndex = String(nextIndex)
                              event.currentTarget.src = nextSource
                              return
                            }

                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <span className="relative text-xs font-semibold uppercase text-[#283444]">
                        {item.icon || '🐾'}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <div className="flex min-w-0 items-center gap-1">
                          <p
                            className="max-w-[10.5rem] truncate font-heading text-xl uppercase leading-none text-[#2d3d52] sm:max-w-[12rem] sm:text-2xl"
                            title={isTrioActivo ? winnerNumberLabel : item.name}
                          >
                            {isTrioActivo ? winnerNumberLabel : item.name}
                          </p>
                          {!isTrioActivo ? (
                            <span
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-heading text-base leading-none text-white sm:h-9 sm:w-9 sm:text-lg"
                              style={{ backgroundColor: heroPalette.primary }}
                            >
                              {winnerNumberLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1 font-heading text-base text-[#7d8798]">{item.time}</p>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>

            <div className="mt-auto border-t border-[#d8dce3] px-3 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7f65]">
                Servidor activo
              </p>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col">
            <section
              className={`relative min-h-[300px] flex-1 overflow-hidden bg-[#edf1f6] ${
                isTrioActivo ? '' : 'max-h-[60vh] border-b border-[#d7dce4]'
              }`}
            >
              {activeHeroSlide ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(81,147,141,0.38),transparent_25%),radial-gradient(circle_at_85%_65%,rgba(246,243,233,0.88),transparent_24%),linear-gradient(180deg,#335969_0%,#9eb4c1_100%)]">
                  {activeHeroSlide.type === 'ad' ? (
                    <img
                      src={activeHeroSlide.image}
                      alt={activeHeroSlide.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : activeHeroSlide.type === 'ruleta' ? (
                    <div className="relative h-[92%] w-[96%] overflow-hidden rounded-[28px] border border-[#d7dce4] bg-white shadow-[0_20px_60px_rgba(3,8,20,0.24)]">
                      <div
                        className="absolute inset-0 bg-white"
                        style={{ backgroundImage: 'none' }}
                      />
                      <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
                        <img
                          src={activeHeroSlide.image}
                          alt={activeHeroSlide.title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative h-[92%] w-[96%] overflow-hidden rounded-[28px] border border-white/20 bg-black shadow-[0_28px_80px_rgba(3,8,20,0.62)]"
                      style={{
                        boxShadow: `0 28px 80px ${heroPalette.primary}33`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${heroPalette.primary}22 0%, ${heroPalette.secondary}12 100%), url("${activeHeroSlide.image}")`,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover, contain',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
                      <div className="relative z-10 flex h-full flex-col">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/90">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                              {activeHeroSlide.title}
                            </p>
                            <p className="font-heading text-lg uppercase text-white">{selectedGame?.name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: heroPalette.primary }} />
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: heroPalette.secondary }} />
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: heroPalette.accent }} />
                          </div>
                        </div>

                        <div className="flex flex-1 items-center justify-center px-4 pb-4">
                          <img
                            src={activeHeroSlide.image}
                            alt={activeHeroSlide.title}
                            className="max-h-full max-w-full rounded-2xl border border-white/10 bg-black/10 object-contain shadow-2xl h-[88%]"
                            loading="lazy"
                          />
                        </div>

                        {activeHeroSlide.type === 'tabloide' ? (
                          <div className="border-t border-white/10 bg-black/35 px-4 py-3 text-white/90 backdrop-blur-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                              Tabloide activo
                            </p>
                            <p className="mt-1 text-sm text-white/85">
                              Se muestra dentro de la sección de publicidad intercalada.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(81,147,141,0.38),transparent_25%),radial-gradient(circle_at_85%_65%,rgba(246,243,233,0.88),transparent_24%),linear-gradient(180deg,#335969_0%,#9eb4c1_100%)]" />
              )}

              {winnerVideoPlayback ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1220]/45 backdrop-blur-[2px]">
                  <div
                    className={`relative h-[94%] w-[30%] overflow-hidden rounded-[28px] border border-white/20 bg-black shadow-[0_28px_80px_rgba(3,8,20,0.62)] transition-all duration-300 ease-out ${winnerModalClassName}`}
                  >
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
                  </div>
                </div>
              ) : null}
            </section>

            {!isTrioActivo ? (
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
                    src={gamePanoImage}
                    alt="Pano de jugadas Lotto Activo"
                    className="block h-full w-full rounded-sm object-center"
                    loading="lazy"
                  />
                </div>
              </section>
            ) : null}
          </main>
        </div>
        )}
      </div>
    </Panel>
  )
}