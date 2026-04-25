"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  FileQuestion,
  Award,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  PartyPopper,
} from "lucide-react"
import Link from "next/link"

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Extract Vimeo video ID
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

// Returns embed URL if the video is a YouTube or Vimeo link, otherwise null
function getEmbedUrl(url: string): { type: "youtube" | "vimeo"; embedUrl: string } | null {
  const youtubeId = getYouTubeId(url)
  if (youtubeId) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0&modestbranding=1`,
    }
  }
  const vimeoId = getVimeoId(url)
  if (vimeoId) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?api=1`,
    }
  }
  return null
}

export default function TrainingVideoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { trainingVideos, trainingProgress, quizzes, updateProgress, teams } = useData()

  const videoId = params.videoId as string
  const video = trainingVideos.find((v) => v.id === videoId)
  const quiz = quizzes.find((q) => q.videoId === videoId)
  const myProgress = trainingProgress.find((p) => p.userId === user?.id && p.videoId === videoId)

  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [canComplete, setCanComplete] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // Detect if the video URL is an embeddable link (YouTube/Vimeo)
  const embedInfo = video?.videoUrl ? getEmbedUrl(video.videoUrl) : null
  const isEmbedVideo = embedInfo !== null

  // Track YouTube iframe progress via postMessage
  const ytInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollYouTubeProgress = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }),
        "*"
      )
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "getDuration", args: [] }),
        "*"
      )
    }
  }, [])

  useEffect(() => {
    if (!isEmbedVideo) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
        // YouTube IFrame API events
        if (data?.event === "infoDelivery" && data?.info) {
          if (typeof data.info.currentTime === "number") {
            setCurrentTime(data.info.currentTime)
          }
          if (typeof data.info.duration === "number" && data.info.duration > 0) {
            setDuration(data.info.duration)
          }
          if (typeof data.info.playerState === "number") {
            setIsPlaying(data.info.playerState === 1)
          }
        }
        if (data?.event === "onStateChange") {
          // 1 = playing, 2 = paused, 0 = ended
          setIsPlaying(data.info === 1)
          if (data.info === 1) {
            ytInterval.current = setInterval(pollYouTubeProgress, 1000)
          } else {
            if (ytInterval.current) clearInterval(ytInterval.current)
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
      if (ytInterval.current) clearInterval(ytInterval.current)
    }
  }, [isEmbedVideo, pollYouTubeProgress])

  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user?.team_id)
  const currentIndex = relevantVideos.findIndex((v) => v.id === videoId)
  const prevVideo = currentIndex > 0 ? relevantVideos[currentIndex - 1] : null
  const nextVideo = currentIndex < relevantVideos.length - 1 ? relevantVideos[currentIndex + 1] : null

  const watchedPercentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0
  const isCompleted = myProgress?.completed
  const isApproved = myProgress?.approvedBy

  useEffect(() => {
    if (user && currentTime > 0) {
      const existingProgress = myProgress?.watchedSeconds || 0
      if (currentTime > existingProgress) {
        updateProgress(user.id, videoId, { watchedSeconds: Math.floor(currentTime) })
      }
    }
  }, [currentTime, user, videoId, myProgress?.watchedSeconds, updateProgress])

  useEffect(() => {
    if (duration > 0 && currentTime >= duration * 0.9) {
      setCanComplete(true)
    }
  }, [currentTime, duration])

  useEffect(() => {
    if (myProgress?.watchedSeconds && videoRef.current && video?.videoUrl) {
      try {
        videoRef.current.currentTime = myProgress.watchedSeconds
        setCurrentTime(myProgress.watchedSeconds)
      } catch {
        // Ignore seek errors when source is not ready
      }
    }
  }, [myProgress?.watchedSeconds, video?.videoUrl])

  const handleVideoPlay = async () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await videoRef.current.play()
        setIsPlaying(true)
      } catch {
        // Video source unavailable or playback failed — stay paused
        setIsPlaying(false)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number.parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleMarkComplete = () => {
    if (!user || !video) return

    if (video.quizEnabled && quiz) {
      setShowQuiz(true)
    } else {
      updateProgress(user.id, videoId, {
        completed: true,
        completedAt: new Date().toISOString(),
      })
    }
  }

  const handleQuizSubmit = () => {
    if (!quiz || !user || !video) return

    let correct = 0
    quiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })

    const score = Math.round((correct / quiz.questions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)

    const passed = score >= video.passingScore

    if (passed || !video.quizRequired) {
      updateProgress(user.id, videoId, {
        completed: true,
        completedAt: new Date().toISOString(),
        quizScore: score,
        quizPassed: passed,
      })
    } else {
      updateProgress(user.id, videoId, {
        quizScore: score,
        quizPassed: false,
      })
    }
  }

  const handleRetakeQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Video not found</h2>
          <Link href="/dashboard/my-training">
            <Button>Back to Training</Button>
          </Link>
        </div>
      </div>
    )
  }

  const quizPassed = quizScore !== null && quizScore >= video.passingScore

  return (
    <div className="min-h-screen">
      <Header title={video.title} subtitle={teams.find((t) => t.id === video.teamId)?.name || "General Training"} />

      <div className="p-4 lg:p-6 space-y-6">
        <Link href="/dashboard/my-training">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Training
          </Button>
        </Link>

        {!showQuiz ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/50 overflow-hidden">
                <div className="relative bg-black aspect-video">
                  {video.videoUrl && isEmbedVideo ? (
                    // YouTube / Vimeo embed
                    <iframe
                      ref={iframeRef}
                      src={embedInfo!.embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={video.title}
                    />
                  ) : video.videoUrl ? (
                    // Native video (direct file URL)
                    <>
                      <video
                        ref={videoRef}
                        src={video.videoUrl}
                        className="w-full h-full"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setIsPlaying(false)}
                        muted={isMuted}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer mb-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={handleVideoPlay}>
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-white hover:bg-white/20"
                              onClick={() => { if (videoRef.current) { videoRef.current.currentTime = 0; setCurrentTime(0) } }}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <span className="text-white text-sm ml-2">{formatTime(currentTime)} / {formatTime(duration)}</span>
                          </div>
                          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => videoRef.current?.requestFullscreen()}>
                            <Maximize className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // No video URL
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/60">
                      <Play className="w-12 h-12 opacity-40" />
                      <p className="text-sm">No video available for this module</p>
                      {!canComplete && (
                        <Button size="sm" variant="outline" className="mt-2 border-white/20 text-white hover:bg-white/10" onClick={() => setCanComplete(true)}>
                          Mark as Ready to Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                      {video.quizEnabled && (
                        <Badge variant="outline">
                          <FileQuestion className="w-3 h-3 mr-1" />
                          Quiz {video.quizRequired && "(Required)"}
                        </Badge>
                      )}
                    </div>
                    {isApproved && (
                      <Badge className="bg-primary/10 text-primary">
                        <Award className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Watch Progress</span>
                      <span className="font-medium">
                        {isEmbedVideo && !duration ? "—" : `${watchedPercentage}%`}
                      </span>
                    </div>
                    <Progress value={isEmbedVideo && !duration ? (canComplete ? 100 : 0) : watchedPercentage} className="h-2" />
                    {isEmbedVideo ? (
                      !canComplete && (
                        <p className="text-xs text-muted-foreground">
                          Watch the video above, then click &quot;Mark as Watched&quot; when done
                        </p>
                      )
                    ) : (
                      !canComplete && (
                        <p className="text-xs text-muted-foreground">
                          Watch at least 90% of the video to mark as complete
                        </p>
                      )
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {isEmbedVideo && !canComplete && !isCompleted && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setCanComplete(true)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Watched
                      </Button>
                    )}
                    {isCompleted ? (
                      <Button variant="outline" className="w-full bg-transparent" disabled>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Already Completed
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!canComplete}
                        onClick={handleMarkComplete}
                      >
                        {video.quizEnabled ? "Take Quiz & Complete" : "Mark as Complete"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                {prevVideo ? (
                  <Link href={`/dashboard/my-training/${prevVideo.id}`}>
                    <Button variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
                {nextVideo && (
                  <Link href={`/dashboard/my-training/${nextVideo.id}`}>
                    <Button variant="outline">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">About This Training</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{video.description}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Summary & Key Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{video.summary}</p>
                </CardContent>
              </Card>

              {video.quizEnabled && (
                <Card className="border-border/50 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileQuestion className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Quiz {video.quizRequired ? "Required" : "Available"}</p>
                        <p className="text-xs text-muted-foreground">
                          {video.passingScore}% passing score • {quiz?.questions.length || 0} questions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto border-border/50">
            <CardHeader>
              <CardTitle>{video.title} - Quiz</CardTitle>
              <CardDescription>
                Answer the following questions. {video.quizRequired && `You need ${video.passingScore}% to pass.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!quizSubmitted ? (
                <>
                  {quiz?.questions.map((question, qIdx) => (
                    <div key={question.id} className="space-y-3">
                      <p className="font-medium">
                        {qIdx + 1}. {question.question}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              quizAnswers[question.id] === optIdx
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={quizAnswers[question.id] === optIdx}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [question.id]: optIdx })}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length !== quiz?.questions.length}
                  >
                    Submit Quiz
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  {quizPassed ? (
                    <>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                        <PartyPopper className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
                      <p className="text-muted-foreground mb-4">You scored {quizScore}% and passed the quiz!</p>
                      <Alert className="bg-green-500/10 border-green-500/20 text-left">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <AlertDescription>
                          This training module has been marked as complete. Your team leader will review and approve
                          your progress.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Not Quite!</h3>
                      <p className="text-muted-foreground mb-4">
                        You scored {quizScore}%. You need {video.passingScore}% to pass.
                      </p>
                      {video.quizRequired ? (
                        <Alert variant="destructive" className="text-left mb-4">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            This quiz is required to proceed. Please review the material and try again.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-amber-500/10 border-amber-500/20 text-left mb-4">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <AlertDescription>
                            The quiz is optional, so your training is still marked as complete.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  <div className="flex gap-3 justify-center mt-6">
                    {!quizPassed && video.quizRequired && (
                      <Button onClick={handleRetakeQuiz}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retake Quiz
                      </Button>
                    )}
                    <Link href="/dashboard/my-training">
                      <Button variant="outline">Back to Training</Button>
                    </Link>
                    {nextVideo && (quizPassed || !video.quizRequired) && (
                      <Link href={`/dashboard/my-training/${nextVideo.id}`}>
                        <Button>
                          Next Video
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
