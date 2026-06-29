import { useEffect, useRef } from 'react'
import { authStore } from '../stores/authStore'

export function useWebSocket(onNotificationReceived) {
  const ws = useRef(null)
  const isAuthenticated = authStore(state => state.isAuthenticated)
  const accessToken = authStore(state => state.accessToken)
  
  // Keep callback reference updated without triggering dependency updates
  const callbackRef = useRef(onNotificationReceived)
  useEffect(() => {
    callbackRef.current = onNotificationReceived
  }, [onNotificationReceived])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (ws.current) {
        ws.current.close()
      }
      return
    }

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = '9090'
      const wsUrl = `${protocol}//${host}:${port}/ws?token=${accessToken}`

      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket Connection Established.')
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (callbackRef.current) {
            callbackRef.current(data)
          }
        } catch (e) {
          console.error('Failed to parse WebSocket incoming frame:', e)
        }
      }

      ws.current.onclose = () => {
        console.log('WebSocket Connection Closed. Attempting reconnect in 5s...')
        setTimeout(() => {
          if (authStore.getState().isAuthenticated) {
            connect()
          }
        }, 5000)
      }

      ws.current.onerror = (err) => {
        console.error('WebSocket Error:', err)
        ws.current.close()
      }
    }

    connect()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [isAuthenticated, accessToken])

  return ws.current
}
