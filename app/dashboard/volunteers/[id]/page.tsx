"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { User, Phone, Mail, Calendar, BookOpen, Clock, CheckCircle, ArrowLeft } from "lucide-react"

export default function VolunteerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()
  const { users, teams, trainingVideos, trainingProgress } = useData()
  const router = useRouter()

  if (!currentUser) return null

  // Ensure only admins and leaders can view this page
  if (currentUser.role !== "admin" && currentUser.role !== "leader") {
    router.push("/dashboard")
    return null
  }

  const volunteer = users.find((u) => u.id === id)

  if (!volunteer) {
    return (
      <div className="min-h-screen">
        <Header title="Volunteer Profile" subtitle="Not Found" />
        <div className="p-4 lg:p-6 flex flex-col items-center justify-center py-20 text-center">
          <User className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Volunteer Not Found</h2>
          <p className="text-muted-foreground mb-6">The volunteer you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const team = teams.find((t) => t.id === volunteer.teamId)

  // A Leader can only view volunteers in their own team
  if (currentUser.role === "leader" && volunteer.teamId !== currentUser.team_id) {
    return (
      <div className="min-h-screen">
        <Header title="Access Denied" subtitle="Unauthorized" />
        <div className="p-4 lg:p-6 text-center py-20">
          <h2 className="text-xl font-semibold mb-2">Unauthorized Access</h2>
          <p className="text-muted-foreground mb-6">You only have permission to view profiles of volunteers in your team.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const volunteerProgress = trainingProgress.filter((p) => p.userId === volunteer.id)
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === volunteer.teamId)
  const completedVideos = volunteerProgress.filter((p) => p.completed)
  const approvedVideos = completedVideos.filter((p) => p.approvedBy)

  const overallProgress =
    relevantVideos.length > 0 ? Math.round((completedVideos.length / relevantVideos.length) * 100) : 0

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-primary text-primary-foreground"
      case "leader":
        return "bg-blue-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Volunteer Profile" subtitle={`View details for ${volunteer.name}`} />

      <div className="p-4 lg:p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Volunteers
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Details Card */}
          <Card className="lg:col-span-1 border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={volunteer.avatar || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {volunteer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold">{volunteer.name}</h2>
                  <Badge
                    variant={
                      volunteer.status === "active"
                        ? "default"
                        : volunteer.status === "pending"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      volunteer.status === "active"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : volunteer.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : ""
                    }
                  >
                    {volunteer.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{volunteer.email}</p>
                
                <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                  <Badge className={getRoleBadgeColor(volunteer.role)}>
                    {volunteer.role === "leader"
                      ? "Team Leader"
                      : volunteer.role.charAt(0).toUpperCase() + volunteer.role.slice(1)}
                  </Badge>
                  {team ? (
                    <Badge variant="outline">{team.name}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                  )}
                </div>

                <div className="w-full mt-6 pt-6 border-t space-y-4 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{volunteer.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{volunteer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(volunteer.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Progress Tabbed View */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="overview">Training Overview</TabsTrigger>
                <TabsTrigger value="history">Course History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Training Progress</CardTitle>
                    <CardDescription>Overall course completion status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{overallProgress}% Complete</span>
                        <span className="text-sm text-muted-foreground">
                          {completedVideos.length}/{relevantVideos.length} modules
                        </span>
                      </div>
                      <Progress value={overallProgress} className="h-3" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{relevantVideos.length}</p>
                          <p className="text-xs text-muted-foreground">Total Required</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                          <p className="text-2xl font-bold">{approvedVideos.length}</p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                          <p className="text-2xl font-bold">{completedVideos.length - approvedVideos.length}</p>
                          <p className="text-xs text-muted-foreground">Pending Review</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Module Details</CardTitle>
                    <CardDescription>Individual completion status for all assigned videos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {relevantVideos.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No training videos assigned yet.</p>
                      ) : (
                        relevantVideos.map((video) => {
                          const progress = volunteerProgress.find((p) => p.videoId === video.id)
                          const isCompleted = progress?.completed
                          const isApproved = progress?.approvedBy

                          return (
                            <div
                              key={video.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium text-sm">{video.title}</p>
                                  {progress ? (
                                    <p className="text-xs text-muted-foreground">
                                      {isCompleted
                                        ? `Completed${progress.quizScore ? ` • Score: ${progress.quizScore}%` : ""}`
                                        : `Watching • ${Math.round((progress.watchedSeconds / video.duration) * 100)}%`}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">Not started yet</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                {isCompleted ? (
                                  isApproved ? (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Approved
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                                      Awaiting Approval
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Incomplete
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
