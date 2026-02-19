"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { User, Phone, Mail, Calendar, Award, BookOpen, Clock, CheckCircle, Edit2, Save } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const { teams, trainingVideos, trainingProgress, updateUser } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    phone: user?.phone || "+63 912 345 6789",
    bio: "Passionate about serving in the Production Ministry. Looking forward to growing and contributing more to the team.",
  })

  if (!user) return null

  const team = teams.find((t) => t.id === user.teamId)

  const myProgress = trainingProgress.filter((p) => p.oderId === user.id)
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.teamId)
  const completedVideos = myProgress.filter((p) => p.completed)
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

  const handleSave = () => {
    updateUser(user.id, { phone: profile.phone })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen">
      <Header title="My Profile" subtitle="Manage your personal information" />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex justify-end">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-1 border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role === "leader"
                      ? "Team Leader"
                      : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {team && <Badge variant="outline">{team.name}</Badge>}
                </div>

                <div className="w-full mt-6 pt-6 border-t space-y-4 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span>{profile.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Training Progress</CardTitle>
                    <CardDescription>Your overall training completion status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{overallProgress}% Complete</span>
                        <span className="text-sm text-muted-foreground">
                          {completedVideos.length}/{relevantVideos.length} videos
                        </span>
                      </div>
                      <Progress value={overallProgress} className="h-3" />
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{relevantVideos.length}</p>
                          <p className="text-xs text-muted-foreground">Total Videos</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                          <p className="text-2xl font-bold">{completedVideos.length}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                          <p className="text-2xl font-bold">{relevantVideos.length - completedVideos.length}</p>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={4}
                      />
                    ) : (
                      <p className="text-muted-foreground">{profile.bio}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <CardDescription>Your contact and personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={user.name} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={user.username} disabled className="bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Team Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {team ? (
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not assigned to a team</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Certificates & Achievements</CardTitle>
                    <CardDescription>Your earned certifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {completedVideos.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {completedVideos.length >= 1 && (
                          <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                              <Award className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">First Steps</p>
                              <p className="text-xs text-muted-foreground">Completed first training</p>
                            </div>
                          </div>
                        )}
                        {completedVideos.length >= 3 && (
                          <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-amber-500/5 to-amber-500/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                              <Award className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                              <p className="font-medium">Dedicated Learner</p>
                              <p className="text-xs text-muted-foreground">Completed 3+ trainings</p>
                            </div>
                          </div>
                        )}
                        {overallProgress === 100 && (
                          <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-green-500/5 to-green-500/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                              <Award className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium">Training Complete</p>
                              <p className="text-xs text-muted-foreground">All trainings finished</p>
                            </div>
                          </div>
                        )}
                        {approvedVideos.length === completedVideos.length && completedVideos.length > 0 && (
                          <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-blue-500/5 to-blue-500/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                              <CheckCircle className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">Fully Approved</p>
                              <p className="text-xs text-muted-foreground">All trainings approved</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Complete training modules to earn achievements</p>
                      </div>
                    )}
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
