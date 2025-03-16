"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const retroButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 border-2 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,0.2)]",
  {
    variants: {
      variant: {
        default:
          "bg-[#C999F8] border-[#9370DB] hover:bg-[#D8B5FF] text-white",
        secondary:
          "bg-[#00FFFF] border-[#00CCCC] hover:bg-[#80FFFF] text-black",
        outline:
          "bg-white border-gray-400 hover:bg-gray-100 text-gray-800",
        destructive:
          "bg-red-500 border-red-700 hover:bg-red-600 text-white",
        os: 
          "bg-gray-200 border-b-gray-600 border-r-gray-600 border-t-white border-l-white hover:bg-gray-300 text-black",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const RetroButton = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(retroButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
RetroButton.displayName = "RetroButton";

export { RetroButton, retroButtonVariants };