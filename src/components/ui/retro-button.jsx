'use client';

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * RetroButton - A Windows 98/2000 style button component
 * 
 * Provides multiple variants:
 * - default: Standard Windows 98 gray button
 * - primary: Y2K themed colorful button
 * - outline: Outlined version
 * - destructive: Red "delete" style button
 * - link: Text-only link style
 */
const retroButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-[#C0C0C0] border-[1px] border-t-white border-l-white border-r-gray-600 border-b-gray-600 shadow-[1px_1px_0px_rgba(0,0,0,0.2)] active:border-t-gray-600 active:border-l-gray-600 active:border-r-white active:border-b-white",
        primary:
          "bg-gradient-to-r from-[#69EFD7] to-[#FED1EB] border-[1px] border-t-white border-l-white border-r-gray-600 border-b-gray-600 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-black font-bold active:border-t-gray-600 active:border-l-gray-600 active:border-r-white active:border-b-white",
        outline:
          "border-[1px] border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]",
        secondary:
          "bg-[#E6E6E6] border-[1px] border-t-white border-l-white border-r-gray-600 border-b-gray-600 shadow-[1px_1px_0px_rgba(0,0,0,0.2)] active:border-t-gray-600 active:border-l-gray-600 active:border-r-white active:border-b-white",
        destructive:
          "bg-red-200 hover:bg-red-300 border-[1px] border-t-white border-l-white border-r-red-600 border-b-red-600 shadow-[1px_1px_0px_rgba(0,0,0,0.2)] text-red-700 active:border-t-red-600 active:border-l-red-600 active:border-r-white active:border-b-white",
        link: "text-primary underline-offset-4 hover:underline",
        ghost: "bg-transparent hover:bg-gray-100 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
      // Y2K color themes
      theme: {
        default: "",
        mint: "!bg-gradient-to-r from-[#69EFD7] to-[#69EFD7]/80",
        pink: "!bg-gradient-to-r from-[#FED1EB] to-[#FED1EB]/80",
        neon: "!bg-gradient-to-r from-[#FE66FE] to-[#51F5FF]",
        retro: "!bg-gradient-to-r from-[#E7F227] to-[#293EFE]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      theme: "default",
    },
  }
);

/**
 * RetroButton Component
 * A Y2K/Windows 98 styled button component
 */
const RetroButton = React.forwardRef(
  ({ className, variant, size, theme, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(retroButtonVariants({ variant, size, theme, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
RetroButton.displayName = "RetroButton";

// RetroIconButton for square icon buttons with pixel art
const RetroIconButton = React.forwardRef(
  ({ className, icon, variant = "default", size = "icon", ...props }, ref) => {
    return (
      <RetroButton
        variant={variant}
        size={size}
        className={cn("p-0 flex items-center justify-center", className)}
        ref={ref}
        {...props}
      >
        {icon}
      </RetroButton>
    );
  }
);
RetroIconButton.displayName = "RetroIconButton";

export { RetroButton, RetroIconButton, retroButtonVariants };