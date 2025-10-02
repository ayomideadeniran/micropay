import type React from "react"
import type { Metadata } from "next"
// import { GeistSans } from "geist/font/sans"
// import { GeistMono } from "geist/font/mono"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { WalletProvider } from "@/components/wallet-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "MicroPay - Private Web3 Micropayments",
  description: "Unlock digital content with sub-cent private payments using STRK and BTC",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <WalletProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen gradient-bg">{children}</div>
          </Suspense>
        </WalletProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
