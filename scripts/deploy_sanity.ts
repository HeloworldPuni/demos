import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Starting sanity deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with:", deployer.address);

    // 1. Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("✅ MockUSDC:", usdcAddress);

    // 2. Deploy CartelShares
    const CartelShares = await ethers.getContractFactory("CartelShares");
    const shares = await CartelShares.deploy();
    await shares.waitForDeployment();
    const sharesAddress = await shares.getAddress();
    console.log("✅ CartelShares:", sharesAddress);

    // 3. Deploy CartelPot
    const CartelPot = await ethers.getContractFactory("CartelPot");
    const pot = await CartelPot.deploy(usdcAddress);
    await pot.waitForDeployment();
    const potAddress = await pot.getAddress();
    console.log("✅ CartelPot:", potAddress);

    // 4. Deploy CartelCore
    const CartelCore = await ethers.getContractFactory("CartelCore");
    const core = await CartelCore.deploy(sharesAddress, potAddress, usdcAddress);
    await core.waitForDeployment();
    const coreAddress = await core.getAddress();
    console.log("✅ CartelCore:", coreAddress);

    // 5. Deploy AgentVault
    const AgentVault = await ethers.getContractFactory("AgentVault");
    const agent = await AgentVault.deploy(usdcAddress, coreAddress);
    await agent.waitForDeployment();
    const agentAddress = await agent.getAddress();
    console.log("✅ AgentVault:", agentAddress);

    // Permissions
    await shares.setMinter(coreAddress);
    await pot.setCore(coreAddress);
    await core.setAgent(agentAddress, true);

    console.log("✅ Permissions set");

    // Save Addresses
    const addresses = {
        MockUSDC: usdcAddress,
        CartelShares: sharesAddress,
        CartelPot: potAddress,
        CartelCore: coreAddress,
        AgentVault: agentAddress
    };

    const sanityDir = path.join(__dirname, "../artifacts/sanity");
    if (!fs.existsSync(sanityDir)) {
        fs.mkdirSync(sanityDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(sanityDir, "deployed_addresses.json"),
        JSON.stringify(addresses, null, 2)
    );
    console.log(`\n💾 Addresses saved to artifacts/sanity/deployed_addresses.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
