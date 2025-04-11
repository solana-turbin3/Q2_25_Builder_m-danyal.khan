import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./Turbin3-wallet.json";

// Create keypair from wallet
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
console.log("Wallet Public Key:", keypair.publicKey.toBase58());
const connection = new Connection("https://api.devnet.solana.com");
const github = Buffer.from("dev-danyal", "utf8");

// Set up Anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });

// Initialize program with IDL and provider only
const program = new Program<Turbin3Prereq>(IDL, provider);

// Define program ID for PDA
const programId = new PublicKey("Trb3aEx85DW1cEEvoqEaBkMn1tfmNEEEPaKzLSu4YAv");
const enrollment_seeds = [Buffer.from("preQ225"), keypair.publicKey.toBuffer()];
const [enrollment_key] = PublicKey.findProgramAddressSync(enrollment_seeds, programId);
console.log("Prereq Account (PDA):", enrollment_key.toBase58()); // Log the PDA

(async () => {
  try {
    const txhash = await program.methods
      .submit(github)
      .accounts({
        signer: keypair.publicKey,
        prereq: enrollment_key,
        system_program: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();