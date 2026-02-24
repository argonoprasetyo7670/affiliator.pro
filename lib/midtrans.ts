import midtransClient from 'midtrans-client';

// Initialize Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
});

export async function createPaymentTransaction(orderId: string, amount: number, customerDetails: any) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: customerDetails,
    enabled_payments: ['gopay', 'shopeepay', 'bank_transfer', 'echannel', 'qris'],
    credit_card: {
      secure: true
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return transaction;
  } catch (error) {
    console.error('Midtrans error:', error);
    throw error;
  }
}

export async function getTransactionStatus(orderId: string) {
  try {
    const statusResponse = await snap.transaction.status(orderId);
    return statusResponse;
  } catch (error) {
    console.error('Midtrans status error:', error);
    throw error;
  }
}
