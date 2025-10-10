"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Zap, Bitcoin, Wallet, CheckCircle, Shield, Loader2 } from "lucide-react";
import { useWallet } from "./wallet-provider";
import { Contract, stark } from "starknet";
import { WalletConnector } from "./wallet-connector";
import { TransactionTracker } from "./transaction-tracker";
import { getWalletBalance, payInvoice } from "@/lib/cashu";
import { connectXverse, sendBtcPayment } from "@/lib/xverse";
import { BtcAddress } from "sats-connect";

// --- TYPE DEFINITIONS ---

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "video" | "game";
  price: {
    strk: number;
    btc: number; // Price in satoshis
  };
}

interface PaymentModalProps {
  content: ContentItem;
  onClose: () => void;
  onPaymentComplete: () => void;
}

interface WalletInfo {
  type: "starknet" | "xverse";
  address: string;
  starknetAddress?: string; // For BTC swaps, we need the Starknet address
  connected: boolean;
}

interface Transaction {
  id: string;
  hash: string;
  status: "pending" | "confirmed" | "failed";
  amount: number;
  currency: "STRK" | "BTC";
  timestamp: Date;
  blockExplorer: string;
}

interface SwapInfo {
  depositAddress: string;
  amount: number; // Amount in BTC, not satoshis
  swapId: string;
}

type PaymentMethod = "strk" | "btc" | "cashu";
type PaymentStep = "select" | "connect" | "confirm" | "processing" | "success" | "error" | "show_invoice";

// --- COMPONENT ---

