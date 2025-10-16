"use client";

import { sepolia } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  useInjectedConnectors,
} from "@starknet-react/core";
import { ReactNode } from "react";

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { connectors } = useInjectedConnectors({
    // Show recommended connectors at the top of the list
    recommended: [argent(), braavos()],
    // Show recommended connectors at the top of the list
    includeRecommended: "always",
    // Sort connectors alphabetically by name
    order: "alphabetical",
  });

  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={publicProvider()}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
