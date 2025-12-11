# Base Cartel Deployment Guide (Remix Edition)

This is the **Master Guide** for deploying Base Cartel to **Base Mainnet**.

## 1. Setup in Remix
1. Go to [Remix IDE](https://remix.ethereum.org).
2. Create `contracts/` folder in Remix.
3. Upload these files from your local `contracts/` directory:
   - `CartelShares.sol`
   - `CartelPot.sol`
   - `CartelCore.sol`
   - `AgentVault.sol`
   - `IERC20.sol` (Dependency)

## 2. Compile
1. Open `CartelCore.sol` in Remix.
2. Go to **Solidity Compiler** tab.
3. Click **Compile**. (Green Check ✅)

## 3. Deploy (Strict Order)
Go to **Deploy & Run** tab. Select `Injected Provider - MetaMask`.
Ensure your wallet is connected to **Base Mainnet**.

> **IMPORTANT**: We use the native USDC on Base.
> **USDC Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Step A: Deploy Shares
- Contract: `CartelShares`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xSHARES...`)

### Step B: Deploy Pot
- Contract: `CartelPot`
- Constructor: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC Address)
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xPOT...`)

### Step C: Deploy Core
- Contract: `CartelCore`
- Constructor: 
    - `_shares`: `0xSHARES...`
    - `_pot`: `0xPOT...`
    - `_usdc`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xCORE...`)

### Step D: Deploy Agent
- Contract: `AgentVault`
- Constructor: 
    - `_usdc`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
    - `_core`: `0xCORE...`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xAGENT...`)

## 4. Wiring (CRITICAL)
In Remix "Deployed Contracts" list (expand each contract):

1. **Shares (0xSHARES...)**:
   - Find `setMinter`.
   - Argument: `0xCORE...` (Address of Core deployed in Step C).
   - **Transact**.

2. **Pot (0xPOT...)**:
   - Find `setCore`.
   - Argument: `0xCORE...` (Address of Core).
   - **Transact**.

3. **Core (0xCORE...)**:
   - Find `setAgent`.
   - Argument 1: `0xAGENT...` (Address of Agent).
   - Argument 2: `true` (Active status).
   - **Transact**.

## 5. Final Config
Update your Vercel Environment Variables or local `.env.local`:

```bash
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_CARTEL_SHARES_ADDRESS=0xSHARES...
NEXT_PUBLIC_CARTEL_POT_ADDRESS=0xPOT...
NEXT_PUBLIC_CARTEL_CORE_ADDRESS=0xCORE...
NEXT_PUBLIC_AGENT_VAULT_ADDRESS=0xAGENT...
```

