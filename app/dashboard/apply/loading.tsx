import { Skeleton } from "@/components/ui/skeleton"

export default function ApplyLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-border px-6 flex items-center">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
