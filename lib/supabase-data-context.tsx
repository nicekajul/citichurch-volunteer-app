"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "./supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

// Re-export types from data.ts for compatibility
export type { UserRole, User, Team, Certificate, TrainingVideo, TrainingDocument, Quiz, QuizQuestion, TrainingProgress, Announcement, ServiceSchedule, ScheduleAssignment, MinistryApplication } from "./data"
import type { User, Team, TrainingVideo, TrainingProgress, Announcement, ServiceSchedule, ScheduleAssignment, Quiz, MinistryApplication, Certificate } from "./data"

interface DataContextType {
  users: User[]
  teams: Team[]
  trainingVideos: TrainingVideo[]
  quizzes: Quiz[]
  trainingProgress: TrainingProgress[]
  announcements: Announcement[]
  serviceSchedules: ServiceSchedule[]
  ministryApplications: MinistryApplication[]
  certificates: Certificate[]
  isLoading: boolean
  error: string | null

  // Refresh functions
  refreshUsers: () => Promise<void>
  refreshTeams: () => Promise<void>
  refreshTraining: () => Promise<void>
  refreshProgress: (userId?: string) => Promise<void>
  refreshAnnouncements: () => Promise<void>
  refreshSchedules: () => Promise<void>
  refreshApplications: () => Promise<void>
  refreshCertificates: () => Promise<void>
  addCertificate: (cert: Omit<Certificate, "id">) => Promise<void>
  updateCertificate: (id: string, updates: Partial<Certificate>) => Promise<void>
  deleteCertificate: (id: string) => Promise<void>
  getEarnedCertificates: (userId: string) => Certificate[]
  isCertificateLocked: (certId: string, userId: string) => boolean

  // User management
  addUser: (user: Omit<User, "id">) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>

  // Team management
  addTeam: (team: Omit<Team, "id">) => Promise<void>
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>
  deleteTeam: (id: string) => Promise<void>
  assignUserToTeam: (userId: string, teamId: string) => Promise<void>

  // Training management
  addTrainingVideo: (video: Omit<TrainingVideo, "id">) => Promise<void>
  updateTrainingVideo: (id: string, updates: Partial<TrainingVideo>) => Promise<void>
  deleteTrainingVideo: (id: string) => Promise<void>

  // Quiz management
  addQuiz: (quiz: Omit<Quiz, "id">) => Promise<void>
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<void>

  // Progress management
  updateProgress: (userId: string, videoId: string, updates: Partial<TrainingProgress>) => Promise<void>
  approveProgress: (progressId: string, approverId: string) => Promise<void>

  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt">) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>

  // Schedule
  addServiceSchedule: (schedule: Omit<ServiceSchedule, "id">) => Promise<void>
  updateServiceSchedule: (id: string, updates: Partial<ServiceSchedule>) => Promise<void>
  respondToSchedule: (scheduleId: string, response: "confirmed" | "declined", reason?: string) => Promise<void>

  // Ministry Applications
  submitMinistryApplication: (data: { teamId: string; motivation: string; experience: string; availability: string[] }) => Promise<void>
  reviewApplication: (id: string, status: "approved" | "rejected", notes: string) => Promise<void>

