# Base Cartel Deployment Guide (Base Sepolia Testnet)

This is the **Testnet Guide** for deploying Base Cartel to **Base Sepolia**.

## 1. Setup in Remix
1. Go to [Remix IDE](https://remix.ethereum.org).
2. Create `contracts/` folder in Remix.
3. Upload these files from your local `contracts/` directory:
   - `MockUSDC.sol`
   - `CartelShares.sol`
   - `CartelPot.sol`
   - `CartelCore.sol`
   - `AgentVault.sol`
   - `IERC20.sol`

## 2. Compile
1. Open `CartelCore.sol` in Remix.
2. Go to **Solidity Compiler** tab.
3. Click **Compile**. (Green Check ✅)

## 3. Deploy (Strict Order)
Go to **Deploy & Run** tab. Select `Injected Provider - MetaMask`.
Ensure your wallet is connected to **Base Sepolia**.

### Step A: Deploy USDC (Mock)
- Contract: `MockUSDC`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xUSDC...`)

### Step B: Deploy Shares
- Contract: `CartelShares`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xSHARES...`)

### Step C: Deploy Pot
- Contract: `CartelPot`
- Constructor: `0xUSDC...` (MockUSDC Address from Step A)
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xPOT...`)

### Step D: Deploy Core
- Contract: `CartelCore`
- Constructor: 
    - `_shares`: `0xSHARES...`
    - `_pot`: `0xPOT...`
    - `_usdc`: `0xUSDC...`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xCORE...`)

### Step E: Deploy Agent
- Contract: `AgentVault`
- Constructor: 
    - `_usdc`: `0xUSDC...`
    - `_core`: `0xCORE...`
- **Deploy** -> Confirm.
- **Save Address** (e.g. `0xAGENT...`)

## 4. Wiring (CRITICAL)
In Remix "Deployed Contracts" list (expand each contract):

1. **Shares (0xSHARES...)**:
   - Find `setMinter`.
   - Argument: `0xCORE...`.
   - **Transact**.

2. **Pot (0xPOT...)**:
   - Find `setCore`.
   - Argument: `0xCORE...`.
   - **Transact**.

3. **Core (0xCORE...)**:
   - Find `setAgent`.
   - Argument 1: `0xAGENT...`.
   - Argument 2: `true`.
   - **Transact**.

## 5. Final Config
Update your Vercel Environment Variables or local `.env.local`:

```bash
NEXT_PUBLIC_USDC_ADDRESS=0xUSDC...
NEXT_PUBLIC_CARTEL_SHARES_ADDRESS=0xSHARES...
NEXT_PUBLIC_CARTEL_POT_ADDRESS=0xPOT...
NEXT_PUBLIC_CARTEL_CORE_ADDRESS=0xCORE...
NEXT_PUBLIC_AGENT_VAULT_ADDRESS=0xAGENT...
```

