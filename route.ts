import { NextResponse } from 'next/server';
// Assuming the Atomiq SDK is installed and can be imported.
// You might need to install it: `npm install @atomiqlabs/sdk`
import { Atomiq } from '@atomiqlabs/sdk';

// --- Mock Content Data (should match frontend or come from a DB) ---
const mockContent = [
    { id: "1", price: { strk: 0.001 } },
    { id: "2", price: { strk: 0.005 } },
    { id: "3", price: { strk: 0.002 } },
];

/**
 * This is the main handler for the POST request to /api/swap.
 * It creates a swap order using the Atomiq SDK.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userStarknetAddress, contentId } = body;

        if (!userStarknetAddress || !contentId) {
            return NextResponse.json({ error: 'Missing userStarknetAddress or contentId' }, { status: 400 });
        }

        // --- 1. Find the content and its price ---
        const content = mockContent.find(c => c.id === contentId);
        if (!content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        // --- 2. Initialize Atomiq SDK ---
        // IMPORTANT: Store your API key in environment variables
        const atomiq = new Atomiq({
            apiKey: process.env.ATOMIQ_API_KEY!,
            // Use 'mainnet' for production
            network: 'testnet',
        });

        // --- 3. Create the Swap Order ---
        // Atomiq handles the price conversion from STRK to BTC automatically.
        const swapOrder = await atomiq.createSwap({
            from: 'BTC',
            to: 'STRK', // The token you want to receive on Starknet
            toAmount: content.price.strk,
            recipient: userStarknetAddress,
            // This webhook will be called by Atomiq when the swap is complete.
            // We will need to create this endpoint next.
            webhook: `${process.env.NEXT_PUBLIC_BASE_URL}/api/swap/webhook`,
            // Pass metadata to identify the user and content in the webhook
            metadata: {
                userId: userStarknetAddress,
                contentId: contentId,
            },
        });

        // --- 4. Return Swap Details to Frontend ---
        return NextResponse.json({
            depositAddress: swapOrder.depositAddress,
            amount: swapOrder.fromAmount, // Amount in BTC
            swapId: swapOrder.id,
        });

    } catch (error) {
        console.error('Error creating Atomiq swap:', error);
        return NextResponse.json({ error: 'Failed to create swap order.' }, { status: 500 });
    }
}