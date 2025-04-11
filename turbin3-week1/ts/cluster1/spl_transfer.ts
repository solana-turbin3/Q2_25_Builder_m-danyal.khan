import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../my-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Define token decimals
const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("HPrfGrHFotULWADboKCUNG7T1AVaanwTDHHoACpFpGPs");

// Recipient address
const to = new PublicKey("DUTsHAhrnDdUqzUaDpcUM1dxjqj1L9GnwXXfBGSvW1po");

(async () => {
    try {
        // Get or create the sender's ATA
        const fromAta = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey
        );
        console.log(`My ATA is: ${fromAta.address.toBase58()}`);

        // Get or create the recipient's ATA
        const toAta = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            to
        );
        console.log(`Destination ATA is: ${toAta.address.toBase58()}`);

        // Transfer tokens from sender's ATA to recipient's ATA
        const txTransfer = await transfer(
            connection,
            keypair,              // Payer and signer
            fromAta.address,      // Source ATA
            toAta.address,        // Destination ATA
            keypair,              // Owner of the source ATA (signer)
            1n * token_decimals   // Amount to transfer
        );

        console.log(`Transfer transaction ID: ${txTransfer}`);
    } catch (e) {
        console.error(`Oops, something went wrong: ${e}`);
    }
})();