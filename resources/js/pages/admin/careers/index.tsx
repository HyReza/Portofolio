import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, GitBranch as GitBranchIcon, Building2, Calendar, Briefcase, Wand2, Terminal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { toast } from 'sonner';

interface Career {
    id: number;
    company: string;
    position_id: string | null;
    position_en: string | null;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description_id: string | null;
    description_en: string | null;
    branch_label: string | null;
    branch_color: string | null;
    children: Career[];
}

interface Props {
    careers: Career[];
}

export default function CareersIndex({ careers }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        company: '',
        position_id: '',
        position_en: '',
        start_date: '',
        end_date: '',
        description_id: '',
        description_en: '',
        is_current: false,
        parent_id: '',
        branch_label: '',
        branch_color: '#6366f1',
        sort_order: 0,
    });

    const handleEdit = (career: Career) => {
        setEditingId(career.id);
        form.setData({
            company: career.company,
            position_id: career.position_id || '',
            position_en: career.position_en || '',
            start_date: career.start_date ? career.start_date.split('T')[0] : '',
            end_date: career.end_date ? career.end_date.split('T')[0] : '',
            description_id: career.description_id || '',
            description_en: career.description_en || '',
            is_current: !!career.is_current,
            parent_id: '', // handle if needed
            branch_label: career.branch_label || '',
            branch_color: career.branch_color || '#6366f1',
            sort_order: 0,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(`/admin/careers/${editingId}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Career updated!'); },
            });
        } else {
            form.post('/admin/careers', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Career added!'); },
            });
        }
    };

    const renderCareer = (career: Career, depth = 0) => (
        <div key={career.id} className="relative">
            <div className={`group flex items-start justify-between py-4 transition-all hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 ${depth > 0 ? 'ml-8' : ''}`}>
                <div className="flex gap-4">
                    {depth > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="h-full w-px bg-neutral-200 dark:bg-neutral-800" />
                            <GitBranchIcon className="h-4 w-4 shrink-0" style={{ color: career.branch_color || '#6366f1' }} />
                        </div>
                    )}
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                        <Briefcase size={20} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">{career.position_en || career.position_id}</h3>
                            {career.is_current && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">Current</Badge>}
                            {career.branch_label && (
                                <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider" style={{ borderColor: career.branch_color || undefined, color: career.branch_color || undefined }}>
                                    {career.branch_label}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            <Building2 size={14} className="shrink-0" />
                            <span>{career.company}</span>
                        </div>
                        <div className="flex items-center gap-4 pt-1">
                            <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                <Calendar size={12} />
                                {new Date(career.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {career.end_date ? new Date(career.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 pr-4">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => handleEdit(career)}>Edit</Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm('Delete this career record?')) router.delete(`/admin/careers/${career.id}`);
                    }}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
            {career.children?.length > 0 && (
                <div className="space-y-0">
                    {career.children.map((child) => renderCareer(child, depth + 1))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <Head title="Manage Careers" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Career Architecture</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Visualize your professional growth with git-style branching.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />New Experience</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Career Entry' : 'Add Career Entry'}</DialogTitle>
                                <DialogDescription>Build your professional timeline.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Company Name</Label>
                                        <Input value={form.data.company} onChange={(e) => form.setData('company', e.target.value)} required placeholder="e.g. Google, StartUp Inc" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Position (ID)</Label>
                                        <Input value={form.data.position_id} onChange={(e) => form.setData('position_id', e.target.value)} required placeholder="e.g. Senior Pengembang" />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Position (EN)</Label>
                                            <AutoTranslateButton sourceText={form.data.position_id} onTranslate={(t) => form.setData('position_en', t)} />
                                        </div>
                                        <Input value={form.data.position_en} onChange={(e) => form.setData('position_en', e.target.value)} required placeholder="e.g. Senior Developer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Branch Label</Label>
                                        <div className="flex gap-2">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-neutral-50 dark:bg-neutral-900">
                                                <Terminal size={16} className="text-neutral-400" />
                                            </div>
                                            <Input value={form.data.branch_label} onChange={(e) => form.setData('branch_label', e.target.value)} placeholder="main, feature/ai, etc." />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date (Optional)</Label>
                                        <Input type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} disabled={form.data.is_current} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="is_current" checked={form.data.is_current} onChange={(e) => form.setData('is_current', e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="is_current" className="text-sm font-medium">I currently work here</Label>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Description (ID)</Label>
                                        <textarea className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_id} onChange={(e) => form.setData('description_id', e.target.value)} placeholder="Ceritakan detail peran dan pencapaian Anda..." />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Description (EN)</Label>
                                            <AutoTranslateButton sourceText={form.data.description_id} onTranslate={(t) => form.setData('description_en', t)} />
                                        </div>
                                        <textarea className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_en} onChange={(e) => form.setData('description_en', e.target.value)} placeholder="Auto-translate or type English version..." />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Label>Branch Color</Label>
                                    <div className="flex items-center gap-3">
                                        <Input type="color" value={form.data.branch_color} onChange={(e) => form.setData('branch_color', e.target.value)} className="h-10 w-20 p-1" />
                                        <span className="text-xs text-neutral-500 font-mono uppercase">{form.data.branch_color}</span>
                                    </div>
                                </div>

                                <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {form.processing ? 'Saving...' : (editingId ? 'Update Entry' : 'Build Branch')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center gap-2">
                            <GitBranchIcon className="h-5 w-5 text-indigo-500" />
                            <CardTitle className="text-lg">Experience Timeline</CardTitle>
                        </div>
                        <CardDescription>Your career journey visualized as a git branch tree.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {careers.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-muted-foreground text-sm italic">No career entries found. Start building your branch.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {careers.map((c) => renderCareer(c))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
