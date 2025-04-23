// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { VaultAnchor } from "../target/types/vault_program";

// describe("vault_program", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.VaultAnchor as Program<VaultAnchor>;

//   it("Is initialized!", async () => {
//     // Add your test here.
//     const tx = await program.methods.initialize().rpc();
//     console.log("Your transaction signature", tx);
//   });
// });


// import * as anchor from "@coral-xyz/anchor";
// import { Program, BN } from "@coral-xyz/anchor";
// import { VaultProgram } from "../target/types/vault_program";
// import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
// import { assert, expect } from 'chai';

// describe("vault_program", () => {
//   // Configure the client to use the local cluster
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.VaultProgram as Program<VaultProgram>;
//   const connection = provider.connection;
  
//   // Test accounts
//   let user: Keypair;
//   let statePda: PublicKey;
//   let vaultPda: PublicKey;
//   let stateBump: number;
//   let vaultBump: number;

//   before(async () => {
//     // Generate a new user keypair
//     user = Keypair.generate();
    
//     // Airdrop SOL to user (10 SOL)
//     await airdrop(provider, user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
//   });

//   // Helper function to airdrop SOL
//   async function airdrop(provider: anchor.AnchorProvider, to: PublicKey, amount: number) {
//     const sig = await provider.connection.requestAirdrop(to, amount);
//     await provider.connection.confirmTransaction({
//       signature: sig,
//       blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
//       lastValidBlockHeight: (await provider.connection.getLatestBlockhash()).lastValidBlockHeight
//     });
//   }

//   // Test 1: Initialize Vault
//   it("should initialize the vault", async () => {
//     // Find PDAs for state and vault accounts
//     [statePda, stateBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("state"), user.publicKey.toBuffer()],
//       program.programId
//     );
//     [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("vault"), user.publicKey.toBuffer()],
//       program.programId
//     );

//     // Call initialize function
//     const tx = await program.methods.initialize()
//       .accounts({
//         funder: user.publicKey,
//          state: statePda,
//         vault: vaultPda,
//         systemProgram: SystemProgram.programId
//       })
//       .signers([user])
//       .rpc();

//     console.log("Initialize transaction signature:", tx);

//     // Verify state account was created correctly
//     const stateAccount = await program.account.vaultState.fetch(statePda);
//     assert.equal(stateAccount.stateBump, stateBump, "State bump mismatch");
//     assert.equal(stateAccount.vaultBump, vaultBump, "Vault bump mismatch");
//   });

//   // Test 2: Deposit SOL
//   it("should deposit SOL into vault", async () => {
//     const depositAmount = new BN(5 * anchor.web3.LAMPORTS_PER_SOL); // 5 SOL
    
//     // Get initial balances
//     const initialUserBalance = await connection.getBalance(user.publicKey);
//     const initialVaultBalance = await connection.getBalance(vaultPda);

//     // Call deposit function
//     const tx = await program.methods.depositSol(depositAmount)
//       .accounts({
//         user: user.publicKey,
//         state: statePda,
//         vault: vaultPda,
//         systemProgram: SystemProgram.programId
//       })
//       .signers([user])
//       .rpc();

//     console.log("Deposit transaction signature:", tx);

//     // Verify balances changed correctly
//     const finalUserBalance = await connection.getBalance(user.publicKey);
//     const finalVaultBalance = await connection.getBalance(vaultPda);

//     expect(finalVaultBalance).to.equal(
//       initialVaultBalance + depositAmount.toNumber(),
//       "Vault didn't receive funds"
//     );
//     expect(finalUserBalance).to.be.lessThan(
//       initialUserBalance - depositAmount.toNumber(),
//       "User balance didn't decrease properly"
//     );
//   });

//   // Test 3: Withdraw SOL
//   it("should withdraw SOL from vault", async () => {
//     const withdrawAmount = new BN(2 * anchor.web3.LAMPORTS_PER_SOL); // 2 SOL
    
