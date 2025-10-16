import { SwapperFactory, StarknetInitializer, StarknetInitializerType, Swap, SwapState } from '@atomiqlabs/sdk';
import { Account, Contract, Provider, stark } from 'starknet';
import { promises as fs } from 'fs';
import path from 'path';
import 'dotenv/config';

// --- CONFIGURATION ---
const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL!;
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY!;
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_CREATOR_ADDRESS!; // Using creator address for oracle for simplicity
const PAYMENT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

const SWAPS_DB_PATH = path.resolve(process.cwd(), 'swaps.json');
const POLL_INTERVAL_MS = 10000; // 10 seconds

// --- TYPE DEFINITIONS ---
interface SwapRecord {
    swapId: string;
    userStarknetAddress: string;
    contentId: string;
    status: 'PENDING_DEPOSIT' | 'CONFIRMED' | 'FAILED';
}

// --- FILE-BASED DATABASE HELPERS ---
async function readSwaps(): Promise<SwapRecord[]> {
    try {
        await fs.access(SWAPS_DB_PATH);
        const data = await fs.readFile(SWAPS_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeSwaps(swaps: SwapRecord[]) {
    await fs.writeFile(SWAPS_DB_PATH, JSON.stringify(swaps, null, 2));
}

// --- ORACLE CLASS ---
class Oracle {
    private starknetProvider: Provider;
    private oracleAccount: Account;
    private paymentContract: Contract;
    private swapperFactory: SwapperFactory<[StarknetInitializerType]>;

    constructor() {
        if (!STARKNET_RPC_URL || !ORACLE_PRIVATE_KEY || !ORACLE_ADDRESS || !PAYMENT_CONTRACT_ADDRESS) {
            throw new Error('One or more environment variables are not set.');
        }

        this.starknetProvider = new Provider({ rpc: { nodeUrl: STARKNET_RPC_URL } });
        this.oracleAccount = new Account(this.starknetProvider, ORACLE_ADDRESS, ORACLE_PRIVATE_KEY);
        
        // A placeholder ABI for the unlock_with_btc function
        const contractAbi = [
            {
                "name": "unlock_with_btc",
                "type": "function",
                "inputs": [
                    { "name": "user", "type": "core::starknet::contract_address::ContractAddress" },
                    { "name": "content_id", "type": "core::felt252" },
                    { "name": "creator", "type": "core::starknet::contract_address::ContractAddress" }
                ],
                "outputs": [],
                "state_mutability": "external"
            }
        ];
        this.paymentContract = new Contract(contractAbi, PAYMENT_CONTRACT_ADDRESS, this.oracleAccount);

        this.swapperFactory = new SwapperFactory<[StarknetInitializerType]>([StarknetInitializer] as const);
    }

    async processPendingSwaps() {
        console.log('Checking for pending swaps...');
        const swaps = await readSwaps();
        const pendingSwaps = swaps.filter(s => s.status === 'PENDING_DEPOSIT');

        if (pendingSwaps.length === 0) {
            console.log('No pending swaps found.');
            return;
        }

        const swapper = await this.swapperFactory.newSwapper({
            starknet: { rpcUrl: STARKNET_RPC_URL }
        });

        for (const record of pendingSwaps) {
            console.log(`Processing swap: ${record.swapId}`);
            try {
                const swap = await swapper.get(record.swapId);
                const status = await swap.getStatus();

                console.log(`Swap ${record.swapId} status: ${status.state}`);

                // Check if the swap is confirmed on the Bitcoin side
                if (status.state === SwapState.BTC_TX_CONFIRMED) {
                    await this.finalizeOnStarknet(record);
                }

            } catch (error) {
                console.error(`Failed to process swap ${record.swapId}:`, error);
            }
        }
    }

    private async finalizeOnStarknet(record: SwapRecord) {
        console.log(`Finalizing swap ${record.swapId} on Starknet...`);
        try {
            const contentIdFelt = stark.getSelectorFromName(record.contentId);
            
            const call = {
                contractAddress: PAYMENT_CONTRACT_ADDRESS,
                entrypoint: 'unlock_with_btc',
                calldata: [record.userStarknetAddress, contentIdFelt, ORACLE_ADDRESS] // Assuming oracle is the creator for now
            };

            const tx = await this.oracleAccount.execute([call]);
            await this.starknetProvider.waitForTransaction(tx.transaction_hash);

            console.log(`Successfully unlocked content for user ${record.userStarknetAddress}. Tx: ${tx.transaction_hash}`);

            // Update the record status
            const allSwaps = await readSwaps();
            const index = allSwaps.findIndex(s => s.swapId === record.swapId);
            if (index !== -1) {
                allSwaps[index].status = 'CONFIRMED';
                await writeSwaps(allSwaps);
            }

        } catch (error) {
            console.error(`Starknet finalization failed for swap ${record.swapId}:`, error);
        }
    }

    startPolling() {
        console.log('Oracle service started. Polling for swaps every 10 seconds.');
        setInterval(() => {
            this.processPendingSwaps();
        }, POLL_INTERVAL_MS);
    }
}

// --- MAIN EXECUTION ---
if (require.main === module) {
    const oracle = new Oracle();
    oracle.startPolling();
}
