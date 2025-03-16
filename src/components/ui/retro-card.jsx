// src/components/ui/retro-card.jsx
import * as React from "react";
import { cn } from "@/lib/utils";

const RetroCard = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-2 border-b-gray-500 border-r-gray-500 border-t-white border-l-white bg-gray-100 rounded-none shadow-md",
      className
    )}
    {...props}
  />
));
RetroCard.displayName = "RetroCard";

const RetroCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 items-center justify-between bg-gradient-to-r from-[#C999F8] to-[#D8B5FF] px-4 text-white",
      className
    )}
    {...props}
  />
));
RetroCardHeader.displayName = "RetroCardHeader";

const RetroCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-bold", className)}
    {...props}
  />
));
RetroCardTitle.displayName = "RetroCardTitle";

const RetroCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  />
));
RetroCardContent.displayName = "RetroCardContent";

export { RetroCard, RetroCardHeader, RetroCardTitle, RetroCardContent };