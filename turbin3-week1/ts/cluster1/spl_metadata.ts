import wallet from "../my-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { 
    createMetadataAccountV3, 
    CreateMetadataAccountV3InstructionAccounts, 
    CreateMetadataAccountV3InstructionArgs,
    DataV2Args
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// Define our Mint address
// new --   EqXHXkSxHNtZazX23scEqWxP9DyUuiKuEN1qBnZ9if7H
// old --   HPrfGrHFotULWADboKCUNG7T1AVaanwTDHHoACpFpGPs  i.e. dk
const mint = publicKey("EqXHXkSxHNtZazX23scEqWxP9DyUuiKuEN1qBnZ9if7H")

// Create a UMI connection
const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
    try {
       
        let accounts: CreateMetadataAccountV3InstructionAccounts = {
           mint,
           mintAuthority : signer 
           
        }

        let data: DataV2Args = {
            name: "DanyalCoin",
            symbol:"DCOIN",
            uri: "",
            sellerFeeBasisPoints: 5,
            creators: null,
            collection: null,
            uses : null,

        }

        // let data: DataV2Args = {
        //     ???
        // }

        let args: CreateMetadataAccountV3InstructionArgs = {
         data : data,
         isMutable : false,
         collectionDetails:null,

        }

        let tx = createMetadataAccountV3(
            umi,
            {
                ...accounts,
                ...args
            }
        )

        let result = await tx.sendAndConfirm(umi);
        console.log(bs58.encode(result.signature));
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();