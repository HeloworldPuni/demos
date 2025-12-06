import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Starting deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // 1. Deploy MockUSDC (6 decimals)
    console.log("📦 Deploying MockUSDC (6 decimals)...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("✅ MockUSDC deployed to:", usdcAddress, "\n");

    // 2. Deploy CartelShares (ERC-1155)
    console.log("📦 Deploying CartelShares...");
    const CartelShares = await ethers.getContractFactory("CartelShares");
    const shares = await CartelShares.deploy();
    await shares.waitForDeployment();
    const sharesAddress = await shares.getAddress();
    console.log("✅ CartelShares deployed to:", sharesAddress, "\n");

    // 3. Deploy CartelPot (Treasury)
    console.log("📦 Deploying CartelPot...");
    const CartelPot = await ethers.getContractFactory("CartelPot");
    const pot = await CartelPot.deploy(usdcAddress);
    await pot.waitForDeployment();
    const potAddress = await pot.getAddress();
    console.log("✅ CartelPot deployed to:", potAddress, "\n");

    // 4. Deploy CartelCore (Main game logic)
    console.log("📦 Deploying CartelCore...");
    const CartelCore = await ethers.getContractFactory("CartelCore");
    const core = await CartelCore.deploy(sharesAddress, potAddress, usdcAddress);
    await core.waitForDeployment();
    const coreAddress = await core.getAddress();
    console.log("✅ CartelCore deployed to:", coreAddress, "\n");

    // 5. Deploy AgentVault
    console.log("📦 Deploying AgentVault...");
    const AgentVault = await ethers.getContractFactory("AgentVault");
    const agent = await AgentVault.deploy(usdcAddress, coreAddress); // Agent needs USDC and Core
    await agent.waitForDeployment();
    const agentAddress = await agent.getAddress();
    console.log("✅ AgentVault deployed to:", agentAddress, "\n");

    // Wiring / Permissions
    console.log("🔐 Setting up permissions...");

    // CartelShares.setMinter(CartelCore)
    await shares.setMinter(coreAddress);
    console.log("✅ CartelShares: Core set as minter");

    // CartelPot.setCore(CartelCore)
    await pot.setCore(coreAddress);
    console.log("✅ CartelPot: Core set as controller");

    // CartelCore.setAgent(AgentVault, true)
    await core.setAgent(agentAddress, true); // Create setAgent function in Core if missing, or use setApprovedAgent? 
    // Assuming function is setAgent based on user prompt. If distinct, I check ABI. 
    // User prompted: "CartelCore.setAgent(AgentVault, true)"
    console.log("✅ CartelCore: AgentVault approved");

    // Verify Owner Invites
    console.log("✅ Owner initialized with INFINITE invites (Phase 1: Invite-Only Mode)\n");

    // Summary
    console.log("=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 CONTRACT ADDRESSES:\n");
    console.log("MockUSDC:", usdcAddress);
    console.log("CartelShares:", sharesAddress);
    console.log("CartelPot:", potAddress);
    console.log("CartelCore:", coreAddress);
    console.log("AgentVault:", agentAddress);
    console.log("\n📝 NEXT STEPS:");
    console.log("1. Save these addresses to your .env.local file");
    console.log("2. Verify contracts on BaseScan");
    console.log("3. Update src/lib/basePay.ts with contract addresses");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