export function PaymentModal({
  content,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const { starknetWallet } = useWallet();
  // --- STATE ---
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("strk");
  const [step, setStep] = useState<PaymentStep>("select");
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(null);
  const [btcWalletAddress, setBtcWalletAddress] = useState<BtcAddress | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- HANDLERS ---

  const handleWalletConnected = (wallet: WalletInfo) => {
    setConnectedWallet(wallet);
    setStep("confirm");
  };

  const handleTransactionComplete = () => {
    setStep("success");
    setTimeout(() => {
      onPaymentComplete();
    }, 2000);
  };

  const handleContinue = async () => {
    setError(null);
    if (paymentMethod === 'btc') {
      await initiateBtcSwap();
    } else if (paymentMethod === 'cashu') {
      setStep('confirm');
    } else {
      setStep('connect');
    }
  };

  const initiateBtcSwap = async () => {
    setIsLoading(true);
    try {
      // A Starknet address is required to receive the swapped assets.
      // This example uses a hardcoded address. In a real app, you would get this
      // from the user's connected Starknet wallet.
      const starknetAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
      
      const xverseWallet = await connectXverse();
      setBtcWalletAddress(xverseWallet);
      setConnectedWallet({
        type: "xverse",
        address: xverseWallet.address,
        starknetAddress: starknetAddress,
        connected: true,
      });

      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStarknetAddress: starknetAddress, contentId: content.id }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create swap.');
      }

      const data: SwapInfo = await response.json();
      setSwapInfo(data);
      setStep("confirm");

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setError(null);
    setIsLoading(true);
    setStep("processing");

    try {
      let txId: string;
      if (paymentMethod === 'btc' && swapInfo && btcWalletAddress) {
        // Atomiq returns amount in BTC, convert to satoshis for Xverse
        const amountSats = swapInfo.amount * 1e8;
        txId = await sendBtcPayment(
          { address: swapInfo.depositAddress, amount: amountSats },
          btcWalletAddress.address
        );
      } else if (paymentMethod === 'cashu') {
        const proofs = await mintTokens(content.price.btc);
        if (proofs.length > 0) {
          handleTransactionComplete();
        } else {
          throw new Error("Failed to mint Cashu tokens.");
        }
        return; // Exit early for cashu
      } else {
        if (!connectedWallet || !starknetWallet?.account) {
          throw new Error("Starknet wallet not connected.");
        }

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error("Contract address is not configured.");
        }

        const { abi } = await starknetWallet.provider.getClassAt(contractAddress);
        if (!abi) {
          throw new Error("ABI not found for the contract.");
        }

        const paymentContract = new Contract(abi, contractAddress, starknetWallet.account);

        // --- Step 1: Buy the voucher ---
        const priceInWei = stark.parseUnits(content.price.strk.toString(), 18);
        const buyVoucherTx = await paymentContract.buy_voucher(priceInWei.low);
        const buyVoucherReceipt = await starknetWallet.provider.waitForTransaction(buyVoucherTx.transaction_hash);

        // --- Step 2: Extract the voucher ID from the event ---
        // The starknet.js v5 receipt format has events under `events`
        const voucherPurchasedEvent = buyVoucherReceipt.events?.find(
          (e: any) => e.keys[0] === stark.getSelectorFromName("VoucherPurchased")
        );

        if (!voucherPurchasedEvent) {
          throw new Error("Voucher purchase event not found.");
        }
        const voucherId = voucherPurchasedEvent.data[0];

        // --- Step 3: Redeem the voucher ---
        const contentId = stark.getSelectorFromName(content.id); // Assuming content.id is a string like "article-1"
        const creatorAddress = process.env.NEXT_PUBLIC_CREATOR_ADDRESS;
        if (!creatorAddress) {
          throw new Error("Creator address is not configured.");
        }

        const redeemVoucherTx = await paymentContract.redeem_voucher(voucherId, contentId, creatorAddress);
        await starknetWallet.provider.waitForTransaction(redeemVoucherTx.transaction_hash);

        txId = redeemVoucherTx.transaction_hash;
      }

      setTransaction({
        id: swapInfo?.swapId || Math.random().toString(36).substr(2, 9),
        hash: txId,
        status: "pending",
        amount: paymentMethod === "strk" ? content.price.strk : content.price.btc,
        currency: paymentMethod === "strk" ? "STRK" : "BTC",
        timestamp: new Date(),
        blockExplorer:
          paymentMethod === "strk"
            ? `https://starkscan.co/tx/${txId}`
            : `https://mempool.space/tx/${txId}`,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI RENDER LOGIC ---

  const getStepContent = () => {
    switch (step) {
      case "select":
        return (
          // ... (Selection UI remains the same, but the button handler changes)
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Choose Payment Method</h3>
              <p className="text-muted-foreground">Select how you'd like to pay for this content</p>
            </div>
            <div className="space-y-3">
              {/* STRK Card */}
              <Card className={`p-4 cursor-pointer transition-all duration-200 ${paymentMethod === "strk" ? "ring-2 ring-primary glow-purple bg-primary/5" : "hover:bg-secondary/50"}`} onClick={() => setPaymentMethod("strk")}>
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div><div><div className="font-medium">Starknet (STRK)</div><div className="text-sm text-muted-foreground">Fast & Low Cost</div></div></div><div className="text-right"><div className="font-semibold">{content.price.strk} STRK</div><div className="text-sm text-muted-foreground">~$0.001</div></div></div>
              </Card>
              {/* BTC Card */}
              <Card className={`p-4 cursor-pointer transition-all duration-200 ${paymentMethod === "btc" ? "ring-2 ring-orange-400 glow-orange bg-orange-400/5" : "hover:bg-secondary/50"}`} onClick={() => setPaymentMethod("btc")}>
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-orange-400/20 flex items-center justify-center"><Bitcoin className="w-5 h-5 text-orange-400" /></div><div><div className="font-medium">Bitcoin (BTC)</div><div className="text-sm text-muted-foreground">Via Xverse & Atomiq</div></div></div><div className="text-right"><div className="font-semibold">{content.price.btc} sats</div><div className="text-sm text-muted-foreground">~$0.001</div></div></div>
              </Card>
              {/* Cashu Card */}
              <Card className={`p-4 cursor-pointer transition-all duration-200 ${paymentMethod === "cashu" ? "ring-2 ring-green-400 glow-green bg-green-400/5" : "hover:bg-secondary/50"}`} onClick={() => setPaymentMethod("cashu")}>
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-400/20 flex items-center justify-center"><Shield className="w-5 h-5 text-green-400" /></div><div><div className="font-medium">Cashu</div><div className="text-sm text-muted-foreground">Private Payments</div></div></div><div className="text-right"><div className="font-semibold">{content.price.btc} sats</div><div className="text-sm text-muted-foreground">~$0.001</div></div></div>
              </Card>
            </div>
            <Button onClick={handleContinue} className="w-full glow-purple" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
              Continue with {paymentMethod === "strk" ? "Starknet" : paymentMethod === 'btc' ? "Bitcoin" : "Cashu"}
            </Button>
          </div>
        );

      case "connect":
        return <WalletConnector onWalletConnected={handleWalletConnected} preferredMethod={paymentMethod} />;

      case "confirm":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Confirm Payment</h3>
              <p className="text-muted-foreground">Review your payment details</p>
            </div>
            <Card className="p-4 bg-secondary/50">
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Content:</span><span className="font-medium">{content.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span>
                  <div className="flex items-center gap-2">
                    {paymentMethod === 'btc' && swapInfo ? (
                      <><Bitcoin className="w-4 h-4 text-orange-400" /><span className="font-semibold">{swapInfo.amount.toFixed(8)} BTC</span></>
                    ) : paymentMethod === 'strk' ? (
                      <><Zap className="w-4 h-4 text-primary" /><span className="font-semibold">{content.price.strk} STRK</span></>
                    ) : (
                      <><Shield className="w-4 h-4 text-green-400" /><span className="font-semibold">{content.price.btc} sats</span></>
                    )}
                  </div>
                </div>
                {connectedWallet && <div className="flex justify-between"><span className="text-muted-foreground">Your Wallet:</span><span className="text-sm font-mono truncate">{connectedWallet.address}</span></div>}
                {paymentMethod === 'btc' && swapInfo && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Deposit To:</span><span className="text-sm font-mono truncate">{swapInfo.depositAddress}</span></div>}
              </div>
            </Card>
            <Button onClick={handleConfirmPayment} className="w-full glow-purple" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Payment
            </Button>
          </div>
        );

      case "processing":
        return (
          <div>
            <h3 className="text-xl font-semibold mb-2 text-center">Processing Payment</h3>
            <p className="text-muted-foreground text-center mb-6">Your transaction has been sent. Waiting for confirmation...</p>
            {transaction && <TransactionTracker transaction={transaction} onComplete={handleTransactionComplete} />}
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6"><div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-accent" /></div><div><h3 className="text-xl font-semibold mb-2">Payment Successful!</h3><p className="text-muted-foreground">Your content is now being unlocked</p></div></div>
        );
        
      case "error":
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto"><X className="w-8 h-8 text-destructive" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
              <p className="text-destructive-foreground bg-destructive/30 p-3 rounded-md text-sm">{error}</p>
            </div>
            <Button onClick={() => setStep("select")} variant="outline">Try Again</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md p-6 glass glow-purple max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Unlock Content</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
        </div>
        {getStepContent()}
      </Card>
    </div>
  );
}
