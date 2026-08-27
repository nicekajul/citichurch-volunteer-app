"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Radio,
  Lightbulb,
  Monitor,
  Volume2,
  Palette,
  Camera,
  Mic,
  Video,
  Music,
  PenTool,
  Theater,
  Baby,
  Globe,
  CalendarDays,
  Filter,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { MinistryApplication } from "@/lib/data"

const teamIconMap: Record<string, React.ElementType> = {
  Radio, Lightbulb, Monitor, Volume2, Palette, Camera, Mic, Video, Music, PenTool, Theater, Baby, Globe, Users,
}

const AVAILABILITY_LABELS: Record<string, string> = {
  "sun-am": "Sunday Morning",
  "sun-pm": "Sunday Afternoon",
  "sun-eve": "Sunday Evening",
  "wed-eve": "Wednesday Evening",
  "fri-eve": "Friday Evening",
  "rehearsal": "Rehearsals / Weekday",
}

type FilterTab = "all" | "pending" | "approved" | "rejected"

export default function ApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { users, teams, ministryApplications, reviewApplication } = useData()

  const [activeTab, setActiveTab] = useState<FilterTab>("pending")
  const [selectedApp, setSelectedApp] = useState<MinistryApplication | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState("")

  if (user?.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  const pendingCount = ministryApplications.filter((a) => a.status === "pending").length

  const filtered = ministryApplications.filter((a) => {
    if (activeTab === "all") return true
    return a.status === activeTab
  })

  const getApplicant = (id: string) => users.find((u) => u.id === id)
  const getTeam = (id: string) => teams.find((t) => t.id === id)

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedApp) return
    if (status === "rejected" && !reviewNotes.trim()) {
      setActionError("Please provide a reason for rejection.")
      return
    }
    setIsSubmitting(true)
    setActionError("")
    try {
      await reviewApplication(selectedApp.id, status, reviewNotes)
      setSelectedApp(null)
      setReviewNotes("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to process application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusConfig = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    },
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pending", label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { key: "all", label: "All" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  const selectedApplicant = selectedApp ? getApplicant(selectedApp.applicantId) : null
  const selectedTeam = selectedApp ? getTeam(selectedApp.teamId) : null

  return (
    <div className="min-h-screen">
      <Header
        title="Ministry Applications"
        subtitle="Review and approve volunteer applications"
      />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {(["pending", "approved", "rejected"] as const).map((s) => {
            const count = ministryApplications.filter((a) => a.status === s).length
            const cfg = statusConfig[s]
            const Icon = cfg.icon
            return (
              <Card key={s} className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", cfg.className)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{cfg.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center space-y-3">
              <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No {activeTab !== "all" ? activeTab : ""} applications</p>
              <p className="text-sm text-muted-foreground">
                {activeTab === "pending" ? "All caught up! No applications need review." : "Nothing to show here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => {
              const applicant = getApplicant(app.applicantId)
              const team = getTeam(app.teamId)
              const Icon = teamIconMap[team?.icon || ""] || Users
              const cfg = statusConfig[app.status]
              const StatusIcon = cfg.icon

              return (
                <Card
                  key={app.id}
                  className="border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => { setSelectedApp(app); setReviewNotes(""); setActionError("") }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Applicant */}
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={applicant?.avatar} alt={applicant?.name} />
                        <AvatarFallback>{applicant?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{applicant?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{applicant?.email}</p>
                          </div>
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap", cfg.className)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <div
                            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md"
                            style={{ backgroundColor: (team?.color || "#888") + "22", color: team?.color }}
                          >
                            <Icon className="w-3 h-3" />
                            {team?.name}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      </div>

                      {app.status === "pending" && (
                        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
                            onClick={(e) => { e.stopPropagation(); setSelectedApp(app); setReviewNotes(""); setActionError("") }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) { setSelectedApp(null); setReviewNotes(""); setActionError("") } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review this application and approve or reject it.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-5 pt-1">
              {/* Applicant info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedApplicant?.avatar} alt={selectedApplicant?.name} />
                  <AvatarFallback>{selectedApplicant?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selectedApplicant?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedApplicant?.email}</p>
                </div>
                <div className="ml-auto">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusConfig[selectedApp.status].className)}>
                    {statusConfig[selectedApp.status].label}
                  </span>
                </div>
              </div>

              {/* Applied team */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Applied For</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: (selectedTeam?.color || "#888") + "22", color: selectedTeam?.color }}
                  >
                    {(() => { const Icon = teamIconMap[selectedTeam?.icon || ""] || Users; return <Icon className="w-4 h-4" /> })()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedTeam?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTeam?.description}</p>
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Motivation</p>
                <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{selectedApp.motivation}</p>
              </div>

              {/* Experience */}
              {selectedApp.experience && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Experience</p>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{selectedApp.experience}</p>
                </div>
              )}

              {/* Availability */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Availability</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.availability.map((id) => (
                    <Badge key={id} variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {AVAILABILITY_LABELS[id] || id}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Submitted date */}
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(selectedApp.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>

              {/* Existing review notes */}
              {selectedApp.status !== "pending" && selectedApp.reviewNotes && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm">{selectedApp.reviewNotes}</p>
                </div>
              )}

              {/* Review actions — only for pending */}
              {selectedApp.status === "pending" && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Notes <span className="text-muted-foreground font-normal">(required for rejection)</span>
                    </Label>
                    <Textarea
                      placeholder="Add notes for the applicant, instructions, or reason for rejection..."
                      className="min-h-[80px] resize-none"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>

                  {actionError && (
                    <p className="text-sm text-red-500">{actionError}</p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                      disabled={isSubmitting}
                      onClick={() => handleReview("rejected")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={isSubmitting}
                      onClick={() => handleReview("approved")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Processing..." : "Approve & Assign"}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Approving will automatically add the volunteer to the {selectedTeam?.name} team and notify their supervisor.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
