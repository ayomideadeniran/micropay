
import { NextRequest, NextResponse } from 'next/server';
import { generate } from 'lightning-invoice';

// This is a mock invoice generator. In a real application, you would use your
// own Lightning node to create an invoice.
const createMockInvoice = (amount: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const invoice = generate({
        payment_hash: `mock_payment_hash_${now}`,
        payee_node_key: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f222187145771a595',
        destination_pubkey: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f222187145771a595',
        short_description: 'Micropay Content',
        milli_satoshis: amount * 1000, // Convert satoshis to millisatoshis
        expiry: 3600, // 1 hour
        timestamp: now,
    });
    return invoice.bolt11;
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount } = body;

        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'A valid amount in satoshis is required.' }, { status: 400 });
        }

        // In a real app, you would generate an invoice using your own Lightning node
        // and store its details to verify payment later.
        const invoice = createMockInvoice(amount);

        return NextResponse.json({ invoice });

    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