  // Helpers
  getTeamMembers: (teamId: string) => User[]
  getUserProgress: (userId: string) => TrainingProgress[]
  getVideoQuiz: (videoId: string) => Quiz | undefined
  getTeamLeader: (teamId: string) => User | undefined
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(profile: any): User {
  return {
    id: profile.id,
    username: profile.email?.split("@")[0] || "",
    password: "******",
    name: profile.name || "",
    email: profile.email || "",
    role: profile.role as "admin" | "leader" | "volunteer",
    teamId: profile.team_id || undefined,
    avatar: profile.avatar_url || undefined,
    phone: profile.phone || undefined,
    joinDate: profile.join_date || profile.created_at,
    status: (profile.status as "active" | "inactive" | "pending") || "active",
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeam(team: any): Team {
  return {
    id: team.id,
    name: team.name,
    description: team.description || "",
    leaderId: team.leader_id || undefined,
    color: team.color || "#3b82f6",
    icon: "Users",
    requirements: [],
  }
}

export function SupabaseDataProvider({ children }: { children: ReactNode }) {
  // createClient() returns the same singleton instance every call.
  // It throws if env vars are missing, which surfaces a clear error in dev.
  const supabase = createClient()
  
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [trainingVideos, setTrainingVideos] = useState<TrainingVideo[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>([])
  const [ministryApplications, setMinistryApplications] = useState<MinistryApplication[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from profiles table
  const refreshUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)
      setUsers((data || []).map(mapProfile))
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch users")
    }
  }

  // Fetch teams
  const refreshTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name")

      if (error) throw new Error(error.message)
      setTeams((data || []).map(mapTeam))
    } catch (err) {
      console.error("Error fetching teams:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch teams")
    }
  }

