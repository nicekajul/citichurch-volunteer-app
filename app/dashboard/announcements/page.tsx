"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Plus, Calendar, User, Trash2 } from "lucide-react"

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { announcements, teams, users, addAnnouncement, deleteAnnouncement } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "low" as "low" | "medium" | "high",
    teamId: "",
  })

  const canCreate = user?.role === "admin" || user?.role === "team_leader"

  const filteredAnnouncements = announcements
    .filter((a) => {
      if (user?.role === "admin") return true
      if (!a.teamId) return true // General announcements visible to all
      if (user?.role === "team_leader" && a.teamId === user.teamId) return true
      if (user?.role === "volunteer" && a.teamId === user.teamId) return true
      return false
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCreate = () => {
    if (!newAnnouncement.title || !newAnnouncement.content || !user) return

    addAnnouncement({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      priority: newAnnouncement.priority,
      authorId: user.id,
      teamId: user.role === "team_leader" ? user.teamId : newAnnouncement.teamId || undefined,
    })
    setNewAnnouncement({ title: "", content: "", priority: "low", teamId: "" })
    setIsOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-200"
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-200"
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-200"
    }
  }

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "All Teams"
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team"
  }

  const getAuthorName = (authorId: string) => {
    return users.find((u) => u.id === authorId)?.name || "Unknown"
  }

  return (
    <div className="min-h-screen">
      <Header title="Announcements" subtitle="Stay updated with ministry news and updates" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">{filteredAnnouncements.length} announcement(s)</p>
          {canCreate && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>Share important updates with your team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="Announcement title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      placeholder="Write your announcement..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newAnnouncement.priority}
                        onValueChange={(value: "low" | "medium" | "high") =>
                          setNewAnnouncement({ ...newAnnouncement, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {user?.role === "admin" && (
                      <div className="space-y-2">
                        <Label>Team</Label>
                        <Select
                          value={newAnnouncement.teamId}
                          onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, teamId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Teams" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Teams</SelectItem>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!newAnnouncement.title || !newAnnouncement.content}>
                    Publish
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getAuthorName(announcement.authorId)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getTeamName(announcement.teamId)}</Badge>
                      <Badge className={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                      {user?.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
