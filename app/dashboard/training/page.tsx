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
  Link as LinkIcon,
  AlertCircle,
  Award,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { TrainingDocument } from "@/lib/data"
import type { Certificate } from "@/lib/data"
import { cn, getVideoThumbnail } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export default function TrainingPage() {
  const { user } = useAuth()
  const {
    teams,
    trainingVideos,
    quizzes,
    certificates,
    addTrainingVideo,
    updateTrainingVideo,
    deleteTrainingVideo,
    addQuiz,
    updateQuiz,
    addCertificate,
    updateCertificate,
    deleteCertificate,
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
    certificateId: string
    prerequisites: string[]
  } | null>(null)

  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [certForm, setCertForm] = useState({ name: "", description: "", color: "#3b82f6", prerequisiteCertificateId: "", teamId: "", orderIndex: 0 })
  const [editCertId, setEditCertId] = useState<string | null>(null)

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
    certificateId: "",
    prerequisites: [] as string[],
  })

  const [newDocName, setNewDocName] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")

  // Video source for Add form: "url" = YouTube/direct link, "upload" = file upload
  const [newVideoSource, setNewVideoSource] = useState<"url" | "upload">("url")
  const [newUploadFile, setNewUploadFile] = useState<File | null>(null)
  // Video source for Edit form
  const [editVideoSource, setEditVideoSource] = useState<"url" | "upload">("url")
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [quizQuestions, setQuizQuestions] = useState<
    {
      question: string
      options: string[]
      correctAnswer: number
    }[]
  >([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }])

  if (user?.role !== "admin" && user?.role !== "leader") {
    return null
  }

  const CERT_COLORS = [
    "#3b82f6","#22c55e","#a855f7","#f97316","#ef4444","#eab308","#ec4899","#14b8a6",
  ]

  const filteredVideos = trainingVideos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeam = filterTeam === "all" || (filterTeam === "general" && !v.teamId) || v.teamId === filterTeam

    if (user?.role === "leader") {
      const isRelevant = !v.teamId || v.teamId === user.team_id
      return matchesSearch && isRelevant && (filterTeam === "all" || matchesTeam)
    }

    return matchesSearch && matchesTeam
  })

  const availableTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.team_id)

  // Detects video duration from a local File before upload
  const getFileDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(Math.round(video.duration)) }
      video.onerror = () => resolve(0)
      video.src = URL.createObjectURL(file)
    })

  // Uploads a video file to Supabase Storage and returns the public URL + detected duration
  const uploadVideoFile = async (file: File): Promise<{ url: string; duration: number }> => {
    const duration = await getFileDuration(file)
    const supabase = createClient()
    const path = `training-videos/${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const { error } = await supabase.storage.from("training-videos").upload(path, file)
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from("training-videos").getPublicUrl(path)
    return { url: publicUrl, duration }
  }

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

  const handleSaveCert = async () => {
    if (!certForm.name.trim()) return
    const payload = {
      name: certForm.name,
      description: certForm.description,
      color: certForm.color,
      prerequisiteCertificateId: certForm.prerequisiteCertificateId || undefined,
      teamId: user?.role === "leader" ? user.team_id || undefined : certForm.teamId || undefined,
      orderIndex: certForm.orderIndex,
    }
    if (editCertId) {
      await updateCertificate(editCertId, payload)
    } else {
      await addCertificate(payload)
    }
    setCertForm({ name: "", description: "", color: "#3b82f6", prerequisiteCertificateId: "", teamId: "", orderIndex: 0 })
    setEditCertId(null)
  }

  const handleAddVideo = async () => {
    setUploadError(null)
    let videoUrl: string | undefined = newVideo.hasVideo ? newVideo.videoUrl || undefined : undefined
    let duration = newVideo.hasVideo ? newVideo.duration : 0

    if (newVideo.hasVideo && newVideoSource === "upload") {
      if (!newUploadFile) return
      setIsUploading(true)
      try {
        const result = await uploadVideoFile(newUploadFile)
        videoUrl = result.url
        duration = result.duration
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed")
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    const teamId =
      user?.role === "leader" ? user.team_id : newVideo.teamId === "general" ? undefined : newVideo.teamId

    addTrainingVideo({
      title: newVideo.title,
      description: newVideo.description,
      videoUrl,
      duration,
      teamId: teamId || undefined,
      order: newVideo.order,
      quizEnabled: newVideo.quizEnabled,
      quizRequired: newVideo.quizRequired,
      passingScore: newVideo.passingScore,
      summary: newVideo.summary,
      documents: newVideo.documents,
      certificateId: newVideo.certificateId || undefined,
      prerequisites: newVideo.prerequisites,
    })
    setNewVideo({ title: "", description: "", hasVideo: true, videoUrl: "", duration: 120, teamId: "general", order: 1, quizEnabled: false, quizRequired: false, passingScore: 70, summary: "", documents: [], certificateId: "", prerequisites: [] })
    setNewVideoSource("url")
    setNewUploadFile(null)
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
        certificateId: video.certificateId || "",
        prerequisites: video.prerequisites || [],
      })
      setEditVideoSource("url")
      setEditUploadFile(null)
      setUploadError(null)
      setIsEditVideoOpen(true)
    }
  }

  const handleSaveEditVideo = async () => {
    if (!editVideoData) return
    setUploadError(null)

    let videoUrl: string | undefined = editVideoData.hasVideo ? editVideoData.videoUrl || undefined : undefined
    let duration = editVideoData.hasVideo ? editVideoData.duration : 0

    if (editVideoData.hasVideo && editVideoSource === "upload") {
      if (!editUploadFile) return
      setIsUploading(true)
      try {
        const result = await uploadVideoFile(editUploadFile)
        videoUrl = result.url
        duration = result.duration
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed")
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    updateTrainingVideo(editVideoData.id, {
      title: editVideoData.title,
      description: editVideoData.description,
      videoUrl,
      duration,
      teamId: editVideoData.teamId === "general" ? undefined : editVideoData.teamId,
      order: editVideoData.order,
      quizEnabled: editVideoData.quizEnabled,
      quizRequired: editVideoData.quizRequired,
      passingScore: editVideoData.passingScore,
      summary: editVideoData.summary,
      documents: editVideoData.documents,
      certificateId: editVideoData.certificateId || undefined,
      prerequisites: editVideoData.prerequisites,
    })
    setIsEditVideoOpen(false)
    setEditVideoData(null)
    setEditVideoSource("url")
    setEditUploadFile(null)
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
    if (user?.role === "leader" && video.teamId === user.team_id) return true
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

          <div className="flex gap-2">
          <Dialog open={isCertModalOpen} onOpenChange={setIsCertModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award className="w-4 h-4 mr-2" />
                Manage Certificates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Certificates</DialogTitle>
                <DialogDescription>Create and manage training certificates for volunteers</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {certificates.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Existing Certificates</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cert.color }} />
                            <span className="font-medium text-sm">{cert.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditCertId(cert.id)
                                setCertForm({ name: cert.name, description: cert.description, color: cert.color, prerequisiteCertificateId: cert.prerequisiteCertificateId || "", teamId: cert.teamId || "", orderIndex: cert.orderIndex })
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteCertificate(cert.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-sm font-medium">{editCertId ? "Edit Certificate" : "Add New Certificate"}</Label>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={certForm.name}
                      onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                      placeholder="e.g., Production Basics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={certForm.description}
                      onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {CERT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCertForm({ ...certForm, color })}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${certForm.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Prerequisite Certificate</Label>
                    <p className="text-xs text-muted-foreground">Volunteers must earn this certificate before unlocking the new one</p>
                    <Select
                      value={certForm.prerequisiteCertificateId || "none"}
                      onValueChange={(v) => setCertForm({ ...certForm, prerequisiteCertificateId: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No prerequisite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No prerequisite (unlocked for all)</SelectItem>
                        {certificates
                          .filter((c) => c.id !== editCertId)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {user?.role === "admin" && (
                    <div className="space-y-2">
                      <Label>Assign to Team</Label>
                      <p className="text-xs text-muted-foreground">Leave empty for ministry-wide certificates</p>
                      <Select
                        value={certForm.teamId || "all"}
                        onValueChange={(v) => setCertForm({ ...certForm, teamId: v === "all" ? "" : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All teams" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All teams (ministry-wide)</SelectItem>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <p className="text-xs text-muted-foreground">Lower numbers appear first in the roadmap (0 = first)</p>
                    <Input
                      type="number"
                      min={0}
                      value={certForm.orderIndex}
                      onChange={(e) => setCertForm({ ...certForm, orderIndex: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCert} disabled={!certForm.name.trim()} className="flex-1">
                      {editCertId ? "Update Certificate" : "Add Certificate"}
                    </Button>
                    {editCertId && (
                      <Button variant="outline" onClick={() => { setEditCertId(null); setCertForm({ name: "", description: "", color: "#3b82f6", prerequisiteCertificateId: "", teamId: "", orderIndex: 0 }) }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Training Module</DialogTitle>
                <DialogDescription>
                  {user?.role === "leader"
                    ? `Create a new training module for your ${teams.find((t) => t.id === user.team_id)?.name} team`
                    : "Create a new training module with video and/or documents"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="training-title">Title</Label>
                  <Input
                    id="training-title"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    placeholder="e.g., Advanced Lighting Techniques"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training-description">Description</Label>
                  <Textarea
                    id="training-description"
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                    placeholder="Brief description of what this training covers"
                    rows={3}
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label className="font-medium">Include Video</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Add a video to this training module</p>
                    </div>
                    <Switch
                      checked={newVideo.hasVideo}
                      onCheckedChange={(checked) => setNewVideo({ ...newVideo, hasVideo: checked })}
                    />
                  </div>

                  {newVideo.hasVideo && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      {/* Source toggle */}
                      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                        <button
                          type="button"
                          onClick={() => { setNewVideoSource("url"); setNewUploadFile(null) }}
                          className={cn("flex-1 flex items-center justify-center gap-2 py-2 font-medium transition-colors", newVideoSource === "url" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> YouTube / URL
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewVideoSource("upload"); setNewVideo({ ...newVideo, videoUrl: "" }) }}
                          className={cn("flex-1 flex items-center justify-center gap-2 py-2 font-medium transition-colors", newVideoSource === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload File
                        </button>
                      </div>

                      {newVideoSource === "url" ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                              value={newVideo.videoUrl}
                              onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                              placeholder="https://youtube.com/watch?v=... or direct video URL"
                            />
                          </div>
                          {/* Live YouTube thumbnail preview */}
                          {getVideoThumbnail(newVideo.videoUrl) && (
                            <img
                              src={getVideoThumbnail(newVideo.videoUrl)!}
                              alt="YouTube thumbnail preview"
                              className="w-full rounded-lg aspect-video object-cover"
                            />
                          )}
                          <div className="space-y-2">
                            <Label>Duration (seconds)</Label>
                            <Input
                              type="number"
                              value={newVideo.duration}
                              onChange={(e) => setNewVideo({ ...newVideo, duration: Number.parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Video File</Label>
                          <label
                            htmlFor="new-video-file"
                            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground text-center">
                              {newUploadFile ? newUploadFile.name : "Click to choose a video file"}
                            </span>
                            {newUploadFile && (
                              <span className="text-xs text-muted-foreground">{(newUploadFile.size / 1024 / 1024).toFixed(1)} MB · Duration auto-detected on save</span>
                            )}
                            <input
                              id="new-video-file"
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => setNewUploadFile(e.target.files?.[0] ?? null)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label className="font-medium">Training Documents</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Add downloadable files for volunteers</p>
                    </div>
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Document name"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="flex-[2]"
                    />
                    <Input
                      placeholder="URL or path"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      className="flex-[3]"
                    />
                    <Button type="button" size="icon" variant="outline" onClick={handleAddDocument} disabled={!newDocName.trim() || !newDocUrl.trim()}>
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
                      value={teams.find((t) => t.id === user?.team_id)?.name || "Your Team"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Certificate</Label>
                  <Select value={newVideo.certificateId} onValueChange={(v) => setNewVideo({ ...newVideo, certificateId: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {certificates.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id}>
                          {cert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {trainingVideos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Prerequisites (must complete before this module)</Label>
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                      {trainingVideos.map((v) => (
                        <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                          <input
                            type="checkbox"
                            checked={newVideo.prerequisites.includes(v.id)}
                            onChange={(e) => {
                              setNewVideo({
                                ...newVideo,
                                prerequisites: e.target.checked
                                  ? [...newVideo.prerequisites, v.id]
                                  : newVideo.prerequisites.filter((id) => id !== v.id),
                              })
                            }}
                            className="w-4 h-4"
                          />
                          <span>{v.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Summary / Review Notes</Label>
                  <Textarea
                    value={newVideo.summary}
                    onChange={(e) => setNewVideo({ ...newVideo, summary: e.target.value })}
                    placeholder="Key takeaways and notes for the volunteer to review"
                    rows={3}
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="enable-quiz" className="font-medium">Enable Quiz</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Add a quiz after this module</p>
                    </div>
                    <Switch
                      id="enable-quiz"
                      checked={newVideo.quizEnabled}
                      onCheckedChange={(checked) => setNewVideo({ ...newVideo, quizEnabled: checked })}
                    />
                  </div>
                  {newVideo.quizEnabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div>
                          <Label htmlFor="require-passing" className="text-sm">Require Passing</Label>
                          <p className="text-xs text-muted-foreground">Must pass to proceed</p>
                        </div>
                        <Switch
                          id="require-passing"
                          checked={newVideo.quizRequired}
                          onCheckedChange={(checked) => setNewVideo({ ...newVideo, quizRequired: checked })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passing-score">Passing Score (%)</Label>
                        <Input
                          id="passing-score"
                          type="number"
                          min={0}
                          max={100}
                          value={newVideo.passingScore}
                          onChange={(e) =>
                            setNewVideo({ ...newVideo, passingScore: Number.parseInt(e.target.value) || 70 })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {uploadError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {uploadError}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddVideoOpen(false)} disabled={isUploading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddVideo}
                  disabled={!newVideo.title || isUploading || (newVideo.hasVideo && newVideoSource === "upload" && !newUploadFile)}
                >
                  {isUploading ? "Uploading…" : "Add Training"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
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
                      {getVideoThumbnail(video.videoUrl) ? (
                        <img
                          src={getVideoThumbnail(video.videoUrl)!}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                          <Video className="w-10 h-10 text-white/30" />
                        </div>
                      )}
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
                      {video.certificateId && (() => {
                        const cert = certificates.find((c) => c.id === video.certificateId)
                        return cert ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5"
                            style={{ color: cert.color, backgroundColor: `${cert.color}18` }}
                          >
                            {cert.name}
                          </span>
                        ) : null
                      })()}
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
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      {/* Source toggle */}
                      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                        <button
                          type="button"
                          onClick={() => { setEditVideoSource("url"); setEditUploadFile(null) }}
                          className={cn("flex-1 flex items-center justify-center gap-2 py-2 font-medium transition-colors", editVideoSource === "url" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> YouTube / URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditVideoSource("upload")}
                          className={cn("flex-1 flex items-center justify-center gap-2 py-2 font-medium transition-colors", editVideoSource === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload File
                        </button>
                      </div>

                      {editVideoSource === "url" ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                              value={editVideoData.videoUrl}
                              onChange={(e) => setEditVideoData({ ...editVideoData, videoUrl: e.target.value })}
                              placeholder="https://youtube.com/watch?v=... or direct video URL"
                            />
                          </div>
                          {getVideoThumbnail(editVideoData.videoUrl) && (
                            <img
                              src={getVideoThumbnail(editVideoData.videoUrl)!}
                              alt="YouTube thumbnail preview"
                              className="w-full rounded-lg aspect-video object-cover"
                            />
                          )}
                          <div className="space-y-2">
                            <Label>Duration (seconds)</Label>
                            <Input
                              type="number"
                              value={editVideoData.duration}
                              onChange={(e) => setEditVideoData({ ...editVideoData, duration: Number.parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Replace Video File</Label>
                          <label
                            htmlFor="edit-video-file"
                            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground text-center">
                              {editUploadFile ? editUploadFile.name : "Click to choose a replacement video"}
                            </span>
                            {editUploadFile && (
                              <span className="text-xs text-muted-foreground">{(editUploadFile.size / 1024 / 1024).toFixed(1)} MB · Duration auto-detected on save</span>
                            )}
                            <input
                              id="edit-video-file"
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => setEditUploadFile(e.target.files?.[0] ?? null)}
                            />
                          </label>
                          {editVideoData.videoUrl && !editUploadFile && (
                            <p className="text-xs text-muted-foreground">Current: {editVideoData.videoUrl.split("/").pop()}</p>
                          )}
                        </div>
                      )}
                    </div>
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

                <div className="space-y-2">
                  <Label>Certificate</Label>
                  <Select value={editVideoData.certificateId} onValueChange={(v) => setEditVideoData({ ...editVideoData, certificateId: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {certificates.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id}>
                          {cert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {trainingVideos.filter((v) => v.id !== editVideoData.id).length > 0 && (
                  <div className="space-y-2">
                    <Label>Prerequisites (must complete before this module)</Label>
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                      {trainingVideos.filter((v) => v.id !== editVideoData.id).map((v) => (
                        <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                          <input
                            type="checkbox"
                            checked={editVideoData.prerequisites.includes(v.id)}
                            onChange={(e) => {
                              setEditVideoData({
                                ...editVideoData,
                                prerequisites: e.target.checked
                                  ? [...editVideoData.prerequisites, v.id]
                                  : editVideoData.prerequisites.filter((id) => id !== v.id),
                              })
                            }}
                            className="w-4 h-4"
                          />
                          <span>{v.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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
            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditVideoOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditVideo}
                disabled={isUploading || (editVideoData?.hasVideo && editVideoSource === "upload" && !editUploadFile)}
              >
                {isUploading ? "Uploading…" : "Save Changes"}
              </Button>
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
