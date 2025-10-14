import { Account, Contract, json, Provider, hash, cairo } from "starknet";
import fs from "fs";

// --- CONFIGURATION ---
const contractAddress = "0x03041c3c9bac50a6412900348abb4dd3dd99e901144e122e787052fe616b1727";
const accountAddress = "0x00c12fe2896d8083da7a8d1f85121d32"; // Replace with your account address
const privateKey = "0x00c12fe2896d8083da7a8d1f85121d32"; // Replace with your deployer private key
const providerUrl = "https://starknet-sepolia.public.blastapi.io"; // Replace with your RPC endpoint

const content = [
  {
    id: "1",
    price: 0.001,
  },
  {
    id: "2",
    price: 0.005,
  },
  {
    id: "3",
    price: 0.002,
  },
];

async function main() {
  const provider = new Provider({ nodeUrl: providerUrl });
  const account = new Account(provider, contractAddress, privateKey);

  const { abi } = await provider.getClassAt(contractAddress);
  const paymentContract = new Contract(abi, contractAddress, account);

  console.log("Setting content prices...");

  for (const item of content) {
    const contentId = hash.getSelectorFromName(item.id);
    const priceInWei = cairo.uint256(BigInt(item.price * 1e18));

    console.log(`Setting price for content ${item.id} to ${item.price} STRK...`);

    const tx = await paymentContract.set_content_price(contentId, priceInWei);
    await provider.waitForTransaction(tx.transaction_hash);

    console.log(`Price set for content ${item.id}.`);
  }

  console.log("All content prices set successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
