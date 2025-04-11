import wallet from "../my-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet)); // creating keypair from your private key using eddsa algo.
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({ address: "https://devnet.irys.xyz/"})); // used lrys for decentralized storage
umi.use(signerIdentity(signer));

(async () => {
    try {
        //1. Load image
        //2. Convert image to generic file.
        //3. Upload image

        
      // https://devnet.irys.xyz/9wNzMr9jBPvAvRPwpg9tiPuRWRgBMwcEFJbpx7oLd1q7
        const image = await readFile("/home/dkdanyal_123/turbin3-week1/solana-starter/ts/cluster1/rugNFt.png"); // loads the image file
        const genericFile = createGenericFile(image, 'image.png', {contentType: "image/png"}); // converts that img to genericFile format

        const [myUri] = await umi.uploader.upload([genericFile]); // uploads to lrys (decentralized Storage Solution)

        console.log("Your image URI: ", myUri);


        
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
