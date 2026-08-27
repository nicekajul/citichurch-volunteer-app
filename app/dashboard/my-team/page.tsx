"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Search, Phone, Calendar, CheckCircle, CheckCircle2, Video, MessageSquare, Send, User, Award, XCircle, ShieldCheck } from "lucide-react"
import { VolunteerBadges } from "@/components/volunteer-badges"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import type { DelegatedPermission } from "@/lib/data"

const PERMISSION_OPTIONS: { key: DelegatedPermission; label: string; description: string }[] = [
  { key: "schedule", label: "Manage Schedule", description: "Create and edit service schedules and assignments" },
  { key: "training", label: "Manage Training Modules", description: "Create and edit training videos and quizzes" },
  { key: "approvals", label: "Approve Trainings", description: "Approve or decline completed training modules" },
  { key: "announcements", label: "Post Announcements", description: "Post announcements to the team" },
]

export default function MyTeamPage() {
  const { user } = useAuth()
  const {
    users,
    teams,
    trainingVideos,
    trainingProgress,
    approveProgress,
    declineProgress,
    addAnnouncement,
    certificates,
    getEarnedCertificates,
    teamPermissions,
    grantTeamPermission,
    revokeTeamPermission,
    hasTeamPermission,
  } = useData()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [isMessageOpen, setIsMessageOpen] = useState(false)
  const [message, setMessage] = useState({ title: "", content: "" })
  const [permissionsMember, setPermissionsMember] = useState<{ id: string; name: string } | null>(null)
  const [decliningProgressId, setDecliningProgressId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")

  const isLeader = user?.role === "leader"
  const canApprove = isLeader || hasTeamPermission(user?.id, "approvals")
  const canMessage = isLeader || hasTeamPermission(user?.id, "announcements")

  if (!user || (!isLeader && !canApprove && !hasTeamPermission(user.id, "schedule") && !hasTeamPermission(user.id, "training") && !canMessage)) {
    router.push("/dashboard")
    return null
  }

  const myTeam = teams.find((t) => t.id === user.team_id)
  const teamMembers = users.filter((u) => u.teamId === user.team_id && u.role === "volunteer")
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.team_id)

  const handleTogglePermission = async (memberId: string, permission: DelegatedPermission, enabled: boolean) => {
    if (!user?.team_id) return
    if (enabled) {
      await grantTeamPermission(memberId, user.team_id, permission)
    } else {
      const existing = teamPermissions.find(
        (p) => p.userId === memberId && p.teamId === user.team_id && p.permission === permission,
      )
      if (existing) await revokeTeamPermission(existing.id)
    }
  }

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getMemberProgress = (memberId: string) => {
    const memberProg = trainingProgress.filter((p) => p.userId === memberId)
    const completed = memberProg.filter((p) => p.completed).length
    return {
      completed,
      total: relevantVideos.length,
      percentage: relevantVideos.length > 0 ? Math.round((completed / relevantVideos.length) * 100) : 0,
      progress: memberProg,
    }
  }

  const getPendingApprovals = (memberId: string) => {
    return trainingProgress.filter((p) => p.userId === memberId && p.completed && !p.approvedBy)
  }

  const handleApprove = (progressId: string) => {
    approveProgress(progressId, user.id)
  }

  const handleDecline = async () => {
    if (!decliningProgressId) return
    await declineProgress(decliningProgressId, user.id, declineReason.trim())
    setDecliningProgressId(null)
    setDeclineReason("")
  }

  const handleSendMessage = () => {
    addAnnouncement({
      title: message.title,
      content: message.content,
      authorId: user.id,
      teamId: user.team_id || undefined,
      priority: "normal",
    })
    setMessage({ title: "", content: "" })
    setIsMessageOpen(false)
  }

  const selectedMemberData = selectedMember ? users.find((u) => u.id === selectedMember) : null
  const selectedMemberProgress = selectedMember ? getMemberProgress(selectedMember) : null

  return (
    <div className="min-h-screen">
      <Header title={`${myTeam?.name || "My"} Team`} subtitle="Manage your team members" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {canMessage && (
            <Button onClick={() => setIsMessageOpen(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Team Message
            </Button>
          )}
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const progress = getMemberProgress(member.id)
            const pendingApprovals = getPendingApprovals(member.id)

            return (
              <Card key={member.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{member.name}</p>
                        <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                          {member.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="mt-1.5"><VolunteerBadges userId={member.id} /></div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {member.phone || "No phone"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(member.joinDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Training Progress</span>
                      <span className="font-medium">{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.completed} of {progress.total} videos completed
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => setSelectedMember(member.id)}
                    >
                      View Details
                    </Button>
                    {isLeader && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        title="Delegate permissions"
                        onClick={() => setPermissionsMember({ id: member.id, name: member.name })}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </Button>
                    )}
                    {canApprove && pendingApprovals.length > 0 && (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => pendingApprovals.forEach((p) => handleApprove(p.id))}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve ({pendingApprovals.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredMembers.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium text-lg mb-2">No Team Members</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No members match your search" : "No volunteers assigned to your team yet"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Member Details Dialog */}
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>View training progress and approve completed modules</DialogDescription>
            </DialogHeader>

            {selectedMemberData && selectedMemberProgress && (
              <div className="py-4">
                {/* Member Info */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedMemberData.avatar} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {selectedMemberData.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedMemberData.name}</h3>
                    <p className="text-muted-foreground">{selectedMemberData.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant={selectedMemberData.status === "active" ? "default" : "secondary"}>
                        {selectedMemberData.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedMemberProgress.percentage}% training complete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Training Progress */}
                <h4 className="font-medium mb-3">Training Progress</h4>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {relevantVideos.map((video) => {
                    const videoProgress = selectedMemberProgress.progress.find((p) => p.videoId === video.id)
                    const isCompleted = videoProgress?.completed
                    const isApproved = videoProgress?.approvedBy

                    return (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCompleted ? "bg-green-500/10" : "bg-muted"}`}>
                            <Video className={`w-4 h-4 ${isCompleted ? "text-green-500" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{video.title}</p>
                            {videoProgress && isCompleted && (
                              <p className="text-xs text-muted-foreground">
                                Completed • Score: {videoProgress.quizScore || "N/A"}%
                              </p>
                            )}
                            {videoProgress && !isCompleted && videoProgress.watchedSeconds > 0 && (
                              <p className="text-xs text-muted-foreground">
                                In progress • {Math.round((videoProgress.watchedSeconds / video.duration) * 100)}% watched
                              </p>
                            )}
                            {(!videoProgress || (!isCompleted && videoProgress.watchedSeconds === 0)) && (
                              <p className="text-xs text-muted-foreground">Not started</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && isApproved && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {isCompleted && !isApproved && videoProgress && canApprove && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => { setDecliningProgressId(videoProgress.id); setDeclineReason("") }}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Decline
                              </Button>
                              <Button size="sm" onClick={() => handleApprove(videoProgress.id)}>
                                Approve
                              </Button>
                            </>
                          )}
                          {!isCompleted && videoProgress && videoProgress.watchedSeconds > 0 && (
                            <Badge variant="secondary">In Progress</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Team Message</DialogTitle>
              <DialogDescription>Post an announcement to your team members</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={message.title}
                  onChange={(e) => setMessage({ ...message, title: e.target.value })}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={message.content}
                  onChange={(e) => setMessage({ ...message, content: e.target.value })}
                  placeholder="Write your message..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={!message.title || !message.content}>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Reason Dialog */}
        <Dialog open={!!decliningProgressId} onOpenChange={(open) => { if (!open) { setDecliningProgressId(null); setDeclineReason("") } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Training</DialogTitle>
              <DialogDescription>
                This sends the module back to &quot;not started&quot; so the volunteer can redo it. Let them know why.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (optional)..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDecliningProgressId(null); setDeclineReason("") }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDecline}>
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delegate Permissions Dialog — leader only */}
        <Dialog open={!!permissionsMember} onOpenChange={(open) => { if (!open) setPermissionsMember(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delegate Permissions</DialogTitle>
              <DialogDescription>
                Let {permissionsMember?.name} help manage the team by handling these tasks on your behalf.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-4">
              {PERMISSION_OPTIONS.map((opt) => {
                const enabled = permissionsMember ? hasTeamPermission(permissionsMember.id, opt.key) : false
                return (
                  <div key={opt.key} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        if (permissionsMember) handleTogglePermission(permissionsMember.id, opt.key, checked)
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermissionsMember(null)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
