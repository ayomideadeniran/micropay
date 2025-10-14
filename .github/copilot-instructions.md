# Copilot Instructions for micropay

## Project Overview
- **micropay** is a Next.js application with a smart contract integration (StarkNet/Cairo) for micropayments.
- The frontend is in `src/` (Next.js app directory structure).
- Smart contract code is in `smart_contract/` (Cairo, Scarb, snfoundry).

## Key Components
- **Frontend:**
  - Pages: `src/app/`
  - Components: `src/components/`
  - API routes: `src/app/api/`
  - Utility libraries: `src/lib/`
- **Smart Contracts:**
  - Cairo source: `smart_contract/src/`
  - Tests: `smart_contract/tests/`
  - Build artifacts: `smart_contract/target/dev/`

## Developer Workflows
- **Start frontend dev server:**
  - `npm run dev` (Next.js)
- **Build smart contracts:**
  - Use Scarb (`scarb build`) in `smart_contract/`
- **Test smart contracts:**
  - Use snfoundry (`snfoundry test`) in `smart_contract/`

## Patterns & Conventions
- **API routes** use Next.js route handlers (`route.ts`) for endpoints (see `src/app/api/invoice/route.ts`).
- **Component structure:**
  - UI components in `src/components/ui/`
  - Wallet/payment logic in `src/components/wallet-provider.tsx`, `src/components/payment-modal.tsx`, and related files.
- **Smart contract integration:**
  - Wallet and contract logic in `src/lib/wallet.ts`, `src/lib/cashu.ts`, and `src/lib/oracle.ts`.
  - Artifacts are read from `smart_contract/target/dev/`.
- **Styling:**
  - Global styles in `src/app/globals.css`.
  - Uses PostCSS (`postcss.config.mjs`).
- **TypeScript:**
  - All frontend code is TypeScript.

## Integration Points
- **Frontend ↔ Smart Contracts:**
  - Interact via wallet logic in `src/lib/wallet.ts` and related components.
  - Contract addresses/artifacts are loaded from `smart_contract/target/dev/`.
- **External dependencies:**
  - Next.js, Cairo, Scarb, snfoundry, PostCSS.

## Examples
- To add a new payment feature, update `src/components/payment-modal.tsx` and related wallet logic in `src/lib/wallet.ts`.
- To add a new smart contract, place Cairo code in `smart_contract/src/`, update build/test scripts, and expose via frontend wallet logic.

---
If any section is unclear or missing, please provide feedback for improvement.