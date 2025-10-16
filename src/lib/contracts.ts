
import { Account, Contract, Provider } from 'starknet';
import { CONTRACT_ADDRESS } from './constants';
import abi from './abi.json';

export const getContentPrice = async (account: Account, contentId: string) => {
  const contract = new Contract(abi, CONTRACT_ADDRESS, account);
  try {
    const price = await contract.get_content_price(contentId);
    return price;
  } catch (error) {
    console.error('Error getting content price:', error);
    return null;
  }
};

export const getCreatorBalance = async (account: Account) => {
  const contract = new Contract(abi, CONTRACT_ADDRESS, account);
  try {
    const balance = await contract.get_creator_balance(account.address);
    return balance;
  } catch (error) {
    console.error('Error getting creator balance:', error);
    return null;
  }
};
