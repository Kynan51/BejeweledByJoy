import { cn } from "@/lib/utils"
import { MoonLoader } from "react-spinners"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-center items-center animate-pulse rounded-md bg-muted", className)} {...props}>
      <MoonLoader color="#7c3aed" size={24} />
    </div>
  )
}

export { Skeleton }
