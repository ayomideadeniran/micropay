"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";;
import { Card } from "@/components/ui/card";;
import { X, Zap, Bitcoin, Wallet, CheckCircle, Shield, LoaderCircle as Loader2 } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import { hash, cairo, CallData } from "starknet";
import { WalletConnector } from "./wallet-connector";
import { TransactionTracker } from "./transaction-tracker";
import { connectXverse, sendBtcPayment } from "@/lib/xverse";
import { BtcAddress } from "sats-connect";
import abi from "../../smart_contract/target/dev/smart_contract_PaymentManager.contract_class.json";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x03041c3c9bac50a6412900348abb4dd3dd99e901144e122e787052fe616b1727";
const STRK_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STRK_TOKEN_ADDRESS || "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const CREATOR_ADDRESS = process.env.NEXT_PUBLIC_CREATOR_ADDRESS || "0x04c6de967a629d1be84e38873a40d4d9289ad7b740f7b8c1ed9b78c033f96c48";


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
  const { account } = useAccount();
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
    console.log("account", account);
    setError(null);
    setIsLoading(true);
    setStep("processing");

    try {
      console.log("Starting payment confirmation...");
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
        if (!connectedWallet || !account) {
          throw new Error("Starknet wallet not connected.");
        }

        const priceInWei = cairo.uint256(BigInt(content.price.strk * 1e18));
        const contentId = hash.getSelectorFromName(content.id);

        // --- Steps 1 & 2: Approve STRK token transfer and buy the voucher in a single multicall ---
        console.log("Constructing multicall for STRK approval and voucher purchase...");
        const { transaction_hash: buyTxHash } = await account.execute([
          {
            contractAddress: STRK_TOKEN_ADDRESS,
            entrypoint: 'approve',
            calldata: CallData.compile({
              spender: CONTRACT_ADDRESS,
              amount: priceInWei,
            }),
          },
          {
            contractAddress: CONTRACT_ADDRESS,
            entrypoint: 'buy_voucher',
            calldata: CallData.compile({
              price: priceInWei,
            }),
          },
        ]);
        await account.waitForTransaction(buyTxHash);
        console.log("Voucher purchased.");

        // --- Step 3: Redeem the voucher ---
        console.log("Executing redeem_voucher call...");
        const { transaction_hash: redeemTxHash } = await account.execute({
            contractAddress: CONTRACT_ADDRESS,
            entrypoint: "redeem_voucher",
            calldata: CallData.compile({ voucher: "0x1", content_id: contentId, creator: CREATOR_ADDRESS })
        });
        await account.waitForTransaction(redeemTxHash);
        txId = redeemTxHash;
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
      console.error("Error in handleConfirmPayment:", err);
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
              <p className="text-muted-foreground">Select how you’d like to pay for this content</p>
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