"use client"

import type React from "react"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Users,
  Radio,
  Lightbulb,
  Monitor,
  Volume2,
  Palette,
  Camera,
  Search,
  MoreVertical,
  Mail,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

const teamIcons: Record<string, React.ElementType> = {
  Radio: Radio,
  Lightbulb: Lightbulb,
  Monitor: Monitor,
  Volume2: Volume2,
  Palette: Palette,
  Camera: Camera,
}

export default function TeamsPage() {
  const { user } = useAuth()
  const { teams, users, trainingProgress, addTeam, updateTeam, deleteTeam, assignUserToTeam, updateUser } = useData()
  const router = useRouter()

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<string | null>(null)

  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    color: "#d4a843",
    icon: "Users",
    requirements: "",
  })

  if (user?.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  const getTeamMembers = (teamId: string) => {
    return users.filter((u) => u.teamId === teamId)
  }

  const getTeamProgress = (teamId: string) => {
    const members = getTeamMembers(teamId)
    const memberIds = members.map((m) => m.id)
    const teamProg = trainingProgress.filter((p) => memberIds.includes(p.oderId))
    const completed = teamProg.filter((p) => p.completed).length
    return teamProg.length > 0 ? Math.round((completed / teamProg.length) * 100) : 0
  }

  const unassignedUsers = users.filter((u) => !u.teamId && u.role === "volunteer")

  const handleAddTeam = () => {
    addTeam({
      name: newTeam.name,
      description: newTeam.description,
      color: newTeam.color,
      icon: newTeam.icon,
      requirements: newTeam.requirements
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r),
    })
    setNewTeam({ name: "", description: "", color: "#d4a843", icon: "Users", requirements: "" })
    setIsAddTeamOpen(false)
  }

  const handleAssignMember = (userId: string, teamId: string) => {
    assignUserToTeam(userId, teamId)
    setIsAddMemberOpen(false)
  }

  const handleRemoveMember = (userId: string) => {
    updateUser(userId, { teamId: undefined })
  }

  const filteredTeams = teams.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen">
      <Header title="Team Management" subtitle="Manage Production Ministry teams" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>Add a new team to the Production Ministry</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Graphics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Brief description of the team's role"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={newTeam.icon} onValueChange={(v) => setNewTeam({ ...newTeam, icon: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Radio">Radio</SelectItem>
                        <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                        <SelectItem value="Monitor">Monitor</SelectItem>
                        <SelectItem value="Volume2">Volume</SelectItem>
                        <SelectItem value="Palette">Palette</SelectItem>
                        <SelectItem value="Camera">Camera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={newTeam.color}
                      onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                      className="h-10 p-1 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Requirements (comma-separated)</Label>
                  <Input
                    value={newTeam.requirements}
                    onChange={(e) => setNewTeam({ ...newTeam, requirements: e.target.value })}
                    placeholder="e.g., Technical aptitude, Creativity"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTeam} disabled={!newTeam.name}>
                  Create Team
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Teams Grid */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team) => {
                const IconComponent = teamIcons[team.icon] || Users
                const members = getTeamMembers(team.id)
                const progress = getTeamProgress(team.id)
                const leader = users.find((u) => u.id === team.leaderId)

                return (
                  <Card key={team.id} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${team.color}20` }}>
                            <IconComponent className="w-5 h-5" style={{ color: team.color }} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{team.name}</CardTitle>
                            <CardDescription className="text-xs">{members.length} members</CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTeam(team.id)}>
                              <Users className="w-4 h-4 mr-2" />
                              View Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingTeam(team.id)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteTeam(team.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>

                      {leader && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={leader.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{leader.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">
                            <span className="text-muted-foreground">Leader: </span>
                            <span className="font-medium">{leader.name}</span>
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Training Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {team.requirements && team.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {team.requirements.slice(0, 3).map((req, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs font-normal">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Member Avatars */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex -space-x-2">
                          {members.slice(0, 4).map((member) => (
                            <Avatar key={member.id} className="w-7 h-7 border-2 border-background">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {members.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">+{members.length - 4}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeam(team.id)
                            setIsAddMemberOpen(true)
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredTeams.map((team) => {
                    const IconComponent = teamIcons[team.icon] || Users
                    const members = getTeamMembers(team.id)
                    const progress = getTeamProgress(team.id)
                    const leader = users.find((u) => u.id === team.leaderId)

                    return (
                      <div
                        key={team.id}
                        className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${team.color}20` }}>
                            <IconComponent className="w-5 h-5" style={{ color: team.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-sm text-muted-foreground">{team.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-semibold">{members.length}</p>
                            <p className="text-xs text-muted-foreground">Members</p>
                          </div>
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="text-sm">
                            {leader ? (
                              <span className="text-muted-foreground">
                                Lead: <span className="text-foreground">{leader.name}</span>
                              </span>
                            ) : (
                              <Badge variant="secondary">No Leader</Badge>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTeam(team.id)}>
                            View
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Team Members Dialog */}
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{teams.find((t) => t.id === selectedTeam)?.name} Team Members</DialogTitle>
              <DialogDescription>Manage team members and their assignments</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {selectedTeam &&
                getTeamMembers(selectedTeam).map((member) => {
                  const memberProgress = trainingProgress.filter((p) => p.oderId === member.id)
                  const completed = memberProgress.filter((p) => p.completed).length
                  const progressPercent =
                    memberProgress.length > 0 ? Math.round((completed / memberProgress.length) * 100) : 0

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{progressPercent}%</p>
                          <p className="text-xs text-muted-foreground">Training</p>
                        </div>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              {selectedTeam && getTeamMembers(selectedTeam).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No members in this team</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTeam(null)}>
                Close
              </Button>
              <Button onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Assign a volunteer to {teams.find((t) => t.id === selectedTeam)?.name || "a team"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {unassignedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>All volunteers are assigned to teams</p>
                </div>
              ) : (
                unassignedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => selectedTeam && handleAssignMember(user.id, selectedTeam)}>
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
