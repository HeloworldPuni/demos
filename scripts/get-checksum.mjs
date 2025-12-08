
import { getAddress } from 'viem';

const invalidAddr = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
try {
    const valid = getAddress(invalidAddr);
    console.log("VALID:", valid);
} catch (e) {
    console.error("Error:", e.message);
    // Try to recover from lowercase if the input itself was bad
    console.log("LOWER->CHECKSUM:", getAddress(invalidAddr.toLowerCase()));
}
