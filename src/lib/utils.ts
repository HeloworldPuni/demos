import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const METADATA = {
  name: "Base Cartel",
  description: "An onchain social strategy game on Base. Join the cartel, raid, betray, and earn yield.",
  bannerImageUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/banner.png` : "https://basecartel.in/banner.png",
  iconImageUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/icon.png` : "https://basecartel.in/icon.png",
  homeUrl: process.env.NEXT_PUBLIC_URL ?? (process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://basecartel.in"),
  splashBackgroundColor: "#000000"
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
