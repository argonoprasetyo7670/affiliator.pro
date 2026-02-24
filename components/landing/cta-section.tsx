'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, Zap, MessageCircle } from 'lucide-react';
import { ScaleInView } from './animated-section';
import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <ScaleInView className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-none text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <CardContent className="relative p-8 sm:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <Sparkles className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-xl sm:text-3xl font-bold mb-4">
              Siap Tingkatkan Konten Jualan Anda?
            </h2>
            <p className="text-sm sm:text-base text-blue-100 mb-8 max-w-2xl mx-auto">
              Bergabung dengan ratusan afiliator sukses yang sudah menggunakan AFILIATOR PRO
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" variant="secondary" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 gap-2 w-full sm:w-auto">
                  <Zap className="w-5 h-5" />
                  Mulai Sekarang
                </Button>
              </Link>
              <a href="https://wa.me/6281315805251" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white w-full sm:w-auto">
                  <MessageCircle className="w-5 h-5" />
                  Chat CS Admin
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </ScaleInView>
    </section>
  );
}
