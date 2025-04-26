use crate::error::MarketplaceError;
use crate::state::marketplace::Marketplace;
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    // admin will be the signer who pays all the rent
    // for PDAs in the initialized marketplace
    #[account(mut)]
    pub admin: Signer<'info>,
    
    // marketplace PDA used to stores configuration
    // information about the marketplace
    #[account(
        init,
        payer = admin,
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump,
        space = Marketplace::INIT_SPACE,
    )]
    pub marketplace: Account<'info, Marketplace>,

    /// Treasury account pda that will be receive marketplace fees
    #[account(
        seeds = [b"treasury", marketplace.key().as_ref()],
        bump,
    )]
    pub treasury: SystemAccount<'info>,

    // owned by marketplace PDA used to incentives the users
    // with rewards tokens in thier wallets based on activities
    #[account(
        init,
        payer = admin,
        seeds = [b"rewards", marketplace.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = marketplace,
        mint::token_program = token_program,
    )]
    pub reward_mint: InterfaceAccount<'info, Mint>,

    /// Required for creating new accounts
    pub system_program: Program<'info, System>,

    /// Required for token operations
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, name: String, fee: u16, bumps: &InitializeBumps) -> Result<()> {
        // Validate fee mean to ensure it's not greater than 100%
        require!(fee <= 10000, MarketplaceError::InvalidFee);

        // Initialize the marketplace state/account with provided values
        self.marketplace.set_inner(Marketplace {
            admin: self.admin.key(),
            fee,
            bump: bumps.marketplace,
            treasury_bump: bumps.treasury,
            name,
        });

        Ok(())
    }
}