import { Howl } from "howler";

// Check if window is defined to avoid SSR issues
const isClient = typeof window !== "undefined";

export const SFX = {
    click: isClient ? new Howl({ src: ["/sounds/click.mp3"], volume: 0.2 }) : null,
    coin: isClient ? new Howl({ src: ["/sounds/coin.wav"], volume: 0.25 }) : null,
    slash: isClient ? new Howl({ src: ["/sounds/slash.wav"], volume: 0.3 }) : null,
    ping: isClient ? new Howl({ src: ["/sounds/ping.wav"], volume: 0.2 }) : null,
    error: isClient ? new Howl({ src: ["/sounds/error.wav"], volume: 0.25 }),
    // Placeholder methods to prevent crashes if SFX is called during SSR or if null
    play: (key: keyof typeof SFX) => {
        if (SFX[key] && typeof (SFX[key] as Howl).play === 'function') {
            (SFX[key] as Howl).play();
        }
    }
};

// Helper to safe play
export const playSound = (sound: 'click' | 'coin' | 'slash' | 'ping' | 'error') => {
    try {
        if (!isClient) return;

        // Check user preference from localStorage
        const sfxEnabled = localStorage.getItem("sfxEnabled");
        if (sfxEnabled === "false") return;

        SFX[sound]?.play();
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};
