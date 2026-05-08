import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Plus, Trash2, Users, Calendar, Building2, X } from 'lucide-react';
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
    name_en: string | null;
    role: string;
    role_en: string | null;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description_id: string | null;
    description_en: string | null;
    logo: string | null;
    sort_order: number;
}

interface Props {
    organizations: Organization[];
}

export default function OrganizationsIndex({ organizations }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        name: '',
        name_en: '',
        role: '',
        role_en: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description_id: '',
        description_en: '',
        logo: null as File | null,
        sort_order: 0,
    });

    const handleEdit = (org: Organization) => {
        setEditingId(org.id);
        form.setData({
            name: org.name,
            name_en: org.name_en || '',
            role: org.role,
            role_en: org.role_en || '',
            start_date: org.start_date ? org.start_date.split('T')[0] : '',
            end_date: org.end_date ? org.end_date.split('T')[0] : '',
            is_current: !!org.is_current,
            description_id: org.description_id || '',
            description_en: org.description_en || '',
            logo: null,
            sort_order: org.sort_order || 0,
        });
        setLogoPreview(org.logo ? `/storage/${org.logo}` : null);
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(form.data).forEach(([key, value]) => {
            if (key === 'logo') {
                if (value instanceof File) formData.append('logo', value);
            } else if (key === 'is_current') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, String(value ?? ''));
            }
        });

        if (editingId) {
            formData.append('_method', 'PUT');
            router.post(`/admin/organizations/${editingId}`, formData, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); setLogoPreview(null); toast.success('Organization updated!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] || 'An error occurred while saving.'); },
            });
        } else {
            router.post('/admin/organizations', formData, {
                onSuccess: () => { setDialogOpen(false); form.reset(); setLogoPreview(null); toast.success('Organization added!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] || 'An error occurred while saving.'); },
            });
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            form.setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const openNew = () => {
        setEditingId(null);
        form.reset();
        setLogoPreview(null);
        setDialogOpen(true);
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
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); setLogoPreview(null); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Organization</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Organization' : 'Add Organization'}</DialogTitle>
                                <DialogDescription>Fill in the details of your organizational experience.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                {/* Logo Upload */}
                                <div className="space-y-2">
                                    <Label>Organization Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${logoPreview ? 'border-indigo-300' : 'border-neutral-300 dark:border-neutral-700'}`}>
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                                            ) : (
                                                <Users className="h-6 w-6 text-neutral-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="h-9 cursor-pointer" />
                                            <p className="text-[11px] text-neutral-400">Organization logo. Max 2MB. If empty, initials will be shown.</p>
                                        </div>
                                        {logoPreview && (
                                            <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => { setLogoPreview(null); form.setData('logo', null); if (logoInputRef.current) logoInputRef.current.value = ''; }}>
                                                <X size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Organization Name Bilingual */}
                                <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <Label className="text-sm font-semibold">Organization Name</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bahasa Indonesia</span>
                                            <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required placeholder="e.g. Himpunan Mahasiswa Informatika" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">English</span>
                                                <AutoTranslateButton sourceText={form.data.name} onTranslate={(t) => form.setData('name_en', t)} />
                                            </div>
                                            <Input value={form.data.name_en} onChange={(e) => form.setData('name_en', e.target.value)} placeholder="e.g. Informatics Student Association" />
                                        </div>
                                    </div>
                                </div>

                                {/* Role Bilingual */}
                                <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <Label className="text-sm font-semibold">Role / Position</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bahasa Indonesia</span>
                                            <Input value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} required placeholder="e.g. Ketua Divisi Teknologi" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">English</span>
                                                <AutoTranslateButton sourceText={form.data.role} onTranslate={(t) => form.setData('role_en', t)} />
                                            </div>
                                            <Input value={form.data.role_en} onChange={(e) => form.setData('role_en', e.target.value)} placeholder="e.g. Head of Technology Division" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
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

                                {/* Description Bilingual */}
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
                                            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                {org.logo ? (
                                                    <img src={`/storage/${org.logo}`} alt="" className="h-full w-full object-contain p-1" />
                                                ) : (
                                                    <span className="text-lg font-black">{org.name?.charAt(0) || 'O'}</span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">{org.role}</h3>
                                                    {org.role_en && <span className="text-xs text-neutral-400">/ {org.role_en}</span>}
                                                    {org.is_current && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">Current</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                                    <Building2 size={14} className="shrink-0" />
                                                    <span>{org.name}</span>
                                                    {org.name_en && <span className="text-xs text-neutral-400">/ {org.name_en}</span>}
                                                </div>
                                                <div className="flex items-center gap-4 pt-1">
                                                    <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                                        <Calendar size={12} />
                                                        {org.start_date ? new Date(org.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'} — {org.end_date ? new Date(org.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
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
