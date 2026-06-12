import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.95) return "var(--success)";
  if (confidence >= 0.8) return "var(--warning)";
  return "var(--danger)";
}
