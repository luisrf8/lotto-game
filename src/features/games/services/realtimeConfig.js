import { REALTIME_CONFIG_ENDPOINT } from '@/config/apiConfig'

export const DEFAULT_REALTIME_CONFIG = {
  winnerIntervalMs: 90000,
  adThresholdMs: 60000,
  ads: [],
}

export const fetchRealtimeConfig = async () => {
  try {
    const response = await fetch(REALTIME_CONFIG_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      return DEFAULT_REALTIME_CONFIG
    }

    const payload = await response.json()

    return {
      winnerIntervalMs:
        typeof payload.winnerIntervalMs === 'number'
          ? payload.winnerIntervalMs
          : DEFAULT_REALTIME_CONFIG.winnerIntervalMs,
      adThresholdMs:
        typeof payload.adThresholdMs === 'number'
          ? payload.adThresholdMs
          : DEFAULT_REALTIME_CONFIG.adThresholdMs,
      ads: Array.isArray(payload.ads) ? payload.ads : DEFAULT_REALTIME_CONFIG.ads,
    }
  } catch {
    return DEFAULT_REALTIME_CONFIG
  }
}
