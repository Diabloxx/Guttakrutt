import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

/**
 * Enhanced separator component with World of Warcraft styling
 * Supports horizontal and vertical orientations with optional wow-styling
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    wowStyling?: boolean
  }
>(
  (
    { className, orientation = "horizontal", decorative = true, wowStyling = false, ...props },
    ref
  ) => {
    if (wowStyling) {
      return (
        <div 
          className={cn(
            "relative",
            orientation === "horizontal" ? "h-5 w-full my-2" : "h-full w-5 mx-2",
            className
          )}
        >
          <div
            className={cn(
              "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-wow-gold/50 to-transparent",
              orientation === "vertical" && "top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-wow-gold/50 to-transparent"
            )}
          />
          <div
            className={cn(
              "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2",
              orientation === "horizontal" ? "w-8 h-3" : "w-3 h-8"
            )}
          >
            <div
              className={cn(
                "w-full h-full bg-wow-dark border border-wow-gold/30 rounded-full transform",
                orientation === "vertical" ? "rotate-90" : ""
              )}
            />
          </div>
        </div>
      );
    }
    
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
      />
    );
  }
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }