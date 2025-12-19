// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockUSDC.sol";
import "./CartelShares.sol";
import "./CartelPot.sol";
import "./CartelCore.sol";
import "./AgentVault.sol";

/**
 * @title CartelDeployer
 * @dev Single-click deployment contract for Remix usage.
 * Replaces the complex manual wiring steps.
 */
contract CartelDeployer {
    MockUSDC public usdc;
    CartelShares public shares;
    CartelPot public pot;
    CartelCore public core;
    AgentVault public agent;

    constructor() {
        // 1. Deploy MockUSDC
        usdc = new MockUSDC();

        // 2. Deploy CartelShares
        shares = new CartelShares();

        // 3. Deploy CartelPot
        pot = new CartelPot(address(usdc));

        // 4. Deploy CartelCore
        core = new CartelCore(address(shares), address(pot), address(usdc));

        // 5. Deploy AgentVault
        agent = new AgentVault(address(usdc), address(core));

        // --- WIRING PERMISSIONS ---

        // 6. Shares: Set Core as Minter
        shares.setMinter(address(core));

        // 7. Pot: Set Core as Controller/Core
        pot.setCore(address(core));

        // 8. Core: Approve AgentVault
        core.setAgent(address(agent), true);
        
        // Transfer ownership to the actual deployer (msg.sender) so they can manage it later
        // Note: The Deployer contract itself initially holds ownership rights if not careful.
        // We must ensure 'Ownable' logic transfers correctly or we just leave it set up.
        // Usually OpenZeppelin Ownable defaults to msg.sender (this contract).
        // We should transfer ownership of the children to the human deployer.
        
        shares.transferOwnership(msg.sender);
        pot.transferOwnership(msg.sender);
        core.transferOwnership(msg.sender);
        agent.transferOwnership(msg.sender);
        // USDC usually doesn't have owner or it's just a mock.
    }
}
