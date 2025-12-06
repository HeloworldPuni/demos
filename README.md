# 🎩 Base Cartel

> **The first on-chain PVP Cartel on Base.**
> Raid rivals, steal shares, and earn real yield.

**Live App**: [https://basecartel.in](https://basecartel.in)
**Status**: 🟡 **Testnet Phase** (Base Sepolia)

---

## ⚡ What is Base Cartel?
Base Cartel is a **high-stakes social strategy game** built on **Base** and **Farcaster**.
Players join a Cartel, mint shares, and compete for a daily growing pot of **USDC**.

### Key Mechanics
- **🤝 Join**: Mint shares to enter the cartel (Invite Only).
- **⚔️ Raid**: Attack other players to steal their shares (10% steal rate).
- **🔥 High-Stakes**: Risk your own shares to steal 20% of a rival's bag.
- **💰 Claim**: Harvest your cut of the daily revenue pool (Real USDC).
- **🩸 Betray**: Retire from the game and cash out your share of the treasury.

---

## 📋 Smart Contracts
The game logic is fully on-chain.

| Contract | Role |
|----------|------|
| **CartelCore** | Main game engine (Raids, Invites, Profit Distribution). |
| **CartelShares** | ERC-1155 tokens representing player power. |
| **CartelPot** | Treasury holding the USDC rewards. |
| **AgentVault** | Automates actions for power users. |
| **MockUSDC** | Testnet USDC for simulation. |

> ⚠️ **Deployment Pending**: Contracts are ready for deployment to Base Sepolia.

---

## 🚀 Deployment Guide
**WE RECOMMEND MANUAL DEPLOYMENT VIA REMIX TO BYPASS LOCAL ENVIRONMENT ISSUES.**

👉 **[READ THE DEPLOYMENT GUIDE (DEPLOYMENT.md)](./DEPLOYMENT.md)**

### Quick Summary
1.  Upload contracts to [Remix IDE](https://remix.ethereum.org).
2.  Deploy **USDC** -> **Shares** -> **Pot** -> **Core** -> **Agent**.
3.  Wire them together (link permissions).
4.  Update your `.env.local` with the new addresses.

---

## 🛠 Tech Stack
-   **Blockchain**: Base (Sepolia Testnet)
-   **Framework**: Next.js 14 + Wagmi + Viem
-   **Social**: Farcaster Frames & Mini-App
-   **Auth**: SIWE + Farcaster Auth (Privy/OnchainKit)
-   **Database**: Prisma (Postgres) - *Used for analytics & invites only. Truth is on-chain.*

---

## 🧪 Development

### Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Run Locally
```bash
npm run dev
```

### Run Tests
> **Note**: Local Hardhat runner may face compatibility issues on some Windows environments.
> We rely on **Remix** for verification.
> The core logic is verified in `contracts/`.

---

## 🔒 Security
-   **Non-Custodial**: You own your shares.
-   **Fair Launch**: No pre-mine. First raider wins.
-   **Audited Logic**: Protection against reentrancy and integer overflow.

---

## License
MIT