//     // Get initial balances
//     const initialUserBalance = await connection.getBalance(user.publicKey);
//     const initialVaultBalance = await connection.getBalance(vaultPda);

//     // Call withdraw function
//     const tx = await program.methods.withdrawSol(withdrawAmount)
//       .accounts({
//         user: user.publicKey,
//         state: statePda,
//         vault: vaultPda,
//         systemProgram: SystemProgram.programId
//       })
//       .signers([user])
//       .rpc();

//     console.log("Withdraw transaction signature:", tx);

//     // Verify balances changed correctly
//     const finalUserBalance = await connection.getBalance(user.publicKey);
//     const finalVaultBalance = await connection.getBalance(vaultPda);

//     expect(finalVaultBalance).to.equal(
//       initialVaultBalance - withdrawAmount.toNumber(),
//       "Vault balance didn't decrease"
//     );
//     expect(finalUserBalance).to.be.greaterThan(
//       initialUserBalance + withdrawAmount.toNumber() - 10000, // Account for fees
//       "User didn't receive funds"
//     );
//   });

//   // Test 4: Close Vault
//   it("should close the vault and return funds", async () => {
//     // Get initial balances
//     const initialUserBalance = await connection.getBalance(user.publicKey);
//     const initialVaultBalance = await connection.getBalance(vaultPda);

//     // Call closeVault function
//     const tx = await program.methods.closeVault()
//       .accounts({
//         authority: user.publicKey,
//         vault: vaultPda,
//         state: statePda,
//         systemProgram: SystemProgram.programId
//       })
//       .signers([user])
//       .rpc();

//     console.log("Close vault transaction signature:", tx);

//     // Verify accounts are closed
//     const stateAccount = await program.account.vaultState.fetchNullable(statePda);
//     expect(stateAccount).to.be.null("State account should be closed");

//     const vaultAccountInfo = await connection.getAccountInfo(vaultPda);
//     expect(vaultAccountInfo).to.be.null("Vault account should be closed");

//     // Verify user received funds back (minus transaction fees)
//     const finalUserBalance = await connection.getBalance(user.publicKey);
//     expect(finalUserBalance).to.be.greaterThan(
//       initialUserBalance + initialVaultBalance - 20000, // Account for fees
//       "User didn't receive vault funds"
//     );
//   });

//   // Test 5: Fail to deposit too much
//   it("should fail when depositing more than user balance", async () => {
//     // Try to deposit 100 SOL (user only has about 3 SOL left after previous tests)
//     const excessiveAmount = new BN(100 * anchor.web3.LAMPORTS_PER_SOL);

//     try {
//       await program.methods.depositSol(excessiveAmount)
//         .accounts({
//           user: user.publicKey,
//           state: statePda,
//           vault: vaultPda,
//           systemProgram: SystemProgram.programId
//         })
//         .rpc();
//       assert.fail("Should have failed");
//     } catch (err) {
//       expect(err.message).to.include("InsufficientFunds");
//     }
//   });
// });


// ============================================

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { VaultProgram } from "../target/types/vault_program";
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { assert, expect } from 'chai';
import * as fs from "fs";

