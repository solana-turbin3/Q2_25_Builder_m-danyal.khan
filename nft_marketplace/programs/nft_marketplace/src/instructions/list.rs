use crate::state::{marketplace::Marketplace, listing::Listing};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

// This Instruction allows a user/maker to list an NFT for sale on the
//  marketplace, also creates a listing PDA and transfers the NFT to a vault
#[derive(Accounts)]
pub struct List<'info> {
    // maker will pay for all account's rent
    #[account(mut)]
    pub maker: Signer<'info>,

    // The marketplace account that this specefic listing belongs to
    #[account(
        seeds = [b"marketplace", marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info, Marketplace>,

    // NFT minted by the maker in Token NFT Account
    pub maker_mint: InterfaceAccount<'info, Mint>,

    // maker Token Account, where NFT will be trnsfr to vault
    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata: InterfaceAccount<'info, TokenAccount>,

    // Token Account to hold the minted nft by maker,
    // controlled by listing PDA for txns i.e. transfer
    #[account(
        init, 
        payer = maker,
        associated_token::mint = maker_mint,
        associated_token::authority = listing,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

  
    // listing account stores info about listed nft like maker, maker_mint etc
    #[account(
        init,
        payer = maker,
        seeds = [marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump,
        space = Listing::INIT_SPACE,
    )]
    pub listing: Account<'info, Listing>,

    // The mint address of the collection, this NFT belongs to.
    // Used for verification of collection membership
    pub collection_mint: InterfaceAccount<'info, Mint>,
    
    // Metadata account of the NFT being listed, used to
    // verify that the nft belongs to the specefied collection
    #[account(
        seeds = [b"metadata", metadata_program.key().as_ref(), maker_mint.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key == collection_mint.key(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
    )]
    pub metadata: Account<'info, MetadataAccount>,
    
    // Master edition account of the NFT, used to
    // verify this is an original NFT (not a print)
    #[account(
        seeds = [b"metadata", metadata_program.key().as_ref(), maker_mint.key().as_ref(), b"edition"],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,

    // Metaplex Token Metadata program,
    // used for constraint validation
    pub metadata_program: Program<'info, Metadata>,
    
    // Required for creating associated token accounts for both
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    pub system_program: Program<'info, System>, // for creating accounts 
    
    pub token_program: Interface<'info, TokenInterface>, // for token operations
}

// creating a new listing with specefied price
impl<'info> List <'info> {
    pub fn create_listing(&mut self, price: u64, bumps: &ListBumps) -> Result<()> {
        self.listing.set_inner(Listing {
            maker: self.maker.key(), 
            maker_mint: self.maker_mint.key(), 
            price, 
            bump: bumps.listing
        });

        Ok(())
    }

    // depositing NFT from maker's ata to vault
    pub fn deposit_nft(&mut self) -> Result<()> {
        // Get the token program for CPI
        let cpi_program = self.token_program.to_account_info();
    
        
        let cpi_accounts = TransferChecked {
            from: self.maker_ata.to_account_info(),
            mint: self.maker_mint.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info()
        };

        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Executing the transfer (always amount=1 for NFTs, decimals from mint)
        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)
    }
}