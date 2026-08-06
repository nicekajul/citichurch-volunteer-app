"use client"

import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen, Tv, Crown, CheckCircle2, Circle, Lock,
  Award, ChevronDown, ChevronUp, ArrowDown, Play, Tag,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import type { Certificate, TrainingVideo } from "@/lib/data"
import type { LucideIcon } from "lucide-react"

const TIER_ICONS: Record<number, LucideIcon> = { 1: BookOpen, 2: Tv, 3: Crown }

const TIER_LABELS: Record<number, string> = {
  1: "Foundation",
  2: "Specialist",
  3: "Leadership",
}

// ── Module checklist row ───────────────────────────────────────────────────
function ModuleRow({
  video,
  completed,
  inProgress,
  locked,
  color,
}: {
  video: TrainingVideo
  completed: boolean
  inProgress: boolean
  locked: boolean
  color: string
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
        locked
          ? "opacity-40"
          : completed
          ? "bg-green-500/5"
          : "hover:bg-muted/60 cursor-pointer"
      }`}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : locked ? (
          <Lock className="w-5 h-5 text-muted-foreground/40" />
        ) : (
          <Circle
            className="w-5 h-5"
            style={{ color: inProgress ? color : "var(--muted-foreground)", opacity: inProgress ? 1 : 0.4 }}
          />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {!locked && !completed ? (
          <Link href={`/dashboard/my-training/${video.id}`} className="block">
            <p className={`text-sm font-medium truncate hover:underline`}>{video.title}</p>
          </Link>
        ) : (
          <p className={`text-sm font-medium truncate ${completed ? "line-through text-muted-foreground" : ""}`}>
            {video.title}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">
            {video.duration > 0 ? `${Math.round(video.duration / 60)} min · ` : ""}
            {video.quizEnabled ? "Quiz included" : "No quiz"}
          </p>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        {completed ? (
          <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
            Done
          </span>
        ) : inProgress ? (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}15` }}
          >
            In Progress
          </span>
        ) : locked ? null : (
          <Link href={`/dashboard/my-training/${video.id}`}>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1">
              <Play className="w-3 h-3" /> Start
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Single tier card with collapsible checklist ───────────────────────────
function TierCard({
  cert,
  tierIndex,
  modules,
  completedIds,
  inProgressIds,
  earned,
  locked,
  isLast,
}: {
  cert: Certificate
  tierIndex: number
  modules: TrainingVideo[]
  completedIds: Set<string>
  inProgressIds: Set<string>
  earned: boolean
  locked: boolean
  isLast: boolean
}) {
  const [open, setOpen] = useState(!locked)
  const Icon = TIER_ICONS[tierIndex] ?? BookOpen
  const label = TIER_LABELS[tierIndex] ?? `Tier ${tierIndex}`
  const completed = modules.filter((v) => completedIds.has(v.id)).length
  const total = modules.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="relative">
      {/* ── Card ── */}
      <Card
        className={`overflow-hidden border transition-all ${
          locked
            ? "border-border/50 opacity-60"
            : earned
            ? "border-green-500/30"
            : "border-border"
        }`}
        style={earned ? { boxShadow: `0 0 0 1px ${cert.color}30` } : {}}
      >
        {/* Colored top stripe */}
        <div
          className="h-1.5 w-full"
          style={{ background: locked ? "var(--muted)" : `linear-gradient(to right, ${cert.color}, ${cert.color}80)` }}
        />

        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-4 cursor-pointer select-none"
          onClick={() => setOpen((v) => !v)}
        >
          {/* Tier icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: locked ? "var(--muted)" : `${cert.color}18`,
              border: `1.5px solid ${locked ? "var(--border)" : `${cert.color}40`}`,
            }}
          >
            {locked ? (
              <Lock className="w-5 h-5 text-muted-foreground/40" />
            ) : (
              <Icon className="w-5 h-5" style={{ color: cert.color }} />
            )}
          </div>

          {/* Name + label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  color: locked ? "var(--muted-foreground)" : cert.color,
                  backgroundColor: locked ? "var(--muted)" : `${cert.color}15`,
                }}
              >
                {label}
              </span>
              {earned && (
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Earned
                </span>
              )}
              {locked && (
                <span className="text-[10px] font-semibold text-muted-foreground">🔒 Locked</span>
              )}
            </div>
            <h3 className={`font-semibold mt-0.5 ${locked ? "text-muted-foreground" : ""}`}>
              {cert.name}
            </h3>
          </div>

          {/* Progress pill */}
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-xl font-bold" style={{ color: locked ? "var(--muted-foreground)" : cert.color }}>
              {total > 0 ? `${pct}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">{completed}/{total} done</p>
          </div>

          {/* Expand toggle */}
          <div className="text-muted-foreground/50 shrink-0">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Progress bar */}
        {!locked && total > 0 && (
          <div className="px-5 pb-3 -mt-1">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: cert.color }}
              />
            </div>
          </div>
        )}

        {/* ── Checklist (collapsible) ── */}
        {open && (
          <CardContent className="px-4 pb-4 pt-0 space-y-0.5 border-t border-border/50 mt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 py-2">
              Modules in this tier
            </p>
            {total > 0 ? (
              (() => {
                // Group Tier 2 modules by "Track X:" prefix in description
                let lastTrack = ""
                return modules.map((video) => {
                  const trackMatch = video.description.match(/^(Track [A-Z][^—:]*)[—:]/)
                  const trackLabel = trackMatch ? trackMatch[1].trim() : ""
                  const showTrackHeader = trackLabel && trackLabel !== lastTrack
                  if (showTrackHeader) lastTrack = trackLabel
                  return (
                    <div key={video.id}>
                      {showTrackHeader && (
                        <div className="flex items-center gap-2 pt-3 pb-1 px-3">
                          <Tag className="w-3 h-3 shrink-0" style={{ color: cert.color, opacity: 0.7 }} />
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: cert.color, opacity: 0.8 }}
                          >
                            {trackLabel}
                          </span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>
                      )}
                      <ModuleRow
                        video={video}
                        completed={completedIds.has(video.id)}
                        inProgress={inProgressIds.has(video.id) && !completedIds.has(video.id)}
                        locked={locked}
                        color={cert.color}
                      />
                    </div>
                  )
                })
              })()
            ) : (
              <div className="flex items-center gap-3 py-4 px-3 text-muted-foreground">
                <Circle className="w-5 h-5 opacity-30" />
                <div>
                  <p className="text-sm font-medium">Modules coming soon</p>
                  <p className="text-xs">New advanced training content is being prepared.</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-muted-foreground px-3 pt-3 border-t border-border/40 mt-2">
              {cert.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* ── Connector to next tier ── */}
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <div
            className="w-px h-6 transition-colors"
            style={{ backgroundColor: earned ? cert.color : "var(--border)" }}
          />
          <ArrowDown
            className="w-4 h-4 transition-colors"
            style={{ color: earned ? cert.color : "var(--muted-foreground)", opacity: earned ? 1 : 0.4 }}
          />
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
  const { user } = useAuth()
  const { certificates, trainingVideos, trainingProgress, getEarnedCertificates, isCertificateLocked } = useData()
  const router = useRouter()

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  const myProgress = trainingProgress.filter((p) => p.userId === user.id)
  const completedIds  = new Set(myProgress.filter((p) => p.completed).map((p) => p.videoId))
  const inProgressIds = new Set(myProgress.filter((p) => !p.completed && p.watchedSeconds > 0).map((p) => p.videoId))

  const earnedCertificates = getEarnedCertificates(user.id)
  const earnedIds = new Set(earnedCertificates.map((c) => c.id))

  const tiers = [...certificates].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  const totalModules    = trainingVideos.filter((v) => !v.teamId || v.teamId === user.team_id).length
  const completedCount  = [...completedIds].filter((id) =>
    trainingVideos.find((v) => v.id === id && (!v.teamId || v.teamId === user.team_id)),
  ).length
  const overallPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  return (
    <div className="min-h-screen">
      <Header title="Training Roadmap" subtitle="Your journey through Production Ministry" />

      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">

        {/* ── Overview banner ── */}
        <Card className="border-border/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-purple-600" />
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold">Overall Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {earnedCertificates.length} of {tiers.length} tiers earned ·{" "}
                      {completedCount} of {totalModules} modules done
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary shrink-0">{overallPct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-purple-600 transition-all"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tier roadmap ── */}
        {tiers.length > 0 ? (
          <div>
            {tiers.map((cert, idx) => {
              const tierModules = trainingVideos
                .filter((v) => v.certificateId === cert.id && (!v.teamId || v.teamId === user.team_id))
                .sort((a, b) => a.order - b.order)
              const earned = earnedIds.has(cert.id)
              const locked = isCertificateLocked(cert.id, user.id)

              return (
                <TierCard
                  key={cert.id}
                  cert={cert}
                  tierIndex={cert.orderIndex ?? idx + 1}
                  modules={tierModules}
                  completedIds={completedIds}
                  inProgressIds={inProgressIds}
                  earned={earned}
                  locked={locked}
                  isLast={idx === tiers.length - 1}
                />
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Roadmap not set up yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your admin hasn't configured the training tiers yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── CTA ── */}
        {totalModules > completedCount && (
          <div className="flex justify-center pt-2">
            <Link href="/dashboard/my-training">
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Continue Training
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
