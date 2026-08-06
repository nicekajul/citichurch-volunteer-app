"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, CalendarDays, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
type Status = "available" | "unavailable" | undefined

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Cycle order for tapping a day: unset -> available -> unavailable -> unset
function nextStatus(current: Status): Status {
  if (current === undefined) return "available"
  if (current === "available") return "unavailable"
  return undefined
}

export default function AvailabilityPage() {
  const { user } = useAuth()
  const { getAvailabilityForUser, setMyAvailability, clearMyAvailability } = useData()

  const currentMonthStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(1)
    return d
  }, [])

  const [viewDate, setViewDate] = useState(currentMonthStart)

  const goToPrevMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goToNextMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const isAtEarliestMonth =
    viewDate.getFullYear() === currentMonthStart.getFullYear() &&
    viewDate.getMonth() === currentMonthStart.getMonth()

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  // Build all days in the viewed month
  const days = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  }, [viewDate])

  const savedAvailability = user ? getAvailabilityForUser(user.id) : []
  const savedMap = useMemo(() => {
    const map = new Map<string, Status>()
    savedAvailability.forEach((a) => map.set(a.date, a.status))
    return map
  }, [savedAvailability])

  // Local editable selections, seeded from what's saved. Only tracks dates the
  // user has touched this session — everything else falls back to savedMap.
  const [pending, setPending] = useState<Map<string, Status>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const getStatus = (date: string): Status => (pending.has(date) ? pending.get(date) : savedMap.get(date))

  const toggleDay = (date: string) => {
    setSaved(false)
    setPending((prev) => {
      const next = new Map(prev)
      next.set(date, nextStatus(getStatus(date)))
      return next
    })
  }

  const isDirty = pending.size > 0

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const toSet: { date: string; status: "available" | "unavailable" }[] = []
      const toClear: string[] = []

      pending.forEach((status, date) => {
        if (status === undefined) {
          if (savedMap.has(date)) toClear.push(date)
        } else {
          toSet.push({ date, status })
        }
      })

      await Promise.all([
        setMyAvailability(toSet),
        ...toClear.map((date) => clearMyAvailability(date)),
      ])

      setPending(new Map())
      setSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  const availableCount = days.filter((d) => getStatus(toDateStr(d)) === "available").length
  const unavailableCount = days.filter((d) => getStatus(toDateStr(d)) === "unavailable").length

  return (
    <div className="min-h-screen">
      <Header
        title="My Availability"
        subtitle="Let your team leader know which days you can serve — browse any month ahead"
      />

      <div className="p-4 lg:p-6 space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Availability Calendar</CardTitle>
                <CardDescription>
                  Tap a day to cycle: not set → available → unavailable. This is a suggestion only —
                  leaders and admins can still assign you even if a day isn&apos;t marked.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPending(new Map())} disabled={!isDirty || isSaving}>
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToPrevMonth}
                disabled={isAtEarliestMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-36 text-center">{monthLabel}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> {availableCount} available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> {unavailableCount} unavailable
              </span>
              {saved && !isDirty && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                    i === 0 ? "text-blue-600" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: days[0]?.getDay() ?? 0 }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((d) => {
                const dateStr = toDateStr(d)
                const status = getStatus(dateStr)
                const isToday = dateStr === toDateStr(new Date())
                const isSunday = d.getDay() === 0
                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleDay(dateStr)}
                    className={`relative rounded-lg border p-2.5 text-left transition-colors ${
                      status === "available"
                        ? "border-green-300 bg-green-500/10 hover:bg-green-500/15"
                        : status === "unavailable"
                        ? "border-red-300 bg-red-500/10 hover:bg-red-500/15"
                        : isSunday
                        ? "border-blue-200 bg-blue-500/5 hover:bg-blue-500/10"
                        : "border-border hover:bg-muted"
                    } ${isToday ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background" : ""}`}
                  >
                    {isToday && (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none text-amber-950 shadow-sm">
                        Today
                      </span>
                    )}
                    <div
                      className={`text-[10px] font-medium uppercase ${
                        isSunday ? "text-blue-600" : "text-muted-foreground"
                      }`}
                    >
                      {WEEKDAY_LABELS[d.getDay()].slice(0, 1)}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        isToday ? "text-amber-700" : isSunday ? "text-blue-700" : ""
                      }`}
                    >
                      {d.getDate()}
                    </div>
                    <div className="mt-1 h-3.5">
                      {status === "available" && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                      {status === "unavailable" && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  </button>
                )
              })}
            </div>
            {days.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No days to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
