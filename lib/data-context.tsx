// This file now re-exports from supabase-data-context.tsx
// All mock data has been replaced with real Supabase integration

export {
  SupabaseDataProvider as DataProvider,
  useData,
  type UserRole,
  type User,
  type Team,
  type Certificate,
  type TrainingVideo,
  type TrainingDocument,
  type Quiz,
  type QuizQuestion,
  type TrainingProgress,
  type Announcement,
  type ServiceSchedule,
  type ScheduleAssignment,
  type AppNotification,
  type DelegatedPermission,
  type TeamPermission,
} from "./supabase-data-context"
