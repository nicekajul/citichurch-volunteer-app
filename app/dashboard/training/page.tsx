"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Edit2,
  Trash2,
  Video,
  Play,
  CheckCircle,
  FileQuestion,
  Search,
  MoreVertical,
  FileText,
  Download,
  Upload,
  X,
  File,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { TrainingDocument } from "@/lib/data"

export default function TrainingPage() {
  const { user } = useAuth()
  const {
    teams,
    trainingVideos,
    quizzes,
    addTrainingVideo,
    updateTrainingVideo,
    deleteTrainingVideo,
    addQuiz,
    updateQuiz,
  } = useData()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterTeam, setFilterTeam] = useState<string>("all")
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [selectedVideoForQuiz, setSelectedVideoForQuiz] = useState<string | null>(null)

  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false)
  const [editVideoData, setEditVideoData] = useState<{
    id: string
    title: string
    description: string
    videoUrl: string
    duration: number
    teamId: string
    order: number
    quizEnabled: boolean
    quizRequired: boolean
    passingScore: number
    summary: string
    documents: TrainingDocument[]
    hasVideo: boolean
  } | null>(null)

  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    hasVideo: true, // Toggle for video inclusion
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 120,
    teamId: "general",
    order: 1,
    quizEnabled: false,
    quizRequired: false,
    passingScore: 70,
    summary: "",
    documents: [] as TrainingDocument[], // Documents array
  })

  const [newDocName, setNewDocName] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")

  const [quizQuestions, setQuizQuestions] = useState<
    {
      question: string
      options: string[]
      correctAnswer: number
    }[]
  >([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }])

  if (user?.role !== "admin" && user?.role !== "team_leader") {
    return null
  }

  const filteredVideos = trainingVideos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeam = filterTeam === "all" || (filterTeam === "general" && !v.teamId) || v.teamId === filterTeam

    if (user?.role === "team_leader") {
      const isRelevant = !v.teamId || v.teamId === user.teamId
      return matchesSearch && isRelevant && (filterTeam === "all" || matchesTeam)
    }

    return matchesSearch && matchesTeam
  })

  const availableTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.teamId)

  const handleAddDocument = () => {
    if (!newDocName.trim() || !newDocUrl.trim()) return
    const docType = newDocUrl.endsWith(".pdf")
      ? "pdf"
      : newDocUrl.endsWith(".doc") || newDocUrl.endsWith(".docx")
        ? "doc"
        : newDocUrl.endsWith(".ppt") || newDocUrl.endsWith(".pptx")
          ? "ppt"
          : "other"

    setNewVideo({
      ...newVideo,
      documents: [
        ...newVideo.documents,
        { id: `doc-${Date.now()}`, name: newDocName, url: newDocUrl, type: docType as "pdf" | "doc" | "ppt" | "other" },
      ],
    })
    setNewDocName("")
    setNewDocUrl("")
  }

  const handleRemoveDocument = (docId: string) => {
    setNewVideo({
      ...newVideo,
      documents: newVideo.documents.filter((d) => d.id !== docId),
    })
  }

  const handleAddVideo = () => {
    const teamId =
      user?.role === "team_leader" ? user.teamId : newVideo.teamId === "general" ? undefined : newVideo.teamId

    addTrainingVideo({
      title: newVideo.title,
      description: newVideo.description,
      videoUrl: newVideo.hasVideo ? newVideo.videoUrl : undefined, // Only include URL if has video
      duration: newVideo.hasVideo ? newVideo.duration : 0,
      teamId: teamId,
      order: newVideo.order,
      quizEnabled: newVideo.quizEnabled,
      quizRequired: newVideo.quizRequired,
      passingScore: newVideo.passingScore,
      summary: newVideo.summary,
      documents: newVideo.documents, // Include documents
    })
    setNewVideo({
      title: "",
      description: "",
      hasVideo: true,
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      duration: 120,
      teamId: "general",
      order: 1,
      quizEnabled: false,
      quizRequired: false,
      passingScore: 70,
      summary: "",
      documents: [],
    })
    setIsAddVideoOpen(false)
  }

  const handleEditVideo = (videoId: string) => {
    const video = trainingVideos.find((v) => v.id === videoId)
    if (video) {
      setEditVideoData({
        id: video.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl || "",
        duration: video.duration,
        teamId: video.teamId || "general",
        order: video.order,
        quizEnabled: video.quizEnabled,
        quizRequired: video.quizRequired,
        passingScore: video.passingScore,
        summary: video.summary,
        documents: video.documents || [],
        hasVideo: !!video.videoUrl,
      })
      setIsEditVideoOpen(true)
    }
  }

  const handleSaveEditVideo = () => {
    if (!editVideoData) return

    updateTrainingVideo(editVideoData.id, {
      title: editVideoData.title,
      description: editVideoData.description,
      videoUrl: editVideoData.hasVideo ? editVideoData.videoUrl : undefined,
      duration: editVideoData.hasVideo ? editVideoData.duration : 0,
      teamId: editVideoData.teamId === "general" ? undefined : editVideoData.teamId,
      order: editVideoData.order,
      quizEnabled: editVideoData.quizEnabled,
      quizRequired: editVideoData.quizRequired,
      passingScore: editVideoData.passingScore,
      summary: editVideoData.summary,
      documents: editVideoData.documents,
    })
    setIsEditVideoOpen(false)
    setEditVideoData(null)
  }

  const handleSaveQuiz = () => {
    if (!selectedVideoForQuiz) return

    const existingQuiz = quizzes.find((q) => q.videoId === selectedVideoForQuiz)
    const questions = quizQuestions
      .filter((q) => q.question.trim())
      .map((q, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        ...q,
      }))

    if (existingQuiz) {
      updateQuiz(existingQuiz.id, { questions })
    } else {
      addQuiz({ videoId: selectedVideoForQuiz, questions })
    }

    const video = trainingVideos.find((v) => v.id === selectedVideoForQuiz)
    if (video && !video.quizEnabled && questions.length > 0) {
      updateTrainingVideo(selectedVideoForQuiz, { quizEnabled: true })
    }

    setIsQuizModalOpen(false)
    setQuizQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }])
    setSelectedVideoForQuiz(null)
  }

  const openQuizEditor = (videoId: string) => {
    setSelectedVideoForQuiz(videoId)
    const existingQuiz = quizzes.find((q) => q.videoId === videoId)
    if (existingQuiz) {
      setQuizQuestions(
        existingQuiz.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      )
    } else {
      setQuizQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }])
    }
    setIsQuizModalOpen(true)
  }

  const addQuestion = () => {
    if (quizQuestions.length < 5) {
      setQuizQuestions([...quizQuestions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }])
    }
  }

  const removeQuestion = (index: number) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(quizQuestions.filter((_, i) => i !== index))
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "Reading"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const canEditVideo = (video: (typeof trainingVideos)[0]) => {
    if (user?.role === "admin") return true
    if (user?.role === "team_leader" && video.teamId === user.teamId) return true
    return false
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />
      case "doc":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "ppt":
        return <FileText className="w-4 h-4 text-orange-500" />
      default:
        return <File className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Training Modules"
        subtitle={user?.role === "admin" ? "Manage all training content" : "Manage your team's training"}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search training..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="general">General</SelectItem>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Training Module</DialogTitle>
                <DialogDescription>
                  {user?.role === "team_leader"
                    ? `Create a new training module for your ${teams.find((t) => t.id === user.teamId)?.name} team`
                    : "Create a new training module with video and/or documents"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    placeholder="e.g., Advanced Lighting Techniques"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                    placeholder="Brief description of what this training covers"
                  />
                </div>

                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Video</Label>
                      <p className="text-xs text-muted-foreground">Add a video to this training module</p>
                    </div>
                    <Switch
                      checked={newVideo.hasVideo}
                      onCheckedChange={(checked) => setNewVideo({ ...newVideo, hasVideo: checked })}
                    />
                  </div>

                  {newVideo.hasVideo && (
                    <>
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input
                          value={newVideo.videoUrl}
                          onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={newVideo.duration}
                          onChange={(e) => setNewVideo({ ...newVideo, duration: Number.parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Training Documents</Label>
                      <p className="text-xs text-muted-foreground">Add downloadable files for volunteers</p>
                    </div>
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Document name"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL or path"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" size="icon" variant="outline" onClick={handleAddDocument}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {newVideo.documents.length > 0 && (
                    <div className="space-y-2">
                      {newVideo.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.type)}
                            <span>{doc.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Team</Label>
                  {user?.role === "admin" ? (
                    <Select value={newVideo.teamId} onValueChange={(v) => setNewVideo({ ...newVideo, teamId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="General" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General (All Teams)</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={teams.find((t) => t.id === user?.teamId)?.name || "Your Team"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Summary / Review Notes</Label>
                  <Textarea
                    value={newVideo.summary}
                    onChange={(e) => setNewVideo({ ...newVideo, summary: e.target.value })}
                    placeholder="Key takeaways and notes for the volunteer to review"
                    rows={3}
                  />
                </div>

                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Quiz</Label>
                      <p className="text-xs text-muted-foreground">Add a quiz after this module</p>
                    </div>
                    <Switch
                      checked={newVideo.quizEnabled}
                      onCheckedChange={(checked) => setNewVideo({ ...newVideo, quizEnabled: checked })}
                    />
                  </div>
                  {newVideo.quizEnabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require Passing</Label>
                          <p className="text-xs text-muted-foreground">Must pass to proceed</p>
                        </div>
                        <Switch
                          checked={newVideo.quizRequired}
                          onCheckedChange={(checked) => setNewVideo({ ...newVideo, quizRequired: checked })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passing Score (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={newVideo.passingScore}
                          onChange={(e) =>
                            setNewVideo({ ...newVideo, passingScore: Number.parseInt(e.target.value) || 70 })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddVideoOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVideo} disabled={!newVideo.title}>
                  Add Training
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const team = teams.find((t) => t.id === video.teamId)
            const quiz = quizzes.find((q) => q.videoId === video.id)
            const hasVideo = !!video.videoUrl
            const hasDocs = video.documents && video.documents.length > 0

            return (
              <Card key={video.id} className="border-border/50 overflow-hidden group">
                <div className="relative aspect-video bg-muted">
                  {hasVideo ? (
                    <>
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        poster="/training-video-thumbnail.jpg"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="rounded-full w-12 h-12">
                          <Play className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                        {formatDuration(video.duration)}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <FileText className="w-12 h-12 text-muted-foreground/50 mb-2" />
                      <span className="text-sm text-muted-foreground">Document-based Training</span>
                      {hasDocs && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {video.documents?.length} document(s)
                        </span>
                      )}
                    </div>
                  )}
                  {video.order <= 2 && !video.teamId && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">Required</Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{video.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{video.description}</p>
                    </div>
                    {canEditVideo(video) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openQuizEditor(video.id)}>
                            <FileQuestion className="w-4 h-4 mr-2" />
                            {quiz ? "Edit Quiz" : "Add Quiz"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditVideo(video.id)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Training
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteTrainingVideo(video.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {team ? (
                      <Badge variant="secondary" className="text-xs">
                        {team.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        General
                      </Badge>
                    )}
                    {hasVideo && (
                      <Badge variant="outline" className="text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    )}
                    {hasDocs && (
                      <Badge variant="outline" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        {video.documents?.length} Doc(s)
                      </Badge>
                    )}
                    {video.quizEnabled && (
                      <Badge variant="secondary" className={video.quizRequired ? "bg-primary/10 text-primary" : ""}>
                        <FileQuestion className="w-3 h-3 mr-1" />
                        Quiz {video.quizRequired && "(Required)"}
                      </Badge>
                    )}
                  </div>

                  {quiz && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {quiz.questions.length} questions - {video.passingScore}% to pass
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredVideos.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium text-lg mb-2">No Training Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search or filters" : "No training modules available"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Video Modal */}
        <Dialog open={isEditVideoOpen} onOpenChange={setIsEditVideoOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Training Module</DialogTitle>
              <DialogDescription>Update the training module details</DialogDescription>
            </DialogHeader>
            {editVideoData && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editVideoData.title}
                    onChange={(e) => setEditVideoData({ ...editVideoData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editVideoData.description}
                    onChange={(e) => setEditVideoData({ ...editVideoData, description: e.target.value })}
                  />
                </div>

                {/* Video toggle */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Video</Label>
                      <p className="text-xs text-muted-foreground">Add a video to this training</p>
                    </div>
                    <Switch
                      checked={editVideoData.hasVideo}
                      onCheckedChange={(checked) => setEditVideoData({ ...editVideoData, hasVideo: checked })}
                    />
                  </div>

                  {editVideoData.hasVideo && (
                    <>
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input
                          value={editVideoData.videoUrl}
                          onChange={(e) => setEditVideoData({ ...editVideoData, videoUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={editVideoData.duration}
                          onChange={(e) =>
                            setEditVideoData({ ...editVideoData, duration: Number.parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Documents section for editing */}
                <div className="space-y-3 pt-2 border-t">
                  <Label>Training Documents</Label>
                  {editVideoData.documents.length > 0 && (
                    <div className="space-y-2">
                      {editVideoData.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.type)}
                            <span>{doc.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setEditVideoData({
                                ...editVideoData,
                                documents: editVideoData.documents.filter((d) => d.id !== doc.id),
                              })
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Summary</Label>
                  <Textarea
                    value={editVideoData.summary}
                    onChange={(e) => setEditVideoData({ ...editVideoData, summary: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Enable Quiz</Label>
                    <Switch
                      checked={editVideoData.quizEnabled}
                      onCheckedChange={(checked) => setEditVideoData({ ...editVideoData, quizEnabled: checked })}
                    />
                  </div>
                  {editVideoData.quizEnabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Require Passing</Label>
                        <Switch
                          checked={editVideoData.quizRequired}
                          onCheckedChange={(checked) => setEditVideoData({ ...editVideoData, quizRequired: checked })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passing Score (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={editVideoData.passingScore}
                          onChange={(e) =>
                            setEditVideoData({ ...editVideoData, passingScore: Number.parseInt(e.target.value) || 70 })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditVideoOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditVideo}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quiz Editor Modal */}
        <Dialog open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quiz Editor</DialogTitle>
              <DialogDescription>Create 3-5 multiple choice questions for this training module</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Question {qIdx + 1}</Label>
                    {quizQuestions.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIdx)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...quizQuestions]
                      updated[qIdx].question = e.target.value
                      setQuizQuestions(updated)
                    }}
                    placeholder="Enter your question"
                  />
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${qIdx}`}
                          checked={q.correctAnswer === oIdx}
                          onChange={() => {
                            const updated = [...quizQuestions]
                            updated[qIdx].correctAnswer = oIdx
                            setQuizQuestions(updated)
                          }}
                          className="w-4 h-4"
                        />
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const updated = [...quizQuestions]
                            updated[qIdx].options[oIdx] = e.target.value
                            setQuizQuestions(updated)
                          }}
                          placeholder={`Option ${oIdx + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                </div>
              ))}

              {quizQuestions.length < 5 && (
                <Button variant="outline" onClick={addQuestion} className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question ({quizQuestions.length}/5)
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuizModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuiz} disabled={quizQuestions.filter((q) => q.question.trim()).length < 3}>
                Save Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
