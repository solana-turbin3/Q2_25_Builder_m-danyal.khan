import wallet from "../my-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair); // umi actually creates a signer from your keypair

umi.use(irysUploader({address: "https://devnet.irys.xyz/"}));

umi.use(signerIdentity(signer)); // umi let's your keypair to act like a signer to sign txns on your behalf

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://devnet.irys.xyz/9wNzMr9jBPvAvRPwpg9tiPuRWRgBMwcEFJbpx7oLd1q7"
        const metadata = {
            name: "DANYAL_RUG_TURBIN3",
            symbol: "DRT",
            description: "A custom NFT created for fun",
            image: image,
            attributes: [
                { trait_type: "Category", value: "Learning" }
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "image"
                    },
                ]
            },
            creators: []
        };
       
        
        const myUri = await umi.uploader.uploadJson(metadata);
        console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();




// https://devnet.irys.xyz/9wNzMr9jBPvAvRPwpg9tiPuRWRgBMwcEFJbpx7oLd1q7