export const IconX = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// Base (Coinbase L2) Logo - Approximate (Circle with dot)
export const IconBase = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a5 5 0 100-10 5 5 0 000 10z" />
    </svg>
);

// Farcaster Logo
export const IconFarcaster = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M18.24 2H5.76C3.68 2 2 3.68 2 5.76v12.48C2 20.32 3.68 22 5.76 22h12.48c2.08 0 3.76-1.68 3.76-3.76V5.76C22 3.68 20.32 2 18.24 2zM16.8 17.6h-1.6l-1.2-3.2h-4l-1.2 3.2H7.2l4.8-12.8h1.6l4.8 12.8zm-3.6-6.4l-1.2-3.2-1.2 3.2h2.4z" />
    </svg>
);

