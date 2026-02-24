'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  MessageCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  Rocket
} from 'lucide-react';
import { fadeInUp, staggerContainer, scaleIn } from './animated-section';

const stats = [
  { label: "Content Created", value: "10K+", icon: Sparkles },
  { label: "Active Users", value: "500+", icon: TrendingUp },
  { label: "Success Rate", value: "98%", icon: Star },
  { label: "Uptime", value: "99.9%", icon: Shield }
];

export function HeroSection() {
  return (
    <section className="pt-20 pb-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge className="mb-6 text-sm px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              <Rocket className="w-4 h-4 mr-2" />
              Powered by Gemini 2.5 & Veo AI
            </Badge>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
            variants={fadeInUp}
          >
            Konten Jualan Auto Viral
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dalam Hitungan Detik
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            Platform AI terlengkap untuk afiliator Indonesia. Buat copywriting, foto produk, video promosi, dan lebih banyak lagi - <strong>tanpa skill desain!</strong>
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            variants={fadeInUp}
          >
            <Link href="/auth/login">
              <Button size="lg" className="text-base px-8 py-6 gap-2 w-full sm:w-auto">
                <Zap className="w-5 h-5" />
                Coba Gratis Sekarang
              </Button>
            </Link>
            <a href="https://wa.me/6281315805251" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 gap-2 w-full sm:w-auto">
                <MessageCircle className="w-5 h-5" />
                Hubungi CS Admin
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16"
            variants={staggerContainer}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={scaleIn}
                >
                  <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                    <CardContent className="pt-6 text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
