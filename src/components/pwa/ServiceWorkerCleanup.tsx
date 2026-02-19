'use client'

import { useEffect } from 'react'

/**
 * Service Worker Cleanup Component
 * 
 * This component runs on mount to clear any old service workers and caches
 * that might be causing issues with authentication and redirects.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    const cleanup = async () => {
      if (typeof window === 'undefined') return
      
      // Clear all caches silently (no reload)
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys()
          for (const name of cacheNames) {
            console.log('[SW Cleanup] Deleting cache:', name)
            await caches.delete(name)
          }
        } catch (error) {
          console.error('[SW Cleanup] Error clearing caches:', error)
        }
      }
      
      // Register the passthrough service worker
      if ('serviceWorker' in navigator) {
        try {
          // Get existing registrations
          const registrations = await navigator.serviceWorker.getRegistrations()
          
          // Unregister all old service workers
          for (const registration of registrations) {
            console.log('[SW Cleanup] Unregistering old SW:', registration.scope)
            await registration.unregister()
          }
          
          // Register the new passthrough service worker
          await navigator.serviceWorker.register('/sw.js', { 
            scope: '/',
            updateViaCache: 'none'
          })
          console.log('[SW Cleanup] Service worker registered')
        } catch (error) {
          console.error('[SW Cleanup] Error with service worker:', error)
        }
      }
    }
    
    cleanup()
  }, [])
  
  return null
}
