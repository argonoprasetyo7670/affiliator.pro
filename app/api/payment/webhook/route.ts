import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { PACKAGES } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Midtrans Webhook] Received notification:', {
      orderId: body.order_id,
      transactionStatus: body.transaction_status,
      paymentType: body.payment_type,
      fraudStatus: body.fraud_status
    });
    
    // Verify Midtrans signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const signatureKey = body.signature_key;
    const orderId = body.order_id;
    const statusCode = body.status_code;
    const grossAmount = body.gross_amount;
    
    const hash = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');
    
    if (hash !== signatureKey) {
      console.error('[Midtrans Webhook] Invalid signature!', { orderId });
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.log('[Midtrans Webhook] ✅ Signature verified');

    // Update transaction status
    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
      include: { user: true }
    });

    if (!transaction) {
      console.error('[Midtrans Webhook] Transaction not found:', orderId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    let transactionStatus = 'pending';
    
    // Handle different transaction statuses
    if (body.transaction_status === 'capture') {
      // For credit card, check fraud status
      if (body.fraud_status === 'accept') {
        transactionStatus = 'success';
      } else if (body.fraud_status === 'challenge') {
        transactionStatus = 'pending'; // Manual review needed
      }
    } else if (body.transaction_status === 'settlement') {
      transactionStatus = 'success';
    } else if (body.transaction_status === 'cancel' || body.transaction_status === 'deny' || body.transaction_status === 'expire') {
      transactionStatus = 'failed';
    } else if (body.transaction_status === 'pending') {
      transactionStatus = 'pending';
    }

    console.log('[Midtrans Webhook] Updating transaction:', {
      orderId,
      oldStatus: transaction.status,
      newStatus: transactionStatus
    });

    await prisma.transaction.update({
      where: { orderId },
      data: {
        status: transactionStatus,
        paymentType: body.payment_type,
        transactionId: body.transaction_id
      }
    });

    // If payment successful, activate subscription
    if (transactionStatus === 'success') {
      console.log('[Midtrans Webhook] 💰 Payment successful, activating subscription...', {
        userId: transaction.userId,
        plan: transaction.plan,
        amount: transaction.amount
      });

      const packageInfo = PACKAGES[transaction.plan as keyof typeof PACKAGES];
      
      if (!packageInfo) {
        console.error('[Midtrans Webhook] Invalid package:', transaction.plan);
        return NextResponse.json({ error: "Invalid package" }, { status: 400 });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + packageInfo.days);

      const subscription = await prisma.subscription.upsert({
        where: { userId: transaction.userId },
        create: {
          userId: transaction.userId,
          plan: transaction.plan,
          status: "active",
          startDate,
          endDate,
          price: transaction.amount
        },
        update: {
          plan: transaction.plan,
          status: "active",
          startDate,
          endDate,
          price: transaction.amount
        }
      });

      console.log('[Midtrans Webhook] ✅ Subscription activated!', {
        subscriptionId: subscription.id,
        userId: transaction.userId,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        userEmail: transaction.user.email
      });

      // TODO: Send email notification to user
      // await sendSubscriptionActivationEmail(transaction.user.email, subscription);
    } else {
      console.log('[Midtrans Webhook] ℹ️ Transaction status:', transactionStatus, '- No action taken');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      transactionStatus 
    });
  } catch (error: any) {
    console.error("[Midtrans Webhook] ❌ Error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for testing (Midtrans will send test notifications)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Midtrans webhook endpoint is ready",
    endpoint: "/api/payment/webhook",
    methods: ["POST"],
    note: "Configure this URL in Midtrans Dashboard > Settings > Configuration > Payment Notification URL"
  });
}
