"use client"

import React from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Play, Lock, FileQuestion, Award, BookOpen, Video, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getVideoThumbnail } from "@/lib/utils"
import { VolunteerBadges } from "@/components/volunteer-badges"

export default function MyTrainingPage() {
  const { user } = useAuth()
  const { teams, trainingVideos, trainingProgress, isLoading, certificates, getEarnedCertificates, isCertificateLocked } = useData()
  const router = useRouter()

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  // user comes from auth context which uses snake_case DB columns
  const myTeam = teams.find((t) => t.id === user.team_id)
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.team_id)
  const myProgress = trainingProgress.filter((p) => p.userId === user.id)
  const completedVideos = myProgress.filter((p) => p.completed)

  const overallProgress =
    relevantVideos.length > 0 ? Math.round((completedVideos.length / relevantVideos.length) * 100) : 0

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isModuleLocked = (module: (typeof relevantVideos)[0]): boolean => {
    if (!module.prerequisites?.length) return false
    return module.prerequisites.some(
      (prereqId) => !myProgress.some((p) => p.videoId === prereqId && p.completed)
    )
  }

  const getBlockingPrereq = (module: (typeof relevantVideos)[0]): string | undefined => {
    if (!module.prerequisites?.length) return undefined
    const blockingId = module.prerequisites.find(
      (prereqId) => !myProgress.some((p) => p.videoId === prereqId && p.completed)
    )
    return blockingId ? relevantVideos.find((v) => v.id === blockingId)?.title : undefined
  }

  const earnedCertificates = getEarnedCertificates(user.id)
  const earnedIds = new Set(earnedCertificates.map((c) => c.id))

  // All certs visible to this volunteer (ministry-wide or their team)
  const relevantCerts = certificates
    .filter((cert) => !cert.teamId || cert.teamId === user.team_id)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  const certGroups = relevantCerts
    .map((cert) => ({
      cert,
      modules: relevantVideos.filter((v) => v.certificateId === cert.id),
    }))
    .filter((g) => g.modules.length > 0)

  const uncategorized = relevantVideos.filter((v) => !v.certificateId)

  const renderVideoCard = (video: (typeof relevantVideos)[0], certLocked?: { reason: string }) => {
    const videoProgress = myProgress.find((p) => p.videoId === video.id)
    const isCompleted = videoProgress?.completed
    const isApproved = videoProgress?.approvedBy
    const watchedPercentage = videoProgress ? Math.round((videoProgress.watchedSeconds / video.duration) * 100) : 0
    const locked = certLocked ? true : isModuleLocked(video)
    const blockingPrereq = certLocked ? certLocked.reason : locked ? getBlockingPrereq(video) : undefined

    return (
      <Card key={video.id} className={`border-border/50 overflow-hidden ${locked ? "opacity-60" : ""}`}>
        <div className="relative aspect-video bg-muted">
          {(() => {
            const thumb = getVideoThumbnail(video.videoUrl)
            if (thumb) return <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
            if (video.videoUrl) return <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"><Video className="w-10 h-10 text-white/30" /></div>
            return null
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {locked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white px-4">
                <Lock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Complete first:</p>
                <p className="text-xs text-white/80 mt-1">{blockingPrereq ?? "a prerequisite"}</p>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            </div>
          ) : (
            <Link href={`/dashboard/my-training/${video.id}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Button size="icon" variant="secondary" className="rounded-full w-14 h-14"><Play className="w-6 h-6" /></Button>
              </div>
            </Link>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(video.duration)}</span>
              {video.quizEnabled && <span className="flex items-center gap-1 bg-white/20 text-xs px-2 py-0.5 rounded-full"><FileQuestion className="w-3 h-3" />Quiz</span>}
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1 mb-1">{video.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
          {!locked && (
            <div className="space-y-2 mb-3">
              {isCompleted ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">Completed</span>
                  {isApproved ? <span className="text-xs text-green-600 flex items-center gap-1"><Award className="w-3 h-3" />Approved</span> : <span className="text-xs text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>}
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-medium">{watchedPercentage}%</span></div>
                  <Progress value={watchedPercentage} className="h-2" />
                </>
              )}
            </div>
          )}
          <div>
            {locked ? (
              <Button variant="outline" className="w-full" disabled><Lock className="w-4 h-4 mr-2" />Locked</Button>
            ) : isCompleted ? (
              <Link href={`/dashboard/my-training/${video.id}`} className="block"><Button variant="outline" className="w-full bg-transparent">Review Again</Button></Link>
            ) : (
              <Link href={`/dashboard/my-training/${video.id}`} className="block"><Button className="w-full bg-primary hover:bg-primary/90"><Play className="w-4 h-4 mr-2" />{videoProgress ? "Continue" : "Start"} Training</Button></Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="My Training" subtitle="Complete your training modules" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Progress Overview */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Overall Progress</h3>
                <p className="text-muted-foreground">
                  {completedVideos.length} of {relevantVideos.length} training modules completed
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48">
                  <Progress value={overallProgress} className="h-3" />
                </div>
                <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tier Roadmap strip ── */}
        {!isLoading && relevantCerts.length > 0 && (
          <Card className="border-border/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-red-500 to-purple-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Training Roadmap</h3>
                </div>
                <Link href="/dashboard/certificates">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-primary">
                    Full Roadmap <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {/* Tier progress pills with inline checklist preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relevantCerts.map((cert, idx) => {
                  const isEarned = earnedIds.has(cert.id)
                  const certLocked = isCertificateLocked(cert.id, user.id)
                  const tierMods = relevantVideos.filter((v) => v.certificateId === cert.id)
                  const done = tierMods.filter((v) => myProgress.some((p) => p.videoId === v.id && p.completed)).length
                  const pct = tierMods.length > 0 ? Math.round((done / tierMods.length) * 100) : 0

                  return (
                    <div
                      key={cert.id}
                      className={`rounded-lg border p-3 ${certLocked ? "opacity-50 bg-muted/20" : isEarned ? "bg-green-500/5 border-green-500/20" : "bg-card border-border"}`}
                    >
                      {/* Tier header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: certLocked ? "var(--muted)" : `${cert.color}20` }}
                        >
                          {certLocked ? (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                          ) : isEarned ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cert.color }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{cert.name}</p>
                          <p className="text-[10px] text-muted-foreground">{done}/{tierMods.length} modules</p>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      {!certLocked && tierMods.length > 0 && (
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cert.color }}
                          />
                        </div>
                      )}

                      {/* Mini checklist — show first 4 modules */}
                      <div className="space-y-1">
                        {tierMods.slice(0, 4).map((v) => {
                          const done = myProgress.some((p) => p.videoId === v.id && p.completed)
                          const trackMatch = v.description.match(/^Track ([A-Z])/)
                          const trackTag = trackMatch ? `T${trackMatch[1]}` : null
                          return (
                            <div key={v.id} className="flex items-center gap-1.5">
                              {done ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                              ) : certLocked ? (
                                <Lock className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                              ) : (
                                <div
                                  className="w-3 h-3 rounded-full border shrink-0"
                                  style={{ borderColor: `${cert.color}60` }}
                                />
                              )}
                              {trackTag && !certLocked && (
                                <span
                                  className="text-[9px] font-bold px-1 rounded shrink-0"
                                  style={{ color: cert.color, backgroundColor: `${cert.color}15` }}
                                >
                                  {trackTag}
                                </span>
                              )}
                              <span className={`text-[11px] truncate ${done ? "line-through text-muted-foreground" : certLocked ? "text-muted-foreground/50" : ""}`}>
                                {v.title}
                              </span>
                            </div>
                          )
                        })}
                        {tierMods.length > 4 && (
                          <p className="text-[10px] text-muted-foreground pl-4">
                            +{tierMods.length - 4} more modules
                          </p>
                        )}
                        {tierMods.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic">Coming soon…</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-9 bg-muted rounded w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Certificate Groups */}
        {!isLoading && certGroups.map(({ cert, modules }) => {
          const certCompleted = modules.filter((v) => myProgress.some((p) => p.videoId === v.id && p.completed)).length
          const certPct = modules.length > 0 ? Math.round((certCompleted / modules.length) * 100) : 0
          const isEarned = earnedIds.has(cert.id)
          const certLocked = isCertificateLocked(cert.id, user.id)
          const prereqCert = cert.prerequisiteCertificateId ? certificates.find((c) => c.id === cert.prerequisiteCertificateId) : undefined
          return (
            <div key={cert.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: certLocked ? "#94a3b8" : cert.color }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-lg font-semibold ${certLocked ? "text-muted-foreground" : ""}`}>{cert.name}</h2>
                    {isEarned && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Earned
                      </span>
                    )}
                    {certLocked && prereqCert && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border/50 rounded-full px-2 py-0.5">
                        <Lock className="w-3 h-3" /> Requires: {prereqCert.name}
                      </span>
                    )}
                    <Badge variant="outline" className="ml-auto">{modules.length} modules</Badge>
                  </div>
                  {!certLocked && (
                    <div className="flex items-center gap-3">
                      <Progress value={certPct} className="flex-1 h-2" style={{ "--progress-color": cert.color } as React.CSSProperties} />
                      <span className="text-sm font-medium text-muted-foreground w-12 text-right">{certCompleted}/{modules.length}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((video) => renderVideoCard(video, certLocked ? { reason: `Complete "${prereqCert?.name ?? "prerequisite"}" certificate first` } : undefined))}
              </div>
            </div>
          )
        })}

        {/* Uncategorized modules */}
        {!isLoading && uncategorized.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">General Training</h2>
              <Badge variant="outline">{uncategorized.length} modules</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uncategorized.map((video) => renderVideoCard(video))}
            </div>
          </div>
        )}

        {/* Empty state — only shown after data has loaded and there's genuinely nothing */}
        {!isLoading && relevantVideos.length === 0 && (
          <Card className="border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No training modules yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your admin hasn&apos;t published any training modules yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
