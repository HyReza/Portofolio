import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, GripVertical, Code2, Layers, Brain, Zap, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { toast } from 'sonner';
import { ReactIconRender } from '@/components/ReactIconRender';

interface Skill {
    id: number;
    name_id: string;
    name_en: string;
    description_id?: string | null;
    description_en?: string | null;
    icon: string | null;
    sort_order: number;
}

interface Category {
    id: number;
    name_id: string;
    name_en: string;
    icon: string | null;
    sort_order: number;
    skills: Skill[];
}

interface Props {
    categories: Category[];
}

export default function SkillsIndex({ categories }: Props) {
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [skillDialogOpen, setSkillDialogOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);

    const catForm = useForm({
        name_id: '',
        name_en: '',
        icon: '',
        sort_order: 0
    });

    const skillForm = useForm({
        skill_category_id: 0,
        name_id: '',
        name_en: '',
        description_id: '',
        description_en: '',
        icon: '',
        proficiency: 100,
        sort_order: 0
    });

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        catForm.post('/admin/skills/categories', {
            onSuccess: () => { setCatDialogOpen(false); catForm.reset(); toast.success('Category created!'); },
        });
    };

    const handleCreateSkill = (e: React.FormEvent) => {
        e.preventDefault();
        skillForm.post('/admin/skills', {
            onSuccess: () => { setSkillDialogOpen(false); skillForm.reset(); toast.success('Skill added!'); },
        });
    };

    const openAddSkill = (categoryId: number) => {
        skillForm.setData('skill_category_id', categoryId);
        setSkillDialogOpen(true);
    };

    const handleAutoDetectIcon = () => {
        if (!skillForm.data.name_en) {
            toast.error('Please enter the Skill Name (EN) first.');
            return;
        }
        
        const name = skillForm.data.name_en.toLowerCase().replace(/[^a-z0-9]/g, '');
        const map: Record<string, string> = {
            'nodejs': 'SiNodedotjs', 'reactjs': 'SiReact', 'react': 'SiReact', 
            'vuejs': 'SiVuedotjs', 'vue': 'SiVuedotjs', 'nextjs': 'SiNextdotjs', 
            'tailwind': 'SiTailwindcss', 'tailwindcss': 'SiTailwindcss', 
            'laravel': 'SiLaravel', 'php': 'SiPhp', 'javascript': 'SiJavascript', 
            'typescript': 'SiTypescript', 'html': 'SiHtml5', 'css': 'SiCss3', 
            'mysql': 'SiMysql', 'postgresql': 'SiPostgresql', 'docker': 'SiDocker', 
            'git': 'SiGit', 'github': 'SiGithub', 'figma': 'SiFigma', 
            'python': 'SiPython', 'go': 'SiGo', 'golang': 'SiGo', 
            'aws': 'SiAmazonwebservices', 'communication': 'FaComments', 
            'problem': 'FaLightbulb', 'problemsolving': 'FaLightbulb', 
            'leadership': 'FaUsers', 'teamwork': 'FaHandsHelping', 
            'time': 'FaClock', 'timemanagement': 'FaClock', 
            'analysis': 'FaChartLine', 'analytical': 'FaChartLine', 
            'creativity': 'FaPaintBrush', 'creative': 'FaPaintBrush'
        };

        if (map[name]) {
            skillForm.setData('icon', map[name]);
            toast.success(`Auto-detected icon: ${map[name]}`);
        } else if (name.length > 0) {
            const guess = 'Si' + name.charAt(0).toUpperCase() + name.slice(1);
            skillForm.setData('icon', guess);
            toast.success(`Guessed icon: ${guess}`);
        }
    };

    return (
        <>
            <Head title="Manage Skills" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Skills & Tech Stack</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Categorize and showcase your professional expertise.</p>
                    </div>
                    <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />New Category</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Skill Category</DialogTitle>
                                <DialogDescription>Group related skills together (e.g. Frontend, Backend).</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCategory} className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Category Name (ID)</Label>
                                        <Input value={catForm.data.name_id} onChange={(e) => catForm.setData('name_id', e.target.value)} required placeholder="e.g. Pengembangan Frontend" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Category Name (EN)</Label>
                                            <AutoTranslateButton sourceText={catForm.data.name_id} onTranslate={(t) => catForm.setData('name_en', t)} />
                                        </div>
                                        <Input value={catForm.data.name_en} onChange={(e) => catForm.setData('name_en', e.target.value)} required placeholder="e.g. Frontend Development" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Icon Name (Lucide)</Label>
                                    <Input value={catForm.data.icon} onChange={(e) => catForm.setData('icon', e.target.value)} placeholder="Code, Zap, Layers, etc." />
                                </div>
                                <Button type="submit" disabled={catForm.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">Create Category</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-6">
                    {categories.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-20 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
                                    <Code2 size={24} />
                                </div>
                                <p className="text-muted-foreground">No categories yet. Build your stack!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        categories.map((category) => (
                            <Card key={category.id} className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                                <CardHeader className="flex flex-row items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700 text-indigo-500">
                                            <Layers size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                {category.icon && <ReactIconRender name={category.icon} className="h-5 w-5 text-indigo-500" />}
                                                {category.name_en}
                                            </CardTitle>
                                            <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">{category.name_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openAddSkill(category.id)}>
                                            <Plus className="mr-1 h-3 w-3" />Add Skill
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                            if (confirm('Delete this category and all its skills?')) {
                                                router.delete(`/admin/skills/categories/${category.id}`);
                                            }
                                        }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {category.skills.length === 0 ? (
                                        <p className="text-muted-foreground text-xs italic">No skills added to this category.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {category.skills.map((skill) => (
                                                <Badge 
                                                    key={skill.id} 
                                                    variant="secondary" 
                                                    className="group flex items-center gap-2 pl-3 pr-1 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all"
                                                >
                                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                        {skill.icon && <ReactIconRender name={skill.icon} className="h-3.5 w-3.5 opacity-70" />}
                                                        {skill.name_en || skill.name_id}
                                                    </span>
                                                    <button 
                                                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:bg-destructive hover:text-white transition-colors"
                                                        onClick={() => { if (confirm('Delete skill?')) router.delete(`/admin/skills/${skill.id}`); }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Skill</DialogTitle>
                            <DialogDescription>Add a specific tool or technology to this category.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSkill} className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Skill Name (ID)</Label>
                                    <Input value={skillForm.data.name_id} onChange={(e) => skillForm.setData('name_id', e.target.value)} required placeholder="e.g. Pemecahan Masalah, Tailwind CSS" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Skill Name (EN)</Label>
                                        <AutoTranslateButton sourceText={skillForm.data.name_id} onTranslate={(t) => skillForm.setData('name_en', t)} />
                                    </div>
                                    <Input value={skillForm.data.name_en} onChange={(e) => skillForm.setData('name_en', e.target.value)} required placeholder="e.g. Problem Solving, Tailwind CSS" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (ID) - Optional</Label>
                                    <textarea 
                                        value={skillForm.data.description_id || ''} 
                                        onChange={(e) => skillForm.setData('description_id', e.target.value)} 
                                        className="flex min-h-[60px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                                        placeholder="Deskripsi singkat tentang keahlian ini (berguna untuk Soft Skills)..." 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Description (EN) - Optional</Label>
                                        <AutoTranslateButton sourceText={skillForm.data.description_id} onTranslate={(t) => skillForm.setData('description_en', t)} />
                                    </div>
                                    <textarea 
                                        value={skillForm.data.description_en || ''} 
                                        onChange={(e) => skillForm.setData('description_en', e.target.value)} 
                                        className="flex min-h-[60px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                                        placeholder="Short description of this skill..." 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Icon Name (React Icons)</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleAutoDetectIcon} className="h-6 text-xs px-2 text-indigo-500 hover:text-indigo-600">
                                            <Wand2 className="mr-1 h-3 w-3" /> Auto-detect
                                        </Button>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                                            <ReactIconRender name={skillForm.data.icon} className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <Input value={skillForm.data.icon} onChange={(e) => skillForm.setData('icon', e.target.value)} placeholder="e.g. FaReact, SiTailwindcss" />
                                            <p className="mt-1 text-xs text-muted-foreground">Search icons at <a href="https://react-icons.github.io/react-icons/" target="_blank" className="text-indigo-500 hover:underline">react-icons</a>.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" disabled={skillForm.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">Add Skill</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
