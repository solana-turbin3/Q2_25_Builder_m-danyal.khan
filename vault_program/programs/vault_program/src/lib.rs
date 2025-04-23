use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("AorQryQ4XuVbaY4prwab7sv8PDN3WTHMvJGbxfbZsVK3");

#[program]
pub mod vault_program {
    use super::*;
    
    pub fn initialize(ctx: Context<InitializeVault>) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps.state, ctx.bumps.vault)?;
        Ok(())
    }

    pub fn deposit_sol(ctx: Context<VaultInteraction>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn withdraw_sol(ctx: Context<VaultInteraction>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw(amount)
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        ctx.accounts.close_vault()
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        init,
        payer = funder,
        seeds = [b"state", funder.key().as_ref()],
        bump,
        space = VaultState::INIT_SPACE,
    )]
    pub state: Account<'info, VaultState>,

    #[account(
        seeds = [b"vault", funder.key().as_ref()],
        bump,
    )]
    /// CHECK: PDA to hold SOL
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeVault<'info> {
    pub fn initialize(&mut self, state_bump: u8, vault_bump: u8) -> Result<()> {
        self.state.vault_bump = vault_bump;
        self.state.state_bump = state_bump;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VaultInteraction<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = state.state_bump,
    )]
    pub state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = state.vault_bump,
    )]
    /// CHECK: PDA to hold SOL
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> VaultInteraction<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };
        let seeds = &[
            b"vault",
            self.user.key.as_ref(),
            &[self.state.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, amount)
    }
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = state.vault_bump,
    )]
    /// CHECK: PDA to hold SOL
    pub vault: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"state", authority.key().as_ref()],
        bump = state.state_bump,
        close = authority, // Return rent to the authority
    )]
    pub state: Account<'info, VaultState>,

    pub system_program: Program<'info, System>,
}

impl<'info> CloseVault<'info> {
    pub fn close_vault(&mut self) -> Result<()> {
        let lamports = self.vault.lamports();

        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.authority.to_account_info(),
        };
        let seeds = &[
            b"vault",
            self.authority.key.as_ref(),
            &[self.state.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, lamports)?;
        Ok(())
    }
}

#[account]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8,
}

impl Space for VaultState {
    const INIT_SPACE: usize = 8 + 1 + 1; // Discriminator + two u8s
}