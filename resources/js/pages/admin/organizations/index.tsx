import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, Users, Calendar, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';

interface Organization {
    id: number;
    name: string;
    role: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description_id: string | null;
    description_en: string | null;
    sort_order: number;
}

interface Props {
    organizations: Organization[];
}

export default function OrganizationsIndex({ organizations }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        name: '',
        role: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description_id: '',
        description_en: '',
        sort_order: 0,
    });

    const handleEdit = (org: Organization) => {
        setEditingId(org.id);
        form.setData({
            name: org.name,
            role: org.role,
            start_date: org.start_date ? org.start_date.split('T')[0] : '',
            end_date: org.end_date ? org.end_date.split('T')[0] : '',
            is_current: !!org.is_current,
            description_id: org.description_id || '',
            description_en: org.description_en || '',
            sort_order: org.sort_order || 0,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(`/admin/organizations/${editingId}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Organization updated!'); },
            });
        } else {
            form.post('/admin/organizations', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Organization added!'); },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Organizations', href: '/admin/organizations' }]}>
            <Head title="Manage Organizations" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Organizations & Communities</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your involvement in organizations, clubs, and communities.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />New Organization</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Organization' : 'Add Organization'}</DialogTitle>
                                <DialogDescription>Fill in the details of your organizational experience.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Organization Name</Label>
                                        <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required placeholder="e.g. Google Developer Student Clubs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role / Position</Label>
                                        <Input value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} required placeholder="e.g. Core Team Member" />
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
                                    <Label htmlFor="is_current" className="text-sm font-medium">I am currently active here</Label>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Description (ID)</Label>
                                        <textarea className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_id} onChange={(e) => form.setData('description_id', e.target.value)} placeholder="Ceritakan peran dan kontribusi Anda..." />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Description (EN)</Label>
                                            <AutoTranslateButton sourceText={form.data.description_id} onTranslate={(t) => form.setData('description_en', t)} />
                                        </div>
                                        <textarea className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_en} onChange={(e) => form.setData('description_en', e.target.value)} placeholder="Auto-translate or type English version..." />
                                    </div>
                                </div>

                                <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {form.processing ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Entry')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            <CardTitle className="text-lg">Organizational Experience</CardTitle>
                        </div>
                        <CardDescription>Your history of community involvement and leadership.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {organizations.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-muted-foreground text-sm italic">No organizations added yet. Start adding your experiences.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {organizations.map((org) => (
                                    <div key={org.id} className="group flex items-start justify-between p-6 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="flex gap-4">
                                            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                <Users size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">{org.role}</h3>
                                                    {org.is_current && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">Current</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                                    <Building2 size={14} className="shrink-0" />
                                                    <span>{org.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4 pt-1">
                                                    <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                                        <Calendar size={12} />
                                                        {new Date(org.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {org.end_date ? new Date(org.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 pr-4">
                                            <Button size="sm" variant="outline" className="h-8" onClick={() => handleEdit(org)}>Edit</Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                                if (confirm('Delete this record?')) router.delete(`/admin/organizations/${org.id}`);
                                            }}>
                                                <Trash2 size={16} />
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
