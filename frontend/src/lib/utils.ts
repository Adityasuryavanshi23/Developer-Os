import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Tailwind class helper — combines clsx + tailwind-merge
// Usage: cn("px-4 py-2", isActive && "bg-blue-500", "text-white")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
