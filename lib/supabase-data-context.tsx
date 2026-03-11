"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "./supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

// Re-export types from data.ts for compatibility
export type { UserRole, User, Team, TrainingVideo, TrainingDocument, Quiz, QuizQuestion, TrainingProgress, Announcement, ServiceSchedule, MinistryApplication } from "./data"
import type { User, Team, TrainingVideo, TrainingProgress, Announcement, ServiceSchedule, Quiz, MinistryApplication } from "./data"

interface DataContextType {
  users: User[]
  teams: Team[]
  trainingVideos: TrainingVideo[]
  quizzes: Quiz[]
  trainingProgress: TrainingProgress[]
  announcements: Announcement[]
  serviceSchedules: ServiceSchedule[]
  ministryApplications: MinistryApplication[]
  isLoading: boolean
  error: string | null

  // Refresh functions
  refreshUsers: () => Promise<void>
  refreshTeams: () => Promise<void>
  refreshTraining: () => Promise<void>
  refreshProgress: () => Promise<void>
  refreshAnnouncements: () => Promise<void>
  refreshSchedules: () => Promise<void>
  refreshApplications: () => Promise<void>

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

      const mappedUsers: User[] = (data || []).map((profile) => ({
        id: profile.id,
        username: profile.email?.split("@")[0] || "",
        password: "******", // Never expose real passwords
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role as "admin" | "leader" | "volunteer",
        teamId: profile.team_id || undefined,
        avatar: profile.avatar_url || undefined,
        phone: profile.phone || undefined,
        joinDate: profile.join_date || profile.created_at,
        status: profile.status as "active" | "inactive" | "pending" || "active",
      }))

      setUsers(mappedUsers)
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

      const mappedTeams: Team[] = (data || []).map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description || "",
        leaderId: team.leader_id || undefined,
        color: team.color || "#3b82f6",
        icon: "Users", // Default icon
        requirements: [], // Not stored in DB currently
      }))

      setTeams(mappedTeams)
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
      const mappedVideos: TrainingVideo[] = (modulesRes.data || []).map((module) => {
        // Get documents for this module
        const moduleDocs = (docsRes.data || [])
          .filter((doc) => doc.training_module_id === module.id)
          .map((doc) => ({
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
        }
      })

      // Group quiz questions by module
      const quizMap = new Map<string, Quiz>()
      ;(quizzesRes.data || []).forEach((q) => {
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

  // Fetch training progress
  const refreshProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("training_progress")
        .select("*")

      if (error) throw new Error(error.message)

      const mappedProgress: TrainingProgress[] = (data || []).map((p) => ({
        id: p.id,
        oderId: p.user_id,
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

      const mappedAnnouncements: Announcement[] = (data || []).map((a) => ({
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

      const mappedSchedules: ServiceSchedule[] = (schedulesRes.data || []).map((s) => {
        const scheduleAssignments = (assignmentsRes.data || [])
          .filter((a) => a.schedule_id === s.id)
          .map((a) => ({
            oderId: a.user_id,
            teamId: a.team_id,
            role: a.role,
          }))

        return {
          id: s.id,
          date: s.service_date,
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

    const loadAllData = async () => {
      if (!mounted) return
      setIsLoading(true)
      await Promise.all([
        refreshUsers(),
        refreshTeams(),
        refreshTraining(),
        refreshProgress(),
        refreshAnnouncements(),
        refreshSchedules(),
        refreshApplications(),
      ])
      if (mounted) setIsLoading(false)
    }

    // Listen for auth changes — only fetch data when signed in (not on token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        loadAllData()
      } else if (event === "SIGNED_OUT") {
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
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // User management
  const addUser = async (user: Omit<User, "id">) => {
    const { error } = await supabase.from("profiles").insert({
      name: user.name,
      email: user.email,
      role: user.role,
      team_id: user.teamId,
      phone: user.phone,
      avatar_url: user.avatar,
      status: user.status,
      join_date: user.joinDate,
    })

    if (error) throw error
    await refreshUsers()
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
    await refreshUsers()
  }

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) throw error
    await refreshUsers()
  }

  const assignUserToTeam = async (userId: string, teamId: string) => {
    await updateUser(userId, { teamId })
  }

  // Team management
  const addTeam = async (team: Omit<Team, "id">) => {
    const { error } = await supabase.from("teams").insert({
      name: team.name,
      description: team.description,
      leader_id: team.leaderId,
      color: team.color,
    })

    if (error) throw error
    await refreshTeams()
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
    await refreshTeams()
  }

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id)
    if (error) throw error
    await refreshTeams()
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
    // Check if progress exists
    const { data: existing } = await supabase
      .from("training_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("training_module_id", videoId)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("training_progress")
        .update({
          progress: updates.watchedSeconds,
          quiz_score: updates.quizScore,
          status: updates.completed ? "completed" : "in_progress",
          completed_at: updates.completedAt,
        })
        .eq("id", existing.id)

      if (error) throw error
    } else {
      // Create new
      const { error } = await supabase.from("training_progress").insert({
        user_id: userId,
        training_module_id: videoId,
        progress: updates.watchedSeconds || 0,
        quiz_score: updates.quizScore,
        status: updates.completed ? "completed" : "in_progress",
        completed_at: updates.completedAt,
      })

      if (error) throw error
    }

    await refreshProgress()
  }

  const approveProgress = async (progressId: string, approverId: string) => {
    // Approval logic not in current schema, but we can update status
    const { error } = await supabase
      .from("training_progress")
      .update({ status: "approved" })
      .eq("id", progressId)

    if (error) throw error
    await refreshProgress()
  }

  // Announcements
  const addAnnouncement = async (announcement: Omit<Announcement, "id" | "createdAt">) => {
    const { error } = await supabase.from("announcements").insert({
      title: announcement.title,
      content: announcement.content,
      author_id: announcement.authorId,
      team_id: announcement.teamId,
      priority: announcement.priority,
    })

    if (error) throw error
    await refreshAnnouncements()
  }

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) throw error
    await refreshAnnouncements()
  }

  // Schedule
  const addServiceSchedule = async (schedule: Omit<ServiceSchedule, "id">) => {
    const { data, error } = await supabase
      .from("service_schedules")
      .insert({
        service_date: schedule.date,
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
          user_id: a.oderId,
          team_id: a.teamId,
          role: a.role,
        }))
      )

      if (assignError) console.error("Error adding assignments:", assignError)
    }

    await refreshSchedules()
  }

  const updateServiceSchedule = async (id: string, updates: Partial<ServiceSchedule>) => {
    const { error } = await supabase
      .from("service_schedules")
      .update({
        service_date: updates.date,
        service_name: updates.service,
      })
      .eq("id", id)

    if (error) throw error

    // Update assignments if provided
    if (updates.assignments) {
      // Delete old assignments
      await supabase.from("schedule_assignments").delete().eq("schedule_id", id)

      // Add new assignments
      if (updates.assignments.length > 0) {
        await supabase.from("schedule_assignments").insert(
          updates.assignments.map((a) => ({
            schedule_id: id,
            user_id: a.oderId,
            team_id: a.teamId,
            role: a.role,
          }))
        )
      }
    }

    await refreshSchedules()
  }

  // Ministry Applications
  const refreshApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("ministry_applications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)

      const mapped: MinistryApplication[] = (data || []).map((a) => ({
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
    return trainingProgress.filter((p) => p.oderId === userId)
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
        isLoading,
        error,
        refreshUsers,
        refreshTeams,
        refreshTraining,
        refreshProgress,
        refreshAnnouncements,
        refreshSchedules,
        refreshApplications,
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