describe("vault_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VaultProgram as Program<VaultProgram>;
  const connection = provider.connection;
  
  let user: Keypair;
  let statePda: PublicKey;
  let vaultPda: PublicKey;
  let stateBump: number;
  let vaultBump: number;

  before(async () => {
    // Load the CLI-generated keypair
    const keypairPath = "/home/dkdanyal_123/.config/solana/id.json"; // Adjust this path if needed
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    user = Keypair.fromSecretKey(new Uint8Array(secretKey));
    console.log("Loaded CLI user keypair:", user.publicKey.toBase58());

    // Airdrop SOL to the user if needed
    const balance = await connection.getBalance(user.publicKey);
    if (balance < 10 * anchor.web3.LAMPORTS_PER_SOL) {
      await airdrop(provider, user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
      console.log("Airdropped 10 SOL to user");
    } else {
      console.log("User already has sufficient balance:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
    }
  });

  async function airdrop(provider: anchor.AnchorProvider, to: PublicKey, amount: number) {
    const sig = await provider.connection.requestAirdrop(to, amount);
    await provider.connection.confirmTransaction({
      signature: sig,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (await provider.connection.getLatestBlockhash()).lastValidBlockHeight
    });
  }

  it("should initialize the vault", async () => {
    [statePda, stateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), user.publicKey.toBuffer()],
      program.programId
    );
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), user.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initialize()
      .accountsStrict({
        funder: user.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    const stateAccount = await program.account.vaultState.fetch(statePda);
    assert.equal(stateAccount.stateBump, stateBump, "State bump mismatch");
    assert.equal(stateAccount.vaultBump, vaultBump, "Vault bump mismatch");
  });

  it("should deposit SOL into vault", async () => {
    const depositAmount = new BN(5 * anchor.web3.LAMPORTS_PER_SOL);

    const initialUserBalance = await connection.getBalance(user.publicKey);
    console.log("User balance before deposit:", initialUserBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

    const initialVaultBalance = await connection.getBalance(vaultPda);

    const tx = await program.methods
      .depositSol(depositAmount)
      .accountsStrict({
        user: user.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Deposit transaction signature:", tx);

    const finalUserBalance = await connection.getBalance(user.publicKey);
    console.log("User balance after deposit:", finalUserBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

    const finalVaultBalance = await connection.getBalance(vaultPda);

    expect(finalVaultBalance).to.equal(
      initialVaultBalance + depositAmount.toNumber(),
      "Vault didn't receive funds"
    );
    expect(finalUserBalance).to.be.lessThan(
      initialUserBalance - depositAmount.toNumber() + 10000,
      "User balance didn't decrease properly"
    );
  });

  it("should withdraw SOL from vault", async () => {
    const withdrawAmount = new BN(2 * anchor.web3.LAMPORTS_PER_SOL);

    const initialUserBalance = await connection.getBalance(user.publicKey);
    const initialVaultBalance = await connection.getBalance(vaultPda);

    const tx = await program.methods
      .withdrawSol(withdrawAmount)
      .accountsStrict({
        user: user.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Withdraw transaction signature:", tx);

    const finalUserBalance = await connection.getBalance(user.publicKey);
    const finalVaultBalance = await connection.getBalance(vaultPda);

    expect(finalVaultBalance).to.equal(
      initialVaultBalance - withdrawAmount.toNumber(),
      "Vault balance didn't decrease"
    );
    expect(finalUserBalance).to.be.greaterThan(
      initialUserBalance + withdrawAmount.toNumber() - 10000,
      "User didn't receive funds"
    );
  });

  it("should fail when depositing more than user balance", async () => {
    const excessiveAmount = new BN(100 * anchor.web3.LAMPORTS_PER_SOL);

    try {
      await program.methods
        .depositSol(excessiveAmount)
        .accountsStrict({
          user: user.publicKey,
          state: statePda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have failed");
    } catch (err) {
      console.log("Error message:", err.message);
      expect(err.message).to.include("insufficient lamports");
    }
  });

  it("should close the vault and return funds", async () => {
    const initialUserBalance = await connection.getBalance(user.publicKey);
    const initialVaultBalance = await connection.getBalance(vaultPda);

    const tx = await program.methods
      .closeVault()
      .accountsStrict({
        authority: user.publicKey,
        vault: vaultPda,
        state: statePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Close vault transaction signature:", tx);

    const stateAccount = await program.account.vaultState.fetchNullable(statePda);
    expect(stateAccount).to.equal(null, "State account should be closed");

    const vaultAccountInfo = await connection.getAccountInfo(vaultPda);
    expect(vaultAccountInfo).to.equal(null, "Vault account should be closed");

    const finalUserBalance = await connection.getBalance(user.publicKey);
    expect(finalUserBalance).to.be.greaterThan(
      initialUserBalance + initialVaultBalance - 20000,
      "User didn't receive vault funds"
    );
  });
});