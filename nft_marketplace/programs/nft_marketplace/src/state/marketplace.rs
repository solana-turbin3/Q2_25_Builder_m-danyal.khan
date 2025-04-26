use anchor_lang::prelude::*;
#[account]
pub struct Marketplace {
    
    // The admin has special privileges,
    // such as creating accounts and PDAs and setting fees.
    pub admin: Pubkey,

    // Fee percentage in basis points (1/100 of 1%).
    // Example: 250 basis points = 2.5% fee on each sale.
    pub fee: u16,

    pub bump: u8,

    // pub rewards_bump : u8,

    // used to collect the fee during sales
    pub treasury_bump: u8,

    // Name of the marketplace,
    // used in PDA derivation and for identification purposes.
    pub name: String,
}

// space allocation during creating the account.
impl Space for Marketplace {
    const INIT_SPACE: usize = 8 + 32 + 2 + 3 * 1 + (4 + 32);
}
