"use client"

import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TeamLeaderDashboard() {
  const { user } = useAuth()
  const { users, teams, trainingVideos, trainingProgress, announcements, approveProgress } = useData()
  const router = useRouter()

  if (user?.role !== "team_leader") {
    router.push("/dashboard")
    return null
  }

  const myTeam = teams.find((t) => t.id === user.teamId)
  const teamMembers = users.filter((u) => u.teamId === user.teamId && u.role === "volunteer")
  const activeMembers = teamMembers.filter((m) => m.status === "active")
  const pendingMembers = teamMembers.filter((m) => m.status === "pending")

  // Get team-specific and general training videos
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.teamId)

  // Calculate team progress
  const teamProgressData = teamMembers.map((member) => {
    const memberProgress = trainingProgress.filter((p) => p.oderId === member.id)
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

  const teamAnnouncements = announcements.filter((a) => !a.teamId || a.teamId === user.teamId)

  const handleApprove = (progressId: string) => {
    approveProgress(progressId, user.id)
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
            title="Training Videos"
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
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{member.name}</p>
                          <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                            {member.status}
                          </Badge>
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

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Pending Approvals */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending Approvals</CardTitle>
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
                      .slice(0, 3)
                      .map(({ member, pendingApprovals }) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{pendingApprovals.length} training(s)</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-600 hover:text-amber-700 text-xs"
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

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/training" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Video className="w-4 h-4 mr-2" />
                    Manage Training Videos
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Announcements */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>Team and ministry updates</CardDescription>
              </div>
              <Link href="/dashboard/announcements">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamAnnouncements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
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
                      {announcement.teamId && (
                        <Badge variant="outline" className="text-xs">
                          Team
                        </Badge>
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
            <CardHeader>
              <CardTitle>Training Overview</CardTitle>
              <CardDescription>Available modules for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relevantVideos.slice(0, 4).map((video) => {
                  const teamCompleted = teamMembers.filter((m) =>
                    trainingProgress.some((p) => p.oderId === m.id && p.videoId === video.id && p.completed),
                  ).length

                  return (
                    <div key={video.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{video.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {video.quizEnabled && (
                              <Badge variant="secondary" className="text-xs">
                                <FileQuestion className="w-3 h-3 mr-1" />
                                Quiz
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {teamCompleted}/{teamMembers.length}
                        </p>
                        <p className="text-xs text-muted-foreground">completed</p>
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
