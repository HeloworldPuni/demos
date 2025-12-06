const hre = require("hardhat");

async function main() {
    console.log("Hardhat version:", hre.version);
    console.log("Network:", hre.network.name);
    const [deployer] = await hre.ethers.getSigners();
    console.log("Signer works:", deployer ? deployer.address : "No signer");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
