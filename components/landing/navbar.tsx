'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Image 
              src="/affiliator.png" 
              alt="Affiliator Logo" 
              width={180} 
              height={45}
              className="h-10 w-auto"
              priority
            />
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ModeToggle />
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Mulai Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </nav>
  );
}
