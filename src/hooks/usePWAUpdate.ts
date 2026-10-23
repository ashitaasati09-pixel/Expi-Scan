import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function usePWAUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
      },
      onRegisterError(error) {
        console.error('SW registration error:', error)
      },
    })

    ;(window as any).__updateSW = updateSW
  }, [])

  const update = () => {
    ;(window as any).__updateSW?.(true)
    setNeedsRefresh(false)
  }

  const dismissOfflineReady = () => setOfflineReady(false)

  return { needsRefresh, offlineReady, update, dismissOfflineReady }
}