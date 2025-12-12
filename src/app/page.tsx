import { Metadata } from "next";
import { LandingHero, FeaturesGrid, HowItWorks, GameplayShowcase, LandingFooter, LandingHeader } from "@/components/landing/LandingSections";
import { METADATA } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Base Cartel - Rule The Chain",
  description: "A social onchain cartel game built on Base. Join the cartel, raid rivals, and earn daily dividends.",
  openGraph: {
    title: "Base Cartel - Rule The Chain",
    description: "A social onchain cartel game built on Base. Join the cartel, raid rivals, and earn daily dividends.",
    images: [METADATA.bannerImageUrl],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: METADATA.bannerImageUrl,
      button: {
        title: "Join The Cartel",
        action: {
          type: "launch_miniapp",
          name: METADATA.name,
          url: METADATA.homeUrl,
          splashImageUrl: METADATA.iconImageUrl,
          splashBackgroundColor: METADATA.splashBackgroundColor,
        },
      },
    }),
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: METADATA.bannerImageUrl,
      button: {
        title: "Join The Cartel",
        action: {
          type: "launch_frame",
          name: METADATA.name,
          url: METADATA.homeUrl,
          splashImageUrl: METADATA.iconImageUrl,
          splashBackgroundColor: METADATA.splashBackgroundColor,
        },
      },
    }),
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0E12] text-white selection:bg-[#3DFF72] selection:text-black">
      <LandingHeader />
      <LandingHero />
      <FeaturesGrid />

      {/* Visual Break / Quote */}
      <section className="py-20 text-center px-4">
        <p className="text-2xl md:text-4xl font-serif italic text-zinc-500 opacity-50">
          "Plata o Plomo."
        </p>
      </section>

      <HowItWorks />

      <GameplayShowcase />

      <LandingFooter />
    </main>
  );
}
