import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Trophy, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface Achievement {
    id: number;
    title_en: string;
    title_id: string;
    description_id: string | null;
    description_en: string | null;
    type: string;
    date: string | null;
    icon: string | null;
    sort_order: number;
    show_in_cv: boolean;
}

interface Props { achievements: Achievement[]; }

export default function AchievementIndex({ achievements }: Props) {
    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        title_id: '', title_en: '', description_id: '', description_en: '',
        icon: '', date: '', type: 'professional' as string, sort_order: 0, show_in_cv: true,
    });

    const handleEdit = (a: Achievement) => {
        setEditingId(a.id);
        form.setData({
            title_id: a.title_id || '',
            title_en: a.title_en || '',
            description_id: a.description_id || '',
            description_en: a.description_en || '',
            icon: a.icon || '',
            date: a.date ? a.date.split('T')[0] : '',
            type: a.type || 'professional',
            sort_order: a.sort_order || 0,
            show_in_cv: a.show_in_cv ?? true,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(`/admin/achievements/${editingId}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Achievement updated!'); },
            });
        } else {
            form.post('/admin/achievements', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Achievement added!'); },
            });
        }
    };

    const typeColor: Record<string, string> = {
        academic: 'bg-blue-500/10 text-blue-600 border-blue-200',
        professional: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        award: 'bg-amber-500/10 text-amber-600 border-amber-200',
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Achievements', href: '/admin/achievements' }]}>
            <Head title="Manage Achievements" />
            <ConfirmDialog {...dialogProps} />
            <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Achievements</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Academic, professional, and award milestones.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add</Button></DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>{editingId ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Title (ID)</Label>
                                        <Input value={form.data.title_id} onChange={(e) => form.setData('title_id', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Title (EN)</Label>
                                            <AutoTranslateButton sourceText={form.data.title_id} onTranslate={(t) => form.setData('title_en', t)} />
                                        </div>
                                        <Input value={form.data.title_en} onChange={(e) => form.setData('title_en', e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (ID)</Label>
                                    <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_id} onChange={(e) => form.setData('description_id', e.target.value)} placeholder="Deskripsi pencapaian..." />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Description (EN)</Label>
                                        <AutoTranslateButton sourceText={form.data.description_id} onTranslate={(t) => form.setData('description_en', t)} />
                                    </div>
                                    <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_en} onChange={(e) => form.setData('description_en', e.target.value)} placeholder="Achievement description..." />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2"><Label>Type</Label>
                                        <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="academic">Academic</SelectItem>
                                                <SelectItem value="professional">Professional</SelectItem>
                                                <SelectItem value="award">Award</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} /></div>
                                </div>
                                
                                {/* Show in CV */}
                                <div className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/30">
                                    <Checkbox 
                                        id="show_in_cv" 
                                        checked={form.data.show_in_cv} 
                                        onCheckedChange={(checked) => form.setData('show_in_cv', checked === true)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="show_in_cv"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Tampilkan di CV (Show in CV)
                                        </label>
                                    </div>
                                </div>
                                <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {form.processing ? 'Saving...' : (editingId ? 'Update Achievement' : 'Save Achievement')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardContent className="p-0">
                        {achievements.length === 0 ? <p className="text-muted-foreground py-10 text-center text-sm">No achievements yet.</p> : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {achievements.map((a) => (
                                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 sm:p-5 gap-3 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                <Trophy className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{a.title_en}</h3>
                                                {a.description_en && <p className="text-muted-foreground text-xs line-clamp-2">{a.description_en}</p>}
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <Badge className={`text-[10px] ${typeColor[a.type] || ''}`}>{a.type}</Badge>
                                                    {a.show_in_cv && (
                                                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">In CV</Badge>
                                                    )}
                                                    {a.date && <span className="text-muted-foreground text-xs">{a.date}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                                confirm({ title: 'Delete Achievement?', description: `"${a.title_en}" will be removed.`, variant: 'danger', onConfirm: () => router.delete(`/admin/achievements/${a.id}`, { onSuccess: () => toast.success('Deleted') }) });
                                            }}>
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
