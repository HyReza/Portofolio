import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Pencil, Award, Search, X, ZoomIn, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { TagInputWithSuggestions } from '@/components/ui/tag-input-with-suggestions';

interface CertCategory {
    id: number;
    name_id: string;
    name_en: string | null;
    slug: string;
}

interface CredentialType {
    id: number;
    name_id: string;
    name_en: string | null;
    slug: string;
}

interface Certificate {
    id: number; title: string; title_en: string | null; issuer: string;
    credential_id: string | null; credential_url: string | null; image: string | null;
    credential_type: string | null; credential_type_en: string | null;
    issued_date: string | null; expiry_date: string | null;
    description_id: string | null; description_en: string | null;
    skills: string[] | null; category: string | null; category_en: string | null;
    sort_order: number | null; show_in_cv: boolean;
    categories?: CertCategory[];
    credentialTypes?: CredentialType[];
}

export default function CertificateIndex({ certificates, allCategories, allCredentialTypes }: { certificates: Certificate[]; allCategories: CertCategory[]; allCredentialTypes: CredentialType[] }) {
    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
    const [selectedCredentialTypeNames, setSelectedCredentialTypeNames] = useState<string[]>([]);

    const form = useForm({
        title: '', title_en: '', issuer: '', credential_id: '', credential_url: '',
        credential_type: '', credential_type_en: '', credential_type_ids: '',
        image: null as File | null, issued_date: '', expiry_date: '',
        description_id: '', description_en: '',
        skills: '', category: '', category_en: '', category_ids: '', sort_order: 0 as number | null, show_in_cv: true,
    });

    const handleEdit = (cert: Certificate) => {
        setEditingId(cert.id);
        const catNames = (cert.categories || []).map(c => c.name_id);
        const catIds = (cert.categories || []).map(c => c.id);
        setSelectedCategoryNames(catNames);

        const credTypeNames = (cert.credentialTypes || []).map(c => c.name_id);
        const credTypeIds = (cert.credentialTypes || []).map(c => c.id);
        setSelectedCredentialTypeNames(credTypeNames);

        form.setData({
            title: cert.title || '',
            title_en: cert.title_en || '',
            issuer: cert.issuer || '',
            credential_type: cert.credential_type || '',
            credential_type_en: cert.credential_type_en || '',
            credential_id: cert.credential_id || '',
            credential_url: cert.credential_url || '',
            image: null,
            issued_date: cert.issued_date ? cert.issued_date.split('T')[0] : '',
            expiry_date: cert.expiry_date ? cert.expiry_date.split('T')[0] : '',
            description_id: cert.description_id || '',
            description_en: cert.description_en || '',
            skills: cert.skills ? cert.skills.join(', ') : '',
            category: cert.category || '',
            category_en: cert.category_en || '',
            category_ids: catIds.join(','),
            credential_type_ids: credTypeIds.join(','),
            sort_order: cert.sort_order,
            show_in_cv: cert.show_in_cv ?? true,
        });
        setImagePreview(cert.image ? `/storage/${cert.image}` : null);
        setDialogOpen(true);
    };

    const getCategoryIdsFromNames = (names: string[]): string => {
        const ids: number[] = [];
        names.forEach(name => {
            const cat = allCategories.find(c => c.name_id.toLowerCase() === name.toLowerCase() || (c.name_en && c.name_en.toLowerCase() === name.toLowerCase()));
            if (cat) ids.push(cat.id);
        });
        return ids.join(',');
    };

    const handleCategoryChange = (names: string[]) => {
        setSelectedCategoryNames(names);
        form.setData('category_ids', getCategoryIdsFromNames(names));
    };

    const getCredentialTypeIdsFromNames = (names: string[]): string => {
        const ids: number[] = [];
        names.forEach(name => {
            const type = allCredentialTypes.find(c => c.name_id.toLowerCase() === name.toLowerCase() || (c.name_en && c.name_en.toLowerCase() === name.toLowerCase()));
            if (type) ids.push(type.id);
        });
        return ids.join(',');
    };

    const handleCredentialTypeChange = (names: string[]) => {
        setSelectedCredentialTypeNames(names);
        form.setData('credential_type_ids', getCredentialTypeIdsFromNames(names));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(form.data).forEach(([key, value]) => {
            if (key === 'image') {
                if (value instanceof File) formData.append('image', value);
            } else if (key === 'show_in_cv') {
                formData.append(key, value ? '1' : '0');
            } else if (key === 'sort_order') {
                // Don't send sort_order for new items
            } else {
                formData.append(key, String(value ?? ''));
            }
        });

        if (editingId) {
            formData.append('_method', 'PUT');
            router.post(`/admin/certificates/${editingId}`, formData, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); setImagePreview(null); setSelectedCategoryNames([]); setSelectedCredentialTypeNames([]); toast.success('Certificate updated!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] as string || 'An error occurred while saving.'); },
            });
        } else {
            router.post('/admin/certificates', formData, {
                onSuccess: () => { setDialogOpen(false); form.reset(); setImagePreview(null); setSelectedCategoryNames([]); setSelectedCredentialTypeNames([]); toast.success('Certificate added!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] as string || 'An error occurred while saving.'); },
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
        setSelectedCategoryNames([]);
        setSelectedCredentialTypeNames([]);
        setDialogOpen(true);
    };

    // Filter Logic
    const filteredCertificates = certificates.filter(cert => {
        const query = searchQuery.toLowerCase();
        return cert.title.toLowerCase().includes(query) ||
               cert.issuer.toLowerCase().includes(query) ||
               (cert.category && cert.category.toLowerCase().includes(query));
    });

    // Move certificate up or down
    const moveCert = (certId: number, direction: 'up' | 'down') => {
        const idx = certificates.findIndex(c => c.id === certId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= certificates.length) return;

        router.post('/admin/certificates/reorder', {
            from_id: certificates[idx].id,
            to_id: certificates[swapIdx].id,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Order updated!'),
            onError: () => toast.error('Failed to reorder.'),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Certificates', href: '/admin/certificates' }]}>
            <Head title="Manage Certificates" />
            <ConfirmDialog {...dialogProps} />
            <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Certificates</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Manage your professional certifications and credentials.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search certificates..."
                                className="pl-8 bg-white dark:bg-neutral-900"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                            <Plus className="mr-2 h-4 w-4" />New Certificate
                        </Button>
                    </div>
                </div>

                {/* ─── Certificate Form Dialog ─── */}
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); setImagePreview(null); setSelectedCategoryNames([]); setSelectedCredentialTypeNames([]); } }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                        <div className="p-6 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{editingId ? 'Edit Certificate' : 'Add Certificate'}</DialogTitle>
                                <DialogDescription>Fill in the details below. Fields marked * are required.</DialogDescription>
                            </DialogHeader>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">

                            {/* ── Section 1: Image Upload ── */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Certificate Image</Label>
                                {imagePreview ? (
                                    <div className="relative group">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full max-h-48 object-contain rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 cursor-pointer"
                                            onClick={() => setFullscreenImage(imagePreview)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setFullscreenImage(imagePreview)}
                                                className="flex items-center gap-1.5 bg-black/70 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-black/80 transition-colors"
                                            >
                                                <ZoomIn className="h-3.5 w-3.5" /> View Full
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setImagePreview(null); form.setData('image', null); }}
                                                className="flex items-center gap-1.5 bg-red-600/80 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all">
                                        <Award className="h-8 w-8 text-neutral-400 mb-2" />
                                        <span className="text-sm font-medium text-neutral-500">Click to upload image</span>
                                        <span className="text-[11px] text-neutral-400 mt-0.5">Max 5MB • JPG, PNG, WebP</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                )}
                                {imagePreview && (
                                    <label className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                                        Change image
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* ── Section 2: Title (Bilingual) ── */}
                            <fieldset className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                <legend className="px-2 text-sm font-semibold">Certificate Title *</legend>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Bahasa Indonesia</Label>
                                    <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required placeholder="e.g. Sertifikat Pengembang React" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">English</Label>
                                        <AutoTranslateButton sourceText={form.data.title} onTranslate={(t) => form.setData('title_en', t)} />
                                    </div>
                                    <Input value={form.data.title_en} onChange={(e) => form.setData('title_en', e.target.value)} placeholder="e.g. React Developer Certificate" />
                                </div>
                            </fieldset>

                            {/* ── Section 3: Issuer ── */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Issuer / Organization *</Label>
                                <Input value={form.data.issuer} onChange={(e) => form.setData('issuer', e.target.value)} required placeholder="e.g. Coursera, Dicoding, Bangkit Academy" />
                            </div>

                            {/* ── Section 4: Category (Tag-based from stored categories) ── */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Categories</Label>
                                <TagInputWithSuggestions
                                    value={selectedCategoryNames}
                                    onChange={handleCategoryChange}
                                    suggestions={allCategories.map(c => ({
                                        id: c.id,
                                        label: c.name_id,
                                        labelSecondary: c.name_en || undefined,
                                    }))}
                                    placeholder="Type to search or add category..."
                                />
                                <p className="text-[11px] text-neutral-400">Select existing categories or type to search. Manage categories in the Certificate Categories menu.</p>
                            </div>

                            {/* ── Section 5: Credential Type (Tag-based) ── */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Credential Types</Label>
                                <TagInputWithSuggestions
                                    value={selectedCredentialTypeNames}
                                    onChange={handleCredentialTypeChange}
                                    suggestions={allCredentialTypes.map(c => ({
                                        id: c.id,
                                        label: c.name_id,
                                        labelSecondary: c.name_en || undefined,
                                    }))}
                                    placeholder="Type to search or add credential type..."
                                />
                                <p className="text-[11px] text-neutral-400">Select existing types or type to search. Manage types in the Credential Types menu.</p>
                            </div>

                            {/* ── Section 6: Dates ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Issued Date</Label>
                                    <Input type="date" value={form.data.issued_date} onChange={(e) => form.setData('issued_date', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Expiry Date</Label>
                                    <Input type="date" value={form.data.expiry_date} onChange={(e) => form.setData('expiry_date', e.target.value)} />
                                </div>
                            </div>

                            {/* ── Section 7: Credential Info ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Credential ID</Label>
                                    <Input value={form.data.credential_id} onChange={(e) => form.setData('credential_id', e.target.value)} placeholder="e.g. X123456" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Credential URL</Label>
                                    <Input type="url" value={form.data.credential_url} onChange={(e) => form.setData('credential_url', e.target.value)} placeholder="https://..." />
                                </div>
                            </div>

                            {/* ── Section 8: Skills ── */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Skills Gained</Label>
                                <Input value={form.data.skills} onChange={(e) => form.setData('skills', e.target.value)} placeholder="e.g. React, Tailwind CSS, TypeScript (comma separated)" />
                                <p className="text-[11px] text-neutral-400">Separate each skill with a comma.</p>
                            </div>

                            {/* ── Section 9: Description (Bilingual) ── */}
                            <fieldset className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                <legend className="px-2 text-sm font-semibold">Description</legend>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-neutral-400">Bahasa Indonesia</Label>
                                    <textarea
                                        className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                                        value={form.data.description_id}
                                        onChange={(e) => form.setData('description_id', e.target.value)}
                                        placeholder="Jelaskan apa yang dipelajari..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] uppercase tracking-wider text-neutral-400">English</Label>
                                        <AutoTranslateButton sourceText={form.data.description_id} onTranslate={(t) => form.setData('description_en', t)} />
                                    </div>
                                    <textarea
                                        className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                                        value={form.data.description_en}
                                        onChange={(e) => form.setData('description_en', e.target.value)}
                                        placeholder="Explain what was learned..."
                                    />
                                </div>
                            </fieldset>

                            {/* ── Section 10: Show in CV ── */}
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
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        Jika dicentang, sertifikat ini akan disertakan saat mengunduh CV PDF.
                                    </p>
                                </div>
                            </div>

                            {/* ── Submit ── */}
                            <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-sm font-semibold">
                                {form.processing ? 'Saving...' : (editingId ? 'Update Certificate' : 'Save Certificate')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ─── Certificate Grid ─── */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCertificates.length === 0 ? (
                        <Card className="col-span-full border-none shadow-none bg-transparent">
                            <CardContent className="py-20 text-center">
                                <Award className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700 mb-4" />
                                <p className="text-muted-foreground">No certificates found matching your search.</p>
                            </CardContent>
                        </Card>
                    ) : filteredCertificates.map((cert, index) => (
                        <Card key={cert.id} className="group overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 transition-all hover:shadow-xl hover:ring-indigo-500/20 dark:ring-neutral-800 dark:hover:ring-indigo-500/30 dark:bg-[#121212]">
                            <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                                {cert.image ? (
                                    <img src={`/storage/${cert.image}`} alt={cert.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Award className="h-16 w-16 text-neutral-300 dark:text-neutral-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                {/* Sort order badge */}
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Quick actions — always visible */}
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    {cert.image && (
                                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white text-neutral-700 shadow-lg" onClick={() => setFullscreenImage(`/storage/${cert.image}`)}>
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white text-indigo-600 shadow-lg" onClick={() => handleEdit(cert)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8 shadow-lg" onClick={() => {
                                        confirm({ title: 'Delete Certificate?', description: `"${cert.title}" will be removed.`, variant: 'danger', onConfirm: () => router.delete(`/admin/certificates/${cert.id}`, { onSuccess: () => toast.success('Deleted') }) });
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Move up/down buttons */}
                                <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7 bg-white/90 hover:bg-white text-neutral-700 shadow-lg disabled:opacity-30"
                                        disabled={index === 0}
                                        onClick={(e) => { e.stopPropagation(); moveCert(cert.id, 'up'); }}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7 bg-white/90 hover:bg-white text-neutral-700 shadow-lg disabled:opacity-30"
                                        disabled={index === filteredCertificates.length - 1}
                                        onClick={(e) => { e.stopPropagation(); moveCert(cert.id, 'down'); }}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2 leading-tight">{cert.title}</h3>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{cert.issuer}</p>
                                    {cert.show_in_cv && (
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">In CV</Badge>
                                    )}
                                </div>

                                {cert.skills && cert.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {cert.skills.slice(0, 3).map((skill, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                                                {skill}
                                            </Badge>
                                        ))}
                                        {cert.skills.length > 3 && (
                                            <Badge variant="secondary" className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                                                +{cert.skills.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {cert.categories && cert.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {cert.categories.map((cat) => (
                                            <Badge key={cat.id} variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 font-medium truncate max-w-[120px]">
                                                {cat.name_id}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                {cert.credentialTypes && cert.credentialTypes.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {cert.credentialTypes.map((type) => (
                                            <Badge key={type.id} variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-medium truncate max-w-[120px]">
                                                {type.name_id}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <span>
                                        {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No date'}
                                    </span>
                                    {cert.credential_url && (
                                        <a href={cert.credential_url} target="_blank" rel="noopener" className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                                            Verify <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* ─── Fullscreen Image Viewer ─── */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        onClick={() => setFullscreenImage(null)}
                        className="absolute top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Certificate fullscreen view"
                        className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </AppLayout>
    );
}
