use crate::state::{listing::Listing, marketplace::Marketplace};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        MasterEditionAccount, Metadata,
        MetadataAccount,
    },
    token::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

// Delist Instruction actually
// 1. returns the NFT from vault to the maker ata
// 2. closes the listing account and rent back to the maker
#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    // The marketplace account this listing belongs to
    // Used for verifying listing PDA via seeds and bump
    #[account(
        seeds = [b"marketplace", marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info, Marketplace>,

    // minted nft by maker
    pub maker_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = maker_mint, // holds minted nft
        associated_token::authority = listing, // controlled by listing PDA
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    // derived from listing PDA and belongs 
    // to the maker
    #[account(
        mut,
        seeds = [marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump = listing.bump,
        constraint = listing.maker == maker.key(),
        close = maker // closes the accounts and rent back to maker
    )]
    pub listing: Account<'info, Listing>,

    // The mint address of the collection this NFT belongs to
    pub collection_mint: InterfaceAccount<'info, Mint>,

    // Metadata account of the NFT being delisted
    #[account(
        seeds = [b"metadata", metadata_program.key().as_ref(), maker_mint.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub metadata: Account<'info, MetadataAccount>,

    // Master edition account of the NFT
    #[account(
        seeds = [b"metadata", metadata_program.key().as_ref(), maker_mint.key().as_ref(), b"edition"],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,

    pub metadata_program: Program<'info, Metadata>,

    /// Required for associated token account operations
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// Required for system operations
    pub system_program: Program<'info, System>,

    // Required for token operations
    // Used to transfer NFT from vault back to owner
    pub token_program: Interface<'info, TokenInterface>,
}

/// Implementation of the delist instruction logic
impl<'info> Delist<'info> {
    pub fn withdraw_nft(&mut self) -> Result<()> {
        // Get the token program for CPI
        let cpi_program = self.token_program.to_account_info();

        // setting up accounts
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.maker_mint.to_account_info(),
            to: self.maker_ata.to_account_info(),
            authority: self.listing.to_account_info(), // controlled by listing PDA
        };

        // Store keys in variables to prevent temporary value dropped errors
        // These are needed for PDA signing derivation
        let marketplace_key = self.marketplace.key();
        let maker_mint_key = self.maker_mint.key();

        let seeds = &[
            marketplace_key.as_ref(),
            maker_mint_key.as_ref(),
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        // Execute the transfer
        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)
    }

    // actual functions execution
    pub fn execute_delist(&mut self) -> Result<()> {
        // Transfer the NFT back to the maker
        self.withdraw_nft()?;
        Ok(())
    }
}