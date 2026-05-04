import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Trash2, BookOpen, Eye, Clock, Hash, Newspaper, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Blog {
    id: number;
    slug: string;
    title_en: string;
    status: 'draft' | 'published';
    reading_time: number;
    view_count: number;
    published_at: string | null;
    created_at: string;
    tags: { id: number; name_en: string }[];
}

interface PaginatedData { data: Blog[]; current_page: number; last_page: number; total: number; }

export default function BlogIndex({ blogs }: { blogs: PaginatedData }) {
    const handleDelete = (slug: string) => {
        if (confirm('Are you sure you want to delete this article?')) {
            router.delete(`/admin/blogs/${slug}`, {
                onSuccess: () => toast.success('Article deleted'),
            });
        }
    };

    return (
        <>
            <Head title="Manage Blog" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Blog & Articles</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Share your thoughts, tutorials, and insights with the world.</p>
                    </div>
                    <Link href="/admin/blogs/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Compose Article
                        </Button>
                    </Link>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Content Manager</CardTitle>
                            </div>
                            <Badge variant="secondary" className="font-mono">{blogs.total} Articles</Badge>
                        </div>
                        <CardDescription>Manage your published content and editorial drafts.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {blogs.data.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
                                        <Newspaper size={24} />
                                    </div>
                                    <p className="text-muted-foreground">Your blog is empty. Start writing today!</p>
                                </div>
                            ) : (
                                blogs.data.map((blog) => (
                                    <div key={blog.id} className="group flex items-center justify-between p-6 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="truncate font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 transition-colors">{blog.title_en}</h3>
                                                <Badge className={blog.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-neutral-500/10 text-neutral-500'}>
                                                    {blog.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> {blog.reading_time} min
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Eye size={12} /> {blog.view_count} views
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(blog.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {blog.tags.map((tag) => (
                                                    <span key={tag.id} className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                                                        <Hash size={8} /> {tag.name_en}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Link href={`/admin/blogs/${blog.slug}/edit`}>
                                                <Button variant="outline" size="sm" className="h-9">
                                                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(blog.slug)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {blogs.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t p-4">
                                {Array.from({ length: blogs.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link key={page} href={`/admin/blogs?page=${page}`}>
                                        <Button
                                            variant={page === blogs.current_page ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                        >
                                            {page}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
