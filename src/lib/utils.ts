import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

name: "Base Cartel",
  description: "An onchain social strategy game on Base. Join the cartel, raid, betray, and earn yield.",
    bannerImageUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/banner.png` : "https://i.imgur.com/2bsV8mV.png",
      iconImageUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/icon.png` : "https://i.imgur.com/brcnijg.png",
        homeUrl: process.env.NEXT_PUBLIC_URL ?? (process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://www.basecartel.in"),
          splashBackgroundColor: "#000000"
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
