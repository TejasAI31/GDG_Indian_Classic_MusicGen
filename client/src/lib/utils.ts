// src/lib/utils.ts

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS class merger (alternative to clsx/classnames)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type helpers
export type ClassValue = string | number | boolean | null | undefined | ClassArray | ClassDictionary;
export type ClassArray = ClassValue[];
export type ClassDictionary = Record<string, unknown>;

// Date formatter
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Async sleep helper (for testing)
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));