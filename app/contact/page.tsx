'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast.success('Pesan Anda telah terkirim!');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

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
                    <Badge className="mb-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Hubungi Kami
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Ada Pertanyaan?
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Tim kami siap membantu Anda. Kirimkan pesan dan kami akan merespons secepat mungkin.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium dark:text-white">Email</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            support@affiliator.pro
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium dark:text-white">Live Chat</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            Tersedia di dashboard
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <strong className="text-slate-900 dark:text-white">Jam Operasional:</strong><br />
                                Senin - Jumat: 09:00 - 18:00 WIB<br />
                                Sabtu: 09:00 - 15:00 WIB
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-2">
                        <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                            <CardContent className="p-6">
                                {isSubmitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Pesan Terkirim!</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                                            Terima kasih telah menghubungi kami. Tim kami akan merespons dalam 1-2 hari kerja.
                                        </p>
                                        <Button onClick={() => setIsSubmitted(false)} variant="outline">
                                            Kirim Pesan Lain
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 dark:text-white">
                                                    Nama <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Nama lengkap Anda"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 dark:text-white">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="email@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 dark:text-white">
                                                Subjek
                                            </label>
                                            <Input
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="Topik pesan Anda"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 dark:text-white">
                                                Pesan <span className="text-red-500">*</span>
                                            </label>
                                            <Textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Tuliskan pesan Anda di sini..."
                                                rows={5}
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="animate-spin mr-2">⏳</span>
                                                    Mengirim...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Kirim Pesan
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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
