// tests

import { BN } from "bn.js";



const [maker, taker, mintA, mintB] = Array.from({ length: 4 }, () =>
    Keypair.generate()
  );
  
  const [makerAtaA, makerAtaB, takerAtaA, takerAtaB] = [maker, taker].map((a) =>
    [mintA, mintB].map((m) => ({
      getAssociatedTokenAddressSync(
        m.publicKey,
        a.publicKey,
        false,
        tokenProgram
      ),
    }))

    .flat()

const seed = new BN(randomBytes(8));

 const escrow publicKey.findProgramAddressSync(
    [
        Buffer.from ("escrow"),
        maker.publicKey.toBuffer()
    ]
 )

  );

   // sab sy pehly wo cheezen hamen implemnet karny hen jinki Zaroorat hogi for all the instructions
  // we will be writing tests for. the pre-req stuff are actually accounts, airdropping and mints etc
  // depends on the program
  
  // first needs to write all accounts that will be used in this program
  // then will create ATAs for both maker and taker
  // then will mint tokens for ATAs, we created
  // afer all foundational stuff done, then implement tests for each instruction step by step
  // like make, take, refund etc.
 