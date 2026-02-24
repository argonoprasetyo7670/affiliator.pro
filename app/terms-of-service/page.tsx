'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
                        <h1 className="text-3xl font-bold mb-2">Syarat dan Ketentuan</h1>
                        <p className="text-muted-foreground mb-8">Terakhir diperbarui: 7 Februari 2026</p>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">1. Penerimaan Syarat</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Dengan mengakses dan menggunakan layanan Affiliator Pro ("Layanan"), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak boleh mengakses Layanan.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">2. Deskripsi Layanan</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Affiliator Pro adalah platform berbasis AI yang menyediakan layanan pembuatan konten digital, termasuk:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li>Image Generator - Pembuatan gambar dengan AI</li>
                                <li>Video Generator - Pembuatan video dengan Google Veo AI</li>
                                <li>API Access - Akses programatik ke layanan kami</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">3. Akun Pengguna</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Untuk menggunakan Layanan, Anda harus membuat akun dengan memberikan informasi yang akurat dan lengkap. Anda bertanggung jawab untuk:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li>Menjaga kerahasiaan kata sandi akun Anda</li>
                                <li>Semua aktivitas yang terjadi di bawah akun Anda</li>
                                <li>Memberitahu kami segera jika ada penggunaan tidak sah</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">4. Sistem Kredit</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Layanan kami menggunakan sistem kredit untuk penggunaan fitur-fitur AI:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li>Kredit dapat dibeli melalui metode pembayaran yang tersedia</li>
                                <li>Kredit tidak dapat dikembalikan setelah digunakan</li>
                                <li>Kredit memiliki masa berlaku sesuai paket yang dipilih</li>
                                <li>Kami berhak mengubah harga kredit dengan pemberitahuan sebelumnya</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">5. Penggunaan yang Dilarang</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Anda dilarang menggunakan Layanan untuk:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li>Membuat konten ilegal, berbahaya, atau melanggar hukum</li>
                                <li>Melanggar hak kekayaan intelektual pihak lain</li>
                                <li>Menyebarkan malware atau kode berbahaya</li>
                                <li>Melakukan penipuan atau kegiatan menyesatkan</li>
                                <li>Membuat konten pornografi atau eksploitasi anak</li>
                                <li>Menggunakan layanan untuk spam atau penyalahgunaan</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">6. Hak Kekayaan Intelektual</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Konten yang Anda hasilkan menggunakan Layanan kami adalah milik Anda, dengan ketentuan:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li>Anda memiliki hak atas output yang dihasilkan dari input Anda</li>
                                <li>Anda bertanggung jawab atas penggunaan konten tersebut</li>
                                <li>Kami memiliki hak untuk menggunakan konten anonim untuk peningkatan layanan</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">7. Batasan Tanggung Jawab</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Layanan disediakan "sebagaimana adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                                <li>Kerugian langsung atau tidak langsung dari penggunaan Layanan</li>
                                <li>Gangguan layanan atau kehilangan data</li>
                                <li>Kualitas atau kesesuaian output AI dengan tujuan tertentu</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">8. Penghentian</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Kami berhak menangguhkan atau menghentikan akses Anda ke Layanan kapan saja, tanpa pemberitahuan sebelumnya, jika Anda melanggar Syarat dan Ketentuan ini.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">9. Perubahan Syarat</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Kami berhak untuk memodifikasi atau mengganti Syarat ini kapan saja. Perubahan akan efektif segera setelah diposting di halaman ini. Penggunaan berkelanjutan Anda atas Layanan setelah perubahan tersebut merupakan penerimaan Anda terhadap syarat baru.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">10. Hukum yang Berlaku</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Syarat ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan ketentuan konflik hukumnya.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">11. Hubungi Kami</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami melalui halaman <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Kontak</Link>.
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
