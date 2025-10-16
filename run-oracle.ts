import { SwapperFactory } from '@atomiqlabs/sdk';
import { StarknetInitializer, StarknetInitializerType } from '@atomiqlabs/chain-starknet';
import { promises as fs } from 'fs';
import path from 'path';
import { Account, RpcProvider, Contract, json } from 'starknet';
import 'dotenv/config';

// --- CONFIGURATION ---

const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7';
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
const PAYMENT_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const SWAPS_DB_PATH = path.resolve(process.cwd(), 'swaps.json');
const COMPILED_CONTRACT_PATH = path.resolve(process.cwd(), 'smart_contract/target/dev/smart_contract_PaymentManager.compiled_contract_class.json');


// --- HELPER FUNCTIONS ---

interface SwapData {
    swapId: string;
    userStarknetAddress: string;
    contentId: string;
    status: string;
  }

async function readSwaps(): Promise<SwapData[]> {
    try {
        await fs.access(SWAPS_DB_PATH);
        const data = await fs.readFile(SWAPS_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeSwaps(swaps: SwapData[]) {
    await fs.writeFile(SWAPS_DB_PATH, JSON.stringify(swaps, null, 2));
}

// --- MAIN ORACLE LOGIC ---

async function runOracle() {
    console.log('--- Oracle process started ---');

    if (!ORACLE_PRIVATE_KEY || !ORACLE_ADDRESS || !PAYMENT_MANAGER_ADDRESS) {
        console.error('Error: Missing required environment variables (ORACLE_PRIVATE_KEY, ORACLE_ADDRESS, NEXT_PUBLIC_CONTRACT_ADDRESS).');
        return;
    }

    // 1. Initialize Starknet provider and oracle account
    const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
    const oracleAccount = new Account(provider, ORACLE_ADDRESS, ORACLE_PRIVATE_KEY);

    // 2. Initialize Atomiq SDK
    const factory = new SwapperFactory([StarknetInitializer] as any);
    const swapper = await factory.newSwapper({
        rpcUrl: STARKNET_RPC_URL
    });

    // 3. Load the contract ABI
    const compiledContract = json.parse(await fs.readFile(COMPILED_CONTRACT_PATH, 'utf-8'));
    const paymentManager = new Contract(compiledContract.abi, PAYMENT_MANAGER_ADDRESS, oracleAccount);

    // 4. Get pending swaps from our DB
    const allSwaps = await readSwaps();
    const pendingSwaps = allSwaps.filter(s => s.status === 'PENDING_DEPOSIT');

    if (pendingSwaps.length === 0) {
        console.log('No pending swaps found.');
        console.log('--- Oracle process finished ---');
        return;
    }

    console.log(`Found ${pendingSwaps.length} pending swaps. Checking status...`);

    // 5. Check status of each pending swap
    for (const swapData of pendingSwaps) {
        try {
            console.log(`Checking swap: ${swapData.swapId}`);
            const swap = await swapper.getSwap(swapData.swapId);
            const status = await swap.getStatus();

            console.log(`Swap ${swapData.swapId} status: ${status}`);

            // 6. If swap is complete, unlock content on-chain
            if (status === 'DONE') {
                console.log(`Swap ${swapData.swapId} is complete. Unlocking content...`);

                // The creator address should ideally be stored with the content or swap data
                // For now, we'll use a placeholder from env variables
                const creatorAddress = process.env.NEXT_PUBLIC_CREATOR_ADDRESS;
                if (!creatorAddress) {
                    console.error(`Creator address not found for content ${swapData.contentId}. Skipping.`);
                    continue;
                }

                const call = paymentManager.populate('unlock_with_btc', {
                    user: swapData.userStarknetAddress,
                    content_id: swapData.contentId,
                    creator: creatorAddress,
                });
                
                const tx = await oracleAccount.execute(call);
                await provider.waitForTransaction(tx.transaction_hash);

                console.log(`Content unlocked for user ${swapData.userStarknetAddress}. Tx: ${tx.transaction_hash}`);

                // 7. Update swap status in DB
                swapData.status = 'COMPLETED';
                await writeSwaps(allSwaps);
                console.log(`Swap ${swapData.swapId} marked as COMPLETED.`);
            }
        } catch (error) {
            console.error(`Error processing swap ${swapData.swapId}:`, error);
        }
    }

    console.log('--- Oracle process finished ---');
}

runOracle().catch(console.error);