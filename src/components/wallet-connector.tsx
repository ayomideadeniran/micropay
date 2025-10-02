"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Zap, Bitcoin, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

interface WalletConnectorProps {
  onWalletConnected: (wallet: WalletInfo) => void
  preferredMethod?: "strk" | "btc"
}

interface WalletInfo {
  type: "starknet" | "xverse"
  address: string
  balance: number
  connected: boolean
}

export function WalletConnector({ onWalletConnected, preferredMethod = "strk" }: WalletConnectorProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Mock wallet detection
  const [availableWallets, setAvailableWallets] = useState({
    starknet: true, // Mock: Braavos/ArgentX detected
    xverse: true, // Mock: Xverse detected
  })

  const connectStarknetWallet = async () => {
    setConnecting("starknet")
    setError(null)

    try {
      // Mock Starknet wallet connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockWallet: WalletInfo = {
        type: "starknet",
        address: "0x1234...5678",
        balance: 10.5, // STRK
        connected: true,
      }

      setConnectedWallet(mockWallet)
      onWalletConnected(mockWallet)
    } catch (err) {
      setError("Failed to connect to Starknet wallet")
    } finally {
      setConnecting(null)
    }
  }

  const connectXverseWallet = async () => {
    setConnecting("xverse")
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

      setConnectedWallet(mockWallet)
      onWalletConnected(mockWallet)
    } catch (err) {
      setError("Failed to connect to Xverse wallet")
    } finally {
      setConnecting(null)
    }
  }

  const disconnectWallet = () => {
    setConnectedWallet(null)
    setError(null)
  }

  if (connectedWallet) {
    return (
      <Card className="p-4 glass glow-green">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {connectedWallet.type === "starknet" ? "Starknet Wallet" : "Xverse Wallet"}
                <Badge className="bg-accent/20 text-accent border-0 text-xs">Connected</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{connectedWallet.address}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {connectedWallet.balance} {connectedWallet.type === "starknet" ? "STRK" : "sats"}
            </div>
            <Button variant="ghost" size="sm" onClick={disconnectWallet} className="text-xs h-6 px-2">
              Disconnect
            </Button>
          </div>
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
          className={`p-4 cursor-pointer transition-all duration-200 ${
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
            {availableWallets.starknet ? (
              <Badge className="bg-accent/20 text-accent border-0">Detected</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Found
              </Badge>
            )}
          </div>

          <Button
            onClick={connectStarknetWallet}
            disabled={!availableWallets.starknet || connecting === "starknet"}
            className="w-full glow-purple"
            size="sm"
          >
            {connecting === "starknet" ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Starknet
              </>
            )}
          </Button>

          {!availableWallets.starknet && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <a href="https://braavos.app" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                Install Braavos
              </a>
              <span>or</span>
              <a href="https://argent.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                ArgentX
              </a>
            </div>
          )}
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
            {availableWallets.xverse ? (
              <Badge className="bg-accent/20 text-accent border-0">Detected</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Found
              </Badge>
            )}
          </div>

          <Button
            onClick={connectXverseWallet}
            disabled={!availableWallets.xverse || connecting === "xverse"}
            className="w-full bg-orange-400 hover:bg-orange-500 text-black"
            size="sm"
          >
            {connecting === "xverse" ? (
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

          {!availableWallets.xverse && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <a href="https://xverse.app" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                Install Xverse
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
