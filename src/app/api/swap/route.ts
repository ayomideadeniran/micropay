
import { NextRequest, NextResponse } from 'next/server';
import { SwapperFactory } from '@atomiqlabs/sdk';
import { StarknetInitializer, StarknetInitializerType } from '@atomiqlabs/chain-starknet';

// This is a placeholder for the actual content price.
// In a real application, you would fetch this from your database or a price oracle.
const MOCK_CONTENT_PRICE_USD = 0.01;
const MOCK_STRK_PRICE_USD = 0.75; 

// Initialize Atomiq SDK
// It's recommended to use an environment variable for the RPC URL in a real project.
const starknetRpc = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7';

const factory = new SwapperFactory<[StarknetInitializerType]>(
    [StarknetInitializer] as const
);

const FROM_TOKEN = 'BTC.BTC';
const TO_TOKEN = 'STRK.ETH'; 

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userStarknetAddress } = body;

        if (!userStarknetAddress) {
            return NextResponse.json({ error: 'Missing required field: userStarknetAddress' }, { status: 400 });
        }

        // 1. Calculate the required amount of STRK for the content
        const requiredStrkAmount = MOCK_CONTENT_PRICE_USD / MOCK_STRK_PRICE_USD;

        // 2. Initialize a new swapper instance
        const swapper = await factory.newSwapper({
            starknet: {
                rpcUrl: starknetRpc,
            }
        });
        const fromToken = swapper.tokens[FROM_TOKEN];
        const toToken = swapper.tokens[TO_TOKEN];

        if (!fromToken || !toToken) {
            return NextResponse.json({ error: 'Invalid token pair specified.' }, { status: 500 });
        }

        // 3. Create the swap.
        // The Atomiq oracle will ultimately call the `unlock_with_btc` function on our contract.
        // The `redeemAddress` tells the SDK where to send the swapped STRK tokens.
        // For our use case, the tokens aren't directly sent to the user, but are used by the oracle.
        const swap = await swapper.create({
            fromToken,
            toToken,
            toAmount: requiredStrkAmount,
            redeemAddress: userStarknetAddress,
        });

        // 4. Get the deposit address and amount for the frontend
        const depositAddress = await swap.getDepositAddress();
        const fromAmount = swap.getFromAmount();

        if (!depositAddress || !fromAmount) {
            return NextResponse.json({ error: 'Failed to generate deposit address.' }, { status: 500 });
        }

        // In a real app, you would save the swap.id here to track its status later.

        // 5. Return the details to the frontend
        return NextResponse.json({
            depositAddress,
            amount: fromAmount, // The amount of BTC to send
            swapId: swap.id,
        });

    } catch (error) {
        console.error('Error creating Atomiq swap:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to create swap', details: errorMessage }, { status: 500 });
    }
}
