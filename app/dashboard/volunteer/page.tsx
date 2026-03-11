"use client"

import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Video,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  Play,
  Lock,
  FileQuestion,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function VolunteerDashboard() {
  const { user } = useAuth()
  const { teams, trainingVideos, trainingProgress, announcements, serviceSchedules, ministryApplications } = useData()
  const router = useRouter()

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  const myTeam = teams.find((t) => t.id === user.teamId)

  // Get relevant training videos (general + team-specific)
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.teamId)

  // Get user's progress
  const myProgress = trainingProgress.filter((p) => p.oderId === user.id)
  const completedVideos = myProgress.filter((p) => p.completed)
  const approvedVideos = completedVideos.filter((p) => p.approvedBy)

  const overallProgress =
    relevantVideos.length > 0 ? Math.round((completedVideos.length / relevantVideos.length) * 100) : 0

  // Get next video to complete
  const getNextVideo = () => {
    for (const video of relevantVideos) {
      const progress = myProgress.find((p) => p.videoId === video.id)
      if (!progress || !progress.completed) {
        return video
      }
    }
    return null
  }

  const nextVideo = getNextVideo()

  // Get upcoming schedules
  const mySchedules = serviceSchedules.filter((s) => s.assignments.some((a) => a.oderId === user.id)).slice(0, 3)

  // Get relevant announcements
  const myAnnouncements = announcements.filter((a) => !a.teamId || a.teamId === user.teamId).slice(0, 3)

  // Calculate certificates earned (completed all required + approved)
  const requiredVideos = relevantVideos.filter((v) => v.order <= 2)
  const completedRequired = requiredVideos.filter((v) =>
    completedVideos.some((p) => p.videoId === v.id && p.approvedBy),
  )
  const certificatesEarned = completedRequired.length === requiredVideos.length ? 1 : 0

  // Determine next steps
  const getNextSteps = () => {
    const steps = []

    if (overallProgress < 100) {
      steps.push({
        title: "Complete Training",
        description: `${completedVideos.length}/${relevantVideos.length} modules completed`,
        icon: Video,
        status: "in-progress",
      })
    }

    const unapprovedCount = completedVideos.length - approvedVideos.length
    if (unapprovedCount > 0) {
      steps.push({
        title: "Await Approval",
        description: `${unapprovedCount} module(s) pending approval`,
        icon: Clock,
        status: "pending",
      })
    }

    if (overallProgress === 100 && approvedVideos.length === completedVideos.length) {
      steps.push({
        title: "Ready to Serve",
        description: "You can now be scheduled for services!",
        icon: Sparkles,
        status: "complete",
      })
    }

    return steps
  }

  const nextSteps = getNextSteps()

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome, ${user.name.split(" ")[0]}!`}
        subtitle={myTeam ? `${myTeam.name} Team Member` : "Production Ministry Volunteer"}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Training Progress"
            value={`${overallProgress}%`}
            change={`${completedVideos.length}/${relevantVideos.length} completed`}
            changeType={overallProgress === 100 ? "positive" : "neutral"}
            icon={TrendingUp}
          />
          <StatsCard
            title="Videos Completed"
            value={completedVideos.length}
            change={`${approvedVideos.length} approved`}
            changeType="positive"
            icon={Video}
          />
          <StatsCard
            title="Certificates"
            value={certificatesEarned}
            change={certificatesEarned > 0 ? "Certified!" : "Complete training to earn"}
            changeType={certificatesEarned > 0 ? "positive" : "neutral"}
            icon={Award}
          />
          <StatsCard
            title="Upcoming Services"
            value={mySchedules.length}
            change="Scheduled"
            changeType="neutral"
            icon={Calendar}
          />
        </div>

        {/* Ministry Application Status */}
        {(() => {
          const myApp = ministryApplications.find((a) => a.applicantId === user.id)
          if (!myApp && !user.teamId) {
            return (
              <Card className="border-dashed border-primary/40 bg-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">Not yet part of a ministry team?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Apply to join a production ministry and serve your community.</p>
                    </div>
                    <Link href="/apply">
                      <Button size="sm" className="gap-2 shrink-0">
                        Apply for Ministry <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          }
          if (myApp) {
            const appTeam = teams.find((t) => t.id === myApp.teamId)
            const statusMap = {
              pending: { label: "Under Review", color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50" },
              approved: { label: "Approved", color: "text-green-600", bg: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/50" },
              rejected: { label: "Not Approved", color: "text-red-600", bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/50" },
            }
            const s = statusMap[myApp.status]
            return (
              <Card className={`border ${s.bg}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">
                        Ministry Application — <span className={s.color}>{s.label}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {appTeam?.name} · Submitted {new Date(myApp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Link href="/apply">
                      <Button variant="outline" size="sm">View Status</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          }
          return null
        })()}

        {/* Progress Banner */}
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Your Training Journey</h3>
                <div className="flex items-center gap-4 mb-3">
                  <Progress value={overallProgress} className="flex-1 h-3" />
                  <span className="text-lg font-bold text-primary">{overallProgress}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {overallProgress === 100
                    ? "Congratulations! You've completed all training modules."
                    : `Keep going! ${relevantVideos.length - completedVideos.length} more video(s) to complete.`}
                </p>
              </div>
              {nextVideo && (
                <Link href={`/dashboard/my-training/${nextVideo.id}`}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Play className="w-4 h-4 mr-2" />
                    Continue Training
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Videos */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Training</CardTitle>
                <CardDescription>Your assigned training modules</CardDescription>
              </div>
              <Link href="/dashboard/my-training">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relevantVideos.slice(0, 4).map((video, index) => {
                  const videoProgress = myProgress.find((p) => p.videoId === video.id)
                  const isCompleted = videoProgress?.completed
                  const isApproved = videoProgress?.approvedBy
                  const watchedPercentage = videoProgress
                    ? Math.round((videoProgress.watchedSeconds / video.duration) * 100)
                    : 0

                  // Check if previous video is completed (for sequential unlock)
                  const prevVideo = relevantVideos[index - 1]
                  const prevCompleted = !prevVideo || myProgress.some((p) => p.videoId === prevVideo.id && p.completed)
                  const isLocked = !prevCompleted && index > 0

                  return (
                    <Link
                      key={video.id}
                      href={isLocked ? "#" : `/dashboard/my-training/${video.id}`}
                      className={isLocked ? "cursor-not-allowed" : ""}
                    >
                      <div
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                          isLocked ? "bg-muted/30 opacity-60" : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`relative p-2.5 rounded-xl ${isCompleted ? "bg-green-500/10" : "bg-primary/10"}`}
                        >
                          {isLocked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Video className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{video.title}</p>
                            {video.order <= 2 && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <span className="text-xs text-green-600">Completed {isApproved && "• Approved"}</span>
                            ) : videoProgress ? (
                              <>
                                <Progress value={watchedPercentage} className="flex-1 h-1.5 max-w-24" />
                                <span className="text-xs text-muted-foreground">{watchedPercentage}%</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not started</span>
                            )}
                            {video.quizEnabled && (
                              <Badge variant="outline" className="text-xs ml-2">
                                <FileQuestion className="w-3 h-3 mr-1" />
                                Quiz
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!isLocked && !isCompleted && (
                          <Button size="sm" variant="ghost" className="text-primary">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Next Steps</CardTitle>
                <CardDescription>Your path to becoming a full volunteer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div
                        className={`p-2 rounded-lg ${
                          step.status === "complete"
                            ? "bg-green-500/10"
                            : step.status === "pending"
                              ? "bg-amber-500/10"
                              : "bg-primary/10"
                        }`}
                      >
                        <step.icon
                          className={`w-4 h-4 ${
                            step.status === "complete"
                              ? "text-green-500"
                              : step.status === "pending"
                                ? "text-amber-500"
                                : "text-primary"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upcoming Services</CardTitle>
              </CardHeader>
              <CardContent>
                {mySchedules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming services</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mySchedules.map((schedule) => {
                      const myAssignment = schedule.assignments.find((a) => a.oderId === user.id)
                      return (
                        <div key={schedule.id} className="p-3 rounded-lg bg-muted/50">
                          <p className="font-medium text-sm">{schedule.service}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(schedule.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {myAssignment?.role}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Announcements */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Latest updates from the ministry</CardDescription>
            </div>
            <Link href="/dashboard/announcements">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className={
                        announcement.priority === "high"
                          ? "bg-red-500/10 text-red-600"
                          : announcement.priority === "medium"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-600"
                      }
                    >
                      {announcement.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{announcement.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
