"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Wallet, Zap, Bitcoin, ChevronDown, LogOut } from "lucide-react"
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core"
import { useState } from "react"

export function GlobalWalletStatus() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [showDropdown, setShowDropdown] = useState(false)

  // Mock Xverse connection
  const [xverseWallet, setXverseWallet] = useState<{ address: string; balance: number } | null>(null)

  const hasConnectedWallet = isConnected || xverseWallet

  const connectXverse = () => {
    setXverseWallet({ address: "bc1q...xyz", balance: 50000 })
  }

  const disconnectXverse = () => {
    setXverseWallet(null)
  }

  if (!hasConnectedWallet) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => connect({ connector: connectors[0] })} className="glass bg-transparent">
          <Zap className="w-4 h-4 mr-2" />
          Connect
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="glass bg-transparent flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isConnected ? `${address?.slice(0, 6)}...` : `${xverseWallet?.address.slice(0, 6)}...`}
        </span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {showDropdown && (
        <Card className="absolute top-full right-0 mt-2 w-80 p-4 glass glow-purple z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Connected Wallets</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDropdown(false)}>
                ×
              </Button>
            </div>

            {isConnected && address && (
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium">Starknet</span>
                    <Badge className="bg-accent/20 text-accent border-0 text-xs">Connected</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => disconnect()} className="h-6 px-2">
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground font-mono">{address}</div>
              </div>
            )}

            {xverseWallet && (
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-4 h-4 text-orange-400" />
                    <span className="font-medium">Xverse</span>
                    <Badge className="bg-accent/20 text-accent border-0 text-xs">Connected</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={disconnectXverse} className="h-6 px-2">
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground font-mono">{xverseWallet.address}</div>
                <div className="text-sm text-muted-foreground">{xverseWallet.balance.toLocaleString()} sats</div>
              </div>
            )}

            {!isConnected && (
              <div className="grid grid-cols-2 gap-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="w-full"
                    size="sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {connector.name}
                  </Button>
                ))}
              </div>
            )}

            {!xverseWallet && (
              <Button onClick={connectXverse} className="w-full bg-orange-400 hover:bg-orange-500 text-black" size="sm">
                <Bitcoin className="w-4 h-4 mr-2" />
                Connect Xverse
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}