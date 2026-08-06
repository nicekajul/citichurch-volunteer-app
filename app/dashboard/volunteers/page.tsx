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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Calendar, CheckCircle, Clock, UserCheck, MoreVertical, Eye, Users, Crown, MailWarning } from "lucide-react"
import { VolunteerBadges } from "@/components/volunteer-badges"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function VolunteersPage() {
  const { user } = useAuth()
  const { users, teams, trainingProgress, trainingVideos, updateUser, addUser, assignUserToTeam, assignTeamLeader, approveProgress } = useData()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterTeam, setFilterTeam] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null)

  // Team assignment dialog state
  const [assignTeamVolunteer, setAssignTeamVolunteer] = useState<{ id: string; name: string; currentTeamId?: string } | null>(null)
  const [assignTeamId, setAssignTeamId] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  // Make Team Leader dialog state
  const [makeLeaderVolunteer, setMakeLeaderVolunteer] = useState<{ id: string; name: string; teamId: string } | null>(null)
  const [isMakingLeader, setIsMakingLeader] = useState(false)
  const [makeLeaderError, setMakeLeaderError] = useState<string | null>(null)

  const [newVolunteer, setNewVolunteer] = useState({
    name: "",
    email: "",
    phone: "",
    teamId: "",
    username: "",
    password: "",
  })

  // Show both volunteers and team leaders (leaders are still ministry members that need visibility)
  let volunteers = users.filter((u) => u.role === "volunteer" || u.role === "leader")

  if (user?.role === "leader") {
    volunteers = volunteers.filter((v) => v.teamId === user.team_id)
  }

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeam = filterTeam === "all" || v.teamId === filterTeam
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "unconfirmed" && !v.emailConfirmed) ||
      (filterStatus !== "unconfirmed" && v.emailConfirmed && v.status === filterStatus)
    return matchesSearch && matchesTeam && matchesStatus
  })

  const getVolunteerProgress = (volunteerId: string) => {
    const progress = trainingProgress.filter((p) => p.userId === volunteerId)
    const completed = progress.filter((p) => p.completed).length
    const total = trainingVideos.filter(
      (v) => !v.teamId || v.teamId === users.find((u) => u.id === volunteerId)?.teamId,
    ).length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getPendingApprovals = (volunteerId: string) => {
    return trainingProgress.filter((p) => p.userId === volunteerId && p.completed && !p.approvedBy)
  }

  const handleAddVolunteer = () => {
    addUser({
      username: newVolunteer.username,
      password: newVolunteer.password,
      name: newVolunteer.name,
      email: newVolunteer.email,
      role: "volunteer",
      teamId: newVolunteer.teamId || undefined,
      phone: newVolunteer.phone,
      joinDate: new Date().toISOString().split("T")[0],
      status: "pending",
    })
    setNewVolunteer({ name: "", email: "", phone: "", teamId: "", username: "", password: "" })
    setIsAddVolunteerOpen(false)
  }

  const handleApproveAll = (volunteerId: string) => {
    const pending = getPendingApprovals(volunteerId)
    pending.forEach((p) => {
      approveProgress(p.id, user?.id || "")
    })
  }

  const handleActivateVolunteer = (volunteerId: string) => {
    updateUser(volunteerId, { status: "active" })
  }

  const openAssignTeam = (v: { id: string; name: string; teamId?: string }) => {
    setAssignTeamVolunteer({ id: v.id, name: v.name, currentTeamId: v.teamId })
    setAssignTeamId(v.teamId || "")
    setAssignError(null)
  }

  const handleAssignTeam = async () => {
    if (!assignTeamVolunteer) return
    setIsAssigning(true)
    setAssignError(null)
    try {
      await assignUserToTeam(assignTeamVolunteer.id, assignTeamId)
      setAssignTeamVolunteer(null)
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : "Failed to assign team. Check your permissions.")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleMakeLeader = async () => {
    if (!makeLeaderVolunteer) return
    setIsMakingLeader(true)
    setMakeLeaderError(null)
    try {
      await assignTeamLeader(makeLeaderVolunteer.id, makeLeaderVolunteer.teamId)
      setMakeLeaderVolunteer(null)
    } catch (e) {
      setMakeLeaderError(e instanceof Error ? e.message : "Failed to assign team leader.")
    } finally {
      setIsMakingLeader(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Volunteers" subtitle={user?.role === "admin" ? "Manage all volunteers" : "Your team members"} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{volunteers.filter((v) => v.status === "active").length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {volunteers.filter((v) => v.emailConfirmed && v.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Activation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <MailWarning className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {volunteers.filter((v) => !v.emailConfirmed).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Confirmation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{volunteers.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search volunteers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {user?.role === "admin" && (
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-40">
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
            )}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Activation</SelectItem>
                <SelectItem value="unconfirmed">Pending Confirmation</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user?.role === "admin" && (
            <Dialog open={isAddVolunteerOpen} onOpenChange={setIsAddVolunteerOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Volunteer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Volunteer</DialogTitle>
                  <DialogDescription>Create a new volunteer account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={newVolunteer.name}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={newVolunteer.username}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, username: e.target.value })}
                        placeholder="johndoe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newVolunteer.email}
                      onChange={(e) => setNewVolunteer({ ...newVolunteer, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newVolunteer.phone}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newVolunteer.password}
                        onChange={(e) => setNewVolunteer({ ...newVolunteer, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign to Team</Label>
                    <Select
                      value={newVolunteer.teamId}
                      onValueChange={(v) => setNewVolunteer({ ...newVolunteer, teamId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddVolunteerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddVolunteer}
                    disabled={!newVolunteer.name || !newVolunteer.username || !newVolunteer.password}
                  >
                    Add Volunteer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Assign Team Dialog */}
        <Dialog open={!!assignTeamVolunteer} onOpenChange={(open) => { if (!open) setAssignTeamVolunteer(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Assign to Team</DialogTitle>
              <DialogDescription>
                Choose a team for <span className="font-medium text-foreground">{assignTeamVolunteer?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.color || "#3b82f6" }}
                        />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignTeamId && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: (teams.find((t) => t.id === assignTeamId)?.color || "#3b82f6") + "22",
                    color: teams.find((t) => t.id === assignTeamId)?.color || "#3b82f6",
                    border: `1px solid ${(teams.find((t) => t.id === assignTeamId)?.color || "#3b82f6")}44`,
                  }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: teams.find((t) => t.id === assignTeamId)?.color || "#3b82f6" }}
                  />
                  {teams.find((t) => t.id === assignTeamId)?.name}
                </div>
              )}
            </div>
            {assignError && (
              <p className="text-sm text-destructive px-1 -mt-2">{assignError}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignTeamVolunteer(null)} className="dark:hover:bg-muted">
                Cancel
              </Button>
              <Button onClick={handleAssignTeam} disabled={!assignTeamId || isAssigning}>
                {isAssigning ? "Saving..." : "Assign Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Make Team Leader Dialog */}
        <Dialog open={!!makeLeaderVolunteer} onOpenChange={(open) => { if (!open) setMakeLeaderVolunteer(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Appoint Team Leader
              </DialogTitle>
              <DialogDescription>
                This will promote{" "}
                <span className="font-medium text-foreground">{makeLeaderVolunteer?.name}</span> to Team Leader
                for{" "}
                <span className="font-medium text-foreground">
                  {teams.find((t) => t.id === makeLeaderVolunteer?.teamId)?.name}
                </span>
                . They will receive a notification and gain leader permissions.
              </DialogDescription>
            </DialogHeader>
            {makeLeaderError && (
              <p className="text-sm text-destructive px-1">{makeLeaderError}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setMakeLeaderVolunteer(null)} className="dark:hover:bg-muted">
                Cancel
              </Button>
              <Button
                onClick={handleMakeLeader}
                disabled={isMakingLeader}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isMakingLeader ? "Appointing..." : "Appoint as Leader"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Volunteers Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => {
                  const team = teams.find((t) => t.id === volunteer.teamId)
                  const progress = getVolunteerProgress(volunteer.id)
                  const pendingApprovals = getPendingApprovals(volunteer.id)

                  return (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={volunteer.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {volunteer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{volunteer.name.split(" ")[0]}</p>
                              {volunteer.role === "leader" && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/20 gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> Leader
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{volunteer.email}</p>
                            <div className="mt-1.5">
                              <VolunteerBadges userId={volunteer.id} />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {team ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: (team.color || "#3b82f6") + "22",
                              color: team.color || "#3b82f6",
                              border: `1px solid ${(team.color || "#3b82f6")}44`,
                            }}
                          >
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: team.color || "#3b82f6" }}
                            />
                            {team.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              {progress.completed}/{progress.total}
                            </span>
                            <span className="font-medium">{progress.percentage}%</span>
                          </div>
                          <Progress value={progress.percentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {!volunteer.emailConfirmed ? (
                          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1">
                            <MailWarning className="w-3 h-3" />
                            Pending Confirmation
                          </Badge>
                        ) : volunteer.status === "active" ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                          </Badge>
                        ) : volunteer.status === "pending" ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Pending Activation
                          </Badge>
                        ) : (
                          <Badge variant="outline">{volunteer.status}</Badge>
                        )}
                        {pendingApprovals.length > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-blue-500/10 text-blue-600">
                            {pendingApprovals.length} to approve
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(volunteer.joinDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/volunteers/${volunteer.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            {user?.role === "admin" && (
                              <DropdownMenuItem onClick={() => openAssignTeam(volunteer)}>
                                <Users className="w-4 h-4 mr-2" />
                                {volunteer.teamId ? "Change Team" : "Assign to Team"}
                              </DropdownMenuItem>
                            )}
                            {user?.role === "admin" && volunteer.role === "volunteer" && volunteer.teamId && (
                              <DropdownMenuItem
                                onClick={() => setMakeLeaderVolunteer({ id: volunteer.id, name: volunteer.name, teamId: volunteer.teamId! })}
                                className="text-amber-600 focus:text-amber-600"
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Make Team Leader
                              </DropdownMenuItem>
                            )}
                            {pendingApprovals.length > 0 && (
                              <DropdownMenuItem onClick={() => handleApproveAll(volunteer.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve All Training
                              </DropdownMenuItem>
                            )}
                            {volunteer.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleActivateVolunteer(volunteer.id)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate Volunteer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {filteredVolunteers.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No volunteers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
