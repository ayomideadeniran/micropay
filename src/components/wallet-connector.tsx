"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Zap, Bitcoin, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";

interface WalletConnectorProps {
  onWalletConnected: (wallet: WalletInfo) => void
  preferredMethod?: "strk" | "btc"
}

interface WalletInfo {
  type: "starknet" | "xverse"
  address: string
  balance?: number
  connected: boolean
}

export function WalletConnector({ onWalletConnected, preferredMethod = "strk" }: WalletConnectorProps) {
  const { connect, connectors } = useConnect();
  const { address, isConnected, account } = useAccount();
  const { disconnect } = useDisconnect();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock Xverse connection
  const [xverseWallet, setXverseWallet] = useState<WalletInfo | null>(null);

  useEffect(() => {
    if (isConnected && address && account) {
      onWalletConnected({
        type: "starknet",
        address: address,
        connected: true,
      });
    }
  }, [isConnected, address, account, onWalletConnected]);

  const connectXverseWallet = async () => {
    setConnecting(true)
    setError(null)

    try {
      // Mock Xverse wallet connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockWallet: WalletInfo = {
        type: "xverse",
        address: "bc1q...xyz",
        balance: 50000, // sats
        connected: true,
      }

      setXverseWallet(mockWallet);
      onWalletConnected(mockWallet)
    } catch (err) {
      setError("Failed to connect to Xverse wallet")
    } finally {
      setConnecting(false)
    }
  }

  if (isConnected && address) {
    return (
      <Card className="p-4 glass glow-green">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                Starknet Wallet
                <Badge className="bg-accent/20 text-accent border-0 text-xs">Connected</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{address}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => disconnect()} className="text-xs h-6 px-2">
            Disconnect
          </Button>
        </div>
      </Card>
    )
  }

  if (xverseWallet) {
    return (
      <Card className="p-4 glass glow-green">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                Xverse Wallet
                <Badge className="bg-accent/20 text-accent border-0 text-xs">Connected</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{xverseWallet.address}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setXverseWallet(null)} className="text-xs h-6 px-2">
            Disconnect
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {/* Starknet Wallets */}
        <Card
          className={`p-4 transition-all duration-200 ${
            preferredMethod === "strk" ? "ring-2 ring-primary glow-purple" : "hover:bg-secondary/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Starknet Wallets</div>
                <div className="text-sm text-muted-foreground">Braavos, ArgentX</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => connect({ connector })}
                disabled={connecting}
                className="w-full glow-purple"
                size="sm"
              >
                {connecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    {connector.name}
                  </>
                )}
              </Button>
            ))}
          </div>
        </Card>

        {/* Bitcoin Wallets */}
        <Card
          className={`p-4 cursor-pointer transition-all duration-200 ${
            preferredMethod === "btc" ? "ring-2 ring-orange-400 glow-green" : "hover:bg-secondary/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-400/20 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="font-medium">Bitcoin Wallets</div>
                <div className="text-sm text-muted-foreground">Xverse, Unisat</div>
              </div>
            </div>
          </div>

          <Button
            onClick={connectXverseWallet}
            disabled={connecting}
            className="w-full bg-orange-400 hover:bg-orange-500 text-black"
            size="sm"
          >
            {connecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Xverse
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}