export const GameSelectorButton = ({ game, active = false, onClick, compact = false, className = '' }) => {
  const palette = game?.palette || {
    primary: '#1c7d50',
    secondary: '#d7a72c',
    accent: '#0f6f42',
    surface: '#f8fbff',
    text: '#081016',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:-translate-y-[1px] ${className}`}
      style={{
        borderColor: active ? palette.primary : '#d2d8e1',
        background: active
          ? `linear-gradient(135deg, ${palette.primary}22 0%, ${palette.secondary}18 100%)`
          : palette.surface,
        boxShadow: active ? `0 12px 24px ${palette.primary}1f` : '0 4px 10px rgba(16, 24, 40, 0.06)',
        color: '#000000',
      }}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/70 bg-white/85 p-1 shadow-sm">
        {game?.logo ? (
          <img
            src={game.logo}
            alt={`Logo ${game?.name || 'Juego'}`}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block truncate font-heading uppercase text-black ${compact ? 'text-sm' : 'text-base'}`}>
          {game?.name || 'Juego'}
        </span>
        {!compact && game?.streamLabel ? (
          <span className="block text-[11px] uppercase tracking-[0.18em] text-black/80">
            {game.streamLabel}
          </span>
        ) : null}
      </span>
    </button>
  )
}