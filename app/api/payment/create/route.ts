import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentTransaction } from "@/lib/midtrans";
import { PACKAGES } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan } = await request.json();
    
    if (!plan || !PACKAGES[plan as keyof typeof PACKAGES]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const packageInfo = PACKAGES[plan as keyof typeof PACKAGES];
    const orderId = `ORDER-${session.user.id}-${Date.now()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        orderId,
        plan,
        amount: packageInfo.price,
        status: "pending"
      }
    });

    // Create Midtrans payment
    const midtransTransaction = await createPaymentTransaction(
      orderId,
      packageInfo.price,
      {
        first_name: session.user.name || "User",
        email: session.user.email,
        phone: "08123456789" // You can collect this from user profile
      }
    );

    // Update transaction with Midtrans token
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { midtransToken: midtransTransaction.token }
    });

    return NextResponse.json({
      token: midtransTransaction.token,
      redirect_url: midtransTransaction.redirect_url,
      clientKey: process.env.MIDTRANS_CLIENT_KEY, // Send client key to frontend
      orderId
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
