"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Zap, Bitcoin, Wallet, CheckCircle } from "lucide-react";
import { WalletConnector } from "./wallet-connector";
import { TransactionTracker } from "./transaction-tracker";

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "video" | "game";
  price: {
    strk: number;
    btc: number;
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
  balance: number;
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

type PaymentMethod = "strk" | "btc";
type PaymentStep = "select" | "connect" | "confirm" | "processing" | "success";

export function PaymentModal({
  content,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("strk");
  const [step, setStep] = useState<PaymentStep>("select");
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(
    null
  );
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const handleWalletConnected = (wallet: WalletInfo) => {
    setConnectedWallet(wallet);
    setStep("confirm");
  };

  const handleConfirmPayment = () => {
    setStep("processing");

    // Create mock transaction
    const mockTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "pending",
      amount: paymentMethod === "strk" ? content.price.strk : content.price.btc,
      currency: paymentMethod === "strk" ? "STRK" : "BTC",
      timestamp: new Date(),
      blockExplorer:
        paymentMethod === "strk"
          ? "https://starkscan.co/tx/0x1234...5678"
          : "https://blockstream.info/tx/1234...5678",
    };

    setTransaction(mockTransaction);
  };

  const handleTransactionComplete = () => {
    setStep("success");
    setTimeout(() => {
      onPaymentComplete();
    }, 2000);
  };

  const getStepContent = () => {
    switch (step) {
      case "select":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Choose Payment Method
              </h3>
              <p className="text-muted-foreground">
                Select how you'd like to pay for this content
              </p>
            </div>

            <div className="space-y-3">
              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "strk"
                    ? "ring-2 ring-primary glow-purple bg-primary/5"
                    : "hover:bg-secondary/50"
                }`}
                onClick={() => setPaymentMethod("strk")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Starknet (STRK)</div>
                      <div className="text-sm text-muted-foreground">
                        Fast & Low Cost
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {content.price.strk} STRK
                    </div>
                    <div className="text-sm text-muted-foreground">~$0.001</div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "btc"
                    ? "ring-2 ring-orange-400 glow-green bg-orange-400/5"
                    : "hover:bg-secondary/50"
                }`}
                onClick={() => setPaymentMethod("btc")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-400/20 flex items-center justify-center">
                      <Bitcoin className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium">Bitcoin (BTC)</div>
                      <div className="text-sm text-muted-foreground">
                        Via Xverse Wallet
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {content.price.btc} sats
                    </div>
                    <div className="text-sm text-muted-foreground">~$0.001</div>
                  </div>
                </div>
              </Card>
            </div>

            <Button
              onClick={() => setStep("connect")}
              className="w-full glow-purple"
              size="lg"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Continue with {paymentMethod === "strk" ? "Starknet" : "Bitcoin"}
            </Button>
          </div>
        );

      case "connect":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-muted-foreground">
                Connect your wallet to proceed with payment
              </p>
            </div>
            <WalletConnector
              onWalletConnected={handleWalletConnected}
              preferredMethod={paymentMethod}
            />
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Confirm Payment</h3>
              <p className="text-muted-foreground">
                Review your payment details
              </p>
            </div>

            <Card className="p-4 bg-secondary/50">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content:</span>
                  <span className="font-medium">{content.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge className="bg-primary/20 text-primary border-0">
                    {content.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <div className="flex items-center gap-2">
                    {paymentMethod === "strk" ? (
                      <>
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="font-semibold">
                          {content.price.strk} STRK
                        </span>
                      </>
                    ) : (
                      <>
                        <Bitcoin className="w-4 h-4 text-orange-400" />
                        <span className="font-semibold">
                          {content.price.btc} sats
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wallet:</span>
                  <span className="text-sm font-mono">
                    {connectedWallet?.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="text-accent">Free</span>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleConfirmPayment}
              className="w-full glow-purple"
              size="lg"
            >
              Confirm Payment
            </Button>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
              <p className="text-muted-foreground">
                Your transaction is being processed
              </p>
            </div>
            {transaction && (
              <TransactionTracker
                transaction={transaction}
                onComplete={handleTransactionComplete}
              />
            )}
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Payment Successful!
              </h3>
              <p className="text-muted-foreground">
                Your content is now being unlocked
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-md p-6 glass glow-purple max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Unlock Content</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {getStepContent()}
      </Card>
    </div>
  );
}
