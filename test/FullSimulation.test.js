const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full E2E Simulation", function () {
    let admin, user1, user2;
    let usdc, shares, pot, core, agent;

    it("Should act as the Local Simulation Script", async function () {
        console.log("🚀 Starting Full Simulation Test...\n");

        [admin, user1, user2] = await ethers.getSigners();
        console.log("🎭 Actors:", admin.address, user1.address, user2.address);

        // --- DEPLOYMENT ---
        console.log("📦 Deploying Contract Suite...");

        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDC.deploy();
        await usdc.waitForDeployment();
        console.log("✅ MockUSDC deployed");

        const CartelShares = await ethers.getContractFactory("CartelShares");
        shares = await CartelShares.deploy();
        await shares.waitForDeployment();

        const CartelPot = await ethers.getContractFactory("CartelPot");
        pot = await CartelPot.deploy(await usdc.getAddress());
        await pot.waitForDeployment();

        const CartelCore = await ethers.getContractFactory("CartelCore");
        core = await CartelCore.deploy(await shares.getAddress(), await pot.getAddress(), await usdc.getAddress());
        await core.waitForDeployment();

        const AgentVault = await ethers.getContractFactory("AgentVault");
        agent = await AgentVault.deploy(await usdc.getAddress(), await core.getAddress());
        await agent.waitForDeployment();

        // Wiring
        await shares.setMinter(await core.getAddress());
        await pot.setCore(await core.getAddress());
        await core.setAgent(await agent.getAddress(), true);

        console.log("✅ Deployment & Wiring Complete.\n");

        // --- SETUP BALANCES ---
        console.log("💰 Funding Users with Mock USDC...");
        const startAmount = ethers.parseUnits("10000", 6);
        await usdc.mint(admin.address, startAmount);
        await usdc.mint(user1.address, startAmount);
        await usdc.mint(user2.address, startAmount);

        await usdc.connect(user1).approve(await core.getAddress(), ethers.MaxUint256);
        await usdc.connect(user2).approve(await core.getAddress(), ethers.MaxUint256);
        await usdc.connect(admin).approve(await core.getAddress(), ethers.MaxUint256);

        await usdc.connect(user1).approve(await pot.getAddress(), ethers.MaxUint256);
        await usdc.connect(user2).approve(await pot.getAddress(), ethers.MaxUint256);
        await usdc.connect(admin).approve(await pot.getAddress(), ethers.MaxUint256);

        console.log("✅ Funding Complete.\n");

        // --- TEST 1: JOIN ---
        console.log("🧪 Test 1: Joining Cartel...");

        await core.connect(user1).join(admin.address);
        await core.connect(user2).join(admin.address);

        const bal1 = await shares.balanceOf(user1.address, 1);
        const bal2 = await shares.balanceOf(user2.address, 1);

        expect(bal1).to.equal(100n);
        expect(bal2).to.equal(100n);
        console.log("✅ Shares Minted Correctly.\n");

        // --- TEST 2: RAID ---
        console.log("🧪 Test 2: Raiding...");
        const potBefore = await usdc.balanceOf(await pot.getAddress());
        await core.connect(user1).raid(user2.address);
        const potAfter = await usdc.balanceOf(await pot.getAddress());

        expect(potAfter - potBefore).to.equal(5000n);
        console.log("✅ Pot Balance Increased by 5000.");

        const bal1PostRaid = await shares.balanceOf(user1.address, 1);
        const bal2PostRaid = await shares.balanceOf(user2.address, 1);

        // Normal raid steals 10% (100 * 0.1 = 10)
        expect(bal1PostRaid).to.equal(110n);
        expect(bal2PostRaid).to.equal(90n);
        console.log("✅ Raid Share Transfer Correct.\n");

        // --- TEST 3: HIGH STAKES RAID ---
        console.log("🧪 Test 3: High Stakes Raid...");
        await core.connect(user2).highStakesRaid(user1.address);

        const bal1PostXRaid = await shares.balanceOf(user1.address, 1);
        const bal2PostXRaid = await shares.balanceOf(user2.address, 1);

        // User1 Had: 110. User2 Had: 90.
        // Steal 20% of 110 = 22.
        // Self Penalty 3% of 90 = 2.7 -> 2.
        // User1: 110 - 22 = 88.
        // User2: 90 + 22 - 2 = 110.
        expect(bal1PostXRaid).to.equal(88n);
        expect(bal2PostXRaid).to.equal(110n);
        console.log("✅ High Stakes Logic Verified.\n");

        // --- TEST 4: CLAIM PROFIT ---
        console.log("🧪 Test 4: Claim Profit...");

        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine", []);

        await core.distributeDailyProfits();

        const pending1 = await core.getPendingProfit(user1.address);
        expect(pending1).to.be.gt(0);

        const usdcBeforeClaim = await usdc.balanceOf(user1.address);
        await core.connect(user1).claimProfit();
        const usdcAfterClaim = await usdc.balanceOf(user1.address);

        expect(usdcAfterClaim).to.be.gt(usdcBeforeClaim);
        console.log("✅ Claim Successful.\n");

        console.log("🎉 ALL SIMULATION CHECKS PASSED!");
    });
});
