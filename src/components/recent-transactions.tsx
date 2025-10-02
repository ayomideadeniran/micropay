"use client"

import { Badge } from "@/components/ui/badge"
import { Zap, Bitcoin, ArrowUpRight } from "lucide-react"

interface Transaction {
  id: string
  type: "unlock"
  content: string
  amount: number
  currency: "STRK" | "BTC"
  user: string
  timestamp: string
  status: "completed" | "pending"
}

const recentTransactions: Transaction[] = [
  {
    id: "1",
    type: "unlock",
    content: "Web3 Payments Guide",
    amount: 0.001,
    currency: "STRK",
    user: "0x1234...5678",
    timestamp: "2 min ago",
    status: "completed",
  },
  {
    id: "2",
    type: "unlock",
    content: "Starknet Tutorial",
    amount: 250,
    currency: "BTC",
    user: "bc1q...xyz",
    timestamp: "5 min ago",
    status: "completed",
  },
  {
    id: "3",
    type: "unlock",
    content: "Trading Simulator",
    amount: 0.002,
    currency: "STRK",
    user: "0x9876...4321",
    timestamp: "12 min ago",
    status: "completed",
  },
  {
    id: "4",
    type: "unlock",
    content: "Web3 Payments Guide",
    amount: 150,
    currency: "BTC",
    user: "bc1q...abc",
    timestamp: "18 min ago",
    status: "pending",
  },
  {
    id: "5",
    type: "unlock",
    content: "Starknet Tutorial",
    amount: 0.005,
    currency: "STRK",
    user: "0x5555...7777",
    timestamp: "25 min ago",
    status: "completed",
  },
]

export function RecentTransactions() {
  return (
    <div className="space-y-3">
      {recentTransactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              {tx.currency === "STRK" ? (
                <Zap className="w-4 h-4 text-primary" />
              ) : (
                <Bitcoin className="w-4 h-4 text-orange-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-sm">{tx.content}</div>
              <div className="text-xs text-muted-foreground">{tx.user}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {tx.amount} {tx.currency}
              </span>
              <ArrowUpRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs border-0 ${
                  tx.status === "completed" ? "bg-accent/20 text-accent" : "bg-orange-400/20 text-orange-400"
                }`}
              >
                {tx.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{tx.timestamp}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
