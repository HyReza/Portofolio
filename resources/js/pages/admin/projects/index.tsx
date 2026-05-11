import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Edit, Plus, Trash2, FolderCode, ExternalLink, Calendar, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
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
    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();

    const handleDelete = (slug: string, title: string) => {
        confirm({
            title: 'Delete Project?',
            description: `"${title}" will be permanently deleted. This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: () => {
                router.delete(`/admin/projects/${slug}`, {
                    onSuccess: () => toast.success('Project deleted'),
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Projects', href: '/admin/projects' }]}>
            <Head title="Manage Projects" />
            <ConfirmDialog {...dialogProps} />

            <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-8 pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Portfolio Projects</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Showcase your best work and technical achievements.</p>
                    </div>
                    <Link href="/admin/projects/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </Link>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FolderCode className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-base sm:text-lg">Project Inventory</CardTitle>
                            </div>
                            <Badge variant="secondary" className="font-mono text-xs">{projects.total} Total</Badge>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">All your creations, from drafts to live productions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {projects.data.length === 0 ? (
                                <div className="py-16 sm:py-20 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
                                        <Rocket size={24} />
                                    </div>
                                    <p className="text-muted-foreground text-sm">No projects yet. Time to build something great!</p>
                                </div>
                            ) : (
                                projects.data.map((project) => (
                                    <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-3 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-start sm:items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 break-words">{project.title_en || project.title_id}</h3>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <Badge className={`text-[10px] ${project.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-neutral-500/10 text-neutral-500'}`}>
                                                        {project.status}
                                                    </Badge>
                                                    {project.is_featured && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">Featured</Badge>}
                                                    {project.show_in_cv && <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">In CV</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {project.tech_stack?.slice(0, 4).map((tech, i) => (
                                                    <span key={i} className="text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {project.tech_stack && project.tech_stack.length > 4 && (
                                                    <span className="text-[10px] text-neutral-400">+{project.tech_stack.length - 4}</span>
                                                )}
                                            </div>
                                            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                                                <Calendar size={11} />
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {/* Actions — always visible */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {project.status === 'published' && (
                                                <Link href={`/projects/${project.slug}`} target="_blank">
                                                    <Button variant="outline" size="sm" className="h-8 text-xs">
                                                        <ExternalLink className="mr-1 h-3 w-3" /> View
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link href={`/admin/projects/${project.slug}/edit`}>
                                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                                    <Edit className="mr-1 h-3 w-3" /> Edit
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(project.slug, project.title_en || project.title_id)}>
                                                <Trash2 size={14} />
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
                                        <Button variant={page === projects.current_page ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0">
                                            {page}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
