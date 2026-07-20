import { useEffect, useMemo, useState } from 'react'

export const DEFAULT_GAME_PALETTE = {
  primary: '#1c7d50',
  secondary: '#d7a72c',
  accent: '#0f6f42',
  surface: '#f7faf5',
  text: '#081016',
}

const SAMPLE_SIZE = 72
const SAMPLE_STEP = 4

const clampChannel = (value) => Math.max(0, Math.min(255, value))

const toHex = (value) => clampChannel(value).toString(16).padStart(2, '0')

const rgbToHex = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`

const isNeutralPixel = (r, g, b) => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 18 || (r > 242 && g > 242 && b > 242) || (r < 18 && g < 18 && b < 18)
}

const getReadableTextColor = (hexColor) => {
  const normalized = hexColor.replace('#', '')
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
  return luminance > 0.62 ? '#081016' : '#f8fbff'
}

const scorePixel = (r, g, b) => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max === 0 ? 0 : (max - min) / max
  const brightness = (r + g + b) / (255 * 3)
  return saturation * 0.8 + Math.abs(brightness - 0.5) * 0.2
}

const extractPaletteFromImage = (source) =>
  new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const width = SAMPLE_SIZE
        const height = Math.max(1, Math.round((image.height / image.width) * width) || SAMPLE_SIZE)
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (!context) {
          resolve(DEFAULT_GAME_PALETTE)
          return
        }

        context.drawImage(image, 0, 0, width, height)
        const { data } = context.getImageData(0, 0, width, height)
        const buckets = new Map()

        for (let index = 0; index < data.length; index += SAMPLE_STEP * 4) {
          const alpha = data[index + 3]
          if (alpha < 80) continue

          const red = data[index]
          const green = data[index + 1]
          const blue = data[index + 2]

          if (isNeutralPixel(red, green, blue)) continue

          const quantized = `${Math.round(red / 16) * 16},${Math.round(green / 16) * 16},${Math.round(blue / 16) * 16}`
          const nextScore = (buckets.get(quantized) || 0) + scorePixel(red, green, blue)
          buckets.set(quantized, nextScore)
        }

        const swatches = [...buckets.entries()]
          .sort((left, right) => right[1] - left[1])
          .map(([key]) => {
            const [red, green, blue] = key.split(',').map(Number)
            return rgbToHex(red, green, blue)
          })

        const primary = swatches[0] || DEFAULT_GAME_PALETTE.primary
        const secondary = swatches[1] || primary
        const accent = swatches[2] || secondary

        resolve({
          primary,
          secondary,
          accent,
          surface: '#f8fbff',
          text: getReadableTextColor(primary),
        })
      } catch {
        resolve(DEFAULT_GAME_PALETTE)
      }
    }

    image.onerror = () => resolve(DEFAULT_GAME_PALETTE)
    image.src = source
  })

export const useGameVisuals = (games = []) => {
  const [paletteByGameId, setPaletteByGameId] = useState({})

  useEffect(() => {
    let cancelled = false

    games.forEach((game) => {
      if (!game?.id || !game.logo || paletteByGameId[game.id]) return

      extractPaletteFromImage(game.logo).then((palette) => {
        if (cancelled) return

        setPaletteByGameId((current) => ({
          ...current,
          [game.id]: palette,
        }))
      })
    })

    return () => {
      cancelled = true
    }
  }, [games, paletteByGameId])

  return useMemo(
    () =>
      games.map((game) => ({
        ...game,
        palette: paletteByGameId[game.id] || DEFAULT_GAME_PALETTE,
      })),
    [games, paletteByGameId],
  )
}