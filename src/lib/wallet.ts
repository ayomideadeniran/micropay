// Mock Starknet.js integration for demonstration
export interface StarknetWallet {
  address: string
  isConnected: boolean
  balance: number
  network: string
}

export interface XverseWallet {
  address: string
  isConnected: boolean
  balance: number
  network: string
}

export class MockStarknetProvider {
  private wallet: StarknetWallet | null = null

  async connect(): Promise<StarknetWallet> {
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock successful connection
    this.wallet = {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      isConnected: true,
      balance: Math.random() * 100,
      network: "mainnet-alpha",
    }

    return this.wallet
  }

  async disconnect(): Promise<void> {
    this.wallet = null
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected")

    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Return mock transaction hash
    return `0x${Math.random().toString(16).substr(2, 64)}`
  }

  getWallet(): StarknetWallet | null {
    return this.wallet
  }
}

export class MockXverseProvider {
  private wallet: XverseWallet | null = null

  async connect(): Promise<XverseWallet> {
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock successful connection
    this.wallet = {
      address: `bc1q${Math.random().toString(36).substr(2, 32)}`,
      isConnected: true,
      balance: Math.floor(Math.random() * 1000000), // sats
      network: "mainnet",
    }

    return this.wallet
  }

  async disconnect(): Promise<void> {
    this.wallet = null
  }

  async sendBitcoin(to: string, amount: number): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected")

    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 4000))

    // Return mock transaction hash
    return Math.random().toString(16).substr(2, 64)
  }

  getWallet(): XverseWallet | null {
    return this.wallet
  }
}

// Global providers
export const starknetProvider = new MockStarknetProvider()
export const xverseProvider = new MockXverseProvider()
