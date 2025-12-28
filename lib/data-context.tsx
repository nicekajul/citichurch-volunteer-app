"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import {
  type User,
  type Team,
  type TrainingVideo,
  type Quiz,
  type TrainingProgress,
  type Announcement,
  type ServiceSchedule,
  initialUsers,
  initialTeams,
  initialTrainingVideos,
  initialQuizzes,
  initialAnnouncements,
  initialTrainingProgress,
  initialServiceSchedules,
} from "./data"

interface DataContextType {
  users: User[]
  teams: Team[]
  trainingVideos: TrainingVideo[]
  quizzes: Quiz[]
  trainingProgress: TrainingProgress[]
  announcements: Announcement[]
  serviceSchedules: ServiceSchedule[]

  // User management
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void

  // Team management
  addTeam: (team: Omit<Team, "id">) => void
  updateTeam: (id: string, updates: Partial<Team>) => void
  deleteTeam: (id: string) => void
  assignUserToTeam: (userId: string, teamId: string) => void

  // Training management
  addTrainingVideo: (video: Omit<TrainingVideo, "id">) => void
  updateTrainingVideo: (id: string, updates: Partial<TrainingVideo>) => void
  deleteTrainingVideo: (id: string) => void

  // Quiz management
  addQuiz: (quiz: Omit<Quiz, "id">) => void
  updateQuiz: (id: string, updates: Partial<Quiz>) => void

  // Progress management
  updateProgress: (userId: string, videoId: string, updates: Partial<TrainingProgress>) => void
  approveProgress: (progressId: string, approverId: string) => void

  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt">) => void
  deleteAnnouncement: (id: string) => void

  // Schedule
  addServiceSchedule: (schedule: Omit<ServiceSchedule, "id">) => void
  updateServiceSchedule: (id: string, updates: Partial<ServiceSchedule>) => void

  // Helpers
  getTeamMembers: (teamId: string) => User[]
  getUserProgress: (userId: string) => TrainingProgress[]
  getVideoQuiz: (videoId: string) => Quiz | undefined
  getTeamLeader: (teamId: string) => User | undefined
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [trainingVideos, setTrainingVideos] = useState<TrainingVideo[]>(initialTrainingVideos)
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes)
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>(initialTrainingProgress)
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>(initialServiceSchedules)

  // User management
  const addUser = (user: Omit<User, "id">) => {
    const newUser: User = { ...user, id: `user-${Date.now()}` }
    setUsers((prev) => [...prev, newUser])
  }

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)))
  }

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  // Team management
  const addTeam = (team: Omit<Team, "id">) => {
    const newTeam: Team = { ...team, id: `team-${Date.now()}` }
    setTeams((prev) => [...prev, newTeam])
  }

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }

  const assignUserToTeam = (userId: string, teamId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, teamId } : u)))
  }

  // Training management
  const addTrainingVideo = (video: Omit<TrainingVideo, "id">) => {
    const newVideo: TrainingVideo = { ...video, id: `video-${Date.now()}` }
    setTrainingVideos((prev) => [...prev, newVideo])
  }

  const updateTrainingVideo = (id: string, updates: Partial<TrainingVideo>) => {
    setTrainingVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)))
  }

  const deleteTrainingVideo = (id: string) => {
    setTrainingVideos((prev) => prev.filter((v) => v.id !== id))
  }

  // Quiz management
  const addQuiz = (quiz: Omit<Quiz, "id">) => {
    const newQuiz: Quiz = { ...quiz, id: `quiz-${Date.now()}` }
    setQuizzes((prev) => [...prev, newQuiz])
  }

  const updateQuiz = (id: string, updates: Partial<Quiz>) => {
    setQuizzes((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  // Progress management
  const updateProgress = (userId: string, videoId: string, updates: Partial<TrainingProgress>) => {
    setTrainingProgress((prev) => {
      const existing = prev.find((p) => p.oderId === userId && p.videoId === videoId)
      if (existing) {
        return prev.map((p) => (p.oderId === userId && p.videoId === videoId ? { ...p, ...updates } : p))
      } else {
        return [
          ...prev,
          {
            id: `progress-${Date.now()}`,
            oderId: userId,
            videoId,
            completed: false,
            watchedSeconds: 0,
            ...updates,
          },
        ]
      }
    })
  }

  const approveProgress = (progressId: string, approverId: string) => {
    setTrainingProgress((prev) => prev.map((p) => (p.id === progressId ? { ...p, approvedBy: approverId } : p)))
  }

  // Announcements
  const addAnnouncement = (announcement: Omit<Announcement, "id" | "createdAt">) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setAnnouncements((prev) => [newAnnouncement, ...prev])
  }

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  // Schedule
  const addServiceSchedule = (schedule: Omit<ServiceSchedule, "id">) => {
    const newSchedule: ServiceSchedule = { ...schedule, id: `schedule-${Date.now()}` }
    setServiceSchedules((prev) => [...prev, newSchedule])
  }

  const updateServiceSchedule = (id: string, updates: Partial<ServiceSchedule>) => {
    setServiceSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  // Helpers
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
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
