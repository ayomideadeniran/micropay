
import { CashuMint, CashuWallet, MintQuoteState, Proof } from '@cashu/cashu-ts';

const mintUrl = 'https://testnut.cashu.space';

export const getCashuWallet = () => {
    const mint = new CashuMint(mintUrl);
    return new CashuWallet(mint);
};

// --- Balance Functions ---

export const getWalletBalance = (): number => {
    const proofs = getStoredProofs();
    return proofs.reduce((acc, proof) => acc + proof.amount, 0);
};

// --- Spending Functions ---

export const payInvoice = async (invoice: string): Promise<{ isPaid: boolean; newBalance: number }> => {
    const wallet = getCashuWallet();
    const proofs = getStoredProofs();
    
    try {
        const { isPaid, change } = await wallet.pay(invoice, proofs);
        
        if (isPaid) {
            // If payment is successful, update the stored proofs with the change
            storeProofs(change);
        }
        
        return { isPaid, newBalance: getWalletBalance() };
    } catch (error) {
        console.error("Cashu payment failed:", error);
        return { isPaid: false, newBalance: getWalletBalance() };
    }
};


// --- Minting Functions (for funding the wallet) ---

export const createMintQuote = async (amount: number) => {
    const wallet = getCashuWallet();
    await wallet.loadMint();
    return wallet.createMintQuote(amount);
};

export const pollForPaidInvoice = async (quoteId: string) => {
    const wallet = getCashuWallet();
    let attempts = 0;
    const maxAttempts = 20;
    const interval = 3000; // 3 seconds

    while (attempts < maxAttempts) {
        try {
            const mintQuoteChecked = await wallet.checkMintQuote(quoteId);
            if (mintQuoteChecked.state === MintQuoteState.PAID) {
                return true;
            }
        } catch (error) {
            console.error('Error checking mint quote:', error);
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    return false;
};

export const mintTokens = async (amount: number, quoteId: string): Promise<Proof[]> => {
    const wallet = getCashuWallet();
    await wallet.loadMint();

    const proofs = await wallet.mintProofs(amount, quoteId);
    storeProofs(proofs);
    return proofs;
};


// --- Local Storage Functions ---

export const storeProofs = (proofs: Proof[]) => {
    // Filter out any proofs that might be undefined or invalid before storing
    const validProofs = proofs.filter(p => p && p.amount > 0);
    localStorage.setItem('cashu_proofs', JSON.stringify(validProofs));
};

export const getStoredProofs = (): Proof[] => {
    const proofs = localStorage.getItem('cashu_proofs');
    return proofs ? JSON.parse(proofs) : [];
};

