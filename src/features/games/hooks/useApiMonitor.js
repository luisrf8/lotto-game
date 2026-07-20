import { useEffect, useState } from 'react'
import {
  getApiMonitorSnapshot,
  OFFICIAL_API_MONITOR_DEFINITIONS,
  subscribeApiMonitor,
} from '@/features/games/services/gameCatalog'

export const useApiMonitor = () => {
  const [snapshot, setSnapshot] = useState(() => getApiMonitorSnapshot())

  useEffect(() => {
    const unsubscribe = subscribeApiMonitor((nextState) => {
      setSnapshot(nextState)
    })

    return unsubscribe
  }, [])

  return {
    definitions: OFFICIAL_API_MONITOR_DEFINITIONS,
    snapshot,
  }
}
