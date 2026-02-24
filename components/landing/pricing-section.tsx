'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';
import { FadeInUpView, StaggerContainerView, ScaleIn } from './animated-section';

interface PricingPlan {
  name: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  popular: boolean;
  gradient: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Trial",
    price: "10K",
    duration: "per hari",
    description: "Coba semua fitur premium",
    features: [
      "Akses 6 AI Studio",
      "Unlimited Generate",
      "Fast Processing",
      "Customer Support"
    ],
    popular: false,
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    name: "Starter",
    price: "25K",
    duration: "3 hari",
    description: "Paling populer untuk pemula",
    features: [
      "Semua fitur Trial",
      "Priority Processing",
      "Download HD Quality",
      "WhatsApp CS Priority"
    ],
    popular: true,
    gradient: "from-purple-500 to-pink-600"
  },
  {
    name: "Pro",
    price: "49K",
    duration: "7 hari",
    description: "Untuk afiliator serius",
    features: [
      "Semua fitur Starter",
      "Ultra Fast Processing",
      "Batch Processing",
      "Dedicated Account Manager"
    ],
    popular: false,
    gradient: "from-orange-500 to-red-600"
  }
];

function PricingCardSkeleton() {
  return (
    <Card className="h-full dark:bg-slate-900/50 dark:border-slate-800">
      <CardHeader className="text-center pb-8 pt-8">
        <Skeleton className="h-6 w-24 mx-auto mb-4" />
        <Skeleton className="h-14 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-20 mx-auto mb-4" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-8">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function PricingSection() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading untuk menampilkan skeleton
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 bg-white/50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <FadeInUpView className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
            Harga Spesial
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Pilih Paket yang Cocok
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Investasi kecil untuk hasil maksimal. Semua paket akses penuh!
          </p>
        </FadeInUpView>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, index) => (
                <PricingCardSkeleton key={index} />
              ))}
            </>
          ) : (
            <StaggerContainerView className="contents">
              {pricingPlans.map((plan, index) => (
                <ScaleIn key={index}>
                  <Card className={`relative h-full ${plan.popular ? 'ring-2 ring-purple-500 dark:ring-purple-400 shadow-xl scale-105' : ''} dark:bg-slate-900/50 dark:border-slate-800`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 text-[10px]">
                          ⭐ PALING POPULER
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-8 pt-8">
                      <CardTitle className="text-xl mb-2 dark:text-white">{plan.name}</CardTitle>
                      <div className={`text-4xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent mb-2`}>
                        {plan.price}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-xs">{plan.duration}</div>
                      <CardDescription className="mt-4 dark:text-slate-400 text-xs">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <a href="https://wa.me/6281315805251?text=Halo%20CS,%20saya%20mau%20order%20paket%20AFILIATOR%20PRO" target="_blank" rel="noopener noreferrer">
                        <Button
                          className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' : ''}`}
                          size="lg"
                        >
                          Pilih Paket Ini
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                </ScaleIn>
              ))}
            </StaggerContainerView>
          )}
        </div>
      </div>
    </section>
  );
}
