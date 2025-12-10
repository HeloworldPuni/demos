

// USDC contract address on Base Mainnet
// USDC contract address on Localhost
export const USDC_ADDRESS = '0x07a1C8387f3cC7C8012aeDdBCe7fb765C3AdA4db';

// Contract addresses (Local Ganache)
export const CARTEL_CORE_ADDRESS = '0x25e2c4Eba68F18591DfAF70BDC25b14B3aDdA987';
export const CARTEL_POT_ADDRESS = '0x971e88eA6DF0877b3bb8890ae211296866cb6b83';
export const CARTEL_SHARES_ADDRESS = '0x2D25b44c75AB2C5291e5b05354E54A6978f99855';

// Fee constants (in USDC, 6 decimals)
export const JOIN_FEE = BigInt(0); // FREE for Phase 1 (invite-only)
export const RAID_FEE = BigInt(5000);  // 0.005 USDC
export const HIGH_STAKES_RAID_FEE = BigInt(15000); // 0.015 USDC

// Paymaster config
export const PAYMASTER_AND_DATA = {
    paymasterAddress: '0x0000000000000000000000000000000000000000', // Base Paymaster address
};

export function formatUSDC(amount: bigint): string {
    return (Number(amount) / 1e6).toFixed(3);
}

export function parseUSDC(amount: string): bigint {
    return BigInt(Math.floor(parseFloat(amount) * 1e6));
}
