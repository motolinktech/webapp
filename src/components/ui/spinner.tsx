import { Loader2Icon } from "lucide-react"

import { classHelper } from "@/lib/utils/classHelper"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={classHelper("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
