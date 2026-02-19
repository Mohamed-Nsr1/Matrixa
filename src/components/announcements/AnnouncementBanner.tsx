'use client'

import { useState, useEffect } from 'react'
import { X, Info, AlertTriangle, CheckCircle, Wrench, Sparkles } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  titleEn: string | null
  content: string
  contentEn: string | null
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'MAINTENANCE' | 'FEATURE'
  isDismissible: boolean
}

const typeConfig = {
  INFO: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-400'
  },
  WARNING: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-400'
  },
  SUCCESS: {
    icon: CheckCircle,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    iconColor: 'text-green-400'
  },
  MAINTENANCE: {
    icon: Wrench,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconColor: 'text-red-400'
  },
  FEATURE: {
    icon: Sparkles,
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    iconColor: 'text-violet-400'
  }
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const stored = localStorage.getItem('dismissedAnnouncements')
    if (stored) {
      try {
        setDismissed(JSON.parse(stored))
      } catch {
        // Ignore parse errors
      }
    }

    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      if (data.success) {
        setAnnouncements(data.announcements)
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }

  const dismissAnnouncement = (id: string) => {
    const newDismissed = [...dismissed, id]
    setDismissed(newDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id))

  if (loading || visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {visibleAnnouncements.map((announcement) => {
        const config = typeConfig[announcement.type]
        const Icon = config.icon

        return (
          <div
            key={announcement.id}
            className={`${config.bgColor} ${config.borderColor} border-b px-4 py-3`}
          >
            <div className="container mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${config.textColor} truncate`}>
                    {announcement.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {announcement.content}
                  </p>
                </div>
              </div>
              {announcement.isDismissible && (
                <button
                  onClick={() => dismissAnnouncement(announcement.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
