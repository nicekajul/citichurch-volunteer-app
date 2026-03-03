"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
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
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Users, X } from "lucide-react"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function SchedulePage() {
  const { user } = useAuth()
  const { serviceSchedules, teams, users, addServiceSchedule } = useData()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    date: "",
    service: "",
    assignments: [] as { oderId: string; teamId: string; role: string }[],
  })
  const [selectedVolunteer, setSelectedVolunteer] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedRole, setSelectedRole] = useState("")

  const canCreate = user?.role === "admin" || user?.role === "leader"

  const availableTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.teamId)

  const availableVolunteers = users.filter((u) => {
    if (user?.role === "admin") return u.role === "volunteer"
    if (user?.role === "leader") return u.role === "volunteer" && u.teamId === user.teamId
    return false
  })

  const getDefaultTeamId = () => {
    if (user?.role === "leader" && user.teamId) {
      return user.teamId
    }
    return ""
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate)

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return serviceSchedules.filter((s) => s.date === dateStr)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleAddAssignment = () => {
    if (!selectedVolunteer || !selectedRole) return

    const teamId = user?.role === "leader" && user.teamId ? user.teamId : selectedTeam
    if (!teamId) return

    setNewSchedule({
      ...newSchedule,
      assignments: [...newSchedule.assignments, { oderId: selectedVolunteer, teamId, role: selectedRole }],
    })
    setSelectedVolunteer("")
    setSelectedRole("")
    if (user?.role === "admin") {
      setSelectedTeam("")
    }
  }

  const handleCreate = () => {
    if (!newSchedule.date || !newSchedule.service) return
    addServiceSchedule({
      date: newSchedule.date,
      service: newSchedule.service,
      assignments: newSchedule.assignments,
    })
    setNewSchedule({ date: "", service: "", assignments: [] })
    setIsOpen(false)
  }

  const handleOpenDialog = () => {
    if (user?.role === "leader" && user.teamId) {
      setSelectedTeam(user.teamId)
    }
    setIsOpen(true)
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || teamId
  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name || "Unknown"

  // Filter schedules based on role
  const filteredSchedules = serviceSchedules.filter((s) => {
    if (user?.role === "admin") return true
    if (user?.role === "leader") {
      return s.assignments.some((a) => a.teamId === user.teamId)
    }
    if (user?.role === "volunteer") {
      return s.assignments.some((a) => a.oderId === user.id)
    }
    return false
  })

  const upcomingSchedules = filteredSchedules
    .filter((s) => new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen">
      <Header title="Service Schedule" subtitle="Manage volunteer assignments for services" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">{upcomingSchedules.length} upcoming service(s)</p>
          {canCreate && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Schedule</DialogTitle>
                  <DialogDescription>
                    {user?.role === "team_leader"
                      ? `Add a service schedule for ${getTeamName(user.teamId || "")} team`
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
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    />
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
                              <SelectItem key={v.id} value={v.id}>
                                {v.name}
                              </SelectItem>
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
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
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

                    {user?.role === "team_leader" && user.teamId && (
                      <p className="text-xs text-muted-foreground">
                        Assigning to: <span className="font-medium">{getTeamName(user.teamId)}</span> team
                      </p>
                    )}

                    {newSchedule.assignments.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {newSchedule.assignments.map((a, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                            <span>
                              {getUserName(a.oderId)} - {getTeamName(a.teamId)} ({a.role})
                            </span>
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
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!newSchedule.date || !newSchedule.service}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

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
                      className={`min-h-[80px] rounded-lg border p-1 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</div>
                      <div className="space-y-1 mt-1">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.id}
                            className="truncate rounded bg-primary/10 px-1 py-0.5 text-xs text-primary"
                          >
                            {schedule.service}
                          </div>
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
                      <div key={schedule.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{schedule.service}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(schedule.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Users className="h-3 w-3" />
                            {schedule.assignments.length} volunteer(s)
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {schedule.assignments.slice(0, 2).map((a, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {getUserName(a.oderId)}
                              </Badge>
                            ))}
                            {schedule.assignments.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{schedule.assignments.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
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
