"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import type { ServiceSchedule, ScheduleAssignment } from "@/lib/data"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Users, X, Pencil } from "lucide-react"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatTime(time?: string) {
  if (!time || time === "00:00") return null
  const [h, m] = time.split(":").map(Number)
  return new Date(0, 0, 0, h, m).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { serviceSchedules, teams, users, addServiceSchedule, updateServiceSchedule } = useData()

  const [currentDate, setCurrentDate] = useState(new Date())

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    date: "", time: "", service: "",
    assignments: [] as ScheduleAssignment[],
  })
  const [selectedVolunteer, setSelectedVolunteer] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedRole, setSelectedRole] = useState("")

  // Detail / edit dialog state
  const [detailSchedule, setDetailSchedule] = useState<ServiceSchedule | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFields, setEditFields] = useState({ service: "", date: "", time: "" })
  const [editAssignments, setEditAssignments] = useState<ScheduleAssignment[]>([])
  const [addVolunteer, setAddVolunteer] = useState("")
  const [addTeam, setAddTeam] = useState("")
  const [addRole, setAddRole] = useState("")

  const canCreate = user?.role === "admin" || user?.role === "leader"

  const availableTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.team_id)

  const availableVolunteers = users.filter((u) => {
    if (user?.role === "admin") return u.role === "volunteer" || u.role === "leader"
    if (user?.role === "leader") return u.role === "volunteer" && u.teamId === user.team_id
    return false
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate)

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return filteredSchedules.filter((s) => s.date === dateStr)
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  // ── Create helpers ──────────────────────────────────────────────────────────

  const handleAddAssignment = () => {
    if (!selectedVolunteer || !selectedRole) return
    const teamId = user?.role === "leader" && user.team_id ? user.team_id : selectedTeam
    if (!teamId) return
    setNewSchedule({
      ...newSchedule,
      assignments: [...newSchedule.assignments, { id: "", userId: selectedVolunteer, teamId, role: selectedRole, status: "assigned" }],
    })
    setSelectedVolunteer("")
    setSelectedRole("")
    if (user?.role === "admin") setSelectedTeam("")
  }

  const handleCreate = () => {
    if (!newSchedule.date || !newSchedule.service) return
    addServiceSchedule({
      date: newSchedule.date,
      time: newSchedule.time || undefined,
      service: newSchedule.service,
      assignments: newSchedule.assignments,
    })
    setNewSchedule({ date: "", time: "", service: "", assignments: [] })
    setIsCreateOpen(false)
  }

  const handleOpenCreate = () => {
    if (user?.role === "leader" && user.team_id) setSelectedTeam(user.team_id)
    setIsCreateOpen(true)
  }

  // ── Detail / edit helpers ───────────────────────────────────────────────────

  const openDetail = (schedule: ServiceSchedule) => {
    setDetailSchedule(schedule)
    setEditFields({ service: schedule.service, date: schedule.date, time: schedule.time ?? "" })
    setEditAssignments([...schedule.assignments])
    setIsEditing(false)
    setAddVolunteer("")
    setAddTeam("")
    setAddRole("")
    setIsDetailOpen(true)
  }

  const handleAddEditAssignment = () => {
    if (!addVolunteer || !addRole) return
    const teamId = user?.role === "leader" && user.team_id ? user.team_id : addTeam
    if (!teamId) return
    setEditAssignments((prev) => [...prev, { id: "", userId: addVolunteer, teamId, role: addRole, status: "assigned" }])
    setAddVolunteer("")
    setAddRole("")
    if (user?.role === "admin") setAddTeam("")
  }

  const handleSaveEdit = () => {
    if (!detailSchedule) return
    updateServiceSchedule(detailSchedule.id, {
      service: editFields.service,
      date: editFields.date,
      time: editFields.time || undefined,
      assignments: editAssignments,
    })
    setIsEditing(false)
    setIsDetailOpen(false)
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || teamId
  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name || "Unknown"

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filteredSchedules = serviceSchedules.filter((s) => {
    if (user?.role === "admin") return true
    if (user?.role === "leader") return s.assignments.some((a) => a.teamId === user.team_id)
    if (user?.role === "volunteer") return s.assignments.some((a) => a.userId === user.id)
    return false
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingSchedules = filteredSchedules
    .filter((s) => {
      const [year, month, day] = s.date.split("-").map(Number)
      return new Date(year, month - 1, day) >= today
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header title="Service Schedule" subtitle="Manage volunteer assignments for services" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">{upcomingSchedules.length} upcoming service(s)</p>
          {canCreate && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Schedule</DialogTitle>
                  <DialogDescription>
                    {user?.role === "leader"
                      ? `Add a service schedule for ${getTeamName(user.team_id || "")} team`
                      : "Add a new service schedule"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="service">Service Name</Label>
                    <Input
                      id="service"
                      value={newSchedule.service}
                      onChange={(e) => setNewSchedule({ ...newSchedule, service: e.target.value })}
                      placeholder="e.g., Sunday Morning Service"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newSchedule.date}
                        onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Volunteer Assignments */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label>Assign Volunteers</Label>
                    <div className="flex gap-2">
                      <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select Volunteer" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVolunteers.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">No volunteers available</div>
                          ) : (
                            availableVolunteers.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {user?.role === "admin" && (
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Input
                        placeholder="Role"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-28"
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleAddAssignment}
                        disabled={!selectedVolunteer || !selectedRole || (user?.role === "admin" && !selectedTeam)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {user?.role === "leader" && user.team_id && (
                      <p className="text-xs text-muted-foreground">
                        Assigning to: <span className="font-medium">{getTeamName(user.team_id)}</span> team
                      </p>
                    )}

                    {newSchedule.assignments.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {newSchedule.assignments.map((a, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                            <span>{getUserName(a.userId)} — {getTeamName(a.teamId)} ({a.role})</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                setNewSchedule({
                                  ...newSchedule,
                                  assignments: newSchedule.assignments.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newSchedule.date || !newSchedule.service}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Detail / Edit Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => { setIsDetailOpen(open); if (!open) setIsEditing(false) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle>
                    {isEditing ? "Edit Schedule" : detailSchedule?.service}
                  </DialogTitle>
                  <DialogDescription>
                    {!isEditing && detailSchedule && (
                      <>
                        {formatDate(detailSchedule.date)}
                        {formatTime(detailSchedule.time) && ` · ${formatTime(detailSchedule.time)}`}
                      </>
                    )}
                  </DialogDescription>
                </div>
                {canCreate && !isEditing && (
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Edit fields */}
              {isEditing && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={editFields.service}
                      onChange={(e) => setEditFields({ ...editFields, service: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editFields.date}
                        onChange={(e) => setEditFields({ ...editFields, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={editFields.time}
                        onChange={(e) => setEditFields({ ...editFields, time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Assignments list */}
              <div className="space-y-2">
                <Label>{isEditing ? "Assigned Volunteers" : "Volunteers"}</Label>
                {editAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No volunteers assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {editAssignments.map((a, idx) => {
                      const statusVariant = a.status === "confirmed"
                        ? "bg-green-500/10 text-green-600 border-green-200"
                        : a.status === "declined"
                          ? "bg-red-500/10 text-red-600 border-red-200"
                          : "bg-amber-500/10 text-amber-600 border-amber-200"
                      const statusLabel = a.status === "confirmed" ? "Confirmed"
                        : a.status === "declined" ? "Declined"
                          : "Pending"
                      return (
                        <div key={idx} className="rounded bg-muted text-sm overflow-hidden">
                          <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{getUserName(a.userId)}</span>
                              <span className="text-muted-foreground">— {getTeamName(a.teamId)}</span>
                              <Badge variant="outline" className="text-xs">{a.role}</Badge>
                              {!isEditing && (
                                <Badge variant="outline" className={`text-xs ${statusVariant}`}>{statusLabel}</Badge>
                              )}
                            </div>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => setEditAssignments((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {!isEditing && a.status === "declined" && a.rejectionReason && (
                            <div className="px-3 pb-2 text-xs text-red-600 bg-red-500/5 border-t border-red-100">
                              <span className="font-medium">Reason: </span>{a.rejectionReason}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Add volunteer row (edit mode only) */}
              {isEditing && canCreate && (
                <div className="space-y-2 pt-1 border-t">
                  <Label>Add Volunteer</Label>
                  <div className="flex gap-2">
                    <Select value={addVolunteer} onValueChange={setAddVolunteer}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Volunteer" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVolunteers.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {user?.role === "admin" && (
                      <Select value={addTeam} onValueChange={setAddTeam}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Input
                      placeholder="Role"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      className="w-28"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleAddEditAssignment}
                      disabled={!addVolunteer || !addRole || (user?.role === "admin" && !addTeam)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {user?.role === "leader" && user.team_id && (
                    <p className="text-xs text-muted-foreground">
                      Assigning to: <span className="font-medium">{getTeamName(user.team_id)}</span> team
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveEdit} disabled={!editFields.date || !editFields.service}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const daySchedules = getSchedulesForDay(day)
                  const isToday =
                    new Date().toDateString() ===
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
                  return (
                    <div
                      key={day}
                      className={`min-h-20 rounded-lg border p-1 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</div>
                      <div className="space-y-1 mt-1">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <button
                            key={schedule.id}
                            onClick={() => openDetail(schedule)}
                            className="w-full text-left rounded bg-primary/10 px-1 py-0.5 text-xs text-primary hover:bg-primary/20 transition-colors"
                          >
                            <div className="truncate">{schedule.service}</div>
                            {formatTime(schedule.time) && (
                              <div className="text-primary/70">{formatTime(schedule.time)}</div>
                            )}
                          </button>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{daySchedules.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Services */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Services</CardTitle>
                <CardDescription>Your next scheduled assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming schedules</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSchedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => openDetail(schedule)}
                        className="w-full text-left flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0 hover:opacity-80 transition-opacity"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{schedule.service}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(schedule.date)}
                            {formatTime(schedule.time) && ` · ${formatTime(schedule.time)}`}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Users className="h-3 w-3" />
                            {schedule.assignments.length} volunteer(s)
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {schedule.assignments.slice(0, 2).map((a, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {getUserName(a.userId)}
                              </Badge>
                            ))}
                            {schedule.assignments.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{schedule.assignments.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
