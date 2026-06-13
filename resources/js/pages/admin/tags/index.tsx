import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Plus, Trash2, Tag as TagIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';


interface Tag {
    id: number;
    slug: string;
    name_id: string;
    name_en: string;
    blogs_count: number;
}

interface Props { tags: Tag[]; }

export default function TagIndex({ tags }: Props) {
    const { confirm: confirmDelete, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSlug, setEditingSlug] = useState<string | null>(null);

    const form = useForm({
        name_id: '',
        name_en: '',
    });

    const handleEdit = (tag: Tag) => {
        setEditingSlug(tag.slug);
        form.setData({
            name_id: tag.name_id,
            name_en: tag.name_en,
        });
        setDialogOpen(true);
    };

    const handleDelete = (slug: string, name: string) => {
        confirmDelete({
            title: 'Delete Tag?',
            description: `Tag "${name}" will be permanently deleted. This action cannot be undone.`,
            variant: 'danger',
            onConfirm: () => {
                router.delete(`/admin/tags/${slug}`, {
                    onSuccess: () => toast.success('Tag deleted successfully!'),
                    onError: (errors) => toast.error(Object.values(errors)[0] as string || 'Failed to delete.')
                });
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSlug) {
            form.put(`/admin/tags/${editingSlug}`, {
                onSuccess: () => { setDialogOpen(false); setEditingSlug(null); form.reset(); toast.success('Tag updated!'); },
            });
        } else {
            form.post('/admin/tags', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Tag added!'); },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Tags', href: '/admin/tags' }]}>
            <Head title="Manage Tags" />
            <ConfirmDialog {...dialogProps} />
            <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Tags</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Manage global tags used for blogs.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingSlug(null); form.reset(); } }}>
                        <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add Tag</Button></DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>{editingSlug ? 'Edit Tag' : 'Add Tag'}</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tag Name (ID)</Label>
                                    <Input value={form.data.name_id} onChange={(e) => form.setData('name_id', e.target.value)} required placeholder="Contoh: Teknologi" />
                                </div>
                                <div className="space-y-2">
                                    <div className="mb-1 h-6 flex items-end justify-between">
                                        <Label>Tag Name (EN)</Label>
                                        <AutoTranslateButton sourceText={form.data.name_id} onTranslate={(t) => form.setData('name_en', t)} />
                                    </div>
                                    <Input value={form.data.name_en} onChange={(e) => form.setData('name_en', e.target.value)} required placeholder="Example: Technology" />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={form.processing}>{editingSlug ? 'Update' : 'Save'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader className="pb-2"><CardTitle>All Tags</CardTitle></CardHeader>
                    <CardContent>
                        {tags.length === 0 ? (
                            <p className="py-8 text-center text-sm text-neutral-500">No tags found. Add one to get started.</p>
                        ) : (
                            <div className="divide-y">
                                {tags.map((tag) => (
                                    <div key={tag.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 sm:py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                <TagIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{tag.name_id} / <span className="text-muted-foreground font-normal">{tag.name_en}</span></p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Used in {tag.blogs_count} posts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleEdit(tag)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950" onClick={() => handleDelete(tag.slug, tag.name_en)}>
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
