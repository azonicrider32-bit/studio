"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & { 
    orientation?: 'horizontal' | 'vertical',
    size?: 'sm' | 'default'
  }
>(({ className, orientation = 'horizontal', size = 'default', ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      orientation === 'horizontal' ? 'h-6 w-11' : 'h-11 w-6 flex-col',
      size === 'sm' && orientation === 'horizontal' && 'h-5 w-9',
      size === 'sm' && orientation === 'vertical' && 'h-9 w-5',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
        size === 'default' && 'h-5 w-5',
        size === 'sm' && 'h-4 w-4',
        orientation === 'horizontal' && size === 'default' && 'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        orientation === 'vertical' && size === 'default' && 'data-[state=checked]:translate-y-5 data-[state=unchecked]:translate-y-0',
        orientation === 'horizontal' && size === 'sm' && 'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        orientation === 'vertical' && size === 'sm' && 'data-[state=checked]:translate-y-4 data-[state=unchecked]:translate-y-0'
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
