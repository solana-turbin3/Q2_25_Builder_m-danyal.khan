use anchor_lang::prelude::*;
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use error::MarketplaceError;
pub use instructions::*;
pub use state::*;
declare_id!("8kcX6VNhE4ezp6HRJDXb7XoRueF25WduhE6JhwaeMkAR");


// This program suppors users to create NFT marketplaces for listing NFTS for sale
// also they can be purcahsed and auto fee deduction to marketplace account i.e. treasury account
// for future we can also include rewards-token distribution to users
#[program]
pub mod marketplace {
    use super::*;

    /// Creates a new marketplace with the specified configuration
    pub fn initialize(ctx: Context<Initialize>, name: String, fee: u16) -> Result<()> {
        // Handle validation
        require!(fee <= 10000, MarketplaceError::InvalidFee); // Max fee is 100% (10000 basis points)

        // Call the implementation function, in this case "init" from initialize instruction
        ctx.accounts.init(name, fee, &ctx.bumps)
    }
}