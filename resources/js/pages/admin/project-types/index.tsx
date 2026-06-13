import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';

interface ProjectType {
    id: number;
    name_id: string;
    name_en: string;
    slug: string;
}

interface Props {
    types: ProjectType[];
}

export default function ProjectTypeIndex({ types }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectType | null>(null);
    const { confirm, ConfirmDialog } = useConfirmDialog();

    const form = useForm({
        name_id: '',
        name_en: ''
    });

    const openCreate = () => {
        setEditing(null);
        form.setData({ name_id: '', name_en: '' });
        setDialogOpen(true);
    };

    const openEdit = (item: ProjectType) => {
        setEditing(item);
        form.setData({ name_id: item.name_id || '', name_en: item.name_en || '' });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/project-types/${editing.id}`, {
                onSuccess: () => { setDialogOpen(false); setEditing(null); form.reset(); toast.success('Updated successfully!'); },
                onError: (errors) => toast.error(Object.values(errors)[0] || 'Error'),
            });
        } else {
            form.post(`/admin/project-types`, {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Created successfully!'); },
                onError: (errors) => toast.error(Object.values(errors)[0] || 'Error'),
            });
        }
    };

    const handleDelete = (item: ProjectType) => {
        confirm({
            title: 'Delete ProjectType?',
            description: `Are you sure you want to delete "${item.name_en}"?`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: () => {
                router.delete(`/admin/project-types/${item.id}`, {
                    onSuccess: () => toast.success('Deleted successfully'),
                });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="ProjectTypes" />
            <ConfirmDialog />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">ProjectTypes</h1>
                        <p className="text-muted-foreground">Manage ProjectTypes.</p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="w-4 h-4" /> Add New
                    </Button>
                </div>
                
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {types && types.length > 0 ? types.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                            <Tags className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{item.name_id}</h3>
                                            <p className="text-sm text-muted-foreground">{item.name_en} • {item.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-muted-foreground">No data found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit' : 'Add'} ProjectType</DialogTitle>
                        <DialogDescription>Fill out the details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex h-7 items-center">
                                    <Label>Name (Indonesian)</Label>
                                </div>
                                <Input value={form.data.name_id} onChange={e => form.setData('name_id', e.target.value)} required placeholder="Contoh: Aplikasi Web" />
                                {form.errors.name_id && <p className="text-sm text-red-500">{form.errors.name_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <div className="flex h-7 items-center justify-between">
                                    <Label>Name (English)</Label>
                                    <AutoTranslateButton 
                                        sourceText={form.data.name_id} 
                                        onTranslate={(text) => form.setData('name_en', text)} 
                                    />
                                </div>
                                <Input value={form.data.name_en} onChange={e => form.setData('name_en', e.target.value)} required placeholder="Example: Web Application" />
                                {form.errors.name_en && <p className="text-sm text-red-500">{form.errors.name_en}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>{editing ? 'Update' : 'Create'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}