  // Fetch training modules with documents and quizzes
  const refreshTraining = async () => {
    try {
      const [modulesRes, docsRes, quizzesRes] = await Promise.all([
        supabase.from("training_modules").select("*").order("created_at"),
        supabase.from("training_documents").select("*"),
        supabase.from("quiz_questions").select("*").order("training_module_id, order_index"),
      ])

      if (modulesRes.error) throw new Error(modulesRes.error.message)

      // Map modules to training videos
      const mappedVideos: TrainingVideo[] = (modulesRes.data || []).map((module: any) => {
        // Get documents for this module
        const moduleDocs = (docsRes.data || [])
          .filter((doc: any) => doc.training_module_id === module.id)
          .map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            type: doc.file_type as "pdf" | "doc" | "ppt" | "other",
            size: undefined,
          }))

        return {
          id: module.id,
          title: module.title,
          description: module.description || "",
          videoUrl: module.video_url || undefined,
          duration: module.duration || 0,
          teamId: module.team_id || undefined,
          order: 0, // Not in schema, use created_at for ordering
          quizEnabled: module.quiz_enabled || false,
          quizRequired: module.required || false,
          passingScore: 70, // Default, not in schema
          summary: module.description || "",
          documents: moduleDocs,
          certificateId: module.certificate_id || undefined,
          prerequisites: Array.isArray(module.prerequisites) ? module.prerequisites : [],
        }
      })

      // Group quiz questions by module
      const quizMap = new Map<string, Quiz>()
      ;(quizzesRes.data || []).forEach((q: any) => {
        if (!quizMap.has(q.training_module_id)) {
          quizMap.set(q.training_module_id, {
            id: `quiz-${q.training_module_id}`,
            videoId: q.training_module_id,
            questions: [],
          })
        }
        
        const quiz = quizMap.get(q.training_module_id)!
        quiz.questions.push({
          id: q.id,
          question: q.question,
          options: q.options as string[],
          correctAnswer: q.options.indexOf(q.correct_answer),
        })
      })

      setTrainingVideos(mappedVideos)
      setQuizzes(Array.from(quizMap.values()))
    } catch (err) {
      console.error("Error fetching training:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch training")
    }
  }

  // Fetch training progress — optionally scoped to a single user (non-admin)
  const refreshProgress = async (userId?: string) => {
    try {
      let query = supabase.from("training_progress").select("*")
      if (userId) query = query.eq("user_id", userId)

      const { data, error } = await query

      if (error) throw new Error(error.message)

      const mappedProgress: TrainingProgress[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        videoId: p.training_module_id,
        completed: p.status === "completed",
        watchedSeconds: p.progress || 0,
        quizScore: p.quiz_score || undefined,
        quizPassed: p.quiz_score ? p.quiz_score >= 70 : undefined,
        completedAt: p.completed_at || undefined,
        approvedBy: undefined, // Not in current schema
      }))

      setTrainingProgress(mappedProgress)
    } catch (err) {
      console.error("Error fetching progress:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch progress")
    }
  }

  // Fetch announcements
  const refreshAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)

      const mappedAnnouncements: Announcement[] = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        authorId: a.author_id,
        teamId: a.team_id || undefined,
        createdAt: a.created_at,
        priority: a.priority as "low" | "medium" | "high",
      }))

      setAnnouncements(mappedAnnouncements)
    } catch (err) {
      console.error("Error fetching announcements:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch announcements")
    }
  }

  // Fetch service schedules with assignments
  const refreshSchedules = async () => {
    try {
      const [schedulesRes, assignmentsRes] = await Promise.all([
        supabase.from("service_schedules").select("*").order("service_date"),
        supabase.from("schedule_assignments").select("*"),
      ])

      if (schedulesRes.error) throw new Error(schedulesRes.error.message)
      if (assignmentsRes.error) throw new Error(assignmentsRes.error.message)

      const mappedSchedules: ServiceSchedule[] = (schedulesRes.data || []).map((s: any) => {
        const scheduleAssignments: ScheduleAssignment[] = (assignmentsRes.data || [])
          .filter((a: any) => a.schedule_id === s.id)
          .map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            teamId: a.team_id,
            role: a.role,
            status: (a.status as ScheduleAssignment["status"]) || "assigned",
            rejectionReason: a.rejection_reason || undefined,
          }))

        const dt = new Date(s.service_date)
        const date = s.service_date.slice(0, 10)
        const hours = dt.getHours().toString().padStart(2, "0")
        const minutes = dt.getMinutes().toString().padStart(2, "0")
        const time = `${hours}:${minutes}`

        return {
          id: s.id,
          date,
          time,
          service: s.service_name,
          assignments: scheduleAssignments,
        }
      })

      setServiceSchedules(mappedSchedules)
    } catch (err) {
      console.error("Error fetching schedules:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch schedules")
    }
  }

  // Only load data when an authenticated session exists
  useEffect(() => {
    let mounted = true
    // Each loadAllData call gets a generation number. Only the latest call
    // is allowed to flip isLoading → false, so a slow previous load can't
    // overwrite the UI state of a newer one.
    let generation = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadAllData = async (session: any) => {
      if (!mounted) return
      const myGeneration = ++generation
      setIsLoading(true)

      // For non-admin users, scope progress to their own records only.
      // Admins need all progress for the overview dashboard.
      const role: string = session?.user?.user_metadata?.role ?? ""
      const userId: string | undefined =
        role !== "admin" ? session?.user?.id : undefined

      await Promise.all([
        refreshUsers(),
        refreshTeams(),
        refreshTraining(),
        refreshProgress(userId),
        refreshAnnouncements(),
        refreshSchedules(),
        refreshApplications(),
        refreshCertificates(),
      ])

      // Only mark loading complete if no newer load has started since we began.
      if (mounted && myGeneration === generation) setIsLoading(false)
    }

    const clearData = () => {
      generation++ // invalidate any in-flight loadAllData so it won't flip isLoading → false
      setUsers([])
      setTeams([])
      setTrainingVideos([])
      setQuizzes([])
      setTrainingProgress([])
      setAnnouncements([])
      setServiceSchedules([])
      setMinistryApplications([])
      setIsLoading(false)
    }

    // Directly check session on mount — reliable on browser refresh
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (!mounted) return
      if (session) {
        loadAllData(session)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for subsequent auth changes (login / logout / user switch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" && session) {
        loadAllData(session)
      } else if (event === "SIGNED_OUT") {
        // Verify no new session exists before wiping state. A stale SIGNED_OUT
        // from a previous signOut() can arrive AFTER a new user has already
        // signed in if logout() wasn't awaited before navigating.
        supabase.auth.getSession().then(({ data: { session: current } }: { data: { session: Session | null } }) => {
          if (!current) clearData()
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // User management
  const addUser = async (user: Omit<User, "id">) => {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        name: user.name,
        email: user.email,
        role: user.role,
        team_id: user.teamId,
        phone: user.phone,
        avatar_url: user.avatar,
        status: user.status,
        join_date: user.joinDate,
      })
      .select()
      .single()

    if (error) throw error
    setUsers((prev) => [mapProfile(data), ...prev])
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: updates.name,
        email: updates.email,
        role: updates.role,
        team_id: updates.teamId,
        phone: updates.phone,
        avatar_url: updates.avatar,
        status: updates.status,
      })
      .eq("id", id)

    if (error) throw error
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    )
  }

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) throw error
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const assignUserToTeam = async (userId: string, teamId: string) => {
    await updateUser(userId, { teamId })
  }

  // Team management
  const addTeam = async (team: Omit<Team, "id">) => {
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: team.name,
        description: team.description,
        leader_id: team.leaderId,
        color: team.color,
      })
      .select()
      .single()

    if (error) throw error
    setTeams((prev) => [...prev, mapTeam(data)])
  }

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    const { error } = await supabase
      .from("teams")
      .update({
        name: updates.name,
        description: updates.description,
        leader_id: updates.leaderId,
        color: updates.color,
      })
      .eq("id", id)

    if (error) throw error
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id)
    if (error) throw error
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }

  // Training management
  const addTrainingVideo = async (video: Omit<TrainingVideo, "id">) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData?.session?.user?.id

    const { data, error } = await supabase
      .from("training_modules")
      .insert({
        title: video.title,
        description: video.description,
        video_url: video.videoUrl || null,
        duration: video.duration || 0,
        team_id: video.teamId || null,
        quiz_enabled: video.quizEnabled ?? false,
        required: video.quizRequired ?? false,
        created_by: currentUserId,
        certificate_id: video.certificateId || null,
        prerequisites: video.prerequisites || [],
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Add documents if any
    if (video.documents && video.documents.length > 0 && data) {
      const { error: docsError } = await supabase.from("training_documents").insert(
        video.documents.map((doc) => ({
          training_module_id: data.id,
          name: doc.name,
          url: doc.url,
          file_type: doc.type,
        }))
      )
      if (docsError) console.error("Error adding documents:", docsError)
    }

    await refreshTraining()
  }

  const updateTrainingVideo = async (id: string, updates: Partial<TrainingVideo>) => {
    const { error } = await supabase
      .from("training_modules")
      .update({
        title: updates.title,
        description: updates.description,
        video_url: updates.videoUrl,
        duration: updates.duration,
        team_id: updates.teamId,
        quiz_enabled: updates.quizEnabled,
        required: updates.quizRequired,
        certificate_id: updates.certificateId !== undefined ? updates.certificateId || null : undefined,
        prerequisites: updates.prerequisites,
      })
      .eq("id", id)

    if (error) throw error
    await refreshTraining()
  }

  const deleteTrainingVideo = async (id: string) => {
    const { error } = await supabase.from("training_modules").delete().eq("id", id)
    if (error) throw error
    await refreshTraining()
  }

  // Quiz management
  const addQuiz = async (quiz: Omit<Quiz, "id">) => {
    const { error } = await supabase.from("quiz_questions").insert(
      quiz.questions.map((q, index) => ({
        training_module_id: quiz.videoId,
        question: q.question,
        options: q.options,
        correct_answer: q.options[q.correctAnswer],
        order_index: index,
      }))
    )

    if (error) throw error
    await refreshTraining()
  }

  const updateQuiz = async (id: string, updates: Partial<Quiz>) => {
    // Complex update - delete old questions and add new ones
    if (updates.questions) {
      await supabase.from("quiz_questions").delete().eq("training_module_id", updates.videoId)
      
      const { error } = await supabase.from("quiz_questions").insert(
        updates.questions.map((q, index) => ({
          training_module_id: updates.videoId!,
          question: q.question,
          options: q.options,
          correct_answer: q.options[q.correctAnswer],
          order_index: index,
        }))
      )

      if (error) throw error
      await refreshTraining()
    }
  }

  // Progress management
  const updateProgress = async (userId: string, videoId: string, updates: Partial<TrainingProgress>) => {
    const { error } = await supabase
      .from("training_progress")
      .upsert(
        {
          user_id: userId,
          training_module_id: videoId,
          progress: updates.watchedSeconds ?? 0,
          quiz_score: updates.quizScore ?? null,
          status: updates.completed ? "completed" : "in_progress",
          completed_at: updates.completedAt ?? null,
        },
        { onConflict: "user_id,training_module_id" }
      )

    if (error) throw error

    // Update local state optimistically
    setTrainingProgress((prev) => {
      const existing = prev.find((p) => p.userId === userId && p.videoId === videoId)
      const updated: TrainingProgress = {
        id: existing?.id ?? `${userId}-${videoId}`,
        userId: userId,
        videoId,
        completed: updates.completed ?? existing?.completed ?? false,
        watchedSeconds: updates.watchedSeconds ?? existing?.watchedSeconds ?? 0,
        quizScore: updates.quizScore ?? existing?.quizScore,
        quizPassed: updates.quizScore !== undefined ? updates.quizScore >= 70 : existing?.quizPassed,
        completedAt: updates.completedAt ?? existing?.completedAt,
        approvedBy: existing?.approvedBy,
      }
      if (existing) {
        return prev.map((p) => (p.userId === userId && p.videoId === videoId ? updated : p))
      }
      return [...prev, updated]
    })
  }

  const approveProgress = async (progressId: string, approverId: string) => {
    // Approval logic not in current schema, but we can update status
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData?.session?.user?.id
    const currentRole: string = sessionData?.session?.user?.user_metadata?.role ?? ""

    const { error } = await supabase
      .from("training_progress")
      .update({ status: "approved" })
      .eq("id", progressId)

    if (error) throw error
    // Scope the refresh to the current user's records if they are not an admin,
    // matching the same RLS-safe scoping used on initial load.
    await refreshProgress(currentRole !== "admin" ? currentUserId : undefined)
  }

  // Announcements
  const addAnnouncement = async (announcement: Omit<Announcement, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: announcement.title,
        content: announcement.content,
        author_id: announcement.authorId,
        team_id: announcement.teamId,
        priority: announcement.priority,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    const mapped: Announcement = {
      id: data.id,
      title: data.title,
      content: data.content,
      authorId: data.author_id,
      teamId: data.team_id || undefined,
      createdAt: data.created_at,
      priority: data.priority as "low" | "normal" | "high",
    }
    setAnnouncements((prev) => [mapped, ...prev])
  }

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) throw error
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  // Schedule
  const addServiceSchedule = async (schedule: Omit<ServiceSchedule, "id">) => {
    const serviceDateTime = schedule.time
      ? `${schedule.date}T${schedule.time}:00`
      : `${schedule.date}T00:00:00`
    const { data, error } = await supabase
      .from("service_schedules")
      .insert({
        service_date: serviceDateTime,
        service_name: schedule.service,
      })
      .select()
      .single()

    if (error) throw error

    // Add assignments
    if (data && schedule.assignments.length > 0) {
      const { error: assignError } = await supabase.from("schedule_assignments").insert(
        schedule.assignments.map((a) => ({
          schedule_id: data.id,
          user_id: a.userId,
          team_id: a.teamId,
          role: a.role,
        }))
      )

      if (assignError) throw new Error(assignError.message)
    }

    await refreshSchedules()
  }

  const updateServiceSchedule = async (id: string, updates: Partial<ServiceSchedule>) => {
    let serviceDateTime: string | undefined
    if (updates.date) {
      const time = updates.time ?? "00:00"
      serviceDateTime = `${updates.date}T${time}:00`
    }
    const { error } = await supabase
      .from("service_schedules")
      .update({
        service_date: serviceDateTime,
        service_name: updates.service,
      })
      .eq("id", id)

    if (error) throw error

    // Update assignments if provided
    if (updates.assignments) {
      const { data: existing } = await supabase
        .from("schedule_assignments")
        .select("id, user_id, status, rejection_reason")
        .eq("schedule_id", id)

      const { error: delError } = await supabase
        .from("schedule_assignments")
        .delete()
        .eq("schedule_id", id)
      if (delError) throw new Error(delError.message)

      if (updates.assignments.length > 0) {
        // Preserve status/reason for assignments that already existed
        const statusMap = new Map<string, { status: string; rejection_reason: string | null }>(
          (existing || []).map((e: any) => [e.user_id as string, { status: e.status as string, rejection_reason: e.rejection_reason as string | null }])
        )
        const { error: insertError } = await supabase.from("schedule_assignments").insert(
          updates.assignments.map((a) => {
            const prev = statusMap.get(a.userId)
            return {
              schedule_id: id,
              user_id: a.userId,
              team_id: a.teamId,
              role: a.role,
              status: prev?.status ?? "assigned",
              rejection_reason: prev?.rejection_reason ?? null,
            }
          })
        )
        if (insertError) throw new Error(insertError.message)
      }
    }

    await refreshSchedules()
  }

  const respondToSchedule = async (
    scheduleId: string,
    response: "confirmed" | "declined",
    reason?: string
  ) => {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("schedule_assignments")
      .update({
        status: response,
        rejection_reason: response === "declined" ? (reason ?? null) : null,
      })
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId)

    if (error) throw new Error(error.message)

    // Update local state optimistically
    setServiceSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s
        return {
          ...s,
          assignments: s.assignments.map((a) =>
            a.userId === userId
              ? { ...a, status: response, rejectionReason: response === "declined" ? reason : undefined }
              : a
          ),
        }
      })
    )
  }

  // Ministry Applications
  const refreshApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("ministry_applications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)

      const mapped: MinistryApplication[] = (data || []).map((a: any) => ({
        id: a.id,
        applicantId: a.applicant_id,
        teamId: a.team_id,
        motivation: a.motivation,
        experience: a.experience || "",
        availability: a.availability || [],
        status: a.status as "pending" | "approved" | "rejected",
        reviewedBy: a.reviewed_by || undefined,
        reviewNotes: a.review_notes || undefined,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }))

      setMinistryApplications(mapped)
    } catch (err) {
      console.error("Error fetching applications:", err)
    }
  }

  const refreshCertificates = async () => {
    try {
      const { data, error } = await supabase.from("certificates").select("*").order("order_index")
      if (error) throw new Error(error.message)
      setCertificates(
        (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          color: c.color || "#3b82f6",
          teamId: c.team_id || undefined,
          prerequisiteCertificateId: c.prerequisite_certificate_id || undefined,
          orderIndex: c.order_index ?? 0,
        }))
      )
    } catch (err) {
      console.error("Error fetching certificates:", err)
    }
  }

  const addCertificate = async (cert: Omit<Certificate, "id">) => {
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        name: cert.name,
        description: cert.description,
        color: cert.color,
        team_id: cert.teamId || null,
        prerequisite_certificate_id: cert.prerequisiteCertificateId || null,
        order_index: cert.orderIndex ?? 0,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCertificates((prev) => [
      ...prev,
      {
        id: data.id,
        name: data.name,
        description: data.description || "",
        color: data.color || "#3b82f6",
        teamId: data.team_id || undefined,
        prerequisiteCertificateId: data.prerequisite_certificate_id || undefined,
        orderIndex: data.order_index ?? 0,
      },
    ])
  }

  const updateCertificate = async (id: string, updates: Partial<Certificate>) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if ("teamId" in updates) dbUpdates.team_id = updates.teamId ?? null
    if ("prerequisiteCertificateId" in updates) dbUpdates.prerequisite_certificate_id = updates.prerequisiteCertificateId ?? null
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex
    const { error } = await supabase.from("certificates").update(dbUpdates).eq("id", id)
    if (error) throw new Error(error.message)
    setCertificates((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteCertificate = async (id: string) => {
    const { error } = await supabase.from("certificates").delete().eq("id", id)
    if (error) throw new Error(error.message)
    setCertificates((prev) => prev.filter((c) => c.id !== id))
  }

  const getEarnedCertificates = (userId: string): Certificate[] => {
    const completedIds = new Set(
      trainingProgress.filter((p) => p.userId === userId && p.completed).map((p) => p.videoId)
    )
    return certificates.filter((cert) => {
      const certModules = trainingVideos.filter((v) => v.certificateId === cert.id)
      return certModules.length > 0 && certModules.every((v) => completedIds.has(v.id))
    })
  }

  const isCertificateLocked = (certId: string, userId: string): boolean => {
    const cert = certificates.find((c) => c.id === certId)
    if (!cert?.prerequisiteCertificateId) return false
    const earnedIds = new Set(getEarnedCertificates(userId).map((c) => c.id))
    return !earnedIds.has(cert.prerequisiteCertificateId)
  }

  const submitMinistryApplication = async (data: {
    teamId: string
    motivation: string
    experience: string
    availability: string[]
  }) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData?.session?.user?.id
    if (!currentUserId) throw new Error("Not authenticated")

    const { error } = await supabase.from("ministry_applications").insert({
      applicant_id: currentUserId,
      team_id: data.teamId,
      motivation: data.motivation,
      experience: data.experience,
      availability: data.availability,
      status: "pending",
    })

    if (error) throw new Error(error.message)
    await refreshApplications()
  }

  const reviewApplication = async (id: string, status: "approved" | "rejected", notes: string) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData?.session?.user?.id

    // Get the application to find applicant + team
    const application = ministryApplications.find((a) => a.id === id)
    if (!application) throw new Error("Application not found")

    const { error } = await supabase
      .from("ministry_applications")
      .update({
        status,
        reviewed_by: currentUserId,
        review_notes: notes,
      })
      .eq("id", id)

    if (error) throw new Error(error.message)

    // If approved, assign the volunteer to the team
    if (status === "approved") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: application.teamId, status: "active" })
        .eq("id", application.applicantId)

      if (profileError) console.error("Error assigning volunteer to team:", profileError)
      await refreshUsers()
    }

    await refreshApplications()
  }

  // Helper functions (client-side filtering)
  const getTeamMembers = (teamId: string) => {
    return users.filter((u) => u.teamId === teamId)
  }

  const getUserProgress = (userId: string) => {
    return trainingProgress.filter((p) => p.userId === userId)
  }

  const getVideoQuiz = (videoId: string) => {
    return quizzes.find((q) => q.videoId === videoId)
  }

  const getTeamLeader = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (team?.leaderId) {
      return users.find((u) => u.id === team.leaderId)
    }
    return undefined
  }

  return (
    <DataContext.Provider
      value={{
        users,
        teams,
        trainingVideos,
        quizzes,
        trainingProgress,
        announcements,
        serviceSchedules,
        ministryApplications,
        certificates,
        isLoading,
        error,
        refreshUsers,
        refreshTeams,
        refreshTraining,
        refreshProgress,
        refreshAnnouncements,
        refreshSchedules,
        refreshApplications,
        refreshCertificates,
        addCertificate,
        updateCertificate,
        deleteCertificate,
        getEarnedCertificates,
        isCertificateLocked,
        addUser,
        updateUser,
        deleteUser,
        addTeam,
        updateTeam,
        deleteTeam,
        assignUserToTeam,
        addTrainingVideo,
        updateTrainingVideo,
        deleteTrainingVideo,
        addQuiz,
        updateQuiz,
        updateProgress,
        approveProgress,
        addAnnouncement,
        deleteAnnouncement,
        addServiceSchedule,
        updateServiceSchedule,
        respondToSchedule,
        submitMinistryApplication,
        reviewApplication,
        getTeamMembers,
        getUserProgress,
        getVideoQuiz,
        getTeamLeader,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a SupabaseDataProvider")
  }
  return context
}
