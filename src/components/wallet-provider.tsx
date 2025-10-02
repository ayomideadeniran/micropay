"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { starknetProvider, xverseProvider, type StarknetWallet, type XverseWallet } from "@/lib/wallet"

interface WalletContextType {
  starknetWallet: StarknetWallet | null
  xverseWallet: XverseWallet | null
  connectStarknet: () => Promise<void>
  connectXverse: () => Promise<void>
  disconnectStarknet: () => Promise<void>
  disconnectXverse: () => Promise<void>
  isConnecting: boolean
  error: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [starknetWallet, setStarknetWallet] = useState<StarknetWallet | null>(null)
  const [xverseWallet, setXverseWallet] = useState<XverseWallet | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectStarknet = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const wallet = await starknetProvider.connect()
      setStarknetWallet(wallet)
    } catch (err) {
      setError("Failed to connect Starknet wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const connectXverse = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const wallet = await xverseProvider.connect()
      setXverseWallet(wallet)
    } catch (err) {
      setError("Failed to connect Xverse wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectStarknet = async () => {
    await starknetProvider.disconnect()
    setStarknetWallet(null)
  }

  const disconnectXverse = async () => {
    await xverseProvider.disconnect()
    setXverseWallet(null)
  }

  // Check for existing connections on mount
  useEffect(() => {
    const starknetWallet = starknetProvider.getWallet()
    const xverseWallet = xverseProvider.getWallet()

    if (starknetWallet) setStarknetWallet(starknetWallet)
    if (xverseWallet) setXverseWallet(xverseWallet)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        starknetWallet,
        xverseWallet,
        connectStarknet,
        connectXverse,
        disconnectStarknet,
        disconnectXverse,
        isConnecting,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
