import { METADATA } from "../../../lib/utils";

export async function GET() {
  const config = {
    accountAssociation: {
      header: "", // TODO: PASTE YOUR HEADER FROM BASE DEVELOPER PORTAL HERE
      payload: "", // TODO: PASTE YOUR PAYLOAD FROM BASE DEVELOPER PORTAL HERE
      signature: "", // TODO: PASTE YOUR SIGNATURE FROM BASE DEVELOPER PORTAL HERE
    },
    "frame": {
      "version": "1",
      "name": METADATA.name,
      "iconUrl": METADATA.iconImageUrl,
      "homeUrl": METADATA.homeUrl,
      "imageUrl": METADATA.bannerImageUrl,
      "splashImageUrl": METADATA.iconImageUrl,
      "splashBackgroundColor": METADATA.splashBackgroundColor,
      "description": METADATA.description,
      "ogTitle": METADATA.name,
      "ogDescription": METADATA.description,
      "ogImageUrl": METADATA.bannerImageUrl,
      "requiredCapabilities": [
        "actions.ready",
        "actions.signIn",
        "actions.openMiniApp",
        "actions.openUrl",
        "actions.sendToken",
        "actions.viewToken",
        "actions.composeCast",
        "actions.viewProfile",
        "actions.setPrimaryButton",
        "actions.swapToken",
        "actions.close",
        "actions.viewCast",
        "wallet.getEthereumProvider"
      ],
      "requiredChains": [
        "eip155:8453",
        "eip155:10"
      ],
      "canonicalDomain": "http://localhost:3000",
      "noindex": false,
      "tags": ["base", "baseapp", "miniapp", "game", "strategy", "base-cartel"]
    },
    "baseBuilder": {
      "allowedAddresses": ["0x8342A48694A74044116F330db5050a267b28dD85"],
    }
  };

  return Response.json(config);
}
