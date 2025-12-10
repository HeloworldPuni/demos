const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const COMPILED_DIR = path.join(__dirname, "../contracts/compiled");
const ARTIFACTS_DIR = path.join(__dirname, "../artifacts/sanity");
const RPC_URL = "http://127.0.0.1:8599";

async function main() {
    console.log("🚀 Starting MANUAL deployment (Ethers standalone)...");

    // Retry loop for connection
    let provider;
    let connected = false;
    for (let i = 0; i < 15; i++) {
        try {
            provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
            const network = await provider.getNetwork();
            console.log(`📡 Connected to chain ID: ${network.chainId}`);
            connected = true;
            break;
        } catch (e) {
            console.log(`Waiting for node... (${i + 1}/15)`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    if (!connected) {
        throw new Error("Failed to connect to JSON-RPC node");
    }

    const signer = await provider.getSigner();
    console.log("📝 Deploying with:", await signer.getAddress());

    if (!fs.existsSync(ARTIFACTS_DIR)) {
        fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    }

    const deploy = async (name, args = []) => {
        console.log(`📦 Deploying ${name}...`);

        let fileName = `${name}.abi`;
        // Map short names to long solc output names
        const map = {
            "MockUSDC": "contracts_MockUSDC_sol_MockUSDC",
            "CartelShares": "contracts_CartelShares_sol_CartelShares",
            "CartelPot": "contracts_CartelPot_sol_CartelPot",
            "CartelCore": "contracts_CartelCore_sol_CartelCore",
            "AgentVault": "contracts_AgentVault_sol_AgentVault"
        };

        const baseName = map[name] || name;
        const abiPath = path.join(COMPILED_DIR, `${baseName}.abi`);
        const binPath = path.join(COMPILED_DIR, `${baseName}.bin`);

        if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
            throw new Error(`Artifacts not found for ${name} at ${abiPath}`);
        }

        const abi = fs.readFileSync(abiPath, "utf8");
        const bin = fs.readFileSync(binPath, "utf8");

        const factory = new ethers.ContractFactory(abi, bin, signer);
        const contract = await factory.deploy(...args);
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`✅ ${name} deployed to: ${address}`);
        return contract;
    };

    // 1. MockUSDC
    const usdc = await deploy("MockUSDC");
    const usdcAddress = await usdc.getAddress();

    // 2. CartelShares
    const shares = await deploy("CartelShares");
    const sharesAddress = await shares.getAddress();

    // 3. CartelPot
    const pot = await deploy("CartelPot", [usdcAddress]);
    const potAddress = await pot.getAddress();

    // 4. CartelCore
    const core = await deploy("CartelCore", [sharesAddress, potAddress, usdcAddress]);
    const coreAddress = await core.getAddress();

    // 5. AgentVault
    const agent = await deploy("AgentVault", [usdcAddress, coreAddress, potAddress]);
    const agentAddress = await agent.getAddress();

    // Permissions
    console.log("🔐 Setting up permissions...");
    // We need contract instances with the signer connected
    // ethers v6 ContractFactory.deploy returns a connected contract

    await (await shares.setMinter(coreAddress)).wait();
    await (await pot.setCore(coreAddress)).wait();
    await (await core.setAgent(agentAddress, true)).wait();

    console.log("✅ Permissions set");

    const addresses = {
        MockUSDC: usdcAddress,
        CartelShares: sharesAddress,
        CartelPot: potAddress,
        CartelCore: coreAddress,
        AgentVault: agentAddress
    };

    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, "deployed_addresses.json"),
        JSON.stringify(addresses, null, 2)
    );
    console.log(`\n💾 Addresses saved to artifacts/sanity/deployed_addresses.json`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
