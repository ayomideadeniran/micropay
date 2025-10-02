"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  Bitcoin,
  Calendar,
  MoreVertical,
  Download,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { EarningsChart } from "@/components/earnings-chart"
import { RecentTransactions } from "@/components/recent-transactions"

interface DashboardStats {
  totalEarnings: {
    strk: number
    btc: number
    usd: number
  }
  totalUnlocks: number
  uniqueUsers: number
  conversionRate: number
  todayEarnings: {
    strk: number
    btc: number
    usd: number
  }
}

interface ContentPerformance {
  id: string
  title: string
  type: "article" | "video" | "game"
  unlocks: number
  earnings: {
    strk: number
    btc: number
    usd: number
  }
  views: number
  conversionRate: number
}

export default function CreatorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: { strk: 15.234, btc: 125000, usd: 45.67 },
    totalUnlocks: 1247,
    uniqueUsers: 892,
    conversionRate: 12.4,
    todayEarnings: { strk: 2.1, btc: 18500, usd: 6.23 },
  })

  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([
    {
      id: "1",
      title: "The Future of Web3 Payments",
      type: "article",
      unlocks: 456,
      earnings: { strk: 8.2, btc: 45000, usd: 18.45 },
      views: 3420,
      conversionRate: 13.3,
    },
    {
      id: "2",
      title: "Building on Starknet: A Developer's Guide",
      type: "video",
      unlocks: 234,
      earnings: { strk: 4.1, btc: 28000, usd: 15.22 },
      views: 1890,
      conversionRate: 12.4,
    },
    {
      id: "3",
      title: "Crypto Trading Simulator",
      type: "game",
      unlocks: 557,
      earnings: { strk: 2.9, btc: 52000, usd: 12.0 },
      views: 4560,
      conversionRate: 12.2,
    },
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 2000)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-500/20 text-red-400"
      case "game":
        return "bg-accent/20 text-accent"
      default:
        return "bg-primary/20 text-primary"
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Creator Dashboard</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="glass bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <section className="pt-24 pb-20 px-4">
        <div className="container mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, Creator!</h1>
              <p className="text-muted-foreground">Track your earnings and content performance in real-time</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="glass bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button className="glow-purple">
                <Zap className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <DollarSign className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <Badge className="bg-accent/20 text-accent border-0">+12.3%</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${stats.totalEarnings.usd}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {stats.totalEarnings.strk} STRK
                  </span>
                  <span className="flex items-center gap-1">
                    <Bitcoin className="w-3 h-3" />
                    {stats.totalEarnings.btc.toLocaleString()} sats
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <Badge className="bg-accent/20 text-accent border-0">+8.7%</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Unlocks</p>
                <p className="text-2xl font-bold">{stats.totalUnlocks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Across all content</p>
              </div>
            </Card>

            <Card className="p-6 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Users className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <Badge className="bg-accent/20 text-accent border-0">+15.2%</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </Card>

            <Card className="p-6 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Eye className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <Badge className="bg-accent/20 text-accent border-0">+2.1%</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Views to unlocks</p>
              </div>
            </Card>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 glass glow-purple">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Earnings Overview</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-xs">
                      7D
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs bg-primary/20 text-primary">
                      30D
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      90D
                    </Button>
                  </div>
                </div>
                <EarningsChart />
              </Card>
            </div>

            <div>
              <Card className="p-6 glass glow-purple">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Recent Transactions</h3>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                <RecentTransactions />
              </Card>
            </div>
          </div>

          {/* Content Performance */}
          <Card className="p-6 glass glow-purple">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Content Performance</h3>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {contentPerformance.map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge className={`${getTypeColor(content.type)} border-0`}>{content.type}</Badge>
                    <div>
                      <h4 className="font-medium">{content.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{content.views.toLocaleString()} views</span>
                        <span>{content.unlocks.toLocaleString()} unlocks</span>
                        <span>{content.conversionRate}% conversion</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${content.earnings.usd}</div>
                    <div className="text-sm text-muted-foreground">
                      {content.earnings.strk} STRK • {content.earnings.btc.toLocaleString()} sats
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Today's Summary */}
          <Card className="p-6 glass glow-green">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Today's Performance</h3>
                <p className="text-sm text-muted-foreground">Real-time updates</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">${stats.todayEarnings.usd}</div>
                <div className="text-sm text-muted-foreground">Earnings Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">47</div>
                <div className="text-sm text-muted-foreground">New Unlocks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">23</div>
                <div className="text-sm text-muted-foreground">New Users</div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
