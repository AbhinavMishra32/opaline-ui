import { Skeleton } from "@opaline/ui"

export default function SkeletonDemo() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3">
      <Skeleton className="size-9 rounded-full" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  )
}
