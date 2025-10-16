# Micropayments Smart Contract

This document provides an overview of the Micropayments smart contract, its features, and how to interact with it.

## Project Overview

The Micropayments smart contract is a decentralized application that allows creators to monetize their digital content. Users can pay to unlock content using STRK tokens, a voucher system for enhanced privacy, or even with Bitcoin through an oracle-based integration.

## Smart Contract Features

- **Content Unlocking:** Creators can set prices for their content, and users can pay to unlock it.
- **STRK Payments:** The contract supports payments using the STRK token.
- **Creator Earnings and Withdrawals:** Creators can withdraw their earnings from the contract.
- **Dashboard Support:** The contract exposes several query functions to support a dashboard for creators and users.
- **Privacy Layer (Voucher System):** A voucher system is implemented to enhance user privacy by breaking the on-chain link between the user's main wallet and the content they unlock.
- **Bitcoin Integration (Oracle-Based):** The contract supports Bitcoin payments through a trusted oracle that monitors Bitcoin transactions and notifies the contract to unlock content. This project proposes using Atomiq (one of the hackathon sponsors) as the bridge partner for handling BTC to STRK swaps and making the oracle calls.

## How to Build and Test

To build the contract, run the following command:

```
scarb build
```

To run the tests, use the following command:

```
scarb test
```

## Available Functions

### IPaymentManager Interface

- `redeem_voucher(voucher: felt252, content_id: felt252, creator: ContractAddress)`: Redeems a voucher to unlock a piece of content.
- `get_unlocked_content(user: ContractAddress, content_id: felt252) -> bool`: Checks if a user has unlocked a specific piece of content.
- `withdraw(amount: u256)`: Allows a creator to withdraw their earnings.
- `get_content_price(content_id: felt252) -> u256`: Gets the price of a specific piece of content.
- `get_creator_balance(creator: ContractAddress) -> u256`: Gets the balance of a creator.
- `get_content_unlock_count(content_id: felt252) -> u256`: Gets the number of times a piece of content has been unlocked.

### Custom External Functions

- `set_content_price(content_id: felt252, price: u256)`: Sets the price of a specific piece of content. Can only be called by the owner.
- `buy_voucher(price: u256)`: Buys a voucher for a specific price.
- `set_oracle_address(oracle_address: ContractAddress)`: Sets the address of the oracle. Can only be called by the owner.
- `unlock_with_btc(user: ContractAddress, content_id: felt252, creator: ContractAddress)`: Unlocks a piece of content with a BTC payment. Can only be called by the oracle.
