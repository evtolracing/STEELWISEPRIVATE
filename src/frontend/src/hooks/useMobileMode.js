/**
 * useMobileMode.js — Mobile detection + Sales Rep mode helpers.
 *
 * Exposes:
 *   isMobile       — viewport ≤ 768 px (tablet-portrait / phone)
 *   isTablet       — viewport 768–1024 px
 *   isDesktop      — viewport > 1024 px
 *   isOnline       — navigator.onLine reactive boolean
 *   isSalesRepMode — true when on /mobile-rep/* routes
 *   orientation    — "portrait" | "landscape"
 *   touchDevice    — boolean  (pointer: coarse)
 */
import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme, useMediaQuery } from '@mui/material'

export default function useMobileMode() {
  const theme = useTheme()
  const location = useLocation()

  // ── Breakpoints ──────────────────────────────────────────────────────
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'))     // < 600
  const isTablet  = useMediaQuery(theme.breakpoints.between('sm', 'md')) // 600-900
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))       // ≥ 900
  const touchDevice = useMediaQuery('(pointer: coarse)')

  // ── Orientation ──────────────────────────────────────────────────────
  const portrait  = useMediaQuery('(orientation: portrait)')
  const orientation = portrait ? 'portrait' : 'landscape'

  // ── Online / Offline ─────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // ── Sales Rep Mode ───────────────────────────────────────────────────
  const isSalesRepMode = useMemo(
    () => location.pathname.startsWith('/mobile-rep'),
    [location.pathname],
  )

  return {
    isMobile,
    isTablet,
    isDesktop,
    isOnline,
    isSalesRepMode,
    orientation,
    touchDevice,
  }
}
