# Base Cartel Deployment Guide (Remix Edition)

This is the **Master Guide** for deploying Base Cartel. Ignore all other tutorials.

## 1. Setup in Remix
1. Go to [Remix IDE](https://remix.ethereum.org).
2. Create `contracts/` folder in Remix.
3. Upload these files from your local `contracts/` directory:
   - `MockUSDC.sol`
   - `CartelShares.sol`
   - `CartelPot.sol`
   - `CartelCore.sol`
   - `AgentVault.sol`

## 2. Compile
1. Open `CartelCore.sol` in Remix.
2. Go to **Solidity Compiler** tab.
3. Click **Compile**. (Green Check ✅)

## 3. Deploy (Strict Order)
Go to **Deploy & Run** tab. Select `Injected Provider - MetaMask`.
Ensure you are on **Base Sepolia**.

### Step A: Deploy USDC
- Contract: `MockUSDC`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xUSDC...`)

### Step B: Deploy Shares
- Contract: `CartelShares`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xSHARES...`)

### Step C: Deploy Pot
- Contract: `CartelPot`
- Constructor: `0xUSDC...`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xPOT...`)

### Step D: Deploy Core
- Contract: `CartelCore`
- Constructor: `0xSHARES...`, `0xPOT...`, `0xUSDC...`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xCORE...`)

### Step E: Deploy Agent
- Contract: `AgentVault`
- Constructor: `0xUSDC...`, `0xCORE...`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xAGENT...`)

## 4. Wiring (CRITICAL)
In Remix "Deployed Contracts" list:

1. **Shares** -> `setMinter(0xCORE...)` -> Transact.
2. **Pot** -> `setCore(0xCORE...)` -> Transact.
3. **Core** -> `setAgent(0xAGENT..., true)` -> Transact.

## 5. Final Config
Update your local `.env.local` with the new addresses:

```bash
NEXT_PUBLIC_USDC_ADDRESS=0xUSDC...
NEXT_PUBLIC_CARTEL_SHARES_ADDRESS=0xSHARES...
NEXT_PUBLIC_CARTEL_POT_ADDRESS=0xPOT...
NEXT_PUBLIC_CARTEL_CORE_ADDRESS=0xCORE...
NEXT_PUBLIC_AGENT_VAULT_ADDRESS=0xAGENT...
```

Then run `npm run dev` and test!
