import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash2, FolderCode, ExternalLink, Calendar, Rocket, Layout, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Project {
    id: number;
    slug: string;
    title_id: string;
    title_en: string;
    status: 'draft' | 'published';
    is_featured: boolean;
    tech_stack: string[] | null;
    published_at: string | null;
    created_at: string;
    show_in_cv: boolean;
}

interface PaginatedData {
    data: Project[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    projects: PaginatedData;
}

export default function ProjectIndex({ projects }: Props) {
    const handleDelete = (slug: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            router.delete(`/admin/projects/${slug}`, {
                onSuccess: () => toast.success('Project deleted'),
            });
        }
    };

    return (
        <>
            <Head title="Manage Projects" />
            <div className="mx-auto max-w-6xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Portfolio Projects</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Showcase your best work and technical achievements.</p>
                    </div>
                    <Link href="/admin/projects/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Launch New Project
                        </Button>
                    </Link>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FolderCode className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Project Inventory</CardTitle>
                            </div>
                            <Badge variant="secondary" className="font-mono">{projects.total} Total</Badge>
                        </div>
                        <CardDescription>All your creations, from drafts to live productions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {projects.data.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
                                        <Rocket size={24} />
                                    </div>
                                    <p className="text-muted-foreground">No projects yet. Time to build something great!</p>
                                </div>
                            ) : (
                                projects.data.map((project) => (
                                    <div key={project.id} className="group flex items-center justify-between p-6 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="truncate font-bold text-neutral-900 dark:text-neutral-100">{project.title_en}</h3>
                                                <div className="flex gap-1.5">
                                                    <Badge className={project.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-neutral-500/10 text-neutral-500'}>
                                                        {project.status}
                                                    </Badge>
                                                    {project.is_featured && <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Featured</Badge>}
                                                    {project.show_in_cv && <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">In CV</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {project.tech_stack?.slice(0, 5).map((tech, i) => (
                                                    <span key={i} className="text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {project.tech_stack && project.tech_stack.length > 5 && (
                                                    <span className="text-[10px] text-neutral-400">+{project.tech_stack.length - 5} more</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 pt-1">
                                                <span className="flex items-center gap-1 text-xs text-neutral-400">
                                                    <Calendar size={12} />
                                                    {new Date(project.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            {project.status === 'published' && (
                                                <Link href={`/projects/${project.slug}`} target="_blank">
                                                    <Button variant="outline" size="sm" className="h-9">
                                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link href={`/admin/projects/${project.slug}/edit`}>
                                                <Button variant="outline" size="sm" className="h-9">
                                                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(project.slug)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {projects.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t p-4">
                                {Array.from({ length: projects.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link key={page} href={`/admin/projects?page=${page}`}>
                                        <Button
                                            variant={page === projects.current_page ? 'default' : 'outline'}
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
