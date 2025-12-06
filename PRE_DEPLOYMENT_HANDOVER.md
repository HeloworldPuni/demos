# Pre-Deployment Audit & Fixes Report

## ✔️ Completed Tasks

### 1. MockUSDC (6 Decimals)
- Created `contracts/MockUSDC.sol` with explicit 6 decimals to match Base Sepolia USDC.
- Updated deployment script to deploy this mock first.

### 2. Contract Wiring
- Updated `scripts/deploy.ts` to automatically execute:
  - `shares.setMinter(core)`
  - `pot.setCore(core)`
  - `core.setAgent(agent, true)`

### 3. Deployment Order
- Verified order in `scripts/deploy.ts`:
  1. MockUSDC
  2. CartelShares
  3. CartelPot
  4. CartelCore
  5. AgentVault

### 4. Frontend Wiring
- **JoinCartel.tsx**: Now calls `core.join(referrer)`. Uses API only to resolve invite code to referrer address.
- **RaidModal.tsx**: Now calls `core.raid(target)` or `core.highStakesRaid(target)`. Added `targetAddress` prop.
- **BetrayModal.tsx**: Now calls `core.retireFromCartel()`.
- **CartelDashboard.tsx**: Now reads `Shares`, `Pot Balance`, `Earnings` directly from smart contracts.
- **Claim**: Added `core.claimProfit()` call in Dashboard.

### 5. Unit Tests / Local Simulation
- Created `test/FullSimulation.test.js` which verifies the entire game loop:
  - Join (Mint Shares)
  - Raid (Logic + Fees)
  - High Stakes Raid (Steal + Burn)
  - Claim Profit (Distribution + Withdraw)

### 6. Intel Randomization
- API `/api/agent/suggest-raid` now returns `{ min, max }` shares and `confidence` score.
- UI `AutoAgentPanel` updated to display the range.

## 🚀 Next Steps

### 1. Run Local Tests
Verify everything locally before deploying.
```bash
npx hardhat test test/FullSimulation.test.js
```

### 2. Deploy to Base Sepolia
Make sure your `.env.local` has `WALLET_PRIVATE_KEY` and `NEXT_PUBLIC_BASE_SEPOLIA_RPC` (or use Alchemy/Infura default).
```bash
npx hardhat run scripts/deploy.ts --network base-sepolia
```

### 3. Post-Deployment
After deployment, copy the addresses printed in the terminal and update your `.env.local`:
```
NEXT_PUBLIC_CARTEL_CORE_ADDRESS=0x...
NEXT_PUBLIC_CARTEL_POT_ADDRESS=0x...
NEXT_PUBLIC_CARTEL_SHARES_ADDRESS=0x...
NEXT_PUBLIC_AGENT_VAULT_ADDRESS=0x...
```
