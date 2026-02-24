'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Clock } from 'lucide-react';
import { FadeInUpView, StaggerContainerView, ScaleIn } from './animated-section';

export function BenefitsSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <FadeInUpView className="text-center mb-16">
          <Badge className="mb-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
            Keunggulan AFFILIATOR PRO
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Unlimited • Fast • Easy
          </h2>
        </FadeInUpView>

        <StaggerContainerView className="grid md:grid-cols-3 gap-8">
          <ScaleIn>
            <Card className="text-center p-8 dark:bg-slate-900/50 dark:border-slate-800">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">Unlimited</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate konten sebanyak yang Anda mau. Tidak ada batasan harian!
              </p>
            </Card>
          </ScaleIn>

          <ScaleIn>
            <Card className="text-center p-8 dark:bg-slate-900/50 dark:border-slate-800">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">Fast</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Teknologi AI tercepat. Hasil dalam hitungan detik, bukan jam!
              </p>
            </Card>
          </ScaleIn>

          <ScaleIn>
            <Card className="text-center p-8 dark:bg-slate-900/50 dark:border-slate-800">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">Easy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Interface super user-friendly. Pemula pun langsung bisa pakai!
              </p>
            </Card>

          </ScaleIn>
        </StaggerContainerView>
      </div>
    </section>
  );
}
