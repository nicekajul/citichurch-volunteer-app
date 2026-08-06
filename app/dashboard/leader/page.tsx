"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { VolunteerBadges } from "@/components/volunteer-badges"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Video,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Calendar,
  MessageSquare,
  FileQuestion,
  Clock,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function formatTime(time?: string) {
  if (!time || time === "00:00") return null
  const [h, m] = time.split(":").map(Number)
  return new Date(0, 0, 0, h, m).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}

function parseDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export default function TeamLeaderDashboard() {
  const { user } = useAuth()
  const { users, teams, trainingVideos, trainingProgress, announcements, serviceSchedules, approveProgress, respondToSchedule } = useData()
  const router = useRouter()

  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)

  // Don't redirect if still loading or if user is a leader
  if (!user || user.role !== "leader") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const myTeam = teams.find((t) => t.id === user.team_id)
  const teamMembers = users.filter((u) => u.teamId === user.team_id && u.role === "volunteer")
  const activeMembers = teamMembers.filter((m) => m.status === "active")
  const pendingMembers = teamMembers.filter((m) => m.status === "pending")

  // Get team-specific and general training videos
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.team_id)

  // Calculate team progress
  const teamProgressData = teamMembers.map((member) => {
    const memberProgress = trainingProgress.filter((p) => p.userId === member.id)
    const completed = memberProgress.filter((p) => p.completed).length
    return {
      member,
      completed,
      total: relevantVideos.length,
      percentage: relevantVideos.length > 0 ? Math.round((completed / relevantVideos.length) * 100) : 0,
      pendingApprovals: memberProgress.filter((p) => p.completed && !p.approvedBy),
    }
  })

  const overallTeamProgress =
    teamProgressData.length > 0
      ? Math.round(teamProgressData.reduce((acc, m) => acc + m.percentage, 0) / teamProgressData.length)
      : 0

  const totalPendingApprovals = teamProgressData.reduce((acc, m) => acc + m.pendingApprovals.length, 0)

  const teamAnnouncements = announcements.filter((a) => !a.teamId || a.teamId === user.team_id)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingSchedules = serviceSchedules
    .filter((s) => s.assignments.some((a) => a.teamId === user.team_id) && parseDate(s.date) >= today)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .slice(0, 5)

  const handleApprove = (progressId: string) => {
    approveProgress(progressId, user.id)
  }

  const handleRespond = async (scheduleId: string, response: "confirmed" | "declined", reason?: string) => {
    setIsSubmittingResponse(true)
    try {
      await respondToSchedule(scheduleId, response, reason)
      setExpandedScheduleId(null)
      setDeclineReason("")
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title={`${myTeam?.name || "Team"} Dashboard`} subtitle="Manage your team's training progress" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Team Members"
            value={teamMembers.length}
            change={`${activeMembers.length} active`}
            changeType="positive"
            icon={Users}
          />
          <StatsCard
            title="Team Progress"
            value={`${overallTeamProgress}%`}
            change="Average completion"
            changeType="neutral"
            icon={TrendingUp}
          />
          <StatsCard
            title="Training Modules"
            value={relevantVideos.length}
            change={`${relevantVideos.filter((v) => v.quizEnabled).length} with quizzes`}
            changeType="neutral"
            icon={Video}
          />
          <StatsCard
            title="Pending Approvals"
            value={totalPendingApprovals}
            change="Need your review"
            changeType={totalPendingApprovals > 0 ? "negative" : "neutral"}
            icon={Award}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members Progress */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Training progress and status</CardDescription>
              </div>
              <Link href="/dashboard/my-team">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamProgressData.slice(0, 5).map(({ member, completed, total, percentage, pendingApprovals }) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{member.name.split(" ")[0]}</p>
                          <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                            {member.status}
                          </Badge>
                          <VolunteerBadges userId={member.id} variant="dots" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {completed}/{total} completed
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={percentage} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-10">{percentage}%</span>
                      </div>
                    </div>
                    {pendingApprovals.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        onClick={() => pendingApprovals.forEach((p) => handleApprove(p.id))}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve ({pendingApprovals.length})
                      </Button>
                    )}
                  </div>
                ))}

                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No team members yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right column — Upcoming Services + Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Services */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Upcoming Services</CardTitle>
                <Link href="/dashboard/schedule">
                  <Button variant="ghost" size="sm" className="text-primary h-7 px-2 text-xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming services</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSchedules.map((schedule) => {
                      const myAssignment = schedule.assignments.find((a) => a.userId === user.id)
                      const isConfirmed = myAssignment?.status === "confirmed"
                      const isDeclined = myAssignment?.status === "declined"
                      const isPending = myAssignment?.status === "assigned"
                      const isDecliningThis = expandedScheduleId === schedule.id

                      return (
                        <div
                          key={schedule.id}
                          className={`rounded-lg border p-3 space-y-2 transition-colors ${
                            isConfirmed ? "border-green-200 bg-green-500/5"
                            : isDeclined ? "border-red-200 bg-red-500/5"
                            : isPending ? "border-amber-200 bg-amber-500/5"
                            : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium text-sm">{schedule.service}</p>
                                {isConfirmed && (
                                  <Badge className="text-xs bg-green-500/10 text-green-700 border-green-200 dark:text-green-400">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Confirmed
                                  </Badge>
                                )}
                                {isDeclined && (
                                  <Badge className="text-xs bg-red-500/10 text-red-700 border-red-200 dark:text-red-400">
                                    <XCircle className="h-2.5 w-2.5 mr-0.5" /> Declined
                                  </Badge>
                                )}
                                {isPending && (
                                  <Badge className="text-xs bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(schedule.date)}
                                {formatTime(schedule.time) && ` · ${formatTime(schedule.time)}`}
                              </p>
                            </div>
                          </div>

                          {isDeclined && myAssignment?.rejectionReason && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Reason:</span> {myAssignment.rejectionReason}
                            </p>
                          )}

                          {isPending && !isDecliningThis && (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                disabled={isSubmittingResponse}
                                onClick={() => handleRespond(schedule.id, "confirmed")}
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" /> Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                disabled={isSubmittingResponse}
                                onClick={() => { setExpandedScheduleId(schedule.id); setDeclineReason("") }}
                              >
                                <ThumbsDown className="h-3 w-3 mr-1" /> Decline
                              </Button>
                            </div>
                          )}

                          {isPending && isDecliningThis && (
                            <div className="space-y-1.5">
                              <Textarea
                                placeholder="Reason for declining..."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                rows={2}
                                className="resize-none text-xs"
                              />
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs dark:hover:bg-muted"
                                  onClick={() => { setExpandedScheduleId(null); setDeclineReason("") }}>
                                  Back
                                </Button>
                                <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs"
                                  disabled={!declineReason.trim() || isSubmittingResponse}
                                  onClick={() => handleRespond(schedule.id, "declined", declineReason.trim())}>
                                  Submit
                                </Button>
                              </div>
                            </div>
                          )}

                          {isConfirmed && (
                            <p className="text-xs text-muted-foreground">Contact admin to change.</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/training" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Video className="w-4 h-4 mr-2" />
                    Manage Training Modules
                  </Button>
                </Link>
                <Link href="/dashboard/announcements" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Post Announcement
                  </Button>
                </Link>
                <Link href="/dashboard/schedule" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Schedule
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section — 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Pending Approvals</CardTitle>
                <CardDescription>Training completions to review</CardDescription>
              </div>
              {totalPendingApprovals > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
                  {totalPendingApprovals}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {totalPendingApprovals === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamProgressData
                    .filter((m) => m.pendingApprovals.length > 0)
                    .slice(0, 4)
                    .map(({ member, pendingApprovals }) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name.split(" ")[0]}</p>
                            <p className="text-xs text-muted-foreground">{pendingApprovals.length} training(s)</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-amber-600 hover:text-amber-700 text-xs h-7"
                          onClick={() => pendingApprovals.forEach((p) => handleApprove(p.id))}
                        >
                          Approve
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Announcements</CardTitle>
                <CardDescription>Team and ministry updates</CardDescription>
              </div>
              <Link href="/dashboard/announcements">
                <Button variant="ghost" size="sm" className="text-primary h-7 px-2 text-xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamAnnouncements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No announcements yet</p>
                ) : teamAnnouncements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={
                          announcement.priority === "high"
                            ? "bg-red-500/10 text-red-600"
                            : announcement.priority === "normal"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-blue-500/10 text-blue-600"
                        }
                      >
                        {announcement.priority}
                      </Badge>
                      {announcement.teamId && (
                        <Badge variant="outline" className="text-xs">Team</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Training Overview */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Training Overview</CardTitle>
              <CardDescription>Module completion by your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relevantVideos.slice(0, 4).map((video) => {
                  const teamCompleted = teamMembers.filter((m) =>
                    trainingProgress.some((p) => p.userId === m.id && p.videoId === video.id && p.completed),
                  ).length

                  return (
                    <div key={video.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{video.title}</p>
                          {video.quizEnabled && (
                            <Badge variant="secondary" className="text-xs mt-0.5">
                              <FileQuestion className="w-3 h-3 mr-1" />Quiz
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-medium">{teamCompleted}/{teamMembers.length}</p>
                        <p className="text-xs text-muted-foreground">done</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
