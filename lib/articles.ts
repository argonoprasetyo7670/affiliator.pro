import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Article {
    slug: string;
    title: string;
    description: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    image?: string;
    content: string;
}

export interface ArticleMeta {
    slug: string;
    title: string;
    description: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    image?: string;
}

const articlesDirectory = path.join(process.cwd(), 'content/articles');

export function getAllArticles(): ArticleMeta[] {
    // Check if directory exists
    if (!fs.existsSync(articlesDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(articlesDirectory);
    const allArticles = fileNames
        .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
        .map(fileName => {
            const slug = fileName.replace(/\.mdx?$/, '');
            const fullPath = path.join(articlesDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data } = matter(fileContents);

            return {
                slug,
                title: data.title || 'Untitled',
                description: data.description || '',
                category: data.category || 'Uncategorized',
                author: data.author || 'Admin',
                date: data.date || new Date().toISOString(),
                readTime: data.readTime || '5 min read',
                image: data.image,
            };
        });

    // Sort by date (newest first)
    return allArticles.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getArticleBySlug(slug: string): Article | null {
    // Check if directory exists
    if (!fs.existsSync(articlesDirectory)) {
        return null;
    }

    // Try .md first, then .mdx
    let fullPath = path.join(articlesDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(articlesDirectory, `${slug}.mdx`);
    }

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
        slug,
        title: data.title || 'Untitled',
        description: data.description || '',
        category: data.category || 'Uncategorized',
        author: data.author || 'Admin',
        date: data.date || new Date().toISOString(),
        readTime: data.readTime || '5 min read',
        image: data.image,
        content,
    };
}

export function getArticlesByCategory(category: string): ArticleMeta[] {
    const allArticles = getAllArticles();
    return allArticles.filter(article =>
        article.category.toLowerCase() === category.toLowerCase()
    );
}

export function getAllCategories(): string[] {
    const allArticles = getAllArticles();
    const categories = [...new Set(allArticles.map(article => article.category))];
    return categories;
}
