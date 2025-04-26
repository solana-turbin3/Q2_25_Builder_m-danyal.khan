use crate::state::{marketplace::Marketplace, listing::Listing};
use crate::error::MarketplaceError;
use anchor_lang::{prelude::*, system_program::{Transfer, transfer}};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

// This Instruction allows a taker to purchase a listed NFT from the marketplace,
// Handles payment to maker/seller, marketplace fees, and NFT transfer.
#[derive(Accounts)]
pub struct Purchase<'info> {
    // taker will pay for NFT purchase
    #[account(mut)]
    pub taker: Signer<'info>,
    
    // The maker who listed the NFT
    #[account(mut)]
    pub maker: SystemAccount<'info>,

    // The marketplace account that this listing belongs to
    // Verified using seeds derivation
    #[account(
        seeds = [b"marketplace", marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info, Marketplace>,

    // Treasury account that receives marketplace fees
    #[account(mut)]
    pub treasury: SystemAccount<'info>,

    // The mint address of the NFT being purchased
    pub maker_mint: InterfaceAccount<'info, Mint>,

    // The taker's token account that will receive the NFT
    // Created if it doesn't exist already
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = maker_mint,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_ata: InterfaceAccount<'info, TokenAccount>,

    // The taker's reward token account
    // For receiving marketplace reward tokens (if implemented)
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = reward_mint,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_rewards_ata: InterfaceAccount<'info, TokenAccount>,

    // vault token account
    #[account(
        init_if_needed, 
        payer = taker,
        associated_token::mint = maker_mint, // holds NFT
        associated_token::authority = listing, // controlled by listing PDA
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    // The listing account for this NFT
    // Contains price and seller information
    #[account(
        mut,
        seeds = [marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,

    // The mint address of the collection this NFT belongs to
    // Used for verification purposes
    pub collection_mint: InterfaceAccount<'info, Mint>,

    // The mint address of the reward token
    // Used for distributing marketplace rewards
    pub reward_mint: InterfaceAccount<'info, Mint>,

    // Required for creating associated token accounts
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    // Required for SOL transfers
    pub system_program: Program<'info, System>,
    
    // Required for token operations
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Purchase<'info> {
    
    // sending sol from taker to maker and treasury fee
    pub fn send_sol(&mut self) -> Result<()> {
        // Calculates the marketplaec fee based on listing price and fee percentage
        // Converts fee percentage from basis points (1/100 of 1%) to a proper multiplier
        let marketplace_fee: u64 = (self.marketplace.fee as u64)
            .checked_mul(self.listing.price)
            .ok_or(MarketplaceError::Overflow)?  // Handle multiplication overflow
            .checked_div(10000_u64)
            .ok_or(MarketplaceError::Underflow)?;  // Handle division underflow (unlikely with constant divisor)

        // Set up payment to seller (price minus marketplace fee)
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.taker.to_account_info(),
            to: self.maker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Calculate amount to send to seller (price minus fee)
        let amount: u64 = self.listing.price
            .checked_sub(marketplace_fee)
            .ok_or(MarketplaceError::Underflow)?;
        
        // Transfer SOL to seller
        transfer(cpi_ctx, amount)?;

        // Set up payment of marketplace fee to treasury
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.taker.to_account_info(),
            to: self.treasury.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Transfer marketplace fee to treasury acc
        transfer(cpi_ctx, marketplace_fee)
    }
    
    
    // transfering NFT to the taker after succ purchase
    pub fn transfer_nft(&mut self) -> Result<()> {
        // Get the token program for CPI
        let cpi_program = self.token_program.to_account_info();
    
        // Create the transfer accounts structure for CPI
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.maker_mint.to_account_info(),
            to: self.taker_ata.to_account_info(),
            authority: self.listing.to_account_info(),
        };

        // Store keys in variables to prevent temporary value dropped errors
        let marketplace_key = self.marketplace.key();
        let maker_mint_key = self.maker_mint.key();
        
        // Create signer seeds for the listing PDA
        let seeds = &[
            marketplace_key.as_ref(),
            maker_mint_key.as_ref(),
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Create the CPI context with signer seeds
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program, 
            cpi_accounts, 
            signer_seeds
        );

        // Execute the transfer (amount=1 for NFTs)
        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)
    }
    
 
    // purchase execution function
    pub fn execute_purchase(&mut self) -> Result<()> {
        // First handle the SOL payment by taker
        self.send_sol()?;
        
        // Then transfer the NFT to the taker
        self.transfer_nft()?;
        
        Ok(())
    }
}