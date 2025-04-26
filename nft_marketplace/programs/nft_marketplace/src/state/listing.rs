use anchor_lang::prelude::*;

// listing is a PDA derived from marketplace and NFT mint addresses
// used to store the info about maker/seller and the nft
#[account]
pub struct Listing {
        // this account belongs to maker
        pub maker: Pubkey,

        // the nft minted by the maker/seller
        pub maker_mint: Pubkey,
        
        pub price : u64,
        
        // use for verification of listing pda
        pub bump : u8,
}

impl Space for Listing {

    const INIT_SPACE: usize = 8 + 32 * 2 + 8 + 1;
}