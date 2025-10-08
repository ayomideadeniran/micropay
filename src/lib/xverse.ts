
import { BtcAddress, getAddress, sendBtcTransaction } from 'sats-connect';

export interface PaymentInfo {
  address: string;
  amount: number; // Amount in satoshis
}

/**
 * Connects to the Xverse wallet and retrieves the user's Bitcoin payment address.
 * @returns {Promise<BtcAddress>} A promise that resolves with the user's address information.
 */
export const connectXverse = async (): Promise<BtcAddress> => {
  return new Promise((resolve, reject) => {
    getAddress({
      payload: {
        purposes: ['payment'],
        message: 'Connect to Micropay to unlock content with Bitcoin',
        network: {
          type: 'Mainnet',
        },
      },
      onFinish: (response) => {
        const paymentAddress = response.addresses.find(addr => addr.purpose === 'payment');
        if (paymentAddress) {
          resolve(paymentAddress);
        } else {
          reject(new Error('Could not retrieve payment address from Xverse wallet.'));
        }
      },
      onCancel: () => {
        reject(new Error('Xverse connection request was cancelled.'));
      },
    });
  });
};

/**
 * Requests the user to send a Bitcoin transaction using the Xverse wallet.
 * @param {PaymentInfo} paymentInfo - The recipient address and amount in satoshis.
 * @param {string} senderAddress - The sender's address.
 * @returns {Promise<string>} A promise that resolves with the transaction ID (txId).
 */
export const sendBtcPayment = async (paymentInfo: PaymentInfo, senderAddress: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    sendBtcTransaction({
      payload: {
        network: {
          type: 'Mainnet',
        },
        recipients: [
          {
            address: paymentInfo.address,
            amountSats: BigInt(Math.floor(paymentInfo.amount)), // Ensure amount is an integer BigInt
          },
        ],
        senderAddress: senderAddress,
      },
      onFinish: (txId) => {
        resolve(txId);
      },
      onCancel: () => {
        reject(new Error('Payment request was cancelled in Xverse wallet.'));
      },
    });
  });
};
