import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Plus, Trash2, Cpu, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface Technology {
    id: number;
    slug: string;
    name: string;
    projects_count: number;
}

interface Props { technologies: Technology[]; }

export default function TechnologyIndex({ technologies }: Props) {
    const { confirm: confirmDelete, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        name: '',
    });

    const handleEdit = (tech: Technology) => {
        setEditingId(tech.id);
        form.setData({ name: tech.name });
        setDialogOpen(true);
    };

    const handleDelete = (tech: Technology) => {
        confirmDelete({
            title: 'Delete Technology?',
            description: `Technology "${tech.name}" will be permanently deleted. This will NOT delete associated projects.`,
            variant: 'danger',
            onConfirm: () => {
                router.delete(`/admin/technologies/${tech.slug}`, {
                    onSuccess: () => toast.success('Technology deleted successfully!'),
                    onError: () => toast.error('Failed to delete technology.'),
                });
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            const tech = technologies.find(t => t.id === editingId);
            if (!tech) return;
            form.put(`/admin/technologies/${tech.slug}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Technology updated!'); },
                onError: (errors) => toast.error(Object.values(errors)[0] as string || 'An error occurred.'),
            });
        } else {
            form.post('/admin/technologies', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Technology created!'); },
                onError: (errors) => toast.error(Object.values(errors)[0] as string || 'An error occurred.'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Technologies', href: '/admin/technologies' }]}>
            <Head title="Manage Technologies" />
            <ConfirmDialog {...dialogProps} />
            <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Technologies</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Manage tech stack options used for projects. These appear as filter options and suggestions.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" />Add Technology
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Technology' : 'Add Technology'}</DialogTitle>
                                <DialogDescription>Technology names are universal (not translated).</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Technology Name *</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="e.g. React, Laravel, TypeScript"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700">
                                        {form.processing ? 'Saving...' : (editingId ? 'Update' : 'Save')}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader className="pb-2"><CardTitle>All Technologies</CardTitle></CardHeader>
                    <CardContent>
                        {technologies.length === 0 ? (
                            <p className="py-8 text-center text-sm text-neutral-500">No technologies found. Add one to get started.</p>
                        ) : (
                            <div className="divide-y">
                                {technologies.map((tech) => (
                                    <div key={tech.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 sm:py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shrink-0">
                                                <Cpu className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{tech.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Used in {tech.projects_count} project{tech.projects_count !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleEdit(tech)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                                onClick={() => handleDelete(tech)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
