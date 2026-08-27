"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import type { ServiceSchedule, ScheduleAssignment } from "@/lib/data"
import { Header } from "@/components/dashboard/header"
import { VolunteerBadges } from "@/components/volunteer-badges"
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
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Users, X, Pencil, CheckCircle2, XCircle, History, MapPin, ThumbsUp, ThumbsDown } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

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

// Small dot showing a volunteer's self-reported availability for a specific
// schedule date. Advisory only — absence of a dot just means they haven't set one.
function AvailabilityMark({ status }: { status?: "available" | "unavailable" }) {
  if (!status) return null
  return (
    <span
      title={status === "available" ? "Marked available for this date" : "Marked unavailable for this date"}
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
        status === "available" ? "bg-green-500" : "bg-red-500"
      }`}
    />
  )
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { serviceSchedules, teams, users, addServiceSchedule, updateServiceSchedule, respondToSchedule, getAvailabilityForDate, hasTeamPermission } = useData()

  // A volunteer delegated the "schedule" permission manages the roster the
  // same way a leader does — locked to their own team, same create/edit access.
  const isDelegatedScheduler = user?.role === "volunteer" && hasTeamPermission(user.id, "schedule")
  const isTeamScopedManager = user?.role === "leader" || isDelegatedScheduler

  const [currentDate, setCurrentDate] = useState(new Date())

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    date: "", time: "", service: "", location: "",
    assignments: [] as ScheduleAssignment[],
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedVolunteer, setSelectedVolunteer] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedRole, setSelectedRole] = useState("")

  // Detail / edit dialog state
  const [detailSchedule, setDetailSchedule] = useState<ServiceSchedule | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFields, setEditFields] = useState({ service: "", date: "", time: "", location: "" })
  const [editAssignments, setEditAssignments] = useState<ScheduleAssignment[]>([])
  const [addVolunteer, setAddVolunteer] = useState("")
  const [addTeam, setAddTeam] = useState("")
  const [addRole, setAddRole] = useState("")

  // Accept / decline state
  const [isDeclining, setIsDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)

  const canCreate = user?.role === "admin" || isTeamScopedManager

  const availableTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.team_id)

  // Volunteers filtered by the currently-selected team in the create form
  // Note: User objects from useData() use camelCase `teamId`, not snake_case `team_id`
  const volunteersForSelectedTeam = users.filter((u) => {
    const teamId = isTeamScopedManager ? user.team_id : selectedTeam
    if (!teamId) return false
    return (u.role === "volunteer" || u.role === "leader") && u.teamId === teamId
  })

  // Volunteers filtered by the currently-selected team in the edit form
  const volunteersForAddTeam = users.filter((u) => {
    const teamId = isTeamScopedManager ? user.team_id : addTeam
    if (!teamId) return false
    return (u.role === "volunteer" || u.role === "leader") && u.teamId === teamId
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
    const teamId = isTeamScopedManager && user.team_id ? user.team_id : selectedTeam
    if (!teamId) return
    if (newSchedule.assignments.some((a) => a.userId === selectedVolunteer)) return
    setNewSchedule({
      ...newSchedule,
      assignments: [...newSchedule.assignments, { id: "", userId: selectedVolunteer, teamId, role: selectedRole, status: "assigned" }],
    })
    // Keep team selected so more volunteers can be added from the same team
    setSelectedVolunteer("")
    setSelectedRole("")
  }

  const handleCreate = async () => {
    if (!newSchedule.date || !newSchedule.service) return
    setCreateError(null)
    try {
      await addServiceSchedule({
        date: newSchedule.date,
        time: newSchedule.time || undefined,
        service: newSchedule.service,
        location: newSchedule.location || undefined,
        assignments: newSchedule.assignments,
      })
      setNewSchedule({ date: "", time: "", service: "", location: "", assignments: [] })
      setIsCreateOpen(false)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create schedule")
    }
  }

  const handleOpenCreate = () => {
    setNewSchedule({ date: "", time: "", service: "", location: "", assignments: [] })
    setCreateError(null)
    setSelectedTeam(isTeamScopedManager && user.team_id ? user.team_id : "")
    setSelectedVolunteer("")
    setSelectedRole("")
    setIsCreateOpen(true)
  }

  // ── Detail / edit helpers ───────────────────────────────────────────────────

  const openDetail = (schedule: ServiceSchedule) => {
    setDetailSchedule(schedule)
    setEditFields({ service: schedule.service, date: schedule.date, time: schedule.time ?? "", location: schedule.location ?? "" })
    setEditAssignments([...schedule.assignments])
    setIsEditing(false)
    setAddVolunteer("")
    setAddTeam("")
    setAddRole("")
    setIsDeclining(false)
    setDeclineReason("")
    setIsDetailOpen(true)
  }

  const handleAddEditAssignment = () => {
    if (!addVolunteer || !addRole) return
    const teamId = isTeamScopedManager && user.team_id ? user.team_id : addTeam
    if (!teamId) return
    if (editAssignments.some((a) => a.userId === addVolunteer)) return
    setEditAssignments((prev) => [...prev, { id: "", userId: addVolunteer, teamId, role: addRole, status: "assigned" }])
    // Keep team so more from same team can be added quickly
    setAddVolunteer("")
    setAddRole("")
  }

  const handleSaveEdit = async () => {
    if (!detailSchedule) return
    await updateServiceSchedule(detailSchedule.id, {
      service: editFields.service,
      date: editFields.date,
      time: editFields.time || undefined,
      location: editFields.location || undefined,
      assignments: editAssignments,
    })
    setIsEditing(false)
    setIsDetailOpen(false)
  }

  const handleRespond = async (response: "confirmed" | "declined", reason?: string) => {
    if (!detailSchedule || !user) return
    setIsSubmittingResponse(true)
    try {
      await respondToSchedule(detailSchedule.id, response, reason)
      // Optimistically update the displayed roster so the dialog reflects the change
      setEditAssignments((prev) =>
        prev.map((a) =>
          a.userId === user.id
            ? { ...a, status: response, rejectionReason: response === "declined" ? reason : undefined }
            : a
        )
      )
      setIsDeclining(false)
      setDeclineReason("")
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || teamId
  const getTeamColor = (teamId: string) => teams.find((t) => t.id === teamId)?.color || "#3b82f6"
  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name?.split(" ")[0] || "Unknown"

  // Returns the primary team for a schedule (first assignment's team — schedules are per-team)
  const getScheduleTeamId = (schedule: ServiceSchedule) => schedule.assignments[0]?.teamId || ""

  // ── Filtering ───────────────────────────────────────────────────────────────

  // Volunteers see ALL schedules for their team so they know who they serve with
  const filteredSchedules = serviceSchedules.filter((s) => {
    if (user?.role === "admin") return true
    if (isTeamScopedManager) return s.assignments.some((a) => a.teamId === user.team_id)
    if (user?.role === "volunteer") {
      if (user.team_id) return s.assignments.some((a) => a.teamId === user.team_id)
      return s.assignments.some((a) => a.userId === user.id)
    }
    return false
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  const upcomingSchedules = filteredSchedules
    .filter((s) => parseDate(s.date) >= today)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .slice(0, 5)

  const pastSchedules = filteredSchedules
    .filter((s) => parseDate(s.date) < today)
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
    .slice(0, 10)

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
              <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
                <DialogHeader className="shrink-0">
                  <DialogTitle>Create Schedule</DialogTitle>
                  <DialogDescription>
                    {isTeamScopedManager
                      ? `Add a service schedule for ${getTeamName(user.team_id || "")} team`
                      : "Add a new service schedule"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto min-h-0 flex-1 pr-1">
                  {/* Team selector — admin picks team first; locks all assignments to this team */}
                  {user?.role === "admin" && (
                    <div className="space-y-2">
                      <Label htmlFor="create-team">Team</Label>
                      <Select
                        value={selectedTeam}
                        onValueChange={(v) => {
                          setSelectedTeam(v)
                          setSelectedVolunteer("")
                          setNewSchedule((prev) => ({ ...prev, assignments: [] }))
                        }}
                      >
                        <SelectTrigger id="create-team">
                          <SelectValue placeholder="Select a team for this schedule..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeams.map((t) => (
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
                      {selectedTeam && (
                        <div
                          className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md w-fit"
                          style={{
                            backgroundColor: getTeamColor(selectedTeam) + "22",
                            color: getTeamColor(selectedTeam),
                            border: `1px solid ${getTeamColor(selectedTeam)}44`,
                          }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: getTeamColor(selectedTeam) }}
                          />
                          {getTeamName(selectedTeam)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leader: show their team as a read-only badge */}
                  {isTeamScopedManager && user.team_id && (
                    <div className="flex items-center gap-2">
                      <Label>Team</Label>
                      <div
                        className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md"
                        style={{
                          backgroundColor: getTeamColor(user.team_id) + "22",
                          color: getTeamColor(user.team_id),
                          border: `1px solid ${getTeamColor(user.team_id)}44`,
                        }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: getTeamColor(user.team_id) }}
                        />
                        {getTeamName(user.team_id)}
                      </div>
                    </div>
                  )}

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
                        className="dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                        className="dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Venue / Location</Label>
                    <Input
                      id="location"
                      value={newSchedule.location}
                      onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                      placeholder="e.g., Main Sanctuary, Hall B"
                    />
                  </div>

                  {/* Volunteer Assignments — only shown once a team is selected */}
                  {(selectedTeam || isTeamScopedManager) && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label>Assign Volunteers</Label>
                        {newSchedule.assignments.length > 0 && (
                          <span className="text-xs text-muted-foreground">{newSchedule.assignments.length} assigned</span>
                        )}
                      </div>

                      {/* Already-added roster */}
                      {newSchedule.assignments.length > 0 && (
                        <div className="rounded-lg border bg-muted/20 divide-y divide-border overflow-hidden">
                          {newSchedule.assignments.map((a, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{getUserName(a.userId)}</span>
                                <VolunteerBadges userId={a.userId} size="sm" />
                                <AvailabilityMark status={getAvailabilityForDate(a.userId, newSchedule.date)?.status} />
                              </div>
                              <Badge variant="secondary" className="text-xs shrink-0">{a.role}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

                      {/* Add volunteer form */}
                      <div className="rounded-lg border border-dashed p-3 space-y-3 bg-muted/10">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Volunteer</p>
                            <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent>
                                {volunteersForSelectedTeam.length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground">No members in this team</div>
                                ) : (
                                  volunteersForSelectedTeam
                                    .filter((v) => !newSchedule.assignments.some((a) => a.userId === v.id))
                                    .map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{v.name.split(" ")[0]}</span>
                                          <VolunteerBadges userId={v.id} variant="dots" tooltip={false} />
                                          <AvailabilityMark status={getAvailabilityForDate(v.id, newSchedule.date)?.status} />
                                        </div>
                                      </SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                            <Input
                              placeholder="e.g., Camera, Sound"
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={handleAddAssignment}
                          disabled={!selectedVolunteer || !selectedRole}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Roster
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Prompt admin to pick a team first */}
                  {user?.role === "admin" && !selectedTeam && (
                    <p className="text-xs text-center text-muted-foreground py-1 border-t pt-3">
                      Select a team above to assign volunteers
                    </p>
                  )}
                </div>
                {createError && (
                  <p className="text-sm text-destructive shrink-0 px-1">{createError}</p>
                )}
                <DialogFooter className="shrink-0 border-t pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="dark:hover:bg-muted dark:hover:text-foreground">Cancel</Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      !newSchedule.date ||
                      !newSchedule.service ||
                      (user?.role === "admin" && !selectedTeam)
                    }
                  >
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
              {/* View mode: location */}
              {!isEditing && detailSchedule?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{detailSchedule.location}</span>
                </div>
              )}

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
                        className="dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={editFields.time}
                        onChange={(e) => setEditFields({ ...editFields, time: e.target.value })}
                        className="dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Venue / Location</Label>
                    <Input
                      value={editFields.location}
                      onChange={(e) => setEditFields({ ...editFields, location: e.target.value })}
                      placeholder="e.g., Main Sanctuary, Hall B"
                    />
                  </div>
                </div>
              )}

              {/* My response card — shown to assigned volunteers in view mode */}
              {!isEditing && (() => {
                const myAssignment = editAssignments.find((a) => a.userId === user?.id)
                if (!myAssignment) return null
                const isConfirmed = myAssignment.status === "confirmed"
                const isDeclined = myAssignment.status === "declined"
                const isPending = myAssignment.status === "assigned"

                return (
                  <div className={`rounded-lg border p-3 space-y-3 ${
                    isConfirmed ? "border-green-200 bg-green-500/5"
                    : isDeclined ? "border-red-200 bg-red-500/5"
                    : "border-amber-200 bg-amber-500/5"
                  }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Your Attendance</p>
                      {isConfirmed && (
                        <Badge className="bg-green-500/10 text-green-700 border-green-200 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge className="bg-red-500/10 text-red-700 border-red-200 dark:text-red-400">
                          <XCircle className="h-3 w-3 mr-1" /> Declined
                        </Badge>
                      )}
                      {isPending && (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400">
                          Awaiting response
                        </Badge>
                      )}
                    </div>

                    {/* Already declined — show reason */}
                    {isDeclined && myAssignment.rejectionReason && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Your reason:</span> {myAssignment.rejectionReason}
                      </p>
                    )}

                    {/* Pending — show action buttons */}
                    {isPending && !isDeclining && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={isSubmittingResponse}
                          onClick={() => handleRespond("confirmed")}
                        >
                          <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          disabled={isSubmittingResponse}
                          onClick={() => setIsDeclining(true)}
                        >
                          <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {/* Decline reason form */}
                    {isPending && isDeclining && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Reason for declining <span className="text-red-500">*</span></Label>
                        <Textarea
                          placeholder="Let your team leader know why you can't make it..."
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          rows={3}
                          className="resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 dark:hover:bg-muted"
                            onClick={() => { setIsDeclining(false); setDeclineReason("") }}
                          >
                            Back
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            disabled={!declineReason.trim() || isSubmittingResponse}
                            onClick={() => handleRespond("declined", declineReason.trim())}
                          >
                            Submit Decline
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Allow changing a confirmed response back to pending is intentionally omitted */}
                    {isConfirmed && (
                      <p className="text-xs text-muted-foreground">
                        Need to change your response? Contact your team leader.
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Assignments list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isEditing ? "Assigned Volunteers" : "Full Roster"}</Label>
                  {!isEditing && (
                    <span className="text-xs text-muted-foreground">{editAssignments.length} volunteer(s)</span>
                  )}
                </div>
                {editAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No volunteers assigned.</p>
                ) : (
                  (() => {
                    const active   = editAssignments.filter((a) => a.status !== "declined")
                    const declined = editAssignments.filter((a) => a.status === "declined")

                    const renderRow = (a: ScheduleAssignment, idx: number) => {
                      const isMe = a.userId === user?.id
                      const statusVariant = a.status === "confirmed"
                        ? "bg-green-500/10 text-green-600 border-green-200"
                        : "bg-amber-500/10 text-amber-600 border-amber-200"
                      const statusLabel = a.status === "confirmed" ? "Confirmed" : "Pending"
                      return (
                        <div
                          key={`${a.userId}-${idx}`}
                          className={`rounded text-sm overflow-hidden ${isMe ? "bg-primary/5 border border-primary/20" : "bg-muted"}`}
                        >
                          <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${isMe ? "text-primary" : ""}`}>
                                {getUserName(a.userId)}
                                {isMe && <span className="ml-1 text-xs font-normal">(You)</span>}
                              </span>
                              <VolunteerBadges userId={a.userId} variant="dots" />
                              <AvailabilityMark status={getAvailabilityForDate(a.userId, editFields.date)?.status} />
                              <span className="text-muted-foreground text-xs">— {getTeamName(a.teamId)}</span>
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
                                onClick={() => setEditAssignments((prev) => prev.filter((_, i) => i !== editAssignments.indexOf(a)))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-2">
                        {/* Active roster */}
                        {active.map((a, idx) => renderRow(a, idx))}

                        {/* Declined — separated */}
                        {declined.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 pt-1">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-400" />
                                Declined ({declined.length})
                              </span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                            {declined.map((a, idx) => (
                              <div
                                key={`declined-${a.userId}-${idx}`}
                                className="rounded text-sm overflow-hidden opacity-60 border border-red-200/50"
                              >
                                <div className="flex items-center justify-between p-2 bg-red-500/5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-muted-foreground">
                                      {getUserName(a.userId)}
                                      {a.userId === user?.id && <span className="ml-1 text-xs font-normal">(You)</span>}
                                    </span>
                                    <VolunteerBadges userId={a.userId} variant="dots" />
                                    <AvailabilityMark status={getAvailabilityForDate(a.userId, editFields.date)?.status} />
                                    <span className="text-muted-foreground text-xs">— {getTeamName(a.teamId)}</span>
                                    <Badge variant="outline" className="text-xs">{a.role}</Badge>
                                    {!isEditing && (
                                      <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-200">Declined</Badge>
                                    )}
                                  </div>
                                  {isEditing && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => setEditAssignments((prev) => prev.filter((x) => x !== a))}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                {!isEditing && a.rejectionReason && (
                                  <div className="px-3 pb-2 text-xs text-red-600 bg-red-500/5 border-t border-red-100">
                                    <span className="font-medium">Reason: </span>{a.rejectionReason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )
                  })()
                )}
              </div>

              {/* Add volunteer row (edit mode only) */}
              {isEditing && canCreate && (
                <div className="space-y-3 pt-1 border-t">
                  <Label>Add Volunteer</Label>
                  <div className="rounded-lg border border-dashed p-3 space-y-3 bg-muted/10">
                    {/* Team select (admin only) */}
                    {user?.role === "admin" && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1 · Select Team</p>
                        <Select
                          value={addTeam}
                          onValueChange={(v) => { setAddTeam(v); setAddVolunteer("") }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a team..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeams.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Volunteer + Role */}
                    {(addTeam || isTeamScopedManager) && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {user?.role === "admin" ? "2 · Volunteer" : "Volunteer"}
                            </p>
                            <Select value={addVolunteer} onValueChange={setAddVolunteer}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent>
                                {volunteersForAddTeam.length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground">No members in this team</div>
                                ) : (
                                  volunteersForAddTeam
                                    .filter((v) => !editAssignments.some((a) => a.userId === v.id))
                                    .map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{v.name.split(" ")[0]}</span>
                                          <VolunteerBadges userId={v.id} variant="dots" tooltip={false} />
                                          <AvailabilityMark status={getAvailabilityForDate(v.id, editFields.date)?.status} />
                                        </div>
                                      </SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {user?.role === "admin" ? "3 · Role" : "Role"}
                            </p>
                            <Input
                              placeholder="e.g., Camera, Sound"
                              value={addRole}
                              onChange={(e) => setAddRole(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={handleAddEditAssignment}
                          disabled={!addVolunteer || !addRole}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Roster
                        </Button>
                      </>
                    )}

                    {user?.role === "admin" && !addTeam && (
                      <p className="text-xs text-center text-muted-foreground py-1">
                        Select a team above to see its members
                      </p>
                    )}
                    {isTeamScopedManager && user.team_id && (
                      <p className="text-xs text-muted-foreground text-center">
                        Members from <span className="font-medium">{getTeamName(user.team_id)}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="dark:hover:bg-muted dark:hover:text-foreground">Cancel</Button>
                  <Button onClick={handleSaveEdit} disabled={!editFields.date || !editFields.service}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="dark:hover:bg-muted dark:hover:text-foreground">Close</Button>
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
              {/* Team color legend — show teams that have schedules this month */}
              {(() => {
                const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
                const teamsInMonth = Array.from(
                  new Set(
                    filteredSchedules
                      .filter((s) => s.date.startsWith(monthStr))
                      .map((s) => getScheduleTeamId(s))
                      .filter(Boolean)
                  )
                ).map((tid) => teams.find((t) => t.id === tid)).filter(Boolean)
                if (teamsInMonth.length === 0) return null
                return (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {teamsInMonth.map((t) => (
                      <div key={t!.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t!.color || "#3b82f6" }}
                        />
                        {t!.name}
                      </div>
                    ))}
                  </div>
                )
              })()}
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
                        {daySchedules.slice(0, 2).map((schedule) => {
                          const isPersonallyAssigned = user?.role !== "admin" &&
                            schedule.assignments.some((a) => a.userId === user?.id)
                          const teamId = getScheduleTeamId(schedule)
                          const color = getTeamColor(teamId)
                          return (
                            <button
                              key={schedule.id}
                              onClick={() => openDetail(schedule)}
                              className="w-full text-left rounded px-1 py-0.5 text-xs transition-colors hover:brightness-90"
                              style={
                                isPersonallyAssigned
                                  ? { backgroundColor: color, color: "#fff" }
                                  : { backgroundColor: color + "28", color, borderLeft: `2px solid ${color}` }
                              }
                            >
                              <div className="truncate font-medium">{schedule.service}</div>
                              {formatTime(schedule.time) && (
                                <div className="opacity-75">{formatTime(schedule.time)}</div>
                              )}
                            </button>
                          )
                        })}
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

          {/* Upcoming + Past Services */}
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Services</CardTitle>
                <CardDescription>
                  {user?.role === "volunteer" ? "Your team's upcoming schedule" : "Next scheduled services"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming schedules</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSchedules.map((schedule) => {
                      const myAssignment = user?.role !== "admin"
                        ? schedule.assignments.find((a) => a.userId === user?.id)
                        : null
                      const teamId = getScheduleTeamId(schedule)
                      const color = getTeamColor(teamId)
                      return (
                        <button
                          key={schedule.id}
                          onClick={() => openDetail(schedule)}
                          className="w-full text-left flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0 hover:opacity-80 transition-opacity"
                        >
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                            style={
                              myAssignment
                                ? { backgroundColor: color, color: "#fff" }
                                : { backgroundColor: color + "22", color }
                            }
                          >
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{schedule.service}</p>
                              {teamId && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded shrink-0 font-medium"
                                  style={{ backgroundColor: color + "22", color }}
                                >
                                  {getTeamName(teamId)}
                                </span>
                              )}
                              {myAssignment && (
                                <Badge
                                  className="text-xs shrink-0"
                                  style={{ backgroundColor: color + "22", color, borderColor: color + "44" }}
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(schedule.date)}
                              {formatTime(schedule.time) && ` · ${formatTime(schedule.time)}`}
                            </div>
                            {schedule.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {schedule.location}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Users className="h-3 w-3" />
                              {schedule.assignments.length} volunteer(s)
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {schedule.assignments.slice(0, 3).map((a, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                  style={a.userId === user?.id ? { borderColor: color, color } : {}}
                                >
                                  {getUserName(a.userId)}
                                </Badge>
                              ))}
                              {schedule.assignments.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{schedule.assignments.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Services */}
            {pastSchedules.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">Past Services</CardTitle>
                  </div>
                  <CardDescription>Previous service history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pastSchedules.map((schedule) => {
                      const myAssignment = user?.role !== "admin"
                        ? schedule.assignments.find((a) => a.userId === user?.id)
                        : null
                      const statusIcon = myAssignment?.status === "confirmed"
                        ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                        : myAssignment?.status === "declined"
                          ? <XCircle className="w-3 h-3 text-red-400" />
                          : null
                      const pastTeamId = getScheduleTeamId(schedule)
                      const pastColor = getTeamColor(pastTeamId)
                      return (
                        <button
                          key={schedule.id}
                          onClick={() => openDetail(schedule)}
                          className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors opacity-70 hover:opacity-100"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: pastColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {statusIcon}
                              <p className="text-sm font-medium truncate">{schedule.service}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(schedule.date)}
                              {formatTime(schedule.time) && ` · ${formatTime(schedule.time)}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            <Users className="w-3 h-3 mr-1" />
                            {schedule.assignments.length}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
