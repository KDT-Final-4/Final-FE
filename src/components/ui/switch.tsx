"use client";
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border transition-all outline-none focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary/70",
        "data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400",
        "dark:data-[state=unchecked]:bg-slate-700 dark:data-[state=unchecked]:border-slate-500",
        "disabled:cursor-not-allowed disabled:opacity-90",
        "disabled:data-[state=checked]:bg-gray-300 disabled:data-[state=checked]:border-gray-400",
        "disabled:data-[state=unchecked]:bg-gray-300 disabled:data-[state=unchecked]:border-gray-400",
        className,
      )}
      style={props.disabled ? { 
        backgroundColor: '#d1d5db', 
        borderColor: '#9ca3af',
        opacity: 1 
      } : undefined}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none shadow-sm block size-4 rounded-full ring-0 transition-transform",
          "data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-0",
          "bg-card outline-input data-[state=unchecked]:bg-sidebar-primary",
          "dark:data-[state=unchecked]:bg-slate-200 dark:data-[state=checked]:bg-primary-foreground",
          "disabled:data-[state=unchecked]:bg-gray-500 disabled:data-[state=checked]:bg-gray-500",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
export { Switch };
