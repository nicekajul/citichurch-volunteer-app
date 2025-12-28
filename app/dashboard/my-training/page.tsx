"use client"

import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Play, Lock, FileQuestion, Award } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function MyTrainingPage() {
  const { user } = useAuth()
  const { teams, trainingVideos, trainingProgress } = useData()
  const router = useRouter()

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  const myTeam = teams.find((t) => t.id === user.teamId)
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.teamId)
  const myProgress = trainingProgress.filter((p) => p.oderId === user.id)
  const completedVideos = myProgress.filter((p) => p.completed)

  const overallProgress =
    relevantVideos.length > 0 ? Math.round((completedVideos.length / relevantVideos.length) * 100) : 0

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Separate general and team-specific videos
  const generalVideos = relevantVideos.filter((v) => !v.teamId)
  const teamVideos = relevantVideos.filter((v) => v.teamId)

  const renderVideoCard = (video: (typeof relevantVideos)[0], index: number, allVideos: typeof relevantVideos) => {
    const videoProgress = myProgress.find((p) => p.videoId === video.id)
    const isCompleted = videoProgress?.completed
    const isApproved = videoProgress?.approvedBy
    const watchedPercentage = videoProgress ? Math.round((videoProgress.watchedSeconds / video.duration) * 100) : 0

    // Check if previous video is completed (for sequential unlock)
    const prevVideo = allVideos[index - 1]
    const prevCompleted = !prevVideo || myProgress.some((p) => p.videoId === prevVideo.id && p.completed)
    const isLocked = !prevCompleted && index > 0

    return (
      <Card key={video.id} className={`border-border/50 overflow-hidden ${isLocked ? "opacity-60" : ""}`}>
        {/* Video Thumbnail */}
        <div className="relative aspect-video bg-muted">
          <video src={video.videoUrl} className="w-full h-full object-cover" poster="/training-video-thumbnail.jpg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Complete previous video first</p>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            </div>
          ) : (
            <Link href={`/dashboard/my-training/${video.id}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Button size="icon" variant="secondary" className="rounded-full w-14 h-14">
                  <Play className="w-6 h-6" />
                </Button>
              </div>
            </Link>
          )}

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(video.duration)}
              </span>
              {video.quizEnabled && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <FileQuestion className="w-3 h-3 mr-1" />
                  Quiz
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold line-clamp-1">{video.title}</h3>
            {video.order <= 2 && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Required
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>

          {/* Progress */}
          {!isLocked && (
            <div className="space-y-2">
              {isCompleted ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">Completed</span>
                  {isApproved ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Award className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{watchedPercentage}%</span>
                  </div>
                  <Progress value={watchedPercentage} className="h-2" />
                </>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            {isLocked ? (
              <Button variant="outline" className="w-full bg-transparent" disabled>
                <Lock className="w-4 h-4 mr-2" />
                Locked
              </Button>
            ) : isCompleted ? (
              <Link href={`/dashboard/my-training/${video.id}`} className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Review Again
                </Button>
              </Link>
            ) : (
              <Link href={`/dashboard/my-training/${video.id}`} className="block">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  {videoProgress ? "Continue" : "Start"} Training
                </Button>
              </Link>
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

        {/* General Training */}
        {generalVideos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">General Training</h2>
              <Badge variant="outline">{generalVideos.length} modules</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalVideos.map((video, index) => renderVideoCard(video, index, generalVideos))}
            </div>
          </div>
        )}

        {/* Team-Specific Training */}
        {teamVideos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{myTeam?.name || "Team"} Training</h2>
              <Badge variant="outline">{teamVideos.length} modules</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamVideos.map((video, index) => renderVideoCard(video, index, teamVideos))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
