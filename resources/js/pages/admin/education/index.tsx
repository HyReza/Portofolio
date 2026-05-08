import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useRef } from 'react';
import { Plus, Trash2, GraduationCap, GitBranch, Calendar, Building2, BookOpen, Upload, X, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { toast } from 'sonner';

interface Education {
    id: number;
    institution: string;
    institution_en: string | null;
    degree: string | null;
    degree_en: string | null;
    field: string | null;
    field_en: string | null;
    gpa: string | null;
    start_date: string;
    end_date: string | null;
    description_id: string | null;
    description_en: string | null;
    activities_id: string | null;
    activities_en: string | null;
    logo: string | null;
    type: 'formal' | 'informal';
    sort_order: number;
}

interface Props {
    educations: Education[];
}

export default function EducationIndex({ educations }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        institution: '',
        institution_en: '',
        degree: '',
        degree_en: '',
        field: '',
        field_en: '',
        gpa: '',
        start_date: '',
        end_date: '',
        description_id: '',
        description_en: '',
        activities_id: '',
        activities_en: '',
        logo: null as File | null,
        type: 'formal' as 'formal' | 'informal',
        sort_order: 0,
    });

    const handleEdit = (edu: Education) => {
        setEditingId(edu.id);
        form.setData({
            institution: edu.institution,
            institution_en: edu.institution_en || '',
            degree: edu.degree || '',
            degree_en: edu.degree_en || '',
            field: edu.field || '',
            field_en: edu.field_en || '',
            gpa: edu.gpa || '',
            start_date: edu.start_date ? edu.start_date.split('T')[0] : '',
            end_date: edu.end_date ? edu.end_date.split('T')[0] : '',
            description_id: edu.description_id || '',
            description_en: edu.description_en || '',
            activities_id: edu.activities_id || '',
            activities_en: edu.activities_en || '',
            logo: null,
            type: edu.type || 'formal',
            sort_order: edu.sort_order || 0,
        });
        setLogoPreview(edu.logo ? `/storage/${edu.logo}` : null);
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(form.data).forEach(([key, value]) => {
            if (key === 'logo') {
                if (value instanceof File) formData.append('logo', value);
            } else {
                formData.append(key, String(value ?? ''));
            }
        });

        if (editingId) {
            formData.append('_method', 'PUT');
            router.post(`/admin/education/${editingId}`, formData, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); setLogoPreview(null); toast.success('Education updated!'); },
                onError: (errors) => { toast.error(Object.values(errors)[0] || 'An error occurred while saving.'); },
            });
        } else {
            router.post('/admin/education', formData, {
                onSuccess: () => { setDialogOpen(false); form.reset(); setLogoPreview(null); toast.success('Education added!'); },
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

    const formalEdu = educations.filter(e => e.type === 'formal');
    const informalEdu = educations.filter(e => e.type === 'informal');

    const openNew = () => {
        setEditingId(null);
        form.reset();
        setLogoPreview(null);
        setDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Education', href: '/admin/education' }]}>
            <Head title="Manage Education" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Education Path</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your formal schooling and informal bootcamps/courses.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); setLogoPreview(null); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Journey</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Education' : 'Add New Education'}</DialogTitle>
                                <DialogDescription>Fill in the details of your educational journey. All bilingual fields support auto-translate.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                {/* Logo Upload */}
                                <div className="space-y-2">
                                    <Label>Institution Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${logoPreview ? 'border-indigo-300' : 'border-neutral-300 dark:border-neutral-700'}`}>
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-neutral-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="h-9 cursor-pointer" />
                                            <p className="text-[11px] text-neutral-400">Max 2MB. PNG/JPG/WebP recommended.</p>
                                        </div>
                                        {logoPreview && (
                                            <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => { setLogoPreview(null); form.setData('logo', null); if (logoInputRef.current) logoInputRef.current.value = ''; }}>
                                                <X size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Type + Institution */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Education Type</Label>
                                        <Select value={form.data.type} onValueChange={(v: any) => form.setData('type', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="formal">Formal (School/University)</SelectItem>
                                                <SelectItem value="informal">Informal (Bootcamp/Course)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>GPA / IPK</Label>
                                        <Input value={form.data.gpa} onChange={(e) => form.setData('gpa', e.target.value)} placeholder="e.g. 3.85/4.00 or A" />
                                    </div>
                                </div>

                                {/* Institution Bilingual */}
                                <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <Label className="text-sm font-semibold">Institution Name</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bahasa Indonesia</span>
                                            <Input value={form.data.institution} onChange={(e) => form.setData('institution', e.target.value)} required placeholder="e.g. Universitas Indonesia" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">English</span>
                                                <AutoTranslateButton sourceText={form.data.institution} onTranslate={(t) => form.setData('institution_en', t)} />
                                            </div>
                                            <Input value={form.data.institution_en} onChange={(e) => form.setData('institution_en', e.target.value)} placeholder="e.g. University of Indonesia" />
                                        </div>
                                    </div>
                                </div>

                                {/* Degree Bilingual */}
                                <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <Label className="text-sm font-semibold">Degree / Certificate</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bahasa Indonesia</span>
                                            <Input value={form.data.degree} onChange={(e) => form.setData('degree', e.target.value)} placeholder="e.g. Sarjana / Nanodegree" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">English</span>
                                                <AutoTranslateButton sourceText={form.data.degree} onTranslate={(t) => form.setData('degree_en', t)} />
                                            </div>
                                            <Input value={form.data.degree_en} onChange={(e) => form.setData('degree_en', e.target.value)} placeholder="e.g. Bachelor / Nanodegree" />
                                        </div>
                                    </div>
                                </div>

                                {/* Field of Study Bilingual */}
                                <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <Label className="text-sm font-semibold">Field of Study</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bahasa Indonesia</span>
                                            <Input value={form.data.field} onChange={(e) => form.setData('field', e.target.value)} placeholder="e.g. Ilmu Komputer" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">English</span>
                                                <AutoTranslateButton sourceText={form.data.field} onTranslate={(t) => form.setData('field_en', t)} />
                                            </div>
                                            <Input value={form.data.field_en} onChange={(e) => form.setData('field_en', e.target.value)} placeholder="e.g. Computer Science" />
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
                                        <Input type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} />
                                    </div>
                                </div>

                                {/* Description Bilingual */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Description (ID)</Label>
                                        <textarea className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_id} onChange={(e) => form.setData('description_id', e.target.value)} placeholder="Ceritakan detail pendidikan Anda..." />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Description (EN)</Label>
                                            <AutoTranslateButton sourceText={form.data.description_id} onTranslate={(t) => form.setData('description_en', t)} />
                                        </div>
                                        <textarea className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description_en} onChange={(e) => form.setData('description_en', e.target.value)} placeholder="Auto-translate or type English version..." />
                                    </div>
                                </div>

                                {/* Activities Bilingual */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Activities / Kegiatan (ID)</Label>
                                        <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.activities_id} onChange={(e) => form.setData('activities_id', e.target.value)} placeholder="e.g. Asisten Lab, Ketua BEM, Lomba..." />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Activities (EN)</Label>
                                            <AutoTranslateButton sourceText={form.data.activities_id} onTranslate={(t) => form.setData('activities_en', t)} />
                                        </div>
                                        <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.activities_en} onChange={(e) => form.setData('activities_en', e.target.value)} placeholder="e.g. Lab Assistant, Student Council, Competition..." />
                                    </div>
                                </div>

                                <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {form.processing ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Entry')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-8">
                    {/* Formal Section */}
                    <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Formal Education</CardTitle>
                            </div>
                            <CardDescription>Academic schools, colleges, and universities.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {formalEdu.length === 0 ? (
                                <p className="text-muted-foreground py-10 text-center text-sm">No formal education entries yet.</p>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {formalEdu.map((edu) => <EducationRow key={edu.id} edu={edu} onEdit={handleEdit} />)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Informal Section */}
                    <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5 text-emerald-500" />
                                <CardTitle className="text-lg">Informal & Bootcamps</CardTitle>
                            </div>
                            <CardDescription>Courses, workshops, and intensive training programs.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {informalEdu.length === 0 ? (
                                <p className="text-muted-foreground py-10 text-center text-sm">No informal education entries yet.</p>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {informalEdu.map((edu) => <EducationRow key={edu.id} edu={edu} onEdit={handleEdit} />)}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function EducationRow({ edu, onEdit }: { edu: Education, onEdit: (e: Education) => void }) {
    const formatDate = (d: string) => {
        if (!d) return 'Present';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="group flex items-start justify-between p-6 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
            <div className="flex gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    {edu.logo ? (
                        <img src={`/storage/${edu.logo}`} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                        <Building2 size={22} />
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">{edu.institution}</h3>
                    {edu.institution_en && <p className="text-xs text-neutral-400">{edu.institution_en}</p>}
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        {edu.degree}{edu.field && ` — ${edu.field}`}
                    </p>
                    <div className="flex items-center gap-4 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Calendar size={12} />
                            {formatDate(edu.start_date)} — {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                        </span>
                        {edu.gpa && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <Award size={12} />
                                GPA: {edu.gpa}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="outline" onClick={() => onEdit(edu)}>Edit</Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm('Are you sure you want to delete this educational record?')) {
                        router.delete(`/admin/education/${edu.id}`);
                    }
                }}>
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    );
}
