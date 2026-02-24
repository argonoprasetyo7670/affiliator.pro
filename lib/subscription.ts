import { prisma } from "./prisma";

export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId }
  });

  // Create trial subscription for new users
  if (!subscription) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // 1 day trial

    subscription = await prisma.subscription.create({
      data: {
        userId,
        plan: "trial",
        status: "active",
        startDate,
        endDate,
        price: 0
      }
    });
  }

  return subscription;
}

export async function checkSubscriptionStatus(userId: string) {
  const subscription = await getOrCreateSubscription(userId);
  const now = new Date();
  
  // Update status if expired
  if (subscription.endDate < now && subscription.status === "active") {
    await prisma.subscription.update({
      where: { userId },
      data: { status: "expired" }
    });
    return { ...subscription, status: "expired" };
  }

  return subscription;
}

export function isSubscriptionActive(subscription: any) {
  return subscription.status === "active" && subscription.endDate > new Date();
}

export const PACKAGES = {
  trial: { name: "Trial", days: 1, price: 10000, pricePerDay: 10000 },
  starter: { name: "Starter", days: 3, price: 25000, pricePerDay: 8333 },
  pro: { name: "Pro", days: 7, price: 49000, pricePerDay: 7000 }
};
