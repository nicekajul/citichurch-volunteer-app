"use client"

import React, { useState, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { useData } from "@/lib/data-context"
import { BookOpen, Tv, Crown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Certificate } from "@/lib/data"

const TIER_ICONS: Record<number, LucideIcon> = {
  1: BookOpen,
  2: Tv,
  3: Crown,
}

// ── Portal tooltip ────────────────────────────────────────────────────────────
// Rendered into document.body with position:fixed so it escapes every
// overflow/stacking-context boundary (sidebar, table cells, dropdowns, etc.)
interface TooltipContentProps {
  cert: Certificate
  completed: number
  total: number
  earned: boolean
  locked: boolean
  anchorX: number  // center-x of badge (viewport coords)
  anchorY: number  // top-y of badge (viewport coords)
}

const TOOLTIP_WIDTH = 208 // w-52

function TooltipContent({ cert, completed, total, earned, locked, anchorX, anchorY }: TooltipContentProps) {
  const tierIndex = cert.orderIndex ?? 1
  const Icon = TIER_ICONS[tierIndex] ?? BookOpen
  const inProgress = !earned && !locked && completed > 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Keep tooltip within viewport horizontally
  const clampedX = Math.min(
    Math.max(anchorX, TOOLTIP_WIDTH / 2 + 8),
    window.innerWidth - TOOLTIP_WIDTH / 2 - 8,
  )

  return (
    <div
      style={{
        position: "fixed",
        left: clampedX,
        top: anchorY - 10,
        transform: "translate(-50%, -100%)",
        width: TOOLTIP_WIDTH,
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <div className="bg-popover border border-border rounded-xl p-3 shadow-2xl text-left">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cert.color}22` }}
          >
            <Icon className="w-3 h-3" style={{ color: cert.color }} />
          </div>
          <p className="text-xs font-semibold text-foreground leading-tight">{cert.name}</p>
        </div>

        {total > 0 ? (
          <>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: cert.color }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {completed} of {total} module{total !== 1 ? "s" : ""} completed
            </p>
          </>
        ) : (
          <p className="text-[11px] text-muted-foreground">No modules assigned yet</p>
        )}

        <p
          className="text-[10px] font-semibold mt-2"
          style={{
            color: earned
              ? "#22c55e"
              : locked
              ? "var(--muted-foreground)"
              : cert.color,
          }}
        >
          {earned
            ? "✓ Earned"
            : locked
            ? "🔒 Complete previous tier first"
            : total === 0
            ? "— No modules yet"
            : inProgress
            ? "In Progress"
            : "Not Started"}
        </p>
      </div>

      {/* Arrow pointing down toward the badge */}
      <div className="flex justify-center -mt-px">
        <div className="w-2.5 h-2.5 bg-popover border-b border-r border-border rotate-45" />
      </div>
    </div>
  )
}

// ── Single badge ──────────────────────────────────────────────────────────────
interface TierBadgeProps {
  cert: Certificate
  completed: number
  total: number
  earned: boolean
  locked: boolean
  size?: "sm" | "md"
  variant?: "badge" | "dots"
  tooltip?: boolean
}

function TierBadge({ cert, completed, total, earned, locked, size = "sm", variant = "badge", tooltip = true }: TierBadgeProps) {
  const tierIndex = cert.orderIndex ?? 1
  const Icon = TIER_ICONS[tierIndex] ?? BookOpen
  const inProgress = !earned && !locked && completed > 0

  const ref = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)

  const onEnter = useCallback(() => {
    if (!tooltip || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setAnchor({ x: r.left + r.width / 2, y: r.top })
  }, [tooltip])

  const onLeave = useCallback(() => setAnchor(null), [])

  const dim  = size === "sm" ? "w-6 h-6" : "w-8 h-8"
  const iDim = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"

  const dotStyle: React.CSSProperties = earned
    ? { backgroundColor: cert.color, boxShadow: `0 0 0 2px ${cert.color}40` }
    : inProgress
    ? { backgroundColor: `${cert.color}50`, border: `1.5px solid ${cert.color}` }
    : { backgroundColor: "var(--muted)", border: "1.5px solid var(--border)" }

  return (
    <>
      <div
        ref={ref}
        className="relative cursor-default"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {variant === "dots" ? (
          <div
            className="w-2.5 h-2.5 rounded-full transition-transform hover:scale-125"
            style={dotStyle}
          />
        ) : (
          <div
            className={`${dim} rounded-md flex items-center justify-center transition-all ${
              locked
                ? "bg-muted border border-border"
                : earned
                ? "shadow-sm"
                : "border"
            }`}
            style={
              earned
                ? { backgroundColor: cert.color, boxShadow: `0 2px 8px ${cert.color}55` }
                : locked
                ? {}
                : { backgroundColor: `${cert.color}18`, borderColor: `${cert.color}50` }
            }
          >
            <Icon
              className={`${iDim} shrink-0`}
              style={
                earned
                  ? { color: "#fff" }
                  : locked
                  ? { color: "var(--muted-foreground)", opacity: 0.3 }
                  : { color: cert.color, opacity: 0.75 }
              }
            />
            {earned && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-background" />
            )}
            {inProgress && total > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 text-white leading-none shadow"
                style={{ backgroundColor: cert.color }}
              >
                {completed}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Portal tooltip — renders at document.body, escapes all overflow/z-index boundaries */}
      {anchor && createPortal(
        <TooltipContent
          cert={cert}
          completed={completed}
          total={total}
          earned={earned}
          locked={locked}
          anchorX={anchor.x}
          anchorY={anchor.y}
        />,
        document.body,
      )}
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
interface VolunteerBadgesProps {
  userId: string
  size?: "sm" | "md"
  variant?: "badge" | "dots"
  tooltip?: boolean
}

export function VolunteerBadges({ userId, size = "sm", variant = "badge", tooltip = true }: VolunteerBadgesProps) {
  const { certificates, trainingProgress, trainingVideos } = useData()

  const tierData = useMemo(() => {
    const tiers = [...certificates].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    if (!tiers.length) return []

    const completedVideoIds = new Set(
      trainingProgress.filter((p) => p.userId === userId && p.completed).map((p) => p.videoId),
    )
    // Mirrors getEarnedCertificates in supabase-data-context, computed inline so this
    // memo keys off the underlying data arrays instead of an unstable function reference.
    const earnedIds = new Set(
      tiers
        .filter((cert) => {
          const certModules = trainingVideos.filter((v) => v.certificateId === cert.id)
          return certModules.length > 0 && certModules.every((v) => completedVideoIds.has(v.id))
        })
        .map((c) => c.id),
    )

    return tiers.map((cert, idx) => {
      const tierModules = trainingVideos.filter((v) => v.certificateId === cert.id)
      const completed   = tierModules.filter((v) => completedVideoIds.has(v.id)).length
      const earned      = earnedIds.has(cert.id)
      const prevEarned  = idx === 0 || earnedIds.has(tiers[idx - 1].id)
      const locked      = !prevEarned && !earned
      return { cert, completed, total: tierModules.length, earned, locked }
    })
  }, [certificates, trainingProgress, trainingVideos, userId])

  if (!tierData.length) return null

  return (
    <div className="flex items-center gap-1">
      {tierData.map(({ cert, completed, total, earned, locked }) => (
        <TierBadge
          key={cert.id}
          cert={cert}
          completed={completed}
          total={total}
          earned={earned}
          locked={locked}
          size={size}
          variant={variant}
          tooltip={tooltip}
        />
      ))}
    </div>
  )
}

// ── Full-width panel for volunteer's own dashboard ────────────────────────────
export function VolunteerBadgesPanel({ userId }: { userId: string }) {
  const { certificates, trainingProgress, trainingVideos, getEarnedCertificates } = useData()

  const tiers = [...certificates].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  if (!tiers.length) return null

  const earnedIds = new Set(getEarnedCertificates(userId).map((c) => c.id))
  const completedVideoIds = new Set(
    trainingProgress.filter((p) => p.userId === userId && p.completed).map((p) => p.videoId),
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tiers.map((cert, idx) => {
        const Icon        = TIER_ICONS[cert.orderIndex ?? 1] ?? BookOpen
        const tierModules = trainingVideos.filter((v) => v.certificateId === cert.id)
        const completed   = tierModules.filter((v) => completedVideoIds.has(v.id)).length
        const total       = tierModules.length
        const earned      = earnedIds.has(cert.id)
        const prevEarned  = idx === 0 || earnedIds.has(tiers[idx - 1].id)
        const locked      = !prevEarned && !earned
        const pct         = total > 0 ? Math.round((completed / total) * 100) : 0

        return (
          <div
            key={cert.id}
            className={`relative rounded-xl border p-4 transition-all ${
              earned
                ? "border-transparent"
                : locked
                ? "border-border bg-muted/30 opacity-60"
                : "border-border bg-card"
            }`}
            style={earned ? { background: `linear-gradient(135deg, ${cert.color}18, ${cert.color}08)`, borderColor: `${cert.color}40` } : {}}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold"
                style={{ backgroundColor: `${cert.color}18`, color: cert.color }}
              >
                <Icon className="w-3.5 h-3.5" />
                Tier {idx + 1}
              </div>
              {earned && (
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  ✓ Earned
                </span>
              )}
              {locked && (
                <span className="text-[10px] font-semibold text-muted-foreground">🔒 Locked</span>
              )}
            </div>

            <p className="font-semibold text-sm mb-0.5">{cert.name}</p>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cert.description}</p>

            {total > 0 ? (
              <>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: cert.color }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {completed} of {total} modules · {pct}%
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">Modules coming soon</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
