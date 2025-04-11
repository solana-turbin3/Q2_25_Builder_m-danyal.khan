import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../my-wallet.json"
import base58 from "bs58";

// const RPC_ENDPOINT = "";
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())



const mint = generateSigner(umi);

(async () => {
    try {
        let tx = await createNft(umi, {
            mint,
            name: "DANYAL_RUG_TURBIN3",
            symbol: "DRT",
            uri: "https://devnet.irys.xyz/9drbGCTchGnXNFsp9wfCS7ozkoPJpXSwcAAeX5Gh75pD",
            sellerFeeBasisPoints: percentAmount(5),
        });


    let result = await tx.sendAndConfirm(umi); // umi will send txn to blockchain and wait for confirmation untill success or fail
    const signature = base58.encode(result.signature);
    
    console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);

        console.log("Mint Address: ", mint.publicKey);
    } catch (error) {
        console.error("Oops.. Something went wrong", error);
    }
})();



// https://devnet.irys.xyz/
// https://devnet.irys.xyz/9drbGCTchGnXNFsp9wfCS7ozkoPJpXSwcAAeX5Gh75pD 