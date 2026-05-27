import React from "react"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, role = "status", ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon {...props} className={cn("size-4 animate-spin", className)} role={role} />
  )
}

export { Spinner }
