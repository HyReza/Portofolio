import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, GraduationCap, GitBranch, Calendar, Building2, BookOpen, Search, Wand2 } from 'lucide-react';
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
    degree: string | null;
    field: string | null;
    start_date: string;
    end_date: string | null;
    description_id: string | null;
    description_en: string | null;
    type: 'formal' | 'informal';
    sort_order: number;
}

interface Props {
    educations: Education[];
}

export default function EducationIndex({ educations }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        institution: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
        description_id: '',
        description_en: '',
        type: 'formal' as 'formal' | 'informal',
        sort_order: 0,
    });

    const handleEdit = (edu: Education) => {
        setEditingId(edu.id);
        form.setData({
            institution: edu.institution,
            degree: edu.degree || '',
            field: edu.field || '',
            start_date: edu.start_date ? edu.start_date.split('T')[0] : '',
            end_date: edu.end_date ? edu.end_date.split('T')[0] : '',
            description_id: edu.description_id || '',
            description_en: edu.description_en || '',
            type: edu.type || 'formal',
            sort_order: edu.sort_order || 0,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(`/admin/education/${editingId}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Education updated!'); },
            });
        } else {
            form.post('/admin/education', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Education added!'); },
            });
        }
    };

    const formalEdu = educations.filter(e => e.type === 'formal');
    const informalEdu = educations.filter(e => e.type === 'informal');

    return (
        <>
            <Head title="Manage Education" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Education Path</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your formal schooling and informal bootcamps/courses.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />Add Journey</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Education' : 'Add New Education'}</DialogTitle>
                                <DialogDescription>Fill in the details of your educational journey.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Education Type</Label>
                                        <Select value={form.data.type} onValueChange={(v: any) => form.setData('type', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="formal">Formal (School/Univ)</SelectItem>
                                                <SelectItem value="informal">Informal (Bootcamp/Course)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Institution / Provider</Label>
                                        <Input value={form.data.institution} onChange={(e) => form.setData('institution', e.target.value)} required placeholder="e.g. University of Indonesia / Dicoding" />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Degree / Certificate</Label>
                                        <Input value={form.data.degree} onChange={(e) => form.setData('degree', e.target.value)} placeholder="e.g. Bachelor / Nanodegree" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Field of Study</Label>
                                        <Input value={form.data.field} onChange={(e) => form.setData('field', e.target.value)} placeholder="e.g. Computer Science" />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date (Optional)</Label>
                                        <Input type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} placeholder="Leave blank if currently studying" />
                                    </div>
                                </div>

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
        </>
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
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    <Building2 size={20} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">{edu.institution}</h3>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        {edu.degree}{edu.field && ` — ${edu.field}`}
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Calendar size={12} />
                            {formatDate(edu.start_date)} — {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                        </span>
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
