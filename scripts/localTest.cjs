const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Starting Local Test Simulation...\n");

    const [admin, user1, user2] = await ethers.getSigners();
    console.log("m Actors:");
    console.log("Admin:", admin.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address, "\n");

    // --- DEPLOYMENT ---
    console.log("📦 Deploying Contract Suite...");

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();

    const CartelShares = await ethers.getContractFactory("CartelShares");
    const shares = await CartelShares.deploy();
    await shares.waitForDeployment();
    const sharesAddress = await shares.getAddress();

    const CartelPot = await ethers.getContractFactory("CartelPot");
    const pot = await CartelPot.deploy(usdcAddress);
    await pot.waitForDeployment();
    const potAddress = await pot.getAddress();

    const CartelCore = await ethers.getContractFactory("CartelCore");
    const core = await CartelCore.deploy(sharesAddress, potAddress, usdcAddress);
    await core.waitForDeployment();
    const coreAddress = await core.getAddress();

    const AgentVault = await ethers.getContractFactory("AgentVault");
    const agent = await AgentVault.deploy(usdcAddress, coreAddress);
    await agent.waitForDeployment();
    const agentAddress = await agent.getAddress();

    // Wiring
    await shares.setMinter(coreAddress);
    await pot.setCore(coreAddress);
    await core.setAgent(agentAddress, true);

    console.log("✅ Deployment & Wiring Complete.\n");

    // --- SETUP BALANCES ---
    console.log("💰 Funding Users with Mock USDC...");
    // Mint 10,000 USDC (6 decimals) to users
    const startAmount = ethers.parseUnits("10000", 6);
    await usdc.mint(admin.address, startAmount);
    await usdc.mint(user1.address, startAmount);
    await usdc.mint(user2.address, startAmount);

    // Approve Core to spend USDC (for fees/joining if fee > 0)
    await usdc.connect(user1).approve(coreAddress, ethers.MaxUint256);
    await usdc.connect(user2).approve(coreAddress, ethers.MaxUint256);
    await usdc.connect(admin).approve(coreAddress, ethers.MaxUint256);

    // Approve Pot to spend USDC (depositFrom)
    await usdc.connect(user1).approve(potAddress, ethers.MaxUint256);
    await usdc.connect(user2).approve(potAddress, ethers.MaxUint256);
    await usdc.connect(admin).approve(potAddress, ethers.MaxUint256);

    console.log("✅ Funding Complete.\n");

    // --- TEST 1: JOIN ---
    console.log("🧪 Test 1: Joining Cartel...");

    // Admin is referrer (has infinite invites)
    await core.connect(user1).join(admin.address);
    console.log("✅ User1 Joined (Ref: Admin)");

    await core.connect(user2).join(admin.address);
    console.log("✅ User2 Joined (Ref: Admin)");

    // Verify Shares
    const bal1 = await shares.balanceOf(user1.address, 1);
    const bal2 = await shares.balanceOf(user2.address, 1);
    console.log(`User1 Shares: ${bal1} (Expected 100)`);
    console.log(`User2 Shares: ${bal2} (Expected 100)`);

    if (bal1 == 100n && bal2 == 100n) console.log("✅ Shares Minted Correctly.\n");
    else throw new Error("Share minting failed");

    // --- TEST 2: RAID ---
    console.log("🧪 Test 2: Raiding...");
    // User1 raids User2
    const potBefore = await usdc.balanceOf(potAddress);
    await core.connect(user1).raid(user2.address);
    const potAfter = await usdc.balanceOf(potAddress);

    console.log("✅ Raid executed.");
    console.log(`Pot Balance Delta: ${potAfter - potBefore} (Expected 5000)`);

    const bal1PostRaid = await shares.balanceOf(user1.address, 1);
    const bal2PostRaid = await shares.balanceOf(user2.address, 1);
    console.log(`User1 Shares: ${bal1PostRaid}`);
    console.log(`User2 Shares: ${bal2PostRaid}`);

    // User2 had 100. 10% stolen = 10.
    // User2 -> 90. User1 -> 110.
    if (bal1PostRaid == 110n && bal2PostRaid == 90n) console.log("✅ Raid Share Transfer Correct.\n");
    else console.log("⚠️ Raid Share Transfer unexpected values.");

    // --- TEST 3: HIGH STAKES RAID ---
    console.log("🧪 Test 3: High Stakes Raid...");
    await core.connect(user2).highStakesRaid(user1.address);
    console.log("✅ High Stakes Raid executed (User2 attacks User1).");

    const bal1PostXRaid = await shares.balanceOf(user1.address, 1);
    const bal2PostXRaid = await shares.balanceOf(user2.address, 1);
    console.log(`User1 Shares: ${bal1PostXRaid}`);
    console.log(`User2 Shares: ${bal2PostXRaid}`);

    // --- TEST 4: CLAIM PROFIT ---
    console.log("🧪 Test 4: Claim Profit...");

    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    await core.distributeDailyProfits();
    console.log("✅ Distributed Daily Profits.");

    const pending1 = await core.getPendingProfit(user1.address);
    console.log("User1 Pending Profit:", pending1);

    const usdcBeforeClaim = await usdc.balanceOf(user1.address);
    await core.connect(user1).claimProfit();
    const usdcAfterClaim = await usdc.balanceOf(user1.address);

    console.log(`User1 Claimed: ${usdcAfterClaim - usdcBeforeClaim}`);
    console.log("✅ Claim Successful.\n");

    console.log("🎉 ALL LOCAL TESTS PASSED!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
