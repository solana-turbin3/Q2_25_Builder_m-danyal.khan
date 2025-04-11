import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../my-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
    try {
        // Create the mint and await the result
        const mint = await createMint(
            connection,           // Connection to the network
            keypair,             // Payer of the transaction fees
            keypair.publicKey,   // Mint authority
            null,                // Freeze authority (null means no freeze authority)
            6                    // Decimals
        );
        
        // Log the mint address
        console.log("Mint created successfully! Mint Public Key:", mint.toBase58());
    } catch (error) {
        console.error(`Oops, something went wrong: ${error}`);
    }
})();