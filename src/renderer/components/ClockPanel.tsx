import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/renderer/lib/utils'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'

// --- World Clock ---

interface TimezoneEntry {
  city: string
  tz: string
}

const TIMEZONES: TimezoneEntry[] = [
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
  { city: 'UTC', tz: 'UTC' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'Chicago', tz: 'America/Chicago' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles' },
  { city: 'India', tz: 'Asia/Kolkata' },
]

function formatTime(date: Date, tz: string) {
  return date.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(date: Date, tz: string) {
  return date.toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTzAbbr(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(date)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz
}

// --- Calendar ---

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function ClockPanel() {
  const [now, setNow] = useState(new Date())
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const today = new Date()
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth()

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfWeek(calYear, calMonth)

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(calYear - 1)
    } else {
      setCalMonth(calMonth - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(calYear + 1)
    } else {
      setCalMonth(calMonth + 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-4 space-y-6"
    >
      {/* World Clock */}
      <div>
        <h3 className="text-[13px] font-medium text-text-muted uppercase tracking-wider mb-3">
          World Clock
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {TIMEZONES.map((entry) => (
            <Card key={entry.tz} className="bg-surface border-divider">
              <CardContent className="p-3 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-medium text-text">{entry.city}</span>
                  <span className="text-xs text-text-muted ml-1.5">{formatTzAbbr(now, entry.tz)}</span>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(now, entry.tz)}</p>
                </div>
                <span className="text-xl font-mono text-text tabular-nums">
                  {formatTime(now, entry.tz)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium text-text-muted uppercase tracking-wider">
            Calendar
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={prevMonth}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-text-muted hover:text-text cursor-pointer text-xs"
            >
              &lt;
            </Button>
            <span className="text-sm font-medium text-text min-w-[140px] text-center">
              {MONTHS[calMonth]} {calYear}
            </span>
            <Button
              onClick={nextMonth}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-text-muted hover:text-text cursor-pointer text-xs"
            >
              &gt;
            </Button>
          </div>
        </div>

        <Card className="bg-surface border-divider">
          <CardContent className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-text-muted py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="py-1.5" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = isCurrentMonth && day === today.getDate()
                return (
                  <div
                    key={day}
                    className={cn(
                      'py-1.5 text-center text-xs transition-colors duration-100 rounded',
                      isToday
                        ? 'bg-gold text-white font-bold'
                        : 'text-text-secondary'
                    )}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
