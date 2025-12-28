"use client"

import type React from "react"

import { useData } from "@/lib/data-context"
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
  Radio,
  Lightbulb,
  Monitor,
  Volume2,
  Palette,
  Camera,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

const teamIcons: Record<string, React.ElementType> = {
  Radio: Radio,
  Lightbulb: Lightbulb,
  Monitor: Monitor,
  Volume2: Volume2,
  Palette: Palette,
  Camera: Camera,
}

export default function AdminDashboard() {
  const { users, teams, trainingVideos, trainingProgress, announcements } = useData()

  const volunteers = users.filter((u) => u.role === "volunteer")
  const activeVolunteers = volunteers.filter((u) => u.status === "active")
  const pendingVolunteers = volunteers.filter((u) => u.status === "pending")

  const completedTrainings = trainingProgress.filter((p) => p.completed).length
  const totalAssignedTrainings = trainingProgress.length
  const overallProgress =
    totalAssignedTrainings > 0 ? Math.round((completedTrainings / totalAssignedTrainings) * 100) : 0

  const getTeamProgress = (teamId: string) => {
    const teamMembers = users.filter((u) => u.teamId === teamId)
    const memberIds = teamMembers.map((m) => m.id)
    const teamProgress = trainingProgress.filter((p) => memberIds.includes(p.oderId))
    const completed = teamProgress.filter((p) => p.completed).length
    return teamProgress.length > 0 ? Math.round((completed / teamProgress.length) * 100) : 0
  }

  const recentActivity = [
    { user: users[2], action: "completed", item: "Safety & Equipment Basics", time: "2 hours ago", status: "success" },
    { user: users[3], action: "started", item: "Lighting Console Operation", time: "5 hours ago", status: "info" },
    { user: users[5], action: "joined", item: "Broadcast Team", time: "1 day ago", status: "warning" },
    {
      user: users[6],
      action: "passed quiz",
      item: "Welcome to Production Ministry",
      time: "2 days ago",
      status: "success",
    },
  ]

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="Overview of Production Ministry" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Volunteers"
            value={volunteers.length}
            change={`${activeVolunteers.length} active`}
            changeType="positive"
            icon={Users}
          />
          <StatsCard
            title="Training Videos"
            value={trainingVideos.length}
            change={`${trainingVideos.filter((v) => v.quizEnabled).length} with quizzes`}
            changeType="neutral"
            icon={Video}
          />
          <StatsCard
            title="Overall Progress"
            value={`${overallProgress}%`}
            change={`${completedTrainings} trainings completed`}
            changeType="positive"
            icon={TrendingUp}
          />
          <StatsCard
            title="Pending Approvals"
            value={pendingVolunteers.length}
            change="Awaiting review"
            changeType={pendingVolunteers.length > 0 ? "negative" : "neutral"}
            icon={Award}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Overview */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>Training progress by team</CardDescription>
              </div>
              <Link href="/dashboard/teams">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.map((team) => {
                  const IconComponent = teamIcons[team.icon] || Users
                  const memberCount = users.filter((u) => u.teamId === team.id).length
                  const progress = getTeamProgress(team.id)

                  return (
                    <div
                      key={team.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${team.color}20` }}>
                        <IconComponent className="w-5 h-5" style={{ color: team.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{team.name}</p>
                          <span className="text-xs text-muted-foreground">{memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-xs font-medium text-muted-foreground w-10">{progress}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest volunteer updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={activity.user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {activity.user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.name}</span>
                        <span className="text-muted-foreground"> {activity.action} </span>
                        <span className="font-medium">{activity.item}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    {activity.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />}
                    {activity.status === "info" && <Clock className="w-4 h-4 text-blue-500 mt-1" />}
                    {activity.status === "warning" && <AlertCircle className="w-4 h-4 text-amber-500 mt-1" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Volunteers */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Volunteers</CardTitle>
                <CardDescription>Awaiting training approval</CardDescription>
              </div>
              <Link href="/dashboard/volunteers">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingVolunteers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingVolunteers.map((volunteer) => {
                    const team = teams.find((t) => t.id === volunteer.teamId)
                    return (
                      <div key={volunteer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={volunteer.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {volunteer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{volunteer.name}</p>
                            <p className="text-xs text-muted-foreground">{team?.name || "Unassigned"}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          Pending
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Announcements */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Latest ministry updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => (
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
                      <span className="text-xs text-muted-foreground">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
