import * as React from "react"
import interact from "interactjs"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, resizable = false, ...props }, forwardedRef) => {
  const innerRef = React.useRef(null)
  React.useImperativeHandle(forwardedRef, () => innerRef.current)

  React.useEffect(() => {
    const el = innerRef.current
    if (!el || !resizable) return
    const i = interact(el).resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move(event) {
          const w = Math.max(200, Math.round(event.rect.width))
          const h = Math.max(80, Math.round(event.rect.height))
          event.target.style.width = w + "px"
          event.target.style.height = h + "px"
        },
      },
    })
    return () => {
      i.unset()
    }
  }, [resizable])

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        resizable ? "resize-none" : "",
        className
      )}
      ref={innerRef}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
export default Textarea
