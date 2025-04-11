import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../my-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

// Mint address (replace with actual mint address)
// EqXHXkSxHNtZazX23scEqWxP9DyUuiKuEN1qBnZ9if7H
// old -- HPrfGrHFotULWADboKCUNG7T1AVaanwTDHHoACpFpGPs
const mint = new PublicKey("EqXHXkSxHNtZazX23scEqWxP9DyUuiKuEN1qBnZ9if7H");

(async () => {
    try {
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey
        );

        console.log(`Your ATA is: ${ata.address.toBase58()}`);

        // Mint to ATA (corrected authority)
        const mintTx = await mintTo(
            connection,
            keypair,              // Signer (payer and authority)
            mint,                 // Mint address
            ata.address,          // Destination ATA
            keypair,              // Mint authority (signer)
            100n * token_decimals // Amount
        );
        console.log(`Your mint txid: ${mintTx}`);
    } catch (error) {
        console.log(`Oops, something went wrong: ${error}`);
    }
})();