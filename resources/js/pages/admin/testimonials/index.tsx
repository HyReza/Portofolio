import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, Pencil, Search, X, MessageSquare, ChevronUp, ChevronDown, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';

interface Testimonial {
    id: number;
    client_name: string;
    company: string | null;
    company_en: string | null;
    position: string | null;
    position_en: string | null;
    relation: string | null;
    relation_en: string | null;
    content_id: string;
    content_en: string | null;
    image: string | null;
    project_url: string | null;
    sort_order: number;
}

export default function TestimonialIndex({ testimonials }: { testimonials: Testimonial[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const form = useForm({
        client_name: '', company: '', company_en: '', position: '', position_en: '', relation: '', relation_en: '',
        content_id: '', content_en: '',
        image: null as File | null, project_url: '',
    });

    const handleEdit = (testi: Testimonial) => {
        setEditingId(testi.id);
        form.setData({
            client_name: testi.client_name || '',
            company: testi.company || '',
            company_en: testi.company_en || '',
            position: testi.position || '',
            position_en: testi.position_en || '',
            relation: testi.relation || '',
            relation_en: testi.relation_en || '',
            content_id: testi.content_id || '',
            content_en: testi.content_en || '',
            image: null,
            project_url: testi.project_url || '',
        });
        setImagePreview(testi.image ? `/storage/${testi.image}` : null);
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(form.data).forEach(([key, value]) => {
            if (key === 'image') {
                if (value instanceof File) formData.append('image', value);
            } else {
                formData.append(key, String(value ?? ''));
            }
        });

        if (editingId) {
            formData.append('_method', 'PUT');
            router.post(`/admin/testimonials/${editingId}`, formData, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); setImagePreview(null); toast.success('Testimonial updated!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] || 'An error occurred while saving.'); },
            });
        } else {
            router.post('/admin/testimonials', formData, {
                onSuccess: () => { setDialogOpen(false); form.reset(); setImagePreview(null); toast.success('Testimonial added!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] || 'An error occurred while saving.'); },
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            form.setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const openNew = () => {
        setEditingId(null);
        form.reset();
        setImagePreview(null);
        setDialogOpen(true);
    };

    const filteredTestimonials = testimonials.filter(t => {
        const query = searchQuery.toLowerCase();
        return t.client_name.toLowerCase().includes(query) ||
               (t.company && t.company.toLowerCase().includes(query)) ||
               (t.position && t.position.toLowerCase().includes(query));
    });

    const moveTestimonial = (testiId: number, direction: 'up' | 'down') => {
        const idx = testimonials.findIndex(t => t.id === testiId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= testimonials.length) return;

        router.post('/admin/testimonials/reorder', {
            from_id: testimonials[idx].id,
            to_id: testimonials[swapIdx].id,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Order updated!'),
            onError: () => toast.error('Failed to reorder.'),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Testimonials', href: '/admin/testimonials' }]}>
            <Head title="Manage Testimonials" />
            <div className="mx-auto max-w-6xl space-y-6 pb-10 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage client feedback and recommendations.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search testimonials..."
                                className="pl-8 bg-white dark:bg-neutral-900"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                            <Plus className="mr-2 h-4 w-4" />New Testimonial
                        </Button>
                    </div>
                </div>

                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); setImagePreview(null); } }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                        <div className="p-6 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
                                <DialogDescription>Fill in the details below. Fields marked * are required.</DialogDescription>
                            </DialogHeader>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
                            {/* Client Photo */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Client Photo / Logo</Label>
                                {imagePreview ? (
                                    <div className="relative group w-32 h-32 mx-auto">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-full border border-neutral-200 dark:border-neutral-700 shadow-md cursor-pointer"
                                            onClick={() => setFullscreenImage(imagePreview)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
                                            <button
                                                type="button"
                                                onClick={() => { setImagePreview(null); form.setData('image', null); }}
                                                className="flex items-center justify-center h-8 w-8 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-32 h-32 mx-auto rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all">
                                        <Plus className="h-8 w-8 text-neutral-400 mb-1" />
                                        <span className="text-[10px] font-medium text-neutral-500">Upload Photo</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* Client Details */}
                            <fieldset className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                <legend className="px-2 text-sm font-semibold">Client Details (Indonesian)</legend>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Client Name *</Label>
                                    <Input value={form.data.client_name} onChange={(e) => form.setData('client_name', e.target.value)} required placeholder="e.g. John Doe" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Position / Title (ID)</Label>
                                        <Input value={form.data.position} onChange={(e) => form.setData('position', e.target.value)} placeholder="e.g. CEO, Manajer" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Company (ID)</Label>
                                        <Input value={form.data.company} onChange={(e) => form.setData('company', e.target.value)} placeholder="e.g. PT Maju Jaya" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Relation (ID)</Label>
                                        <Input value={form.data.relation} onChange={(e) => form.setData('relation', e.target.value)} placeholder="e.g. Klien, Kolega" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Project URL (Optional)</Label>
                                        <Input type="url" value={form.data.project_url} onChange={(e) => form.setData('project_url', e.target.value)} placeholder="https://..." />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                <legend className="px-2 text-sm font-semibold">Client Details (English)</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Position / Title (EN)</Label>
                                        <Input value={form.data.position_en} onChange={(e) => form.setData('position_en', e.target.value)} placeholder="e.g. CEO, Manager" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Company (EN)</Label>
                                        <Input value={form.data.company_en} onChange={(e) => form.setData('company_en', e.target.value)} placeholder="e.g. Maju Jaya Ltd" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 mt-3">
                                    <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Relation (EN)</Label>
                                    <Input value={form.data.relation_en} onChange={(e) => form.setData('relation_en', e.target.value)} placeholder="e.g. Client, Colleague" />
                                </div>
                            </fieldset>

                            {/* Testimonial Content (Bilingual) */}
                            <fieldset className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                <legend className="px-2 text-sm font-semibold">Feedback Content *</legend>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Bahasa Indonesia</Label>
                                    <textarea
                                        className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                                        value={form.data.content_id}
                                        onChange={(e) => form.setData('content_id', e.target.value)}
                                        required
                                        placeholder="Tulis testimoni di sini..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">English</Label>
                                        <AutoTranslateButton sourceText={form.data.content_id} onTranslate={(t) => form.setData('content_en', t)} />
                                    </div>
                                    <textarea
                                        className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                                        value={form.data.content_en}
                                        onChange={(e) => form.setData('content_en', e.target.value)}
                                        placeholder="Write testimonial here..."
                                    />
                                </div>
                            </fieldset>

                            <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-sm font-semibold">
                                {form.processing ? 'Saving...' : (editingId ? 'Update Testimonial' : 'Save Testimonial')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTestimonials.length === 0 ? (
                        <Card className="col-span-full border-none shadow-none bg-transparent">
                            <CardContent className="py-20 text-center">
                                <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700 mb-4" />
                                <p className="text-muted-foreground">No testimonials found.</p>
                            </CardContent>
                        </Card>
                    ) : filteredTestimonials.map((testi, index) => (
                        <Card key={testi.id} className="group relative overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 transition-all hover:shadow-xl hover:ring-indigo-500/20 dark:ring-neutral-800 dark:hover:ring-indigo-500/30 dark:bg-[#121212] p-6 flex flex-col">
                            {/* Sort order badge */}
                            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Move up/down buttons */}
                            <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm disabled:opacity-30" disabled={index === 0} onClick={() => moveTestimonial(testi.id, 'up')}>
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm disabled:opacity-30" disabled={index === filteredTestimonials.length - 1} onClick={() => moveTestimonial(testi.id, 'down')}>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-4 mb-4 mt-2">
                                <div className="h-14 w-14 rounded-full overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                                    {testi.image ? (
                                        <img src={`/storage/${testi.image}`} alt={testi.client_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-lg">
                                            {testi.client_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-neutral-900 dark:text-white truncate">{testi.client_name}</h3>
                                    <p className="text-xs text-neutral-500 truncate">
                                        {[(testi.position_en || testi.position), (testi.company_en || testi.company)].filter(Boolean).join(' at ')}
                                    </p>
                                    {(testi.relation_en || testi.relation) && (
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                            {testi.relation_en || testi.relation}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-4 leading-relaxed">
                                    "{testi.content_id}"
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="secondary" className="text-indigo-600 hover:text-indigo-700" onClick={() => handleEdit(testi)}>
                                    <Pencil className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete this testimonial?')) router.delete(`/admin/testimonials/${testi.id}`); }}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {fullscreenImage && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer" onClick={() => setFullscreenImage(null)}>
                    <button className="absolute top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                    <img src={fullscreenImage} alt="Fullscreen view" className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </AppLayout>
    );
}
