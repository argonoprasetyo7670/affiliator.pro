import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getArticleBySlug, getAllArticles } from '@/lib/articles';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { ShareButton } from '@/components/share-button';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const articles = getAllArticles();
    return articles.map((article) => ({
        slug: article.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) {
        return {
            title: 'Article Not Found',
        };
    }

    return {
        title: `${article.title} - Affiliator Pro`,
        description: article.description,
    };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/blog" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Kembali ke Blog</span>
                    </Link>
                    <ShareButton title={article.title} />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Article Header */}
                <div className="mb-8">
                    <Badge className="mb-4">{article.category}</Badge>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        {article.title}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                        {article.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {article.author}
                        </span>
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {article.readTime}
                        </span>
                    </div>
                </div>

                {/* Featured Image */}
                {article.image && (
                    <div className="mb-8 rounded-xl overflow-hidden">
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full aspect-video object-cover"
                        />
                    </div>
                )}

                {/* Article Content */}
                <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                    <CardContent className="p-8">
                        <article className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-slate-900 dark:prose-strong:text-white prose-ul:text-slate-600 dark:prose-ul:text-slate-400 prose-ol:text-slate-600 dark:prose-ol:text-slate-400">
                            <ReactMarkdown>{article.content}</ReactMarkdown>
                        </article>
                    </CardContent>
                </Card>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <Card className="dark:bg-slate-900/50 dark:border-slate-800 p-8">
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">
                            Siap mencoba Affiliator Pro?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Generate gambar dan video berkualitas tinggi dengan AI
                        </p>
                        <Link
                            href="/auth/register"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Mulai Gratis Sekarang
                        </Link>
                    </Card>
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
