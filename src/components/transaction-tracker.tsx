"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, ExternalLink, Copy, AlertCircle } from "lucide-react"

interface Transaction {
  id: string
  hash: string
  status: "pending" | "confirmed" | "failed"
  amount: number
  currency: "STRK" | "BTC"
  timestamp: Date
  blockExplorer: string
}

interface TransactionTrackerProps {
  transaction: Transaction
  onComplete?: () => void
}

export function TransactionTracker({ transaction, onComplete }: TransactionTrackerProps) {
  const [currentTx, setCurrentTx] = useState(transaction)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (currentTx.status === "pending") {
      // Simulate transaction confirmation
      const timer = setTimeout(() => {
        setCurrentTx((prev) => ({ ...prev, status: "confirmed" }))
        onComplete?.()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [currentTx.status, onComplete])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusIcon = () => {
    switch (currentTx.status) {
      case "pending":
        return <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-accent" />
      case "failed":
        return <AlertCircle className="w-5 h-5 text-destructive" />
    }
  }

  const getStatusColor = () => {
    switch (currentTx.status) {
      case "pending":
        return "bg-orange-400/20 text-orange-400"
      case "confirmed":
        return "bg-accent/20 text-accent"
      case "failed":
        return "bg-destructive/20 text-destructive"
    }
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`
  }

  return (
    <Card className="p-6 glass glow-purple">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction Status</h3>
          <Badge className={`${getStatusColor()} border-0 capitalize`}>{currentTx.status}</Badge>
        </div>

        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-medium">
              {currentTx.amount} {currentTx.currency} Payment
            </div>
            <div className="text-sm text-muted-foreground">
              {currentTx.status === "pending" && "Confirming on blockchain..."}
              {currentTx.status === "confirmed" && "Transaction confirmed!"}
              {currentTx.status === "failed" && "Transaction failed"}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Transaction Hash:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-secondary/50 px-2 py-1 rounded">{formatHash(currentTx.hash)}</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(currentTx.hash)} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time:</span>
            <span className="text-sm">{currentTx.timestamp.toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network:</span>
            <span className="text-sm">{currentTx.currency === "STRK" ? "Starknet" : "Bitcoin"}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full glass bg-transparent"
          onClick={() => window.open(currentTx.blockExplorer, "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Block Explorer
        </Button>

        {copied && <div className="text-center text-sm text-accent">Transaction hash copied to clipboard!</div>}

        {currentTx.status === "pending" && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Waiting for confirmation...
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
