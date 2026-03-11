import { Skeleton } from "@/components/ui/skeleton"

export default function ApplicationsLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-border px-6 flex items-center">
        <Skeleton className="h-6 w-56" />
      </div>
      <div className="p-4 lg:p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
