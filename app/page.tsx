import { Sparkles } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { BenefitsSection } from '@/components/landing/benefits-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { CTASection } from '@/components/landing/cta-section';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const session = await auth();

  // Redirect to dashboard if already logged in
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <PricingSection />
      <CTASection />

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-foreground">AFFILIATOR PRO</span>
          </div>
          <p className="text-slate-400 mb-6 text-sm text-center">
            Platform AI terlengkap untuk afiliator Indonesia
          </p>

          {/* Main Links */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <a href="#features" className="text-slate-400 hover:text-foreground transition text-sm">Fitur</a>
            <a href="#pricing" className="text-slate-400 hover:text-foreground transition text-sm">Harga</a>
            <a href="/blog" className="text-slate-400 hover:text-foreground transition text-sm">Blog</a>
            <a href="/about" className="text-slate-400 hover:text-foreground transition text-sm">Tentang Kami</a>
            <a href="/contact" className="text-slate-400 hover:text-foreground transition text-sm">Kontak</a>
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-4 mb-6 text-xs">
            <a href="/privacy-policy" className="text-slate-500 hover:text-slate-400 transition">Kebijakan Privasi</a>
            <span className="text-slate-600">•</span>
            <a href="/terms-of-service" className="text-slate-500 hover:text-slate-400 transition">Syarat & Ketentuan</a>
          </div>

          <p className="text-sm text-slate-500 text-center">
            © {new Date().getFullYear()} AFFILIATOR PRO. Powered by Gemini 2.5 & Veo AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
