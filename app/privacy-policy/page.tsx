'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                    <CardContent className="p-8 prose dark:prose-invert max-w-none">
                        <h1 className="text-3xl font-bold mb-2">Kebijakan Privasi</h1>
                        <p className="text-muted-foreground mb-8">Terakhir diperbarui: 7 Februari 2026</p>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">1. Pendahuluan</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Affiliator Pro ("kami", "kita", atau "milik kami") mengoperasikan platform affiliator.pro (selanjutnya disebut "Layanan"). Halaman ini menginformasikan kepada Anda tentang kebijakan kami mengenai pengumpulan, penggunaan, dan pengungkapan data pribadi ketika Anda menggunakan Layanan kami.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                                Kami menggunakan data Anda untuk menyediakan dan meningkatkan Layanan. Dengan menggunakan Layanan, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan ini.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">2. Pengumpulan dan Penggunaan Informasi</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Kami mengumpulkan beberapa jenis informasi berbeda untuk berbagai tujuan guna menyediakan dan meningkatkan Layanan kami kepada Anda.
                            </p>
                            <h3 className="text-lg font-medium mb-2">Jenis Data yang Dikumpulkan:</h3>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li><strong>Data Pribadi:</strong> Nama, alamat email, nomor telepon (opsional)</li>
                                <li><strong>Data Penggunaan:</strong> Informasi tentang bagaimana Layanan diakses dan digunakan</li>
                                <li><strong>Data Cookies:</strong> Cookies dan data pelacakan serupa</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">3. Penggunaan Cookies</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Kami menggunakan cookies dan teknologi pelacakan serupa untuk melacak aktivitas di Layanan kami dan menyimpan informasi tertentu.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Cookies adalah file dengan sejumlah kecil data yang mungkin menyertakan pengenal unik anonim. Cookies dikirim ke browser Anda dari situs web dan disimpan di perangkat Anda.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                                Anda dapat menginstruksikan browser Anda untuk menolak semua cookies atau untuk menunjukkan kapan cookie dikirim. Namun, jika Anda tidak menerima cookies, Anda mungkin tidak dapat menggunakan beberapa bagian dari Layanan kami.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">4. Google AdSense</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Kami menggunakan Google AdSense untuk menampilkan iklan di situs web kami. Google AdSense menggunakan cookies untuk menampilkan iklan berdasarkan kunjungan pengguna ke situs kami dan/atau situs lain di Internet.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Pengguna dapat memilih keluar dari penggunaan cookie DART dengan mengunjungi halaman kebijakan privasi iklan dan jaringan konten Google di: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://policies.google.com/technologies/ads</a>
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">5. Keamanan Data</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Keamanan data Anda penting bagi kami, tetapi ingat bahwa tidak ada metode transmisi melalui Internet atau metode penyimpanan elektronik yang 100% aman. Meskipun kami berusaha menggunakan cara yang dapat diterima secara komersial untuk melindungi Data Pribadi Anda, kami tidak dapat menjamin keamanan absolutnya.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">6. Penyedia Layanan</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Kami dapat mempekerjakan perusahaan dan individu pihak ketiga untuk memfasilitasi Layanan kami ("Penyedia Layanan"), untuk menyediakan Layanan atas nama kami, untuk melakukan layanan terkait Layanan, atau untuk membantu kami dalam menganalisis bagaimana Layanan kami digunakan.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">7. Perubahan Kebijakan Privasi</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                                Anda disarankan untuk meninjau Kebijakan Privasi ini secara berkala untuk setiap perubahan. Perubahan pada Kebijakan Privasi ini efektif ketika diposting di halaman ini.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">8. Hubungi Kami</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui halaman <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Kontak</Link>.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white/50 dark:bg-slate-900/50 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
                    <p>© 2026 Affiliator Pro. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
