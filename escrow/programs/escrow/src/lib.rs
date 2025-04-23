
use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("7EF7sSWeayUcNzZZngdCj6vTgUef4U3g3Jz3BTyZd88h");

#[program]
pub mod escrow {
    use super::*;

    
    // make instructionm
    pub fn make(ctx: Context<Make>, seed: u64, deposit: u64, receive: u64) -> Result<()> {
        ctx.accounts.deposit(deposit)?; // sends token into vault
        ctx.accounts.init_escrow(seed, receive, &ctx.bumps) // creates an escrow pda
    }

    // refund instruction
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault() // sends token back to maker and close vault
    }


    // - deposit, withdraw, close vault
    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?; // taker deposits mint_b
        ctx.accounts.withdraw_and_close_vault() // release to taker's ata_a and close vault
    }
}