# 📜 Smart Contract Overview

This document provides a technical overview of the Base Cartel smart contract system.

## 1. CartelCore.sol (V2)
**Role:** The main game logic controller. Handles joining, raiding, fees, and profit distribution.

### Key Features (V2)
*   **Activity-Based Yield:** Shares are "Score" (Non-Yielding) by default. Users must `raid` (pay fees) to unlock Yield.
    *   *Mechanism*: `join/refer` = Locked Shares. `raid` = Unlocks 10 Yield Shares.
*   **Accumulator Claim System:** Uses `accUSDCPerShare` for scalable, O(1) profit distribution.
    *   *Math*: `Pending = (yieldShares * acc) - debt`.
*   **Commit-Reveal RNG:** Prevents raid simulation cheating.
    *   *Flow*: `commitRaid` (User) -> Wait 1 block -> `revealRaid` (Keeper/User).

### Storage Variables
*   `sharesContract` (CartelShares): Reference to the ERC1155 shares contract.
*   `pot` (CartelPot): Reference to the treasury contract holding USDC.
*   `usdc` (IERC20): Reference to the USDC token contract.
*   `JOIN_SHARES` (uint256): Shares (100) minted upon joining (Non-Yielding).
*   `accUSDCPerShare` (uint256): Global accumulator for yield.
*   `yieldShares` (mapping): Amount of shares unlocked for yield per user.
*   `rewardDebt` (mapping): User's debt for accumulator math.
*   `JOIN_FEE` (uint256): Cost to join (0).
*   `RAID_FEE` (uint256): Cost to raid (5000 = 0.005 USDC). Unlocks 10 Yield Shares.
*   `pendingRaids` (mapping): Stores commit data for RNG.

### Functions
*   `join(address referrer)`
    *   **Public:** Mints 100 Shares (Score). Grants 0 Yield. Checks referrer is active.
*   `commitRaid(address target)`
    *   **Public:** Starts a raid. Pays fee. Stores hash(block + user).
*   `revealRaid(bytes32 requestId)`
    *   **Public:** Resolves raid using blockhash. Unlocks Yield. Steals shares.
*   `claimProfit()`
    *   **Public:** Payouts USDC based on `yieldShares`.


---

## 3. CartelPot.sol
**Role:** The treasury vault that holds the actual USDC funds.

### Storage Variables
*   `usdc` (IERC20): Reference to the USDC token.
*   `core` (address): Address of the CartelCore contract.

### Functions
*   `setCore(address _core)`
    *   **Admin:** Sets the authorized Core contract address.
*   `depositFrom(address from, uint256 amount)`
    *   **Core Only:** Pulls USDC from a user into the Pot (requires approval).
*   `withdraw(address to, uint256 amount)`
    *   **Admin:** Sends USDC from the Pot to a destination (used for payouts).
*   `getBalance()`
    *   **View:** Returns the current USDC balance of the Pot.

---

## 4. AgentVault.sol
**Role:** Handles "Session Keys" and gasless transactions via EIP-712 signatures.

### Storage Variables
*   `usdc` (IERC20): Reference to USDC.
*   `cartelCore` (ICartelCore): Reference to the main game contract.
*   `balances` (mapping): Tracks user USDC deposits allocated for agent actions.
*   `nonces` (mapping): Replay protection for signatures.

### Functions
*   `deposit(uint256 amount)`
    *   **Public:** User deposits USDC into the vault to fund future agent actions.
*   `withdraw(uint256 amount)`
    *   **Public:** User withdraws their unused USDC.
*   `executeAction(address user, string action, bytes data, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`
    *   **Public (Relayer):** Executes a signed action (like "raid") on behalf of a user. Verifies signature, deducts fee from vault balance, and calls CartelCore.
