// This file now re-exports from supabase-data-context.tsx
// All mock data has been replaced with real Supabase integration

export {
  SupabaseDataProvider as DataProvider,
  useData,
  type UserRole,
  type User,
  type Team,
  type TrainingVideo,
  type TrainingDocument,
  type Quiz,
  type QuizQuestion,
  type TrainingProgress,
  type Announcement,
  type ServiceSchedule,
} from "./supabase-data-context"
