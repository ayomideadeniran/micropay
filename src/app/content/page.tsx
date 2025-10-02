"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Lock, Unlock, Play, Bitcoin, Zap, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { PaymentModal } from "@/components/payment-modal"

interface ContentItem {
  id: string
  title: string
  type: "article" | "video" | "game"
  preview: string
  fullContent: string
  price: {
    strk: number
    btc: number
  }
  isUnlocked: boolean
}

const mockContent: ContentItem[] = [
  {
    id: "1",
    title: "The Future of Web3 Payments",
    type: "article",
    preview:
      "Discover how blockchain technology is revolutionizing digital payments and creating new opportunities for content creators...",
    fullContent: `# The Future of Web3 Payments

Blockchain technology is fundamentally changing how we think about digital payments and content monetization. With the rise of micropayments, creators can now monetize their content in ways that were previously impossible.

## Key Benefits

1. **Instant Settlements**: Payments are processed immediately without intermediaries
2. **Global Reach**: Accept payments from anywhere in the world
3. **Low Fees**: Minimal transaction costs for micropayments
4. **Privacy**: Enhanced privacy protection for both creators and consumers

## The Technology Behind It

Web3 payments leverage smart contracts and decentralized networks to enable:
- Trustless transactions
- Programmable money
- Automated revenue sharing
- Cross-chain compatibility

This revolutionary approach is opening up new business models and creating opportunities for creators to monetize their work directly, without relying on traditional platforms that take large cuts of their earnings.

The future is bright for Web3 payments, and we're just getting started!`,
    price: { strk: 0.001, btc: 100 },
    isUnlocked: false,
  },
  {
    id: "2",
    title: "Building on Starknet: A Developer's Guide",
    type: "video",
    preview:
      "Learn the fundamentals of building decentralized applications on Starknet with this comprehensive tutorial...",
    fullContent: "This is a premium video tutorial covering advanced Starknet development techniques.",
    price: { strk: 0.005, btc: 250 },
    isUnlocked: false,
  },
  {
    id: "3",
    title: "Crypto Trading Simulator",
    type: "game",
    preview: "Test your trading skills in this interactive crypto market simulation game...",
    fullContent: "Welcome to the Crypto Trading Simulator! This interactive game is now unlocked.",
    price: { strk: 0.002, btc: 150 },
    isUnlocked: false,
  },
]

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>(mockContent)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPreview, setShowPreview] = useState<{ [key: string]: boolean }>({})

  const handleUnlock = (contentId: string) => {
    setContent((prev) => prev.map((item) => (item.id === contentId ? { ...item, isUnlocked: true } : item)))
    setShowPaymentModal(false)
    setSelectedContent(null)
  }

  const openPaymentModal = (item: ContentItem) => {
    setSelectedContent(item)
    setShowPaymentModal(true)
  }

  const togglePreview = (contentId: string) => {
    setShowPreview((prev) => ({ ...prev, [contentId]: !prev[contentId] }))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />
      case "game":
        return <Zap className="w-4 h-4" />
      default:
        return null
    }
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MicroPay</span>
          </div>
        </div>
      </nav>

      {/* Content Grid */}
      <section className="pt-24 pb-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Premium Content</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock exclusive articles, videos, and interactive experiences with micropayments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.map((item) => (
              <Card
                key={item.id}
                className={`p-6 glass transition-all duration-300 hover:scale-105 ${
                  item.isUnlocked ? "glow-green" : "glow-purple"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge className={`${getTypeColor(item.type)} border-0`}>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(item.type)}
                      {item.type}
                    </div>
                  </Badge>
                  <div className="flex items-center gap-2">
                    {item.isUnlocked ? (
                      <Unlock className="w-5 h-5 text-accent" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-balance">{item.title}</h3>

                <div className="mb-4">
                  {item.isUnlocked ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">{item.preview}</p>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-accent/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-accent">Unlocked Content</span>
                          <Button variant="ghost" size="sm" onClick={() => togglePreview(item.id)} className="h-6 px-2">
                            {showPreview[item.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                        {showPreview[item.id] && (
                          <div className="text-sm text-muted-foreground whitespace-pre-line">{item.fullContent}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <p className="text-muted-foreground blur-sm select-none">{item.preview}</p>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>
                  )}
                </div>

                {!item.isUnlocked && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Unlock for:</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" />
                          <span>{item.price.strk} STRK</span>
                        </div>
                        <span className="text-muted-foreground">or</span>
                        <div className="flex items-center gap-1">
                          <Bitcoin className="w-3 h-3 text-orange-400" />
                          <span>{item.price.btc} sats</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => openPaymentModal(item)} className="w-full glow-purple group" size="lg">
                      <Lock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Unlock Content
                    </Button>
                  </div>
                )}

                {item.isUnlocked && (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Unlock className="w-4 h-4" />
                    <span>Content Unlocked</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && selectedContent && (
        <PaymentModal
          content={selectedContent}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={() => handleUnlock(selectedContent.id)}
        />
      )}
    </div>
  )
}
