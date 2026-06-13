import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Brain, Wand2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { ReactIconRender } from '@/components/ReactIconRender';

interface SoftSkill {
    id: number;
    name_id: string;
    name_en: string;
    description_id: string | null;
    description_en: string | null;
    icon: string | null;
    sort_order: number;
    show_in_cv: boolean;
}

interface Props {
    softSkills: SoftSkill[];
}

export default function SoftSkillsIndex({ softSkills }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<SoftSkill | null>(null);

    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();

    const form = useForm({
        name_id: '',
        name_en: '',
        description_id: '',
        description_en: '',
        icon: '',
        icon_file: null as File | null,
        sort_order: 0,
        show_in_cv: true,
    });

    const openNew = () => {
        setEditing(null);
        form.setData({
            name_id: '', name_en: '', description_id: '', description_en: '',
            icon: '', icon_file: null, sort_order: softSkills.length, show_in_cv: true,
        });
        setDialogOpen(true);
    };

    const openEdit = (skill: SoftSkill) => {
        setEditing(skill);
        form.setData({
            name_id: skill.name_id,
            name_en: skill.name_en,
            description_id: skill.description_id || '',
            description_en: skill.description_en || '',
            icon: skill.icon || '',
            icon_file: null,
            sort_order: skill.sort_order,
            show_in_cv: skill.show_in_cv,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/soft-skills/${editing.id}`, {
                onSuccess: () => { setDialogOpen(false); setEditing(null); form.reset(); toast.success('Soft skill updated!'); },
                onError: (errors) => toast.error(Object.values(errors)[0] as string || 'Error'),
            });
        } else {
            form.post('/admin/soft-skills', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Soft skill created!'); },
                onError: (errors) => toast.error(Object.values(errors)[0] as string || 'Error'),
            });
        }
    };

    const handleDelete = (skill: SoftSkill) => {
        confirm({
            title: 'Delete Soft Skill?',
            description: `"${skill.name_en}" will be permanently removed.`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: () => {
                router.delete(`/admin/soft-skills/${skill.id}`, {
                    onSuccess: () => toast.success('Soft skill deleted'),
                });
            },
        });
    };

    const handleAutoDetectIcon = () => {
        if (!form.data.name_en && !form.data.name_id) {
            toast.error('Please enter the name first.');
            return;
        }
        
        const name = (form.data.name_en + ' ' + form.data.name_id).toLowerCase();
        let detected = '';

        if (name.match(/speak|communicat|talk|present|bicar|komunikas/)) detected = 'FaComments';
        else if (name.match(/lead|manag|direct|pimpin|ketua/)) detected = 'FaUserTie';
        else if (name.match(/team|collaborat|cooperat|kerja|kolaborasi/)) detected = 'FaHandsHelping';
        else if (name.match(/problem|solv|resol|masalah|solusi/)) detected = 'FaLightbulb';
        else if (name.match(/time|punctual|waktu/)) detected = 'FaClock';
        else if (name.match(/analy|data|research|analis/)) detected = 'FaChartLine';
        else if (name.match(/creativ|innovat|design|kreatif|inovas/)) detected = 'FaPaintBrush';
        else if (name.match(/adapt|flexib|agil|adaptasi|fleksibel/)) detected = 'FaSyncAlt';
        else if (name.match(/critic|think|logic|kritis|pikir/)) detected = 'FaBrain';
        else if (name.match(/organiz|plan|struktur|organisas/)) detected = 'FaTasks';
        else if (name.match(/negotiat|deal|negosias/)) detected = 'FaHandshake';
        else if (name.match(/empath|sympath|emotion|empati|emosi/)) detected = 'FaHeart';
        else if (name.match(/decision|decid|keputus/)) detected = 'FaBalanceScale';
        else if (name.match(/detail|attent|teliti/)) detected = 'FaSearch';
        else if (name.match(/motivat|drive|motivasi/)) detected = 'FaRocket';
        else if (name.match(/patien|sabar/)) detected = 'FaHourglass';
        else if (name.match(/stress|resilien|pressure|tahan|stres/)) detected = 'FaShieldAlt';
        else if (name.match(/learn|study|belajar/)) detected = 'FaBookOpen';
        else if (name.match(/ethic|moral|etik/)) detected = 'FaBalanceScaleRight';
        else if (name.match(/conflict|resol|konflik/)) detected = 'FaDove';

        if (detected) {
            form.setData('icon', detected);
            toast.success(`Auto-detected icon: ${detected}`);
        } else {
            toast.info('Could not auto-detect icon. Try setting it manually.');
        }
    };

    // Color palette for soft skill cards
    const colors = [
        { bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20', text: 'text-violet-500', darkBg: 'dark:from-violet-500/5 dark:to-purple-500/5' },
        { bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-500/20', text: 'text-pink-500', darkBg: 'dark:from-pink-500/5 dark:to-rose-500/5' },
        { bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', text: 'text-amber-500', darkBg: 'dark:from-amber-500/5 dark:to-orange-500/5' },
        { bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', darkBg: 'dark:from-emerald-500/5 dark:to-teal-500/5' },
        { bg: 'from-sky-500/10 to-cyan-500/10', border: 'border-sky-500/20', text: 'text-sky-500', darkBg: 'dark:from-sky-500/5 dark:to-cyan-500/5' },
        { bg: 'from-indigo-500/10 to-blue-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500', darkBg: 'dark:from-indigo-500/5 dark:to-blue-500/5' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Soft Skills', href: '/admin/soft-skills' }]}>
            <Head title="Manage Soft Skills" />
            <ConfirmDialog {...dialogProps} />

            <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-8 pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Soft Skills</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Manage your non-technical, interpersonal skills.</p>
                    </div>
                    <Button className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto" onClick={openNew}>
                        <Plus className="mr-2 h-4 w-4" />New Soft Skill
                    </Button>
                </div>

                {/* Skills Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {softSkills.length === 0 ? (
                        <Card className="col-span-full border-dashed">
                            <CardContent className="py-16 sm:py-20 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-500 mb-4">
                                    <Brain size={24} />
                                </div>
                                <p className="text-muted-foreground text-sm">No soft skills yet. Start adding your interpersonal strengths!</p>
                            </CardContent>
                        </Card>
                    ) : softSkills.map((skill, index) => {
                        const color = colors[index % colors.length];
                        return (
                            <Card
                                key={skill.id}
                                className={`group overflow-hidden border ${color.border} shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer dark:bg-[#121212]`}
                                onClick={() => openEdit(skill)}
                            >
                                <CardContent className="p-0">
                                    <div className={`bg-gradient-to-br ${color.bg} ${color.darkBg} p-5`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-sm ${color.text}`}>
                                                {skill.icon ? (
                                                    <ReactIconRender name={skill.icon} className="h-5 w-5" />
                                                ) : (
                                                    <Brain className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {skill.show_in_cv ? (
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                                                        <Eye className="h-3 w-3 mr-1" />CV
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-neutral-400 border-neutral-200 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700">
                                                        <EyeOff className="h-3 w-3 mr-1" />Hidden
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-base text-neutral-900 dark:text-white line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                            {skill.name_en}
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold mt-0.5">
                                            {skill.name_id}
                                        </p>
                                    </div>
                                    <div className="p-5 pt-3 space-y-3">
                                        {(skill.description_en || skill.description_id) && (
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                                {skill.description_en || skill.description_id}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                #{index + 1}
                                            </span>
                                            <div className="flex gap-1.5">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-neutral-400 hover:text-violet-600"
                                                    onClick={(e) => { e.stopPropagation(); openEdit(skill); }}
                                                >
                                                    <Edit2 size={13} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-neutral-400 hover:text-destructive"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(skill); }}
                                                >
                                                    <Trash2 size={13} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ── Dialog (Create/Edit) ── */}
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); form.reset(); } }}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Soft Skill' : 'Add Soft Skill'}</DialogTitle>
                            <DialogDescription>Define a non-technical or interpersonal skill.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex h-7 items-center">
                                        <Label>Name (ID) *</Label>
                                    </div>
                                    <Input value={form.data.name_id} onChange={(e) => form.setData('name_id', e.target.value)} required placeholder="e.g. Kemampuan Analisis" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex h-7 items-center justify-between">
                                        <Label>Name (EN) *</Label>
                                        <AutoTranslateButton sourceText={form.data.name_id} onTranslate={(t) => form.setData('name_en', t)} />
                                    </div>
                                    <Input value={form.data.name_en} onChange={(e) => form.setData('name_en', e.target.value)} required placeholder="e.g. Analytical Skills" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description (ID)</Label>
                                <textarea
                                    value={form.data.description_id}
                                    onChange={(e) => form.setData('description_id', e.target.value)}
                                    className="flex min-h-[70px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-y"
                                    placeholder="Deskripsi singkat kemampuan ini..."
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Description (EN)</Label>
                                    <AutoTranslateButton sourceText={form.data.description_id} onTranslate={(t) => form.setData('description_en', t)} />
                                </div>
                                <textarea
                                    value={form.data.description_en}
                                    onChange={(e) => form.setData('description_en', e.target.value)}
                                    className="flex min-h-[70px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-y"
                                    placeholder="Brief description of this skill..."
                                />
                            </div>

                            {/* Icon */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Icon (React Icons) or Upload</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleAutoDetectIcon} className="h-6 text-xs px-2 text-violet-500 hover:text-violet-600">
                                        <Wand2 className="mr-1 h-3 w-3" />Auto-detect
                                    </Button>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 text-violet-500">
                                        {form.data.icon_file ? (
                                            <img src={URL.createObjectURL(form.data.icon_file)} className="h-6 w-6 object-contain" alt="preview" />
                                        ) : (
                                            <ReactIconRender name={form.data.icon} className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <Input value={form.data.icon} onChange={(e) => form.setData('icon', e.target.value)} placeholder="e.g. FaComments, FaLightbulb" disabled={!!form.data.icon_file} />
                                            <p className="mt-1 text-xs text-muted-foreground">Search at <a href="https://react-icons.github.io/react-icons/" target="_blank" className="text-violet-500 hover:underline">react-icons</a>.</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Or upload image:</p>
                                            <Input type="file" accept="image/*" className="h-9" onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    form.setData('icon_file', e.target.files[0]);
                                                } else {
                                                    form.setData('icon_file', null);
                                                }
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Show in CV */}
                            <div className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/30">
                                <Checkbox
                                    id="show_in_cv"
                                    checked={form.data.show_in_cv}
                                    onCheckedChange={(checked) => form.setData('show_in_cv', checked === true)}
                                />
                                <div className="grid gap-1 leading-none">
                                    <label htmlFor="show_in_cv" className="text-sm font-medium leading-none cursor-pointer">
                                        Show in CV
                                    </label>
                                    <p className="text-[11px] text-neutral-500">Include in the downloadable CV PDF.</p>
                                </div>
                            </div>

                            <Button type="submit" disabled={form.processing} className="w-full bg-violet-600 hover:bg-violet-700">
                                {form.processing ? 'Saving...' : (editing ? 'Update Soft Skill' : 'Add Soft Skill')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
