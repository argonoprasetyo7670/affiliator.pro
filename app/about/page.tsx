'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Target, Users, Zap } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Kembali</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <Badge className="mb-4 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        Tentang Kami
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Affiliator Pro
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Platform AI generatif terdepan untuk kreator konten dan affiliate marketer di Indonesia
                    </p>
                </div>

                {/* Mission Section */}
                <Card className="dark:bg-slate-900/50 dark:border-slate-800 mb-8">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-3 dark:text-white">Misi Kami</h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Misi kami adalah memberdayakan kreator konten dan affiliate marketer di Indonesia dengan teknologi AI terdepan. Kami percaya bahwa setiap orang berhak memiliki akses ke tools profesional untuk menciptakan konten berkualitas tinggi tanpa hambatan teknis atau biaya mahal.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Values Section */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-semibold mb-2 dark:text-white">Inovasi</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Menggunakan teknologi AI terbaru seperti Google Veo untuk hasil terbaik
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-semibold mb-2 dark:text-white">Aksesibilitas</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Mudah digunakan siapa saja, tidak perlu keahlian teknis
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="font-semibold mb-2 dark:text-white">Kecepatan</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Generate konten dalam hitungan detik, bukan jam
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Features Summary */}
                <Card className="dark:bg-slate-900/50 dark:border-slate-800 mb-8">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6 dark:text-white">Apa yang Kami Tawarkan</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                <div>
                                    <h4 className="font-medium dark:text-white">Image Generator</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Generate gambar produk profesional dengan AI. Support reference image untuk hasil yang konsisten.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                                <div>
                                    <h4 className="font-medium dark:text-white">Video Generator</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Buat video sinematik dengan Google Veo AI. Support text-to-video dan image-to-video dengan opsi upscale hingga 4K.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                                <div>
                                    <h4 className="font-medium dark:text-white">API Access</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Integrasikan kemampuan AI kami ke aplikasi Anda dengan REST API yang lengkap dan dokumentasi yang jelas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Siap untuk memulai perjalanan kreasi konten Anda?
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Mulai Gratis Sekarang
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white/50 dark:bg-slate-900/50 py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
                    <p>© {new Date().getFullYear()} Affiliator Pro. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
