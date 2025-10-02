"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Coins, Users } from "lucide-react";
import Link from "next/link";
import { GlobalWalletStatus } from "@/components/global-wallet-status";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MicroPay</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/content"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <GlobalWalletStatus />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
              Unlock content with{" "}
              <span className="text-primary">sub-cent private payments</span>,{" "}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Experience the future of digital content monetization with
              instant, private micropayments using STRK and BTC
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/content">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 glow-purple group"
                >
                  Try Demo
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 glass bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why MicroPay?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Revolutionary micropayment technology that puts creators and
              consumers first
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Zap className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Instant Payments</h3>
              <p className="text-muted-foreground">
                Pay as little as 0.001 STRK or 100 sats to unlock premium
                content instantly
              </p>
            </Card>

            <Card className="p-8 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Shield className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your payments are private and secure using cutting-edge
                blockchain technology
              </p>
            </Card>

            <Card className="p-8 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Coins className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Multi-Currency</h3>
              <p className="text-muted-foreground">
                Support for STRK tokens and Bitcoin payments through integrated
                wallets
              </p>
            </Card>

            <Card className="p-8 glass glow-purple hover:glow-green transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Users className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Creator Dashboard</h3>
              <p className="text-muted-foreground">
                Real-time earnings tracking and analytics for content creators
              </p>
            </Card>

            <Card className="p-8 glass glow-purple hover:glow-green transition-all duration-300 group lg:col-span-2">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <ArrowRight className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Seamless Integration
              </h3>
              <p className="text-muted-foreground">
                Easy integration with existing content platforms and websites.
                Get started in minutes with our simple API.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="p-12 glass glow-purple max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to revolutionize content monetization?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the future of digital payments and start earning from your
              content today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/content">
                <Button size="lg" className="text-lg px-8 py-6 glow-purple">
                  Try Demo Now
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 glass bg-transparent"
                >
                  Creator Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">MicroPay</span>
          </div>
          <p className="text-muted-foreground">
            Built with ❤️ for the Web3 community
          </p>
        </div>
      </footer>
    </div>
  );
}
