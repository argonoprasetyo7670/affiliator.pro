import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllArticles } from '@/lib/articles';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

export const metadata = {
    title: 'Blog - Affiliator Pro',
    description: 'Tips, tutorial, dan panduan seputar AI content creation dan affiliate marketing',
};

export default function BlogPage() {
    const articles = getAllArticles();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Kembali</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <Badge className="mb-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Blog
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Tips & Tutorial
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Pelajari cara memaksimalkan AI untuk konten marketing Anda
                    </p>
                </div>

                {/* Articles Grid */}
                {articles.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <Link key={article.slug} href={`/blog/${article.slug}`}>
                                <Card className="h-full hover:shadow-lg transition-shadow duration-300 dark:bg-slate-900/50 dark:border-slate-800 group cursor-pointer overflow-hidden">
                                    {article.image && (
                                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <CardContent className="p-5">
                                        <Badge
                                            variant="secondary"
                                            className="mb-3 text-xs"
                                        >
                                            {article.category}
                                        </Badge>
                                        <h2 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {article.title}
                                        </h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                                            {article.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {article.author}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(article.date).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {article.readTime}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-500 dark:text-slate-400">Belum ada artikel.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t bg-white/50 dark:bg-slate-900/50 py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
                    <p>© {new Date().getFullYear()} Affiliator Pro. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
